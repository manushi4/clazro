/**
 * Zod Validation Schemas
 * Catches API shape drift and prevents runtime crashes
 *
 * YOU ALREADY HAVE ZOD INSTALLED - using existing package!
 *
 * Usage:
 * const student = StudentSchema.parse(apiData);
 * // Throws ZodError if shape is wrong - catches in dev, not production!
 */

import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS (Reusable primitives)
// ============================================================================

export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().regex(/^\+?[1-9]\d{9,14}$/);
export const DateTimeSchema = z.string().datetime();
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ============================================================================
// USER & PROFILE SCHEMAS
// ============================================================================

export const ProfileSchema = z.object({
  id: UUIDSchema,
  full_name: z.string().min(1),
  email: EmailSchema,
  phone: PhoneSchema.optional().nullable(),
  role: z.enum(['parent', 'student', 'teacher', 'admin']),
  avatar_url: z.string().url().optional().nullable(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type Profile = z.infer<typeof ProfileSchema>;

// ============================================================================
// STUDENT SCHEMAS
// ============================================================================

export const StudentSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  phone: PhoneSchema.optional().nullable(),
  status: z.enum(['active', 'inactive', 'graduated', 'dropped']),
  batch_id: UUIDSchema,
  full_name: z.string().min(1),
  student_id: z.string(),
  enrollment_date: DateSchema,
  date_of_birth: DateSchema.optional().nullable(),
  address: z.string().optional().nullable(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type Student = z.infer<typeof StudentSchema>;

// Student with relationship (for parent dashboard)
export const StudentWithRelationshipSchema = StudentSchema.extend({
  relationship_type: z.string(),
  is_primary_contact: z.boolean(),
});

export type StudentWithRelationship = z.infer<typeof StudentWithRelationshipSchema>;

// ============================================================================
// PARENT SCHEMAS
// ============================================================================

export const ParentChildRelationshipSchema = z.object({
  parent_id: UUIDSchema,
  student_id: UUIDSchema,
  relationship_type: z.enum(['mother', 'father', 'guardian', 'other']),
  is_primary_contact: z.boolean(),
  created_at: DateTimeSchema,
});

export type ParentChildRelationship = z.infer<typeof ParentChildRelationshipSchema>;

// ============================================================================
// CLASS & BATCH SCHEMAS
// ============================================================================

export const BatchSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  start_date: DateSchema,
  end_date: DateSchema.optional().nullable(),
  is_active: z.boolean(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type Batch = z.infer<typeof BatchSchema>;

export const ClassSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  batch_id: UUIDSchema,
  teacher_id: UUIDSchema.optional().nullable(),
  room_number: z.string().optional().nullable(),
  max_students: z.number().int().positive().optional().nullable(),
  schedule: z.string().optional().nullable(),
  is_active: z.boolean(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type Class = z.infer<typeof ClassSchema>;

// ============================================================================
// ATTENDANCE SCHEMAS
// ============================================================================

export const AttendanceSchema = z.object({
  id: UUIDSchema,
  student_id: UUIDSchema,
  class_id: UUIDSchema,
  date: DateSchema,
  status: z.enum(['present', 'absent', 'late', 'excused']),
  marked_by: UUIDSchema,
  notes: z.string().optional().nullable(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type Attendance = z.infer<typeof AttendanceSchema>;

// Attendance summary for parent dashboard
export const AttendanceSummarySchema = z.object({
  student_id: UUIDSchema,
  month: z.string(),
  total_days: z.number().int().nonnegative(),
  present_days: z.number().int().nonnegative(),
  absent_days: z.number().int().nonnegative(),
  late_days: z.number().int().nonnegative(),
  attendance_percentage: z.number().min(0).max(100),
});

export type AttendanceSummary = z.infer<typeof AttendanceSummarySchema>;

// ============================================================================
// PAYMENT & INVOICE SCHEMAS
// ============================================================================

export const InvoiceSchema = z.object({
  id: UUIDSchema,
  parent_id: UUIDSchema,
  student_id: UUIDSchema.optional().nullable(),
  invoice_number: z.string(),
  amount: z.number().positive(),
  due_date: DateSchema,
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  description: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  paid_at: DateTimeSchema.optional().nullable(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const FinancialSummarySchema = z.object({
  parent_id: UUIDSchema,
  total_invoices: z.number().int().nonnegative(),
  total_paid: z.number().nonnegative(),
  total_pending: z.number().nonnegative(),
  total_overdue: z.number().nonnegative(),
  pending_invoices_count: z.number().int().nonnegative(),
  overdue_invoices_count: z.number().int().nonnegative(),
  next_due_date: DateSchema.optional().nullable(),
});

export type FinancialSummary = z.infer<typeof FinancialSummarySchema>;

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationSchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema,
  title: z.string().min(1),
  content: z.string(),
  type: z.enum(['info', 'warning', 'success', 'error', 'announcement']),
  read_at: DateTimeSchema.optional().nullable(),
  action_url: z.string().optional().nullable(),
  created_at: DateTimeSchema,
});

export type Notification = z.infer<typeof NotificationSchema>;

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

export const MessageSchema = z.object({
  id: UUIDSchema,
  thread_id: UUIDSchema,
  sender_id: UUIDSchema,
  recipient_id: UUIDSchema,
  content: z.string().min(1),
  read_at: DateTimeSchema.optional().nullable(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type Message = z.infer<typeof MessageSchema>;

export const MessageThreadSchema = z.object({
  id: UUIDSchema,
  participant_ids: z.array(UUIDSchema),
  last_message: z.string().optional().nullable(),
  last_message_at: DateTimeSchema.optional().nullable(),
  unread_count: z.number().int().nonnegative(),
  created_at: DateTimeSchema,
});

export type MessageThread = z.infer<typeof MessageThreadSchema>;

// ============================================================================
// ASSIGNMENT & EXAM SCHEMAS
// ============================================================================

export const AssignmentSchema = z.object({
  id: UUIDSchema,
  class_id: UUIDSchema,
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  due_date: DateTimeSchema,
  max_score: z.number().positive(),
  created_by: UUIDSchema,
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type Assignment = z.infer<typeof AssignmentSchema>;

export const ExamSchema = z.object({
  id: UUIDSchema,
  class_id: UUIDSchema,
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  exam_date: DateTimeSchema,
  duration_minutes: z.number().int().positive(),
  max_score: z.number().positive(),
  created_by: UUIDSchema,
  created_at: DateTimeSchema,
});

export type Exam = z.infer<typeof ExamSchema>;

// ============================================================================
// HELPER: Validate arrays
// ============================================================================

/**
 * Create array schema from any schema
 *
 * Usage:
 * const students = arrayOf(StudentSchema).parse(apiData);
 */
export function arrayOf<T extends z.ZodType>(schema: T) {
  return z.array(schema);
}

/**
 * Make all fields optional (useful for partial updates)
 *
 * Usage:
 * const partialStudent = partial(StudentSchema).parse(updateData);
 */
export function partial<T extends z.ZodType>(schema: T) {
  return schema.partial();
}
