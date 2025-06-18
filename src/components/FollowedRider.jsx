// src/components/FollowedRider.jsx
import React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore";
import { riders_info } from "../constants/riders_info_1000";
import { countryMeta } from "../constants/countryMeta";
import { X, Share2, BatteryFull, BatteryMedium, BatteryLow  } from "lucide-react";
import uiStore from "../store/uiStore";
import { useShare } from "./useShare.jsx";
import { getTranslation } from "../utils/getTranslation";

const Container = styled.div`

  width: 600px;
  padding: 12px 24px;
  background: #e0e6ed;
  border-radius: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  width: 50%;
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
  margin-right: 16px;
`;

const ModeLabel = styled.div`
  font-size: 12px;
  color: #555;
  margin-bottom: 4px;
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
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  background: ${(props) => props.$active ? `${uiStore.colorFollowing}` : "transparent"};
  color: ${(props) => props.$active ? "#fff" : `#000`};
  cursor: pointer;

  &:first-child {
    border-right: 1px solid #ddd;
  }
`;


const IconButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0,0,0,0);
  color: #555;
  border: 1px solid #999;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 8px;
    height: 32px;

`;
/* Updated: circular close button */
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

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
  color: ${props => props.low ? 'red' : 'inherit'};
`;
const IconWrapper = styled.div`
    width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  `

// Styled components
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

  const riderId = mapStore.riderFollowed;
  if (!riderId) return null;

  const riderData = riderStore.replayCache[riderId];
  if (!riderData) return null;
  // same info lookup as SelectedRider
  const info = riders_info[riderId] || { FirstName: riderId, LastName: "" };
  const name = info ? `${info.FirstName} ${info.LastName}` : riderId;
  const number = info && info.Startnummer ? info.Startnummer : info ? info.FirstName.substring(0, 1) + info.LastName.substring(0, 1) : riderId.substring(0, 3);

  const meta = info ? countryMeta[info.Nationality.toUpperCase()] : null;
  const country = meta ? meta.name : info?.Nationality || "";
  const speed = (riderData?.speed ?? 0).toFixed(1);
  const altitude = (riderData?.altitude ?? 0).toFixed(1);
  const batteryLevel = (riderData?.battery ?? 0).toFixed(0);
  let BatteryIcon;
  if (batteryLevel >= 66) {
    BatteryIcon = BatteryFull;
  } else if (batteryLevel >= 33) {
    BatteryIcon = BatteryMedium;
  } else {
    BatteryIcon = BatteryLow;
  }

  const flag = meta?.flag;

  return (
    <Container>
      <LeftGroup>
        <NumberBadge>{number}</NumberBadge>
        <Info>
          <NameRow>
            {flag && <FlagIcon title={country} src={flag} alt={info.Nationality} />}
            {name}
          </NameRow>
          <Subtitle>
            <span>{speed} km/h</span>
            <Separator>&bull;</Separator>
            <span>{altitude} m</span>
            <Separator>&bull;</Separator>
            <IconWrapper>
              <BatteryIcon
                size={16}
                color={batteryLevel < 33 ? 'red' : '#555'}
              />
            </IconWrapper>
            <BatteryPercentage low={batteryLevel < 33}>
              {batteryLevel}%</BatteryPercentage>
          </Subtitle>
        </Info>
      </LeftGroup>

      <ModeGroup>
        <ModeButtons>
          <ModeButton $active={mapStore.followMode === "fly"} onClick={() => mapStore.setFollowMode("fly")}>
            {getTranslation("fly")}
          </ModeButton>
          <ModeButton $active={mapStore.followMode === "ride"} onClick={() => mapStore.setFollowMode("ride")}>
            {getTranslation("ride")}
          </ModeButton>
        </ModeButtons>
      </ModeGroup>

      <IconButton onClick={share} title={getTranslation("share")}>
        <Share2 size={20} />{getTranslation("share")}
      </IconButton>
      {Toast}

      <CloseButton onClick={() => mapStore.toggleFollow(riderId)}>
        <X size={20} />
      </CloseButton>
    </Container>
  );
});

export default FollowedRider;
