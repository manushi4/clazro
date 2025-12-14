/**
 * Navigation Parameter Validation Schemas
 * Validates route params before navigation to prevent runtime errors
 */

import { z } from 'zod';

// ============================================
// COMMON SCHEMAS
// ============================================

/**
 * UUID validation (common for all IDs)
 */
const UUIDSchema = z.string().uuid('Invalid ID format');

/**
 * Optional UUID
 */
const OptionalUUIDSchema = z.string().uuid('Invalid ID format').optional();

// ============================================
// PARENT NAVIGATION PARAMS
// ============================================

/**
 * Child Detail params
 */
export const ChildDetailParamsSchema = z.object({
  childId: UUIDSchema,
});

export type ChildDetailParams = z.infer<typeof ChildDetailParamsSchema>;

/**
 * Child Progress params
 */
export const ChildProgressParamsSchema = z.object({
  childId: UUIDSchema,
});

export type ChildProgressParams = z.infer<typeof ChildProgressParamsSchema>;

/**
 * Child Attendance params
 */
export const ChildAttendanceParamsSchema = z.object({
  childId: UUIDSchema,
});

export type ChildAttendanceParams = z.infer<typeof ChildAttendanceParamsSchema>;

/**
 * Child Assignments params
 */
export const ChildAssignmentsParamsSchema = z.object({
  childId: UUIDSchema,
});

export type ChildAssignmentsParams = z.infer<typeof ChildAssignmentsParamsSchema>;

/**
 * Child Tests params
 */
export const ChildTestsParamsSchema = z.object({
  childId: UUIDSchema,
});

export type ChildTestsParams = z.infer<typeof ChildTestsParamsSchema>;

/**
 * Teacher Communication params
 */
export const TeacherCommunicationParamsSchema = z.object({
  teacherId: UUIDSchema,
});

export type TeacherCommunicationParams = z.infer<typeof TeacherCommunicationParamsSchema>;

/**
 * Parent Chat params
 */
export const ParentChatParamsSchema = z.object({
  recipientId: OptionalUUIDSchema,
});

export type ParentChatParams = z.infer<typeof ParentChatParamsSchema>;

/**
 * Parent Reports params
 */
export const ParentReportsParamsSchema = z.object({
  childId: UUIDSchema,
});

export type ParentReportsParams = z.infer<typeof ParentReportsParamsSchema>;

// ============================================
// NEW SCREENS - PHASE 1 (Overview Tab)
// ============================================

/**
 * Action Item Detail params
 */
export const ActionItemDetailParamsSchema = z.object({
  itemId: UUIDSchema,
});

export type ActionItemDetailParams = z.infer<typeof ActionItemDetailParamsSchema>;

/**
 * Message Detail params
 */
export const MessageDetailParamsSchema = z.object({
  messageId: UUIDSchema,
});

export type MessageDetailParams = z.infer<typeof MessageDetailParamsSchema>;

// ============================================
// NEW SCREENS - PHASE 2 (Financial Tab)
// ============================================

/**
 * Make Payment params
 */
export const MakePaymentParamsSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().min(1, 'Description cannot be empty').optional(),
});

export type MakePaymentParams = z.infer<typeof MakePaymentParamsSchema>;

/**
 * Fee Structure params
 */
export const FeeStructureParamsSchema = z.object({
  studentId: OptionalUUIDSchema,
});

export type FeeStructureParams = z.infer<typeof FeeStructureParamsSchema>;

// ============================================
// NEW SCREENS - PHASE 3 (Academic Tab)
// ============================================

/**
 * Subject Detail params
 */
export const SubjectDetailParamsSchema = z.object({
  studentId: UUIDSchema,
  subject: z.string().min(1, 'Subject name is required'),
});

export type SubjectDetailParams = z.infer<typeof SubjectDetailParamsSchema>;

/**
 * Assignments List params
 */
export const AssignmentsListParamsSchema = z.object({
  studentId: UUIDSchema,
});

export type AssignmentsListParams = z.infer<typeof AssignmentsListParamsSchema>;

/**
 * Assignment Detail params
 */
export const AssignmentDetailParamsSchema = z.object({
  assignmentId: UUIDSchema,
});

export type AssignmentDetailParams = z.infer<typeof AssignmentDetailParamsSchema>;

/**
 * Upcoming Exams params
 */
export const UpcomingExamsParamsSchema = z.object({
  studentId: OptionalUUIDSchema,
});

export type UpcomingExamsParams = z.infer<typeof UpcomingExamsParamsSchema>;

/**
 * Academic Reports params
 */
export const AcademicReportsParamsSchema = z.object({
  studentId: UUIDSchema,
});

export type AcademicReportsParams = z.infer<typeof AcademicReportsParamsSchema>;

/**
 * Study Recommendations params
 */
export const StudyRecommendationsParamsSchema = z.object({
  studentId: UUIDSchema,
});

export type StudyRecommendationsParams = z.infer<typeof StudyRecommendationsParamsSchema>;

// ============================================
// NEW SCREENS - PHASE 4 (Communication Tab)
// ============================================

/**
 * Compose Message params
 */
export const ComposeMessageParamsSchema = z.object({
  recipientId: OptionalUUIDSchema,
  subject: z.string().min(1, 'Subject cannot be empty').optional(),
});

