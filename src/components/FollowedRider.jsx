// src/components/FollowedRider.jsx
import React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore";
import { riders_info } from "../constants/riders_info_1000";
import { countryMeta } from "../constants/countryMeta";
import { X, Share2, BatteryFull, BatteryMedium, BatteryLow } from "lucide-react";
import uiStore from "../store/uiStore";
import { useShare } from "./useShare.jsx";
import { getTranslation } from "../utils/getTranslation";

const Container = styled.div`
  width: ${props => (props.$isMobile ? "calc(100% - 90px)" : "600px")};
  padding: ${props => (props.$isMobile ? "8px 12px" : "12px 24px")};
  background: #e0e6ed;
  border-radius: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: ${props => (props.$isMobile ? "column" : "row")};
  align-items: ${props => (props.$isMobile ? "flex-start" : "center")};
  justify-content: space-between;
  z-index: 1000;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  width: ${props => (props.$isMobile ? "100%" : "50%")};
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
  background: ${uiStore.colorFollowing};
  color: #e0e6ed;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-right: 16px;
  flex-shrink: 0;
`;

const ModeGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: ${props => (props.$isMobile ? "0" : "16px")};
`;

const ModeButtons = styled.div`
  display: flex;
  border: 1px solid #999;
  border-radius: 8px;
  overflow: hidden;
  height: 32px;
`;

const ModeButton = styled.button`
  flex: 1;
  padding: ${props => (props.$isMobile ? "4px 8px" : "6px 12px")};
  font-size: ${props => (props.$isMobile ? "11px" : "12px")};
  border: none;
  background: ${props => (props.$active ? `${uiStore.colorFollowing}` : "transparent")};
  color: ${props => (props.$active ? "#fff" : `#000`)};
  cursor: pointer;

  &:first-child {
    border-right: 1px solid #ddd;
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  color: #555;
  border: 1px solid #999;
  border-radius: 8px;
  padding: ${props => (props.$isMobile ? "4px 8px" : "6px 12px")};
  font-size: ${props => (props.$isMobile ? "11px" : "12px")};
  cursor: pointer;
  margin-left: ${props => (props.$isMobile ? "0" : "8px")};
`;

const CloseButton = styled.button`
  background: #e0e6ed;
  border: 1px solid #000;
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
    background: #f5f5f5;
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
  color: ${props => (props.$low ? 'red' : 'inherit')};
`;

const IconWrapper = styled.div`
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Subtitle = styled.div`
  font-size: 14px;
  color: #555;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 0;
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

const FollowedRider = observer(() => {
  const { share, Toast } = useShare();
  const { isMobile } = uiStore;

  const riderId = mapStore.riderFollowed;
  if (!riderId) return null;

  const riderData = riderStore.replayCache[riderId];
  if (!riderData) return null;

  const info = riders_info[riderId];
  const name = info ? `${info.FirstName} ${info.LastName}` : riderId;
  const meta = info ? countryMeta[info.Nationality.toUpperCase()] : null;
  const country = meta ? meta.name : info?.Nationality || "";
  const speed = (riderData?.speed ?? 0).toFixed(1);
  const altitude = (riderData?.altitude ?? 0).toFixed(0);
  const batteryLevel = (riderData?.battery * 100 ?? 0).toFixed(0);

  let BatteryIcon = BatteryLow;
  if (batteryLevel >= 66) BatteryIcon = BatteryFull;
  else if (batteryLevel >= 33) BatteryIcon = BatteryMedium;

  const number =
    info?.Startnummer ||
    (info
      ? info.FirstName.substring(0, 1) + info.LastName.substring(0, 1)
      : riderId.substring(0, 3));

  const flag = meta?.flag;

  return (
    <Container $isMobile={isMobile}>
      <LeftGroup $isMobile={isMobile}>
        <NumberBadge>{number}</NumberBadge>
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
                color={batteryLevel < 33 ? 'red' : '#555'}
              />
            </IconWrapper>
            <BatteryPercentage $low={batteryLevel < 33}>
              {batteryLevel}%
            </BatteryPercentage>
          </Subtitle>
        </Info>
      </LeftGroup>

      <RightGroup $isMobile={isMobile}>
        <ModeGroup $isMobile={isMobile}>
          <ModeButtons>
            <ModeButton
              $isMobile={isMobile}
              $active={mapStore.followMode === "fly"}
              onClick={() => mapStore.setFollowMode("fly")}
            >
              {getTranslation("fly")}
            </ModeButton>
            <ModeButton
              $isMobile={isMobile}
              $active={mapStore.followMode === "ride"}
              onClick={() => mapStore.setFollowMode("ride")}
            >
              {getTranslation("ride")}
            </ModeButton>
          </ModeButtons>
        </ModeGroup>

        <IconButton $isMobile={isMobile} onClick={share} title={getTranslation("share")}>
          <Share2 size={20} />{getTranslation("share")}
        </IconButton>
        {Toast}

        <CloseButton $isMobile={isMobile} onClick={() => mapStore.toggleFollow(riderId)}>
          <X size={20} />
        </CloseButton>
      </RightGroup>
    </Container>
  );
});

export default FollowedRider;
