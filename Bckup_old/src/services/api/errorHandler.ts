/**
 * API Error Handling Module
 *
 * This module provides centralized error handling, custom error classes,
 * and retry logic for API operations.
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  code?: string;
  details?: string;
  statusCode?: number;
  isRetryable: boolean;

  constructor(
    message: string,
    code?: string,
    details?: string,
    statusCode?: number,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Network error class for connection issues
 */
export class NetworkError extends APIError {
  constructor(message: string = 'Network connection error') {
    super(message, 'NETWORK_ERROR', undefined, undefined, true);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', undefined, 401, false);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends APIError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', undefined, 403, false);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', undefined, 404, false);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends APIError {
  constructor(message: string, details?: string) {
    super(message, 'VALIDATION_ERROR', details, 400, false);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', undefined, 429, true);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error code to HTTP status mapping
 */
const ERROR_CODE_MAP: Record<string, number> = {
  PGRST116: 404, // Not found
  PGRST301: 401, // JWT expired
  PGRST302: 401, // JWT invalid
  '42501': 403, // Insufficient privileges
  '23505': 409, // Unique violation
  '23503': 409, // Foreign key violation
  '42P01': 500, // Undefined table
};

/**
 * Retryable error codes
 */
const RETRYABLE_CODES = [
  'NETWORK_ERROR',
  'PGRST000', // Generic Postgrest error
  'PGRST001', // Connection error
  '57P01', // Admin shutdown
  '57P02', // Crash shutdown
  '57P03', // Cannot connect now
  '58000', // System error
  '58030', // IO error
];

/**
 * Parse Supabase/Postgrest errors into custom error classes
 * @param error - Error from Supabase
 * @returns Custom APIError instance
 */
export function parseSupabaseError(error: PostgrestError | Error | any): APIError {
  // Handle network errors
  if (error.message?.includes('fetch failed') || error.message?.includes('Network request failed')) {
    return new NetworkError();
  }

  // Handle PostgrestError
  if ('code' in error && 'message' in error) {
    const statusCode = ERROR_CODE_MAP[error.code] || 500;
    const isRetryable = RETRYABLE_CODES.includes(error.code);

    // Check for specific error types
    if (error.code === 'PGRST301' || error.code === 'PGRST302') {
      return new AuthenticationError(error.message);
    }

    if (error.code === '42501') {
      return new AuthorizationError(error.message);
    }

    if (error.code === 'PGRST116') {
      return new NotFoundError(error.message);
    }

    return new APIError(
      error.message,
      error.code,
      error.details || error.hint,
      statusCode,
      isRetryable
    );
  }

  // Handle standard Error
  if (error instanceof Error) {
    return new APIError(error.message, undefined, undefined, 500, false);
  }

  // Fallback
  return new APIError('An unexpected error occurred', 'UNKNOWN_ERROR', undefined, 500, false);
}

/**
 * Get user-friendly error message
 * @param error - Error object
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: APIError | Error): string {
  if (error instanceof NetworkError) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  if (error instanceof AuthenticationError) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error instanceof AuthorizationError) {
    return 'You do not have permission to access this resource.';
  }

  if (error instanceof NotFoundError) {
    return 'The requested information could not be found.';
  }

  if (error instanceof ValidationError) {
    return error.message || 'Please check your input and try again.';
  }

  if (error instanceof RateLimitError) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (error instanceof APIError) {
    // Map common database errors to user-friendly messages
    if (error.code === '23505') {
      return 'This record already exists.';
    }
    if (error.code === '23503') {
      return 'This action cannot be completed due to related records.';
    }
    if (error.code === '42P01') {
      return 'A system error occurred. Please contact support.';
    }

    return error.message || 'An error occurred. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
};

/**
 * Sleep function for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @returns Promise with function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: APIError | undefined;
  let delay = retryConfig.delayMs;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const apiError = parseSupabaseError(error);
      lastError = apiError;

      // Don't retry if error is not retryable or we've exhausted retries
      if (!apiError.isRetryable || attempt === retryConfig.maxRetries) {
        throw apiError;
      }

      // Log retry attempt
      console.warn(`Retry attempt ${attempt + 1}/${retryConfig.maxRetries} after error:`, apiError.message);

      // Wait before retrying
      await sleep(Math.min(delay, retryConfig.maxDelayMs));
      delay *= retryConfig.backoffMultiplier;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new APIError('Unknown error during retry');
}

/**
 * Log error with context
 * @param error - Error to log
 * @param context - Additional context
 */
export function logError(error: Error | APIError, context?: Record<string, any>): void {
  if (__DEV__) {
    console.error('API Error:', {
      name: error.name,
      message: error.message,
      ...(error instanceof APIError && {
        code: error.code,
        details: error.details,
        statusCode: error.statusCode,
        isRetryable: error.isRetryable,
      }),
      ...context,
    });
  }
}

/**
 * Error handler wrapper for async functions
 * @param fn - Async function to wrap
 * @returns Wrapped function with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const apiError = parseSupabaseError(error);
      logError(apiError, { context, args });
      throw apiError;
    }
  }) as T;
}
