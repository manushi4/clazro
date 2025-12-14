/**
 * StudentDashboard - SUPABASE INTEGRATED VERSION
 * Student role interface with real-time data from Supabase
 * Features: Today's Overview, Progress Tracking, Quick Actions, Activity Feed, AI Recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../../components/core/CoachingButton';
import DashboardCard from '../../components/core/DashboardCard';

// Supabase imports
import { useAuth } from '../../context/AuthContext';
import {
  getStudentDashboardData,
  getStudentProgress,
  subscribeToNotifications,
  markNotificationRead
} from '../../services/studentDashboardService';
import type { Database } from '../../types/database';

const { width } = Dimensions.get('window');

type Class = Database['public']['Tables']['classes']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];

interface StudentDashboardProps {
  studentName: string;
  onNavigate: (screen: string) => void;
}

interface ClassSchedule {
  id: string;
  subject: string;
  teacher: string;
  time: string;
  status: 'upcoming' | 'live' | 'completed';
  duration: string;
}

interface ProgressData {
  subject: string;
  progress: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

interface ActivityItem {
  id: string;
  type: 'grade' | 'feedback' | 'assignment' | 'announcement';
  title: string;
  description: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  type: 'study' | 'review' | 'practice';
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  studentName,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);

  // Data state
  const [todaySchedule, setTodaySchedule] = useState<ClassSchedule[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI recommendations (mock for now - will be replaced with AI service)
  const aiRecommendations: AIRecommendation[] = [
    {
      id: '1',
      title: 'Focus on Weak Areas',
      description: 'Spend 30 minutes reviewing trigonometry concepts',
      action: 'Start Study Session',
      type: 'study',
    },
    {
      id: '2',
      title: 'Practice Problems',
      description: 'Complete 5 more physics practice problems',
      action: 'View Problems',
      type: 'practice',
    },
  ];

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch dashboard data
      const [dashboardResult, progressResult] = await Promise.all([
        getStudentDashboardData(user.id),
        getStudentProgress(user.id)
      ]);

      if (!dashboardResult.success) {
        throw new Error(dashboardResult.error || 'Failed to load dashboard data');
      }

      if (!progressResult.success) {
        console.warn('Progress data failed to load:', progressResult.error);
      }

      // Process today's classes
      const classes = dashboardResult.data?.todayClasses || [];
      const processedSchedule: ClassSchedule[] = classes.map(cls => {
        const scheduledTime = new Date(cls.scheduled_at);
        const now = new Date();
        const classEnd = new Date(scheduledTime.getTime() + (cls.duration_minutes || 60) * 60000);

        let status: 'upcoming' | 'live' | 'completed' = 'upcoming';
        if (now >= scheduledTime && now <= classEnd) {
          status = 'live';
        } else if (now > classEnd) {
          status = 'completed';
        }

        return {
          id: cls.id,
          subject: cls.subject,
          teacher: cls.teacher_id, // Will need to fetch teacher name
          time: scheduledTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          status,
          duration: `${cls.duration_minutes || 60} min`,
        };
      });

      setTodaySchedule(processedSchedule);

      // Process progress data
      const progress = progressResult.data || [];
      const processedProgress: ProgressData[] = progress.map(p => ({
        subject: p.subject,
        progress: p.progress,
        color: p.color,
        trend: p.progress > 75 ? 'up' : p.progress > 50 ? 'stable' : 'down' as 'up' | 'down' | 'stable'
      }));

      setProgressData(processedProgress);

      // Process notifications as activity feed
      const notifications = dashboardResult.data?.recentNotifications || [];
      const processedActivities: ActivityItem[] = notifications.slice(0, 5).map(notif => ({
        id: notif.id,
        type: notif.type as any,
        title: notif.title,
        description: notif.message,
        time: formatTimeAgo(new Date(notif.created_at || '')),
        priority: notif.priority,
      }));

      setActivityFeed(processedActivities);

      // Store assignments for quick access
      setUpcomingAssignments(dashboardResult.data?.upcomingAssignments || []);

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Real-time notifications subscription
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      // Add new notification to activity feed
      const newActivity: ActivityItem = {
        id: notification.id,
        type: notification.type as any,
        title: notification.title,
        description: notification.message,
        time: 'Just now',
        priority: notification.priority,
      };

      setActivityFeed(prev => [newActivity, ...prev.slice(0, 4)]);
    });

    return unsubscribe;
  }, [user?.id]);

  // Initial load and refresh
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  // Time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper functions
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#4CAF50';
      case 'upcoming': return '#FF9800';
      case 'completed': return '#9E9E9E';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return '🔴';
      case 'upcoming': return '⏰';
      case 'completed': return '✅';
      default: return '📅';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const handleQuickAction = (action: string) => {
    setSelectedQuickAction(action);
    setTimeout(() => {
      setSelectedQuickAction(null);
      onNavigate(action);
    }, 300);
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={LightTheme.Primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LightTheme.Primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={LightTheme.Primary} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <CoachingButton
            variant="primary"
            onPress={loadDashboardData}
          >
            Retry
          </CoachingButton>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeroSection = () => (
    <View style={styles.heroSection}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{getGreeting()},</Text>
        <Text style={styles.studentName}>{studentName}</Text>
        <Text style={styles.dateText}>
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todaySchedule.length}</Text>
          <Text style={styles.statLabel}>Classes Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{upcomingAssignments.filter(a => {
            const dueDate = new Date(a.due_date);
            const today = new Date();
            return dueDate > today;
          }).length}</Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {progressData.length > 0
              ? Math.round(progressData.reduce((acc, p) => acc + p.progress, 0) / progressData.length)
              : 0}%
          </Text>
          <Text style={styles.statLabel}>Avg Progress</Text>
        </View>
      </View>
    </View>
  );

  const renderTodaySchedule = () => (
    <DashboardCard
      title="Today's Classes"
      subtitle={`${todaySchedule.length} scheduled`}
      onViewAll={() => onNavigate('Schedule')}
    >
      {todaySchedule.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No classes scheduled for today</Text>
        </View>
      ) : (
        todaySchedule.map((classItem, index) => (
          <TouchableOpacity
            key={classItem.id}
            style={[
              styles.classCard,
              index !== todaySchedule.length - 1 && styles.classCardBorder
            ]}
            onPress={() => onNavigate('ClassDetail')}
          >
            <View style={styles.classCardLeft}>
              <Text style={styles.classCardIcon}>{getStatusIcon(classItem.status)}</Text>
              <View style={styles.classCardInfo}>
                <Text style={styles.classCardSubject}>{classItem.subject}</Text>
                <Text style={styles.classCardTeacher}>{classItem.teacher}</Text>
              </View>
            </View>
            <View style={styles.classCardRight}>
              <Text style={[styles.classCardStatus, { color: getStatusColor(classItem.status) }]}>
                {classItem.status.toUpperCase()}
              </Text>
              <Text style={styles.classCardTime}>{classItem.time}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </DashboardCard>
  );

  const renderQuickActions = () => (
    <DashboardCard title="Quick Actions">
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[
            styles.quickActionCard,
            selectedQuickAction === 'Schedule' && styles.quickActionSelected
          ]}
          onPress={() => handleQuickAction('Schedule')}
        >
          <Text style={styles.quickActionIcon}>📅</Text>
          <Text style={styles.quickActionText}>My Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickActionCard,
            selectedQuickAction === 'AssignmentDetail' && styles.quickActionSelected
          ]}
          onPress={() => handleQuickAction('AssignmentDetail')}
        >
          <Text style={styles.quickActionIcon}>📝</Text>
          <Text style={styles.quickActionText}>Assignments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickActionCard,
            selectedQuickAction === 'ai-study' && styles.quickActionSelected
          ]}
          onPress={() => handleQuickAction('ai-study')}
        >
          <Text style={styles.quickActionIcon}>🤖</Text>
          <Text style={styles.quickActionText}>AI Study</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickActionCard,
            selectedQuickAction === 'study-library' && styles.quickActionSelected
          ]}
          onPress={() => handleQuickAction('study-library')}
        >
          <Text style={styles.quickActionIcon}>📚</Text>
          <Text style={styles.quickActionText}>Library</Text>
        </TouchableOpacity>
      </View>
    </DashboardCard>
  );

  const renderProgress = () => (
    <DashboardCard
      title="Subject Progress"
      subtitle="Your learning journey"
      onViewAll={() => onNavigate('progress-detail')}
    >
      {progressData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No progress data available</Text>
        </View>
      ) : (
        progressData.map((item, index) => (
          <View key={index} style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressSubject}>{item.subject}</Text>
              <Text style={styles.progressValue}>{item.progress}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${item.progress}%`, backgroundColor: item.color }
                ]}
              />
            </View>
          </View>
        ))
      )}
    </DashboardCard>
  );

  const renderActivityFeed = () => (
    <DashboardCard title="Recent Activity" subtitle="Latest updates">
      {activityFeed.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No recent activity</Text>
        </View>
      ) : (
        activityFeed.map((activity, index) => (
          <View
            key={activity.id}
            style={[
              styles.activityItem,
              index !== activityFeed.length - 1 && styles.activityItemBorder
            ]}
          >
            <View style={[styles.activityDot, { backgroundColor: getPriorityColor(activity.priority) }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription} numberOfLines={2}>
                {activity.description}
              </Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          </View>
        ))
      )}
    </DashboardCard>
  );

  const renderAIRecommendations = () => (
    <DashboardCard title="AI Recommendations" subtitle="Personalized for you">
      {aiRecommendations.map((recommendation, index) => (
        <View
          key={recommendation.id}
          style={[
            styles.recommendationCard,
            index !== aiRecommendations.length - 1 && styles.recommendationCardBorder
          ]}
        >
          <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
          <Text style={styles.recommendationDescription}>
            {recommendation.description}
          </Text>
          <CoachingButton
            variant="secondary"
            size="small"
            onPress={() => handleQuickAction('ai-study')}
          >
            {recommendation.action}
          </CoachingButton>
        </View>
      ))}
    </DashboardCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={LightTheme.Primary} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[LightTheme.Primary]}
          />
        }
      >
        {renderHeroSection()}
        {renderTodaySchedule()}
        {renderQuickActions()}
        {renderProgress()}
        {renderActivityFeed()}
        {renderAIRecommendations()}

        {/* Footer spacing */}
        <View style={{ height: Spacing.XL }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightTheme.Background,
  },
  loadingText: {
    marginTop: Spacing.MD,
    ...Typography.bodyLarge,
    color: LightTheme.OnSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightTheme.Background,
    padding: Spacing.LG,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: Spacing.MD,
  },
  errorText: {
    ...Typography.bodyLarge,
    color: LightTheme.Error,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.LG,
  },
  heroSection: {
    backgroundColor: LightTheme.Primary,
    padding: Spacing.LG,
    paddingTop: Spacing.XL,
    borderBottomLeftRadius: BorderRadius.XL,
    borderBottomRightRadius: BorderRadius.XL,
  },
  greetingContainer: {
    marginBottom: Spacing.LG,
  },
  greetingText: {
    ...Typography.titleSmall,
    color: LightTheme.OnPrimary,
    opacity: 0.9,
  },
  studentName: {
    ...Typography.headlineMedium,
    color: LightTheme.OnPrimary,
    fontWeight: 'bold',
    marginTop: Spacing.XS,
  },
  dateText: {
    ...Typography.bodyMedium,
    color: LightTheme.OnPrimary,
    opacity: 0.8,
    marginTop: Spacing.XS,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.SM,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.headlineSmall,
    color: LightTheme.OnPrimary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnPrimary,
    opacity: 0.9,
    marginTop: Spacing.XS,
    textAlign: 'center',
  },
  emptyState: {
    padding: Spacing.LG,
    alignItems: 'center',
  },
  emptyStateText: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  classCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.MD,
  },
  classCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  classCardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  classCardIcon: {
    fontSize: 24,
    marginRight: Spacing.SM,
  },
  classCardInfo: {
    flex: 1,
  },
  classCardSubject: {
    ...Typography.titleSmall,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  classCardTeacher: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  classCardRight: {
    alignItems: 'flex-end',
  },
  classCardStatus: {
    ...Typography.labelSmall,
    fontWeight: 'bold',
    marginBottom: Spacing.XS,
  },
  classCardTime: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  quickActionCard: {
    width: (width - Spacing.LG * 3 - Spacing.SM) / 2,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    alignItems: 'center',
  },
  quickActionSelected: {
    backgroundColor: LightTheme.PrimaryContainer,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: Spacing.SM,
  },
  quickActionText: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    textAlign: 'center',
  },
  progressItem: {
    marginBottom: Spacing.MD,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.XS,
  },
  progressSubject: {
    ...Typography.bodyLarge,
    color: LightTheme.OnSurface,
  },
  progressValue: {
    ...Typography.bodyLarge,
    color: LightTheme.Primary,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.SM,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.MD,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.SM,
    marginTop: Spacing.XS,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...Typography.titleSmall,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  activityDescription: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  activityTime: {
    ...Typography.labelSmall,
    color: LightTheme.OnSurfaceVariant,
  },
  recommendationCard: {
    paddingVertical: Spacing.MD,
  },
  recommendationCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
    marginBottom: Spacing.MD,
  },
  recommendationTitle: {
    ...Typography.titleSmall,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  recommendationDescription: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
});

export default StudentDashboard;
