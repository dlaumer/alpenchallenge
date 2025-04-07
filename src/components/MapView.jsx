import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore"; // your mobx store for riders
import ReactDOM from "react-dom/client";

import styled from "styled-components";
import SceneView from "@arcgis/core/views/SceneView";
import Map from "@arcgis/core/Map";
import Expand from "@arcgis/core/widgets/Expand";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import SceneLayer from "@arcgis/core/layers/SceneLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Popup from "./Popup";

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
  const popupRef = useRef(null);

  const popupExpand = useRef(null);
  const basemapGalleryExpand = useRef(null);

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


    const buildings = new SceneLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "a714a2ca145446b79d97aaa7b895ff95"
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
      basemap: "satellite",
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

    const basemapGallery = new BasemapGallery({
      view: view,  // The view that provides access to the map's "streets-vector" basemap
    });
    basemapGalleryExpand.current = new Expand({
      content: basemapGallery,
      view: view
    });
    view.ui.add(basemapGalleryExpand.current, "top-right")


    // Create a div for the popup content
    popupRef.current = document.createElement("div");
    popupRef.current.style.padding = "10px";

    // Render the Popup component into popupRef.current using ReactDOM.createRoot
    ReactDOM.createRoot(popupRef.current).render(<Popup />);

    // Create the Expand widget with the div as its content
    popupExpand.current = new Expand({
      view,
      content: popupRef.current,
      expandIconClass: "esri-icon-description",
      expandTooltip: "Show popup content",
      expanded: false,
    });

    popupExpand.current.watch("expanded", expanded => {
      if (!expanded) {
        //mapStore.toggleFollow(mapStore.riderFollowed);
      }
    })
    // Add the widget to the view's UI (you can change the position as needed)
    view.ui.add(popupExpand.current, "top-right");

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


    // Helper functions to convert between degrees and radians.
    const toRadians = (deg) => deg * Math.PI / 180;
    const toDegrees = (rad) => rad * 180 / Math.PI;

    // Calculates the heading (bearing) from the previous position to the current position.
    const calculateHeading = (prev, curr) => {
      const lat1 = toRadians(prev[1]);
      const lon1 = toRadians(prev[0]);
      const lat2 = toRadians(curr[1]);
      const lon2 = toRadians(curr[0]);
      const dLon = lon2 - lon1;
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      let brng = Math.atan2(y, x);
      brng = toDegrees(brng);
      return (brng + 360) % 360;
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
      let heading = calculateHeading(startPoint, endPoint);
      const interpolatedPoint = [
        startPoint[0] + segmentT * (endPoint[0] - startPoint[0]),
        startPoint[1] + segmentT * (endPoint[1] - startPoint[1])]

      return { interpolatedPoint: interpolatedPoint, heading: heading };
    }

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

          mapStore.setTime(new Date(prev.ts + t * timeDiff - 60 * 60 * 1000))

          const interpolationResult = interpolateAlongPath(t, curr.path.geometry.coordinates, curr.cumulative)
          const interpolated2D = interpolationResult.interpolatedPoint;
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

          // Check if the current rider is selected and update its symbol accordingly.
          const isSelected = mapStore.riderSelected != null && riderId === mapStore.riderSelected;
          const color = fixedColorPalette[riderId] || "blue";
          const symbol = {
            type: "simple-marker",
            color: color,
            size: isSelected ? "20px" : "16px", // Bigger marker when selected
            outline: {
              color: isSelected ? "red" : "white", // Red border if selected, otherwise white
              width: isSelected ? 3 : 0
            }
          };
          // Use a plain object to check if the graphic exists
          if (graphicsMap[riderId]) {
            graphicsMap[riderId].geometry = point;
            graphicsMap[riderId].symbol = symbol; // Update symbol to reflect selection
          } else {

            const graphic = new Graphic({
              geometry: point,
              attributes: prev,
              symbol: symbol
            });
            graphicsMap[riderId] = graphic;
            animatedLayer.add(graphic);
          }

          // If a rider is followed, update the camera center to that rider's current position.
          if (mapStore.riderFollowed == riderId && graphicsMap[mapStore.riderFollowed]) {
            const followedGraphic = graphicsMap[mapStore.riderFollowed];
            const calculatedHeading = interpolationResult.heading;

            // Smooth the heading transition only if the difference is less than 90 degrees.
            let currentHeading = view.camera.heading;
            let delta = calculatedHeading - currentHeading;

            // Normalize delta to the range [-180, 180]
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;

            let smoothedHeading;
            if (Math.abs(delta) < 90) {
              const smoothingFactor = 0.005; // Adjust this for smoothness
              smoothedHeading = currentHeading + delta * smoothingFactor;
              smoothedHeading = (smoothedHeading + 360) % 360;
            } else {
              smoothedHeading = calculatedHeading;
            }
            // Use goTo without animation to instantly center the view on the followed rider.
            viewRef.current.goTo(
              {
                center: followedGraphic.geometry,
                zoom: view.zoom < 16 ? 20 : null,
                tilt: 70,
                heading: smoothedHeading,
              },
              { animate: false }
            );
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
              mapStore.setRiderSelected(result.graphic.attributes.userId)
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

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.visible = mapStore.layerVisible;
    }
  }, [mapStore.layerVisible]);

  useEffect(() => {
    if (viewRef.current) {
      // Show the popup content
      if (mapStore.riderSelected != null) {
        popupExpand.current.expanded = true;
      }
      else {
        mapStore.setPopupContent(null)
        popupRef.current.innerHTML = "Waiting for popup content...";
        popupExpand.current.expanded = false;
      }
    }

  }, [mapStore.riderSelected]);



  return <MapContainer ref={mapRef} />;
});

export default ArcGISMap;
