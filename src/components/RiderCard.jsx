import React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore";
import { X } from "lucide-react";
import { riders_info } from "../constants/riders_info_1000";
import { countryMeta } from "../constants/countryMeta";

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
  
  /* ⏳ Smoother sliding */
  transition: left 2s ease, right 2s ease, transform 2s ease;

  /* 🟣 Fade-in on re-render */
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
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
const FollowOverlay = styled.div`
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 100;

  &::before {
    content: '';
    position: absolute;
    top: 40px;
    left: 40px;
    right: 40px;
    bottom: 70px;
    border-radius: 24px;
    border: 2px solid #e1003b;
    box-sizing: border-box;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    
    /* This creates a transparent hole with rounded corners */
    mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);

    mask-composite: exclude;
    -webkit-mask-composite: destination-out;

    padding: 40px 40px 70px 40px;
    box-sizing: border-box;
  }
`;



const RiderCardInstance = observer(({ riderId, isFollowing }) => {
  const rider = riderStore.riders[riderId];
  const info = riders_info[riderId];
  if (!rider || !info) return null;

  const isFavorite = riderStore.favorites.includes(riderId);
  const isFollowed = mapStore.riderFollowed === riderId;

  const fullName = `${info.FirstName} ${info.LastName}`;
  const birthday = info.Birthday;
  const nationality = info.Nationality;
  const meta = countryMeta[nationality.toUpperCase()];
  return (
    <CardWrapper $isFollowing={isFollowing}>
      <Avatar>👤</Avatar>
      <InfoBlock>
        <RiderName>{fullName}</RiderName>
        <CountryInfo>
          {birthday}
          {meta && (
            <>
              &nbsp;&nbsp;
              <img
                src={meta.flag}
                alt={meta.name}
                style={{ width: "20px", height: "14px", verticalAlign: "text-bottom", borderRadius: "2px", marginRight: "6px" }}
              />
              {meta.name}
            </>
          )}
        </CountryInfo>
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

  const showOverlay = !!mapStore.riderFollowed;

  return <>
    {showOverlay && <FollowOverlay />}

    {elements}
  </>;
});

export default RiderCard;
