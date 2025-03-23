import { makeAutoObservable } from "mobx";

class UIStore {
  isPanelOpen = false;

  constructor() {
    makeAutoObservable(this);
  }

  togglePanel = () => {
    this.isPanelOpen = !this.isPanelOpen;
  };
}

export const uiStore = new UIStore();
