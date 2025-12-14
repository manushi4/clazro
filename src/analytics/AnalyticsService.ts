import { getSupabaseClient } from "../lib/supabaseClient";
import type { AnalyticsContext, AnalyticsPayload } from "./types";

let context: AnalyticsContext = {};

export const AnalyticsService = {
  setContext(next: AnalyticsContext) {
    context = { ...context, ...next };
  },

  async track(payload: AnalyticsPayload) {
    const supabase = getSupabaseClient();
    const event = {
      ...payload,
      context,
      timestamp: new Date().toISOString(),
    };

    // Future: send to Supabase or Sentry; for now, log and noop on failure
    console.log("[analytics]", event);

    if (supabase) {
      try {
        await supabase.from("analytics_events").insert({
          name: payload.name,
          params: payload.params ?? {},
          user_id: context.userId ?? null,
          customer_id: context.customerId ?? null,
          role: context.role ?? null,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Analytics insert failed (non-blocking)", err);
      }
    }
  },
};
