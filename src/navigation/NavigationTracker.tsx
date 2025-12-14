/**
 * Navigation Tracker
 * Per ANALYTICS_TELEMETRY_SPEC.md
 *
 * Automatically tracks screen views when navigation state changes.
 * Integrates with React Navigation and useAnalytics hook.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import {
  NavigationContainerRef,
  NavigationState,
  NavigationContainer,
  NavigationContainerProps,
} from '@react-navigation/native';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { getSupabaseClient, DEMO_CUSTOMER_ID } from '../lib/supabaseClient';
import { useDemoUser } from '../hooks/useDemoUser';

// Session ID for tracking
const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

// Track screen view times for duration calculation
const screenStartTimes: Map<string, number> = new Map();

// Current screen name (module-level for access in logEvent)
let currentScreenName: string | undefined;

/**
 * Get the current route name from navigation state
 */
function getActiveRouteName(state: NavigationState | undefined): string | undefined {
  if (!state) return undefined;

  const route = state.routes[state.index];

  // Dive into nested navigators
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }

  return route.name;
}

/**
 * Get route params from navigation state
 */
function getActiveRouteParams(
  state: NavigationState | undefined
): Record<string, unknown> | undefined {
  if (!state) return undefined;

  const route = state.routes[state.index];

  if (route.state) {
    return getActiveRouteParams(route.state as NavigationState);
  }

  return route.params as Record<string, unknown> | undefined;
}

/**
 * Log event to Supabase (module-level function)
 */
async function logAnalyticsEvent(
  eventName: string,
  category: string,
  properties: Record<string, unknown>,
  userId: string,
  role: string
) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      event_category: category,
      customer_id: DEMO_CUSTOMER_ID,
      user_id: userId,
      role,
      session_id: sessionId,
      properties,
      platform: Platform.OS,
      screen_name: (properties.screenId as string) || currentScreenName,
      client_event_id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (__DEV__) {
      console.error('[NavigationTracker] Failed to log event:', error);
    }
  }
}

type NavigationTrackerProps = {
  children: React.ReactElement<NavigationContainerProps>;
};

/**
 * Navigation tracker component that wraps NavigationContainer
 * Automatically tracks screen views on navigation state changes
 */
export const NavigationTracker: React.FC<NavigationTrackerProps> = ({ children }) => {
  const { userId, role } = useDemoUser();
  const navigationRef = useRef<NavigationContainerRef<Record<string, unknown>>>(null);
  const routeNameRef = useRef<string | undefined>(undefined);
  const isReadyRef = useRef<boolean>(false);

  /**
   * Track screen view event
   */
  const trackScreenView = useCallback(
    async (screenName: string, params?: Record<string, unknown>) => {
      const now = Date.now();

      // Calculate duration on previous screen
      const previousScreen = routeNameRef.current;

      if (previousScreen && screenStartTimes.has(previousScreen)) {
        const previousDuration = now - screenStartTimes.get(previousScreen)!;
        screenStartTimes.delete(previousScreen);

        // Track screen exit with duration
        if (previousDuration > 0) {
          await logAnalyticsEvent(
            'screen_exit',
            'navigation',
            {
              screenId: previousScreen,
              duration_ms: previousDuration,
            },
            userId,
            role
          );
        }
      }

      // Record start time for new screen
      screenStartTimes.set(screenName, now);
      currentScreenName = screenName;

      // Log screen view
      await logAnalyticsEvent(
        'screen_view',
        'navigation',
        {
          screenId: screenName,
          params,
          previous_screen: previousScreen,
        },
        userId,
        role
      );

      if (__DEV__) {
        console.log(`[NavigationTracker] screen_view: ${screenName}`, params);
      }
    },
    [userId, role]
  );

  /**
   * Handle navigation state change
   */
  const onStateChange = useCallback(
    (state: NavigationState | undefined) => {
      if (!isReadyRef.current) return;

      const currentRouteName = getActiveRouteName(state);
      const currentParams = getActiveRouteParams(state);

      if (currentRouteName && currentRouteName !== routeNameRef.current) {
        trackScreenView(currentRouteName, currentParams);
        routeNameRef.current = currentRouteName;
      }
    },
    [trackScreenView]
  );

  /**
   * Handle navigation ready
   */
  const onReady = useCallback(() => {
    isReadyRef.current = true;

    // Track initial screen
    const state = navigationRef.current?.getRootState();
    const initialRouteName = getActiveRouteName(state);
    const initialParams = getActiveRouteParams(state);

    if (initialRouteName) {
      routeNameRef.current = initialRouteName;
      trackScreenView(initialRouteName, initialParams);
    }
  }, [trackScreenView]);

  // Track app background/foreground for session tracking
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        logAnalyticsEvent(
          'session_background',
          'session',
          { current_screen: routeNameRef.current },
          userId,
          role
        );
      } else if (nextAppState === 'active') {
        logAnalyticsEvent(
          'session_foreground',
          'session',
          { current_screen: routeNameRef.current },
          userId,
          role
        );
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [userId, role]);

  // Clone NavigationContainer and inject tracking props
  return React.cloneElement(
    children,
    {
      onStateChange: (state: NavigationState | undefined) => {
        // Call original onStateChange if exists
        children.props.onStateChange?.(state);
        onStateChange(state);
      },
      onReady: () => {
        // Call original onReady if exists
        children.props.onReady?.();
        onReady();
      },
    } as Partial<NavigationContainerProps>
  );
};

/**
 * Hook to get navigation tracking utilities
 */
export const useNavigationTracking = () => {
  return {
    sessionId,
    currentScreen: currentScreenName,
  };
};

export default NavigationTracker;
