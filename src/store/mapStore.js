import { makeAutoObservable } from "mobx";

class MapStore {
  layerVisible = true; // Default visibility
  popupContent = null;
  view = null;
  riderSelected = null;
  time = null;
  riderFollowed = null; // New variable

  replayMode = false;


  constructor() {
    makeAutoObservable(this);
  }

  toggleLayer() {
    this.layerVisible = !this.layerVisible;
  }

  setPopupContent(popupContent) {
    this.popupContent = popupContent;
  }


  setView(view) {
    this.view = view;
  }

  setRiderSelected(riderSelected) {
    this.riderSelected = riderSelected;
  }

  setTime(time) {
    this.time = time;
  }

  // New method to toggle the followed rider.
  toggleFollow(riderId) {
    if (this.riderFollowed === riderId) {
      this.riderFollowed = null;
    } else {
      this.riderFollowed = riderId;
    }
  }

  setReplayMode(val) {
    this.replayMode = val;
  }
}

const mapStore = new MapStore();
export default mapStore;
