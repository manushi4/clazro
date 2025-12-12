/**
 * StudentDashboard - Student role interface for coaching platform
 * Based on comprehensive coaching research requirements
 * Features: Today's Overview, Progress Tracking, Quick Actions, Activity Feed, AI Recommendations
 * User Journey: App Launch → Authentication → Today's Overview → Quick Actions → Detailed Views
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../../components/core/CoachingButton';
import DashboardCard from '../../components/core/DashboardCard';

const { width } = Dimensions.get('window');

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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);

  // Sample data based on coaching platform requirements
  const todaySchedule: ClassSchedule[] = [
    {
      id: '1',
      subject: 'Mathematics Coaching',
      teacher: 'Dr. Sarah Wilson',
      time: '10:00 AM',
      status: 'live',
      duration: '60 min',
    },
    {
      id: '2',
      subject: 'Physics Coaching',
      teacher: 'Prof. Michael Chen',
      time: '2:00 PM',
      status: 'upcoming',
      duration: '90 min',
    },
    {
      id: '3',
      subject: 'Chemistry Lab',
      teacher: 'Dr. Emily Johnson',
      time: '4:30 PM',
      status: 'upcoming',
      duration: '45 min',
    },
  ];

  const progressData: ProgressData[] = [
    { subject: 'Mathematics', progress: 85, color: '#6750A4', trend: 'up' },
    { subject: 'Physics', progress: 72, color: '#7C4DFF', trend: 'up' },
    { subject: 'Chemistry', progress: 68, color: '#FF6B35', trend: 'stable' },
    { subject: 'Biology', progress: 91, color: '#4CAF50', trend: 'up' },
  ];

  const activityFeed: ActivityItem[] = [
    {
      id: '1',
      type: 'grade',
      title: 'Math Assignment Graded',
      description: 'Excellent work on calculus problems! Score: 94/100',
      time: '2 hours ago',
      priority: 'high',
    },
    {
      id: '2',
      type: 'feedback',
      title: 'Teacher Feedback',
      description: 'Great improvement in problem-solving approach',
      time: '4 hours ago',
      priority: 'medium',
    },
    {
      id: '3',
      type: 'assignment',
      title: 'New Assignment Posted',
      description: 'Physics: Electromagnetic Waves - Due tomorrow',
      time: '1 day ago',
      priority: 'high',
    },
  ];

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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
    // Simulate action feedback
    setTimeout(() => {
      setSelectedQuickAction(null);
      onNavigate(action);
    }, 1000);
  };

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

      <View style={styles.todayScheduleContainer}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        
        {todaySchedule.map((classItem) => (
          <TouchableOpacity 
            key={classItem.id}
            style={[
              styles.classCard,
              classItem.status === 'live' && styles.liveClassCard
            ]}
            onPress={() => onNavigate('student-live-class')}
          >
            <View style={styles.classCardHeader}>
              <View style={styles.classInfo}>
                <Text style={styles.classSubject}>{classItem.subject}</Text>
                <Text style={styles.classTeacher}>{classItem.teacher}</Text>
              </View>
              
              <View style={styles.classStatus}>
                <Text style={styles.classTime}>{classItem.time}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(classItem.status) }]}>
                  <Text style={styles.statusIcon}>{getStatusIcon(classItem.status)}</Text>
                  <Text style={styles.statusText}>
                    {classItem.status === 'live' ? 'LIVE' : classItem.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {classItem.status === 'live' && (
              <CoachingButton
                title="Join Live Class"
                variant="primary"
                size="small"
                onPress={() => onNavigate('student-live-class')}
                style={styles.joinButton}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProgressOverview = () => (
    <View style={styles.progressSection}>
      <Text style={styles.sectionTitle}>Progress Overview</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.progressScroll}>
        {progressData.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.progressCard}
            onPress={() => onNavigate('progress-detail')}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressSubject}>{item.subject}</Text>
              <Text style={[styles.progressTrend, { color: item.color }]}>
                {item.trend === 'up' ? '↗️' : item.trend === 'down' ? '↘️' : '➡️'}
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${item.progress}%`, backgroundColor: item.color }
                  ]}
                />
              </View>
              <Text style={[styles.progressPercentage, { color: item.color }]}>
                {item.progress}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={[
            styles.quickActionCard,
            selectedQuickAction === 'submit-doubt' && styles.selectedActionCard
          ]}
          onPress={() => handleQuickAction('submit-doubt')}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>❓</Text>
          </View>
          <Text style={styles.actionTitle}>Submit Doubt</Text>
          <Text style={styles.actionSubtitle}>Get instant help</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.quickActionCard,
            selectedQuickAction === 'AssignmentDetail' && styles.selectedActionCard
          ]}
          onPress={() => handleQuickAction('AssignmentDetail')}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📤</Text>
          </View>
          <Text style={styles.actionTitle}>Upload Work</Text>
          <Text style={styles.actionSubtitle}>Submit assignments</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.quickActionCard,
            selectedQuickAction === 'study-library' && styles.selectedActionCard
          ]}
          onPress={() => handleQuickAction('study-library')}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📚</Text>
          </View>
          <Text style={styles.actionTitle}>Study Library</Text>
          <Text style={styles.actionSubtitle}>Browse materials</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.quickActionCard,
            selectedQuickAction === 'Schedule' && styles.selectedActionCard
          ]}
          onPress={() => handleQuickAction('Schedule')}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📅</Text>
          </View>
          <Text style={styles.actionTitle}>Schedule</Text>
          <Text style={styles.actionSubtitle}>View calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActivityFeed = () => (
    <View style={styles.activitySection}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      {activityFeed.map((activity) => (
        <TouchableOpacity 
          key={activity.id}
          style={styles.activityCard}
          onPress={() => onNavigate('activity-detail')}
        >
          <View style={styles.activityHeader}>
            <View style={[styles.activityPriority, { backgroundColor: getPriorityColor(activity.priority) }]} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
            <Text style={styles.activityType}>
              {activity.type === 'grade' ? '📊' : 
               activity.type === 'feedback' ? '💬' :
               activity.type === 'assignment' ? '📝' : '📢'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAIRecommendations = () => (
    <View style={styles.aiSection}>
      <Text style={styles.sectionTitle}>🤖 AI Study Recommendations</Text>
      
      {aiRecommendations.map((recommendation) => (
        <View key={recommendation.id} style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiTitle}>{recommendation.title}</Text>
            <Text style={styles.aiType}>
              {recommendation.type === 'study' ? '📖' :
               recommendation.type === 'review' ? '🔍' : '💪'}
            </Text>
          </View>
          <Text style={styles.aiDescription}>{recommendation.description}</Text>
          
          <CoachingButton
            title={recommendation.action}
            variant="secondary"
            size="small"
            onPress={() => onNavigate('ai-study')}
            style={styles.aiActionButton}
          />
        </View>
      ))}
    </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={LightTheme.Background} />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderHeroSection()}
          {renderProgressOverview()}
          {renderQuickActions()}
          {renderActivityFeed()}
          {renderAIRecommendations()}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.XL,
  },
  heroSection: {
    backgroundColor: LightTheme.Primary,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.XL,
    borderBottomLeftRadius: BorderRadius.LG,
    borderBottomRightRadius: BorderRadius.LG,
  },
  greetingContainer: {
    marginBottom: Spacing.XL,
  },
  greetingText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  studentName: {
    fontSize: Typography.headlineMedium.fontSize,
    fontFamily: Typography.headlineMedium.fontFamily,
    fontWeight: Typography.headlineMedium.fontWeight,
    color: '#FFFFFF',
    marginBottom: Spacing.XS,
  },
  dateText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  todayScheduleContainer: {
    marginTop: Spacing.MD,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: '#FFFFFF',
    marginBottom: Spacing.MD,
  },
  classCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  liveClassCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.XS,
  },
  classTeacher: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  classStatus: {
    alignItems: 'flex-end',
  },
  classTime: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: '#FFFFFF',
    marginBottom: Spacing.XS,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: Spacing.XS,
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinButton: {
    marginTop: Spacing.MD,
  },
  progressSection: {
    padding: Spacing.LG,
  },
  progressScroll: {
    marginTop: Spacing.MD,
  },
  progressCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginRight: Spacing.MD,
    width: width * 0.4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  progressSubject: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    flex: 1,
  },
  progressTrend: {
    fontSize: 16,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 4,
    marginRight: Spacing.SM,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  quickActionsSection: {
    padding: Spacing.LG,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.MD,
  },
  quickActionCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    width: (width - Spacing.LG * 2 - Spacing.MD) / 2,
    marginBottom: Spacing.MD,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedActionCard: {
    backgroundColor: LightTheme.primaryContainer,
    borderWidth: 2,
    borderColor: LightTheme.Primary,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: LightTheme.SurfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  actionSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  activitySection: {
    padding: Spacing.LG,
  },
  activityCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityPriority: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: Spacing.SM,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  activityDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
    lineHeight: Typography.bodyMedium.lineHeight,
  },
  activityTime: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  activityType: {
    fontSize: 20,
    marginLeft: Spacing.SM,
  },
  aiSection: {
    padding: Spacing.LG,
  },
  aiCard: {
    backgroundColor: LightTheme.TertiaryContainer,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderWidth: 1,
    borderColor: LightTheme.Tertiary,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  aiTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnTertiaryContainer,
    flex: 1,
  },
  aiType: {
    fontSize: 20,
  },
  aiDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnTertiaryContainer,
    marginBottom: Spacing.MD,
    lineHeight: Typography.bodyMedium.lineHeight,
  },
  aiActionButton: {
    alignSelf: 'flex-start',
  },
});

export default StudentDashboard;