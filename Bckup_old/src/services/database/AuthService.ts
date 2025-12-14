/**
 * Authentication Service
 * Handles user authentication and profile management
 * Phase 71: Comprehensive API Integration Layer
 */

import { Session, User, AuthError } from '@supabase/supabase-js';
import supabase, { ApiResponse } from '../../lib/supabase';
import { Profile, ProfileInsert, ProfileUpdate, UserRole } from '../../types/database';
import { createSuccessResponse, createErrorResponse } from '../utils/ErrorHandler';
import { ValidationHelper, ValidationSchemas } from '../utils/ValidationHelper';
import { cacheManager, CacheKeys, CacheDurations } from '../utils/CacheManager';

// Authentication result types
export interface LoginResult {
  user: User;
  session: Session;
  profile: Profile;
}

export interface RegisterResult {
  user: User;
  session: Session;
  profile: Profile;
  needsEmailConfirmation: boolean;
}

export interface PasswordResetResult {
  message: string;
  resetSent: boolean;
}

/**
 * AuthService Class
 * Comprehensive authentication and user management
 */
export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Register a new user
   */
  public async register(
    email: string,
    password: string,
    userData: {
      full_name: string;
      role: UserRole;
      phone?: string;
      institution?: string;
    }
  ): Promise<ApiResponse<RegisterResult>> {
    try {
      // Validate input data
      const validationResult = ValidationHelper.validateObject(
        { email, full_name: userData.full_name, role: userData.role, phone: userData.phone },
        ValidationSchemas.userProfile
      );

      if (!validationResult.isValid) {
        return createErrorResponse(
          { message: validationResult.errors.join(', ') },
          'register',
          undefined
        );
      }

      // Validate password
      const passwordValidation = ValidationHelper.validatePassword(password);
      if (!passwordValidation.isValid) {
        return createErrorResponse(
          { message: passwordValidation.errors.join(', ') },
          'register',
          undefined
        );
      }

      // Check if user already exists
      const existingCheck = await this.checkUserExists(email);
      if (existingCheck.data) {
        return createErrorResponse(
          { message: 'User already exists with this email' },
          'register',
          undefined
        );
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
          },
        },
      });

      if (authError || !authData.user) {
        return createErrorResponse(authError, 'register', undefined);
      }

      // Create profile
      const profileData: ProfileInsert = {
        id: authData.user.id,
        email,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone || null,
        institution: userData.institution || null,
        is_active: true,
      };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return createErrorResponse(profileError, 'register', authData.user.id);
      }

      const result: RegisterResult = {
        user: authData.user,
        session: authData.session!,
        profile,
        needsEmailConfirmation: !authData.session,
      };

      // Cache user profile
      await cacheManager.set(
        CacheKeys.userProfile(authData.user.id),
        profile,
        { ttl: CacheDurations.PERSISTENT }
      );

      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error, 'register', undefined);
    }
  }

  /**
   * Login user with email and password
   */
  public async login(email: string, password: string): Promise<ApiResponse<LoginResult>> {
    try {
      // Validate email format
      const emailValidation = ValidationHelper.validateEmail(email);
      if (!emailValidation.isValid) {
        return createErrorResponse(
          { message: emailValidation.errors.join(', ') },
          'login',
          undefined
        );
      }

      // Attempt login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user || !authData.session) {
        return createErrorResponse(authError, 'login', undefined);
      }

      // Get user profile
      const profileResponse = await this.getProfile(authData.user.id);
      if (!profileResponse.success || !profileResponse.data) {
        return createErrorResponse(
          { message: 'Profile not found' },
          'login',
          authData.user.id
        );
      }

      // Update last seen
      await this.updateLastSeen(authData.user.id);

      const result: LoginResult = {
        user: authData.user,
        session: authData.session,
        profile: profileResponse.data,
      };

      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error, 'login', undefined);
    }
  }

  /**
   * Login with OAuth provider
   */
  public async loginWithOAuth(provider: 'google' | 'apple' | 'github'): Promise<ApiResponse<{ url: string }>> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'manushi://auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return createErrorResponse(error, 'oauth_login', undefined);
      }

      return createSuccessResponse({ url: data.url });
    } catch (error) {
      return createErrorResponse(error, 'oauth_login', undefined);
    }
  }

  /**
   * Logout current user
   */
  public async logout(): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return createErrorResponse(error, 'logout', undefined);
      }

      // Clear user-related cache
      const session = await this.getCurrentSession();
      if (session.data?.user?.id) {
        await cacheManager.invalidateByPattern(
          new RegExp(`.*${session.data.user.id}.*`)
        );
      }

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'logout', undefined);
    }
  }

  /**
   * Get current session
   */
  public async getCurrentSession(): Promise<ApiResponse<Session | null>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return createErrorResponse(error, 'get_session', undefined);
      }

      return createSuccessResponse(session);
    } catch (error) {
      return createErrorResponse(error, 'get_session', undefined);
    }
  }

  /**
   * Get current user
   */
  public async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return createErrorResponse(error, 'get_user', undefined);
      }

      return createSuccessResponse(user);
    } catch (error) {
      return createErrorResponse(error, 'get_user', undefined);
    }
  }

  /**
   * Get user profile by ID
   */
  public async getProfile(userId: string): Promise<ApiResponse<Profile | null>> {
    try {
      // Check cache first
      const cached = await cacheManager.get<Profile>(CacheKeys.userProfile(userId));
      if (cached) {
        return createSuccessResponse(cached);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return createErrorResponse(error, 'get_profile', userId);
      }

      // Cache the profile
      if (data) {
        await cacheManager.set(
          CacheKeys.userProfile(userId),
          data,
          { ttl: CacheDurations.PERSISTENT }
        );
      }

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'get_profile', userId);
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(
    userId: string,
    updates: ProfileUpdate
  ): Promise<ApiResponse<Profile>> {
    try {
      // Validate updates
      const validationResult = ValidationHelper.validateObject(updates, {
        full_name: {
          required: false,
          minLength: 2,
          maxLength: 100,
        },
        phone: {
          required: false,
          custom: (value: string) => {
            if (!value) return null;
            const result = ValidationHelper.validatePhone(value);
            return result.isValid ? null : result.errors[0];
          },
        },
      });

      if (!validationResult.isValid) {
        return createErrorResponse(
          { message: validationResult.errors.join(', ') },
          'update_profile',
          userId
        );
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error, 'update_profile', userId);
      }

      // Update cache
      await cacheManager.set(
        CacheKeys.userProfile(userId),
        data,
        { ttl: CacheDurations.PERSISTENT }
      );

      return createSuccessResponse(data);
    } catch (error) {
      return createErrorResponse(error, 'update_profile', userId);
    }
  }

  /**
   * Change password
   */
  public async changePassword(newPassword: string): Promise<ApiResponse<void>> {
    try {
      // Validate password
      const passwordValidation = ValidationHelper.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return createErrorResponse(
          { message: passwordValidation.errors.join(', ') },
          'change_password',
          undefined
        );
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return createErrorResponse(error, 'change_password', undefined);
      }

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'change_password', undefined);
    }
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(email: string): Promise<ApiResponse<PasswordResetResult>> {
    try {
      // Validate email
      const emailValidation = ValidationHelper.validateEmail(email);
      if (!emailValidation.isValid) {
        return createErrorResponse(
          { message: emailValidation.errors.join(', ') },
          'password_reset',
          undefined
        );
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'manushi://auth/reset-password',
      });

      if (error) {
        return createErrorResponse(error, 'password_reset', undefined);
      }

      const result: PasswordResetResult = {
        message: 'Password reset email sent successfully',
        resetSent: true,
      };

      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error, 'password_reset', undefined);
    }
  }

  /**
   * Refresh session
   */
  public async refreshSession(): Promise<ApiResponse<Session>> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return createErrorResponse(error, 'refresh_session', undefined);
      }

      return createSuccessResponse(data.session);
    } catch (error) {
      return createErrorResponse(error, 'refresh_session', undefined);
    }
  }

  /**
   * Check if user exists by email
   */
  public async checkUserExists(email: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        return createErrorResponse(error, 'check_user_exists', undefined);
      }

      return createSuccessResponse(!!data);
    } catch (error) {
      return createErrorResponse(error, 'check_user_exists', undefined);
    }
  }

  /**
   * Update user's last seen timestamp
   */
  public async updateLastSeen(userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        return createErrorResponse(error, 'update_last_seen', userId);
      }

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'update_last_seen', userId);
    }
  }

  /**
   * Deactivate user account
   */
  public async deactivateAccount(userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        return createErrorResponse(error, 'deactivate_account', userId);
      }

      // Clear user cache
      await cacheManager.delete(CacheKeys.userProfile(userId));

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'deactivate_account', userId);
    }
  }

  /**
   * Reactivate user account
   */
  public async reactivateAccount(userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (error) {
        return createErrorResponse(error, 'reactivate_account', userId);
      }

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(error, 'reactivate_account', userId);
    }
  }

  /**
   * Get users by role (admin function)
   */
  public async getUsersByRole(
    role: UserRole,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{ users: Profile[]; total: number }>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', role)
        .eq('is_active', true)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        return createErrorResponse(error, 'get_users_by_role', undefined);
      }

      const result = {
        users: data || [],
        total: count || 0,
      };

      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error, 'get_users_by_role', undefined);
    }
  }

  /**
   * Setup auth state listener
   */
  public onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Singleton instance
export const authService = AuthService.getInstance();
export default authService;