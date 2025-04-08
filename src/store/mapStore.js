import { makeAutoObservable } from "mobx";

class MapStore {
  layerVisible = true; // Default visibility
  popupContent = null;
  view = null;
  riderSelected = null;
  riderFollowed = null; // New variable

  time = null;
  timeReference = null;
  timeReferenceAnimation = Date.now();
  replayMode = false;
  playing = true;

  replaySpeed = 1; // default to 1x

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



  // New method to toggle the followed rider.
  toggleFollow(riderId) {
    if (this.riderFollowed === riderId) {
      this.riderFollowed = null;
    } else {
      this.riderFollowed = riderId;
    }
  }

  setTime(time) {
    this.time = time;
  }

  setTimeReference(time) {
    this.timeReference = time;
  }
  setTimeReferenceAnimation(time) {
    this.timeReferenceAnimation = time;
  }
  setReplayMode(val) {
    this.replayMode = val;
  }

  togglePlaying() { 
    this.playing = !this.playing;
  }

  setReplaySpeed(speed) {
    this.replaySpeed = speed;
  }
}

const mapStore = new MapStore();
export default mapStore;
