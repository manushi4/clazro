/**
 * ParentDashboard - Parent role interface for coaching platform
 * Based on comprehensive coaching research requirements
 * Features: Child Overview, Progress Tracking, Financial Management, Communication Hub, Monitoring Tools
 * User Journey: App Launch → Child's Summary → Progress Review → Communication → Actions
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
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../../components/core/CoachingButton';
import DashboardCard from '../../components/core/DashboardCard';
import { useAuth } from '../../context/AuthContext';
import {
  useChildrenSummary as useParentChildren,
  useFinancialSummary,
  useAIInsights as useAllInsights
} from '../../hooks/api/useParentAPI';

// TODO: Add useCommunications when backend service is ready
const useCommunications = () => ({ data: [], isLoading: false, refetch: async () => {} });

const { width } = Dimensions.get('window');

interface ParentDashboardProps {
  parentName: string;
  onNavigate: (screen: string) => void;
}

interface Child {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  school: string;
  overallGrade: string;
  attendance: number;
  todayStatus: 'in-class' | 'completed' | 'absent';
  upcomingClass?: {
    subject: string;
    time: string;
    teacher: string;
  };
}

interface ProgressReport {
  subject: string;
  currentGrade: string;
  trend: 'up' | 'down' | 'stable';
  score: number;
  teacher: string;
  lastUpdated: string;
  color: string;
}

interface FinancialItem {
  id: string;
  type: 'fee' | 'payment' | 'receipt';
  description: string;
  amount: number;
  dueDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
}

interface Communication {
  id: string;
  type: 'announcement' | 'grade' | 'message' | 'event';
  from: string;
  subject: string;
  message: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
}

interface MonitoringData {
  studyTime: {
    today: number;
    thisWeek: number;
    target: number;
  };
  appUsage: {
    educational: number;
    total: number;
    breakdown: { app: string; time: number; category: string }[];
  };
  screenTime: {
    daily: number;
    weekly: number;
    limit: number;
  };
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  parentName,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<'overview' | 'progress' | 'financial' | 'communication' | 'monitoring'>('overview');
  const [selectedChild, setSelectedChild] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Get parent ID from authenticated user (CRITICAL: Must match auth.uid() for RLS policies to work)
  const parentId = user?.id || '';

  // DEBUG: Log user session state
  console.log('🔐 [ParentDashboard] USER AUTH STATE:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.user_metadata?.role,
    parentId: parentId,
    isEmpty: parentId === ''
  });

  // Fetch real data from Supabase using React Query (hooks check enabled: !!parentId internally)
  const { data: childrenDataFromAPI, isLoading: childrenLoading, isError: childrenError, refetch: refetchChildren } = useParentChildren(parentId);
  const { data: financialDataFromAPI, isLoading: financialLoading, refetch: refetchFinancial } = useFinancialSummary(parentId);
  const { data: communicationsDataFromAPI, isLoading: communicationsLoading, refetch: refetchCommunications } = useCommunications(parentId);
  const { data: insightsDataFromAPI, isLoading: insightsLoading, refetch: refetchInsights } = useAllInsights(parentId, null);

  // Transform insights data into the expected format
  const insights = { data: insightsDataFromAPI || [] };
  const risks: any[] = [];
  const opportunities: any[] = [];
  const recommendedActions: any[] = [];

  // Combined loading state
  const isLoadingData = childrenLoading || financialLoading || communicationsLoading || insightsLoading;

  // Transform API data to match existing Child interface
  const children: Child[] = React.useMemo(() => {
    if (childrenDataFromAPI && childrenDataFromAPI.length > 0) {
      console.log('📊 [ParentDashboard] Real API Data Loaded:');
      console.log('  👨‍👩‍👧 Children from API:', childrenDataFromAPI.length, 'children');

      return childrenDataFromAPI.map((childData: any, index) => {
        // Handle nested student object from getChildrenSummary
        const student = childData.student || childData;
        const studentId = student.id || childData.student_id || '';
        const studentName = student.full_name || student.student_name || childData.student_name || 'Student';

        console.log(`  📝 Processing child: ${studentName} (ID: ${studentId})`);

        return {
          id: studentId,
          name: studentName,
          grade: student.batch_id || childData.batch_id || 'Grade N/A',
          avatar: index === 0 ? '👦' : '👧',
          school: 'Manushi Coaching',
          overallGrade: 'A-',
          attendance: childData.attendance?.percentage || 95,
          todayStatus: 'in-class' as const,
          upcomingClass: undefined,
        };
      });
    } else {
      console.log('  ⚠️ No children data from API - using empty array');
      return [];
    }
  }, [childrenDataFromAPI]);

  // Transform insights into progress reports
  const progressReports: ProgressReport[] = React.useMemo(() => {
    if (insights?.data && insights.data.length > 0) {
      console.log('📊 [Dashboard] Progress Reports from API:', insights.data.length, 'insights');

      return insights.data.slice(0, 4).map((insight: any) => {
        const score = Math.round((insight.confidence_score || insight.impact_score || 0.8) * 100);
        const getTrend = () => {
          if (insight.severity === 'positive') return 'up' as const;
          if (insight.severity === 'negative') return 'down' as const;
          return 'stable' as const;
        };

        return {
          subject: insight.title || insight.insight_category || 'General',
          currentGrade: score >= 90 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : 'C',
          trend: getTrend(),
          score: score,
          teacher: 'AI Analysis',
          lastUpdated: insight.generated_at ? new Date(insight.generated_at).toLocaleDateString() : 'Recent',
          color: insight.severity === 'positive' ? '#4CAF50' : insight.severity === 'negative' ? '#FF9800' : '#2196F3',
        };
      });
    }
    console.log('  ⚠️ No insights data - using empty array');
    return [];
  }, [insights]);

  // Transform financial data from API
  const financialItems: FinancialItem[] = React.useMemo(() => {
    if (financialDataFromAPI) {
      console.log('💰 [Dashboard] Financial Data from API:', financialDataFromAPI);

      // For now, create a summary based on available data
      // TODO: Replace with actual payments/fees table when available
      const items: FinancialItem[] = [];

      if (financialDataFromAPI.total_fees_pending > 0) {
        items.push({
          id: 'pending-fees',
          type: 'fee',
          description: 'Pending Tuition Fees',
          amount: financialDataFromAPI.total_fees_pending,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'pending',
          date: new Date().toISOString().split('T')[0],
        });
      }

      if (financialDataFromAPI.total_paid > 0) {
        items.push({
          id: 'paid-fees',
          type: 'payment',
          description: 'Fees Paid This Month',
          amount: -financialDataFromAPI.total_paid,
          status: 'paid',
          date: new Date().toISOString().split('T')[0],
        });
      }

      return items;
    }
    console.log('  ⚠️ No financial data - using empty array');
    return [];
  }, [financialDataFromAPI]);

  // Transform communications from API
  const communications: Communication[] = React.useMemo(() => {
    if (communicationsDataFromAPI && communicationsDataFromAPI.length > 0) {
      console.log('💬 [Dashboard] Communications from API:', communicationsDataFromAPI.length, 'messages');

      return communicationsDataFromAPI.map((comm: any) => {
        const getTimeAgo = (dateString: string) => {
          const date = new Date(dateString);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);

          if (diffHours < 1) return 'Just now';
          if (diffHours < 24) return `${diffHours} hours ago`;
          if (diffDays === 1) return '1 day ago';
          return `${diffDays} days ago`;
        };

        return {
          id: comm.id,
          type: comm.communication_type || 'message' as const,
          from: comm.sender_name || comm.sender_role || 'Teacher',
          subject: comm.subject || 'Message',
          message: comm.message || comm.content || '',
          time: getTimeAgo(comm.sent_at || comm.created_at),
          priority: comm.priority || 'medium' as const,
          isRead: comm.is_read || false,
        };
      });
    }
    console.log('  ⚠️ No communications data - using empty array');
    return [];
  }, [communicationsDataFromAPI]);

  // ⚠️ TODO: Monitoring data - Add API endpoint when available
  // For now using mock data since monitoring/screen-time tracking is not yet implemented in backend
  const monitoringData: MonitoringData = {
    studyTime: {
      today: 3.5,
      thisWeek: 18.5,
      target: 25,
    },
    appUsage: {
      educational: 75,
      total: 100,
      breakdown: [
        { app: 'Coaching App', time: 2.5, category: 'educational' },
        { app: 'Khan Academy', time: 1.5, category: 'educational' },
        { app: 'Calculator', time: 0.5, category: 'educational' },
        { app: 'Social Media', time: 1.0, category: 'entertainment' },
      ],
    },
    screenTime: {
      daily: 4.2,
      weekly: 28.5,
      limit: 30,
    },
  };

  // Handle pull-to-refresh - Refetch ALL data
  const handleRefresh = async () => {
    console.log('🔄 [ParentDashboard] Refreshing ALL data from API...');
    setRefreshing(true);
    try {
      await Promise.all([
        refetchChildren(),
        refetchFinancial(),
        refetchCommunications(),
        refetchInsights(),
      ]);
      console.log('✅ [ParentDashboard] All data refreshed successfully');
      console.log('  👨‍👩‍👧 Children:', children.length);
      console.log('  📊 Progress Reports:', progressReports.length);
      console.log('  💰 Financial Items:', financialItems.length);
      console.log('  💬 Communications:', communications.length);
    } catch (error) {
      console.error('❌ [ParentDashboard] Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

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
      case 'in-class': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'absent': return '#F44336';
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getFinancialStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'overdue': return '#F44336';
      default: return LightTheme.OnSurfaceVariant;
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{getGreeting()},</Text>
        <Text style={styles.parentName}>{parentName}</Text>
        <Text style={styles.dateText}>
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View style={styles.childSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {children.map((child, index) => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childTab,
                selectedChild === index && styles.selectedChildTab
              ]}
              onPress={() => setSelectedChild(index)}
            >
              <Text style={styles.childAvatar}>{child.avatar}</Text>
              <Text style={[
                styles.childName,
                selectedChild === index && styles.selectedChildName
              ]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderChildOverview = () => {
    const child = children[selectedChild];

    if (!child) {
      return (
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>No child data available</Text>
          <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
        </View>
      );
    }

    return (
      <View style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>📊 {child.name}'s Overview</Text>

        <View style={styles.childSummaryCard}>
          <View style={styles.childSummaryHeader}>
            <View style={styles.childInfo}>
              <Text style={styles.childSummaryName}>{child.name}</Text>
              <Text style={styles.childSchool}>{child.school} • {child.grade}</Text>
              <Text style={styles.overallGrade}>Overall Grade: {child.overallGrade}</Text>
            </View>
            
            <View style={styles.todayStatus}>
              <Text style={styles.statusLabel}>Today</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(child.todayStatus) }]}>
                <Text style={styles.statusText}>
                  {child.todayStatus === 'in-class' ? 'IN CLASS' :
                   child.todayStatus === 'completed' ? 'COMPLETED' : 'ABSENT'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.attendanceSection}>
            <Text style={styles.attendanceLabel}>Attendance Rate</Text>
            <View style={styles.attendanceBar}>
              <View 
                style={[styles.attendanceFill, { width: `${child.attendance}%` }]}
              />
            </View>
            <Text style={styles.attendancePercent}>{child.attendance}%</Text>
          </View>

          {child.upcomingClass && (
            <View style={styles.upcomingClassSection}>
              <Text style={styles.upcomingLabel}>Next Class</Text>
              <View style={styles.upcomingClassInfo}>
                <Text style={styles.upcomingSubject}>{child.upcomingClass.subject}</Text>
                <Text style={styles.upcomingTime}>{child.upcomingClass.time} • {child.upcomingClass.teacher}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>4</Text>
            <Text style={styles.quickStatLabel}>Subjects</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>2</Text>
            <Text style={styles.quickStatLabel}>New Messages</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>₹850</Text>
            <Text style={styles.quickStatLabel}>Pending Fees</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderProgressTracking = () => (
    <View style={styles.progressSection}>
      <Text style={styles.sectionTitle}>📈 Academic Progress</Text>
      
      {progressReports.map((report, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.progressCard}
          onPress={() => onNavigate('progress-detail')}
        >
          <View style={styles.progressHeader}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressSubject}>{report.subject}</Text>
              <Text style={styles.progressTeacher}>{report.teacher}</Text>
              <Text style={styles.progressUpdated}>Updated {report.lastUpdated}</Text>
            </View>
            
            <View style={styles.progressGrades}>
              <Text style={[styles.currentGrade, { color: report.color }]}>{report.currentGrade}</Text>
              <Text style={styles.progressTrend}>
                {report.trend === 'up' ? '📈' : report.trend === 'down' ? '📉' : '➡️'}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${report.score}%`, backgroundColor: report.color }
                ]}
              />
            </View>
            <Text style={styles.progressScore}>{report.score}%</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFinancialManagement = () => (
    <View style={styles.financialSection}>
      <Text style={styles.sectionTitle}>💰 Financial Management</Text>
      
      <View style={styles.financialSummary}>
        <View style={styles.financialStat}>
          <Text style={styles.financialAmount}>₹2,850</Text>
          <Text style={styles.financialLabel}>Pending</Text>
        </View>
        <View style={styles.financialStat}>
          <Text style={styles.financialAmount}>₹2,680</Text>
          <Text style={styles.financialLabel}>Paid This Month</Text>
        </View>
      </View>

      {financialItems.map((item) => (
        <TouchableOpacity 
          key={item.id}
          style={styles.financialCard}
          onPress={() => onNavigate('financial-detail')}
        >
          <View style={styles.financialHeader}>
            <View style={styles.financialInfo}>
              <Text style={styles.financialDescription}>{item.description}</Text>
              <Text style={styles.financialDate}>{item.date}</Text>
              {item.dueDate && (
                <Text style={styles.financialDueDate}>Due: {item.dueDate}</Text>
              )}
            </View>
            
            <View style={styles.financialAmountContainer}>
              <Text style={[
                styles.financialAmountValue,
                { color: item.amount > 0 ? '#F44336' : '#4CAF50' }
              ]}>
                {item.amount > 0 ? '+' : ''}₹{Math.abs(item.amount)}
              </Text>
              <View style={[styles.financialStatus, { backgroundColor: getFinancialStatusColor(item.status) }]}>
                <Text style={styles.financialStatusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <CoachingButton
        title="💳 Make Payment"
        variant="primary"
        size="medium"
        onPress={() => onNavigate('make-payment')}
        style={styles.paymentButton}
      />
    </View>
  );

  const renderCommunicationHub = () => (
    <View style={styles.communicationSection}>
      <Text style={styles.sectionTitle}>💬 Communication Hub</Text>
      
      {communications.map((comm) => (
        <TouchableOpacity 
          key={comm.id}
          style={[
            styles.communicationCard,
            !comm.isRead && styles.unreadCommunication
          ]}
          onPress={() => onNavigate('message-detail')}
        >
          <View style={styles.communicationHeader}>
            <View style={styles.communicationInfo}>
              <Text style={styles.communicationFrom}>{comm.from}</Text>
              <Text style={styles.communicationSubject}>{comm.subject}</Text>
              <Text style={styles.communicationMessage} numberOfLines={2}>
                {comm.message}
              </Text>
              <Text style={styles.communicationTime}>{comm.time}</Text>
            </View>
            
            <View style={styles.communicationMeta}>
              <Text style={styles.communicationType}>
                {comm.type === 'grade' ? '📊' :
                 comm.type === 'announcement' ? '📢' :
                 comm.type === 'message' ? '💬' : '📅'}
              </Text>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(comm.priority) }]} />
              {!comm.isRead && <View style={styles.unreadDot} />}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMonitoringTools = () => (
    <View style={styles.monitoringSection}>
      <Text style={styles.sectionTitle}>📱 Digital Monitoring</Text>
      
      <View style={styles.monitoringCard}>
        <Text style={styles.monitoringCardTitle}>Study Time Tracking</Text>
        <View style={styles.studyTimeStats}>
          <View style={styles.studyTimeStat}>
            <Text style={styles.studyTimeNumber}>{monitoringData.studyTime.today}h</Text>
            <Text style={styles.studyTimeLabel}>Today</Text>
          </View>
          <View style={styles.studyTimeStat}>
            <Text style={styles.studyTimeNumber}>{monitoringData.studyTime.thisWeek}h</Text>
            <Text style={styles.studyTimeLabel}>This Week</Text>
          </View>
          <View style={styles.studyTimeStat}>
            <Text style={styles.studyTimeNumber}>{monitoringData.studyTime.target}h</Text>
            <Text style={styles.studyTimeLabel}>Weekly Target</Text>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { 
                  width: `${(monitoringData.studyTime.thisWeek / monitoringData.studyTime.target) * 100}%`,
                  backgroundColor: '#4CAF50'
                }
              ]}
            />
          </View>
          <Text style={styles.progressScore}>
            {Math.round((monitoringData.studyTime.thisWeek / monitoringData.studyTime.target) * 100)}%
          </Text>
        </View>
      </View>

      <View style={styles.monitoringCard}>
        <Text style={styles.monitoringCardTitle}>App Usage Analysis</Text>
        <View style={styles.appUsageOverview}>
          <Text style={styles.appUsageText}>
            Educational: {monitoringData.appUsage.educational}% of total screen time
          </Text>
        </View>
        
        {monitoringData.appUsage.breakdown.map((app, index) => (
          <View key={index} style={styles.appUsageItem}>
            <Text style={styles.appName}>{app.app}</Text>
            <View style={styles.appUsageBar}>
              <View 
                style={[
                  styles.appUsageFill,
                  { 
                    width: `${(app.time / 5) * 100}%`,
                    backgroundColor: app.category === 'educational' ? '#4CAF50' : '#FF9800'
                  }
                ]}
              />
            </View>
            <Text style={styles.appUsageTime}>{app.time}h</Text>
          </View>
        ))}
      </View>

      <View style={styles.monitoringCard}>
        <Text style={styles.monitoringCardTitle}>Screen Time Summary</Text>
        <View style={styles.screenTimeStats}>
          <View style={styles.screenTimeStat}>
            <Text style={styles.screenTimeNumber}>{monitoringData.screenTime.daily}h</Text>
            <Text style={styles.screenTimeLabel}>Today</Text>
          </View>
          <View style={styles.screenTimeStat}>
            <Text style={styles.screenTimeNumber}>{monitoringData.screenTime.weekly}h</Text>
            <Text style={styles.screenTimeLabel}>This Week</Text>
          </View>
          <View style={styles.screenTimeStat}>
            <Text style={styles.screenTimeNumber}>{monitoringData.screenTime.limit}h</Text>
            <Text style={styles.screenTimeLabel}>Weekly Limit</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { key: 'overview', label: 'Overview', icon: '👶' },
        { key: 'progress', label: 'Progress', icon: '📈' },
        { key: 'financial', label: 'Financial', icon: '💰' },
        { key: 'communication', label: 'Messages', icon: '💬' },
        { key: 'monitoring', label: 'Monitor', icon: '📱' },
      ].map((tab) => (
        <TouchableOpacity 
          key={tab.key}
          style={[
            styles.tabButton,
            selectedTab === tab.key && styles.activeTabButton
          ]}
          onPress={() => setSelectedTab(tab.key as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel,
            selectedTab === tab.key && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => onNavigate('contact-teacher')}
        >
          <Text style={styles.quickActionIcon}>👩‍🏫</Text>
          <Text style={styles.quickActionTitle}>Contact Teacher</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => onNavigate('schedule-meeting')}
        >
          <Text style={styles.quickActionIcon}>📅</Text>
          <Text style={styles.quickActionTitle}>Schedule Meeting</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => onNavigate('view-timetable')}
        >
          <Text style={styles.quickActionIcon}>🕐</Text>
          <Text style={styles.quickActionTitle}>View Timetable</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => onNavigate('download-reports')}
        >
          <Text style={styles.quickActionIcon}>📄</Text>
          <Text style={styles.quickActionTitle}>Download Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Show loading indicator while fetching data
  if (isLoadingData && !children.length) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={LightTheme.Primary} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Show error message if API call failed
  if (childrenError && !children.length) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ Failed to load data</Text>
            <Text style={styles.errorSubtext}>Please check your internet connection</Text>
            <CoachingButton
              title="Retry"
              variant="primary"
              size="medium"
              onPress={handleRefresh}
              style={styles.retryButton}
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabNavigation()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[LightTheme.Primary]}
              tintColor={LightTheme.Primary}
              title="Pull to refresh"
              titleColor={LightTheme.OnSurfaceVariant}
            />
          }
        >
          {selectedTab === 'overview' && (
            <>
              {renderChildOverview()}
              {renderQuickActions()}
            </>
          )}

          {selectedTab === 'progress' && renderProgressTracking()}
          {selectedTab === 'financial' && renderFinancialManagement()}
          {selectedTab === 'communication' && renderCommunicationHub()}
          {selectedTab === 'monitoring' && renderMonitoringTools()}
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
  header: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.XL,
  },
  greetingContainer: {
    marginBottom: Spacing.LG,
  },
  greetingText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  parentName: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight,
    color: '#FFFFFF',
    marginBottom: Spacing.XS,
  },
  dateText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  childSelector: {
    marginTop: Spacing.MD,
  },
  childTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginRight: Spacing.SM,
    alignItems: 'center',
    minWidth: 80,
  },
  selectedChildTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  childAvatar: {
    fontSize: 24,
    marginBottom: Spacing.XS,
  },
  childName: {
    fontSize: Typography.bodySmall.fontSize,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  selectedChildName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.SurfaceVariant,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: '#7C3AED',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: Spacing.XS,
  },
  tabLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  activeTabLabel: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.XL,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  overviewSection: {
    padding: Spacing.LG,
  },
  childSummaryCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  childSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  childInfo: {
    flex: 1,
  },
  childSummaryName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  childSchool: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  overallGrade: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#4CAF50',
    fontWeight: '600',
  },
  todayStatus: {
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  statusBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  attendanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  attendanceLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginRight: Spacing.SM,
    minWidth: 100,
  },
  attendanceBar: {
    flex: 1,
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 4,
    marginRight: Spacing.SM,
  },
  attendanceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  attendancePercent: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    minWidth: 40,
  },
  upcomingClassSection: {
    backgroundColor: LightTheme.primaryContainer,
    borderRadius: BorderRadius.SM,
    padding: Spacing.SM,
  },
  upcomingLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnPrimaryContainer,
    marginBottom: Spacing.XS,
  },
  upcomingClassInfo: {},
  upcomingSubject: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnPrimaryContainer,
  },
  upcomingTime: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnPrimaryContainer,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStatCard: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    padding: Spacing.MD,
    alignItems: 'center',
    flex: 0.3,
  },
  quickStatNumber: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: '#7C3AED',
  },
  quickStatLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  progressSection: {
    padding: Spacing.LG,
  },
  progressCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  progressInfo: {
    flex: 1,
  },
  progressSubject: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  progressTeacher: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  progressUpdated: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  progressGrades: {
    alignItems: 'flex-end',
  },
  currentGrade: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
  },
  progressTrend: {
    fontSize: 20,
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
  progressScore: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    minWidth: 35,
  },
  financialSection: {
    padding: Spacing.LG,
  },
  financialSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  financialStat: {
    alignItems: 'center',
  },
  financialAmount: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: '#7C3AED',
  },
  financialLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  financialCard: {
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
  financialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialInfo: {
    flex: 1,
  },
  financialDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  financialDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  financialDueDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#F44336',
    fontWeight: '600',
  },
  financialAmountContainer: {
    alignItems: 'flex-end',
  },
  financialAmountValue: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    marginBottom: Spacing.XS,
  },
  financialStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  financialStatusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentButton: {
    marginTop: Spacing.MD,
  },
  communicationSection: {
    padding: Spacing.LG,
  },
  communicationCard: {
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
  unreadCommunication: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  communicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  communicationInfo: {
    flex: 1,
  },
  communicationFrom: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  communicationSubject: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  communicationMessage: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: Typography.bodySmall.lineHeight,
    marginBottom: Spacing.XS,
  },
  communicationTime: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  communicationMeta: {
    alignItems: 'center',
  },
  communicationType: {
    fontSize: 20,
    marginBottom: Spacing.XS,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.XS,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  monitoringSection: {
    padding: Spacing.LG,
  },
  monitoringCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  monitoringCardTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  studyTimeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  studyTimeStat: {
    alignItems: 'center',
  },
  studyTimeNumber: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: '#4CAF50',
  },
  studyTimeLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  appUsageOverview: {
    marginBottom: Spacing.MD,
  },
  appUsageText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
  },
  appUsageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  appName: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
    width: 100,
  },
  appUsageBar: {
    flex: 1,
    height: 6,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 3,
    marginHorizontal: Spacing.SM,
  },
  appUsageFill: {
    height: '100%',
    borderRadius: 3,
  },
  appUsageTime: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
    minWidth: 30,
  },
  screenTimeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screenTimeStat: {
    alignItems: 'center',
  },
  screenTimeNumber: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: '#FF9800',
  },
  screenTimeLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  quickActionsSection: {
    padding: Spacing.LG,
    paddingTop: 0,
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
  quickActionIcon: {
    fontSize: 32,
    marginBottom: Spacing.SM,
  },
  quickActionTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.XL,
  },
  loadingText: {
    marginTop: Spacing.MD,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.XL,
  },
  errorText: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.Error,
    marginBottom: Spacing.SM,
  },
  errorSubtext: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  retryButton: {
    minWidth: 120,
  },
});

export default ParentDashboard;