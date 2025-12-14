/**
 * TypeScript type definitions for Parent Services
 */

import { BaseEntity, UUID, Timestamp } from './common.types';

// ==================== PARENT ====================

export interface Parent extends BaseEntity {
  user_id: UUID;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  occupation?: string;
  status: 'active' | 'inactive';
  profile_picture_url?: string;
}

// ==================== PARENT-CHILD RELATIONSHIP ====================

export interface ParentChildRelationship extends BaseEntity {
  parent_id: UUID;
  student_id: UUID;
  relationship_type: 'father' | 'mother' | 'guardian' | 'other';
  is_primary_contact: boolean;
}

// ==================== PARENT ACTION ITEMS ====================

export interface ParentActionItem extends BaseEntity {
  parent_id: UUID;
  student_id?: UUID;
  title: string;
  description?: string;
  action_type: 'payment' | 'document' | 'meeting' | 'consent' | 'general';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  tags?: string[];
  completion_notes?: string;
  completed_at?: Timestamp;
}

export interface ActionItemFilters {
  action_type?: 'payment' | 'document' | 'meeting' | 'consent' | 'general';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  status?: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  student_id?: UUID;
}

// ==================== FEES AND PAYMENTS ====================

export interface StudentFee extends BaseEntity {
  student_id: UUID;
  fee_type: string;
  amount: number;
  due_date: string;
  paid_amount: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  academic_year?: string;
  term?: string;
}

export interface Payment extends BaseEntity {
  parent_id: UUID;
  student_id?: UUID;
  amount: number;
  payment_method: 'card' | 'upi' | 'net_banking' | 'wallet' | 'cash' | 'cheque';
  payment_reference?: string;
  status: 'success' | 'pending' | 'failed';
  processed_at?: Timestamp;
  receipt_url?: string;
  notes?: string;
}

export interface FeeBalance {
  total_fees: number;
  total_paid: number;
  balance_due: number;
  overdue_amount: number;
}

export type PaymentMethod = 'card' | 'upi' | 'net_banking' | 'wallet' | 'cash' | 'cheque';

export interface FeeFilters {
  student_id?: UUID;
  status?: 'pending' | 'partial' | 'paid' | 'overdue';
  fee_type?: string;
}

export interface PaymentFilters {
  start_date?: string;
  end_date?: string;
  status?: 'success' | 'pending' | 'failed';
  student_id?: UUID;
}

// ==================== AI INSIGHTS ====================

export interface AIInsight extends BaseEntity {
  parent_id: UUID;
  student_id: UUID;
  insight_type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  recommendation?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  read_at?: Timestamp;
}

// ==================== DASHBOARD ====================

export interface ParentDashboard {
  parent: Parent;
  children: ChildSummary[];
  action_items: ParentActionItem[];
  ai_insights: AIInsight[];
  financial_summary: FinancialSummary;
  recent_communications: Communication[];
}

export interface ChildSummary {
  student: any; // Student type from student.types.ts
  academic_performance: any; // AcademicPerformance from student.types.ts
  attendance: any; // AttendanceSummary from student.types.ts
  pending_assignments: number;
  recent_grades: any[]; // Grade[] from student.types.ts
}

export interface FinancialSummary {
  parent_id: UUID;
  total_fees_all_children: number;
  total_paid: number;
  total_outstanding: number;
  overdue_amount: number;
  next_due_date?: string;
  next_due_amount?: number;
}

export interface Communication {
  id: UUID;
  type: string;
  subject: string;
  message: string;
  from: string;
  timestamp: Timestamp;
}
