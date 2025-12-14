/**
 * Deep Link Configuration
 * Handles deep links from URLs, push notifications, and external sources
 * Includes Zod validation for safety
 */

import { z } from 'zod';
import type { LinkingOptions } from '@react-navigation/native';
import type { ParentStackParamList } from '../types/navigation';

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Child ID must be UUID format
 */
const ChildIdSchema = z.string().uuid('Invalid child ID format');

/**
 * Payment ID must be UUID format
 */
const PaymentIdSchema = z.string().uuid('Invalid payment ID format');

/**
 * Teacher ID must be UUID format
 */
const TeacherIdSchema = z.string().uuid('Invalid teacher ID format');

/**
 * Validate and sanitize deep link params
 */
export function validateDeepLinkParams<T extends z.ZodSchema>(
  schema: T,
  params: unknown
): z.infer<T> | null {
  try {
    return schema.parse(params);
  } catch (error) {
    console.error('❌ [DeepLink] Invalid params:', error);
    // TODO: Track validation failure in analytics
    return null;
  }
}

// ============================================
// DEEP LINK CONFIGURATION
// ============================================

/**
 * Deep linking configuration for React Navigation
 *
 * Supported URLs:
 * - manushicoaching://parent/dashboard
 * - manushicoaching://parent/child/{childId}/progress
 * - manushicoaching://parent/payment/{paymentId}
 * - https://app.manushicoaching.com/parent/...
 */
export const deepLinkConfig: LinkingOptions<ParentStackParamList> = {
  prefixes: [
    'manushicoaching://',
    'https://app.manushicoaching.com',
    'https://manushicoaching.com',
  ],
  config: {
    screens: {
      // ============================================
      // HOME TAB
      // ============================================
      ParentDashboard: {
        path: 'parent/dashboard',
        parse: {
          // No params - just navigate to dashboard
        },
      },

      // ============================================
      // CHILDREN TAB
      // ============================================
      ChildDetail: {
        path: 'parent/child/:childId',
        parse: {
          childId: (childId: string) => {
            const validated = validateDeepLinkParams(ChildIdSchema, childId);
            if (!validated) {
              console.error('❌ [DeepLink] Invalid childId, redirecting to children list');
              return undefined; // Will navigate to parent screen
            }
            return validated;
          },
        },
      },
      ChildProgress: {
        path: 'parent/child/:childId/progress',
        parse: {
          childId: (childId: string) => {
            return validateDeepLinkParams(ChildIdSchema, childId) || undefined;
          },
        },
      },
      ChildAttendance: {
        path: 'parent/child/:childId/attendance',
        parse: {
          childId: (childId: string) => {
            return validateDeepLinkParams(ChildIdSchema, childId) || undefined;
          },
        },
      },

      // ============================================
      // BILLING TAB
      // ============================================
      PaymentHistory: {
        path: 'parent/payments',
      },
      // Note: PaymentDetail not in your current ParentStackParamList
      // Add it if you want deep links to specific payments

      // ============================================
      // COMMUNICATION TAB
      // ============================================
      TeacherCommunication: {
        path: 'parent/teacher/:teacherId',
        parse: {
          teacherId: (teacherId: string) => {
            return validateDeepLinkParams(TeacherIdSchema, teacherId) || undefined;
          },
        },
      },
      ParentChat: {
        path: 'parent/chat/:recipientId?',
        parse: {
          recipientId: (recipientId?: string) => {
            if (!recipientId) return undefined;
            return validateDeepLinkParams(
              z.string().uuid('Invalid recipient ID'),
              recipientId
            ) || undefined;
          },
        },
      },

      // ============================================
      // NOTIFICATIONS
      // ============================================
      ParentNotifications: {
        path: 'parent/notifications',
      },
    },
  },
};

// ============================================
// DEEP LINK HANDLERS
// ============================================

/**
 * Handle deep link from push notification
 * Validates payload before navigation
 */
export function handlePushNotificationDeepLink(payload: unknown) {
  const PayloadSchema = z.object({
    screen: z.string(),
    params: z.record(z.unknown()).optional(),
  });

  const validated = validateDeepLinkParams(PayloadSchema, payload);

  if (!validated) {
    console.error('❌ [DeepLink] Invalid push notification payload');
    return null;
  }

  console.log('📲 [DeepLink] Push notification:', validated);

  return validated;
}

/**
 * Handle deep link from external URL
 * Example: User clicks link in email/SMS
 */
export function handleExternalUrl(url: string) {
  console.log('🔗 [DeepLink] External URL:', url);

  // URL will be handled automatically by React Navigation's Linking config
  // This function is for additional logging/analytics

  // Track in analytics
  // trackEvent('deep_link_opened', { url });

  return url;
}

/**
 * Generate deep link URL for sharing
 */
export function generateDeepLink(
  screen: keyof ParentStackParamList,
  params?: Record<string, string>
): string {
  const baseUrl = 'https://app.manushicoaching.com';

  switch (screen) {
    case 'ChildProgress':
      if (!params?.childId) {
        throw new Error('childId required for ChildProgress deep link');
      }
      return `${baseUrl}/parent/child/${params.childId}/progress`;

    case 'ChildDetail':
      if (!params?.childId) {
        throw new Error('childId required for ChildDetail deep link');
      }
      return `${baseUrl}/parent/child/${params.childId}`;

    case 'TeacherCommunication':
      if (!params?.teacherId) {
        throw new Error('teacherId required for TeacherCommunication deep link');
      }
      return `${baseUrl}/parent/teacher/${params.teacherId}`;

    case 'ParentDashboard':
      return `${baseUrl}/parent/dashboard`;

    default:
      return baseUrl;
  }
}

/**
 * Example Usage:
 *
 * 1. In App.tsx:
 * ```tsx
 * <NavigationContainer
 *   linking={deepLinkConfig}
 *   fallback={<LoadingScreen />}
 *   onReady={() => console.log('Navigation ready')}
 * >
 *   <ParentNavigator />
 * </NavigationContainer>
 * ```
 *
 * 2. Handle push notification:
 * ```tsx
 * messaging().onNotificationOpenedApp(remoteMessage => {
 *   const link = handlePushNotificationDeepLink(remoteMessage.data);
 *   if (link) {
 *     navigationRef.navigate(link.screen, link.params);
 *   }
 * });
 * ```
 *
 * 3. Generate shareable link:
 * ```tsx
 * const shareChildProgress = async (childId: string) => {
 *   const url = generateDeepLink('ChildProgress', { childId });
 *   await Share.share({ message: `Check out your child's progress: ${url}` });
 * };
 * ```
 *
 * 4. Test deep links:
 * ```bash
 * # Android
 * adb shell am start -W -a android.intent.action.VIEW -d "manushicoaching://parent/child/123e4567-e89b-12d3-a456-426614174000/progress"
 *
 * # iOS
 * xcrun simctl openurl booted "manushicoaching://parent/dashboard"
 * ```
 */
