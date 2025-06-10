// src/components/SelectedRider.jsx
import React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore";
import { riders_info } from "../constants/riders_info_1000";
import { countryMeta } from "../constants/countryMeta";
import { Star, Play, Share2 } from "lucide-react";
import { X } from "lucide-react";
import uiStore from '../store/uiStore';

const Container = styled.div`

  width: 600px;
  padding: 12px 24px;
  background: rgba(58, 63, 69, 0.6);
  backdrop-filter: blur(4px);  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  color: #fff;
  z-index: 1000;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
    width: 40%;

`;

const NumberBadge = styled.div`
  width: 46px; /* 40px circle + 2×3px border */
  height: 46px;
  box-sizing: border-box;
  background: ${props => props.color};
  border-radius: 50%;
  border: ${props => props.$selected ? `3px solid #30D5C8` : "none"};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Subtitle = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
`;

const IconButton = styled.button`
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0,0,0,0);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 2px;
  margin-left: 8px;
`;

/* Updated: circular close button */
const CloseButton = styled.button`
  background: rgba(0, 0, 0, 0);
  border: 1px solid #fff;
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
    background: rgba(58, 63, 69, 0.6);;
  }
`;


const FlagIcon = styled.img`
  width: 24px;
  height: 16px;
  margin-left: 10px;
  border-radius: 2px;
`;

const SelectedRider = observer(() => {
  const riderId = mapStore.riderSelected;
  if (!riderId) return null;

  const riderData = riderStore.replayData[riderId];
  if (!riderData) return null;

  if (riderId === mapStore.riderFollowed)
    return null; // Don't show the selected rider if it's the same as the followed one

  const info = riders_info[riderId];
  const name = info ? `${info.FirstName} ${info.LastName}` : riderId;
  const meta = info ? countryMeta[info.Nationality.toUpperCase()] : null;
  const country = meta ? meta.name : info?.Nationality || "";
  const speed = (riderData.previousPos?.speed ?? 0).toFixed(1);
  const number = info && info.Startnummer ? info.Startnummer : info ? info.FirstName.substring(0, 1) + info.LastName.substring(0, 1) : riderId.substring(0, 3);

  const isFavorited = riderStore.favorites.includes(riderId);
  const isFollowing = mapStore.riderFollowed === riderId;

  const isStaff = info?.LastName === "Staff";
  const color = isFollowing
    ? uiStore.colorFollowing
    : isStaff
      ? uiStore.colorStaff
      : riderStore.favorites.includes(riderId)
        ? uiStore.colorFavorites
        : uiStore.colorNormal;

  const flag = meta?.flag;

  return (
    <Container>
      <LeftGroup>
        <NumberBadge color={color} $selected={true}>{number}</NumberBadge>
        <Info>
          <NameRow>
            {name}
          </NameRow>
          <Subtitle>
            {country} &bull; {speed} km/h
          </Subtitle>
        </Info>
        {flag && <FlagIcon src={flag} alt={info.Nationality} />}
      </LeftGroup>
      <div style={{ display: "flex", alignItems: "center" }}>
        <IconButton $following={isFollowing} onClick={() => mapStore.toggleFollow(riderId)}>
          <Play size={20} /> {isFollowing ? "Unfollow" : "Follow"}
        </IconButton>

        <IconButton
          title={isFavorited ? "Unfavorite" : "Favorite"}
          onClick={() => riderStore.toggleFavorite(riderId)}
        >
          <Star size={20} color={isFavorited ? "#4e8cff" : "#ffffff"} fill={isFavorited ? "#4e8cff" : "none"} />{"Favorite"}
        </IconButton>
        <IconButton title="Share">
          <Share2 size={20} />{"Share"}
        </IconButton>
      </div>
      <CloseButton onClick={() => mapStore.setRiderSelected(null)}>
        <X size={20} color="#ffffff" />
      </CloseButton>
    </Container>
  );
});

export default SelectedRider;
