import { useCallback } from "react";
import i18n from "./index";
import { persistLanguage } from "./persistLanguage";

export function useLanguage() {
  const setLanguage = useCallback(async (lng: string) => {
    await i18n.changeLanguage(lng);
    await persistLanguage(lng);
  }, []);

  return { language: i18n.language, setLanguage };
}
