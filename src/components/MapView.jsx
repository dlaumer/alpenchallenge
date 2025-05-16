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
import Point from "@arcgis/core/geometry/Point";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Weather from "@arcgis/core/widgets/Weather";
import Editor from "@arcgis/core/widgets/Editor";
import { pointTypeRenderer, favoriteLayerRenderer } from "../utils/renderers";
import ElevationProfile from "@arcgis/core/widgets/ElevationProfile";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import Zoom from "@arcgis/core/widgets/Zoom";
import Compass from "@arcgis/core/widgets/Compass";
import NavigationToggle from "@arcgis/core/widgets/NavigationToggle";

import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import RotationVariable from "@arcgis/core/renderers/visualVariables/RotationVariable";
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
  const animatedLayerRef = useRef(null);
  const favoriteLayerRef = useRef(null);

  const animationFrameRef = useRef(null);
  const latestSimulationRef = useRef(null);
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
        id: "6540a6f1e06f4cf89b1da799a25947e3"
      },
      elevationInfo: {
        mode: "on-the-ground"
      },
      //definitionExpression: "userId IN ('rider_1', 'rider_2', 'rider_3', 'rider_4', 'rider_5', 'rider_6', 'rider_7', 'rider_8', 'rider_9', 'rider_10')",
      refreshInterval: 1,
      visible: false,
      popupEnabled: false
    })

    latestSimulationRef.current = latestSimulation;


    const posHistory = new FeatureLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "816fc3098f5945c3823dbba38824bd4b"
      },
      //definitionExpression: "userId IN ('rider_1', 'rider_2', 'rider_3', 'rider_4', 'rider_5', 'rider_6', 'rider_7', 'rider_8', 'rider_9', 'rider_10')",
      popupEnabled: false
    })



    const route = new FeatureLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "ce3b143124d74aa094ec6ba0da5237fb"
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

    // new: client‑side StreamLayer
    const animatedLayer = new StreamLayer({
      elevationInfo: {
        mode: "on-the-ground"
      },
      // define schema: must include an OID (objectIdField) and a trackId
      fields: [
        { name: "OBJECTID", alias: "ObjectID", type: "oid" },
        { name: "TRACKID", alias: "Rider ID", type: "string" },
        { name: "Heading", alias: "Heading", type: "double" }
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
            width: 3,  // diameter of the object from east to west in meters
            height: 3,  // height of the object in meters
            depth: 3,  // diameter of the object from north to south in meters
            resource: { href: roadBike },
            anchor: "bottom",
            castShadows: false
          })]
        }),
        visualVariables: [new RotationVariable({
          field: "heading",            // must match an attribute in the streamed features
          rotationType: "geographic"
        })
        ]
      }
    });

    animatedLayerRef.current = animatedLayer;


    // new: client‑side StreamLayer
    const favoriteLayer = new StreamLayer({
      elevationInfo: {
        mode: "relative-to-ground"
      },
      // define schema: must include an OID (objectIdField) and a trackId
      fields: [
        { name: "OBJECTID", alias: "ObjectID", type: "oid" },
        { name: "TRACKID", alias: "Rider ID", type: "string" },
        { name: "symbolisation", alias: "symbolisation", type: "double" }
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
      renderer: favoriteLayerRenderer
    });

    favoriteLayerRef.current = favoriteLayer;

    const map = new Map({                // Create a Map object
      basemap: "satellite",
      ground: "world-elevation",
      layers: [favoriteLayer, animatedLayer, latestSimulation, route]
    });

    const view = new SceneView({
      container: mapRef.current,
      map: map,
      camera: {
        position: [
          12.06985173,
          45.58639628,
          23860.02486
        ],
        heading: 0.44,
        tilt: 60.93
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
        query.outFields = ["userId", "distance", "ts", "routeIndex", "previousDistance", "previousTs", "previousRouteIndex", "heading", "speed", "latitude", "longitude", "altitude", "previousLatitude", "previousLongitude", "previousAltitude", "snapped"];
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
    const animate = () => {

      if (mapStore.playing && mapStore.timeReference) {
        animation()
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


    posHistory
      .queryFeatureCount()
      .then(count => {
        console.log("Total features:", count);
        fetchAllFeatures(posHistory, count).then((results) => {
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
      animation();
    }
    mapStore.setJumpTime(false);

  }, [mapStore.jumpTime]);


  useEffect(() => {
    if (viewRef.current) {
      if (mapStore.riderFollowed == "") {
        viewRef.current.goTo({
          position: [
            12.06985173,
            45.58639628,
            23860.02486
          ],
          heading: 0.44,
          tilt: 60.93
        })

        mapStore.setIsFollowing(false);


      }
      else {

        const riders = riderStore.riders;
        const followedId = mapStore.riderFollowed;
        if (followedId && riders[followedId]) {

          let elapsed = Date.now() - mapStore.timeReferenceAnimation;

          if (mapStore.replayMode) {
            elapsed = elapsed * mapStore.replaySpeed;
          }
          const currentTs = mapStore.timeReference + elapsed;

          const interpolated = riderStore.getInterpolatedPosition(followedId, currentTs)
          if (!interpolated) return;
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

      const interpolated = riderStore.getInterpolatedPosition(followedId, currentTs)
      if (!interpolated) return;

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
    console.log("Download progress:", riderStore.downloadProgress);

  }, [riderStore.downloadProgress]);

  let objectIdCounter = 1;

  const animation = () => {

    let features = [];
    const featuresFavorite = [];

    let elapsed = Date.now() - mapStore.timeReferenceAnimation;

    if (mapStore.replayMode) {
      elapsed = elapsed * mapStore.replaySpeed;
    }
    const currentTs = mapStore.timeReference + elapsed;

    if (mapStore.t != 1) {
      mapStore.setTime(currentTs)
    }
    if (!currentTs) return;

    if (riderStore.replayData) {
      Object.keys(riderStore.replayData).forEach((riderId) => {


        if (riderStore.riders[riderId] == null && riderStore[riderId].previousTs != null && riderStore[riderId].previousTs != 0) return;
        const interpolated = riderStore.getInterpolatedPosition(riderId, currentTs)

        if (!interpolated) return;

        features.push({
          attributes: {
            OBJECTID: objectIdCounter++,
            TRACKID: riderId,
            Heading: interpolated.heading,
          },
          geometry: {
            x: interpolated.longitude,
            y: interpolated.latitude,
            spatialReference: { wkid: 4326 }
          }
        });

        if (mapStore.riderSelected == riderId || riderStore.favorites.includes(riderId)) {
          featuresFavorite.push({
            attributes: {
              OBJECTID: objectIdCounter++,
              TRACKID: riderId,
              symbolisation: mapStore.riderSelected == riderId ? "selected" : "favorite",
            },
            geometry: {
              x: interpolated.longitude,
              y: interpolated.latitude,
              spatialReference: { wkid: 4326 }
            }
          });
        }

        // If a rider is followed, update the camera center to that rider's current position.
        if (mapStore.riderFollowed == riderId && mapStore.isFollowing) {
          const calculatedHeading = interpolated.heading;

          // Smooth the heading transition only if the difference is less than 90 degrees.
          let currentHeading = viewRef.current.camera.heading;
          let delta = calculatedHeading - currentHeading;

          // Normalize delta to the range [-180, 180]
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;

          let smoothedHeading;
          if (Math.abs(delta) < 90) {
            let smoothingFactor = mapStore.followMode == "ride" ? 0.005 : 0.005; // Adjust this for smoothness
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
                  longitude: interpolated.longitude,
                  latitude: interpolated.latitude,
                  z: interpolated.altitude,
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
                interpolated.longitude,
                interpolated.latitude,
                interpolated.altitude + 5
              ],
              heading: smoothedHeading,
              tilt: 90
            }


          }



        }
      });
      animatedLayerRef.current.sendMessageToClient({ type: "clear" });
      animatedLayerRef.current.sendMessageToClient({ type: "features", features });

      features = featuresFavorite
      if (featuresFavorite.length > 0) {
        favoriteLayerRef.current.sendMessageToClient({ type: "clear" });
        favoriteLayerRef.current.sendMessageToClient({ type: "features", features });
      }
    }
  }

  return <MapContainer ref={mapRef} />;
});

export default ArcGISMap;
