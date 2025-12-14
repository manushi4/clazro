/**
 * Error Handler Utility
 * Centralized error handling for Supabase operations
 * Phase 71: Comprehensive API Integration Layer
 */

import { PostgrestError } from '@supabase/supabase-js';
import { ApiResponse } from '../../lib/supabase';

// Error types
export type ErrorCategory = 
  | 'authentication'
  | 'authorization' 
  | 'validation'
  | 'network'
  | 'database'
  | 'storage'
  | 'realtime'
  | 'business_logic'
  | 'unknown';

export interface ErrorDetails {
  code: string;
  message: string;
  category: ErrorCategory;
  details?: any;
  timestamp: Date;
  userId?: string;
  operation?: string;
}

export class SupabaseError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly operation?: string;

  constructor(errorDetails: ErrorDetails) {
    super(errorDetails.message);
    this.name = 'SupabaseError';
    this.code = errorDetails.code;
    this.category = errorDetails.category;
    this.details = errorDetails.details;
    this.timestamp = errorDetails.timestamp;
    this.userId = errorDetails.userId;
    this.operation = errorDetails.operation;
  }
}

// Error code mappings
const ERROR_CODE_MAPPINGS: Record<string, ErrorCategory> = {
  // Authentication errors
  'invalid_credentials': 'authentication',
  'email_not_confirmed': 'authentication', 
  'invalid_token': 'authentication',
  'token_expired': 'authentication',
  'user_not_found': 'authentication',
  'signup_disabled': 'authentication',

  // Authorization errors  
  'insufficient_permissions': 'authorization',
  'access_denied': 'authorization',
  'rls_policy_violation': 'authorization',

  // Validation errors
  'invalid_input': 'validation',
  'required_field_missing': 'validation',
  'invalid_email_format': 'validation',
  'password_too_weak': 'validation',

  // Database errors
  'unique_violation': 'database',
  'foreign_key_violation': 'database',
  'check_constraint_violation': 'database',
  'not_null_violation': 'database',

  // Network errors
  'network_error': 'network',
  'timeout': 'network',
  'connection_lost': 'network',

  // Storage errors
  'file_too_large': 'storage',
  'invalid_file_type': 'storage',
  'storage_quota_exceeded': 'storage',

  // Real-time errors
  'subscription_failed': 'realtime',
  'channel_error': 'realtime',
};

