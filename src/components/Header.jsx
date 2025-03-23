import styled from "styled-components";
import { uiStore } from "../store/uiStore";
import { observer } from "mobx-react-lite";
import { Menu } from "lucide-react";

const HeaderContainer = styled.header`
z-index:100;  
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

const Title = styled.h1`
  flex: 1;
  text-align: center;
  font-size: 20px;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 24px;
`;

const Header = observer(() => {
    return (
        <HeaderContainer panelOpen={uiStore.isPanelOpen}>
            <MenuButton onClick={uiStore.togglePanel}>
                <Menu size={28} />
            </MenuButton>
            <Title>Alpenchallenge</Title>
            <div style={{ width: "28px" }} /> {/* Placeholder for right side */}
        </HeaderContainer>
    );
});

export default Header;
