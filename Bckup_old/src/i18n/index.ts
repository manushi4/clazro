/**
 * i18n Configuration
 * Multi-language support with English and Hindi
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
import hi from './locales/hi.json';

const LANGUAGE_STORAGE_KEY = '@app:language';

// Get device language
const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) {
    return locales[0].languageCode;
  }
  return 'en';
};

// Get stored language or device language
const getStoredLanguage = async (): Promise<string> => {
  try {
    const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLang) {
      return storedLang;
    }
  } catch (error) {
    console.error('Failed to load stored language:', error);
  }
  return getDeviceLanguage();
};

// Save language preference
export const saveLanguagePreference = async (lang: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (error) {
    console.error('Failed to save language:', error);
  }
};

// Initialize i18n
export const initI18n = async () => {
  const language = await getStoredLanguage();

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        en: { translation: en },
        hi: { translation: hi },
      },
      lng: language,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

export default i18n;
