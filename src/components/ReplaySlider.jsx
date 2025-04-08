import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw
} from "lucide-react";
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
  color: ${(props) => (props.replay ? "#666" : "red")};
  font-weight: bold;
  cursor: pointer;
`;

const LiveDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
  background-color: ${(props) => (props.replay ? "#999" : "red")};
  animation: ${(props) => (props.replay ? "none" : "pulse 1.2s infinite ease-in-out")};

  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.6); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
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

  &:hover {
    opacity: 0.8;
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
  cursor: pointer;
`;

const SliderProgress = styled.div`
  height: 100%;
  background: darkred;
  border-radius: 4px;
  width: ${(props) => props.progress}%;
  pointer-events: none;
`;

const SliderHandle = styled.div`
  width: 14px;
  height: 14px;
  background: white;
  border: 2px solid darkred;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  left: ${(props) => props.progress}%;
  pointer-events: none;
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
  display: flex;
  align-items: center;
  -webkit-appearance: none;
  -moz-appearance: none;
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
    color: #222;
    background-color: #f1f4f8;
  }
`;



const ReplaySlider = observer(() => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const [elapsedPlaying, setElapsedPlaying] = useState(0);

  const [startTs, endTs] = riderStore.getReplayTimeRange();

  const formatTime = (ms) => {
    const d = new Date(ms);
    return d.toLocaleTimeString("en-GB");
  };

  const togglePlay = () => {
    mapStore.togglePlaying();
    mapStore.setReplayMode(true);

    if (mapStore.playing) {
      mapStore.setTimeReferenceAnimation(Date.now() - elapsedPlaying)
    }
    else {
      setElapsedPlaying(Date.now() - mapStore.timeReferenceAnimation)
    }
  }

  const setLive = () => {
    mapStore.setReplayMode(false)
    mapStore.setTimeReference(riderStore.currentSmallestTimestamp);
    mapStore.setTimeReferenceAnimation(Date.now());
  }

  const jump = (deltaMs) => {
    mapStore.setReplayMode(true);

    const newTime = Math.max(startTs, Math.min(endTs, mapStore.time + deltaMs))
    mapStore.setTimeReference(newTime)
    mapStore.setTimeReferenceAnimation(Date.now())
    mapStore.setTime(newTime)
  };

  const getProgress = () => {
    if (mapStore.time) {
      if (mapStore.replayMode) {
        return ((mapStore.time - startTs) / (riderStore.currentSmallestTimestamp - 60 * 60 * 1000 - startTs)) * 100; //TODO: Check why there is an hour difference sometimes
      }
      else {
        return 100;
      }
    }
  }

  const seekTo = (clientX) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ts = startTs + percent * (riderStore.currentSmallestTimestamp - 60 * 60 * 1000 - startTs);

    if (percent == 1) {
      setLive()
    }
    else {
      mapStore.setReplayMode(true);
      mapStore.setTimeReference(ts)
      mapStore.setTimeReferenceAnimation(Date.now())
      mapStore.setTime(ts);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    document.body.style.userSelect = "none"; // Disable text selection

    seekTo(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      seekTo(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.userSelect = "auto"; // Re-enable text selection

  };


  // Mobile Touch Handlers
  const handleTouchStart = (e) => {
    setIsDragging(true);
    document.body.classList.add("no-select");
    seekTo(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      seekTo(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    document.body.classList.remove("no-select");
  };


  useEffect(() => {
    if (isDragging) {
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
  }, [isDragging]);


  if (!startTs || !endTs || isNaN(startTs) || isNaN(endTs)) {
    return <div style={{ display: "none" }} />;
  }

  return (
    <Container>
      <ControlsRow>
        <LiveTag onClick={setLive} replay={mapStore.replayMode}>
          <LiveDot replay={mapStore.replayMode} />
          LIVE
        </LiveTag>
        <Time>{formatTime(mapStore.time)}</Time>
        <Button onClick={() => jump(-60000)} title="Back 1 min">
          <RotateCcw size={18} />
        </Button>
        <Button onClick={togglePlay} title={mapStore.playing ? "Pause" : "Play"}>
          {mapStore.playing ? <Pause size={18} /> : <Play size={18} />}
        </Button>
        <Button onClick={() => jump(60000)} title="Forward 1 min">
          <RotateCw size={18} />
        </Button>
        <SpeedSelector
          value={mapStore.replaySpeed}
          onChange={(e) => {
            mapStore.setReplaySpeed(Number(e.target.value))

            mapStore.setTimeReference(mapStore.time)
            mapStore.setTimeReferenceAnimation(Date.now())
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
        <SliderWrapper ref={sliderRef} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
          <SliderProgress progress={getProgress()} />
          <SliderHandle progress={getProgress()} />
        </SliderWrapper>
      </SliderRow>
    </Container>
  );
});

export default ReplaySlider;
