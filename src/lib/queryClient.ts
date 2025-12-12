import { QueryClient, onlineManager } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";

let onlineManagerRegistered = false;

function registerOnlineManager() {
  if (onlineManagerRegistered) return;
  onlineManager.setEventListener((setOnline) => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected));
    });
    return () => unsubscribe();
  });
  onlineManagerRegistered = true;
}

registerOnlineManager();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      retry: 1,
      refetchOnReconnect: true,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export { registerOnlineManager as ensureOnlineManager };
