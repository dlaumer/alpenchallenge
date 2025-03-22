import { makeAutoObservable } from "mobx";

class MapStore {
  layerVisible = true; // Default visibility

  constructor() {
    makeAutoObservable(this);
  }

  toggleLayer() {
    this.layerVisible = !this.layerVisible;
  }
}

const mapStore = new MapStore();
export default mapStore;
