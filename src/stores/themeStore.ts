import { create } from "zustand";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode } from "../types/config.types";

const THEME_MODE_KEY = "@settings/theme_mode";

type ThemeState = {
  themeMode: ThemeMode; // "system" | "light" | "dark"
  isDarkMode: boolean; // Resolved value based on mode + system
  isLoading: boolean;
};

type ThemeActions = {
  setThemeMode: (mode: ThemeMode) => void;
  loadPersistedTheme: () => Promise<void>;
};

// Remove unused get parameter warning
/* eslint-disable @typescript-eslint/no-unused-vars */

// Get system color scheme
const getSystemIsDark = () => Appearance.getColorScheme() === "dark";

// Resolve isDarkMode from themeMode
const resolveIsDark = (mode: ThemeMode): boolean => {
  if (mode === "system") return getSystemIsDark();
  return mode === "dark";
};

export const useThemeStore = create<ThemeState & ThemeActions>((set) => ({
  themeMode: "system",
  isDarkMode: getSystemIsDark(),
  isLoading: true,

  setThemeMode: (mode: ThemeMode) => {
    const isDarkMode = resolveIsDark(mode);
    // Update state immediately for instant UI feedback
    set({ themeMode: mode, isDarkMode });
    // Persist asynchronously (fire and forget)
    AsyncStorage.setItem(THEME_MODE_KEY, mode).catch((error) => {
      console.error("[ThemeStore] Failed to persist theme mode:", error);
    });
  },

  loadPersistedTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_MODE_KEY);
      if (stored && ["system", "light", "dark"].includes(stored)) {
        const mode = stored as ThemeMode;
        set({ 
          themeMode: mode, 
          isDarkMode: resolveIsDark(mode), 
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("[ThemeStore] Failed to load persisted theme:", error);
      set({ isLoading: false });
    }
  },
}));

// Listen for system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { themeMode } = useThemeStore.getState();
  if (themeMode === "system") {
    useThemeStore.setState({ isDarkMode: colorScheme === "dark" });
  }
});
