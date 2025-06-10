// src/components/FollowedRider.jsx
import React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore";
import { riders_info } from "../constants/riders_info_1000";
import { countryMeta } from "../constants/countryMeta";
import { X, Share2 } from "lucide-react";
import uiStore from "../store/uiStore";
import { useShare } from "./useShare.jsx";

const Container = styled.div`

  width: 500px;
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
  background: ${uiStore.colorFollowing};
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
  margin-right: 16px;
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
  background: ${(props) => props.$active ? `${uiStore.colorFollowing}` : "transparent"};
  color: ${(props) => props.$active ? "#fff" : `#000`};
  cursor: pointer;

  &:first-child {
    border-right: 1px solid #ddd;
  }
`;


const IconButton = styled.button`
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0,0,0,0);
  color: #555;
  border: 1px solid #555;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 5px;
  margin-left: 8px;
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

const FlagIcon = styled.img`
  width: 24px;
  height: 16px;
  margin-left: 10px;
  border-radius: 2px;
`;

const FollowedRider = observer(() => {

  const { share, Toast } = useShare();

  const riderId = mapStore.riderFollowed;
  if (!riderId) return null;

  // same info lookup as SelectedRider
  const info = riders_info[riderId] || { FirstName: riderId, LastName: "" };
  const name = info ? `${info.FirstName} ${info.LastName}` : riderId;
  const number = info && info.Startnummer ? info.Startnummer : info ? info.FirstName.substring(0, 1) + info.LastName.substring(0, 1) : riderId.substring(0, 3);

  const meta = info ? countryMeta[info.Nationality.toUpperCase()] : null;
  const flag = meta?.flag;

  return (
    <Container>
      <LeftGroup>
        <NumberBadge>{number}</NumberBadge>
        <Info>
          <Label>You follow</Label>
          <NameRow>{name}</NameRow>
        </Info>
        {flag && <FlagIcon src={flag} alt={info.Nationality} />}
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

      <IconButton onClick={share} title="Share">
        <Share2 size={20} />{"Share"}
      </IconButton>
      {Toast}

      <CloseButton onClick={() => mapStore.toggleFollow(riderId)}>
        <X size={20} />
      </CloseButton>
    </Container>
  );
});

export default FollowedRider;
