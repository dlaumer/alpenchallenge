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
import { getStateFromUrl, updateUrlFromState } from "./utils/urlState";
import { autorun } from "mobx";
import riderStore from "./store/riderStore";

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
  const initialUrlState = useRef(getStateFromUrl());

  useEffect(() => {
    const state = initialUrlState.current;

    riderStore.setFavorites(state.favorites);
    mapStore.setRiderSelected(state.selected);
    mapStore.toggleFollow(state.followed);
    if (mapStore.riderFollowed) {
      mapStore.setIsFollowing(true);
    }
    mapStore.setFollowMode(state.mode);
    mapStore.setPlaying(state.playing);
    languageStore.setLanguage(state.lang);
    // mark replay mode but defer setting actual time
    mapStore.setReplayMode(state.time !== "live");
    if (state.time === "live") {
      mapStore.setTime(Date.now());
    }

    if (state.cam && mapStore.view) {
      const [lon, lat, z, heading, tilt] = state.cam;
      mapStore.view.camera = {
        position: [lon, lat, z],
        heading: heading,
        tilt: tilt
      };
    }
  }, [mapStore.view]);


  // 2) Once replayData arrives (only happens once), restore the URL time
  useEffect(() => {
    const state = initialUrlState.current;

    if (
      mapStore.replayMode &&
      state.time !== "live" &&
      Object.keys(riderStore.replayData).length > 0
    ) {
      const raw = Number(state.time);
      const [start, end] = riderStore.getReplayTimeRange();
      const ts = raw >= start && raw <= end ? raw : start;
      mapStore.setTime(ts);
      mapStore.setTimeReference(ts);
      mapStore.setTimeReferenceAnimation(Date.now());
      
    }
  }, [riderStore.replayData]);



  useEffect(() => {
    const dispose = autorun(() => {
      updateUrlFromState({
        favorites: riderStore.favorites,
        selected: mapStore.riderSelected,
        followed: mapStore.riderFollowed,
        time: mapStore.replayMode ? mapStore.time : "live",
        mode: mapStore.followMode,
        playing: mapStore.playing,
        lang: languageStore.language,
        camera: mapStore.camera
      });
    });

    return () => dispose(); // clean up autorun on unmount
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
