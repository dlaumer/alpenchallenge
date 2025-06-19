import { makeAutoObservable } from "mobx";
import mapStore from "../store/mapStore";
import uiStore from "../store/uiStore";
import routeStoreShort from "./routeStoreShort.js";
import routeStoreLong from "./routeStoreLong.js";
import { act } from "react";
import { riders_info } from '../constants/riders_info_1000';

class RiderStore {
  riders = {}

  replayData = {};         // { riderId: { timestamp: data, ... } }
  replayTimestamps = {};   // { riderId: [timestamp1, timestamp2, ...] }
  replayCache = {};        // { riderId: { lastTs, before, after, dataBefore, dataAfter } }

  downloadProgress = 0;

  favorites = ["rider_1"];

  routeStores = {}
  constructor() {

    this.routeStores = { "short": routeStoreShort, "long": routeStoreLong };
    makeAutoObservable(this);

    this.routeStores["short"].initialize()
      .then(() => {
        this.routeStores["long"].initialize()
          .then(() => {
            console.log(
              `✅ routeStore loaded ${this.routeStores["short"].count + this.routeStores["long"].count} vertices`
            );
          })
      })
      .catch((err) => {
        console.error("Failed to load route vertices", err);
      });
  }

  // Action to update the riders data when new data is available
  setRiders(results) {

    results.features.forEach((feature) => {
      const attributes = feature.attributes;
      const riderId = attributes.userId;
      if (attributes.previousTs != null) {
        const currentPos = this.parseAttributes(attributes);

        if (Object.keys(this.replayData).length > 0) {
          if (!this.replayData[riderId]) {
            this.replayData[riderId] = {};
            this.replayTimestamps[riderId] = [];
          }
          if (!(attributes.ts in Object.keys(this.replayData[riderId]))) {
            this.replayData[riderId][currentPos.ts] = currentPos
            this.replayTimestamps[riderId].push(currentPos.ts);
          }
        }
      }
    });
    results = null; // free up memory
    mapStore.setBuffering(false);
    mapStore.setUpdating(false);
  }

  setReplayData(results) {

    this.replayData = {};
    results.forEach((feature) => {
      const attr = feature.attributes;
      const riderId = attr.userId;
      const timestamp = attr.ts * 1000;

      if (!this.replayData[riderId]) this.replayData[riderId] = {};
      if (!(attr.previousDistance == null && attr.previousLongitude == null)) {
        this.replayData[riderId][timestamp] = this.parseAttributes(attr)
      }
    });


    this.replayTimestamps = {};
    Object.keys(this.replayData).forEach((riderId) => {
      const timestamps = Object.keys(this.replayData[riderId]).map(Number).sort((a, b) => a - b);
      this.replayTimestamps[riderId] = timestamps;
    });

    this.clearDownloadProgress()
    this.replayCache = {};
  }




  // Process the feature layer's query results into the data format expected by your store.
  // For each feature, we assume the attributes include a userId, current coordinates and a previousPos JSON string.
  parseAttributes(attributes) {

    return {
      riderId: attributes.userId,
      distance: attributes.distance,
      ts: attributes.ts * 1000,
      routeIndex: attributes.routeIndex,
      latitude: attributes.latitude,
      longitude: attributes.longitude,
      altitude: attributes.altitude,

      previousDistance: attributes.previousDistance,
      previousTs: attributes.previousTs * 1000,
      previousRouteIndex: attributes.previousRouteIndex,
      previousLatitude: attributes.previousLatitude,
      previousLongitude: attributes.previousLongitude,
      previousAltitude: attributes.previousAltitude,

      heading: attributes.heading,
      speed: attributes.speed,

      snapped: attributes.snapped,
      route: attributes.route,
      battery: attributes.battery,
    };
  };


  getInterpolatedPosition(riderId) {
    const riderTimestamps = this.replayTimestamps[riderId];
    const riderData = this.replayData[riderId];
    if (!riderTimestamps || riderTimestamps.length === 0) return null;

    const cache = this.replayCache[riderId];

    let data = null;
    if (
      cache &&
      mapStore.time >= cache.previousTs &&
      mapStore.time <= cache.ts
    ) {
      data = cache;

    }
    else {
      const nearestTimestamp = this.findNearestTimestamps(riderTimestamps, mapStore.time);
      data = riderData[nearestTimestamp];

      this.replayCache[riderId] = data;
    }

    const timeDiff = data.ts - data.previousTs;
    if (timeDiff <= 0) return null;
    let t = Math.max(0, Math.min(1, (mapStore.time - data.previousTs) / timeDiff));

    let active = true;
    if (timeDiff > 300000) {
      t = Math.floor(t)
      active = false;
    }

    let isStaff = false;
    if (riders_info[riderId]) {
      if (riders_info[riderId].Category == "staff") {
        isStaff = true;
      }
    }

    let result = {}
    if (!isStaff && (data.snapped == null || data.snapped == 1)) {
      result = this.interpolateAlongPath(t, data);
    }
    else if (isStaff || data.snapped == 0) {
      result = this.interpolateBetweenPoints(t, data);
    }
    if (!result.active) {
      result.active = active;
    }
    return result
  }


  interpolate(currentTs, beforeTs, afterTs, dataBefore, dataAfter) {
    const range = afterTs - beforeTs;
    if (range === 0 || !dataBefore || !dataAfter) return dataBefore;

    const t = (currentTs - beforeTs) / range;
    const coords = dataAfter.path?.geometry?.coordinates;
    const cumulative = dataAfter.cumulative;
    if (!coords || !cumulative) return dataAfter;

    return {
      ...this.interpolateAlongPath(t, coords, cumulative, dataBefore.altitude, dataAfter.altitude, dataBefore.speed, dataAfter.speed),
      ts: currentTs
    };
  }


