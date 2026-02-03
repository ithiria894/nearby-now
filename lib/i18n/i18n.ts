import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../../locales/en.json";
import zhHK from "../../locales/zh-HK.json";
import zhCN from "../../locales/zh-CN.json";
import ja from "../../locales/ja.json";
import { APP_TITLE } from "../constants/app";
import { getStoredLanguage, setStoredLanguage } from "./i18n_storage";

export const SUPPORTED_LANGS = ["en", "zh-HK", "zh-CN", "ja"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

function pickInitialLanguage(): SupportedLang {
  const locales = Localization.getLocales?.() ?? [];
  const tag = locales[0]?.languageTag ?? "en";

  const lower = tag.toLowerCase();
  if (
    lower.startsWith("zh-cn") ||
    lower.startsWith("zh-sg") ||
    lower.includes("hans")
  ) {
    return "zh-CN";
  }
  if (lower.startsWith("zh")) {
    return "zh-HK";
  }
  if (lower.startsWith("ja")) {
    return "ja";
  }
  return "en";
}

export const initialLanguage: SupportedLang = pickInitialLanguage();

let initialized = false;

export async function initI18n(): Promise<void> {
  if (initialized || i18n.isInitialized) return;

  const withAppTitle = (bundle: Record<string, unknown>) => ({
    ...bundle,
    app: {
      ...(bundle as { app?: Record<string, unknown> }).app,
      name: APP_TITLE,
    },
  });

  const saved = await getStoredLanguage();
  const savedLang = (saved ?? "") as SupportedLang;
  const lng = SUPPORTED_LANGS.includes(savedLang)
    ? savedLang
    : pickInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: withAppTitle(en) },
      "zh-HK": { translation: withAppTitle(zhHK) },
      "zh-CN": { translation: withAppTitle(zhCN) },
      ja: { translation: withAppTitle(ja) },
    },
    lng,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

  initialized = true;
}

export default i18n;

export async function setLanguage(lng: SupportedLang): Promise<void> {
  await i18n.changeLanguage(lng);
  await setStoredLanguage(lng);
}

export const t = i18n.t.bind(i18n);
