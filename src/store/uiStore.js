import { makeAutoObservable } from "mobx";

class UIStore {
  isPanelOpen = false;
  lastFavoriteSlotClicked = null;
  favoritePanelCollapsed = false;
  isMobile = false;

  colorSelected = "#30D5C8"; // typical ArcGIS turquoise
  colorFollowing = "#E74C3C"; // typical ArcGIS red
  colorFavorites = "#4E8CFF"; // typical ArcGIS blue
  colorNormal = "#BFDBFF";
  colorStaff = "#FFB74D"; // typical ArcGIS yellow

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
}

const uiStore = new UIStore();
export default uiStore;