  findNearestTimestamps(timestamps, target) {
    target = target;
    let left = 0;
    let right = timestamps.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (timestamps[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    const after = timestamps[Math.min(timestamps.length - 1, left)];
    return after;
  }

  toRadians(deg) {
    return deg * Math.PI / 180;
  }

  toDegrees(rad) {
    return rad * 180 / Math.PI;
  }

  calculateHeading(start, end) {
    const lat1 = this.toRadians(start[1]);
    const lon1 = this.toRadians(start[0]);
    const lat2 = this.toRadians(end[1]);
    const lon2 = this.toRadians(end[0]);

    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = Math.atan2(y, x);
    return (this.toDegrees(brng) + 360) % 360;
  }

  interpolateAlongPath(t, rider) {
    const riderId = rider.riderId;
    const distDiff = rider.distance - rider.previousDistance;

    if (distDiff < 0) {
      console.warn(`Negative distance difference for rider ${riderId}: ${distDiff}`);
      return {
        longitude: rider.previousLongitude,
        latitude: rider.previousLatitude,
        altitude: rider.previousAltitude,
        heading: rider.heading,
        speed: rider.speed,
        active: false
      };
    }
    const newDistance = rider.previousDistance + t * distDiff;
    let routeIndex = rider.previousRouteIndex;

    while (newDistance > this.routeStores[rider.route].getDistance(routeIndex)) {
      routeIndex = routeIndex + 1;
    }
    routeIndex = Math.max(0, routeIndex - 1);

    const i0 = routeIndex;
    const i1 = routeIndex + 1 < this.routeStores[rider.route].dists.length ? routeIndex + 1 : routeIndex;
    const d0 = this.routeStores[rider.route].getDistance(i0);
    const d1 = this.routeStores[rider.route].getDistance(i1);
    const tSegment = d1 - d0 === 0 ? 0 : (newDistance - d0) / (d1 - d0);

    const p0 = this.routeStores[rider.route].getPoint(i0);
    const p1 = this.routeStores[rider.route].getPoint(i1);
    const interpolatedPoint = [
      p0.long + (p1.long - p0.long) * tSegment,
      p0.lat + (p1.lat - p0.lat) * tSegment,
      p0.alt + (p1.alt - p0.alt) * tSegment

    ];
    const heading = this.routeStores[rider.route].getHeading(i1);

    return {
      longitude: interpolatedPoint[0],
      latitude: interpolatedPoint[1],
      altitude: interpolatedPoint[2],
      heading: heading,
      speed: rider.speed
    };
  }

  interpolateBetweenPoints(t, rider) {
    const oldPoint = [rider.previousLongitude, rider.previousLatitude, rider.previousAltitude];
    const newPoint = [rider.longitude, rider.latitude, rider.altitude];
    if (oldPoint[0] == null || !oldPoint || !newPoint || oldPoint.length < 3 || newPoint.length < 3) {
      console.warn(`Invalid points for rider ${rider.riderId}: oldPoint=${oldPoint}, newPoint=${newPoint}`);
      return {
        longitude: rider.previousLongitude,
        latitude: rider.previousLatitude,
        altitude: rider.previousAltitude,
        heading: rider.heading,
        speed: rider.speed,
        active: false
      };
    }
    const interpolatedPoint = [
      oldPoint[0] + (newPoint[0] - oldPoint[0]) * t,
      oldPoint[1] + (newPoint[1] - oldPoint[1]) * t,
      oldPoint[2] + (newPoint[2] - oldPoint[2]) * t
    ];
    const heading = this.calculateHeading(oldPoint, newPoint);

    return {
      longitude: interpolatedPoint[0],
      latitude: interpolatedPoint[1],
      altitude: interpolatedPoint[2],
      heading: heading,
      speed: rider.speed
    };
  }

  getReplayTimeRange() {
    let minTs = Infinity;
    let maxTs = -Infinity;

    for (const timestamps of Object.values(this.replayTimestamps)) {
      if (Array.isArray(timestamps) && timestamps.length > 0) {
        const first = timestamps[0];
        const last = timestamps[timestamps.length - 1];
        if (first < minTs) minTs = first;
        if (last > maxTs) maxTs = last;
      }
    }

    if (minTs === Infinity || maxTs === -Infinity) {
      return [null, null];
    }

    return [minTs, maxTs];
  }

  setDownloadProgress(progress) {
    this.downloadProgress = progress;
  }
  clearDownloadProgress() {
    this.downloadProgress = null;
  }

  toggleFavorite(riderId) {
    const index = mapStore.lastFavoriteSlotClicked;

    if (this.favorites.includes(riderId)) {
      this.favorites = this.favorites.filter(id => id !== riderId);
    } else if (typeof index === "number") {
      const updated = [...this.favorites];
      while (updated.length <= index) updated.push(null);
      updated[index] = riderId;
      this.favorites = updated;
      uiStore.setLastFavoriteSlot(null);
    } else {
      // only allow max 4
      const clean = this.favorites.filter(Boolean);
      if (clean.length >= 8) return;
      this.favorites.push(riderId);
    }
  }

  setFavorites(favorites) {
    this.favorites = favorites;
  }

}

const riderStore = new RiderStore();
export default riderStore;
