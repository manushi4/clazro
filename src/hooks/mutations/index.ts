/**
 * Mutations Index
 */

export { useFeePaymentMutation } from "./useFeePaymentMutation";
export type { PaymentMethod, PaymentInput, PaymentResult } from "./useFeePaymentMutation";

export { useComposeMessageMutation } from "./useComposeMessageMutation";
export type { ComposeMessageInput, ComposeMessageResult } from "./useComposeMessageMutation";

// Admin mutations
export { useStartImpersonationMutation, useEndImpersonationMutation } from "./admin/useImpersonationMutation";
export type { StartImpersonationParams, ImpersonationResult } from "./admin/useImpersonationMutation";

// Teacher mutations
export { useMarkAttendance } from "./teacher/useMarkAttendance";
export type { MarkAttendancePayload, MarkAttendanceResult, OfflineAttendanceRecord } from "./teacher/useMarkAttendance";

// Profile mutations
export { useUpdateProfile, useUpdateAvatar, useUpdatePreferences } from "./profile/useUpdateProfile";
export type { UpdateProfilePayload } from "./profile/useUpdateProfile";
