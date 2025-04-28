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

  favorites = []

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
      mapStore.setTimeReference(processed.smallestTimestamp * 1000);
      mapStore.setTimeReferenceAnimation(Date.now());
    }

    mapStore.setBuffering(false);
    mapStore.setUpdating(false);
  }

  setReplayData(results) {

    this.replayData = {};
    results.features.forEach((feature) => {
      const attr = feature.attributes;
      const riderId = attr.userId;
      const timestamp = new Date(attr.ts_string).getTime(); // or use new Date(attr.ts).toISOString().slice(0, 19)

      if (!this.replayData[riderId]) this.replayData[riderId] = {};
      if (attr.previousPos != "") {
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
  parseAttributes(attr) {

    return {
      ts: attr.ts_string,
      latitude: attr.latitude,
      longitude: attr.longitude,
      altitude: attr.altitude,
      speed: attr.speed,
      heading: attr.heading,
      cumulative: JSON.parse(attr.cumulative),
      path: JSON.parse(attr.path),
      index: attr.routeIndex,
      previousPos: JSON.parse(attr.previousPos)
      // optionally store more
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
      const currentPos = {
        distance: attributes.distance,
        ts: attributes.ts,
        routeIndex: attributes.routeIndex,


        previousDistance: attributes.previousDistance,
        previousTs: attributes.previousTs,
        previousRouteIndex: attributes.previousRouteIndex,

        heading: attributes.heading,
        speed: attributes.speed,
      };

      data[riderId] = currentPos;
      if (this.replayData[riderId] && !attributes.ts in Object.keys(this.replayData[riderId])) {
        this.replayData[riderId][attributes.ts] = currentPos
        this.replayTimestamps[riderId].push(attributes.ts);
      }
      if (attributes.previousTs < smallestTimestamp) {
        smallestTimestamp = attributes.previousTs
      }
    });
    results = null; // free up memory

    return { data: data, smallestTimestamp: smallestTimestamp };
  };

  getInterpolatedLivePosition(riderId, currentTs) {
    const rider = this.riders[riderId];
    if (!rider || !rider.previousTs) return null;

    const timeDiff = (rider.ts - rider.previousTs) * 1000;
    if (timeDiff <= 0) return rider;

    const t = Math.max(0, Math.min(1, (currentTs - rider.previousTs*1000) / timeDiff));

    if (t == 1) {
      mapStore.setBuffering(true);
    }
    mapStore.setT(t);

    if (!mapStore.replayMode) {
      //mapStore.setTime(new Date(prev.ts + t * timeDiff - 60 * 60 * 1000).getTime())
    }
    return {
      ...this.interpolateAlongPath(t, riderId),
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
      currentTs >= cache.before &&
      currentTs <= cache.after
    ) {
      interpolateData = cache;

    }
    else {
      const [before, after] = this.findNearestTimestamps(riderTimestamps, currentTs);
      const dataBefore = riderData[before];
      const dataAfter = riderData[after];
      interpolateData = {
        lastTs: currentTs,
        before,
        after,
        dataBefore,
        dataAfter,
      };
    }
    this.replayCache[riderId] = interpolateData

    const timeDiff = interpolateData.after - interpolateData.before;
    if (timeDiff <= 0) return interpolateData.after;

    const t = Math.max(0, Math.min(1, (currentTs - interpolateData.before) / timeDiff));

    mapStore.setT(t);

    return {
      ...this.interpolateAlongPath(t, interpolateData.dataAfter.path?.geometry?.coordinates, interpolateData.dataAfter.cumulative, interpolateData.dataBefore.altitude, interpolateData.dataAfter.altitude, interpolateData.dataBefore.speed, interpolateData.dataAfter.speed),
      ts: new Date(interpolateData.before) + t * timeDiff,
      prev: interpolateData.dataBefore
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

    const before = timestamps[Math.max(0, left - 1)];
    const after = timestamps[Math.min(timestamps.length - 1, left)];
    return [before, after];
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

  interpolateAlongPath(t, riderId) {
    const rider = riderStore.riders[riderId];
    const distDiff = rider.distance - rider.previousDistance;
    const newDistance = rider.previousDistance + t * distDiff;

    while (newDistance > routeStore.getDistance(rider.previousRouteIndex + 1)) {
      const newIdx = rider.previousRouteIndex + 1;
      riderStore.riders[riderId].previousRouteIndex = newIdx
      riderStore.riders[riderId].heading = routeStore.getHeading(newIdx);
    }

    const i0 = rider.previousRouteIndex
    const i1 = rider.previousRouteIndex < routeStore.dists.length ? rider.previousRouteIndex + 1 : rider.previousRouteIndex
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
    const heading = routeStore.getHeading(i0);

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

    const minTs = Math.min(...allTimestamps);
    const maxTs = Math.max(...allTimestamps);
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
      if (clean.length >= 4) return;
      this.favorites.push(riderId);
    }
  }

}

const riderStore = new RiderStore();
export default riderStore;
