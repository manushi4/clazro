/**
 * useCreateAdmissionMutation - Create Admission Mutation Hook
 * 
 * Purpose: Create a new admission/inquiry record
 * Used by: AdmissionCreateScreen
 * 
 * Phase 3: Query/Mutation Hooks (Phase 5 - Admissions Module)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

// =============================================================================
// TYPES
// =============================================================================

export type AdmissionSource = 
  | 'walk-in' 
  | 'website' 
  | 'referral' 
  | 'advertisement' 
  | 'social-media' 
  | 'other';

export type CreateAdmissionInput = {
  studentName: string;
  studentNameHi?: string;
  phone: string;
  altPhone?: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  program: string;
  batchPreference?: string;
  currentClass?: string;
  currentSchool?: string;
  source: AdmissionSource;
  referralName?: string;
  feeQuoted?: number;
  assignedTo?: string;
  nextFollowUp?: string;
  notes?: string;
};

export type CreateAdmissionResult = {
  id: string;
  studentName: string;
  program: string;
  status: string;
  createdAt: string;
};

// =============================================================================
// HOOK
// =============================================================================

export function useCreateAdmissionMutation() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAdmissionInput): Promise<CreateAdmissionResult> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('admissions')
        .insert({
          customer_id: customerId,
          inquiry_date: new Date().toISOString().split('T')[0],
          student_name: input.studentName,
          student_name_hi: input.studentNameHi || null,
          phone: input.phone,
          alt_phone: input.altPhone || null,
          email: input.email || null,
          parent_name: input.parentName || null,
          parent_phone: input.parentPhone || null,
          program: input.program,
          batch_preference: input.batchPreference || null,
          current_class: input.currentClass || null,
          current_school: input.currentSchool || null,
          source: input.source,
          referral_name: input.referralName || null,
          fee_quoted: input.feeQuoted || null,
          assigned_to: input.assignedTo || null,
          next_follow_up: input.nextFollowUp || null,
          notes: input.notes || null,
          status: 'inquiry',
        })
        .select('id, student_name, program, status, created_at')
        .single();

      if (error) {
        console.error('Error creating admission:', error);
        throw new Error(error.message || 'Failed to create admission');
      }

      return {
        id: data.id,
        studentName: data.student_name,
        program: data.program,
        status: data.status,
        createdAt: data.created_at,
      };
    },
    onSuccess: () => {
      // Invalidate admission-related queries
      queryClient.invalidateQueries({ queryKey: ['admission-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admissions-list'] });
    },
  });
}
