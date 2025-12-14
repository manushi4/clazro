/**
 * Safe Navigation Service
 * Prevents double-tap navigation bugs with debouncing
 * No package changes required - uses React Navigation's existing API
 */

import { createNavigationContainerRef } from '@react-navigation/native';
import type { ParentStackParamList } from '../types/navigation';

// Create navigation ref for imperative navigation
export const navigationRef = createNavigationContainerRef<ParentStackParamList>();

// Track last navigation time to prevent rapid double-taps
let lastNavigationTime = 0;
const NAVIGATION_DEBOUNCE_MS = 300;

/**
 * Safe navigate with debounce protection
 * Prevents duplicate navigation from rapid button taps
 */
export function safeNavigate<RouteName extends keyof ParentStackParamList>(
  ...args: undefined extends ParentStackParamList[RouteName]
    ? [screen: RouteName] | [screen: RouteName, params?: ParentStackParamList[RouteName]]
    : [screen: RouteName, params: ParentStackParamList[RouteName]]
) {
  const now = Date.now();

  // Debounce check
  if (now - lastNavigationTime < NAVIGATION_DEBOUNCE_MS) {
    console.log('🚫 [Navigation] Blocked rapid navigation attempt (debounced)');
    return;
  }

  lastNavigationTime = now;

  if (!navigationRef.isReady()) {
    console.error('❌ [Navigation] Navigation not ready');
    return;
  }

  try {
    const [screen, params] = args;
    console.log('✅ [Navigation] Navigating to:', screen, params ? 'with params' : '');

    if (params) {
      navigationRef.navigate(screen as any, params);
    } else {
      navigationRef.navigate(screen as any);
    }
  } catch (error) {
    console.error('❌ [Navigation] Error:', error);
  }
}

/**
 * Get current active route name
 * Useful for analytics and conditional logic
 */
export function getActiveRouteName(): string | undefined {
  if (!navigationRef.isReady()) {
    return undefined;
  }

  const state = navigationRef.getRootState();

  if (!state) {
    return undefined;
  }

  const route = state.routes[state.index];

  // If nested navigator, get leaf route
  if (route.state) {
    const nestedState = route.state as any;
    const nestedRoute = nestedState.routes[nestedState.index];
    return nestedRoute.name;
  }

  return route.name;
}

/**
 * Check if navigation is ready
 */
export function isNavigationReady(): boolean {
  return navigationRef.isReady();
}

/**
 * Go back if possible
 */
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  } else {
    console.log('⚠️ [Navigation] Cannot go back');
  }
}

/**
 * Reset navigation to initial screen
 */
export function resetToHome() {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.reset({
    index: 0,
    routes: [{ name: 'Home' as any }],
  });
}
