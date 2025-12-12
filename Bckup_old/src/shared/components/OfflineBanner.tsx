/**
 * Offline Banner Component
 * Sprint 1 - Days 3-4: UI Shell
 *
 * Purpose: Show banner when network is disconnected
 * - Monitors network connectivity
 * - Dismissible banner
 * - Auto-hides when back online
 * - Material Design 3 styled
 *
 * Usage:
 * ```typescript
 * // In App.tsx or top-level navigator
 * import { OfflineBanner } from '@/shared/components/OfflineBanner';
 *
 * export default function App() {
 *   return (
 *     <>
 *       <NavigationContainer>
 *         <AppNavigator />
 *       </NavigationContainer>
 *       <OfflineBanner />
 *     </>
 *   );
 * }
 * ```
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tokens from '../../theme/tokens';
import { useTheme } from '../../context/ThemeContext';

export interface OfflineBannerProps {
  /**
   * Custom message to show when offline
   */
  message?: string;

  /**
   * Whether banner can be dismissed
   * @default true
   */
  dismissible?: boolean;

  /**
   * Auto-dismiss after X milliseconds when back online
   * @default 2000
   */
  autoDismissDelay?: number;

  /**
   * Position of banner
   * @default 'top'
   */
  position?: 'top' | 'bottom';
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  message = 'No internet connection',
  dismissible = true,
  autoDismissDelay = 2000,
  position = 'top',
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [isOffline, setIsOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = isOffline;
      const nowOffline = !state.isConnected;

      if (nowOffline !== wasOffline) {
        setIsOffline(nowOffline);

        if (wasOffline && !nowOffline) {
          // Was offline, now online - show reconnected message briefly
          setShowReconnected(true);
          setIsDismissed(false);

          setTimeout(() => {
            setShowReconnected(false);
            setIsDismissed(true);
          }, autoDismissDelay);
        } else if (nowOffline) {
          // Just went offline
          setIsDismissed(false);
          setShowReconnected(false);
        }
      }
    });

    // Check initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, [isOffline, autoDismissDelay]);

  // Animate banner in/out
  useEffect(() => {
    if (!isOffline && !showReconnected) {
      // Hide banner
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: tokens.animation.duration.normal,
        useNativeDriver: true,
      }).start();
    } else if (!isDismissed) {
      // Show banner
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: tokens.animation.duration.normal,
        useNativeDriver: true,
      }).start();
    } else {
      // Dismissed - hide
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: tokens.animation.duration.fast,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, isDismissed, showReconnected, slideAnim, position]);

  const handleDismiss = () => {
    if (dismissible) {
      setIsDismissed(true);
    }
  };

  // Don't render if online and not showing reconnected message
  if (!isOffline && !showReconnected) {
    return null;
  }

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  const backgroundColor = showReconnected
    ? tokens.colors.light.SuccessContainer
    : tokens.colors.light.ErrorContainer;
  const textColor = showReconnected
    ? tokens.colors.light.OnSuccessContainer
    : tokens.colors.light.OnErrorContainer;
  const iconName = showReconnected ? 'wifi' : 'wifi-off';
  const displayMessage = showReconnected ? 'Back online' : message;

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

        <Text
          style={[
            styles.message,
            tokens.typography.bodyMedium,
            { color: textColor },
          ]}
        >
          {displayMessage}
        </Text>

        {dismissible && (
          <TouchableOpacity
            onPress={handleDismiss}
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
        )}
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
  message: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  dismissButton: {
    padding: tokens.spacing.xs,
  },
});

export default OfflineBanner;

/**
 * USAGE EXAMPLES:
 *
 * 1. Basic usage (top position):
 * ```typescript
 * <OfflineBanner />
 * ```
 *
 * 2. Bottom position:
 * ```typescript
 * <OfflineBanner position="bottom" />
 * ```
 *
 * 3. Custom message:
 * ```typescript
 * <OfflineBanner message="You're offline. Changes won't sync." />
 * ```
 *
 * 4. Non-dismissible:
 * ```typescript
 * <OfflineBanner dismissible={false} />
 * ```
 *
 * 5. Custom auto-dismiss delay:
 * ```typescript
 * <OfflineBanner autoDismissDelay={5000} />
 * ```
 *
 * 6. Full example in App.tsx:
 * ```typescript
 * import { OfflineBanner } from '@/shared/components/OfflineBanner';
 *
 * export default function App() {
 *   return (
 *     <SafeAreaProvider>
 *       <ThemeProvider>
 *         <QueryClientProvider client={queryClient}>
 *           <NavigationContainer>
 *             <AppNavigator />
 *           </NavigationContainer>
 *           <OfflineBanner />
 *         </QueryClientProvider>
 *       </ThemeProvider>
 *     </SafeAreaProvider>
 *   );
 * }
 * ```
 */
