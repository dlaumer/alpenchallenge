import styled, { keyframes } from "styled-components";
import { observer } from "mobx-react-lite";
import { Menu } from "lucide-react";
import uiStore from "../store/uiStore";
import { languageStore } from "../store/languageStore";
import { getTranslation } from "../utils/getTranslation";
import mapStore from "../store/mapStore"; // required for updating state
import { useEffect, useState } from "react";

import logo from "../assets/logo.png";
import logoActyvo from "../assets/actyvo_transparent.png";
import enFlag from "../assets/flags/en.png";
import deFlag from "../assets/flags/de.png";
import frFlag from "../assets/flags/fr.png";
import itFlag from "../assets/flags/it.png";
import { setLocale } from '@arcgis/core/intl';
import { useShare } from "./useShare.jsx";
import { X, Share2, Info } from "lucide-react";

const HeaderContainer = styled.header`
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background-color: #d3dbe5;
  color: black;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: margin-left 0.3s ease-in-out;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Logo = styled.img`
  height: 38px;
  cursor: pointer;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Dropdown = styled.div`
  position: relative;
  user-select: none;
`;

const DropdownButton = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f8f8f8;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #eee;
  }
`;

const FlagIcon = styled.img`
  width: 18px;
  height: 18px;
  margin-right: 8px;
`;

const DropdownList = styled.ul`
  position: absolute;
  top: 100%;
  right: 0;
  margin: 0;
  padding: 6px 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  list-style: none;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  min-width: 140px;
  max-width: 100vw;
  overflow-x: hidden;
`;

const DropdownItem = styled.li`
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #eee;
  }
`;

const expandOnce = keyframes`
  0% { transform: scale(1); }
  30% { transform: scale(2); }
  100% { transform: scale(1); }
`;

const LiveTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 400;
  font-family: "Arial Narrow", "Helvetica Neue Condensed", sans-serif;
  letter-spacing: 0.5px;
  cursor: pointer; /* make clickable */
`;

const LiveDot = styled.div`
  width: 10px;
  height: 10px;
  background-color: red;
  border-radius: 50%;
  margin-right: 8px;
  animation: ${({ $animate }) => ($animate ? expandOnce : "none")} 0.6s ease-in-out;
`;

const LiveTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const TextRow = styled.div`
  display: flex;
  align-items: center;
  font-family: "Arial Narrow", "Helvetica Neue Condensed", sans-serif;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 0.5px;
`;

const LiveText = styled.span`
  font-weight: 900;
`;

const StreamText = styled.span`
  font-weight: 400;
  margin-left: 2px;
`;

const ProgressBarWrapper = styled.div`
  margin-top: 2px;
  height: 2px;
  background: transparent;
`;


const ShareButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f8f8f8;
  cursor: pointer;
  font-size: 14px;
  color: inherit;

  &:hover {
    background-color: #eee;
  }
`;

const ShareWrapper = styled.div`
  position: relative;
  display: inline-block;
`;
const ProgressBar = styled.div.attrs(({ $progress }) => ({
  style: {
    width: `${$progress * 100}%`
  }
}))`
  height: 100%;
  background: red;
  transition: width 0.3s ease;
`;

const Header = observer(() => {
  const [open, setOpen] = useState(false);
  const [animateDot, setAnimateDot] = useState(false);
  const { share, Toast } = useShare();

  const currentLang = languageStore.language;

  const flagIcons = { de: deFlag, fr: frFlag, it: itFlag, en: enFlag };
  const langLabels = { de: "Deutsch", fr: "Français", it: "Italiano", en: "English" };

  useEffect(() => {
    if (mapStore.updating) {
      setAnimateDot(true);
      const timeout = setTimeout(() => setAnimateDot(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [mapStore.updating]);

  const handleSelect = (lang) => {
    languageStore.setLanguage(lang);
    setLocale(lang); // <-- this line ensures widgets follow the selected language
    setOpen(false);
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <a style={{ display: "flex" }} href="https://www.alpenchallengelenzerheide.ch/" target="_blank" rel="noopener noreferrer">
          <Logo src={logo} alt="Logo" />
        </a>
        <a style={{ display: "flex" }} href="https://www.actyvo.app/" target="_blank" rel="noopener noreferrer">
          <Logo src={logoActyvo} alt="LogoActyvo" />
        </a>

      </LeftSection>
      <LiveTitleWrapper onClick={() => { window.location.search = ""; }}>
        <LiveDot $animate={animateDot} />
        <LiveTextWrapper>
          <TextRow>
            <LiveText>LIVE</LiveText>
            <StreamText>TRAC3D</StreamText>
          </TextRow>
          <ProgressBarWrapper>
            <ProgressBar $progress={mapStore.t} />
          </ProgressBarWrapper>
        </LiveTextWrapper>
      </LiveTitleWrapper>
      <RightSection>
        <ShareWrapper>

          <ShareButton onClick={() => uiStore.setInfoPanel(true)} title={getTranslation("info")}>
            <Info size={20} />{getTranslation("info")}
          </ShareButton>
        </ShareWrapper>
        <ShareWrapper>

          <ShareButton onClick={() => share(false)} title={getTranslation("share")}>
            <Share2 size={20} />{getTranslation("share")}
          </ShareButton>
          {Toast}
        </ShareWrapper>
        <Dropdown>
          <DropdownButton onClick={() => setOpen(!open)}>
            <FlagIcon src={flagIcons[currentLang]} alt={currentLang} />
            {!uiStore.isMobile && langLabels[currentLang]}
          </DropdownButton>
          {open && (
            <DropdownList>
              {Object.entries(flagIcons).map(([code, icon]) => (
                <DropdownItem key={code} onClick={() => handleSelect(code)}>
                  <FlagIcon src={icon} alt={code} />{langLabels[code]}
                </DropdownItem>
              ))}
            </DropdownList>
          )}
        </Dropdown>
      </RightSection>
    </HeaderContainer>
  );
});

export default Header;
