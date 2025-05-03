import React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore";
import { X } from "lucide-react";

const CardWrapper = styled.div`
  position: absolute;
  top: 20px;
  left: ${(props) => (props.$isFollowing ? "auto" : "50%")};
  right: ${(props) => (props.$isFollowing ? "70px" : "auto")};
  transform: ${(props) => (props.$isFollowing ? "none" : "translateX(-50%)")};
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
  transition: left 1s ease, right 1s ease, transform 1s ease;
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
  background: #fff;
  border-radius: 50%;
  border: 2px solid black;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const RiderCardInstance = observer(({ riderId, isFollowing }) => {
  const rider = riderStore.riders[riderId];
  if (!rider) return null;

  const isFavorite = riderStore.favorites.includes(riderId);
  const isFollowed = mapStore.riderFollowed === riderId;

  return (
    <CardWrapper $isFollowing={isFollowing}>
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
      <CloseButton
        onClick={() => {
          if (isFollowing) {
            mapStore.toggleFollow(riderId);
          } else {
            mapStore.setRiderSelected(null);
          }
        }}
      >
        <X />
      </CloseButton>
    </CardWrapper>
  );
});

const RiderCard = observer(() => {
  const elements = [];

  const { riderSelected, riderFollowed } = mapStore;

  if (riderFollowed && riderStore.riders[riderFollowed]) {
    elements.push(
      <RiderCardInstance
        key={`followed-${riderFollowed}`}
        riderId={riderFollowed}
        isFollowing={true}
      />
    );
  }

  if (
    riderSelected &&
    riderSelected !== riderFollowed &&
    riderStore.riders[riderSelected]
  ) {
    elements.push(
      <RiderCardInstance
        key={`selected-${riderSelected}`}
        riderId={riderSelected}
        isFollowing={false}
      />
    );
  }

  return <>{elements}</>;
});

export default RiderCard;
