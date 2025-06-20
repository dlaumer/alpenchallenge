// src/components/SelectedRider.jsx
import React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore";
import { riders_info } from "../constants/riders_info_1000";
import { countryMeta } from "../constants/countryMeta";
import {
  Star,
  Play,
  Share2,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  X as XIcon
} from "lucide-react";
import uiStore from "../store/uiStore";
import { useShare } from "./useShare.jsx";
import { getTranslation } from "../utils/getTranslation";

const Container = styled.div`
  width: ${props => (props.$isMobile ? "calc(100% - 90px)" : "670px")};
  padding: ${props => (props.$isMobile ? "8px 12px" : "12px 24px")};
  background: rgba(58, 63, 69, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 32px;
  display: flex;
  flex-direction: ${props => (props.$isMobile ? "column" : "row")};
  align-items: ${props => (props.$isMobile ? "flex-start" : "center")};
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  color: #fff;
  z-index: 1000;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  width: ${props => (props.$isMobile ? "100%" : "40%")};
  margin-bottom: ${props => (props.$isMobile ? "8px" : "0")};
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${props => (props.$isMobile ? "8px" : "0")};
  width: ${props => (props.$isMobile ? "100%" : "auto")};
  justify-content: ${props => (props.$isMobile ? "space-evenly" : "flex-end")};
`;

const NumberBadge = styled.div`
  width: 46px;
  height: 46px;
  box-sizing: border-box;
  background: ${props => props.color};
  border-radius: 50%;
  border: ${props => (props.$selected ? `3px solid ${uiStore.colorSelected}` : "none")};
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
  display: flex;
  align-items: center;
  gap: 0;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  padding: ${props => (props.$isMobile ? "4px 8px" : "6px 12px")};
  font-size: ${props => (props.$isMobile ? "11px" : "12px")};
  cursor: pointer;
`;

const CloseButton = styled.button`
  background: transparent;
  border: 1px solid #fff;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  margin-left: ${props => (props.$isMobile ? "0" : "8px")};
  margin-top: ${props => (props.$isMobile ? "8px" : "0")};

  &:hover {
    background: rgba(58, 63, 69, 0.6);
  }
`;

const FlagIcon = styled.img`
  width: 24px;
  height: 16px;
  margin-right: 10px;
  border-radius: 2px;
`;

const Separator = styled.span`
  margin: 0 4px;
`;

const BatteryPercentage = styled.span`
  margin-left: 4px;
  color: ${props => (props.low ? "red" : "inherit")};
`;

const IconWrapper = styled.div`
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SelectedRider = observer(() => {
  const { share, Toast } = useShare();
  const { isMobile } = uiStore;

  const riderId = mapStore.riderSelected;
  if (!riderId) return null;

  const riderData = riderStore.replayCache[riderId];
  if (!riderData) return null;
  if (riderId === mapStore.riderFollowed) return null;

  const info = riders_info[riderId];
  const name = info ? `${info.FirstName} ${info.LastName}` : riderId;
  const meta = info ? countryMeta[info.Nationality.toUpperCase()] : null;
  const country = meta ? meta.name : info?.Nationality || "";
  const speed = (riderData?.speed ?? 0).toFixed(1);
  const altitude = (riderData?.altitude ?? 0).toFixed(0);
  const batteryLevel = (riderData?.battery *100 ?? 0).toFixed(0);

  let BatteryIcon = BatteryLow;
  if (batteryLevel >= 66) BatteryIcon = BatteryFull;
  else if (batteryLevel >= 33) BatteryIcon = BatteryMedium;

  const number =
    info?.Startnummer ||
    (info
      ? info.FirstName.substring(0, 1) + info.LastName.substring(0, 1)
      : riderId.substring(0, 3));

  const isFavorited = riderStore.favorites.includes(riderId);
  const isFollowing = mapStore.riderFollowed === riderId;
  const isStaff = info?.Category === "staff";

  const color = isFollowing
    ? uiStore.colorFollowing
    : isStaff
    ? uiStore.colorStaff
    : isFavorited
    ? uiStore.colorFavorites
    : uiStore.colorNormal;

  const flag = meta?.flag;

  return (
    <Container $isMobile={isMobile}>
      <LeftGroup $isMobile={isMobile}>
        <NumberBadge color={color} $selected>
          {number}
        </NumberBadge>
        <Info>
          <NameRow>
            {flag && <FlagIcon title={country} src={flag} alt={info.Nationality} />}
            {name}
          </NameRow>
          <Subtitle>
            <span>{speed} km/h</span>
            <Separator>•</Separator>
            <span>{altitude} m</span>
            <Separator>•</Separator>
            <IconWrapper>
              <BatteryIcon
                size={16}
                color={batteryLevel < 33 ? "red" : "rgba(255, 255, 255, 0.7)"}
              />
            </IconWrapper>
            <BatteryPercentage low={batteryLevel < 33}>
              {batteryLevel}%
            </BatteryPercentage>
          </Subtitle>
        </Info>
      </LeftGroup>

      <RightGroup $isMobile={isMobile}>
        <IconButton
          $isMobile={isMobile}
          $following={isFollowing}
          onClick={() => mapStore.toggleFollow(riderId)}
        >
          <Play size={20} /> {isFollowing ? getTranslation("unfollow") : getTranslation("follow")}
        </IconButton>

        <IconButton
          $isMobile={isMobile}
          title={isFavorited ? getTranslation("unfavorite") : getTranslation("favorite")}
          onClick={() => riderStore.toggleFavorite(riderId)}
        >
          <Star
            size={20}
            color={isFavorited ? "#4e8cff" : "#ffffff"}
            fill={isFavorited ? "#4e8cff" : "none"}
          />
          {isFavorited ? getTranslation("unfavorite") : getTranslation("favorite")}
        </IconButton>

        <IconButton $isMobile={isMobile} onClick={share} title="Share">
          <Share2 size={20} />
          {getTranslation("share")}
        </IconButton>

        {Toast}

        <CloseButton $isMobile={isMobile} onClick={() => mapStore.setRiderSelected(null)}>
          <XIcon size={20} color="#ffffff" />
        </CloseButton>
      </RightGroup>
    </Container>
  );
});

export default SelectedRider;
