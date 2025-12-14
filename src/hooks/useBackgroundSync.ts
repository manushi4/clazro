import { useEffect } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useNetworkStatus } from "../offline/networkStore";
import { queryClient } from "../lib/queryClient";
import { addBreadcrumb } from "../error/sentry";

export function useBackgroundSync() {
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const handleAppState = (state: string) => {
      if (state === "active" && isOnline) {
        addBreadcrumb({ category: "sync", message: "foreground_sync", level: "info" });
        queryClient.invalidateQueries();
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [isOnline]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected);
      if (online) {
        addBreadcrumb({ category: "sync", message: "reconnect_sync", level: "info" });
        queryClient.invalidateQueries();
      }
    });
    return () => unsubscribe();
  }, []);
}
