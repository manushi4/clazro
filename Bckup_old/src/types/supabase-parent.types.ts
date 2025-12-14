/**
 * TypeScript Types for Parent Section - Supabase Database
 * Auto-generated from parent database schema
 * Last updated: 2025-10-19
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ParentRelationshipType =
  | 'mother'
  | 'father'
  | 'guardian'
  | 'grandparent'
  | 'sibling'
  | 'other';

export type NotificationChannel =
  | 'in_app'
  | 'email'
  | 'sms'
  | 'push';

export type ActionItemStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'dismissed'
  | 'expired';

export type CommunicationStatus =
  | 'draft'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'replied'
  | 'archived'
  | 'deleted';

export type CommunicationPriority =
  | 'urgent'
  | 'high'
  | 'normal'
  | 'low';

export type AIInsightCategory =
  | 'academic_performance'
  | 'behavioral_analysis'
  | 'attendance_pattern'
  | 'engagement_level'
  | 'learning_style'
  | 'peer_interaction'
  | 'emotional_wellbeing'
  | 'time_management'
  | 'subject_strength'
  | 'subject_weakness';

export type AIInsightSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'positive';

export type RiskFactorType =
  | 'attendance_drop'
  | 'grade_decline'
  | 'behavioral_concern'
  | 'engagement_decrease'
  | 'peer_conflict'
  | 'assignment_incomplete'
  | 'test_failure'
  | 'communication_gap'
  | 'emotional_distress'
  | 'learning_difficulty';

export type OpportunityType =
  | 'academic_excellence'
  | 'skill_development'
  | 'leadership_potential'
  | 'creative_talent'
  | 'athletic_ability'
  | 'peer_mentorship'
  | 'advanced_placement'
  | 'extracurricular'
  | 'scholarship_eligible'
  | 'competition_ready';

// ============================================================================
// DATABASE TABLES
// ============================================================================

export interface Parent {
  id: string;
  parent_id: string;
  occupation?: string;
  employer?: string;
  primary_phone: string;
  secondary_phone?: string;
  alternate_email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  preferred_communication_method: NotificationChannel;
  preferred_language: string;
  timezone: string;
  ai_insights_enabled: boolean;
  weekly_report_enabled: boolean;
  alert_notifications_enabled: boolean;
  payment_reminder_enabled: boolean;
  payment_reminder_days_before: number;
  auto_payment_enabled: boolean;
  data_sharing_consent: boolean;
  marketing_consent: boolean;
  terms_accepted_at?: string;
  privacy_policy_accepted_at?: string;
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
  last_login_at?: string;
  profile_completion_percentage: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ParentChildRelationship {
  id: string;
  parent_id: string;
  student_id: string;
  relationship_type: ParentRelationshipType;
  relationship_description?: string;
  is_primary_contact: boolean;
  can_view_academic_records: boolean;
  can_view_financial_records: boolean;
  can_view_attendance: boolean;
  can_view_behavior_reports: boolean;
  can_receive_emergency_alerts: boolean;
  can_authorize_pickups: boolean;
  can_approve_field_trips: boolean;
  can_make_payments: boolean;
  is_active: boolean;
  verified_at?: string;
  verified_by?: string;
  custody_documentation_url?: string;
  court_order_url?: string;
  legal_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface AIInsight {
  id: string;
  student_id: string;
  parent_id: string;
  insight_category: AIInsightCategory;
  severity: AIInsightSeverity;
  title: string;
  summary: string;
  detailed_analysis?: string;
  ai_model_version?: string;
  confidence_score?: number;
  data_sources?: Record<string, any>;
  analysis_period_start: string;
  analysis_period_end: string;
  impact_score?: number;
  trend_direction?: string;
  chart_data?: Record<string, any>;
  metrics?: Record<string, any>;
  related_subjects?: string[];
  related_classes?: string[];
  related_assignments?: string[];
  requires_action: boolean;
  action_taken: boolean;
  action_taken_at?: string;
  viewed_by_parent: boolean;
  viewed_at?: string;
  parent_acknowledged: boolean;
  parent_acknowledged_at?: string;
  parent_feedback?: string;
  parent_rating?: number;
  is_active: boolean;
  expires_at?: string;
  archived_at?: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface RiskFactor {
  id: string;
  student_id: string;
  parent_id: string;
  ai_insight_id?: string;
  risk_type: RiskFactorType;
  severity: AIInsightSeverity;
  title: string;
  description: string;
  potential_consequences?: string;
  risk_score: number;
  probability?: number;
  first_detected_at: string;
  last_detected_at: string;
  detection_frequency: number;
  contributing_factors?: Record<string, any>;
  related_subjects?: string[];
  related_classes?: string[];
  related_period_start?: string;
  related_period_end?: string;
  recommended_interventions?: string[];
  mitigation_plan?: string;
  resolution_steps?: Record<string, any>;
  is_resolved: boolean;
  resolved_at?: string;
  resolution_notes?: string;
  parent_notified: boolean;
  parent_notified_at?: string;
  parent_acknowledged: boolean;
  parent_acknowledged_at?: string;
  parent_comments?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  last_follow_up_at?: string;
  is_active: boolean;
  escalated: boolean;
  escalated_at?: string;
  escalated_to?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Opportunity {
  id: string;
  student_id: string;
  parent_id: string;
  ai_insight_id?: string;
  opportunity_type: OpportunityType;
  title: string;
  description: string;
  potential_benefits?: string;
  opportunity_score: number;
  confidence_level?: number;
  supporting_evidence?: Record<string, any>;
  related_subjects?: string[];
  related_classes?: string[];
  related_period_start?: string;
  related_period_end?: string;
  action_required: boolean;
  recommended_actions?: string[];
  action_deadline?: string;
  prerequisites?: string[];
  estimated_time_commitment?: string;
  estimated_cost?: number;
  currency: string;
  external_programs?: string[];
  scholarship_available: boolean;
  scholarship_details?: string;
  application_url?: string;
  application_deadline?: string;
  status: ActionItemStatus;
  pursued: boolean;
  pursued_at?: string;
  parent_notified: boolean;
  parent_notified_at?: string;
  parent_interested?: boolean;
  parent_interested_at?: string;
  parent_comments?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  outcome?: string;
  outcome_recorded_at?: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BehaviorTrend {
  id: string;
  student_id: string;
  parent_id: string;
  ai_insight_id?: string;
  behavior_category: string;
  trend_direction: string;
  title: string;
  summary: string;
  detailed_analysis?: string;
  period_start: string;
  period_end: string;
  baseline_score?: number;
  current_score?: number;
  change_percentage?: number;
  data_points: Record<string, any>;
  positive_behaviors?: string[];
  negative_behaviors?: string[];
  contributing_factors?: Record<string, any>;
  related_subjects?: string[];
  related_classes?: string[];
  related_teachers?: string[];
  recommendations?: string[];
  parental_support_suggestions?: string[];
  statistical_significance?: number;
  sample_size?: number;
  viewed_by_parent: boolean;
  viewed_at?: string;
  parent_feedback?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicPrediction {
  id: string;
  student_id: string;
  parent_id: string;
  ai_insight_id?: string;
  prediction_type: string;
  subject?: string;
  class_id?: string;
  title: string;
  summary: string;
  detailed_explanation?: string;
  predicted_outcome: string;
  confidence_level: number;
  probability?: number;
  predicted_score?: number;
  predicted_grade?: string;
  current_score?: number;
  prediction_date: string;
  target_date: string;
  prediction_horizon_days?: number;
  model_version?: string;
  model_accuracy?: number;
  key_factors?: Record<string, any>;
  positive_indicators?: string[];
  risk_indicators?: string[];
  best_case_scenario?: string;
  best_case_score?: number;
  worst_case_scenario?: string;
  worst_case_score?: number;
  most_likely_scenario?: string;
  most_likely_score?: number;
  improvement_recommendations?: string[];
  action_plan?: Record<string, any>;
  required_improvements?: string[];
  actual_outcome?: string;
  actual_score?: number;
  actual_grade?: string;
  prediction_accuracy?: number;
  validated_at?: string;
  viewed_by_parent: boolean;
  viewed_at?: string;
  parent_acknowledged: boolean;
  parent_acknowledged_at?: string;
  parent_feedback?: string;
  is_active: boolean;
  is_outdated: boolean;
  superseded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RecommendedAction {
  id: string;
  student_id: string;
  parent_id: string;
  ai_insight_id?: string;
  risk_factor_id?: string;
  opportunity_id?: string;
  action_type: string;
  priority: CommunicationPriority;
  title: string;
  description: string;
  reasoning?: string;
  expected_outcome?: string;
  action_steps?: Record<string, any>;
  recommended_by_date?: string;
  estimated_duration_minutes?: number;
  best_time_to_act?: string;
  required_resources?: string[];
  helpful_links?: Record<string, any>;
  attached_documents?: string[];
  potential_impact?: AIInsightSeverity;
  impact_description?: string;
  success_probability?: number;
  status: ActionItemStatus;
  started_at?: string;
  completed_at?: string;
  dismissed_at?: string;
  dismissal_reason?: string;
  viewed_by_parent: boolean;
  viewed_at?: string;
  parent_notes?: string;
  action_taken: boolean;
  action_taken_at?: string;
  action_notes?: string;
  outcome?: string;
  outcome_rating?: number;
  was_helpful?: boolean;
  requires_follow_up: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  reminder_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ParentTeacherCommunication {
  id: string;
  parent_id: string;
  student_id: string;
  teacher_id: string;
  subject: string;
  message: string;
  communication_type: string;
  priority: CommunicationPriority;
  status: CommunicationStatus;
  related_to?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  parent_message_id?: string;
  thread_id?: string;
  is_thread_starter: boolean;
  sent_by: string;
  sent_by_role: string;
  recipient_id: string;
  recipient_role: string;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  replied_at?: string;
  response_required: boolean;
  response_deadline?: string;
  response_received: boolean;
  attachments?: Record<string, any>;
  meeting_requested: boolean;
  proposed_meeting_dates?: Record<string, any>;
  meeting_scheduled_at?: string;
  meeting_location?: string;
  meeting_type?: string;
  meeting_link?: string;
  meeting_completed: boolean;
  meeting_notes?: string;
  is_escalated: boolean;
  escalated_at?: string;
  escalated_to?: string;
  escalation_reason?: string;
  is_confidential: boolean;
  involves_sensitive_info: boolean;
  tags?: string[];
  custom_metadata?: Record<string, any>;
  archived: boolean;
  archived_at?: string;
  archived_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ParentActionItem {
  id: string;
  parent_id: string;
  student_id: string;
  recommended_action_id?: string;
  communication_id?: string;
  ai_insight_id?: string;
  title: string;
  description?: string;
  action_type?: string;
  priority: CommunicationPriority;
  due_date?: string;
  due_time?: string;
  estimated_duration_minutes?: number;
  status: ActionItemStatus;
  started_at?: string;
  completed_at?: string;
  dismissed_at?: string;
  dismissal_reason?: string;
  completion_notes?: string;
  completion_proof_url?: string;
  reminder_enabled: boolean;
  reminder_before_days: number;
  last_reminder_sent_at?: string;
  reminder_count: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
  recurrence_config?: Record<string, any>;
  next_occurrence_date?: string;
  related_links?: Record<string, any>;
  attached_files?: string[];
  tags?: string[];
  assigned_by?: string;
  shared_with?: string[];
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface StudentAcademicSummary {
  student_id: string;
  period_start: string;
  period_end: string;
  attendance_rate: number | null;
  total_classes: number;
  classes_present: number;
  average_grade: number | null;
}

export interface AIInsightScore {
  overall_score: number | null;
  total_insights: number;
  critical_count: number;
  high_count: number;
  unviewed_count: number;
  requires_action_count: number;
}

export interface ParentDashboardSummary {
  parent_id: string;
  total_children: number;
  unread_messages: number;
  pending_actions: number;
  active_insights: number;
  critical_risks: number;
}

export interface FinancialSummary {
  total_paid: number;
  total_pending: number;
  payment_count: number;
}

export interface ChildInfo {
  student_id: string;
  student_name: string;
  student_email: string | null;
  student_phone: string | null;
  batch_id: string | null;
  relationship_type: ParentRelationshipType;
  is_primary_contact: boolean;
  enrollment_status: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export interface APIResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}
