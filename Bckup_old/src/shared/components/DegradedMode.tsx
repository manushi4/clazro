/**
 * Degraded Mode Component
 * Sprint 1 - Days 3-4: UI Shell
 *
 * Purpose: Detect API slowness and show fallback states
 * - Monitors API response times
 * - Compares against Sprint 0 performance budgets
 * - Shows warning banner when APIs are slow
 * - Provides graceful degradation options
 * - Material Design 3 styled
 *
 * Performance Budgets (from Sprint 0):
 * - RPC queries: < 200ms
 * - Large exports: < 5 seconds
 * - Real-time subscriptions: < 100ms
 *
 * Usage:
 * ```typescript
 * // Wrap your app or screen
 * import { DegradedModeProvider, useDegradedMode } from '@/shared/components/DegradedMode';
 *
 * // 1. Add provider at top level
 * export default function App() {
 *   return (
 *     <DegradedModeProvider>
 *       <NavigationContainer>
 *         <AppNavigator />
 *       </NavigationContainer>
 *       <DegradedModeBanner />
 *     </DegradedModeProvider>
 *   );
 * }
 *
 * // 2. Track API performance
 * const { trackApiCall } = useDegradedMode();
 * const startTime = Date.now();
 * const result = await fetchData();
 * trackApiCall('get_users', Date.now() - startTime);
 *
 * // 3. Check if degraded
 * const { isDegraded, degradedReason } = useDegradedMode();
 * if (isDegraded) {
 *   // Show cached data or skeleton
 * }
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tokens from '../../theme/tokens';

/**
 * Performance Budget Thresholds (from Sprint 0)
 */
export const PERFORMANCE_BUDGETS = {
  rpcQuery: 200, // ms
  largeExport: 5000, // ms
  realtimeSubscription: 100, // ms
  defaultApiCall: 300, // ms (general threshold)
} as const;

/**
 * Degradation Severity Levels
 */
export type DegradationSeverity = 'warning' | 'critical';

/**
 * API Call Type for budget tracking
 */
export type ApiCallType =
  | 'rpcQuery'
  | 'largeExport'
  | 'realtimeSubscription'
  | 'default';

/**
 * Degraded Mode State
 */
interface DegradedModeState {
  isDegraded: boolean;
  severity: DegradationSeverity | null;
  degradedReason: string | null;
  slowCalls: Array<{
    name: string;
    duration: number;
    timestamp: number;
    exceeded: number; // ms exceeded over budget
  }>;
  avgResponseTime: number | null;
}

/**
 * Degraded Mode Context Value
 */
interface DegradedModeContextValue extends DegradedModeState {
  trackApiCall: (
    callName: string,
    duration: number,
    type?: ApiCallType
  ) => void;
  clearDegradedState: () => void;
  dismissBanner: () => void;
  isBannerDismissed: boolean;
}

const DegradedModeContext = createContext<DegradedModeContextValue | undefined>(
  undefined
);

/**
 * Degraded Mode Provider Props
 */
export interface DegradedModeProviderProps {
  children: ReactNode;
  /**
   * Number of slow calls before entering degraded mode
   * @default 3
   */
  slowCallThreshold?: number;

  /**
   * Time window in ms to track slow calls
   * @default 60000 (1 minute)
   */
  trackingWindow?: number;

  /**
   * Auto-clear degraded state after X ms of good performance
   * @default 120000 (2 minutes)
   */
  autoClearDelay?: number;
}

/**
 * Degraded Mode Provider
 */
