import styled from "styled-components";
import { observer } from "mobx-react-lite";
import { Menu } from "lucide-react";
import uiStore from "../store/uiStore";
import { languageStore } from "../store/languageStore";
import { getTranslation } from "../utils/getTranslation";
import { keyframes } from "styled-components";
import mapStore from "../store/mapStore"; // required for updating state
import { useEffect, useState } from "react";

import logo from "../assets/logo.jpg";
import enFlag from "../assets/flags/en.png";
import deFlag from "../assets/flags/de.png";
import frFlag from "../assets/flags/fr.png";
import itFlag from "../assets/flags/it.png";

const HeaderContainer = styled.header`
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  background-color: #d3dbe5;
  color: black;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-left: ${(props) => (props.panelOpen ? "250px" : "0")};
  transition: margin-left 0.3s ease-in-out;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Logo = styled.img`
  height: 28px;
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
  right: 0; /* Flip from left to right */
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


const LiveTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 400;
  font-family: "Arial Narrow", "Helvetica Neue Condensed", sans-serif;
  letter-spacing: 0.5px;
`;

const expandOnce = keyframes`
  0% { transform: scale(1); }
  30% { transform: scale(2); }
  100% { transform: scale(1); }
`;

const LiveDot = styled.div`
  width: 10px;
  height: 10px;
  background-color: red;
  border-radius: 50%;
  margin-right: 8px;
  animation: ${({ animate }) => (animate ? expandOnce : "none")} 0.6s ease-in-out;
`;

const LiveText = styled.span`
  font-weight: 900;
`;

const StreamText = styled.span`
  font-weight: 400;
  margin-left: 2px;
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

const ProgressBarWrapper = styled.div`
  margin-top: 2px;
  height: 2px;
  background: transparent;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: red;
  width: ${({ progress }) => `${progress * 100}%`};
  transition: width 0.3s ease;
`;



const Header = observer(() => {
  const [open, setOpen] = useState(false);
  const [animateDot, setAnimateDot] = useState(false);

  const currentLang = languageStore.language;

  const flagIcons = {
    de: deFlag,
    fr: frFlag,
    it: itFlag,
    en: enFlag
  };

  const langLabels = {
    de: "Deutsch",
    fr: "Français",
    it: "Italiano",
    en: "English"
  };

  useEffect(() => {
    if (mapStore.updating) {
      setAnimateDot(true);
      const timeout = setTimeout(() => setAnimateDot(false), 600); // Match animation duration
      return () => clearTimeout(timeout);
    }
  }, [mapStore.updating]);

  const handleSelect = (lang) => {
    languageStore.setLanguage(lang);
    setOpen(false);
  };

  return (
    <HeaderContainer panelOpen={uiStore.isPanelOpen}>
      <LeftSection>
        <MenuButton onClick={uiStore.togglePanel}>
          <Menu size={24} />
        </MenuButton>
        <Logo src={logo} alt="Logo" />
        <LiveTitleWrapper>
          <LiveDot animate={animateDot} />
          <LiveTextWrapper>
            <TextRow>
              <LiveText>LIVE</LiveText>
              <StreamText>STREAM</StreamText>
            </TextRow>
            <ProgressBarWrapper>
              <ProgressBar progress={mapStore.t} />
            </ProgressBarWrapper>
          </LiveTextWrapper>
        </LiveTitleWrapper>

      </LeftSection>

      <RightSection>
        <Dropdown>
          <DropdownButton onClick={() => setOpen(!open)}>
            <FlagIcon src={flagIcons[currentLang]} alt={currentLang} />
            {!uiStore.isMobile && langLabels[currentLang]}
          </DropdownButton>
          {open && (
            <DropdownList>
              {Object.entries(flagIcons).map(([code, icon]) => (
                <DropdownItem key={code} onClick={() => handleSelect(code)}>
                  <FlagIcon src={icon} alt={code} />
                  {langLabels[code]}
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
