import Header from "./components/Header";
import SidePanel from "./components/SidePanel";
import MapView from "./components/MapView";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import { uiStore } from "./store/uiStore";
import GlobalStyles from "./styles/globalStyles";
import { languageStore } from "./store/languageStore";
import { useEffect } from "react";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
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
        </MapContainer>
      </MainContent>
    </Container>
  );
});

export default App;
