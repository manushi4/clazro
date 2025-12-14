/**
 * AI Settings Store
 * Stores API keys and AI-related settings (for testing/development)
 * In production, API keys should be stored server-side
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AI_SETTINGS_KEY = "@settings/ai_settings";

type AIProvider = "gemini" | "openai" | "anthropic";

type AISettingsState = {
  // API Keys (for testing only - not for production)
  geminiApiKey: string | null;
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  
  // Active provider
  activeProvider: AIProvider;
  
  // Loading state
  isLoading: boolean;
  isInitialized: boolean;
};

type AISettingsActions = {
  setApiKey: (provider: AIProvider, key: string | null) => void;
  setActiveProvider: (provider: AIProvider) => void;
  loadSettings: () => Promise<void>;
  clearAllKeys: () => void;
  hasApiKey: (provider: AIProvider) => boolean;
  getActiveApiKey: () => string | null;
};

export const useAISettingsStore = create<AISettingsState & AISettingsActions>((set, get) => ({
  // Initial state
  geminiApiKey: null,
  openaiApiKey: null,
  anthropicApiKey: null,
  activeProvider: "gemini",
  isLoading: true,
  isInitialized: false,

  setApiKey: (provider: AIProvider, key: string | null) => {
    const keyField = `${provider}ApiKey` as keyof AISettingsState;
    set({ [keyField]: key });
    
    // Persist asynchronously
    const state = get();
    const settings = {
      geminiApiKey: provider === "gemini" ? key : state.geminiApiKey,
      openaiApiKey: provider === "openai" ? key : state.openaiApiKey,
      anthropicApiKey: provider === "anthropic" ? key : state.anthropicApiKey,
      activeProvider: state.activeProvider,
    };
    AsyncStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings)).catch((error) => {
      console.error("[AISettingsStore] Failed to persist settings:", error);
    });
  },

  setActiveProvider: (provider: AIProvider) => {
    set({ activeProvider: provider });
    
    // Persist
    const state = get();
    const settings = {
      geminiApiKey: state.geminiApiKey,
      openaiApiKey: state.openaiApiKey,
      anthropicApiKey: state.anthropicApiKey,
      activeProvider: provider,
    };
    AsyncStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings)).catch((error) => {
      console.error("[AISettingsStore] Failed to persist settings:", error);
    });
  },

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(AI_SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        set({
          geminiApiKey: settings.geminiApiKey || null,
          openaiApiKey: settings.openaiApiKey || null,
          anthropicApiKey: settings.anthropicApiKey || null,
          activeProvider: settings.activeProvider || "gemini",
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({ isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error("[AISettingsStore] Failed to load settings:", error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  clearAllKeys: () => {
    set({
      geminiApiKey: null,
      openaiApiKey: null,
      anthropicApiKey: null,
    });
    AsyncStorage.removeItem(AI_SETTINGS_KEY).catch((error) => {
      console.error("[AISettingsStore] Failed to clear settings:", error);
    });
  },

  hasApiKey: (provider: AIProvider) => {
    const state = get();
    const keyField = `${provider}ApiKey` as keyof AISettingsState;
    return !!state[keyField];
  },

  getActiveApiKey: () => {
    const state = get();
    const keyField = `${state.activeProvider}ApiKey` as keyof AISettingsState;
    return state[keyField] as string | null;
  },
}));
