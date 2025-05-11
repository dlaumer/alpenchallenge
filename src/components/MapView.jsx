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
import StreamLayer from "@arcgis/core/layers/StreamLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Weather from "@arcgis/core/widgets/Weather";
import Editor from "@arcgis/core/widgets/Editor";
import { pointTypeRenderer } from "../utils/renderers";
import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";

import ObjectSymbol3DLayer from "@arcgis/core/symbols/ObjectSymbol3DLayer";

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
        id: "827c3c8ca6f74538bae7ce9cc5287b2b"
      },
      elevationInfo: {
        mode: "on-the-ground"
      },
      //definitionExpression: "userId IN ('rider_1', 'rider_2', 'rider_3', 'rider_4', 'rider_5', 'rider_6', 'rider_7', 'rider_8', 'rider_9', 'rider_10')",
      refreshInterval: 1,
      visible: false,
      popupEnabled: false
    })


    const posHistory = new FeatureLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "dab72e3b5d8c40f1bdcd1052d9afcf6e"
      },
      //definitionExpression: "userId IN ('rider_1', 'rider_2', 'rider_3', 'rider_4', 'rider_5', 'rider_6', 'rider_7', 'rider_8', 'rider_9', 'rider_10')",
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
        id: "e861c9af6e194769b8492a37a89c3984"
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


    // new: client‑side StreamLayer
    const animatedLayer = new StreamLayer({
      elevationInfo: {
        mode: "on-the-ground"
      },
      // define schema: must include an OID (objectIdField) and a trackId
      fields: [
        { name: "OBJECTID", alias: "ObjectID", type: "oid" },
        { name: "TRACKID", alias: "Rider ID", type: "string" },
        { name: "SPEED", alias: "Speed", type: "double" }
      ],
      timeInfo: {
        trackIdField: "TRACKID"
      },
      geometryType: "point",               // required
      spatialReference: { wkid: 4326 },    // match your data
      updateInterval: 0,                   // we'll push every frame
      purgeOptions: {
        type: "manual"                     // so we can clear old features each tick
      },
      renderer: {
        type: "simple",                    // simple-marker renderer
        symbol: new PointSymbol3D({
          symbolLayers: [new ObjectSymbol3DLayer({
            width: 15,  // diameter of the object from east to west in meters
            height: 100,  // height of the object in meters
            depth: 15,  // diameter of the object from north to south in meters
            resource: { primitive: "cylinder" },
            material: { color: "red" }
          })]
        })
      }
    });


    layerRef.current = animatedLayer;

    const map = new Map({                // Create a Map object
      basemap: "satellite",
      ground: "world-elevation",
      layers: [animatedLayer, latestSimulation, route, specialPoints]
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


    /**
     * Recursively fetches *all* features from a layer by paginating
     * based on layer.capabilities.query.maxRecordCount.
     */
    /**
 * Recursively fetches all features from a layer by paging
 * via the Query.start / Query.num properties.
 */
    async function fetchAllFeatures(layer, count) {
      const max = 10000;  // e.g. 2000
      let allFeatures = [];
      let start = 0;

      riderStore.setDownloadProgress(0)

      while (true) {
        // build a fresh Query each time
        const query = layer.createQuery();
        //query.outFields = ["*"];
        query.outFields = ["userId", "distance", "ts", "routeIndex", "previousDistance", "previousTs", "previousRouteIndex", "heading", "speed"];

        query.returnGeometry = false;
        query.start = start;                // zero-based offset :contentReference[oaicite:0]{index=0}
        query.num = max;                    // page size
        query.maxRecordCountFactor = 5; // optional, but useful for large datasets

        const result = await layer.queryFeatures(query);

        allFeatures.push(...result.features);

        riderStore.setDownloadProgress(Math.min(allFeatures.length / count, 1))

        // if we hit the service’s maxRecordCount, loop for the next “page”
        if (result.exceededTransferLimit) {
          start += max;
        } else {
          break;
        }
      }

      return allFeatures;
    }



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

    latestSimulation.queryFeatures()
      .then(results => {
        riderStore.setRiders(results);
      })
      .catch(error => {
        console.error("Error querying features:", error);
      });



    const startLoop = () => {
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    const stopLoop = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    // start the loop once
    startLoop();

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
            results = null
          })
            .catch(error => {
              console.error("Error querying features:", error);
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
              result.graphic.attributes.TRACKID
            );

            if (result) {
              mapStore.setRiderSelected(result.graphic.attributes.TRACKID);
              mapStore.setPopupVisible(true);
            }
          }
        }).catch(err => {
          console.error(err);
        });
      });
    });


    const start = performance.now();


    posHistory
      .queryFeatureCount()
      .then(count => {
        console.log("Total features:", count);
        fetchAllFeatures(posHistory, count).then((results) => {
          const duration = performance.now() - start;
          console.log("Time taken to fetch features:", duration/1000, "s");
          riderStore.clearDownloadProgress()
          console.log("Fetched features:", results.length);
          riderStore.setReplayData(results); // create a setter in your store
        });
      })
      .catch(err => console.error(err));




    // Clean up on component unmount.
    return () => {
      // cleanup loop & listeners
      stopLoop();
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
    console.log("Download progress:", riderStore.downloadProgress);

  }, [riderStore.downloadProgress]);



  useEffect(() => {
    const disposer = reaction(
      () => [riderStore.favorites.slice(), mapStore.riderSelected],               // data function
      ([newFavorites, newRiderSelected], [oldFavorites, oldRiderSelected]) => {
        [...newFavorites, ...oldFavorites, newRiderSelected, oldRiderSelected].forEach((riderId) => {
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

  let objectIdCounter = 1;

  const animation = (graphicsMap) => {

    const features = [];

    let elapsed = Date.now() - mapStore.timeReferenceAnimation;

    if (mapStore.replayMode) {
      elapsed = elapsed * mapStore.replaySpeed;
    }
    const currentTs = mapStore.timeReference + elapsed;

    if (mapStore.t != 1) {
      mapStore.setTime(currentTs)

    }
    if (!currentTs) return;

    if (riderStore.riders) {
      Object.keys(mapStore.replayMode ? riderStore.replayData : riderStore.riders).forEach((riderId) => {


        const interpolated = mapStore.replayMode
          ? riderStore.getInterpolatedPosition(riderId, currentTs)
          : riderStore.getInterpolatedLivePosition(riderId, currentTs);

        if (!interpolated) return;

        features.push({
          attributes: {
            OBJECTID: objectIdCounter++,
            TRACKID: riderId,
            SPEED: interpolated.speed
          },
          geometry: {
            x: interpolated.longitude,
            y: interpolated.latitude,
            spatialReference: { wkid: 4326 }
          }
        });

        // If a rider is followed, update the camera center to that rider's current position.
        if (mapStore.riderFollowed == riderId && graphicsMap[mapStore.riderFollowed]) {
          const followedGraphic = graphicsMap[mapStore.riderFollowed].graphic2D;
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
      layerRef.current.sendMessageToClient({ type: "clear" });
      layerRef.current.sendMessageToClient({ type: "features", features });

    }
  }

  return <MapContainer ref={mapRef} />;
});

export default ArcGISMap;
