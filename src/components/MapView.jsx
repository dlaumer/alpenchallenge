import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import mapStore from "../store/MapStore";
import riderStore from "../store/riderStore"; // your mobx store for riders

import styled from "styled-components";
import SceneView from "@arcgis/core/views/SceneView";
import Map from "@arcgis/core/Map";
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
`;

const ArcGISMap = observer(() => {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const animationStartTimeRef = useRef(Date.now());

  // Define a fixed color palette for riders 1 to 10.
  const fixedColorPalette = {
    "rider_1": "red",
    "rider_2": "blue",
    "rider_3": "green",
    "rider_4": "orange",
    "rider_5": "purple",
    "rider_6": "yellow",
    "rider_7": "cyan",
    "rider_8": "magenta",
    "rider_9": "brown",
    "rider_10": "black"
  };

  useEffect(() => {

    // Create a default unique value renderer with a default symbol.
    const uniqueValueRenderer = new UniqueValueRenderer({
      field: "userId", // This field is expected in your rider data (see Untitled-1.json :contentReference[oaicite:0]{index=0})
      defaultSymbol: new SimpleMarkerSymbol({
        color: "gray",
        size: 8,
        outline: { color: "white", width: 1 }
      }),
      uniqueValueInfos: [] // Will be populated dynamically.
    });

    const latestSimulation = new FeatureLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "5c85573c6f3541b79dfc9b97978a9afa"
      },
      elevationInfo: {
        mode: "on-the-ground"
      },
      refreshInterval: 1,
      visible: false
    })


    // Create a GraphicsLayer that will display the animated points
    const animatedLayer = new GraphicsLayer({
      elevationInfo: {
        mode: "on-the-ground"
      },
    });


    const map = new Map({                // Create a Map object
      basemap: "topo-3d",
      ground: "world-elevation",
      layers: [animatedLayer, latestSimulation]
    });

    const view = new SceneView({
      container: mapRef.current,
      map: map,
      camera: {
        position: [
          9.69501311,
          46.16748120,
          60968.00841
        ],
        heading: 0.14,
        tilt: 36.36
      }
    });

    // When the layer is loaded, query its extent and move the view
    latestSimulation.when(function () {
      latestSimulation.queryExtent().then(function (response) {
        if (response.extent) {
          view.goTo(response.extent).then(function () {
            console.log("Scene moved to feature layer extent.");
          });
        }
      })
    })

    const basemapToggle = new BasemapToggle({
      view: view,  // The view that provides access to the map's "streets-vector" basemap
    });

    view.ui.add(basemapToggle, "top-right")
    // Wait for the map to load, then get the first layer


    // Process the feature layer's query results into the data format expected by your store.
    // For each feature, we assume the attributes include a userId, current coordinates and a previousPos JSON string.
    const processResults = (results) => {
      const newData = {};
      results.features.forEach((feature) => {
        const attributes = feature.attributes;
        const riderId = attributes.userId;
        const currentPos = {
          longitude: attributes.longitude,
          latitude: attributes.latitude,
          altitude: attributes.altitude,
          ts: attributes.ts
        };
        // Parse previousPos (which may be stored as a JSON string)
        let previousPos = attributes.previousPos;
        if (typeof previousPos === "string") {
          try {
            previousPos = JSON.parse(previousPos);
          } catch (e) {
            previousPos = null;
          }
        }
        newData[riderId] = { previousPos, currentPos };
      });
      return newData;
    };

    // Watch the layerView's updating property using reactiveUtils.when.
    view.whenLayerView(latestSimulation).then((layerView) => {
      reactiveUtils.when(
        () => layerView.updating === false,
        () => {
          // Once updating is false, query features for new data.
          latestSimulation.queryFeatures().then((results) => {
            const newData = processResults(results);
            if (JSON.stringify(newData) !== JSON.stringify(riderStore.riders)) {
              riderStore.setRiders(newData);
              // Reset the animation timer when new positions come in.
              animationStartTimeRef.current = Date.now();
            }
          });
        }
      );
    });

    // Animation: Use requestAnimationFrame for smoother updates.
    // Use a plain object to store graphics keyed by rider ID.
    const graphicsMap = {};
    let secondsElapsed = 0;
    const updateInterval = 30; // seconds (matching the feature layer refresh)

    const animate = () => {
      const elapsed = Date.now() - animationStartTimeRef.current;

      // Loop through riders and update or add graphics
      Object.keys(riderStore.riders).forEach((riderId) => {
        const rider = riderStore.riders[riderId];
        if (rider && rider.previousPos && rider.currentPos) {
          const { previousPos: prev, currentPos: curr } = rider;

          // Compute the time difference between the two updates.
          const timeDiff = curr.ts - prev.ts;
          // Calculate interpolation factor (t), clamped between 0 and 1.
          let t = elapsed / timeDiff;
          if (t > 1) t = 1;

          const interpolated = {
            longitude: prev.longitude + (curr.longitude - prev.longitude) * t,
            latitude: prev.latitude + (curr.latitude - prev.latitude) * t,
            altitude: prev.altitude + (curr.altitude - prev.altitude) * t,
          };

          const point = new Point({
            longitude: interpolated.longitude,
            latitude: interpolated.latitude,
            z: interpolated.altitude
          });

          // Use a plain object to check if the graphic exists
          if (graphicsMap[riderId]) {
            graphicsMap[riderId].geometry = point;
          } else {
            const color = fixedColorPalette[riderId] || "blue";

            const graphic = new Graphic({
              geometry: point,
              symbol: {
                type: "simple-marker",
                color: color,
                size: "12px"
              }
            });
            graphicsMap[riderId] = graphic;
            animatedLayer.add(graphic);
          }
        }
      });

      // Request the next animation frame for smooth updates
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    view.when(() => {
      window.view = view;
    });


    // Clean up on component unmount.
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      view.destroy();
    };
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
