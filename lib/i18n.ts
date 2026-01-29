import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import zhHK from "../locales/zh-HK.json";

export const SUPPORTED_LANGS = ["en", "zh-HK"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

function pickInitialLanguage(): SupportedLang {
  const locales = Localization.getLocales?.() ?? [];
  const tag = locales[0]?.languageTag ?? "en";

  if (tag.toLowerCase().startsWith("zh")) {
    return "zh-HK";
  }
  return "en";
}

export const initialLanguage: SupportedLang = pickInitialLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "zh-HK": { translation: zhHK },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;

export function setLanguage(lng: SupportedLang) {
  return i18n.changeLanguage(lng);
}
