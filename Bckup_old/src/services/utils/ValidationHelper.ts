/**
 * Validation Helper Utilities
 * Data validation for Supabase operations
 * Phase 71: Comprehensive API Integration Layer
 */

import { UserRole } from '../../types/database';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Field validation rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

/**
 * ValidationHelper Class
 * Provides comprehensive validation for all data types
 */
export class ValidationHelper {
  // Email validation
  public static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || email.trim().length === 0) {
      errors.push('Email is required');
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        errors.push('Invalid email format');
      }
      
      if (email.length > 254) {
        errors.push('Email is too long (max 254 characters)');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Password validation
  public static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!password || password.length === 0) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      
      if (password.length > 128) {
        errors.push('Password is too long (max 128 characters)');
      }
      
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      let strength = 0;
      if (hasUppercase) strength++;
      if (hasLowercase) strength++;
      if (hasNumbers) strength++;
      if (hasSpecialChar) strength++;
      
      if (strength < 2) {
        errors.push('Password must contain at least 2 of: uppercase, lowercase, numbers, special characters');
      } else if (strength < 3) {
        warnings.push('Consider using a stronger password with more character types');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Name validation
  public static validateName(name: string, fieldName = 'Name'): ValidationResult {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push(`${fieldName} is required`);
    } else {
      const trimmed = name.trim();
      
      if (trimmed.length < 2) {
        errors.push(`${fieldName} must be at least 2 characters long`);
      }
      
      if (trimmed.length > 100) {
        errors.push(`${fieldName} is too long (max 100 characters)`);
      }
      
      // Allow letters, spaces, hyphens, and apostrophes
      const namePattern = /^[a-zA-Z\s'-]+$/;
      if (!namePattern.test(trimmed)) {
        errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Phone number validation
  public static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone || phone.trim().length === 0) {
      return { isValid: true, errors: [] }; // Phone is optional
    }
    
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      errors.push('Phone number must have at least 10 digits');
    }
    
    if (digitsOnly.length > 15) {
      errors.push('Phone number is too long (max 15 digits)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // User role validation
  public static validateUserRole(role: any): ValidationResult {
    const errors: string[] = [];
    const validRoles: UserRole[] = ['student', 'teacher', 'parent', 'admin'];
    
    if (!role) {
      errors.push('User role is required');
    } else if (!validRoles.includes(role)) {
      errors.push(`Invalid user role. Must be one of: ${validRoles.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generic field validation based on schema
  public static validateField(
    value: any,
    fieldName: string,
    rules: ValidationRule
  ): ValidationResult {
    const errors: string[] = [];
    
    // Required check
    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }
    
    // Skip other validations if field is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return { isValid: true, errors: [] };
    }
    
    const stringValue = String(value);
    
    // Length validations
    if (rules.minLength && stringValue.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
    }
    
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      errors.push(`${fieldName} must not exceed ${rules.maxLength} characters`);
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      errors.push(`${fieldName} format is invalid`);
    }
    
    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate object against schema
  public static validateObject(
    data: Record<string, any>,
    schema: ValidationSchema
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const [fieldName, rules] of Object.entries(schema)) {
      const fieldValue = data[fieldName];
      const fieldResult = this.validateField(fieldValue, fieldName, rules);
      
      errors.push(...fieldResult.errors);
      if (fieldResult.warnings) {
        warnings.push(...fieldResult.warnings);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Date validation
  public static validateDate(dateString: string, fieldName = 'Date'): ValidationResult {
    const errors: string[] = [];
    
    if (!dateString) {
      errors.push(`${fieldName} is required`);
    } else {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        errors.push(`${fieldName} is not a valid date`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Future date validation
  public static validateFutureDate(dateString: string, fieldName = 'Date'): ValidationResult {
    const baseValidation = this.validateDate(dateString, fieldName);
    if (!baseValidation.isValid) {
      return baseValidation;
    }
    
    const errors: string[] = [];
    const date = new Date(dateString);
    const now = new Date();
    
    if (date <= now) {
      errors.push(`${fieldName} must be in the future`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // UUID validation
  public static validateUUID(uuid: string, fieldName = 'ID'): ValidationResult {
    const errors: string[] = [];
    
    if (!uuid) {
      errors.push(`${fieldName} is required`);
    } else {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(uuid)) {
        errors.push(`${fieldName} is not a valid UUID`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Numeric validation
  public static validateNumber(
    value: any,
    fieldName: string,
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
      required?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    
    if (options.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }
    
    if (value === null || value === undefined || value === '') {
      return { isValid: true, errors: [] }; // Optional field
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      errors.push(`${fieldName} must be a number`);
      return { isValid: false, errors };
    }
    
    if (options.integer && !Number.isInteger(numValue)) {
      errors.push(`${fieldName} must be an integer`);
    }
    
    if (options.min !== undefined && numValue < options.min) {
      errors.push(`${fieldName} must be at least ${options.min}`);
    }
    
    if (options.max !== undefined && numValue > options.max) {
      errors.push(`${fieldName} must not exceed ${options.max}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // URL validation
  public static validateURL(url: string, fieldName = 'URL'): ValidationResult {
    const errors: string[] = [];
    
    if (!url || url.trim().length === 0) {
      return { isValid: true, errors: [] }; // URLs are usually optional
    }
    
    try {
      new URL(url);
    } catch {
      errors.push(`${fieldName} is not a valid URL`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // File validation
  public static validateFile(
    file: { size: number; type: string; name: string },
    fieldName = 'File',
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    
    // Size validation
    if (options.maxSize && file.size > options.maxSize) {
      const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
      errors.push(`${fieldName} size must not exceed ${maxSizeMB}MB`);
    }
    
    // Type validation
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      errors.push(`${fieldName} type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
    }
    
    // Extension validation
    if (options.allowedExtensions) {
      const extension = file.name.toLowerCase().split('.').pop();
      if (!extension || !options.allowedExtensions.includes(`.${extension}`)) {
        errors.push(`${fieldName} extension not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Predefined validation schemas for common entities
export const ValidationSchemas = {
  // User profile validation
  userProfile: {
    email: {
      required: true,
      custom: (value: string) => {
        const result = ValidationHelper.validateEmail(value);
        return result.isValid ? null : result.errors[0];
      },
    },
    full_name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    role: {
      required: true,
      custom: (value: UserRole) => {
        const result = ValidationHelper.validateUserRole(value);
        return result.isValid ? null : result.errors[0];
      },
    },
    phone: {
      required: false,
      custom: (value: string) => {
        if (!value) return null;
        const result = ValidationHelper.validatePhone(value);
        return result.isValid ? null : result.errors[0];
      },
    },
  },

  // Class validation
  class: {
    title: {
      required: true,
      minLength: 3,
      maxLength: 200,
    },
    subject: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    scheduled_at: {
      required: true,
      custom: (value: string) => {
        const result = ValidationHelper.validateFutureDate(value, 'Scheduled time');
        return result.isValid ? null : result.errors[0];
      },
    },
    duration_minutes: {
      required: true,
      custom: (value: number) => {
        const result = ValidationHelper.validateNumber(value, 'Duration', {
          min: 15,
          max: 480, // 8 hours max
          integer: true,
          required: true,
        });
        return result.isValid ? null : result.errors[0];
      },
    },
  },

  // Assignment validation
  assignment: {
    title: {
      required: true,
      minLength: 3,
      maxLength: 200,
    },
    description: {
      required: false,
      maxLength: 2000,
    },
    due_date: {
      required: false,
      custom: (value: string) => {
        if (!value) return null;
        const result = ValidationHelper.validateFutureDate(value, 'Due date');
        return result.isValid ? null : result.errors[0];
      },
    },
    total_points: {
      required: true,
      custom: (value: number) => {
        const result = ValidationHelper.validateNumber(value, 'Total points', {
          min: 1,
          max: 1000,
          integer: true,
          required: true,
        });
        return result.isValid ? null : result.errors[0];
      },
    },
  },
};

export default ValidationHelper;