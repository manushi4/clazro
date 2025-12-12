export type AnalyticsEventName =
  | "screen_view"
  | "tab_changed"
  | "navigate_to_screen"
  | "widget_render"
  | "widget_cta"
  | "widget_error"
  | "config_event"
  | "feature_usage";

export type AnalyticsPayload = {
  name: AnalyticsEventName;
  params?: Record<string, unknown>;
};

export type AnalyticsContext = {
  userId?: string | null;
  customerId?: string | null;
  role?: string | null;
};
