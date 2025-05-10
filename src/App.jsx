// src/App.jsx
import Header from "./components/Header";
import SidePanel from "./components/SidePanel";
import FavoriteList from "./components/FavoriteList";
import Popup from "./components/Popup";
import SelectedRider from "./components/SelectedRider"; // adjust path if needed
import RiderSearch from "./components/RiderSearch";     // adjust path if needed

import MapView from "./components/MapView";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import uiStore from "./store/uiStore";
import GlobalStyles from "./styles/globalStyles";
import { languageStore } from "./store/languageStore";
import { useEffect, useState, useRef } from "react";
import ReplaySlider from "./components/ReplaySlider";
import FollowedRider from "./components/FollowedRider";  // ← new import
import mapStore from "./store/mapStore";                // ← new import

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  transition: margin-left 0.3s ease-in-out;
  margin-left: ${(props) => (props.$panelOpen ? "250px" : "0")};
`;

const MapContainer = styled.div`
  flex: 1;
  position: relative;
  background-color: white;
`;

/* Wrap both cards at top-center and manage their stacking */
const CardsWrapper = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 1000;
`;

const FollowOverlay = styled.div`
  pointer-events: none;
  position: absolute;
  top: 90px;
  left: 40px;
  right: 40px;
  bottom: 50px;
  z-index: 100;

  border: 2px solid #e1003b;
  border-radius: 24px;

  /* this creates the dark outer effect */
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
`;


const App = observer(() => {
  const elevationWidgetRef = useRef();

  useEffect(() => {
    languageStore.initLanguageFromURL();
  }, []);

  const showOverlay = !!mapStore.riderFollowed;


  return (
    <Container>
      <GlobalStyles />
      <SidePanel />
      <RiderSearch />
      <FavoriteList />
      <Header />
      {showOverlay && <FollowOverlay />}

      <MainContent $panelOpen={uiStore.isPanelOpen}>
        <MapContainer>
          <CardsWrapper>
            {mapStore.riderFollowed && (
              <FollowedRider
              />
            )}
            {mapStore.riderSelected && (
              <SelectedRider

              />
            )}
          </CardsWrapper>

          <MapView elevationWidgetRef={elevationWidgetRef} />
          <ReplaySlider />
        </MapContainer>
      </MainContent>
    </Container>
  );
});

export default App;
