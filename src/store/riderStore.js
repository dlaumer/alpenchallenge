// riderStore.js
import { makeAutoObservable } from "mobx";

export class RiderStore {
  riders = {};

  constructor() {
    makeAutoObservable(this);
  }

  // Action to update the riders data when new data is available
  setRiders(newRiders) {
    this.riders = newRiders;
  }
}

// Create and export a default instance for easy import in components like MapView.jsx
const riderStore = new RiderStore();
export default riderStore;
