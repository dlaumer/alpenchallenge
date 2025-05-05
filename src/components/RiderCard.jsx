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
  right: ${(props) => (props.$isFollowing ? "20px" : "auto")};
  transform: ${(props) => (props.$isFollowing ? "none" : "translateX(-50%)")};
  background: white;
  border-radius: 24px;
  padding: 18px 24px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  border-left: 6px solid #e1003b;
  z-index: 1000;
  font-family: sans-serif;
  width: 320px;
  max-width: 95%;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
`;

const Title = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #222;
`;

const Subtitle = styled.div`
  font-size: 14px;
  color: #555;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 4px;

  img {
    width: 20px;
    height: 14px;
    border-radius: 2px;
  }
`;

const CloseButton = styled.div`
  cursor: pointer;
  background: none;
  border: none;
  color: #666;
  border-radius: 50%;
  padding: 4px;

  &:hover {
    background: #eee;
  }

  svg {
    stroke-width: 3;
    width: 18px;
    height: 18px;
  }
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Speed = styled.div`
  font-size: 13px;
  color: #666;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  background: ${(props) => props.bg || "#3a9eff"};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
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
  const gender = info.Gender;
  const nationality = info.Nationality;
  const meta = countryMeta[nationality?.toUpperCase()];

  return (
    <CardWrapper $isFollowing={isFollowing}>
      <TopRow>
        <div>
          <Title>{fullName}</Title>
          <Subtitle>
            {gender}, {birthday}
            {meta && (
              <>
                <img src={meta.flag} alt={meta.name} />
                {meta.name}
              </>
            )}
          </Subtitle>
        </div>
        <CloseButton
          onClick={() =>
            isFollowing
              ? mapStore.toggleFollow(riderId)
              : mapStore.setRiderSelected(null)
          }
        >
          <X />
        </CloseButton>
      </TopRow>

      <BottomRow>
        <Speed>{(rider.previousPos.speed || 0).toFixed(1)} km/h</Speed>
        <ButtonGroup>
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
        </ButtonGroup>
      </BottomRow>
    </CardWrapper>
  );
});

const RiderCard = observer(() => {
  const cards = [];

  const { riderSelected, riderFollowed } = mapStore;

  if (riderFollowed && riderStore.riders[riderFollowed]) {
    cards.push(
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
    cards.push(
      <RiderCardInstance
        key={`selected-${riderSelected}`}
        riderId={riderSelected}
        isFollowing={false}
      />
    );
  }

  return <>{cards}</>;
});

export default RiderCard;