export const DegradedModeProvider: React.FC<DegradedModeProviderProps> = ({
  children,
  slowCallThreshold = 3,
  trackingWindow = 60000,
  autoClearDelay = 120000,
}) => {
  const [state, setState] = useState<DegradedModeState>({
    isDegraded: false,
    severity: null,
    degradedReason: null,
    slowCalls: [],
    avgResponseTime: null,
  });

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [lastGoodPerformanceTime, setLastGoodPerformanceTime] = useState<
    number | null
  >(null);

  /**
   * Track API call performance
   */
  const trackApiCall = useCallback(
    (callName: string, duration: number, type: ApiCallType = 'default') => {
      // Map ApiCallType to PERFORMANCE_BUDGETS keys
      const budgetKey = type === 'default' ? 'defaultApiCall' : type;
      const budget = PERFORMANCE_BUDGETS[budgetKey as keyof typeof PERFORMANCE_BUDGETS];
      const exceeded = duration - budget;

      // If call is within budget, mark good performance
      if (exceeded <= 0) {
        setLastGoodPerformanceTime(Date.now());
        return;
      }

      // Call exceeded budget - add to slow calls
      const now = Date.now();
      const newSlowCall = {
        name: callName,
        duration,
        timestamp: now,
        exceeded,
      };

      setState((prev) => {
        // Remove calls outside tracking window
        const recentSlowCalls = prev.slowCalls.filter(
          (call) => now - call.timestamp < trackingWindow
        );

        // Add new slow call
        const updatedSlowCalls = [...recentSlowCalls, newSlowCall];

        // Calculate average response time
        const avgResponseTime =
          updatedSlowCalls.reduce((sum, call) => sum + call.duration, 0) /
          updatedSlowCalls.length;

        // Determine if degraded
        const isDegraded = updatedSlowCalls.length >= slowCallThreshold;

        // Determine severity
        let severity: DegradationSeverity | null = null;
        let degradedReason: string | null = null;

        if (isDegraded) {
          const avgExceeded =
            updatedSlowCalls.reduce((sum, call) => sum + call.exceeded, 0) /
            updatedSlowCalls.length;

          if (avgExceeded > 1000) {
            severity = 'critical';
            degradedReason = 'APIs are responding very slowly';
          } else {
            severity = 'warning';
            degradedReason = 'Some APIs are slower than usual';
          }

          // Un-dismiss banner when entering degraded mode
          setIsBannerDismissed(false);
        }

        return {
          isDegraded,
          severity,
          degradedReason,
          slowCalls: updatedSlowCalls,
          avgResponseTime,
        };
      });
    },
    [slowCallThreshold, trackingWindow]
  );

  /**
   * Clear degraded state manually
   */
  const clearDegradedState = useCallback(() => {
    setState({
      isDegraded: false,
      severity: null,
      degradedReason: null,
      slowCalls: [],
      avgResponseTime: null,
    });
    setIsBannerDismissed(false);
  }, []);

  /**
   * Dismiss banner
   */
  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
  }, []);

  /**
   * Auto-clear degraded state after sustained good performance
   */
  useEffect(() => {
    if (!state.isDegraded || lastGoodPerformanceTime === null) return;

    const timeSinceGoodPerformance = Date.now() - lastGoodPerformanceTime;

    if (timeSinceGoodPerformance >= autoClearDelay) {
      clearDegradedState();
    }
  }, [state.isDegraded, lastGoodPerformanceTime, autoClearDelay, clearDegradedState]);

  const contextValue: DegradedModeContextValue = {
    ...state,
    trackApiCall,
    clearDegradedState,
    dismissBanner,
    isBannerDismissed,
  };

  return (
    <DegradedModeContext.Provider value={contextValue}>
      {children}
    </DegradedModeContext.Provider>
  );
};

/**
 * Hook to access degraded mode state
 */
export const useDegradedMode = (): DegradedModeContextValue => {
  const context = useContext(DegradedModeContext);
  if (!context) {
    throw new Error('useDegradedMode must be used within DegradedModeProvider');
  }
  return context;
};

/**
 * Degraded Mode Banner Props
 */
export interface DegradedModeBannerProps {
  /**
   * Position of banner
   * @default 'top'
   */
  position?: 'top' | 'bottom';

  /**
   * Show retry button
   * @default true
   */
  showRetryButton?: boolean;

  /**
   * Callback when retry button pressed
   */
  onRetry?: () => void;
}

/**
 * Degraded Mode Banner Component
 */
