import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward
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
  align-items: center;
  font-family: sans-serif;
  font-size: 14px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  min-width: 800px;
  max-width: 90%;
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

const ReplaySlider = observer(() => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const [startTs, endTs] = riderStore.getReplayTimeRange();

  const formatTime = (ms) => {
    const d = new Date(ms);
    return d.toLocaleTimeString("en-GB");
  };

  const togglePlay = () => {
    mapStore.togglePlaying();
    mapStore.setReplayMode(true);
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
      console.log(((mapStore.time - startTs) / (endTs - startTs)) * 100)
      return ((mapStore.time - startTs) / (endTs - startTs)) * 100;
    }
  }

  const seekTo = (clientX) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ts = startTs + percent * (endTs - startTs);

    mapStore.setReplayMode(true);
    mapStore.setTimeReference(ts)
    mapStore.setTimeReferenceAnimation(Date.now())
    mapStore.setTime(ts);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    seekTo(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      seekTo(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };


  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!startTs || !endTs || isNaN(startTs) || isNaN(endTs)) {
    return <div style={{ display: "none" }} />;
  }

  return (
    <Container>
      <LiveTag onClick={() => { mapStore.setReplayMode(false) }} replay={mapStore.replayMode}>
        <LiveDot replay={mapStore.replayMode} />
        LIVE
      </LiveTag>
      <Time>{formatTime(mapStore.time)}</Time>
      <Button onClick={() => jump(-60000)} title="Back 1 min">
        <SkipBack size={18} />
      </Button>
      <Button onClick={togglePlay} title={mapStore.playing ? "Pause" : "Play"}>
        {mapStore.playing ? <Pause size={18} /> : <Play size={18} />}
      </Button>
      <Button onClick={() => jump(60000)} title="Forward 1 min">
        <SkipForward size={18} />
      </Button>
      <SliderWrapper ref={sliderRef} onMouseDown={handleMouseDown}>
        <SliderProgress progress={getProgress()} />
        <SliderHandle progress={getProgress()} />
      </SliderWrapper>
    </Container>
  );
});

export default ReplaySlider;
