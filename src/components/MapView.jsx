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


    const posHistory = new FeatureLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "3be23c44c1ae48f3a565ceefb0f22d53"
      }
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


    posHistory.queryFeatures({
      where: "1=1", // or use a smarter where clause
      outFields: ["*"],
      returnGeometry: true
    }).then((results) => {
      riderStore.setReplayData(results); // create a setter in your store
    });


    // Animation: Use requestAnimationFrame for smoother updates.
    // Use a plain object to store graphics keyed by rider ID.
    const graphicsMap = {};
    const animate = () => {

      if (mapStore.playing && mapStore.timeReference) {
        let elapsed = Date.now() - mapStore.timeReferenceAnimation;

        if (mapStore.replayMode) {
          elapsed = elapsed * mapStore.replaySpeed;
        }
        const currentTs = mapStore.timeReference + elapsed;

        if (mapStore.replayMode) {
          mapStore.setTime(currentTs)

        }
        else {
          mapStore.setTime(currentTs - 60 * 60 * 1000)

        }
        if (!currentTs) return;

        if (riderStore.riders) {
          Object.keys(mapStore.replayMode ? riderStore.replayData : riderStore.riders).forEach((riderId) => {


            const interpolated = mapStore.replayMode
              ? riderStore.getInterpolatedPosition(riderId, currentTs)
              : riderStore.getInterpolatedLivePosition(riderId, currentTs);

            if (!interpolated) return;


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
                attributes: interpolated.prev,
                symbol: symbol
              });
              graphicsMap[riderId] = graphic;
              animatedLayer.add(graphic);
            }

            // If a rider is followed, update the camera center to that rider's current position.
            if (mapStore.riderFollowed == riderId && graphicsMap[mapStore.riderFollowed]) {
              const followedGraphic = graphicsMap[mapStore.riderFollowed];
              const calculatedHeading = interpolated.heading;

              // Smooth the heading transition only if the difference is less than 90 degrees.
              let currentHeading = view.camera.heading;
              let delta = calculatedHeading - currentHeading;

              // Normalize delta to the range [-180, 180]
              if (delta > 180) delta -= 360;
              if (delta < -180) delta += 360;

              let smoothedHeading;
              if (Math.abs(delta) < 90) {
                let smoothingFactor = 0.005; // Adjust this for smoothness
                if (mapStore.replayMode) {smoothingFactor = smoothingFactor * mapStore.replaySpeed}
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
          });
        }
      }

      // Request the next animation frame for smooth updates
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Query the layer for the initial points
    latestSimulation.queryFeatures().then((results) => {
      riderStore.setRiders(results);
    });
    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    view.when(() => {
      window.view = view;
      viewRef.current = view;
      // Watch the layerView's updating property using reactiveUtils.when.
      latestSimulation.on("refresh", function (event) {
        if (event.dataChanged) {
          mapStore.setUpdating(true);
          // Once the layers is refreshed, query features for new data.
          latestSimulation.queryFeatures().then((results) => {
            riderStore.setRiders(results);
          });
        }
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
