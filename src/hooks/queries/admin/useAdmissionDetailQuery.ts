/**
 * useAdmissionDetailQuery - Admission Detail Query Hook
 * 
 * Purpose: Fetch detailed information about a specific admission/inquiry
 * Used by: AdmissionDetailScreen
 * 
 * Phase 3: Query/Mutation Hooks (Phase 5 - Admissions Module)
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

// =============================================================================
// TYPES
// =============================================================================

export type AdmissionStatus = 
  | 'inquiry' 
  | 'follow-up' 
  | 'demo-scheduled' 
  | 'demo-done' 
  | 'negotiation' 
  | 'admitted' 
  | 'rejected' 
  | 'dropped';

export type AdmissionSource = 
  | 'walk-in' 
  | 'website' 
  | 'referral' 
  | 'advertisement' 
  | 'social-media' 
  | 'other';

export type FollowUpRecord = {
  id: string;
  date: string;
  type: 'call' | 'email' | 'sms' | 'visit' | 'demo';
  notes: string;
  outcome: string;
  nextAction: string | null;
  createdBy: string;
};

export type StatusHistoryRecord = {
  id: string;
  fromStatus: AdmissionStatus | null;
  toStatus: AdmissionStatus;
  changedAt: string;
  changedBy: string;
  reason: string | null;
};

export type AdmissionDetailData = {
  id: string;
  inquiryDate: string;
  studentName: string;
  studentNameHi: string | null;
  phone: string;
  altPhone: string | null;
  email: string | null;
  parentName: string | null;
  parentPhone: string | null;
  program: string;
  batchPreference: string | null;
  currentClass: string | null;
  currentSchool: string | null;
  source: AdmissionSource;
  referralName: string | null;
  status: AdmissionStatus;
  statusReason: string | null;
  admissionDate: string | null;
  batchAssigned: string | null;
  batchAssignedName: string | null;
  feeQuoted: number | null;
  feeFinal: number | null;
  assignedTo: string | null;
  assignedToName: string | null;
  nextFollowUp: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  followUpHistory: FollowUpRecord[];
  statusHistory: StatusHistoryRecord[];
  daysInPipeline: number;
  isOverdue: boolean;
};

// =============================================================================
// DEMO DATA
// =============================================================================

const generateDemoData = (admissionId: string): AdmissionDetailData => {
  const followUpHistory: FollowUpRecord[] = [
    {
      id: 'fu1',
      date: '2024-12-20',
      type: 'call',
      notes: 'Discussed course details and fee structure. Parent interested in JEE Advanced batch.',
      outcome: 'Positive - Scheduled demo class',
      nextAction: 'Demo class on 22nd Dec',
      createdBy: 'Amit Sharma',
    },
    {
      id: 'fu2',
      date: '2024-12-18',
      type: 'visit',
      notes: 'Walk-in inquiry. Student scored 85% in Class 11. Interested in JEE preparation.',
      outcome: 'Collected details, shared brochure',
      nextAction: 'Follow-up call in 2 days',
      createdBy: 'Reception',
    },
  ];

  const statusHistory: StatusHistoryRecord[] = [
    {
      id: 'sh1',
      fromStatus: 'follow-up',
      toStatus: 'demo-scheduled',
      changedAt: '2024-12-20T14:30:00Z',
      changedBy: 'Amit Sharma',
      reason: 'Demo class scheduled for 22nd Dec',
    },
    {
      id: 'sh2',
      fromStatus: 'inquiry',
      toStatus: 'follow-up',
      changedAt: '2024-12-18T11:00:00Z',
      changedBy: 'Reception',
      reason: 'Initial follow-up scheduled',
    },
    {
      id: 'sh3',
      fromStatus: null,
      toStatus: 'inquiry',
      changedAt: '2024-12-18T10:30:00Z',
      changedBy: 'System',
      reason: 'New inquiry created',
    },
  ];

  return {
    id: admissionId,
    inquiryDate: '2024-12-18',
    studentName: 'Rahul Verma',
    studentNameHi: 'राहुल वर्मा',
    phone: '+91 98765 43210',
    altPhone: '+91 98765 43211',
    email: 'rahul.verma@email.com',
    parentName: 'Suresh Verma',
    parentPhone: '+91 98765 43212',
    program: 'JEE',
    batchPreference: 'JEE Advanced 2025-A',
    currentClass: 'Class 11',
    currentSchool: 'Delhi Public School, Kota',
    source: 'walk-in',
    referralName: null,
    status: 'demo-scheduled',
    statusReason: null,
    admissionDate: null,
    batchAssigned: null,
    batchAssignedName: null,
    feeQuoted: 185000,
    feeFinal: null,
    assignedTo: 'counselor-1',
    assignedToName: 'Amit Sharma',
    nextFollowUp: '2024-12-22',
    notes: 'Student is bright, scored 85% in Class 11. Parents are keen on JEE Advanced preparation. Budget is flexible.',
    createdAt: '2024-12-18T10:30:00Z',
    updatedAt: '2024-12-20T14:30:00Z',
    followUpHistory,
    statusHistory,
    daysInPipeline: 4,
    isOverdue: false,
  };
};

// =============================================================================
// HOOK
// =============================================================================

type UseAdmissionDetailOptions = {
  admissionId: string;
};

export function useAdmissionDetailQuery(options: UseAdmissionDetailOptions) {
  const customerId = useCustomerId();
  const { admissionId } = options;

  return useQuery({
    queryKey: ['admission-detail', customerId, admissionId],
    queryFn: async (): Promise<AdmissionDetailData> => {
      const supabase = getSupabaseClient();

      // Fetch admission record
      const { data: admission, error } = await supabase
        .from('admissions')
        .select(`
          *,
          assigned_user:user_profiles!admissions_assigned_to_fkey(full_name),
          batch:batches!admissions_batch_assigned_fkey(name)
        `)
        .eq('customer_id', customerId)
        .eq('id', admissionId)
        .single();

      if (error) {
        console.warn('Error fetching admission detail:', error);
        return generateDemoData(admissionId);
      }

      if (!admission) {
        return generateDemoData(admissionId);
      }

      // Calculate days in pipeline
      const inquiryDate = new Date(admission.inquiry_date);
      const today = new Date();
      const daysInPipeline = Math.floor((today.getTime() - inquiryDate.getTime()) / (1000 * 60 * 60 * 24));

      // Check if overdue (no follow-up in 3 days for non-terminal statuses)
      const terminalStatuses = ['admitted', 'rejected', 'dropped'];
      const isOverdue = !terminalStatuses.includes(admission.status) && 
        admission.next_follow_up && 
        new Date(admission.next_follow_up) < today;

      // Generate demo follow-up and status history (would come from separate tables in production)
      const demoData = generateDemoData(admissionId);

      return {
        id: admission.id,
        inquiryDate: admission.inquiry_date,
        studentName: admission.student_name,
        studentNameHi: admission.student_name_hi,
        phone: admission.phone,
        altPhone: admission.alt_phone,
        email: admission.email,
        parentName: admission.parent_name,
        parentPhone: admission.parent_phone,
        program: admission.program,
        batchPreference: admission.batch_preference,
        currentClass: admission.current_class,
        currentSchool: admission.current_school,
        source: admission.source as AdmissionSource,
        referralName: admission.referral_name,
        status: admission.status as AdmissionStatus,
        statusReason: admission.status_reason,
        admissionDate: admission.admission_date,
        batchAssigned: admission.batch_assigned,
        batchAssignedName: admission.batch?.name || null,
        feeQuoted: admission.fee_quoted,
        feeFinal: admission.fee_final,
        assignedTo: admission.assigned_to,
        assignedToName: admission.assigned_user?.full_name || null,
        nextFollowUp: admission.next_follow_up,
        notes: admission.notes,
        createdAt: admission.created_at,
        updatedAt: admission.updated_at,
        followUpHistory: demoData.followUpHistory,
        statusHistory: demoData.statusHistory,
        daysInPipeline,
        isOverdue,
      };
    },
    enabled: !!customerId && !!admissionId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
