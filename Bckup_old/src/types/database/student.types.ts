/**
 * TypeScript type definitions for Student Services
 */

import { BaseEntity, UUID, Timestamp } from './common.types';

// ==================== STUDENT ====================

export interface Student extends BaseEntity {
  student_id: string;
  user_id: UUID;
  full_name: string;
  email: string;
  phone?: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth?: string;
  address?: string;
  enrollment_date: string;
  batch_id?: UUID;
  class_id?: UUID;
  section?: string;
  roll_number?: string;
  blood_group?: string;
  emergency_contact?: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  profile_picture_url?: string;
  academic_year?: string;
}

// ==================== STUDY PLANS ====================

export interface StudyPlan extends BaseEntity {
  student_id: UUID;
  title: string;
  description?: string;
  subject_id?: UUID;
  duration?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: Record<string, any>;
  progress: number;
  estimated_time?: string;
  ai_generated: boolean;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
}

export interface CreateStudyPlanInput {
  student_id: UUID;
  title: string;
  description?: string;
  subject_id?: UUID;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  topics?: Record<string, any>;
  duration?: string;
  estimated_time?: string;
  ai_generated?: boolean;
}

export interface UpdateStudyPlanInput {
  title?: string;
  description?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  topics?: Record<string, any>;
  progress?: number;
  status?: 'active' | 'completed' | 'paused' | 'cancelled';
}

// ==================== LEARNING ANALYTICS ====================

export interface LearningAnalytics extends BaseEntity {
  student_id: UUID;
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';
  style_percentage: number;
  strengths: Record<string, any>;
  weaknesses: Record<string, any>;
  recommendations: Record<string, any>;
  last_analyzed: Timestamp;
}

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';

export interface UpdateLearningStyleInput {
  learning_style: LearningStyle;
  style_percentage?: number;
  strengths?: Record<string, any>;
  weaknesses?: Record<string, any>;
}

// ==================== AI RECOMMENDATIONS ====================

export interface AIRecommendation extends BaseEntity {
  student_id: UUID;
  title: string;
  type: 'resource' | 'practice' | 'revision' | 'concept' | 'video' | 'exercise';
  subject_id?: UUID;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  estimated_time?: string;
  difficulty?: number;
  resource_url?: string;
  completion_status: 'pending' | 'started' | 'completed' | 'skipped';
  completed_at?: Timestamp;
  status: 'active' | 'inactive' | 'expired';
}

export interface RecommendationFilters {
  type?: 'resource' | 'practice' | 'revision' | 'concept' | 'video' | 'exercise';
  subject_id?: UUID;
  priority?: 'High' | 'Medium' | 'Low';
  completion_status?: 'pending' | 'started' | 'completed' | 'skipped';
  status?: 'active' | 'inactive' | 'expired';
}

export interface CreateRecommendationInput {
  student_id: UUID;
  title: string;
  type: 'resource' | 'practice' | 'revision' | 'concept' | 'video' | 'exercise';
  subject_id?: UUID;
  priority?: 'High' | 'Medium' | 'Low';
  reason: string;
  estimated_time?: string;
  difficulty?: number;
  resource_url?: string;
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

// ==================== GRADES ====================

export interface Grade extends BaseEntity {
  student_id: UUID;
  subject_code: string;
  exam_type: string;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  remarks?: string;
  exam_date: string;
}

// ==================== ATTENDANCE ====================

export interface Attendance extends BaseEntity {
  student_id: UUID;
  class_id?: UUID;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  marked_by?: UUID;
}

export interface AttendanceSummary {
  student_id: UUID;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  attendance_percentage: number;
  period_start?: string;
  period_end?: string;
}

// ==================== ACADEMIC PERFORMANCE ====================

export interface AcademicPerformance {
  student_id: UUID;
  student_code: string;
  full_name: string;
  average_exam_percentage: number;
  average_assignment_score?: number;
  attendance_percentage: number;
  overall_performance: 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement' | 'Poor';
  total_assignments?: number;
  completed_assignments?: number;
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

// ==================== DASHBOARD ====================

export interface StudentDashboard {
  student: Student;
  attendance: AttendanceSummary;
  upcomingAssignments: Assignment[];
  recentGrades: Grade[];
  upcomingClasses: LiveSession[];
  academicPerformance: AcademicPerformance;
  pendingActions: number;
  aiRecommendations: AIRecommendation[];
  studyPlans: StudyPlan[];
}

// ==================== PROGRESS TRACKING ====================

export interface StudentProgress {
  student_id: UUID;
  subject_id?: UUID;
  assignments_completed: number;
  assignments_total: number;
  average_score: number;
  attendance_rate: number;
  improvement_percentage: number;
  last_updated: Timestamp;
}

export interface ProgressFilters {
  subject_id?: UUID;
  start_date?: string;
  end_date?: string;
}
