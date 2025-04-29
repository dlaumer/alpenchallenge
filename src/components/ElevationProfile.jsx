import React from "react";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import uiStore from "../store/uiStore";
const Container = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: ${(props) => (props.collapsed ? "30px" : "220px")};
  background-color: #ffffffee;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  transition: height 0.3s ease;
  display: flex;
  flex-direction: column;
  z-index: 99;
`;

const Header = styled.div`
  height: 30px;
  flex-shrink: 0;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  user-select: none;
`;

const Content = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  display: ${(props) => (props.hidden ? "none" : "block")};
`;

const WidgetDiv = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;



const ElevationProfile = observer(({ widgetRef }) => {
    return (
        <Container collapsed={uiStore.elevationProfileCollapsed}>
            <Header onClick={uiStore.toggleElevationProfile}>
                Elevation Profile {uiStore.elevationProfileCollapsed ? "▴" : "▾"}
            </Header>
            <Content hidden={uiStore.elevationProfileCollapsed}>
                <WidgetDiv ref={widgetRef} />
            </Content>
        </Container>

    );
});


export default ElevationProfile;
