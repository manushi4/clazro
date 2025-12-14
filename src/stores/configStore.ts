import { create } from "zustand";
import { DEFAULT_CONFIG, SAFE_MODE_CONFIG } from "../config/defaultConfig";
import type { CustomerConfig } from "../types/config.types";

type ConfigState = {
  config: CustomerConfig | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  customerId: string | null;
};

type ConfigActions = {
  setConfig: (config: CustomerConfig) => void;
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
  setCustomer: (customerId: string | null) => void;
  resetToDefault: () => void;
  resetToSafeMode: () => void;
  resetForRoleChange: () => void;
};

export const useConfigStore = create<ConfigState & ConfigActions>((set) => ({
  config: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  customerId: null,

  setConfig: (config) =>
    set({
      config,
      isInitialized: true,
      isLoading: false,
      error: null,
    }),

  setLoading: (value) => set({ isLoading: value }),

  setError: (message) => set({ error: message }),

  setCustomer: (customerId) => set({ customerId }),

  resetToDefault: () =>
    set({
      config: DEFAULT_CONFIG,
      isInitialized: true,
      isLoading: false,
      error: null,
    }),

  resetToSafeMode: () =>
    set({
      config: SAFE_MODE_CONFIG,
      isInitialized: true,
      isLoading: false,
      error: "Safe mode active",
    }),

  resetForRoleChange: () =>
    set({
      isInitialized: false,
      isLoading: true,
      error: null,
    }),
}));
