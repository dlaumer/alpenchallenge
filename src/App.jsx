import Header from "./components/Header";
import SidePanel from "./components/SidePanel";
import MapView from "./components/MapView";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import { uiStore } from "./store/uiStore";
import GlobalStyles from "./styles/globalStyles";
import { languageStore } from "./store/languageStore";
import { useEffect, useState } from "react";
import ReplaySlider from "./components/ReplaySlider";

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
  margin-left: ${(props) => (props.panelOpen ? "250px" : "0")};
`;

const MapContainer = styled.div`
  flex: 1;
  position: relative;
  background-color: white;
`;

const App = observer(() => {

  useEffect(() => {
    languageStore.initLanguageFromURL();
  }, []);

  return (
    <Container>
      <GlobalStyles />
      <SidePanel />
      <Header />
      <MainContent panelOpen={uiStore.isPanelOpen}>
        <MapContainer>
          <MapView />
          <ReplaySlider
            
          />
        </MapContainer>
      </MainContent>
    </Container>
  );
});

export default App;
