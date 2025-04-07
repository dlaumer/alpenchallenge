import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore"; // assuming riderStore is available
import styled from "styled-components";

const FollowButton = styled.button`
  background: #61dafb;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
`;

const Popup = observer(() => {
  const [attributes, setAttributes] = useState(null);

  const handleFollowClick = () => {
    if (mapStore.riderSelected) {
      mapStore.toggleFollow(mapStore.riderSelected);
    }
  };

  const formatTime = (time) => {
    const hours = time.getHours().toString().padStart(2, "0");
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const seconds = time.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (mapStore.riderSelected != null) {
      const rider = riderStore.riders[mapStore.riderSelected];
      if (rider && rider.previousPos) {
        setAttributes(rider.previousPos);
      }
    }
  }, [mapStore.time, mapStore.riderSelected, riderStore.riders]);

  if (!attributes || !mapStore.time) {
    return (
      <div style={{ padding: "10px" }}>
        Waiting for popup content...
      </div>
    );
  }

  return (
    <div style={{ padding: "10px" }}>
      <FollowButton onClick={handleFollowClick}>
        {mapStore.riderFollowed === mapStore.riderSelected ? "Unfollow" : "Follow"}
      </FollowButton>
      <h2>{formatTime(new Date(mapStore.time))}</h2>
      <ul>
        <li><b>User:</b> {attributes.userId}</li>
        <li><b>Run ID:</b> {attributes.runId}</li>
        <li><b>Contest ID:</b> {attributes.contestId}</li>
        <li><b>Gig ID:</b> {attributes.gigId}</li>
        <li><b>Time:</b> {attributes.ts_string}</li>
        <li><b>Accuracy:</b> {attributes.accuracy}</li>
        <li><b>Heading:</b> {attributes.heading}</li>
        <li><b>Speed:</b> {attributes.speed}</li>
        <li><b>Longitude:</b> {attributes.longitude}</li>
        <li><b>Latitude:</b> {attributes.latitude}</li>
        <li><b>Altitude:</b> {attributes.altitude}</li>
      </ul>
    </div>
  );
});

export default Popup;