export const DegradedModeBanner: React.FC<DegradedModeBannerProps> = ({
  position = 'top',
  showRetryButton = true,
  onRetry,
}) => {
  const insets = useSafeAreaInsets();
  const {
    isDegraded,
    severity,
    degradedReason,
    avgResponseTime,
    dismissBanner,
    isBannerDismissed,
  } = useDegradedMode();

  const [slideAnim] = useState(new Animated.Value(-100));

  // Animate banner in/out
  useEffect(() => {
    if (!isDegraded || isBannerDismissed) {
      // Hide banner
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: tokens.animation.duration.normal,
        useNativeDriver: true,
      }).start();
    } else {
      // Show banner
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: tokens.animation.duration.normal,
        useNativeDriver: true,
      }).start();
    }
  }, [isDegraded, isBannerDismissed, slideAnim, position]);

  // Don't render if not degraded or dismissed
  if (!isDegraded || isBannerDismissed) {
    return null;
  }

  const backgroundColor =
    severity === 'critical'
      ? tokens.colors.light.ErrorContainer
      : tokens.colors.light.WarningContainer;
  const textColor =
    severity === 'critical'
      ? tokens.colors.light.OnErrorContainer
      : tokens.colors.light.OnWarningContainer;
  const iconName = severity === 'critical' ? 'error' : 'warning';

  const message =
    degradedReason ||
    (severity === 'critical'
      ? 'Severe performance issues detected'
      : 'Some features may be slower than usual');

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          transform: [{ translateY: slideAnim }],
          ...(position === 'top'
            ? { top: insets.top }
            : { bottom: insets.bottom }),
        },
      ]}
    >
      <View style={styles.content}>
        <Icon
          name={iconName}
          size={tokens.sizing.icon.md}
          color={textColor}
          style={styles.icon}
        />

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.message,
              tokens.typography.bodyMedium,
              { color: textColor },
            ]}
          >
            {message}
          </Text>

          {avgResponseTime !== null && (
            <Text
              style={[
                styles.subMessage,
                tokens.typography.bodySmall,
                { color: textColor, opacity: 0.8 },
              ]}
            >
              Avg response time: {Math.round(avgResponseTime)}ms
            </Text>
          )}
        </View>

        {showRetryButton && onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={[styles.retryButton, { borderColor: textColor }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Retry"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.retryText,
                tokens.typography.labelSmall,
                { color: textColor },
              ]}
            >
              Retry
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={dismissBanner}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss banner"
          accessibilityRole="button"
        >
          <Icon
            name="close"
            size={tokens.sizing.icon.sm}
            color={textColor}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: tokens.zIndex.toast,
    ...Platform.select({
      ios: {
        shadowColor: tokens.colors.light.Shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: tokens.elevation.medium,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    minHeight: 56,
  },
  icon: {
    marginRight: tokens.spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  message: {
    marginBottom: tokens.spacing.xs,
  },
  subMessage: {
    fontSize: 12,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: tokens.radius.button,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    marginRight: tokens.spacing.sm,
  },
  retryText: {
    fontWeight: '600',
  },
  dismissButton: {
    padding: tokens.spacing.xs,
  },
});

/**
 * Utility: Wrap API call with automatic tracking
 */
export async function withDegradedTracking<T>(
  callName: string,
  apiCall: () => Promise<T>,
  trackApiCall: (name: string, duration: number, type?: ApiCallType) => void,
  type: ApiCallType = 'default'
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await apiCall();
    const duration = Date.now() - startTime;
    trackApiCall(callName, duration, type);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    trackApiCall(callName, duration, type);
    throw error;
  }
}

export default DegradedModeBanner;

/**
 * USAGE EXAMPLES:
 *
 * 1. Setup Provider:
 * ```typescript
 * import { DegradedModeProvider, DegradedModeBanner } from '@/shared/components/DegradedMode';
 *
 * export default function App() {
 *   return (
 *     <SafeAreaProvider>
 *       <ThemeProvider>
 *         <DegradedModeProvider>
 *           <QueryClientProvider client={queryClient}>
 *             <NavigationContainer>
 *               <AppNavigator />
 *             </NavigationContainer>
 *             <DegradedModeBanner />
 *           </QueryClientProvider>
 *         </DegradedModeProvider>
 *       </ThemeProvider>
 *     </SafeAreaProvider>
 *   );
 * }
 * ```
 *
 * 2. Track API calls manually:
 * ```typescript
 * const { trackApiCall, isDegraded } = useDegradedMode();
 *
 * const fetchUsers = async () => {
 *   const startTime = Date.now();
 *   try {
 *     const { data } = await supabase.rpc('get_users_keyset', filters);
 *     trackApiCall('get_users', Date.now() - startTime, 'rpcQuery');
 *     return data;
 *   } catch (error) {
 *     trackApiCall('get_users', Date.now() - startTime, 'rpcQuery');
 *     throw error;
 *   }
 * };
 * ```
 *
 * 3. Use utility wrapper:
 * ```typescript
 * import { useDegradedMode, withDegradedTracking } from '@/shared/components/DegradedMode';
 *
 * const { trackApiCall } = useDegradedMode();
 *
 * const fetchUsers = () =>
 *   withDegradedTracking(
 *     'get_users',
 *     () => supabase.rpc('get_users_keyset', filters),
 *     trackApiCall,
 *     'rpcQuery'
 *   );
 * ```
 *
 * 4. Show fallback UI when degraded:
 * ```typescript
 * const { isDegraded, severity } = useDegradedMode();
 *
 * if (isDegraded && severity === 'critical') {
 *   // Show cached data
 *   return <CachedDataView data={cachedUsers} />;
 * }
 *
 * // Normal data fetching
 * return <UserListView />;
 * ```
 *
 * 5. With retry button:
 * ```typescript
 * <DegradedModeBanner
 *   position="top"
 *   showRetryButton={true}
 *   onRetry={() => {
 *     queryClient.invalidateQueries();
 *   }}
 * />
 * ```
 */
