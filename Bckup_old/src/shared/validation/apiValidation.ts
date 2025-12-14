/**
 * API Validation Helpers
 * Makes it easy to validate API responses and catch shape drift
 *
 * Usage:
 * const students = await validateArray(StudentSchema, apiData);
 * const profile = await validateSingle(ProfileSchema, apiData);
 */

import { z, ZodError } from 'zod';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a single object
 * Throws detailed error if validation fails
 *
 * @example
 * const profile = validateSingle(ProfileSchema, data);
 */
export function validateSingle<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('L [API Validation Failed]', {
        schema: schema.description || 'Unknown',
        errors: error.errors,
        data,
      });
      throw new Error(
        `API validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Validate an array of objects
 *
 * @example
 * const students = validateArray(StudentSchema, apiData);
 */
export function validateArray<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T>[] {
  return validateSingle(z.array(schema), data);
}

/**
 * Validate but return null instead of throwing on error
 * Useful for optional data
 *
 * @example
 * const profile = validateOptional(ProfileSchema, data);
 * if (!profile) {
 *   // Handle missing data
 * }
 */
export function validateOptional<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.warn('   [Optional validation failed]', {
        schema: schema.description || 'Unknown',
        errors: error.errors,
      });
      return null;
    }
    throw error;
  }
}

/**
 * Validate partial data (all fields optional)
 * Useful for updates/patches
 *
 * @example
 * const updates = validatePartial(StudentSchema, formData);
 */
export function validatePartial<T extends z.ZodType>(
  schema: T,
  data: unknown
): Partial<z.infer<T>> {
  return validateSingle(schema.partial(), data);
}

// ============================================================================
// SUPABASE-SPECIFIC HELPERS
// ============================================================================

/**
 * Validate Supabase response
 * Handles both single and array responses
 *
 * @example
 * const { data, error } = await supabase.from('students').select('*');
 * const students = validateSupabaseResponse(StudentSchema, data, error);
 */
export function validateSupabaseResponse<T extends z.ZodType>(
  schema: T,
  data: unknown,
  error: Error | null,
  options: { isArray?: boolean } = {}
): z.infer<T> | z.infer<T>[] {
  // Check for Supabase error first
  if (error) {
    console.error('L [Supabase Error]', error);
    throw new Error(`Database error: ${error.message}`);
  }

  // Check for null/undefined data
  if (data === null || data === undefined) {
    console.error('L [No Data Returned]', { schema: schema.description });
    throw new Error('No data returned from database');
  }

  // Validate based on expected type
  if (options.isArray) {
    return validateArray(schema, data);
  } else {
    return validateSingle(schema, data);
  }
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Log validation schema for debugging
 * Only logs in development
 */
export function logSchema<T extends z.ZodType>(schema: T, label?: string): void {
  if (__DEV__) {
    console.log(`=Ë [Schema: ${label || 'Unknown'}]`, {
      shape: schema._def,
    });
  }
}

/**
 * Test if data matches schema without throwing
 * Returns boolean + detailed errors
 */
export function testSchema<T extends z.ZodType>(
  schema: T,
  data: unknown
): { valid: boolean; errors?: z.ZodError } {
  const result = schema.safeParse(data);
  return {
    valid: result.success,
    errors: result.success ? undefined : result.error,
  };
}

// ============================================================================
// ERROR RECOVERY
// ============================================================================

/**
 * Validate with fallback value
 * Returns fallback if validation fails (doesn't throw)
 *
 * @example
 * const students = validateWithFallback(StudentSchema, data, []);
 */
export function validateWithFallback<T extends z.ZodType>(
  schema: T,
  data: unknown,
  fallback: z.infer<T>
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.warn('   [Validation failed, using fallback]', {
        errors: error.errors,
        fallback,
      });
      return fallback;
    }
    throw error;
  }
}

/**
 * Validate and clean data
 * Removes unknown fields, keeps only schema-defined ones
 *
 * @example
 * const cleanStudent = validateAndClean(StudentSchema, dirtyData);
 */
export function validateAndClean<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data; // Only returns fields defined in schema
  }
  throw new Error(
    `Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`
  );
}
