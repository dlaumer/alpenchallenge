import { makeAutoObservable } from "mobx";

class LanguageStore {
  language = "de"; // Default language is German

  constructor() {
    makeAutoObservable(this);
    this.initLanguageFromURL();
  }

  setLanguage(lang) {
    this.language = lang;
    this.updateURL(lang);
  }

  initLanguageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    let lang = urlParams.get("lang");

    if (!lang) {
      lang = "de"; // Default to German
      this.updateURL(lang);
    }

    this.language = lang;
  }

  updateURL(lang) {
    const url = new URL(window.location);
    url.searchParams.set("lang", lang);
    window.history.replaceState({}, "", url);
  }
}

export const languageStore = new LanguageStore();
