/**
 * Network Status Store
 * Per OFFLINE_SUPPORT_SPEC.md
 * 
 * Provides network connectivity status for offline-aware components.
 */

import React, { useEffect, useState, useCallback, createContext, PropsWithChildren } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

type NetworkState = {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  lastChangedAt: number;
};

// Global state (simple implementation without Zustand for now)
let globalNetworkState: NetworkState = {
  isOnline: true,
  isInternetReachable: true,
  connectionType: null,
  lastChangedAt: Date.now(),
};

let listeners: Set<(state: NetworkState) => void> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener(globalNetworkState));
};

/**
 * Initialize network monitoring
 * Call this once at app startup
 */
export const initNetworkMonitoring = () => {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const newState: NetworkState = {
      isOnline: state.isConnected ?? true,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
      lastChangedAt: Date.now(),
    };

    // Only update if changed
    if (
      globalNetworkState.isOnline !== newState.isOnline ||
      globalNetworkState.isInternetReachable !== newState.isInternetReachable
    ) {
      globalNetworkState = newState;
      notifyListeners();

      // Log network changes
      if (__DEV__) {
        console.log(
          `[Network] Status changed: ${newState.isOnline ? "Online" : "Offline"}`,
          newState
        );
      }
    }
  });

  return unsubscribe;
};

/**
 * Hook to get current network status
 * Use this in components that need to react to network changes
 */
export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(globalNetworkState);

  useEffect(() => {
    // Subscribe to changes
    const listener = (state: NetworkState) => {
      setNetworkState(state);
    };

    listeners.add(listener);

    // Get initial state
    NetInfo.fetch().then((state) => {
      const newState: NetworkState = {
        isOnline: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
        lastChangedAt: Date.now(),
      };
      globalNetworkState = newState;
      setNetworkState(newState);
    });

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    const newState: NetworkState = {
      isOnline: state.isConnected ?? true,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
      lastChangedAt: Date.now(),
    };
    globalNetworkState = newState;
    setNetworkState(newState);
    notifyListeners();
    return newState;
  }, []);

  return {
    isOnline: networkState.isOnline,
    isInternetReachable: networkState.isInternetReachable,
    connectionType: networkState.connectionType,
    lastChangedAt: networkState.lastChangedAt,
    refresh,
  };
};

/**
 * Get current network status synchronously (non-reactive)
 * Use for one-time checks, not for UI that needs to update
 */
export const getNetworkStatus = () => globalNetworkState;

/**
 * Check if device is online (synchronous)
 */
export const isOnline = () => globalNetworkState.isOnline;

/**
 * Network Context for Provider pattern
 */
const NetworkContext = createContext<NetworkState>(globalNetworkState);

/**
 * Network Provider component
 * Wrap your app with this to enable network status throughout
 */
export const NetworkProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetworkState>(globalNetworkState);

  useEffect(() => {
    // Initialize monitoring
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const newState: NetworkState = {
        isOnline: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
        lastChangedAt: Date.now(),
      };

      if (
        globalNetworkState.isOnline !== newState.isOnline ||
        globalNetworkState.isInternetReachable !== newState.isInternetReachable
      ) {
        globalNetworkState = newState;
        setNetworkState(newState);

        if (__DEV__) {
          console.log(
            `[Network] Status changed: ${newState.isOnline ? "Online" : "Offline"}`,
            newState
          );
        }
      }
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      const newState: NetworkState = {
        isOnline: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
        lastChangedAt: Date.now(),
      };
      globalNetworkState = newState;
      setNetworkState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return React.createElement(NetworkContext.Provider, { value: networkState }, children);
};

export default useNetworkStatus;
