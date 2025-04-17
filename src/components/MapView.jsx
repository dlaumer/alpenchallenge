import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import mapStore from "../store/mapStore";
import riderStore from "../store/riderStore"; // your mobx store for riders
import uiStore from "../store/uiStore";

import styled from "styled-components";
import SceneView from "@arcgis/core/views/SceneView";
import Map from "@arcgis/core/Map";
import Expand from "@arcgis/core/widgets/Expand";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import SceneLayer from "@arcgis/core/layers/SceneLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Weather from "@arcgis/core/widgets/Weather";

import WebStyleSymbol from "@arcgis/core/symbols/WebStyleSymbol";

import bluePinSymbol from "../assets/blue-pin-symbol.svg";
import redPinSymbol from "../assets/red-pin-symbol.svg";
import yellowPinSymbol from "../assets/yellow-pin-symbol.svg";
import roadBike from '../assets/Road_Bike.glb'

import { reaction } from "mobx";

import { Anchor } from "lucide-react";

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
  const graphicsMapRef = useRef(null);

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
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      uiStore.setIsMobile(true)
      uiStore.favoritePanelCollapsed = true;
    }
  }, []);

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
      },
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-line",
          color: "darkred",
          width: "4px"
        }
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
        mode: "relative-to-ground",
        offset: 0
      },
      screenSizePerspectiveEnabled: false,
      featureReduction: {
        type: "selection"
      },
    });

    layerRef.current = animatedLayer;

    const map = new Map({                // Create a Map object
      basemap: "satellite",
      ground: "world-elevation",
      layers: [animatedLayer, latestSimulation, route, buildings]
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

    // Create a toggle button for the Favorite Panel
    const toggleFavoritePanelBtn = document.createElement("button");
    toggleFavoritePanelBtn.innerText = "⭐";
    toggleFavoritePanelBtn.className = "esri-widget esri-widget--button";
    toggleFavoritePanelBtn.style.marginTop = "10px";
    toggleFavoritePanelBtn.style.padding = "6px 12px";
    toggleFavoritePanelBtn.style.cursor = "pointer";
    toggleFavoritePanelBtn.style.border = "none";
    toggleFavoritePanelBtn.style.boxShadow = "none";
    toggleFavoritePanelBtn.style.outline = "none"; // for focus ring
    toggleFavoritePanelBtn.style.background = "white"; // or whatever you like
    toggleFavoritePanelBtn.onclick = () => {
      uiStore.toggleFavoritePanel();
    };

    view.ui.add(toggleFavoritePanelBtn, "top-left");

    const weather = new Weather({
      view: view,  // The view that provides access to the map's "streets-vector" basemap
    });
    const weatherExpand = new Expand({
      content: weather,
      view: view
    });
    view.ui.add(weatherExpand, "top-right")



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
    graphicsMapRef.current = graphicsMap;
    const animate = () => {

      if (mapStore.playing && mapStore.timeReference) {
        animation(graphicsMap)
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
              mapStore.setRiderSelected(result.graphic.attributes.userId);
              mapStore.setPopupVisible(true);
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
    if (!mapStore.playing) {
      animation(graphicsMapRef.current);
    }
    mapStore.setJumpTime(false);

  }, [mapStore.jumpTime]);

  useEffect(() => {
    const disposer = reaction(
      () => [riderStore.favorites.slice(), mapStore.riderSelected],               // data function
      ([newFavorites,newRiderSelected], [oldFavorites,oldRiderSelected]) => {
        [...newFavorites,...oldFavorites, newRiderSelected, oldRiderSelected].forEach((riderId) => {
          if (graphicsMapRef.current[riderId]) {
            const graphic2D = graphicsMapRef.current[riderId].graphic2D;
            const isSelected = mapStore.riderSelected != null && riderId === mapStore.riderSelected;
            graphic2D.symbol = {
              type: "point-3d",
              symbolLayers: [
                {
                  type: "icon",
                  resource: {
                    href: isSelected ? redPinSymbol : riderStore.favorites.includes(riderId) ? yellowPinSymbol : bluePinSymbol, // adjust path if needed
                  },
                  size: 45, // adjust size if needed
                  anchor: "relative",
                  anchorPosition: { x: 0, y: 0.25 },

                },
              ],
              verticalOffset: {
                screenLength: 20,
                maxWorldLength: 50,
                minWorldLength: 15
              },

              callout: {
                type: "line", // autocasts as new LineCallout3D()
                color: "white",
                size: 1,
              }
            };
          }
        });
      }
    );
    return () => disposer();  // clean up
  }, []);

  const animation = (graphicsMap) => {
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
        });

        // Check if the current rider is selected and update its symbol accordingly.
        const isSelected = mapStore.riderSelected != null && riderId === mapStore.riderSelected;

        // Create the symbol
        const symbol2D = {
          type: "point-3d",
          symbolLayers: [
            {
              type: "icon",
              resource: {
                href: isSelected ? redPinSymbol : riderStore.favorites.includes(riderId) ? yellowPinSymbol : bluePinSymbol, // adjust path if needed
              },
              size: 45, // adjust size if needed
              anchor: "relative",
              anchorPosition: { x: 0, y: 0.25 },

            },
          ],
          verticalOffset: {
            screenLength: 20,
            maxWorldLength: 50,
            minWorldLength: 15
          },

          callout: {
            type: "line", // autocasts as new LineCallout3D()
            color: "white",
            size: 1,
          }
        };


        // Create the symbol
        const symbol3D = {
          type: "point-3d",
          symbolLayers: [

            {
              type: "object",
              anchor: "bottom",
              anchorPosition: {
                x: 0,
                y: 0,
                z: 0
              },
              castShadows: false,
              depth: 3,
              heading: interpolated.heading,
              height: 3,
              resource: {
                href: roadBike,
              },
              roll: 0,
              tilt: 0,
              width: 3
            },
          ],
        };

        // Use a plain object to check if the graphic exists
        if (graphicsMap[riderId]) {
          graphicsMap[riderId].graphic3D.geometry = point;
          graphicsMap[riderId].graphic3D.symbol = symbol3D;
          graphicsMap[riderId].graphic2D.geometry = point;
        } else {

          const graphic2D = new Graphic({
            geometry: point,
            attributes: interpolated.prev,
            symbol: symbol2D
          });
          const graphic3D = new Graphic({
            geometry: point,
            attributes: interpolated.prev,
            symbol: symbol3D
          });
          graphicsMap[riderId] = { graphic3D: graphic3D, graphic2D: graphic2D };
          layerRef.current.add(graphicsMap[riderId].graphic3D);
          layerRef.current.add(graphicsMap[riderId].graphic2D);

        }

        // If a rider is followed, update the camera center to that rider's current position.
        if (mapStore.riderFollowed == riderId && graphicsMap[mapStore.riderFollowed]) {
          const followedGraphic = graphicsMap[mapStore.riderFollowed].graphic3D;
          const calculatedHeading = interpolated.heading;

          // Smooth the heading transition only if the difference is less than 90 degrees.
          let currentHeading = viewRef.current.camera.heading;
          let delta = calculatedHeading - currentHeading;

          // Normalize delta to the range [-180, 180]
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;

          let smoothedHeading;
          if (Math.abs(delta) < 90) {
            let smoothingFactor = 0.005; // Adjust this for smoothness
            if (mapStore.replayMode) { smoothingFactor = smoothingFactor * mapStore.replaySpeed }
            smoothedHeading = currentHeading + delta * smoothingFactor;
            smoothedHeading = (smoothedHeading + 360) % 360;
          } else {
            smoothedHeading = calculatedHeading;
          }
          // Use goTo without animation to instantly center the view on the followed rider.
          viewRef.current.goTo(
            {
              center: new Point({
                longitude: followedGraphic.geometry.longitude,
                latitude: followedGraphic.geometry.latitude,
                z: followedGraphic.attributes.altitude,
              }),
              zoom: viewRef.current.zoom < 16 ? 20 : null,
              tilt: 70,
              heading: smoothedHeading,
            },
            { animate: false }
          );

        }
      });
    }
  }

  return <MapContainer ref={mapRef} />;
});

export default ArcGISMap;
