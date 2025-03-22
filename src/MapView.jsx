import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import mapStore from "./store/MapStore";
import styled from "styled-components";
import SceneView from "@arcgis/core/views/SceneView";
import Map from "@arcgis/core/Map";

const MapContainer = styled.div`
  width: 100%;
  height: 90vh;
`;

const ArcGISMap = observer(() => {
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const map = new Map({                // Create a Map object
      basemap: "topo-vector",
      ground: "world-elevation"
    });

    const view = new SceneView({
      container: mapRef.current,
      map: map,
      camera: {
        position: [
          9.49279182,
          46.54843580,
          8103.52048
        ],
        heading: 9.38,
        tilt: 72.81
      }
    });

    // Wait for the map to load, then get the first layer
    view.when(() => {
      layerRef.current = webMap.layers.getItemAt(0); // Get first layer
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
