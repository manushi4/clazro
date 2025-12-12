import { supabase } from '../database/supabase';
import { realtimeConnection } from './RealtimeConnectionManager';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DataSubscription {
  id: string;
  table: string;
  filter?: string;
  callback: (data: any, action: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onError?: (error: Error) => void;
}

export interface DashboardData {
  assignments: any[];
  grades: any[];
  attendance: any[];
  schedules: any[];
  notifications: any[];
  liveClasses: any[];
  unreadCounts: {
    messages: number;
    notifications: number;
    assignments: number;
  };
  stats: {
    totalStudents: number;
    activeClasses: number;
    pendingAssignments: number;
    averageGrade: number;
  };
  lastUpdated: string;
}

export interface RealtimeUpdate {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: string;
}

class RealtimeDataService {
  private subscriptions: Map<string, DataSubscription> = new Map();
  private dataCache: Map<string, any> = new Map();
  private dashboardListeners: Set<(data: DashboardData) => void> = new Set();
  private updateListeners: Set<(update: RealtimeUpdate) => void> = new Set();
  private isInitialized = false;
  private dashboardData: DashboardData | null = null;
  private refreshInterval?: NodeJS.Timeout;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load cached data
      await this.loadCachedData();
      
      // Setup core dashboard subscriptions
      await this.setupDashboardSubscriptions();
      
      // Start periodic refresh for stale data
      this.startPeriodicRefresh();
      
      this.isInitialized = true;
      logger.info('Realtime data service initialized');
    } catch (error) {
      logger.error('Failed to initialize realtime data service:', error);
    }
  }

  /**
   * Subscribe to table changes with custom callback
   */
  public subscribeToTable<T = any>(
    table: string,
    callback: (data: T, action: 'INSERT' | 'UPDATE' | 'DELETE') => void,
    filter?: string,
    onError?: (error: Error) => void
  ): string {
    const subscriptionId = `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const realtimeSubscriptionId = realtimeConnection.subscribe(
      table,
      filter,
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        try {
          switch (eventType) {
            case 'INSERT':
              callback(newRecord, 'INSERT');
              this.broadcastUpdate(table, 'INSERT', newRecord);
              break;
            case 'UPDATE':
              callback(newRecord, 'UPDATE');
              this.broadcastUpdate(table, 'UPDATE', newRecord);
              break;
            case 'DELETE':
              callback(oldRecord, 'DELETE');
              this.broadcastUpdate(table, 'DELETE', oldRecord);
              break;
          }
          
          // Update cache
          this.updateCache(table, eventType, newRecord || oldRecord);
        } catch (error) {
          logger.error(`Error processing ${table} update:`, error);
          onError?.(error as Error);
        }
      },
      (error) => {
        logger.error(`Subscription error for ${table}:`, error);
        onError?.(error);
      }
    );

    const subscription: DataSubscription = {
      id: realtimeSubscriptionId,
      table,
      filter,
      callback,
      onError,
    };

    this.subscriptions.set(subscriptionId, subscription);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from table changes
   */
  public unsubscribeFromTable(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      realtimeConnection.unsubscribe(subscription.id);
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Subscribe to dashboard data updates
   */
  public subscribeToDashboard(
    callback: (data: DashboardData) => void
  ): () => void {
    this.dashboardListeners.add(callback);
    
    // Send current data immediately if available
    if (this.dashboardData) {
      callback(this.dashboardData);
    }
    
    // Return unsubscribe function
    return () => {
      this.dashboardListeners.delete(callback);
    };
  }

  /**
   * Subscribe to all data updates
   */
  public subscribeToUpdates(
    callback: (update: RealtimeUpdate) => void
  ): () => void {
    this.updateListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateListeners.delete(callback);
    };
  }

  /**
   * Get dashboard data
   */
  public async getDashboardData(): Promise<DashboardData> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const userRole = user.user_metadata?.role;

      // Fetch data based on user role
      const [
        assignments,
        grades,
        attendance,
        schedules,
        notifications,
        liveClasses,
        unreadCounts,
        stats
      ] = await Promise.all([
        this.getAssignments(userRole, user.id),
        this.getGrades(userRole, user.id),
        this.getAttendance(userRole, user.id),
        this.getSchedules(userRole, user.id),
        this.getRecentNotifications(user.id),
        this.getLiveClasses(userRole, user.id),
        this.getUnreadCounts(user.id),
        this.getStats(userRole, user.id),
      ]);

      const dashboardData: DashboardData = {
        assignments,
        grades,
        attendance,
        schedules,
        notifications,
        liveClasses,
        unreadCounts,
        stats,
        lastUpdated: new Date().toISOString(),
      };

      this.dashboardData = dashboardData;
      this.cacheDashboardData(dashboardData);
      this.notifyDashboardListeners(dashboardData);

      return dashboardData;
    } catch (error) {
      logger.error('Failed to get dashboard data:', error);
      
      // Return cached data if available
      if (this.dashboardData) {
        return this.dashboardData;
      }
      
      throw error;
    }
  }

  /**
   * Refresh specific data type
   */
  public async refreshData(dataType: keyof DashboardData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userRole = user.user_metadata?.role;
      let updatedData: any;

      switch (dataType) {
        case 'assignments':
          updatedData = await this.getAssignments(userRole, user.id);
          break;
        case 'grades':
          updatedData = await this.getGrades(userRole, user.id);
          break;
        case 'attendance':
          updatedData = await this.getAttendance(userRole, user.id);
          break;
        case 'schedules':
          updatedData = await this.getSchedules(userRole, user.id);
          break;
        case 'notifications':
          updatedData = await this.getRecentNotifications(user.id);
          break;
        case 'liveClasses':
          updatedData = await this.getLiveClasses(userRole, user.id);
          break;
        case 'unreadCounts':
          updatedData = await this.getUnreadCounts(user.id);
          break;
        case 'stats':
          updatedData = await this.getStats(userRole, user.id);
          break;
        default:
          return;
      }

      if (this.dashboardData) {
        this.dashboardData[dataType] = updatedData;
        this.dashboardData.lastUpdated = new Date().toISOString();
        this.cacheDashboardData(this.dashboardData);
        this.notifyDashboardListeners(this.dashboardData);
      }
    } catch (error) {
      logger.error(`Failed to refresh ${dataType}:`, error);
    }
  }

  /**
   * Force refresh all dashboard data
   */
  public async refreshDashboard(): Promise<DashboardData> {
    return await this.getDashboardData();
  }

  /**
   * Get cached data for a table
   */
  public getCachedData(table: string): any {
    return this.dataCache.get(table);
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.dataCache.clear();
    AsyncStorage.removeItem('realtime_data_cache');
  }

  /**
   * Get connection health
   */
  public getConnectionHealth(): {
    isConnected: boolean;
    activeSubscriptions: number;
    lastUpdate: string | null;
  } {
    return {
      isConnected: realtimeConnection.getConnectionState() === 'connected',
      activeSubscriptions: this.subscriptions.size,
      lastUpdate: this.dashboardData?.lastUpdated || null,
    };
  }

  // Private methods

  private async setupDashboardSubscriptions(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userRole = user.user_metadata?.role;

    // Subscribe to relevant tables based on user role
    const tablesToSubscribe = this.getRelevantTables(userRole);

    tablesToSubscribe.forEach((table) => {
      this.subscribeToTable(
        table,
        (data, action) => {
          logger.debug(`Dashboard update: ${table} ${action}`, data);
          this.handleDashboardUpdate(table, action, data);
        },
        this.getTableFilter(table, userRole, user.id),
        (error) => {
          logger.error(`Dashboard subscription error for ${table}:`, error);
        }
      );
    });
  }

  private getRelevantTables(userRole: string): string[] {
    const baseTables = ['notifications', 'live_sessions', 'chat_messages'];
    
    switch (userRole) {
      case 'student':
        return [...baseTables, 'assignments', 'grades', 'attendance'];
      case 'teacher':
        return [...baseTables, 'assignments', 'grades', 'attendance', 'students'];
      case 'parent':
        return [...baseTables, 'assignments', 'grades', 'attendance', 'student_fees'];
      case 'admin':
        return [...baseTables, 'assignments', 'grades', 'attendance', 'students', 'student_fees', 'users'];
      default:
        return baseTables;
    }
  }

  private getTableFilter(table: string, userRole: string, userId: string): string | undefined {
    switch (table) {
      case 'notifications':
        return `recipient_id=eq.${userId}`;
      case 'assignments':
        return userRole === 'student' ? `student_id=eq.${userId}` : undefined;
      case 'grades':
        return userRole === 'student' ? `student_id=eq.${userId}` : undefined;
      case 'attendance':
        return userRole === 'student' ? `student_id=eq.${userId}` : undefined;
      default:
        return undefined;
    }
  }

  private handleDashboardUpdate(table: string, action: string, data: any): void {
    // Determine which dashboard data to refresh based on the table
    const dataTypeMap: Record<string, keyof DashboardData> = {
      'assignments': 'assignments',
      'grades': 'grades',
      'attendance': 'attendance',
      'live_sessions': 'liveClasses',
      'notifications': 'notifications',
    };

    const dataType = dataTypeMap[table];
    if (dataType) {
      // Debounce the refresh to avoid too many updates
      this.debounceRefresh(dataType);
    }
  }

  private debounceRefresh = this.debounce((dataType: keyof DashboardData) => {
    this.refreshData(dataType);
  }, 1000);

  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  private async getAssignments(userRole: string, userId: string): Promise<any[]> {
    try {
      // This would be replaced with actual assignment queries
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .limit(10)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      logger.error('Failed to get assignments:', error);
      return [];
    }
  }

  private async getGrades(userRole: string, userId: string): Promise<any[]> {
    try {
      // This would be replaced with actual grade queries
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .limit(10)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      logger.error('Failed to get grades:', error);
      return [];
    }
  }

  private async getAttendance(userRole: string, userId: string): Promise<any[]> {
    try {
      // Get recent attendance records
      const { data, error } = await supabase
        .from('live_session_participants')
        .select(`
          *,
          session:live_sessions(
            session_name,
            scheduled_start_at
          )
        `)
        .eq('user_id', userId)
        .limit(10)
        .order('joined_at', { ascending: false });

      return data || [];
    } catch (error) {
      logger.error('Failed to get attendance:', error);
      return [];
    }
  }

  private async getSchedules(userRole: string, userId: string): Promise<any[]> {
    try {
      // Get upcoming live sessions
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .gte('scheduled_start_at', new Date().toISOString())
        .order('scheduled_start_at', { ascending: true })
        .limit(10);

      return data || [];
    } catch (error) {
      logger.error('Failed to get schedules:', error);
      return [];
    }
  }

  private async getRecentNotifications(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    } catch (error) {
      logger.error('Failed to get notifications:', error);
      return [];
    }
  }

  private async getLiveClasses(userRole: string, userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .in('status', ['live', 'starting'])
        .order('scheduled_start_at', { ascending: true });

      return data || [];
    } catch (error) {
      logger.error('Failed to get live classes:', error);
      return [];
    }
  }

  private async getUnreadCounts(userId: string): Promise<any> {
    try {
      const [messagesCount, notificationsCount, assignmentsCount] = await Promise.all([
        this.getUnreadMessagesCount(userId),
        this.getUnreadNotificationsCount(userId),
        this.getPendingAssignmentsCount(userId),
      ]);

      return {
        messages: messagesCount,
        notifications: notificationsCount,
        assignments: assignmentsCount,
      };
    } catch (error) {
      logger.error('Failed to get unread counts:', error);
      return { messages: 0, notifications: 0, assignments: 0 };
    }
  }

  private async getStats(userRole: string, userId: string): Promise<any> {
    try {
      // Get stats based on user role
      switch (userRole) {
        case 'teacher':
          return await this.getTeacherStats(userId);
        case 'admin':
          return await this.getAdminStats();
        case 'student':
          return await this.getStudentStats(userId);
        case 'parent':
          return await this.getParentStats(userId);
        default:
          return { totalStudents: 0, activeClasses: 0, pendingAssignments: 0, averageGrade: 0 };
      }
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return { totalStudents: 0, activeClasses: 0, pendingAssignments: 0, averageGrade: 0 };
    }
  }

  private async getUnreadMessagesCount(userId: string): Promise<number> {
    try {
      const { data } = await supabase.rpc('get_unread_message_count', {
        user_uuid: userId,
      });

      return data?.reduce((total: number, room: any) => total + room.unread_count, 0) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', userId)
        .eq('status', 'unread');

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getPendingAssignmentsCount(userId: string): Promise<number> {
    try {
      // This would depend on your assignment schema
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private async getTeacherStats(userId: string): Promise<any> {
    // Get teacher-specific stats
    return {
      totalStudents: 0,
      activeClasses: 0,
      pendingAssignments: 0,
      averageGrade: 0,
    };
  }

  private async getAdminStats(): Promise<any> {
    // Get admin-specific stats
    return {
      totalStudents: 0,
      activeClasses: 0,
      pendingAssignments: 0,
      averageGrade: 0,
    };
  }

  private async getStudentStats(userId: string): Promise<any> {
    // Get student-specific stats
    return {
      totalStudents: 0,
      activeClasses: 0,
      pendingAssignments: 0,
      averageGrade: 0,
    };
  }

  private async getParentStats(userId: string): Promise<any> {
    // Get parent-specific stats
    return {
      totalStudents: 0,
      activeClasses: 0,
      pendingAssignments: 0,
      averageGrade: 0,
    };
  }

  private updateCache(table: string, action: string, data: any): void {
    const cacheKey = table;
    let cachedData = this.dataCache.get(cacheKey) || [];

    switch (action) {
      case 'INSERT':
        cachedData.unshift(data);
        break;
      case 'UPDATE':
        const updateIndex = cachedData.findIndex((item: any) => item.id === data.id);
        if (updateIndex !== -1) {
          cachedData[updateIndex] = data;
        }
        break;
      case 'DELETE':
        cachedData = cachedData.filter((item: any) => item.id !== data.id);
        break;
    }

    this.dataCache.set(cacheKey, cachedData);
    this.saveCacheToStorage();
  }

  private broadcastUpdate(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: any): void {
    const update: RealtimeUpdate = {
      table,
      action,
      data,
      timestamp: new Date().toISOString(),
    };

    this.updateListeners.forEach((listener) => {
      try {
        listener(update);
      } catch (error) {
        logger.error('Error in update listener:', error);
      }
    });
  }

  private notifyDashboardListeners(data: DashboardData): void {
    this.dashboardListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        logger.error('Error in dashboard listener:', error);
      }
    });
  }

  private startPeriodicRefresh(): void {
    // Refresh dashboard data every 5 minutes
    this.refreshInterval = setInterval(() => {
      if (this.dashboardData) {
        this.refreshDashboard();
      }
    }, 5 * 60 * 1000);
  }

  private async loadCachedData(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('realtime_data_cache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        this.dataCache = new Map(Object.entries(parsedCache));
      }

      const cachedDashboard = await AsyncStorage.getItem('dashboard_data');
      if (cachedDashboard) {
        this.dashboardData = JSON.parse(cachedDashboard);
      }
    } catch (error) {
      logger.error('Failed to load cached data:', error);
    }
  }

  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.dataCache.entries());
      await AsyncStorage.setItem('realtime_data_cache', JSON.stringify(cacheObject));
    } catch (error) {
      logger.error('Failed to save cache to storage:', error);
    }
  }

  private async cacheDashboardData(data: DashboardData): Promise<void> {
    try {
      await AsyncStorage.setItem('dashboard_data', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to cache dashboard data:', error);
    }
  }

  public cleanup(): void {
    // Clear all subscriptions
    this.subscriptions.forEach((subscription) => {
      realtimeConnection.unsubscribe(subscription.id);
    });
    this.subscriptions.clear();

    // Clear listeners
    this.dashboardListeners.clear();
    this.updateListeners.clear();

    // Clear refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }

    this.isInitialized = false;
    logger.info('Realtime data service cleaned up');
  }
}

// Export singleton instance
export const realtimeDataService = new RealtimeDataService();
export default RealtimeDataService;