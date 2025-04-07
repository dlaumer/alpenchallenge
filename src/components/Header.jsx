import styled from "styled-components";
import { uiStore } from "../store/uiStore";
import { languageStore } from "../store/languageStore";
import { observer } from "mobx-react-lite";
import { Menu } from "lucide-react";
import { getTranslation } from "../utils/getTranslation";
import mapStore from "../store/MapStore"; // Import the mapStore

const HeaderContainer = styled.header`
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  background: #282c34;
  color: white;
  padding: 0 20px;
  transition: margin-left 0.3s ease-in-out;
  margin-left: ${(props) => (props.panelOpen ? "250px" : "0")};
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 24px;
`;

const Timer = styled.span`
  margin-left: 10px;
  font-size: 16px;
`;

const Title = styled.h1`
  flex: 1;
  text-align: center;
  font-size: 20px;
`;

const LanguageSelector = styled.select`
  background: none;
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;

  option {
    color: black;
    background: white;
  }
`;

const Header = observer(() => {
  return (
    <HeaderContainer panelOpen={uiStore.isPanelOpen}>
      <LeftSection>
        <MenuButton onClick={uiStore.togglePanel}>
          <Menu size={28} />
        </MenuButton>
        <Timer>
          {mapStore.time ? mapStore.time.toLocaleTimeString('en-GB') : "Loading..."}
        </Timer>
      </LeftSection>
      <Title>{getTranslation("title")}</Title>
      <LanguageSelector
        value={languageStore.language}
        onChange={(e) => languageStore.setLanguage(e.target.value)}
      >
        <option value="de">DE</option>
        <option value="fr">FR</option>
        <option value="it">IT</option>
        <option value="en">EN</option>
      </LanguageSelector>
    </HeaderContainer>
  );
});

export default Header;
