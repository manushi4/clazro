/**
 * Common TypeScript type definitions for the service layer
 * Used across multiple services
 */

// ==================== COMMON ENUMS ====================

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type Gender = 'Male' | 'Female' | 'Other';

// ==================== COMMON INTERFACES ====================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

// ==================== DATE RANGE ====================

export interface DateRange {
  start_date: string;
  end_date: string;
}

// ==================== FILTERS ====================

export interface BaseFilters {
  search?: string;
  status?: string;
  created_after?: string;
  created_before?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ==================== NOTIFICATIONS ====================

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  created_at: string;
}

export type NotificationType =
  | 'assignment'
  | 'grade'
  | 'attendance'
  | 'payment'
  | 'announcement'
  | 'system'
  | 'alert'
  | 'reminder';

export interface NotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
}

// ==================== FILE UPLOAD ====================

export interface UploadResult {
  path: string;
  url: string;
  size: number;
  type: string;
  bucket: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// ==================== ANALYTICS ====================

export interface AnalyticsEvent {
  event_name: string;
  user_id?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ==================== SERVICE ERROR ====================

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

// ==================== UTILITY TYPES ====================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Timestamp = string;
export type UUID = string;
export type ISO8601Date = string;

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
