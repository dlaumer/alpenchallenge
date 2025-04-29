import { makeAutoObservable } from "mobx";

class UIStore {
  isPanelOpen = false;
  lastFavoriteSlotClicked = null;
  favoritePanelCollapsed = false;
  isMobile = false;
  elevationProfileCollapsed = true;


  constructor() {
    this.favoritePanelCollapsed = false;

    makeAutoObservable(this);
  }
  
  setLastFavoriteSlot = (index) => {
    this.lastFavoriteSlotClicked = index;
  }

  togglePanel = () => {
    this.favoritePanelCollapsed = !this.favoritePanelCollapsed;
    this.isPanelOpen = !this.isPanelOpen;
  };

  toggleFavoritePanel = () => {
    this.favoritePanelCollapsed = !this.favoritePanelCollapsed;
  };

  setIsMobile = (isMobile) => {
    this.isMobile = isMobile;
  };

  toggleElevationProfile = () => {
    this.elevationProfileCollapsed = !this.elevationProfileCollapsed;
  };
}

const uiStore = new UIStore();
export default uiStore;
