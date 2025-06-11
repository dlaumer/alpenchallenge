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
import Home from "@arcgis/core/widgets/Home";

import { pointTypeRenderer, streamLayerRenderer } from "../utils/renderers";
import ElevationProfile from "@arcgis/core/widgets/ElevationProfile";
import Zoom from "@arcgis/core/widgets/Zoom";
import Compass from "@arcgis/core/widgets/Compass";
import NavigationToggle from "@arcgis/core/widgets/NavigationToggle";
import { riders_info } from '../constants/riders_info_1000';
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { getStateFromUrl, updateUrlFromState } from "../utils/urlState";

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
`;


/**
 * Approximate a small offset in meters on a performance‐critical loop,
 * by treating lat/long as a flat grid.
 *
 * @param {{ longitude: number, latitude: number, z: number }} pt
 * @param {number} headingDeg       // 0 = north, increasing clockwise
 * @param {number} behindM          // meters behind (default 10)
 * @param {number} upM              // meters up   (default 10)
 * @returns {Point}
 */
function getCameraOffsetPointPlanar(pt, headingDeg, behindM = 40, upM = 30) {
  // Convert heading to radians, and flip by 180° to go "behind"
  const bearing = (headingDeg + 180) * Math.PI / 180;

  // Compute local displacement in meters
  const dx = behindM * Math.sin(bearing);   // eastward offset
  const dy = behindM * Math.cos(bearing);   // northward offset

  // Rough conversion: 1° latitude ≈ 111 320 m; 1° longitude ≈ 111 320 m × cos(lat)
  const latRad = pt.latitude * Math.PI / 180;
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos(latRad);

  // Convert meter offsets into degrees
  const deltaLat = dy / metersPerDegLat;
  const deltaLon = dx / metersPerDegLon;

  return {
    latitude: pt.latitude + deltaLat,
    longitude: pt.longitude + deltaLon,
    altitude: pt.altitude + upM
  };
}

const ArcGISMap = observer(() => {
  const viewRef = useRef(null);
  const mapRef = useRef(null);
  const animatedLayerRef = useRef(null);

  const animationFrameRef = useRef(null);
  const latestSimulationRef = useRef(null);
  const popupExpand = useRef(null);
  const basemapGalleryExpand = useRef(null);
  const lastFrameTimeRef = useRef(0);

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
      //definitionExpression: "userId IN ('rider_1')",
      refreshInterval: 1,
      visible: false,
      popupEnabled: false
    })

    latestSimulationRef.current = latestSimulation;


    const posHistory = new FeatureLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "dab72e3b5d8c40f1bdcd1052d9afcf6e"
      },
      //definitionExpression: "userId IN ('rider_1', 'rider_2', 'rider_3', 'rider_4', 'rider_5', 'rider_6', 'rider_7', 'rider_8', 'rider_9', 'rider_10')",
      //definitionExpression: "userId IN ('rider_1')",
      popupEnabled: false
    })

    const specialPoints = new FeatureLayer({
      portalItem: {  // autocasts as esri/portal/PortalItem
        id: "398629a847f84793a978adb7d71efa6f"
      },
      elevationInfo: {
        mode: "relative-to-ground",
      },
      definitionExpression: "event IN ('alpenchallenge')",
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

    // new: client‑side StreamLayer
    const animatedLayer = new StreamLayer({
      objectIdField: "OBJECTID",

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
        type: "manual"                    // so we can clear old features each tick
      },
      renderer: streamLayerRenderer,
      screenSizePerspectiveEnabled: false,
    });

    animatedLayerRef.current = animatedLayer;


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



    const home = new Home({
      view: view
    });
    view.ui.add(home, "bottom-right")

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
    const animate = (time) => {

      const desiredFrameTime = 1000 / mapStore.frameRate; // ms per frame
      if (time - lastFrameTimeRef.current >= desiredFrameTime) {
        if (mapStore.playing) {
          animation()
        }
        lastFrameTimeRef.current = time;
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
        animationFrameRef.current = requestAnimationFrame((t) => animate(t));
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
      mapStore.setView(view);


      reactiveUtils.watch(
        () => viewRef.current.camera,
        (cam) => {
          mapStore.setCamera([
            Number(cam.position.longitude.toFixed(5)),
            Number(cam.position.latitude.toFixed(5)),
            Number(cam.position.z.toFixed(0)),
            Number(cam.heading.toFixed(1)),
            Number(cam.tilt.toFixed(1)),
          ]);
        }
      );
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
          setTimeout(() => {
            animation();
          }, "1000");
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


        mapStore.setIsFollowing(false);


      }
      else {

        if (mapStore.riderFollowed && riderStore.replayData[mapStore.riderFollowed]) {

          const interpolated = riderStore.getInterpolatedPosition(mapStore.riderFollowed)
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
            }, { easing: "linear" }
          ).then(() => {
            mapStore.setIsFollowing(true);
          });
        }
      }
    }

  }, [mapStore.riderFollowed]);

  useEffect(() => {
    if (viewRef.current) {
      mapStore.setIsFollowing(false);

      const interpolated = riderStore.getInterpolatedPosition(mapStore.riderFollowed)
      if (!interpolated) return;

      if (mapStore.followMode == "fly") {

        const cameraPosition = getCameraOffsetPointPlanar(interpolated, interpolated.heading);
        // Use goTo without animation to instantly center the view on the followed rider.
        viewRef.current.goTo(
          {
            center: new Point({
              longitude: cameraPosition.longitude,
              latitude: cameraPosition.latitude,
              z: cameraPosition.altitude,
            }),
            zoom: viewRef.current.camera.zoom,
            tilt: 85,
            heading: interpolated.heading,
          }, { easing: "linear" }
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
        viewRef.current.goTo(cam, { easing: "linear" })
          .then(() => {
            mapStore.setIsFollowing(true);
          })
      }
    }

  }, [mapStore.followMode]);


  useEffect(() => {
    console.log("Download progress:", riderStore.downloadProgress);

  }, [riderStore.downloadProgress]);


  // at the very bottom of your component, after all your other useEffects:
  useEffect(() => {
    // nothing here before
    // whenever selection/favorites/followed change, re-draw immediately:
    if (!mapStore.playing) {
      mapStore.togglePlaying();
      setTimeout(() => {
        mapStore.togglePlaying();
      }, 100); // wait a second to let the map stabilize
    }
  }, [
    mapStore.riderSelected,
    mapStore.riderFollowed,
    // favorites is a new array whenever you toggle, so this will re-fire
    riderStore.favorites
  ]);



  let objectIdCounter = 1;

  const animation = () => {

    if (!mapStore.replayMode) {
      mapStore.setTime(Date.now() - mapStore.lag);
    }
    else if (mapStore.playing) {
      let elapsed = Date.now() - mapStore.timeReferenceAnimation;
      elapsed = elapsed * mapStore.replaySpeed;
      mapStore.setTime(mapStore.timeReference + elapsed);
    }

    let features = [];

    if (riderStore.replayData) {
      Object.keys(riderStore.replayData).forEach((riderId) => {

        if (!riderStore.replayData[riderId] || riderStore.replayTimestamps[riderId].length == 0) return;

        const interpolated = riderStore.getInterpolatedPosition(riderId)
        if (!interpolated) return;

        let isStaff = false;
        if (riders_info[riderId]) {
          if (riders_info[riderId].LastName == "Staff") {
            isStaff = true;
          }
        }
        let symbo = !interpolated.active ? "inactive" : isStaff ? "staff" : riderStore.favorites.includes(riderId) ? "favorite" : "";
        if (mapStore.riderSelected == riderId) {
          symbo = symbo + "_selected";
        }

        features.push({
          attributes: {
            OBJECTID: objectIdCounter++,
            TRACKID: riderId,
            symbolisation: symbo,
          },
          geometry: {
            x: interpolated.longitude,
            y: interpolated.latitude,
            spatialReference: { wkid: 4326 }
          }
        });

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
            let smoothingFactor = mapStore.followMode == "ride" ? 0.01 : 0.01; // Adjust this for smoothness
            if (mapStore.replayMode) { smoothingFactor = smoothingFactor * mapStore.replaySpeed }
            smoothedHeading = currentHeading + delta * smoothingFactor;
            smoothedHeading = (smoothedHeading + 360) % 360;
          } else {
            smoothedHeading = calculatedHeading;
          }
          if (mapStore.followMode == "fly") {
            // Use goTo without animation to instantly center the view on the followed rider.

            const cameraPosition = getCameraOffsetPointPlanar(interpolated, calculatedHeading);
            viewRef.current.camera = {
              position: [
                cameraPosition.longitude,
                cameraPosition.latitude,
                cameraPosition.altitude,
              ],
              tilt: viewRef.current.camera.tilt,
              heading: calculatedHeading,
            };
          }
          else if (mapStore.followMode == "ride") {
            viewRef.current.camera = {
              position: [
                interpolated.longitude,
                interpolated.latitude,
                interpolated.altitude
              ],
              heading: smoothedHeading,
              tilt: 90
            }
          }
        }
      });
      animatedLayerRef.current.sendMessageToClient({ type: "clear" });
      animatedLayerRef.current.sendMessageToClient({ type: "features", features });

    }
  }

  return <MapContainer ref={mapRef} />;
});

export default ArcGISMap;
