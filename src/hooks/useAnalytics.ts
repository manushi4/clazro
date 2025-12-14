/**
 * Analytics Hook
 * Per ANALYTICS_TELEMETRY_SPEC.md
 * 
 * Provides analytics tracking for widgets, screens, and user actions.
 * Events are logged to Supabase analytics_events table.
 */

import { useCallback, useRef, useEffect } from "react";
import { Platform } from "react-native";
import { getSupabaseClient, DEMO_CUSTOMER_ID } from "../lib/supabaseClient";
import { useDemoUser } from "./useDemoUser";

type WidgetEventType = "render" | "click" | "data_loaded" | "error" | "visible";

type WidgetEventProperties = {
  action?: string;
  itemId?: string;
  position?: number;
  size?: string;
  loadTime?: number;
  itemCount?: number;
  errorType?: string;
  errorMessage?: string;
  [key: string]: unknown;
};

type ScreenEventProperties = {
  loadTime?: number;
  params?: Record<string, unknown>;
  [key: string]: unknown;
};

type AnalyticsEvent = {
  event_name: string;
  event_category: string;
  customer_id: string;
  user_id: string;
  role: string;
  session_id: string;
  properties: Record<string, unknown>;
  platform: string;
  screen_name?: string;
  client_event_id: string;
  timestamp: string;
};

// Event queue for batching
let eventQueue: AnalyticsEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000; // 5 seconds

// Generate session ID (persists for app session)
const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

/**
 * Flush events to Supabase
 */
async function flushEvents() {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('analytics_events')
      .insert(eventsToSend);
    
    if (error) {
      console.error('[Analytics] Failed to flush events:', error);
      // Re-queue failed events (up to a limit)
      if (eventQueue.length < 100) {
        eventQueue = [...eventsToSend, ...eventQueue];
      }
    } else if (__DEV__) {
      console.log(`[Analytics] Flushed ${eventsToSend.length} events`);
    }
  } catch (err) {
    console.error('[Analytics] Error flushing events:', err);
  }
}

/**
 * Queue an event for batched sending
 */
function queueEvent(event: AnalyticsEvent) {
  eventQueue.push(event);
  
  // Flush immediately if batch size reached
  if (eventQueue.length >= BATCH_SIZE) {
    if (flushTimeout) clearTimeout(flushTimeout);
    flushEvents();
  } else {
    // Schedule flush after interval
    if (!flushTimeout) {
      flushTimeout = setTimeout(() => {
        flushTimeout = null;
        flushEvents();
      }, FLUSH_INTERVAL);
    }
  }
}

export const useAnalytics = () => {
  const { userId, role } = useDemoUser();
  const currentScreen = useRef<string>('');

  // Flush events on unmount
  useEffect(() => {
    return () => {
      if (eventQueue.length > 0) {
        flushEvents();
      }
    };
  }, []);

  /**
   * Create base event object
   */
  const createEvent = useCallback(
    (eventName: string, category: string, properties: Record<string, unknown> = {}): AnalyticsEvent => ({
      event_name: eventName,
      event_category: category,
      customer_id: DEMO_CUSTOMER_ID,
      user_id: userId,
      role,
      session_id: sessionId,
      properties,
      platform: Platform.OS,
      screen_name: currentScreen.current,
      client_event_id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toISOString(),
    }),
    [userId, role]
  );

  /**
   * Track widget events
   * Events: widget_render, widget_click, widget_data_loaded, widget_error, widget_visible
   */
  const trackWidgetEvent = useCallback(
    (widgetId: string, eventType: WidgetEventType, properties?: WidgetEventProperties) => {
      const eventName = `widget_${eventType}`;
      const eventData = createEvent(eventName, 'widget', {
        widgetId,
        ...properties,
      });

      // Log to console in development
      if (__DEV__) {
        console.log(`[Analytics] ${eventName}:`, { widgetId, ...properties });
      }

      queueEvent(eventData);
    },
    [createEvent]
  );

  /**
   * Track screen view events
   */
  const trackScreenView = useCallback(
    (screenId: string, properties?: ScreenEventProperties) => {
      currentScreen.current = screenId;
      
      const eventData = createEvent('screen_view', 'navigation', {
        screenId,
        ...properties,
      });

      if (__DEV__) {
        console.log(`[Analytics] screen_view:`, { screenId, ...properties });
      }

      queueEvent(eventData);
    },
    [createEvent]
  );

  /**
   * Track navigation events
   */
  const trackNavigation = useCallback(
    (screenId: string, params?: Record<string, unknown>) => {
      const eventData = createEvent('navigate_to_screen', 'navigation', {
        screenId,
        params,
      });

      if (__DEV__) {
        console.log(`[Analytics] navigate_to_screen:`, { screenId, params });
      }

      queueEvent(eventData);
    },
    [createEvent]
  );

  /**
   * Track tab change events
   */
  const trackTabChange = useCallback(
    (tabId: string) => {
      const eventData = createEvent('tab_changed', 'navigation', {
        tabId,
      });

      if (__DEV__) {
        console.log(`[Analytics] tab_changed:`, { tabId });
      }

      queueEvent(eventData);
    },
    [createEvent]
  );

  /**
   * Track custom events
   */
  const trackEvent = useCallback(
    (eventName: string, category: string = 'general', properties?: Record<string, unknown>) => {
      const eventData = createEvent(eventName, category, properties || {});

      if (__DEV__) {
        console.log(`[Analytics] ${eventName}:`, properties);
      }

      queueEvent(eventData);
    },
    [createEvent]
  );

  /**
   * Track user action events
   */
  const trackUserAction = useCallback(
    (action: string, target?: string, properties?: Record<string, unknown>) => {
      const eventData = createEvent('user_action', 'interaction', {
        action,
        target,
        ...properties,
      });

      if (__DEV__) {
        console.log(`[Analytics] user_action:`, { action, target, ...properties });
      }

      queueEvent(eventData);
    },
    [createEvent]
  );

  /**
   * Track error events
   */
  const trackError = useCallback(
    (errorType: string, errorMessage: string, properties?: Record<string, unknown>) => {
      const eventData = createEvent('error', 'error', {
        errorType,
        errorMessage,
        ...properties,
      });

      if (__DEV__) {
        console.log(`[Analytics] error:`, { errorType, errorMessage, ...properties });
      }

      // Errors are sent immediately, not batched
      const supabase = getSupabaseClient();
      supabase.from('analytics_events').insert([eventData]).then(({ error }) => {
        if (error) console.error('[Analytics] Failed to log error:', error);
      });
    },
    [createEvent]
  );

  /**
   * Force flush all queued events
   */
  const flush = useCallback(() => {
    flushEvents();
  }, []);

  return {
    trackWidgetEvent,
    trackScreenView,
    trackNavigation,
    trackTabChange,
    trackEvent,
    trackUserAction,
    trackError,
    flush,
    sessionId,
  };
};

export default useAnalytics;
