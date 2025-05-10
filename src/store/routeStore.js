// src/stores/routeStore.js
import { makeAutoObservable, runInAction } from "mobx";
import { route } from "../constants/route";

export class RouteStore {
  // typed arrays
  lats = null;   
  longs = null;  
  alts = null;   
  dists = null;  
  heads = null;  
  count = 0;
  isLoaded = false;

  constructor() {
    makeAutoObservable(this, {
      initialize: false  // don’t make initialize() itself observable
    });
  }

  async initialize() {

    // 2) allocate typed‐arrays
    this.count = route.length;
    this.lats  = new Float64Array(this.count);
    this.longs = new Float64Array(this.count);
    this.alts  = new Float32Array(this.count);
    this.dists = new Float32Array(this.count);
    this.heads = new Float32Array(this.count);

    // 3) copy data in one pass
    route.forEach(({ lat, long, alt, dist, head }, i) => {
      this.lats[i]  = long;
      this.longs[i] = lat;
      this.alts[i]  = alt;
      this.dists[i] = dist;
      this.heads[i] = head;
    });

    // 4) mark loaded
    runInAction(() => {
      this.isLoaded = true;
    });
  }

  // helpers
  getHeading(idx)   { return this.heads[idx-1]; }
  getDistance(idx)  { return this.dists[idx -1]; }
  getPoint(idx)     { return { lat: this.lats[idx-1], long: this.longs[idx-1], alt: this.alts[idx-1] }; }
}

const routeStore = new RouteStore();
export default routeStore;