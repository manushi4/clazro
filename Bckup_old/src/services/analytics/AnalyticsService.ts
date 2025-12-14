import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnalyticsEvent {
  id?: string;
  user_id: string;
  event_type: string;
  event_name: string;
  properties: Record<string, any>;
  timestamp: string;
  session_id: string;
  platform: 'mobile' | 'web';
  app_version: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  duration_seconds?: number;
  page_views: number;
  events_count: number;
  device_info: Record<string, any>;
}

export interface BusinessMetrics {
  // User Metrics
  total_users: number;
  active_users_daily: number;
  active_users_weekly: number;
  active_users_monthly: number;
  new_users: number;
  churn_rate: number;

  // Engagement Metrics
  avg_session_duration: number;
  sessions_per_user: number;
  page_views: number;
  bounce_rate: number;

  // Academic Metrics
  total_classes: number;
  completed_classes: number;
  attendance_rate: number;
  assignment_completion_rate: number;

  // Business Metrics
  total_revenue: number;
  monthly_recurring_revenue: number;
  average_revenue_per_user: number;
  subscription_conversion_rate: number;

  // Period
  period_start: string;
  period_end: string;
}

export interface CoachingMetrics {
  student_metrics: {
    total_students: number;
    active_students: number;
    average_performance: number;
    top_performing_students: Array<{
      id: string;
      name: string;
      score: number;
    }>;
  };
  
  teacher_metrics: {
    total_teachers: number;
    active_teachers: number;
    classes_conducted: number;
    average_rating: number;
  };

  class_metrics: {
    total_classes: number;
    live_classes: number;
    recorded_classes: number;
    average_attendance: number;
    popular_subjects: Array<{
      subject: string;
      student_count: number;
      completion_rate: number;
    }>;
  };

  performance_metrics: {
    assignment_completion: number;
    test_performance: number;
    engagement_score: number;
    retention_rate: number;
  };
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private currentSessionId: string | null = null;
  private sessionStartTime: Date | null = null;
  private eventQueue: AnalyticsEvent[] = [];

