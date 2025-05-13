import { makeAutoObservable } from "mobx";
import mapStore from "../store/mapStore";
import uiStore from "../store/uiStore";
import routeStore from "../store/routeStore.js";

class RiderStore {
  riders = {}

  replayData = {};         // { riderId: { timestamp: data, ... } }
  replayTimestamps = {};   // { riderId: [timestamp1, timestamp2, ...] }
  replayCache = {};        // { riderId: { lastTs, before, after, dataBefore, dataAfter } }

  downloadProgress = 0;

  currentSmallestTimestamp = null;

  favorites = ["rider_1", "rider_2", "rider_3", "rider_4"];

  constructor() {
    makeAutoObservable(this);

    routeStore.initialize()
      .then(() => {
        console.log(
          `✅ routeStore loaded ${routeStore.count} vertices`
        );
      })
      .catch((err) => {
        console.error("Failed to load route vertices", err);
      });
  }

  // Action to update the riders data when new data is available
  setRiders(liveData) {

    const processed = this.processLiveResults(liveData);
    liveData = null; // free up memory
    this.riders = processed.data
    this.currentSmallestTimestamp = processed.smallestTimestamp;
    if (!mapStore.replayMode) {
      mapStore.setTimeReference(processed.smallestTimestamp);
      mapStore.setTimeReferenceAnimation(Date.now());
    }

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
      if (attr.previousDistance != "" && attr.previousDistance != null) {
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

      previousDistance: attributes.previousDistance,
      previousTs: attributes.previousTs * 1000,
      previousRouteIndex: attributes.previousRouteIndex,

      heading: attributes.heading,
      speed: attributes.speed,
    };
  };
  // Process the feature layer's query results into the data format expected by your store.
  // For each feature, we assume the attributes include a userId, current coordinates and a previousPos JSON string.
  processLiveResults(results) {
    const data = {};
    let smallestTimestamp = new Date(Date.now() + 100000);
    results.features.forEach((feature) => {
      const attributes = feature.attributes;
      const riderId = attributes.userId;
      const currentPos = this.parseAttributes(attributes);
      if (this.replayData[riderId] && !attributes.ts in Object.keys(this.replayData[riderId])) {
        this.replayData[riderId][attributes.ts * 1000] = currentPos
        this.replayTimestamps[riderId].push(attributes.ts * 1000);
      }
      if (attributes.previousTs < smallestTimestamp) {
        smallestTimestamp = attributes.previousTs
      }
      currentPos.currentRouteIndex = attributes.previousRouteIndex;
      data[riderId] = currentPos;

    });
    results = null; // free up memory

    return { data: data, smallestTimestamp: smallestTimestamp * 1000 };
  };

  getInterpolatedLivePosition(riderId, currentTs) {
    const rider = this.riders[riderId];
    if (!rider || !rider.previousTs) return null;

    const timeDiff = (rider.ts - rider.previousTs);
    if (timeDiff <= 0) return rider;

    const t = Math.max(0, Math.min(1, (currentTs - rider.previousTs) / timeDiff));

    if (t == 1) {
      mapStore.setBuffering(true);
    }
    mapStore.setT(t);

    riderStore.riders[riderId].currentRouteIndex = rider.previousRouteIndex;
    return {
      ...this.interpolateAlongPath(t, rider),
      ts: rider.previousTs + t * timeDiff,
    };
  }

  getInterpolatedPosition(riderId, currentTs) {
    const riderTimestamps = this.replayTimestamps[riderId];
    const riderData = this.replayData[riderId];
    if (!riderTimestamps || riderTimestamps.length === 0) return null;

    const cache = this.replayCache[riderId];
    let interpolateData = null;
    if (
      cache &&
      currentTs >= cache.previousTs &&
      currentTs <= cache.ts
    ) {
      interpolateData = cache;

    }
    else {
      const after = this.findNearestTimestamps(riderTimestamps, currentTs);
      const data = riderData[after];
      interpolateData = {
        lastTs: currentTs,
        data: data
      };
      riderStore.riders[riderId].currentRouteIndex = data.previousRouteIndex
      this.replayCache[riderId] = interpolateData

    }

    const timeDiff = interpolateData.data.ts - interpolateData.data.previousTs;
    if (timeDiff <= 0) return interpolateData.data;

    const t = Math.max(0, Math.min(1, (currentTs - interpolateData.data.previousTs) / timeDiff));

    mapStore.setT(t);

    return {
      ...this.interpolateAlongPath(t, interpolateData.data),
      ts: new Date(interpolateData.data.previousTs) + t * timeDiff,
      prev: interpolateData.data
    }
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
    const newDistance = rider.previousDistance + t * distDiff;

    while (newDistance > routeStore.getDistance(riderStore.riders[riderId].currentRouteIndex + 1)) {
      riderStore.riders[riderId].currentRouteIndex = riderStore.riders[riderId].currentRouteIndex + 1;
    }

    const i0 = riderStore.riders[riderId].currentRouteIndex;
    const i1 = riderStore.riders[riderId].currentRouteIndex + 1 < routeStore.dists.length ? riderStore.riders[riderId].currentRouteIndex + 1 : riderStore.riders[riderId].currentRouteIndex;
    const d0 = routeStore.getDistance(i0);
    const d1 = routeStore.getDistance(i1);
    const tSegment = d1 - d0 === 0 ? 0 : (newDistance - d0) / (d1 - d0);

    const p0 = routeStore.getPoint(i0);
    const p1 = routeStore.getPoint(i1);
    const interpolatedPoint = [
      p0.long + (p1.long - p0.long) * tSegment,
      p0.lat + (p1.lat - p0.lat) * tSegment,
      p0.alt + (p1.alt - p0.alt) * tSegment

    ];
    const heading = routeStore.getHeading(i1);

    return {
      longitude: interpolatedPoint[0],
      latitude: interpolatedPoint[1],
      altitude: interpolatedPoint[2],
      heading: heading,
      speed: rider.speed
    };
  }

  getReplayTimeRange() {
    const allTimestamps = Object.values(this.replayTimestamps).flat();
    if (allTimestamps.length === 0) return [null, null];

    const minTs = allTimestamps[0];
    const maxTs = allTimestamps[allTimestamps.length - 1];
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

}

const riderStore = new RiderStore();
export default riderStore;
