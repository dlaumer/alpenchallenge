import React, { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore";
import { Star, StarOff, ChevronLeft } from "lucide-react";

const FloatingPopup = styled.div`
  position: absolute;
  top: 130px;
  left: 130px;
  top: 350px;
  z-index: 100;
  background: white;
  width: 380px;
  height: 370px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 768px) {
    position: fixed;
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
      transform: translateY(0%);
    width: 100%;
    height: 50vh;
    border-radius: 16px 16px 0 0;
    z-index: 1000;
  }
`;
const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 8px;
  flex-shrink: 0;
`;

const CollapseButton = styled.button`
  background: white;
  border: 2px solid #ccc;
  border-radius: 50%;
  padding: 8px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 20px;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 14px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: #f8f8f8;
`;


const RiderList = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 16px 12px;
  flex: 1;

  @media (max-width: 768px) {
    padding-bottom: 16px;
  }
`;

const RiderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${(props) => (props.selected ? "#ffffff" : "#d7e3f4")};
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  border: ${(props) => (props.selected ? "2px solid darkred" : "none")};
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
`;

const Avatar = styled.div`
  background: #bbb;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Number = styled.div`
  font-weight: bold;
  min-width: 24px;
  flex-shrink: 0;
`;

const NameInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

const Country = styled.div`
  font-size: 13px;
  color: #666;
`;

const Speed = styled.div`
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  margin: 0 8px;
  flex-shrink: 0;
`;

const Buttons = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  color: ${(props) => (props.active ? "#1e70bf" : "#888")};
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`;

const FollowButton = styled.button`
  background: #3a9eff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: #1f89eb;
  }
`;

const Popup = observer(() => {
  const [searchTerm, setSearchTerm] = useState("");
  const selectedRef = useRef(null);

  const filteredRiders = Object.entries(riderStore.riders).filter(
    ([riderId]) => riderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [mapStore.riderSelected]);

  if (!mapStore.popupVisible) return null;

  return (
    <FloatingPopup>
      <HeaderBar>
        <CollapseButton
          title="Hide"
          onClick={() => mapStore.setPopupVisible(false)}
        >
          <ChevronLeft size={20} />
        </CollapseButton>

        <SearchInput
          type="text"
          placeholder="Search by name or country..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </HeaderBar>

      <RiderList>
        {filteredRiders.map(([riderId, data]) => {
          const selected = mapStore.riderSelected === riderId;
          const isFav = riderStore.favorites?.includes(riderId);
          const speed = data?.previousPos?.speed?.toFixed(1) ?? "0.0";
          const isFollowed = mapStore.riderFollowed === riderId;

          return (
            <RiderRow
              key={riderId}
              selected={selected}
              ref={selected ? selectedRef : null}
              onClick={() => {
                if (mapStore.riderSelected == riderId) {
                  mapStore.setRiderSelected(null)
                }
                else {
                  mapStore.setRiderSelected(riderId)
                }
              }
              }
            >
              <LeftGroup>
                <Avatar>👤</Avatar>
                <Number>{riderId.substring(6)}</Number>
                <NameInfo>
                  <Country>CH</Country>
                </NameInfo>
              </LeftGroup>
              <Speed>{speed} km/h</Speed>
              <Buttons>
                <StarButton
                  onClick={(e) => {
                    e.stopPropagation();
                    riderStore.toggleFavorite(riderId);
                  }}
                  active={isFav}
                >
                  {isFav ? <Star size={16} /> : <StarOff size={16} />}
                </StarButton>
                <FollowButton
                  onClick={(e) => {
                    e.stopPropagation();
                    mapStore.toggleFollow(riderId);
                  }}
                >
                  {isFollowed ? "Unfollow" : "Follow"}
                </FollowButton>
              </Buttons>
            </RiderRow>
          );
        })}
      </RiderList>
    </FloatingPopup>
  );
});

export default Popup;
