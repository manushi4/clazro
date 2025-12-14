/**
 * TypeScript type definitions for Teacher Services
 */

import { BaseEntity, UUID, Timestamp } from './common.types';

// ==================== TEACHER ====================

export interface Teacher extends BaseEntity {
  user_id: UUID;
  full_name: string;
  email: string;
  phone?: string;
  subject_specialization?: string;
  qualification?: string;
  experience_years?: number;
  date_of_joining?: string;
  status: 'active' | 'inactive' | 'on_leave';
  profile_picture_url?: string;
  employee_id?: string;
  department?: string;
}

// ==================== ASSIGNMENTS ====================

export interface Assignment extends BaseEntity {
  title: string;
  description?: string;
  subject: string;
  teacher_id: UUID;
  class_id?: UUID;
  due_date: Timestamp;
  total_points: number;
  assignment_type: 'homework' | 'quiz' | 'test' | 'project' | 'exam';
  status: 'draft' | 'published' | 'archived';
  attachment_urls?: string[];
}

export interface CreateAssignmentInput {
  title: string;
  description?: string;
  subject: string;
  teacher_id: UUID;
  class_id?: UUID;
  due_date: Timestamp;
  total_points?: number;
  assignment_type?: 'homework' | 'quiz' | 'test' | 'project' | 'exam';
  status?: 'draft' | 'published' | 'archived';
  attachment_urls?: string[];
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  subject?: string;
  due_date?: Timestamp;
  total_points?: number;
  assignment_type?: 'homework' | 'quiz' | 'test' | 'project' | 'exam';
  status?: 'draft' | 'published' | 'archived';
  attachment_urls?: string[];
}

// ==================== ASSIGNMENT QUESTIONS ====================

export interface AssignmentQuestion extends BaseEntity {
  assignment_id: UUID;
  question_number: number;
  question_type:
    | 'mcq'
    | 'descriptive'
    | 'mathematical'
    | 'true-false'
    | 'fill-blank'
    | 'matching'
    | 'essay'
    | 'numerical'
    | 'code'
    | 'diagram';
  question_text: string;
  options?: Record<string, any>;
  correct_answer?: string;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  time_limit?: number;
  explanation?: string;
  hints?: Record<string, any>;
  tags?: string[];
}

export interface CreateQuestionInput {
  assignment_id: UUID;
  question_number: number;
  question_type:
    | 'mcq'
    | 'descriptive'
    | 'mathematical'
    | 'true-false'
    | 'fill-blank'
    | 'matching'
    | 'essay'
    | 'numerical'
    | 'code'
    | 'diagram';
  question_text: string;
  options?: Record<string, any>;
  correct_answer?: string;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  time_limit?: number;
  explanation?: string;
  hints?: Record<string, any>;
  tags?: string[];
}

export interface UpdateQuestionInput {
  question_number?: number;
  question_type?:
    | 'mcq'
    | 'descriptive'
    | 'mathematical'
    | 'true-false'
    | 'fill-blank'
    | 'matching'
    | 'essay'
    | 'numerical'
    | 'code'
    | 'diagram';
  question_text?: string;
  options?: Record<string, any>;
  correct_answer?: string;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  time_limit?: number;
  explanation?: string;
  hints?: Record<string, any>;
  tags?: string[];
}

// ==================== ASSIGNMENT RUBRICS ====================

export interface AssignmentRubric extends BaseEntity {
  assignment_id: UUID;
  criterion_name: string;
  criterion_description?: string;
  max_points: number;
  levels: Record<string, any>;
}

export interface CreateRubricInput {
  assignment_id: UUID;
  criterion_name: string;
  criterion_description?: string;
  max_points: number;
  levels?: Record<string, any>;
}

export interface UpdateRubricInput {
  criterion_name?: string;
  criterion_description?: string;
  max_points?: number;
  levels?: Record<string, any>;
}

// ==================== ASSIGNMENT TEMPLATES ====================

export interface AssignmentTemplate extends BaseEntity {
  teacher_id: UUID;
  template_name: string;
  template_description?: string;
  template_type: 'homework' | 'quiz' | 'test' | 'project' | 'exam';
  template_data: Record<string, any>;
  is_public: boolean;
  usage_count: number;
}

export interface CreateTemplateInput {
  teacher_id: UUID;
  template_name: string;
  template_description?: string;
  template_type: 'homework' | 'quiz' | 'test' | 'project' | 'exam';
  template_data: Record<string, any>;
  is_public?: boolean;
}

// ==================== ASSIGNMENT SUBMISSIONS ====================

export interface AssignmentSubmission extends BaseEntity {
  assignment_id: UUID;
  student_id: UUID;
  submission_text?: string;
  attachment_urls?: string[];
  submitted_at: Timestamp;
  score?: number;
  feedback?: string;
  graded_by?: UUID;
  graded_at?: Timestamp;
  status: 'pending' | 'submitted' | 'graded' | 'late';
}

export interface GradeInput {
  score: number;
  feedback?: string;
  graded_by: UUID;
  rubric_scores?: RubricScores;
}

