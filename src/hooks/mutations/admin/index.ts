/**
 * Admin Mutation Hooks - Index
 * Sprint 1-9 Admin Phase 1
 */

export { useAdminAuth } from './useAdminAuth';
// Sprint 1 - 2FA hooks
export { useGenerate2FA, useVerify2FA, useDisable2FA, useVerify2FALogin } from './use2FASetup';
// Sprint 1 - Password Reset
export { usePasswordReset } from './usePasswordReset';
// Sprint 2 - Bulk User Actions
export { 
  useBulkApprove, 
  useBulkSuspend, 
  useBulkActivate, 
  useExportUsers, 
  useBulkResetPasswords 
} from './useBulkUserActions';
export type { BulkActionInput, BulkActionResult, BulkActionType } from './useBulkUserActions';

// Sprint 3 - User Suspension
export { useSuspendUser, useUnsuspendUser } from './useSuspendUser';
export type { SuspendUserInput, UnsuspendUserInput, SuspendUserResult } from './useSuspendUser';

// Sprint 4 - User Management
export { useCreateUser } from './useCreateUser';
export type { CreateUserInput, CreateUserResult } from './useCreateUser';
export { useUpdateUser } from './useUpdateUser';
export type { UpdateUserInput, UpdateUserResult } from './useUpdateUser';
export { useImpersonateUser, useEndImpersonation, useImpersonationSession } from './useImpersonateUser';
export type { ImpersonateUserInput, ImpersonationResult, ImpersonationSession } from './useImpersonateUser';

// Sprint 6
// export { useExportReport } from './useExportReport';

// Sprint 9
// export { useUpdateSettings } from './useUpdateSettings';

// Organization Management
export { useCreateOrganization } from './useCreateOrganization';
export type { CreateOrganizationInput, CreateOrganizationResult, OrgEntityType } from './useCreateOrganization';

// Phase 5: Admissions Module
export { useCreateAdmissionMutation } from './useCreateAdmissionMutation';
export type { CreateAdmissionInput, CreateAdmissionResult, AdmissionSource } from './useCreateAdmissionMutation';
