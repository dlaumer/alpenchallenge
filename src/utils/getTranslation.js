import { translations } from "../constants/translations";
import { languageStore } from "../store/languageStore";

export function getTranslation(key) {
  return translations[key]?.[languageStore.language] || key;
}
