/**
 * Navigation Analytics Tracker
 * Automatically tracks screen views and navigation patterns
 * No package changes - uses console logs (can be extended to Firebase/Mixpanel)
 */

import type { NavigationState } from '@react-navigation/native';

interface ScreenViewEvent {
  screen_name: string;
  previous_screen?: string;
  timestamp: number;
  params?: Record<string, any>;
}

interface NavigationAnalytics {
  sessionStart: number;
  screenViews: ScreenViewEvent[];
  currentScreen?: string;
  previousScreen?: string;
}

// In-memory analytics store
const analytics: NavigationAnalytics = {
  sessionStart: Date.now(),
  screenViews: [],
};

/**
 * Extract screen name from navigation state
 */
function getActiveRouteName(state: NavigationState | undefined): string | undefined {
  if (!state) {
    return undefined;
  }

  const route = state.routes[state.index];

  // Nested navigator - recurse
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }

  return route.name;
}

/**
 * Track screen view event
 */
export function trackScreenView(screenName: string, params?: Record<string, any>) {
  const event: ScreenViewEvent = {
    screen_name: screenName,
    previous_screen: analytics.currentScreen,
    timestamp: Date.now(),
    params,
  };

  analytics.screenViews.push(event);
  analytics.previousScreen = analytics.currentScreen;
  analytics.currentScreen = screenName;

  // Log to console (replace with your analytics service)
  console.log(
    `📊 [Analytics] Screen View: ${screenName}`,
    `| From: ${analytics.previousScreen || 'App Start'}`,
    `| Session: ${Math.round((Date.now() - analytics.sessionStart) / 1000)}s`
  );

  // TODO: Send to analytics service (Firebase, Mixpanel, etc.)
  // Example:
  // firebase.analytics().logEvent('screen_view', {
  //   screen_name: screenName,
  //   screen_class: screenName,
  //   previous_screen: analytics.previousScreen,
  // });
}

/**
 * Navigation state change handler for React Navigation
 * Use this with NavigationContainer's onStateChange prop
 */
export function onNavigationStateChange(state: NavigationState | undefined) {
  const currentRouteName = getActiveRouteName(state);

  if (currentRouteName && currentRouteName !== analytics.currentScreen) {
    trackScreenView(currentRouteName);
  }
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  const propsStr = properties ? JSON.stringify(properties) : '';
  console.log(`📊 [Analytics] Event: ${eventName}`, propsStr);

  // TODO: Send to analytics service
  // firebase.analytics().logEvent(eventName, properties);
}

/**
 * Track button/action click
 */
export function trackAction(
  actionName: string,
  screenName?: string,
  properties?: Record<string, any>
) {
  trackEvent('user_action', {
    action: actionName,
    screen: screenName || analytics.currentScreen,
    ...properties,
  });
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary() {
  const sessionDuration = Date.now() - analytics.sessionStart;
  const uniqueScreens = new Set(analytics.screenViews.map(e => e.screen_name));

  return {
    sessionDuration: Math.round(sessionDuration / 1000), // seconds
    totalScreenViews: analytics.screenViews.length,
    uniqueScreens: uniqueScreens.size,
    screens: Array.from(uniqueScreens),
    currentScreen: analytics.currentScreen,
    screenHistory: analytics.screenViews.slice(-10), // Last 10 screens
  };
}

/**
 * Reset analytics (for logout/session end)
 */
export function resetAnalytics() {
  console.log('📊 [Analytics] Session Summary:', getAnalyticsSummary());

  analytics.sessionStart = Date.now();
  analytics.screenViews = [];
  analytics.currentScreen = undefined;
  analytics.previousScreen = undefined;
}

/**
 * Example usage in NavigationContainer:
 *
 * ```tsx
 * <NavigationContainer
 *   ref={navigationRef}
 *   onReady={() => {
 *     const routeName = getActiveRouteName(navigationRef.getRootState());
 *     if (routeName) trackScreenView(routeName);
 *   }}
 *   onStateChange={onNavigationStateChange}
 * >
 *   <YourNavigator />
 * </NavigationContainer>
 * ```
 *
 * Example tracking user actions:
 *
 * ```tsx
 * <Button
 *   onPress={() => {
 *     trackAction('make_payment', 'BillingScreen', { amount: 500 });
 *     processPayment();
 *   }}
 * >
 *   Pay Now
 * </Button>
 * ```
 */
