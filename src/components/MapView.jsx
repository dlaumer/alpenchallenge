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
  const viewRef = useRef(null);
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

    const route = new FeatureLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "496d79bd13fe4cbb9b97608a44dc3b12"
      },
      elevationInfo: {
        mode: "on-the-ground"
      }
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
      layers: [animatedLayer, latestSimulation, route]
    });

    const view = new SceneView({
      container: mapRef.current,
      map: map,
      camera: {
        position: [
          9.75325244,
          46.20215233,
          34712.77477
        ],
        heading: 358.70,
        tilt: 50.05
      }
    });

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
          ts: attributes.ts,
          cumulative: JSON.parse(attributes.cumulative),
          path: JSON.parse(attributes.path)
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

    const interpolateAlongPath = (t, coordinates, cumulativeDistances) => {
      // Compute the target distance along the path.
      const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
      const targetDistance = t * totalDistance;

      // Use binary search to find the segment where targetDistance falls.
      let left = 0;
      let right = cumulativeDistances.length - 1;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (cumulativeDistances[mid] < targetDistance) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      // The target lies between indices (left - 1) and left.
      const segmentStartIndex = Math.max(left - 1, 0);
      const segmentEndIndex = left;

      // Compute the relative fraction within the segment.
      const segmentStartDistance = cumulativeDistances[segmentStartIndex];
      const segmentEndDistance = cumulativeDistances[segmentEndIndex];
      const segmentDistance = segmentEndDistance - segmentStartDistance;

      // Avoid division by zero in degenerate cases.
      const segmentT = segmentDistance === 0 ? 0 : (targetDistance - segmentStartDistance) / segmentDistance;

      // Interpolate between the two coordinates.
      const startPoint = coordinates[segmentStartIndex];
      const endPoint = coordinates[segmentEndIndex];
      const interpolatedPoint = [
        startPoint[0] + segmentT * (endPoint[0] - startPoint[0]),
        startPoint[1] + segmentT * (endPoint[1] - startPoint[1])]

      return interpolatedPoint;
    }

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

          const interpolated2D = interpolateAlongPath(t, curr.path.geometry.coordinates, curr.cumulative)
          const interpolated = {
            longitude: interpolated2D[0],
            latitude: interpolated2D[1],
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
              attributes: prev,
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
      viewRef.current = view;
      // Attach a click event to the view.
      view.on("click", (event) => {
        // Use hitTest to check for graphics at the clicked location.
        view.hitTest(event).then((response) => {
          if (response.results.length > 0) {
            // Filter the hitTest results to find one with rider attributes.
            const result = response.results.find((result) =>
              result.graphic &&
              result.graphic.attributes &&
              result.graphic.attributes.userId
            );

            if (result) {
              const graphic = result.graphic;
              const attributes = graphic.attributes;

              // Build the HTML content for the popup.
              const content = `
            <ul>
              <li><b>User:</b> ${attributes.userId}</li>
              <li><b>Run ID:</b> ${attributes.runId}</li>
              <li><b>Contest ID:</b> ${attributes.contestId}</li>
              <li><b>Gig ID:</b> ${attributes.gigId}</li>
              <li><b>Time:</b> ${attributes.ts_string}</li>
              <li><b>Accuracy:</b> ${attributes.accuracy}</li>
              <li><b>Heading:</b> ${attributes.heading}</li>
              <li><b>Speed:</b> ${attributes.speed}</li>
              <li><b>Longitude:</b> ${attributes.longitude}</li>
              <li><b>Latitude:</b> ${attributes.latitude}</li>
              <li><b>Altitude:</b> ${attributes.altitude}</li>
            </ul>
          `;
              // Update the popupStore so that the reaction opens the popup.
              mapStore.setPopupContent({
                userId: attributes.userId,
                content: content,
                location: event.mapPoint
              });

            }
          }
        });
      });
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


  // React to layer visibility changes
  useEffect(() => {
    if (mapStore.view) {
      // Open the popup at the clicked map point.
      viewRef.current.openPopup({
        title: `Rider: ${mapStore.popupContent.userId}`,
        content: mapStore.popupContent.content,
        location: mapStore.popupContent.location
      });
    }

  }, [mapStore.popupContent]);

  return <MapContainer ref={mapRef} />;
});

export default ArcGISMap;
