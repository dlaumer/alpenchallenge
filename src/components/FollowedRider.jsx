// src/components/FollowedRider.jsx
import React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore";
import { riders_info } from "../constants/riders_info_1000";
import { countryMeta } from "../constants/countryMeta";
import { X, Share } from "lucide-react";

const Container = styled.div`

  width: 460px;
  padding: 12px 24px;
  background: #fff;
  border-radius: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  width: 50%;
`;

const NumberBadge = styled.div`
  background: #e74c3c;
  color: #fff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-right: 16px;
  flex-shrink: 0;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Label = styled.div`
  font-size: 12px;
  color: #555;
`;

const NameRow = styled.div`
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ModeGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 16px;
`;

const ModeLabel = styled.div`
  font-size: 12px;
  color: #555;
  margin-bottom: 4px;
`;

const ModeButtons = styled.div`
  display: flex;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
`;

const ModeButton = styled.button`
  flex: 1;
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  background: ${(props) => props.$active ? "#e74c3c" : "transparent"};
  color: ${(props) => props.$active ? "#fff" : "e74c3c"};
  cursor: pointer;

  &:first-child {
    border-right: 1px solid #ddd;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  margin-left: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #000;

  &:hover {
    opacity: 0.8;
  }
`;
/* Updated: circular close button */
const CloseButton = styled.button`
  background: #fff;
  border: 1px solid #000;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #f5f5f5;
  }
`;

const FollowedRider = observer(() => {
  const riderId = mapStore.riderFollowed;
  if (!riderId) return null;

  // same info lookup as SelectedRider
  const info = riders_info[riderId] || {FirstName: riderId, LastName: ""};
  const number = riderId.substring(0,3) || "";
  const name = info ? `${info.FirstName} ${info.LastName}` : riderId;

  return (
    <Container>
      <LeftGroup>
        <NumberBadge>{number}</NumberBadge>
        <Info>
          <Label>You follow</Label>
          <NameRow>{name}</NameRow>
        </Info>
      </LeftGroup>

      <ModeGroup>
        <ModeLabel>Follow mode</ModeLabel>
        <ModeButtons>
          <ModeButton $active={mapStore.followMode === "fly"} onClick={() => mapStore.setFollowMode("fly")}>
            Fly
          </ModeButton>
          <ModeButton $active={mapStore.followMode === "ride"} onClick={() => mapStore.setFollowMode("ride")}>
            Ride
          </ModeButton>
        </ModeButtons>
      </ModeGroup>

      <IconButton title="Share">
          <Share size={20} />
        </IconButton>

      <CloseButton onClick={() => mapStore.toggleFollow(riderId)}>
        <X size={20} />
      </CloseButton>
    </Container>
  );
});

export default FollowedRider;
