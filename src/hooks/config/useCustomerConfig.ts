import { useEffect } from "react";
import { CustomerConfigService } from "../../services/config/customerConfigService";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useConfigStore } from "../../stores/configStore";
import { STATIC_NAVIGATION, STATIC_DASHBOARD, DEFAULT_CONFIG } from "../../config/defaultConfig";
import type { Role } from "../../types/permission.types";
import { loadCustomerConfigFromCache } from "../../offline/configCache";
import {
  loadPersistedLanguageWithSource,
  persistLanguage,
} from "../../i18n/persistLanguage";
import i18n from "../../i18n";

export function useCustomerConfig(customerSlug: string | null, role: Role = "student", userId?: string | null) {
  const { config, isLoading, isInitialized, error, setConfig, setLoading, setError } =
    useConfigStore();

  const useStaticConfig = process.env.USE_DYNAMIC_CONFIG === "false";
  const useStaticNav = process.env.USE_DYNAMIC_NAV === "false";
  const useStaticDashboard = process.env.USE_DYNAMIC_DASHBOARD === "false";

  useEffect(() => {
    if (!customerSlug || isInitialized) return;

    (async () => {
      try {
        setLoading(true);
        if (useStaticConfig) {
          setConfig(DEFAULT_CONFIG);
          return;
        }

        const cfg = await CustomerConfigService.loadConfigForCustomer(customerSlug, role, userId);
        if (useStaticNav) {
          cfg.navigation = STATIC_NAVIGATION;
        }
        if (useStaticDashboard) {
          cfg.dashboard = STATIC_DASHBOARD;
        }
        setConfig(cfg);
      } catch (err) {
        console.error("[useCustomerConfig] Error loading config:", err);
        const message = err instanceof Error ? err.message : "Failed to load config";
        const cached = await loadCustomerConfigFromCache(customerSlug);
        if (cached) {
          setConfig(cached);
          setError(null);
        } else {
          // Even on error, use DEFAULT_CONFIG so app can render
          setConfig(DEFAULT_CONFIG);
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [customerSlug, role, userId, isInitialized, useStaticConfig, useStaticNav, useStaticDashboard, setConfig, setError, setLoading]);

  // Align app language with persisted choice or customer default
  useEffect(() => {
    (async () => {
      if (!config) return;
      const { language, fromStorage } = await loadPersistedLanguageWithSource();
      const resolvedLanguage = fromStorage
        ? language
        : config.theme?.defaultLanguage ?? language;

      if (resolvedLanguage && i18n.language !== resolvedLanguage) {
        await i18n.changeLanguage(resolvedLanguage);
        if (!fromStorage) {
          await persistLanguage(resolvedLanguage);
        }
      }
    })();
  }, [config?.theme?.defaultLanguage]);

  // Realtime invalidation on config changes for this customer
  useEffect(() => {
    const supabase = getSupabaseClient();
    const customerId = config?.customer.id;
    if (!supabase || !customerSlug || !customerId) return;

    const channel = supabase
      .channel(`config-changes-${customerId}-${role}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "config_change_events",
          filter: `customer_id=eq.${customerId}`,
        },
        async () => {
          try {
            setLoading(true);
            const refreshed = await CustomerConfigService.loadConfigForCustomer(customerSlug, role);
            setConfig(refreshed);
          } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to refresh config";
            setError(message);
          } finally {
            setLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config?.customer.id, customerSlug, role, setConfig, setError, setLoading]);

  return { config, isLoading, isInitialized, error };
}
