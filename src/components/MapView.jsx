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
import Editor from "@arcgis/core/widgets/Editor";
import { pointTypeRenderer, createSymbol, latestSimulationRenderer } from "../utils/renderers";
import ElevationProfile from "@arcgis/core/widgets/ElevationProfile";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import Zoom from "@arcgis/core/widgets/Zoom";
import Compass from "@arcgis/core/widgets/Compass";
import NavigationToggle from "@arcgis/core/widgets/NavigationToggle";

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

const ArcGISMap = observer(({ elevationWidgetRef }) => {
  const viewRef = useRef(null);
  const mapRef = useRef(null);
  const latestSimulationRef = useRef(null);

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
        id: "976e8350026f4fc78a4325e8c600b01d"
      },
      elevationInfo: {
        mode: "absolute-height",
      },
      outFields: ["userId"],
      refreshInterval: 1,
      visible: true,
      popupEnabled: false,
      renderer: new UniqueValueRenderer({
        field: "userId",
        defaultSymbol: createSymbol(bluePinSymbol, 15),
        defaultLabel: "Other riders",
      })
    })
    latestSimulationRef.current = latestSimulation;


    const posHistory = new FeatureLayer({
      url: "https://services1.arcgis.com/i9MtZ1vtgD3gTnyL/arcgis/rest/services/posHistorySimulation1000_4/FeatureServer",
      popupEnabled: false
    })


    const specialPoints = new FeatureLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "398629a847f84793a978adb7d71efa6f"
      },
      elevationInfo: {
        mode: "relative-to-ground",
      },
      renderer: pointTypeRenderer,
      popupTemplate: {
        title: "{Label}", // replace with actual attribute name
        content: [
          {
            type: "fields",
            title: "{title}",
            fieldInfos: [
              { fieldName: "pointType", label: "Type" },
              { fieldName: "description", label: "Description" }, // optional
              { fieldName: "urlLink", label: "URL Link" } // optional

            ]
          }
        ]
      }
    })


    const route = new FeatureLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "86096603da9c49878889f3f92dc2ec55"
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
      },
      popupEnabled: false
    })


    const buildings = new SceneLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "a714a2ca145446b79d97aaa7b895ff95"
      },
      elevationInfo: {
        mode: "on-the-ground"
      },
      popupEnabled: false
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
      popupEnabled: false
    });

    layerRef.current = animatedLayer;

    const map = new Map({                // Create a Map object
      basemap: "satellite",
      ground: "world-elevation",
      layers: [animatedLayer, latestSimulation, route, specialPoints, buildings]
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
      },

      ui: {
        // only keep attribution, drop zoom/compass
        components: ["attribution"]
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


    const weather = new Weather({
      view: view,  // The view that provides access to the map's "streets-vector" basemap
    });
    const weatherExpand = new Expand({
      content: weather,
      view: view
    });
    view.ui.add(weatherExpand, "top-right")

    const edit = new Expand({
      content: new Editor({
        view: view
      }),
      view: view
    });
    view.ui.add(edit, "top-right")



    /*
    posHistory.queryFeatures({
      where: "1=1", // or use a smarter where clause
      outFields: ["*"],
      returnGeometry: true
    }).then((results) => {
      riderStore.setReplayData(results); // create a setter in your store
    });
  */

    // Animation: Use requestAnimationFrame for smoother updates.
    // Use a plain object to store graphics keyed by rider ID.
    const graphicsMap = {};
    graphicsMapRef.current = graphicsMap;
    const animate = () => {

      if (mapStore.playing && mapStore.timeReference) {
        animation()
      }

      // Request the next animation frame for smooth updates
      animationFrameRef.current = requestAnimationFrame(animate);
    };


    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
    // Query the layer for the initial points
    latestSimulation.queryFeatures().then((results) => {
      riderStore.setRiders(results);
    }).catch(err => {
      console.error("Failed to load latestSimulation features:", err);
    });

    view.when(() => {
      const zoomWidget = new Zoom({ view });
      const compassWidget = new Compass({ view });
      const navToggle = new NavigationToggle({
        view
      });
      // add into the bottom-right corner
      view.ui.add([compassWidget, zoomWidget, navToggle], {
        position: "bottom-right"
      });

      window.view = view;
      viewRef.current = view;

      if (elevationWidgetRef?.current) {
        const profileWidget = new ElevationProfile({
          view: view,
          container: elevationWidgetRef.current,
          profiles: [
            {
              type: "ground",
              color: "darkred",
              title: "Ground Elevation"
            }
          ],
          visibleElements: {
            sketchButton: false,
            selectButton: false,
            clearButton: false,
            settingsButton: false,
            legend: false,
            headingLevel: false, // optional, removes <h3>
            elevationInfo: false, // optional, removes labels like "ground"
            chart: true // this must stay if you want the graph
          }
        });

        profileWidget.viewModel.highlightEnabled = false; // ✅ disable highlight glow

        // ⚠️ Query the first route line and set it as input
        route.when(() => {
          const query = route.createQuery();
          query.returnGeometry = true;
          query.outFields = ["*"];
          query.where = "1=1"; // all features

          route.queryFeatures(query).then((results) => {
            const polylineFeature = results.features[0];
            if (polylineFeature?.geometry) {
              const graphic = new Graphic({
                geometry: polylineFeature.geometry,
                symbol: {
                  type: "simple-line",
                  color: [0, 0, 0, 0], // fully transparent RGBA
                  width: 0
                }
              });
              profileWidget.input = graphic; // ✅ Correct: must be a Graphic
            }
          }).catch(err => {
            console.error(err);
          });
        });
      }


      // Watch the layerView's updating property using reactiveUtils.when.
      latestSimulation.on("refresh", function (event) {
        if (event.dataChanged) {
          mapStore.setUpdating(true);
          // Once the layers is refreshed, query features for new data.
          latestSimulation.queryFeatures().then((results) => {
            riderStore.setRiders(results);
          }).catch(err => {
            console.error("Failed to load latestSimulation features:", err);
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
        }).catch(err => {
          console.error(err);
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
      animation();
    }
    mapStore.setJumpTime(false);

  }, [mapStore.jumpTime]);


  useEffect(() => {
    if (viewRef.current) {
      if (mapStore.riderFollowed == "") {
        viewRef.current.goTo({
          position: [
            9.75325244,
            46.20215233,
            34712.77477
          ],
          heading: 358.70,
          tilt: 50.05
        })

        mapStore.setIsFollowing(false);

        mapStore.setRiderFollowedClose(null);
        graphicsMapRef.current = {}
        layerRef.current.removeAll();
        layerRef.current.visible = false;
        latestSimulationRef.current.visible = true;

      }
      else {
        layerRef.current.visible = true;
        latestSimulationRef.current.visible = false;

        const riders = riderStore.riders;
        const followedId = mapStore.riderFollowed;
        if (followedId && riders[followedId]) {

          let elapsed = Date.now() - mapStore.timeReferenceAnimation;

          if (mapStore.replayMode) {
            elapsed = elapsed * mapStore.replaySpeed;
          }
          const currentTs = mapStore.timeReference + elapsed;

          const interpolated = mapStore.replayMode
            ? riderStore.getInterpolatedPosition(followedId, currentTs)
            : riderStore.getInterpolatedLivePosition(followedId, currentTs);
          // Use goTo without animation to instantly center the view on the followed rider.
          viewRef.current.goTo(
            {
              center: new Point({
                longitude: interpolated.longitude,
                latitude: interpolated.latitude,
                z: interpolated.altitude,
              }),
              zoom: viewRef.current.zoom < 16 ? 21 : null,
              tilt: 70,
              heading: interpolated.heading,
            },
          ).then(() => {
            mapStore.setIsFollowing(true);
          });

          // Build map: routeIndex → [riderIds]
          const indexMap = Object.entries(riders).reduce((acc, [id, data]) => {
            const idx = data.currentPos.routeIndex;
            if (idx != null) {
              (acc[idx] = acc[idx] || []).push(id);
            }
            return acc;
          }, {});

          const followedIdx = riders[followedId].currentPos.routeIndex;
          const before = [];
          const after = [];
          let offset = 1;
          const maxIdx = Math.max(...Object.keys(indexMap).map(Number));

          // Fan out until we have enough on each side or we run out of indices
          while ((before.length < 10 || after.length < 10) && offset <= maxIdx) {
            if (after.length < 10) {
              const ahead = indexMap[followedIdx + offset] || [];
              after.push(...ahead);
            }
            if (before.length < 10) {
              const behind = indexMap[followedIdx - offset] || [];
              before.push(...behind);
            }
            offset++;
          }

          mapStore.setRiderFollowedClose([...before, ...after]);
        }
      }
    }

  }, [mapStore.riderFollowed]);


  useEffect(() => {
    if (viewRef.current) {

      const followedId = mapStore.riderFollowed;

      mapStore.setIsFollowing(false);
      let elapsed = Date.now() - mapStore.timeReferenceAnimation;

      if (mapStore.replayMode) {
        elapsed = elapsed * mapStore.replaySpeed;
      }
      const currentTs = mapStore.timeReference + elapsed;

      const interpolated = mapStore.replayMode
        ? riderStore.getInterpolatedPosition(followedId, currentTs)
        : riderStore.getInterpolatedLivePosition(followedId, currentTs);


      if (mapStore.followMode == "fly") {

        // Use goTo without animation to instantly center the view on the followed rider.
        viewRef.current.goTo(
          {
            center: new Point({
              longitude: interpolated.longitude,
              latitude: interpolated.latitude,
              z: interpolated.altitude,
            }),
            zoom: viewRef.current.zoom < 16 ? 21 : null,
            tilt: 70,
            heading: interpolated.heading,
          },
        ).then(() => {
          mapStore.setIsFollowing(true);
        });
      }
      else if (mapStore.followMode == "ride") {
        const cam = viewRef.current.camera.clone();
        // the position is autocast as new Point()
        cam.position = {
          latitude: interpolated.latitude,
          longitude: interpolated.longitude,
          z: interpolated.altitude  // altitude in meters
        }
        cam.heading = interpolated.heading;
        cam.tilt = 90; // tilt in degrees
        // go to the new camera
        viewRef.current.goTo(cam)
        .then(() => {
          mapStore.setIsFollowing(true);
        })
      }
    }

  }, [mapStore.followMode]);

  useEffect(() => {
    const disposer = reaction(
      () => [riderStore.favorites.slice(), mapStore.riderSelected],               // data function
      ([newFavorites, newRiderSelected], [oldFavorites, oldRiderSelected]) => {

        // build uniqueValueInfos
        const uniqueValueInfos = [];

        // selected first (if any)
        if (newRiderSelected) {
          uniqueValueInfos.push({
            value: newRiderSelected,
            symbol: createSymbol(redPinSymbol, 35),
            label: "Selected"
          });
        }

        // then favorites (excluding the selected one)
        newFavorites
          .filter(id => id !== newRiderSelected)
          .forEach(id => {
            uniqueValueInfos.push({
              value: id,
              symbol: createSymbol(yellowPinSymbol, 35),
              label: "Favorite"
            });
          });

        // finally set the new renderer on the layer
        latestSimulationRef.current.renderer = new UniqueValueRenderer({
          field: "userId",
          defaultSymbol: createSymbol(bluePinSymbol, 15),
          defaultLabel: "Other riders",
          uniqueValueInfos: uniqueValueInfos
        });

      }
    );
    return () => disposer();  // clean up
  }, []);

  const animation = () => {
    let elapsed = Date.now() - mapStore.timeReferenceAnimation;

    if (mapStore.replayMode) {
      elapsed = elapsed * mapStore.replaySpeed;
    }
    const currentTs = mapStore.timeReference + elapsed;

    if (mapStore.t != 1) {
      if (mapStore.replayMode) {
        mapStore.setTime(currentTs)

      }
      else {
        mapStore.setTime(currentTs - 60 * 60 * 1000)

      }
    }
    if (!currentTs) return;

    if (riderStore.riders) {
      const oneRider = riderStore.riders[Object.keys(riderStore.riders)[0]];

      const prev = oneRider.previousPos;
      const curr = oneRider.currentPos;

      const timeDiff = curr.ts - prev.ts;

      const t = Math.max(0, Math.min(1, (currentTs - prev.ts) / timeDiff));
      if (t == 1) {
        mapStore.setBuffering(true);
      }
      mapStore.setT(t);

      if (mapStore.riderFollowed && mapStore.riderFollowedClose) {
        [mapStore.riderFollowed, ...mapStore.riderFollowedClose].forEach((riderId) => {


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
          const symbol2D = createSymbol(isSelected ? redPinSymbol : riderStore.favorites.includes(riderId) ? yellowPinSymbol : bluePinSymbol, isSelected ? 35 : riderStore.favorites.includes(riderId) ? 35 : 15);


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
          if (graphicsMapRef.current[riderId]) {
            graphicsMapRef.current[riderId].graphic3D.geometry = point;
            graphicsMapRef.current[riderId].graphic3D.symbol = symbol3D;
            graphicsMapRef.current[riderId].graphic2D.geometry = point;
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
            graphicsMapRef.current[riderId] = { graphic3D: graphic3D, graphic2D: graphic2D };
            layerRef.current.add(graphicsMapRef.current[riderId].graphic3D);
            layerRef.current.add(graphicsMapRef.current[riderId].graphic2D);

          }

          // If a rider is followed, update the camera center to that rider's current position.
          if (mapStore.riderFollowed == riderId && graphicsMapRef.current[mapStore.riderFollowed] && mapStore.isFollowing) {
            const followedGraphic = graphicsMapRef.current[mapStore.riderFollowed].graphic3D;
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
            if (mapStore.followMode == "fly") {
              // Use goTo without animation to instantly center the view on the followed rider.
              viewRef.current.goTo(
                {
                  center: new Point({
                    longitude: followedGraphic.geometry.longitude,
                    latitude: followedGraphic.geometry.latitude,
                    z: followedGraphic.attributes.altitude,
                  }),
                  zoom: viewRef.current.camera.zoom,
                  tilt: viewRef.current.camera.tilt,
                  heading: smoothedHeading,
                },
                { animate: false }
              );
            }
            else if (mapStore.followMode == "ride") {
              viewRef.current.camera = {
                position: [
                  followedGraphic.geometry.longitude,
                  followedGraphic.geometry.latitude,
                  followedGraphic.geometry.altitude + 5
                ],
                heading: smoothedHeading,
                tilt: 90
              }


            }

          }
        });
      }
    }
  }

  return <MapContainer ref={mapRef} />;
});

export default ArcGISMap;
