/**
 * TypeScript type definitions for Admin Services
 */

import { BaseEntity, UUID, Timestamp } from './common.types';

// ==================== USER MANAGEMENT ====================

export interface User extends BaseEntity {
  email: string;
  full_name?: string;
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  last_login_at?: Timestamp;
}

export interface CreateUserInput {
  email: string;
  full_name?: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  password?: string;
}

export interface UpdateUserInput {
  email?: string;
  full_name?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
}

export interface UserSearchFilters {
  search?: string;
  role?: 'student' | 'teacher' | 'parent' | 'admin';
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
}

// ==================== ROLES AND PERMISSIONS ====================

export interface UserRole extends BaseEntity {
  name: string;
  display_name: string;
  description?: string;
  is_custom: boolean;
  is_system: boolean;
  priority: number;
}

export interface Permission extends BaseEntity {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface RolePermission extends BaseEntity {
  role_id: UUID;
  permission_id: UUID;
}

export interface UserRoleAssignment extends BaseEntity {
  user_id: UUID;
  role_id: UUID;
  assigned_by: UUID;
  assigned_at: Timestamp;
  expires_at?: Timestamp;
}

export interface CreateRoleInput {
  name: string;
  display_name: string;
  description?: string;
  is_custom?: boolean;
  priority?: number;
}

export interface UpdateRoleInput {
  display_name?: string;
  description?: string;
  priority?: number;
}

export interface CreatePermissionInput {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

// ==================== SYSTEM METRICS ====================

export interface SystemMetric extends BaseEntity {
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  category?: string;
  metadata?: Record<string, any>;
  recorded_at: Timestamp;
}

export interface MetricTrend {
  timestamp: Timestamp;
  value: number;
  change_percentage?: number;
}

// ==================== SYSTEM ALERTS ====================

export interface SystemAlert extends BaseEntity {
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  is_resolved: boolean;
  resolved_by?: UUID;
  resolved_at?: Timestamp;
  resolution_notes?: string;
}

export interface CreateSystemAlertInput {
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

// ==================== RESOURCE UTILIZATION ====================

export interface ResourceUtilization extends BaseEntity {
  resource_type: string;
  current_usage: number;
  total_capacity: number;
  usage_percentage: number;
  status: 'normal' | 'warning' | 'critical';
}

// ==================== USER ACTIVITIES ====================

export interface UserActivity extends BaseEntity {
  user_id: UUID;
  activity_type: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export interface ActivityFilters {
  user_id?: UUID;
  activity_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface ActivitySummary {
  total_activities: number;
  unique_users: number;
  most_common_activity: string;
  timeframe: string;
}
