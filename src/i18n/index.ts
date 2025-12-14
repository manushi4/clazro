import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "../locales/en/common.json";
import enDashboard from "../locales/en/dashboard.json";
import enAdmin from "../locales/en/admin.json";
import enStudy from "../locales/en/study.json";
import enDoubts from "../locales/en/doubts.json";
import enProgress from "../locales/en/progress.json";
import enProfile from "../locales/en/profile.json";
import enSettings from "../locales/en/settings.json";
import hiCommon from "../locales/hi/common.json";
import hiDashboard from "../locales/hi/dashboard.json";
import hiAdmin from "../locales/hi/admin.json";
import hiStudy from "../locales/hi/study.json";
import hiDoubts from "../locales/hi/doubts.json";
import hiProgress from "../locales/hi/progress.json";
import hiProfile from "../locales/hi/profile.json";
import hiSettings from "../locales/hi/settings.json";
import { loadPersistedLanguageWithSource } from "./persistLanguage";

const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    admin: enAdmin,
    study: enStudy,
    doubts: enDoubts,
    progress: enProgress,
    profile: enProfile,
    settings: enSettings,
  },
  hi: {
    common: hiCommon,
    dashboard: hiDashboard,
    admin: hiAdmin,
    study: hiStudy,
    doubts: hiDoubts,
    progress: hiProgress,
    profile: hiProfile,
    settings: hiSettings,
  },
};

// Initialize synchronously with default language first
// This ensures useTranslation works immediately
i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources,
  lng: "en", // Default to English initially
  fallbackLng: "en",
  ns: ["common", "dashboard", "admin", "study", "doubts", "progress", "profile", "settings"],
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

// Async function to load persisted language preference
export async function initI18n() {
  try {
    const { language } = await loadPersistedLanguageWithSource();
    if (language && language !== i18n.language) {
      await i18n.changeLanguage(language);
    }
  } catch (error) {
    console.warn("[i18n] Failed to load persisted language:", error);
  }
}

export default i18n;
