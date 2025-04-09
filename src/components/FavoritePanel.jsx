import React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import riderStore from "../store/riderStore";
import mapStore from "../store/mapStore";
import uiStore from "../store/uiStore";

const Panel = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 80px;
  padding: 10px;
  background: #e4edf8;
  border-radius: 12px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;


const Title = styled.div`
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
`;
const SlotWrapper = styled.div`
  width: 100%;
  height: 70px;
  margin-bottom: 10px;
`;

const Slot = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: ${(props) => (props.filled ? "#fff" : "#d7e3f4")};
  overflow: hidden;
  position: relative;
  cursor: ${(props) => (props.interactive ? "pointer" : "default")};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const PlaceholderIcon = styled.div`
  font-size: 22px;
  color: #666;
  margin-top: 20px;
`;

const FilledTop = styled.div`
  background: #ccc;
  width: 100%;
  padding: 2px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RiderNumber = styled.div`
  font-size: 12px;
  font-weight: bold;
`;

const Star = styled.div`
  font-size: 14px;
  cursor: pointer;
`;

const Avatar = styled.div`
  width: 100%;
  height: 52px;
  background: url("https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png");
  background-size: cover;
  background-position: center;
`;

const FollowBtn = styled.button`
  width: 100%;
  border: none;
  background: #3a9eff;
  color: white;
  padding: 6px 0;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: #187de5;
  }
`;


const FavoritePanel = observer(() => {
    const favorites = riderStore.favorites ?? [];

    const handleClick = (riderId) => {
        mapStore.setRiderSelected(riderId);
        mapStore.setPopupVisible(true);

    };

    const handleFollow = (e, riderId) => {
        e.stopPropagation();
        mapStore.toggleFollow(riderId);
    };
const renderSlot = (riderId, index) => {
  const isFollowed = mapStore.riderFollowed === riderId;
  const isSelected = mapStore.riderSelected === riderId;

  return (
    <SlotWrapper key={index}>
      <Slot
        filled={!!riderId}
        interactive
        following={isFollowed}
        onClick={() => {
          if (riderId) {
            mapStore.setRiderSelected(riderId);
            mapStore.setPopupVisible(true);
          } else {
            uiStore.setLastFavoriteSlot(index);
            mapStore.setRiderSelected(null);
            mapStore.setPopupVisible(true);
          }
        }}
      >
        {riderId ? (
          <>
            <FilledTop>
              <RiderNumber>{riderId.substring(6)}</RiderNumber>
              <Star
                onClick={(e) => {
                  e.stopPropagation();
                  riderStore.toggleFavorite(riderId);
                }}
                title="Unfavorite"
              >
                ⭐
              </Star>
            </FilledTop>
            <Avatar />
            <FollowBtn
              onClick={(e) => {
                e.stopPropagation();
                mapStore.toggleFollow(riderId);
              }}
            >
              {isFollowed ? "Un Follow" : "Follow"}
            </FollowBtn>
          </>
        ) : (
          <PlaceholderIcon>👤➕</PlaceholderIcon>
        )}
      </Slot>
    </SlotWrapper>
  );
};

    const slots = [...favorites.slice(0, 4)];
    while (slots.length < 4) slots.push(null);

    return (
        <Panel>
            <Title>Favorite Contestants</Title>
            {slots.map((riderId, i) => renderSlot(riderId, i))}
        </Panel>
    );
});

export default FavoritePanel;
