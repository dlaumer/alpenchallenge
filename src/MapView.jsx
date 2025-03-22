import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import mapStore from "./store/MapStore";
import styled from "styled-components";
import MapView from "@arcgis/core/views/MapView";
import WebMap from "@arcgis/core/WebMap";

const MapContainer = styled.div`
  width: 100%;
  height: 90vh;
`;

const ArcGISMap = observer(() => {
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const webMap = new WebMap({
      portalItem: {
        id: "e691172598f04ea8881cd2a4adaa45ba", // Sample ArcGIS WebMap ID
      },
    });

    const view = new MapView({
      container: mapRef.current,
      map: webMap,
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