export interface BulkGradeInput {
  submission_id: UUID;
  score: number;
  feedback?: string;
}

export interface RubricScores {
  [criterionId: string]: number;
}

export interface UpdateGradeInput {
  score?: number;
  feedback?: string;
}

// ==================== ATTENDANCE ====================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance extends BaseEntity {
  student_id: UUID;
  class_id?: UUID;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  marked_by?: UUID;
}

export interface BulkAttendanceInput {
  student_id: UUID;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceReport extends BaseEntity {
  teacher_id: UUID;
  title: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  start_date: string;
  end_date: string;
  total_sessions: number;
  average_attendance: number;
  students_at_risk: number;
  perfect_attendance: number;
  report_data: Record<string, any>;
  report_file_url?: string;
  generated_at: Timestamp;
}

export interface ReportParams {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  start_date: string;
  end_date: string;
  class_id?: UUID;
  student_ids?: UUID[];
}

export interface AttendanceAlert extends BaseEntity {
  student_id: UUID;
  teacher_id: UUID;
  alert_type: 'low_attendance' | 'consecutive_absences' | 'pattern_detected' | 'at_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold_value?: number;
  current_value?: number;
  is_acknowledged: boolean;
  acknowledged_by?: UUID;
  acknowledged_at?: Timestamp;
  is_resolved: boolean;
  resolution_notes?: string;
  resolved_at?: Timestamp;
}

export interface AlertFilters {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  is_acknowledged?: boolean;
  is_resolved?: boolean;
  student_id?: UUID;
}

export interface AttendancePattern extends BaseEntity {
  student_id: UUID;
  pattern_type: 'weekly' | 'monthly' | 'custom';
  pattern_description: string;
  confidence_score: number;
  identified_at: Timestamp;
  pattern_data: Record<string, any>;
}

// ==================== LIVE SESSIONS ====================

export interface LiveSession extends BaseEntity {
  title: string;
  teacher_id: UUID;
  class_id: UUID;
  subject_id?: UUID;
  scheduled_start_at: Timestamp;
  scheduled_end_at?: Timestamp;
  actual_start_at?: Timestamp;
  actual_end_at?: Timestamp;
  duration_minutes?: number;
  meeting_link?: string;
  meeting_id?: string;
  passcode?: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  recording_url?: string;
  participant_count?: number;
  is_recorded: boolean;
}

export interface CreateSessionInput {
  title: string;
  teacher_id: UUID;
  class_id: UUID;
  subject_id?: UUID;
  scheduled_start_at: Timestamp;
  scheduled_end_at?: Timestamp;
  duration_minutes?: number;
  meeting_link?: string;
  description?: string;
}

export interface SessionRecording extends BaseEntity {
  session_id: UUID;
  recording_url: string;
  recording_size_mb: number;
  duration_minutes: number;
  recording_started_at: Timestamp;
  recording_ended_at: Timestamp;
  is_available: boolean;
}

export interface WhiteboardData extends BaseEntity {
  session_id: UUID;
  page_number: number;
  canvas_data: any;
  thumbnail_url?: string;
}

export interface ScreenShare extends BaseEntity {
  session_id: UUID;
  user_id: UUID;
  share_type: 'full-screen' | 'window' | 'tab';
  started_at: Timestamp;
  ended_at?: Timestamp;
  is_active: boolean;
}

export type ShareType = 'full-screen' | 'window' | 'tab';

export interface BreakoutRoom extends BaseEntity {
  session_id: UUID;
  room_name: string;
  room_number?: number;
  max_participants: number;
  topic?: string;
  created_by: UUID;
  closed_at?: Timestamp;
}

export interface CreateBreakoutRoomInput {
  session_id: UUID;
  room_name: string;
  room_number?: number;
  max_participants?: number;
  topic?: string;
  created_by: UUID;
}

// ==================== DASHBOARD ====================

export interface TeacherDashboard {
  teacher: Teacher;
  stats: TeacherStats;
  upcomingClasses: LiveSession[];
  pendingGrading: AssignmentSubmission[];
  studentsAtRisk: StudentAtRisk[];
  recentActivity: Activity[];
}

export interface TeacherStats {
  total_students: number;
  total_assignments: number;
  pending_grading: number;
  average_class_attendance: number;
  total_sessions: number;
  average_rating?: number;
}

export interface StudentAtRisk {
  student_id: UUID;
  student_name: string;
  risk_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggested_action: string;
}

export interface Activity {
  id: UUID;
  type: string;
  description: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

// ==================== GRADING ====================

export interface SubmissionStats {
  total_submissions: number;
  graded: number;
  pending: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
}

export interface GradeDistribution {
  assignment_id: UUID;
  grade_ranges: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  average: number;
  median: number;
  mode: number;
}

// ==================== TEACHER PERFORMANCE ====================

export interface TeacherPerformance {
  teacher_id: UUID;
  total_assignments: number;
  average_grading_time_hours: number;
  total_sessions: number;
  average_attendance_percentage: number;
  student_satisfaction_rating?: number;
  completion_rate: number;
}
