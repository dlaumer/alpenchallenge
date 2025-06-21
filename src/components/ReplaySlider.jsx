// ReplaySlider.jsx
import React, { useEffect, useState, useRef } from "react";
import styled, {keyframes, css} from "styled-components";
import mapStore from "../store/mapStore";
import { Play, Pause, RotateCcw, RotateCw, Loader } from "lucide-react";
import riderStore from "../store/riderStore";
import { observer } from "mobx-react-lite";

const Container = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #e0e6ed;
  padding: 10px 15px;
  border-radius: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  font-family: sans-serif;
  font-size: 14px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 800px;
  z-index: 150;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 768px) {
    margin-bottom: 10px;
  }
`;

const SliderRow = styled.div`
  flex: 1;
  width: 100%;
`;
const LiveTag = styled.div`
  display: flex;
  align-items: center;
  margin-right: 10px;
  color: ${props => (props.$replay ? "#666" : "red")};
  font-weight: bold;
  cursor: ${props => (props.$disabled ? "default" : "pointer")};
  pointer-events: ${props => (props.$disabled ? "none" : "auto")};
`;

const expandPulse = keyframes`
  0% { transform: scale(1); }
  30% { transform: scale(1.3); }
  100% { transform: scale(1); }
`;
const LiveDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
  background-color: ${props => (props.$replay ? "#666" : "red")};
    ${props =>
    !props.$replay &&
    css`
      animation: ${expandPulse} 1.2s ease-in-out infinite;
    `}
`;
const Time = styled.div`
  font-variant-numeric: tabular-nums;
  margin-right: 10px;
  min-width: 80px;
`;

const Button = styled.button`
  margin: 0 5px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #333;
  padding: 4px;

  &:hover:enabled {
    opacity: 0.8;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SpeedSelector = styled.select`
  margin-left: 10px;
  padding: 4px 10px;
  font-size: 14px;
  border: none;
  outline: none;
  border-radius: 6px;
  background-color: #d3dbe5;
  color: #222;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-family: inherit;
  height: 32px;
  appearance: none;

  &:hover {
    background-color: #c3cbd5;
  }

  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 8px;
    align-self: center;
  }

  option {
    background: #f1f4f8;
    color: #222;
  }
`;

const SliderWrapper = styled.div`
  flex: 1;
  height: 8px;
  background: #ccc;
  border-radius: 4px;
  margin-left: 15px;
  margin-right: 5px;
  position: relative;
  cursor: ${props => (props.disabled ? "not-allowed" : "pointer")};
  pointer-events: ${props => (props.disabled ? "none" : "auto")};
`;

const SliderProgress = styled.div.attrs(props => ({
  style: {
    width: `${props.$progress}%`,
    transition: props.$isDownloading ? "width 0.3s ease" : "none",
  },
}))`
  height: 100%;
  background: darkred;
  border-radius: 4px;
    cursor: pointer;

`;

const SliderHandle = styled.div.attrs(props => ({
  style: {
    left: `${props.$progress}%`,
  },
}))`
  width: 14px;
  height: 14px;
  background: white;
  border: 2px solid darkred;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
    cursor: pointer;
`;


const BufferingTag = styled.div`
  display: flex;
  align-items: center;
  margin-right: 10px;
  color: #666;
  font-weight: bold;