/**
 * Error Handler Class
 * Provides centralized error handling and logging
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorDetails[] = [];
  private readonly MAX_QUEUE_SIZE = 100;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and transform Supabase errors
   */
  public handleError(
    error: any, 
    operation?: string, 
    userId?: string
  ): SupabaseError {
    const errorDetails = this.parseError(error, operation, userId);
    const supabaseError = new SupabaseError(errorDetails);
    
    this.logError(errorDetails);
    this.queueError(errorDetails);
    
    return supabaseError;
  }

  /**
   * Create standardized API response for errors
   */
  public createErrorResponse<T = null>(
    error: any,
    operation?: string,
    userId?: string
  ): ApiResponse<T> {
    const supabaseError = this.handleError(error, operation, userId);
    
    return {
      data: null,
      error: supabaseError.message,
      success: false,
      timestamp: new Date(),
    };
  }

  /**
   * Create success response
   */
  public createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      error: null,
      success: true,
      timestamp: new Date(),
    };
  }

  /**
   * Parse and categorize errors
   */
  private parseError(
    error: any, 
    operation?: string, 
    userId?: string
  ): ErrorDetails {
    const timestamp = new Date();

    // Handle Supabase PostgrestError
    if (this.isPostgrestError(error)) {
      return {
        code: error.code || 'database_error',
        message: this.getReadableMessage(error.message),
        category: this.categorizeError(error.code || error.message),
        details: {
          hint: error.hint,
          details: error.details,
        },
        timestamp,
        userId,
        operation,
      };
    }

    // Handle Auth errors
    if (error?.message?.includes('Auth')) {
      return {
        code: 'auth_error',
        message: this.getReadableMessage(error.message),
        category: 'authentication',
        details: error,
        timestamp,
        userId,
        operation,
      };
    }

    // Handle network errors
    if (error?.name === 'NetworkError' || error?.message?.includes('network')) {
      return {
        code: 'network_error',
        message: 'Network connection failed. Please check your internet connection.',
        category: 'network',
        details: error,
        timestamp,
        userId,
        operation,
      };
    }

    // Handle generic errors
    return {
      code: 'unknown_error',
      message: error?.message || 'An unexpected error occurred',
      category: 'unknown',
      details: error,
      timestamp,
      userId,
      operation,
    };
  }

  /**
   * Check if error is a Supabase PostgrestError
   */
  private isPostgrestError(error: any): error is PostgrestError {
    return error && typeof error === 'object' && 'code' in error;
  }

  /**
   * Categorize error based on code or message
   */
  private categorizeError(codeOrMessage: string): ErrorCategory {
    const lowerCode = codeOrMessage.toLowerCase();
    
    for (const [code, category] of Object.entries(ERROR_CODE_MAPPINGS)) {
      if (lowerCode.includes(code)) {
        return category;
      }
    }
    
    return 'unknown';
  }

  /**
   * Convert technical error messages to user-friendly ones
   */
  private getReadableMessage(technicalMessage: string): string {
    const messageMap: Record<string, string> = {
      'duplicate key value violates unique constraint': 'This item already exists',
      'violates foreign key constraint': 'Referenced item does not exist',
      'violates not-null constraint': 'Required information is missing',
      'invalid input syntax': 'Invalid data format provided',
      'permission denied': 'You do not have permission to perform this action',
      'row level security': 'Access denied by security policy',
      'JWT expired': 'Your session has expired. Please log in again',
      'invalid_credentials': 'Invalid email or password',
      'email_not_confirmed': 'Please confirm your email address',
    };

    for (const [technical, readable] of Object.entries(messageMap)) {
      if (technicalMessage.toLowerCase().includes(technical)) {
        return readable;
      }
    }

    return technicalMessage;
  }

  /**
   * Log error for debugging and monitoring
   */
  private logError(errorDetails: ErrorDetails): void {
    const logLevel = this.getLogLevel(errorDetails.category);
    
    const logData = {
      level: logLevel,
      category: errorDetails.category,
      code: errorDetails.code,
      message: errorDetails.message,
      operation: errorDetails.operation,
      userId: errorDetails.userId,
      timestamp: errorDetails.timestamp.toISOString(),
      details: errorDetails.details,
    };

    if (logLevel === 'error') {
      console.error('🚨 Supabase Error:', logData);
    } else if (logLevel === 'warn') {
      console.warn('⚠️ Supabase Warning:', logData);
    } else {
      console.log('ℹ️ Supabase Info:', logData);
    }

    // In production, this would send to an error monitoring service
    // like Sentry, LogRocket, or custom analytics
  }

  /**
   * Queue error for batch processing/reporting
   */
  private queueError(errorDetails: ErrorDetails): void {
    this.errorQueue.push(errorDetails);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      this.errorQueue.shift(); // Remove oldest error
    }
  }

  /**
   * Get log level based on error category
   */
  private getLogLevel(category: ErrorCategory): 'error' | 'warn' | 'info' {
    switch (category) {
      case 'authentication':
      case 'authorization':
      case 'database':
      case 'storage':
        return 'error';
      case 'network':
      case 'realtime':
        return 'warn';
      case 'validation':
      case 'business_logic':
        return 'info';
      default:
        return 'error';
    }
  }

  /**
   * Get recent errors (for debugging/monitoring)
   */
  public getRecentErrors(limit: number = 10): ErrorDetails[] {
    return this.errorQueue.slice(-limit);
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): Record<ErrorCategory, number> {
    const stats: Record<ErrorCategory, number> = {
      authentication: 0,
      authorization: 0,
      validation: 0,
      network: 0,
      database: 0,
      storage: 0,
      realtime: 0,
      business_logic: 0,
      unknown: 0,
    };

    this.errorQueue.forEach(error => {
      stats[error.category]++;
    });

    return stats;
  }

  /**
   * Clear error queue
   */
  public clearErrors(): void {
    this.errorQueue = [];
  }

  /**
   * Check if error should be retried
   */
  public shouldRetry(error: SupabaseError): boolean {
    const retryableCategories: ErrorCategory[] = ['network', 'realtime'];
    const retryableCodes = ['timeout', 'connection_lost', 'network_error'];
    
    return (
      retryableCategories.includes(error.category) ||
      retryableCodes.includes(error.code)
    );
  }

  /**
   * Get retry delay (exponential backoff)
   */
  public getRetryDelay(attemptNumber: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
    return delay;
  }
}

// Singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleSupabaseError = (
  error: any, 
  operation?: string, 
  userId?: string
): SupabaseError => {
  return errorHandler.handleError(error, operation, userId);
};

export const createErrorResponse = <T = null>(
  error: any,
  operation?: string,
  userId?: string
): ApiResponse<T> => {
  return errorHandler.createErrorResponse(error, operation, userId);
};

export const createSuccessResponse = <T>(data: T): ApiResponse<T> => {
  return errorHandler.createSuccessResponse(data);
};

// Error boundary helper for React components
export const withErrorBoundary = <T extends {}>(
  component: React.ComponentType<T>
): React.ComponentType<T> => {
  return (props: T) => {
    try {
      return React.createElement(component, props);
    } catch (error) {
      console.error('Component Error:', error);
      const supabaseError = handleSupabaseError(error, 'component_render');
      throw supabaseError;
    }
  };
};