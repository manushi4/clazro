/**
 * Theme Context
 * Manages theme state (light/dark mode) with persistence
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme } from '../theme';

const THEME_STORAGE_KEY = '@app:theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: typeof LightTheme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        console.log('🎨 [ThemeContext] Loading theme preference...');
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
          console.log('✅ [ThemeContext] Theme loaded from storage:', stored);
          setThemeModeState(stored as ThemeMode);
        } else {
          console.log('📍 [ThemeContext] No saved theme, using default: system');
        }
      } catch (error) {
        console.error('❌ [ThemeContext] Failed to load theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Determine actual theme based on mode
  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  const theme = isDark ? DarkTheme : LightTheme;

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      console.log('🎨 [ThemeContext] Setting theme mode to:', mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
      console.log('✅ [ThemeContext] Theme mode saved and applied:', mode);
    } catch (error) {
      console.error('❌ [ThemeContext] Failed to save theme:', error);
    }
  };

  // Toggle between light and dark (ignores system)
  const toggleTheme = async () => {
    const newMode: ThemeMode = isDark ? 'light' : 'dark';
    console.log('🔄 [ThemeContext] Toggling theme from', isDark ? 'dark' : 'light', 'to', newMode);
    await setThemeMode(newMode);
  };

  const value = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
