// Real-time config subscription - Listens for config changes from Platform Studio
import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient, DEMO_CUSTOMER_ID } from "../lib/supabaseClient";
import { addBreadcrumb } from "../error/sentry";

type ConfigChangeEvent = {
  customer_id: string;
  event_type: string;
  version?: number;
  changed_at: string;
};

export function useConfigSubscription(customerId: string = DEMO_CUSTOMER_ID) {
  const queryClient = useQueryClient();

  const invalidateConfigQueries = useCallback(
    (eventType: string) => {
      addBreadcrumb({
        category: "config",
        message: "config_change_received",
        level: "info",
        data: { customerId, eventType },
      });

      // Invalidate relevant queries based on event type
      switch (eventType) {
        case "navigation_updated":
          queryClient.invalidateQueries({ queryKey: ["navigation-tabs", customerId] });
          break;
        case "layout_updated":
          // Invalidate all screen-layout queries for this customer (matches any role/screenId)
          queryClient.invalidateQueries({ 
            predicate: (query) => 
              query.queryKey[0] === "screen-layout" && 
              query.queryKey[1] === customerId 
          });
          break;
        case "theme_updated":
          queryClient.invalidateQueries({ queryKey: ["customer-theme", customerId] });
          break;
        case "branding_updated":
          queryClient.invalidateQueries({ queryKey: ["customer-branding", customerId] });
          break;
        case "config_published":
        case "config_rolled_back":
          // Invalidate all config queries
          queryClient.invalidateQueries({ queryKey: ["navigation-tabs", customerId] });
          queryClient.invalidateQueries({ queryKey: ["screen-layout", customerId] });
          queryClient.invalidateQueries({ queryKey: ["customer-theme", customerId] });
          queryClient.invalidateQueries({ queryKey: ["customer-branding", customerId] });
          queryClient.invalidateQueries({ queryKey: ["customer-features", customerId] });
          break;
        default:
          // Invalidate all for unknown events
          queryClient.invalidateQueries({ queryKey: ["customer-config", customerId] });
      }
    },
    [queryClient, customerId]
  );

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Subscribe to config_change_events table
    const subscription = supabase
      .channel(`config-changes-${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "config_change_events",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const event = payload.new as ConfigChangeEvent;
          invalidateConfigQueries(event.event_type);
        }
      )
      .subscribe((status) => {
        addBreadcrumb({
          category: "config",
          message: "realtime_subscription_status",
          level: "info",
          data: { status, customerId },
        });
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [customerId, invalidateConfigQueries]);
}
