import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import mapStore from "../store/MapStore";
import styled from "styled-components";
import SceneView from "@arcgis/core/views/SceneView";
import Map from "@arcgis/core/Map";
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle";

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
`;

const ArcGISMap = observer(() => {
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const map = new Map({                // Create a Map object
      basemap: "topo-3d",
      ground: "world-elevation"
    });

    const view = new SceneView({
      container: mapRef.current,
      map: map,
      camera: {
        position: [
          9.56084002,
          46.89388359,
          1216.56823
        ],
        heading: 217.28,
        tilt: 75.80
      }
    });

    const basemapToggle = new BasemapToggle({
      view: view,  // The view that provides access to the map's "streets-vector" basemap
    });

    view.ui.add(basemapToggle, "top-right")
    // Wait for the map to load, then get the first layer
    view.when(() => {
      window.view = view;
    });

    return () => view.destroy();
  }, []);

  // React to layer visibility changes
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.visible = mapStore.layerVisible;
    }
  }, [mapStore.layerVisible]);

  return <MapContainer ref={mapRef} />;
});

export default ArcGISMap;
