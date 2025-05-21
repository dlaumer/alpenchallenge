// src/components/FavoriteList.jsx

import React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { Play, Star } from 'lucide-react';
import riderStore from '../store/riderStore';
import mapStore from '../store/mapStore';
import { riders_info } from '../constants/riders_info_1000';

const Container = styled.div`
  position: absolute;
  top: 120px;
  left: 0px;
  width: 200px;
  max-height: calc(100% - 100px);
  overflow-y: auto;
  padding: 4px 0;
  z-index: 101;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
`;

const TopPart = styled.div`
  display: flex;
  width: 100%;
`;

const InfoPart = styled.div`
width: 80%;

`;

const Bubble = styled.div`
  display: flex;
  position: relative;
  flex: 1;
  background: rgba(58, 63, 69, 0.6);
  backdrop-filter: blur(4px);
  /* draw a 3px “border” outside on top, right and bottom when selected */
  ${props =>
    props.$selected
      ? `
    box-shadow:
    /* top */
    0 -3px 0 0 ${props.$following ? 'red' : '#4e8cff'},
    /* right */
    3px 0 0 0 ${props.$following ? 'red' : '#4e8cff'},
    /* bottom */
    0 3px 0 0 ${props.$following ? 'red' : '#4e8cff'};
    `
      : ''}
  border-radius: 0 54px 54px 0;
  padding: 12px 16px 12px 12px; /* space for the circle */
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  overflow: hidden;
  cursor: pointer;
  align-items: center;
`;

const RankCircle = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.$following ? 'red' : '#4e8cff'};
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
    margin-right: 12px;
`;

const Name = styled.div`
width: 70%;
  color: #fff;
  font-size: 16px; /* increased size */
  font-weight: bold;
  line-height: 1.2;
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FollowButton = styled.button`
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${props => props.$following ? 'red' : '#4e8cff'};
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  width: 80%;
  margin-top: 8px;
`;

const StarButton = styled.button`
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  height: fit-content;

  svg {
    stroke: ${props => props.$following ? 'red' : '#4e8cff'};
    fill: ${props => props.$following ? 'red' : '#4e8cff'};
  }
`;

const FavoriteList = observer(() => {
  const { favorites } = riderStore;
  if (favorites.length === 0) return null;

  return (
    <Container>
      <List>
        {favorites.map((id, idx) => {
          const info = riders_info[id] || { FirstName: id, LastName: "" };
          const first = info.FirstName || '';
          const last = info.LastName || '';
          const isSelected = mapStore.riderSelected === id;
          const isFollowing = mapStore.riderFollowed === id;

          return (
            <Item key={id}>
              <Bubble $selected={isSelected} $following={isFollowing}
                onClick={() =>
                  mapStore.setRiderSelected(isSelected ? null : id)  // toggle select
                }>
                <InfoPart>
                  <TopPart>
                    <RankCircle $following={isFollowing}>
                      {id.substring(6)}
                    </RankCircle>
                    <Name>
                      <span>{first}</span>
                      <span>{last}</span>
                    </Name>
                  </TopPart>
                  <FollowButton $following={isFollowing} onClick={() => mapStore.toggleFollow(id)}>
                    <Play size={12} /> {isFollowing ? "Unfollow" : "Follow"}
                  </FollowButton>
                </InfoPart>
                <StarButton $following={isFollowing} onClick={() => riderStore.toggleFavorite(id)}>
                  <Star size={18} />
                </StarButton>
              </Bubble>
            </Item>
          );
        })}
      </List>
    </Container>
  );
});

export default FavoriteList;