`;

const SpinnerIcon = styled(Loader)`
  margin-right: 6px;
  animation: spin 1.2s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ReplaySlider = observer(() => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  let [startTs, endTs] = riderStore.getReplayTimeRange();
  const formatTime = ms => {
    const d = new Date(ms);
    return d.toLocaleString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const togglePlay = () => {
    mapStore.togglePlaying();
    mapStore.setReplayMode(true);
    if (!mapStore.playing) {
      mapStore.setElapsedPlaying(Date.now() - mapStore.timeReferenceAnimation);
    } else {
      mapStore.setTimeReferenceAnimation(Date.now() - mapStore.elapsedPlaying);
    }
  };

  const setLive = () => {
    if (mapStore.replayType != 'post-event') {
      mapStore.setReplayMode(false);
      mapStore.setReplaySpeed(1);
    }
  };

  const isDownloading = riderStore.downloadProgress != null;
  const downloadPct = isDownloading
    ? Math.max(0, Math.min(1, riderStore.downloadProgress)) * 100
    : 0;

  const getReplayPct = () => {
    if (!mapStore.time) return 0;
    if (mapStore.replayMode) {
      // compute effective “end” as the earlier of event-endTs or liveCutoff
      const liveCutoff = Date.now() - mapStore.lag;
      const currentMax = Math.min(endTs, liveCutoff);
      const elapsed = mapStore.time - startTs;
      const duration = currentMax - startTs;
      let pct = (elapsed / duration) * 100;
      pct = Math.min(Math.max(pct, 0), 100);
      if (pct == 100) {
        // if this is a live “event” replay, drop back to live;
        // for post-event we just clamp and stay in replay.
        if (mapStore.replayType === 'event') {
          setLive();
        }
      }
      return pct;
    }
    return 100;
  };

  // barProgress fills by downloadPct during download, else by replay
  const barProgress = isDownloading ? downloadPct : getReplayPct();
  // handle stays at end (100%) when downloading, else follows replay
  const handlePos = isDownloading ? 100 : getReplayPct();

  const jump = deltaMs => {
    if (!isDownloading) {
      mapStore.setPlaying(true);
      mapStore.setReplayMode(true);
      const newTime = Math.max(
        startTs,
        Math.min(endTs, mapStore.time + deltaMs)
      );
      mapStore.setTimeReference(newTime);
      mapStore.setTimeReferenceAnimation(Date.now());
      mapStore.setJumpTime(true);
    }
  };

  const seekTo = clientX => {
    if (!isDownloading) {
      mapStore.setPlaying(true);
      const rect = sliderRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );

      // use maxTs (liveCutoff) as the “end” of the slider
      const liveCutoff = Date.now() - mapStore.lag;
      const maxTs = Math.min(endTs, liveCutoff);
      let ts = startTs + pct * (maxTs - startTs);
      ts = Math.max(startTs, Math.min(ts, maxTs));
      // always enter replay and seek
      mapStore.setReplayMode(true);
      mapStore.setTimeReference(ts);
      mapStore.setTimeReferenceAnimation(Date.now());
      mapStore.setJumpTime(true);
      mapStore.setTime(ts);               // ← ADD THIS LINE


      // if they dragged right to 100% while playing…
      if (pct === 1) {
        if (mapStore.replayType === 'event') {
          // live‐event: switch back to live
          setLive();
        } else {
          // post‐event: just pause at the end
          mapStore.setPlaying(false);
        }
      }
    }
  };

  const handleMouseDown = e => {
    if (!isDownloading) {
      setIsDragging(true);
      document.body.style.userSelect = "none";
      seekTo(e.clientX);
    }
  };

  const handleMouseMove = e => {
    if (isDragging && !isDownloading) seekTo(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.userSelect = "auto";
  };

  const handleTouchStart = e => {
    if (!isDownloading) {
      setIsDragging(true);
      document.body.classList.add("no-select");
      seekTo(e.touches[0].clientX);
    }
  };

  const handleTouchMove = e => {
    if (isDragging && !isDownloading) seekTo(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    document.body.classList.remove("no-select");
  };

  useEffect(() => {
    if (isDragging && !isDownloading) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, isDownloading]);

  useEffect(() => {
    if (
      mapStore.replayMode &&
      mapStore.replayType === 'post-event' &&
      mapStore.time >= endTs
    ) {
      mapStore.setPlaying(false);
    }
  }, [mapStore.time]);

  return (
    <Container>
      <ControlsRow>
        {mapStore.replayMode ? (
          <LiveTag
            $replay={true}
            $disabled={mapStore.replayType === "post-event"}
            onClick={mapStore.replayType === "post-event" ? undefined : setLive}
          >
            <LiveDot $replay={true} />
            LIVE
          </LiveTag>
        ) : mapStore.buffering ? (
          <BufferingTag>
            <SpinnerIcon size={14} />
            Buffering
          </BufferingTag>
        ) : (
          <LiveTag
            $replay={false}
            // always clickable when live
            onClick={setLive}
          >
            <LiveDot $replay={false} />
            LIVE
          </LiveTag>
        )}

        <Time>{formatTime(mapStore.time)}</Time>

        <Button
          onClick={() => jump(-60000)}
          disabled={isDownloading}
          title="Back 1 min"
        >
          <RotateCcw size={18} />
        </Button>
        <Button
          onClick={togglePlay}
          disabled={isDownloading}
          title={mapStore.playing ? "Pause" : "Play"}
        >
          {mapStore.playing ? <Pause size={18} /> : <Play size={18} />}
        </Button>
        <Button
          onClick={() => jump(60000)}
          disabled={isDownloading}
          title="Forward 1 min"
        >
          <RotateCw size={18} />
        </Button>

        <SpeedSelector
          value={mapStore.replaySpeed}
          onChange={e => {
            if (!isDownloading) {
              mapStore.setReplaySpeed(Number(e.target.value));
              mapStore.setTimeReference(mapStore.time);
              mapStore.setTimeReferenceAnimation(Date.now());
            }
          }}
        >
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
          <option value={100}>100x</option>
        </SpeedSelector>
      </ControlsRow>

      <SliderRow>
        <SliderWrapper
          ref={sliderRef}
          disabled={isDownloading}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <SliderProgress $progress={barProgress} $isDownloading={isDownloading} />
          <SliderHandle $progress={handlePos} />
        </SliderWrapper>
      </SliderRow>
    </Container>
  );
});

export default ReplaySlider;