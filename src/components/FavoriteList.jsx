// src/components/FavoriteList.jsx

import React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { Play, Star } from 'lucide-react';
import riderStore from '../store/riderStore';
import mapStore from '../store/mapStore';
import { riders_info } from '../constants/riders_info_1000';
import uiStore from '../store/uiStore';
import { countryMeta } from "../constants/countryMeta";

const Container = styled.div`
  position: absolute;
  bottom: 50px;
  left: 0px;
  width: 200px;
  max-height: calc(100% - 100px);
  overflow-y: auto;
  padding: 4px 0;
  z-index: 101;
`;

const List = styled.div`
  display: flex;
  flex-direction: column-reverse;
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
width: 95%;

`;

const Bubble = styled.div`
  display: flex;
  position: relative;
  flex: 1;
  background: rgba(58, 63, 69, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 0 54px 54px 0;
  padding: 8px 10px 8px 8px; /* space for the circle */
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  overflow: hidden;
  cursor: pointer;
  align-items: center;
`;
const RankCircle = styled.div`
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
  justify-content: center;
`;

const Flag = styled.img`
  width: 24px;
  height: 16px;
  border-radius: 2px;
  margin-left: auto;
  margin-right: 6px;
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
          const number = info && info.Startnummer ? info.Startnummer : info ? info.FirstName.substring(0, 1) + info.LastName.substring(0, 1) : id.substring(0, 3);

          const isStaff = info?.LastName === "Staff";
          const color = isFollowing
            ? uiStore.colorFollowing
            : isStaff
              ? uiStore.colorStaff
              : riderStore.favorites.includes(id)
                ? uiStore.colorFavorites
                : uiStore.colorNormal;

          const meta = countryMeta[info?.Nationality?.toUpperCase()];
          const flag = meta?.flag;
          return (
            <Item key={id}>
              <Bubble $selected={isSelected} $following={isFollowing}
                onClick={() =>
                  mapStore.setRiderSelected(isSelected ? null : id)  // toggle select
                }>
                <InfoPart>
                  <TopPart>
                    <RankCircle color={color} $selected={isSelected}>
                      {number}
                    </RankCircle>
                    <Name name={first + " " + last}>
                      <span>{first}</span>
                      <span>{last}</span>
                    </Name>
                  </TopPart>

                </InfoPart>
                                  {flag && <Flag src={flag} alt={info.Nationality} />}

              </Bubble>
            </Item>
          );
        })}
      </List>
    </Container>
  );
});

export default FavoriteList;
