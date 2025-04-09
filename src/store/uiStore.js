import { makeAutoObservable } from "mobx";

class UIStore {
  isPanelOpen = false;
  lastFavoriteSlotClicked = null;

  setLastFavoriteSlot(index) {
    this.lastFavoriteSlotClicked = index;
  }

  constructor() {
    makeAutoObservable(this);
  }

  togglePanel = () => {
    this.isPanelOpen = !this.isPanelOpen;
  };
}

export const uiStore = new UIStore();
export default uiStore;