export type ComposeMessageParams = z.infer<typeof ComposeMessageParamsSchema>;

/**
 * Schedule Meeting params
 */
export const ScheduleMeetingParamsSchema = z.object({
  teacherId: OptionalUUIDSchema,
});

export type ScheduleMeetingParams = z.infer<typeof ScheduleMeetingParamsSchema>;

/**
 * Teacher List params
 */
export const TeacherListParamsSchema = z.object({
  studentId: OptionalUUIDSchema,
});

export type TeacherListParams = z.infer<typeof TeacherListParamsSchema>;

// ============================================
// VALIDATION HELPER
// ============================================

/**
 * Validate navigation params before navigating
 * Prevents runtime errors from invalid params
 *
 * @example
 * ```tsx
 * const params = validateNavParams(ChildDetailParamsSchema, { childId: '123' });
 * if (params) {
 *   navigation.navigate('ChildDetail', params);
 * } else {
 *   Alert.alert('Error', 'Invalid child ID');
 * }
 * ```
 */
export function validateNavParams<T extends z.ZodSchema>(
  schema: T,
  params: unknown
): z.infer<T> | null {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [NavValidation] Invalid params:', error.errors);
      // Log specific validation errors
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    return null;
  }
}

/**
 * Safe navigation wrapper with validation
 * Use this instead of navigation.navigate() for type-safe navigation
 *
 * @example
 * ```tsx
 * import { safeNavigateWithValidation } from '@/shared/validation/navigationSchemas';
 *
 * // In your component
 * const handleViewChild = (childId: string) => {
 *   const success = safeNavigateWithValidation(
 *     navigation,
 *     'ChildDetail',
 *     ChildDetailParamsSchema,
 *     { childId }
 *   );
 *
 *   if (!success) {
 *     Alert.alert('Error', 'Invalid child ID. Please try again.');
 *   }
 * };
 * ```
 */
export function safeNavigateWithValidation<T extends z.ZodSchema>(
  navigation: any,
  screen: string,
  schema: T,
  params: unknown
): boolean {
  const validated = validateNavParams(schema, params);

  if (!validated) {
    console.error(`❌ [Navigation] Blocked navigation to ${screen} - invalid params`);
    return false;
  }

  try {
    navigation.navigate(screen, validated);
    console.log(`✅ [Navigation] Navigated to ${screen}`);
    return true;
  } catch (error) {
    console.error(`❌ [Navigation] Failed to navigate to ${screen}:`, error);
    return false;
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * Example 1: Basic validation
 *
 * ```tsx
 * const ChildListItem = ({ child }) => {
 *   const navigation = useNavigation();
 *
 *   const handlePress = () => {
 *     const params = validateNavParams(ChildDetailParamsSchema, {
 *       childId: child.id
 *     });
 *
 *     if (params) {
 *       navigation.navigate('ChildDetail', params);
 *     } else {
 *       Alert.alert('Error', 'Invalid child data');
 *     }
 *   };
 *
 *   return <TouchableOpacity onPress={handlePress}>...</TouchableOpacity>;
 * };
 * ```
 *
 * Example 2: Safe navigation wrapper
 *
 * ```tsx
 * const NotificationHandler = ({ notification }) => {
 *   const navigation = useNavigation();
 *
 *   const handleNotificationPress = () => {
 *     // notification.data might come from external source (push notification)
 *     const success = safeNavigateWithValidation(
 *       navigation,
 *       'ChildProgress',
 *       ChildProgressParamsSchema,
 *       notification.data
 *     );
 *
 *     if (!success) {
 *       // Log to analytics
 *       trackEvent('invalid_notification_data', {
 *         notificationId: notification.id,
 *         data: notification.data
 *       });
 *
 *       Alert.alert(
 *         'Error',
 *         'Unable to open this notification. Please check your notifications page.'
 *       );
 *     }
 *   };
 *
 *   return <Button onPress={handleNotificationPress}>View</Button>;
 * };
 * ```
 *
 * Example 3: Deep link validation
 *
 * ```tsx
 * // In deep linking config
 * const linking = {
 *   config: {
 *     screens: {
 *       ChildProgress: {
 *         path: 'child/:childId/progress',
 *         parse: {
 *           childId: (childId: string) => {
 *             const validated = validateNavParams(
 *               z.object({ childId: z.string().uuid() }),
 *               { childId }
 *             );
 *             return validated?.childId || undefined;
 *           }
 *         }
 *       }
 *     }
 *   }
 * };
 * ```
 *
 * Example 4: Form submission
 *
 * ```tsx
 * const AddChildForm = () => {
 *   const navigation = useNavigation();
 *   const [childData, setChildData] = useState({});
 *
 *   const handleSubmit = async () => {
 *     try {
 *       const result = await createChild(childData);
 *
 *       // Validate before navigating to child detail
 *       const success = safeNavigateWithValidation(
 *         navigation,
 *         'ChildDetail',
 *         ChildDetailParamsSchema,
 *         { childId: result.id }
 *       );
 *
 *       if (!success) {
 *         // Fallback navigation
 *         navigation.navigate('ChildrenManagement');
 *       }
 *     } catch (error) {
 *       Alert.alert('Error', 'Failed to create child');
 *     }
 *   };
 *
 *   return <Form onSubmit={handleSubmit} />;
 * };
 * ```
 */
