// riderStore.js
import { makeAutoObservable } from "mobx";

export class RiderStore {
  riders = {};
  replayData = {};

  constructor() {
    makeAutoObservable(this);
  }

  // Action to update the riders data when new data is available
  setRiders(newRiders) {
    this.riders = newRiders;
  }
  
  setReplayData(data) {
    this.replayData = data;
  }
}

// Create and export a default instance for easy import in components like MapView.jsx
const riderStore = new RiderStore();
export default riderStore;
