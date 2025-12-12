import { useNetworkStatus } from "../offline/networkStore";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

export function useOfflineMutationGuard() {
  const { isOnline } = useNetworkStatus();
  const { t } = useTranslation("common");

  const guard = async <T>(fn: () => Promise<T>): Promise<T> => {
    if (!isOnline) {
      throw new Error("offline");
    }
    return fn();
  };

  const warn = () => {
    Alert.alert(
      t("status.offline_title", { defaultValue: "Offline" }),
      t("status.offline_action", { defaultValue: "Go online to perform this action." })
    );
  };

  return { isOnline, guard, warn };
}
