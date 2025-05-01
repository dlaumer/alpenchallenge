import React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore";
import { X } from "lucide-react";

const CardWrapper = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #eaf2fb;
  border-radius: 999px;
  padding: 18px 24px 18px 20px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 24px;
  z-index: 1000;
  font-family: sans-serif;
  max-width: 95%;
`;

const Avatar = styled.div`
  font-size: 32px;
  background: #f4f4f4;
  border-radius: 50%;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex-grow: 1;
  gap: 2px;
`;

const RiderName = styled.div`
  font-weight: 700;
  font-size: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CountryInfo = styled.div`
  font-size: 14px;
  color: #333;
`;

const Speed = styled.div`
  font-size: 14px;
  color: #666;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 8px;
`;

const ActionButton = styled.button`
  background: ${(props) => props.bg || "#3a9eff"};
  color: white;
  padding: 6px 14px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    opacity: 0.9;
  }
`;

const CloseButton = styled.div`
  width: 36px;
  height: 36px;
  background: url("/path/to/default-avatar.jpg") center/cover no-repeat;
  border-radius: 50%;
  border: 2px solid black;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
    cursor: pointer;

`;

const RiderCard = observer(() => {
    const riderId = mapStore.riderSelected;
    if (!riderId || !riderStore.riders[riderId]) return null;

    const rider = riderStore.riders[riderId];
    const isFavorite = riderStore.favorites.includes(riderId);
    const isFollowed = mapStore.riderFollowed === riderId;

    return (
        <CardWrapper>
            <Avatar>👤</Avatar>
            <InfoBlock>
                <RiderName>{riderId.replace("rider_", "Rider ")}</RiderName>
                <CountryInfo>🇨🇭 Switzerland</CountryInfo>
                <Speed>{(rider.previousPos.speed || 0).toFixed(1)} km/h</Speed>
            </InfoBlock>
            <ActionButtons>
                <ActionButton
                    bg={isFavorite ? "#ccc" : "#ffd700"}
                    onClick={() => riderStore.toggleFavorite(riderId)}
                >
                    {isFavorite ? "★" : "☆"}
                </ActionButton>
                <ActionButton
                    bg={isFollowed ? "#888" : "#3a9eff"}
                    onClick={() => mapStore.toggleFollow(riderId)}
                >
                    {isFollowed ? "Unfollow" : "Follow"}
                </ActionButton>
            </ActionButtons>
            <CloseButton onClick={() => { 
                mapStore.setRiderSelected(null)
                mapStore.toggleFollow(riderId)
             }
            }>
                <X />
            </CloseButton>
        </CardWrapper>
    );
});

export default RiderCard;
