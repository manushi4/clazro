import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "app.language";

export type PersistedLanguage = {
  language: string;
  fromStorage: boolean;
};

export async function loadPersistedLanguageWithSource(): Promise<PersistedLanguage> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if (stored) {
      return { language: stored, fromStorage: true };
    }
  } catch {
    // ignore and fall through to default
  }
  return { language: "en", fromStorage: false };
}

export async function loadPersistedLanguage(): Promise<string> {
  const { language } = await loadPersistedLanguageWithSource();
  return language;
}

export async function persistLanguage(lng: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, lng);
  } catch {
    // ignore
  }
}