  private constructor() {
    this.initializeSession();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize user session
   */
  private async initializeSession(): Promise<void> {
    try {
      this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.sessionStartTime = new Date();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create session record
      const sessionData: Partial<UserSession> = {
        id: this.currentSessionId,
        user_id: user.id,
        session_start: this.sessionStartTime.toISOString(),
        page_views: 0,
        events_count: 0,
        device_info: {
          platform: 'mobile',
          // Add more device info as needed
        }
      };

      await supabase.from('user_sessions').insert(sessionData);
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  /**
   * Track analytics event
   */
  async trackEvent(
    eventType: string,
    eventName: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const event: AnalyticsEvent = {
        user_id: user.id,
        event_type: eventType,
        event_name: eventName,
        properties: {
          ...properties,
          url: properties.screen_name || 'unknown',
          session_id: this.currentSessionId,
        },
        timestamp: new Date().toISOString(),
        session_id: this.currentSessionId || '',
        platform: 'mobile',
        app_version: '1.0.0',
      };

      // Add to queue for batch processing
      this.eventQueue.push(event);

      // Process queue if it's getting large
      if (this.eventQueue.length >= 10) {
        await this.flushEvents();
      }

      // Update session event count
      if (this.currentSessionId) {
        await this.updateSessionEventCount();
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track page/screen view
   */
  async trackScreenView(screenName: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('page_view', 'screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Track user action
   */
  async trackUserAction(action: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('user_action', action, properties);
  }

  /**
   * Track academic event
   */
  async trackAcademicEvent(
    eventType: 'class_join' | 'class_leave' | 'assignment_submit' | 'test_complete',
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent('academic', eventType, properties);
  }

  /**
   * Track business event
   */
  async trackBusinessEvent(
    eventType: 'subscription_start' | 'subscription_cancel' | 'payment_success' | 'payment_failed',
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent('business', eventType, properties);
  }

  /**
   * Get business metrics for date range
   */
  async getBusinessMetrics(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<BusinessMetrics> {
    try {
      const { data, error } = await supabase.rpc('get_business_metrics', {
        start_date: startDate,
        end_date: endDate,
        user_id_filter: userId || null,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get business metrics:', error);
      throw error;
    }
  }

  /**
   * Get coaching-specific metrics
   */
  async getCoachingMetrics(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<CoachingMetrics> {
    try {
      const { data, error } = await supabase.rpc('get_coaching_metrics', {
        start_date: startDate,
        end_date: endDate,
        user_id_filter: userId || null,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get coaching metrics:', error);
      throw error;
    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(userId: string, days: number = 30): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      const { data, error } = await supabase.rpc('get_user_engagement', {
        user_id_param: userId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get user engagement:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics dashboard data
   */
  async getDashboardData(userId?: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_analytics', {
        user_id_filter: userId || null,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get student performance analytics
   */
  async getStudentPerformance(
    studentId: string,
    subjectId?: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_student_performance', {
        student_id: studentId,
        subject_id: subjectId || null,
        timeframe: timeframe,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get student performance:', error);
      throw error;
    }
  }

  /**
   * Get teacher effectiveness metrics
   */
  async getTeacherMetrics(
    teacherId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_teacher_metrics', {
        teacher_id: teacherId,
        timeframe: timeframe,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get teacher metrics:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportData(
    format: 'csv' | 'json',
    dataType: 'events' | 'metrics' | 'performance',
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('export_analytics_data', {
        format: format,
        data_type: dataType,
        start_date: startDate,
        end_date: endDate,
        user_id_filter: userId || null,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Get funnel analysis
   */
  async getFunnelAnalysis(
    steps: string[],
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_funnel_analysis', {
        funnel_steps: steps,
        start_date: startDate,
        end_date: endDate,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get funnel analysis:', error);
      throw error;
    }
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(
    cohortType: 'registration' | 'subscription' | 'first_class',
    timeframe: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_cohort_analysis', {
        cohort_type: cohortType,
        timeframe: timeframe,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get cohort analysis:', error);
      throw error;
    }
  }

  /**
   * Flush queued events to database
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      const { error } = await supabase
        .from('analytics_events')
        .insert(events);

      if (error) {
        console.error('Failed to flush events:', error);
        // Put events back in queue for retry
        this.eventQueue.unshift(...events);
      }
    } catch (error) {
      console.error('Failed to flush events:', error);
    }
  }

  /**
   * Update session event count
   */
  private async updateSessionEventCount(): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ events_count: supabase.raw('events_count + 1') })
        .eq('id', this.currentSessionId);
    } catch (error) {
      console.error('Failed to update session event count:', error);
    }
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    if (!this.currentSessionId || !this.sessionStartTime) return;

    try {
      const sessionEnd = new Date();
      const durationSeconds = Math.floor(
        (sessionEnd.getTime() - this.sessionStartTime.getTime()) / 1000
      );

      await supabase
        .from('user_sessions')
        .update({
          session_end: sessionEnd.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', this.currentSessionId);

      // Flush any remaining events
      await this.flushEvents();

      this.currentSessionId = null;
      this.sessionStartTime = null;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Set user properties for analytics
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store user properties locally
      await AsyncStorage.setItem(
        'analytics_user_properties',
        JSON.stringify(properties)
      );

      // Update user profile with analytics properties
      await supabase
        .from('profiles')
        .update({
          analytics_properties: properties,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Get cached analytics data
   */
  async getCachedData(cacheKey: string): Promise<any> {
    try {
      const cached = await AsyncStorage.getItem(`analytics_cache_${cacheKey}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      const cacheAge = now - timestamp;
      
      // Cache valid for 5 minutes
      if (cacheAge < 5 * 60 * 1000) {
        return data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Cache analytics data
   */
  async setCachedData(cacheKey: string, data: any): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(
        `analytics_cache_${cacheKey}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();