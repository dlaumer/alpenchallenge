import GlobalStyles from "./styles/globalStyles";
import ArcGISMap from "./MapView.jsx";
import LayerToggle from "./components/LayerToggle.jsx";

export default function App() {
  return (
    <>
      <GlobalStyles />
      <LayerToggle />
      <ArcGISMap />
    </>
  );
}
