// src/store/uiStore.js
import { makeAutoObservable } from "mobx";

class UIStore {
  isInfoPanelOpen = false;
  lastFavoriteSlotClicked = null;
  favoritePanelCollapsed = false;
  isMobile = false;

  colorSelected = "#30D5C8";  // typical ArcGIS turquoise
  colorFollowing = "#E74C3C"; // typical ArcGIS red
  colorFavorites = "#4E8CFF"; // typical ArcGIS blue
  colorNormal = "#BFDBFF";
  colorStaff = "#FFB74D";     // typical ArcGIS yellow

  constructor() {
    makeAutoObservable(this);

    // Initial check
    this.checkIsMobile();

    // Keep in sync on resize
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.checkIsMobile);
    }
  }

  /** internal utility – sets `isMobile` based on current window width */
  checkIsMobile = () => {
    this.isMobile = window.innerWidth <= 768;
  };

  /** existing actions… */
  setLastFavoriteSlot = (index) => {
    this.lastFavoriteSlotClicked = index;
  };

  setInfoPanel = (isOpen) => {
    this.isInfoPanelOpen = isOpen;
  };

  toggleFavoritePanel = () => {
    this.favoritePanelCollapsed = !this.favoritePanelCollapsed;
  };

  /** you can still override manually if needed */
  setIsMobile = (isMobile) => {
    this.isMobile = isMobile;
  };
}

const uiStore = new UIStore();
export default uiStore;
