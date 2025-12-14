/**
 * EnhancedParentDashboardScreen - Phase 50: Parent Dashboard & Information Systems
 * Complete parent dashboard with multi-child progress overview and information hub
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Appbar,
  Portal,
  Snackbar,
} from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
// Using updated hooks with production backend services
import {
  useChildrenSummary as useParentChildren,
  useFinancialSummary,
  useActionItems,
} from '../../hooks/api/useParentAPI';

const { width, height } = Dimensions.get('window');

interface ChildProgress {
  id: string;
  name: string;
  grade: string;
  class: string;
  profileImage?: string;
  overallGrade: number;
  attendanceRate: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  upcomingExams: number;
  recentActivities: Activity[];
  subjectPerformance: SubjectPerformance[];
  behaviorRating: 'excellent' | 'good' | 'needs_improvement';
  teacherComments: TeacherComment[];
}

interface Activity {
  id: string;
  type: 'assignment' | 'exam' | 'attendance' | 'behavior' | 'achievement';
  title: string;
  description: string;
  date: string;
  score?: number;
  status: 'completed' | 'pending' | 'overdue';
  importance: 'high' | 'medium' | 'low';
}

interface SubjectPerformance {
  subject: string;
  currentGrade: number;
  trend: 'improving' | 'declining' | 'stable';
  lastAssessment: number;
  upcomingExams: number;
  teacherNote?: string;
}

interface TeacherComment {
  id: string;
  teacher: string;
  subject: string;
  comment: string;
  date: string;
  type: 'praise' | 'concern' | 'suggestion' | 'general';
}

interface FinancialSummary {
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  nextDueDate: string;
  paymentHistory: Payment[];
  discounts: Discount[];
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  method: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
}

interface Discount {
  id: string;
  type: 'academic' | 'sibling' | 'early_payment' | 'financial_aid';
  amount: number;
  description: string;
  validUntil: string;
}

interface CommunicationItem {
  id: string;
  from: string;
  fromRole: 'teacher' | 'admin' | 'principal';
  subject: string;
  message: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  requiresResponse: boolean;
  attachments?: string[];
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'payment' | 'form' | 'meeting' | 'document' | 'permission';
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  childId?: string;
}

interface SchoolInfo {
  announcements: Announcement[];
  calendar: CalendarEvent[];
  policies: PolicyDocument[];
  contacts: SchoolContact[];
  emergencyProcedures: EmergencyInfo[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'general' | 'academic' | 'administrative' | 'emergency';
  targetAudience: string[];
  isImportant: boolean;
  expiryDate?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'holiday' | 'exam' | 'event' | 'meeting' | 'deadline';
  isRecurring: boolean;
  location?: string;
}

interface PolicyDocument {
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
  category: 'academic' | 'disciplinary' | 'health' | 'safety' | 'general';
  url: string;
  isRequired: boolean;
}

interface SchoolContact {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  officeHours: string;
  location: string;
}

interface EmergencyInfo {
  id: string;
  type: 'medical' | 'weather' | 'security' | 'fire' | 'earthquake';
  title: string;
  procedure: string;
  contacts: string[];
  lastUpdated: string;
}

// ============================================================================
// MEMOIZED CHILD COMPONENTS - Performance optimization
// ============================================================================

interface ChildCardProps {
  child: ChildProgress;
  theme: any;
  onPress: (child: ChildProgress) => void;
}

const ChildCard = React.memo<ChildCardProps>(({ child, theme, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.childOverviewCard}
      onPress={() => onPress(child)}
    >
      <View style={styles.childHeader}>
        <View style={[styles.childAvatar, { backgroundColor: theme.Primary }]}>
          <Text style={[styles.childAvatarText, { color: theme.OnPrimary }]}>
            {child.name?.split(' ').map(n => n[0]).join('') || 'S'}
          </Text>
        </View>
        <View style={styles.childInfo}>
          <Text style={[styles.childName, { color: theme.OnSurface }]}>
            {child.name || 'Student'}
          </Text>
          <Text style={[styles.childDetails, { color: theme.OnSurfaceVariant }]}>
            {child.grade} • {child.class}
          </Text>
        </View>
        <View style={[
          styles.overallGradeCircle,
          {
            backgroundColor: child.overallGrade >= 80 ? '#4CAF50' :
                             child.overallGrade >= 60 ? '#FF9800' : '#F44336'
          }
        ]}>
          <Text style={styles.overallGradeText}>
            {Math.round(child.overallGrade)}
          </Text>
        </View>
      </View>

      <View style={styles.childStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.Primary }]}>
            {child.attendanceRate}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
            Attendance
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

interface ActionItemCardProps {
  item: ActionItem;
  theme: any;
  onComplete: (itemId: string) => void;
}

const ActionItemCard = React.memo<ActionItemCardProps>(({ item, theme, onComplete }) => {
  return (
    <View style={styles.actionItemCard}>
      <View style={styles.actionItemHeader}>
        <Text style={[styles.actionItemTitle, { color: theme.OnSurface }]}>
          {item.title}
        </Text>
        <View style={[
          styles.priorityBadge,
          {
            backgroundColor: item.priority === 'high' ? '#F44336' :
                             item.priority === 'medium' ? '#FF9800' : '#4CAF50'
          }
        ]}>
          <Text style={styles.priorityText}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[styles.actionItemDescription, { color: theme.OnSurfaceVariant }]}>
        {item.description}
      </Text>
      <View style={styles.actionItemFooter}>
        <Text style={[styles.actionItemDue, { color: theme.Error }]}>
          Due: {item.dueDate}
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.Primary }]}
          onPress={() => onComplete(item.id)}
        >
          <Text style={[styles.actionButtonText, { color: theme.OnPrimary }]}>
            Complete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

interface CommunicationCardProps {
  communication: CommunicationItem;
  theme: any;
}

const CommunicationCard = React.memo<CommunicationCardProps>(({ communication, theme }) => {
  return (
    <View style={[styles.communicationCard, !communication.isRead && styles.unreadCommunication]}>
      <View style={styles.communicationHeader}>
        <Text style={[styles.communicationFrom, { color: theme.OnSurface }]}>
          {communication.from} ({communication.fromRole})
        </Text>
        <Text style={[styles.communicationDate, { color: theme.OnSurfaceVariant }]}>
          {communication.date}
        </Text>
      </View>
      <Text style={[styles.communicationSubject, { color: theme.OnSurface }]}>
        {communication.subject}
      </Text>
      <Text style={[styles.communicationMessage, { color: theme.OnSurfaceVariant }]} numberOfLines={2}>
        {communication.message}
      </Text>
      {!communication.isRead && (
        <View style={[styles.unreadTag, { backgroundColor: theme.Primary }]}>
          <Text style={[styles.unreadTagText, { color: theme.OnPrimary }]}>NEW</Text>
        </View>
      )}
    </View>
  );
});

const EnhancedParentDashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Get parent ID from authenticated user (CRITICAL: Must match auth.uid() for RLS policies to work)
  const parentId = user?.id || '';

  // Fetch real data using React Query hooks
  const { data: childrenData = [], isLoading: childrenLoading, isError: childrenError, refetch: refetchChildren } = useParentChildren(parentId);
  const { data: financialData = null, isLoading: financialLoading, refetch: refetchFinancial } = useFinancialSummary(parentId);
  // TODO: Add useCommunications hook when backend service is ready
  const communicationsData: any[] = [];
  const communicationsLoading = false;
  const refetchCommunications = async () => {};
  const { data: actionItemsData = [], isLoading: actionItemsLoading, refetch: refetchActionItems } = useActionItems(parentId);

  // TODO: Add useCompleteActionItem mutation when backend service is ready
  const completeActionItemMutation = {
    mutate: async (data: any) => {
      console.log('TODO: Implement completeActionItem mutation for:', data);
    },
    mutateAsync: async (data: any) => {
      console.log('TODO: Implement completeActionItem mutation for:', data);
      return Promise.resolve();
    }
  };

  // 🔍 VALIDATION: Log real API data to console whenever data changes
  useEffect(() => {
    console.log('📊 [EnhancedParentDashboard] Real API Data Loaded:');
    console.log('  👨‍👩‍👧 Children from API:', childrenData?.length || 0, 'children');
    console.log('  💰 Financial data from API:', financialData ? 'Loaded' : 'Not loaded (using mock fallback)');
    console.log('  💬 Communications from API:', communicationsData?.length || 0, 'messages');
    console.log('  ✅ Action Items from API:', actionItemsData?.length || 0, 'items');

    if (childrenData && childrenData.length > 0) {
      childrenData.forEach((child: any) => {
        const student = child.student || child;
        const studentName = student.full_name || student.student_name || child.student_name || 'Unknown';
        const studentId = student.id || child.student_id || 'Unknown';
        console.log(`    📝 Child: ${studentName} (ID: ${studentId})`);
      });
    } else {
      console.log('  ⚠️ No children data from API - check Supabase database');
    }
  }, [childrenData, financialData, communicationsData, actionItemsData]);

  // Transform API data to component format - OPTIMIZED: Only create properties that are rendered
  const children: ChildProgress[] = React.useMemo(() => {
    if (!childrenData?.length) return [];

    return childrenData.map((childData: any) => {
      // Handle nested student object from getChildrenSummary
      const student = childData.student || childData;
      const studentId = student.id || childData.student_id || '';
      const studentName = student.full_name || student.student_name || childData.student_name || 'Student';

      return {
        // Required properties (actually used in render)
        id: studentId,
        name: studentName,

        // Displayed properties (TODO: Fetch from academic API)
        grade: student.batch_id || childData.batch_id || 'N/A',
        class: student.status || childData.enrollment_status || 'Active',
        overallGrade: 0,
        attendanceRate: childData.attendance?.percentage || 0,

        // Stub properties to satisfy interface (not rendered, minimal allocation)
        profileImage: undefined,
        assignmentsCompleted: 0,
        totalAssignments: 0,
        upcomingExams: 0,
        recentActivities: [],
        subjectPerformance: [],
        behaviorRating: 'good' as const,
        teacherComments: [],
      };
    });
  }, [childrenData]);

  // Transform financial data to local interface format - OPTIMIZED: Early return, minimal properties
  const financialSummary: FinancialSummary = React.useMemo(() => {
    if (!financialData) return generateMockFinancialSummary();

    return {
      totalFees: (financialData.total_paid || 0) + (financialData.total_pending || 0),
      paidAmount: financialData.total_paid || 0,
      pendingAmount: financialData.total_pending || 0,
      nextDueDate: '', // Not in API - display fallback in UI
      paymentHistory: [], // Not rendered here - fetched separately when needed
      discounts: [], // Not rendered here
    };
  }, [financialData]);

  // Transform communications data to local interface format - OPTIMIZED: Early return
  const communications: CommunicationItem[] = React.useMemo(() => {
    if (!communicationsData?.length) return [];

    return communicationsData.map(comm => ({
      id: comm.id,
      from: comm.sent_by,
      fromRole: comm.sent_by_role as 'teacher' | 'admin' | 'principal',
      subject: comm.subject,
      message: comm.message,
      date: comm.sent_at,
      priority: comm.priority === 'urgent' ? 'high' : comm.priority === 'normal' ? 'medium' : 'low',
      isRead: !!comm.read_at,
      requiresResponse: comm.response_required,
    }));
  }, [communicationsData]);

  // Transform action items data to local interface format - OPTIMIZED: Early return
  const actionItems: ActionItem[] = React.useMemo(() => {
    if (!actionItemsData?.length) return [];

    return actionItemsData.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      type: (item.action_type || 'document') as 'payment' | 'form' | 'meeting' | 'document' | 'permission',
      dueDate: item.due_date || '',
      status: item.status as 'pending' | 'completed' | 'overdue',
      priority: item.priority === 'urgent' ? 'high' : item.priority === 'high' ? 'high' : item.priority === 'normal' ? 'medium' : 'low',
      childId: item.student_id,
    }));
  }, [actionItemsData]);
  const schoolInfo = generateMockSchoolInfo(); // TODO: Add school info API

  // PERFORMANCE: Memoize all filter operations to prevent recalculation on every render
  const pendingActionItems = React.useMemo(
    () => actionItems.filter(item => item.status !== 'completed'),
    [actionItems]
  );

  const unreadCommunications = React.useMemo(
    () => communications.filter(c => !c.isRead),
    [communications]
  );

  const recentCommunications = React.useMemo(
    () => communications.slice(0, 3),
    [communications]
  );

  const communicationsRequiringResponse = React.useMemo(
    () => communications.filter(c => c.requiresResponse),
    [communications]
  );

  const highPriorityCommunications = React.useMemo(
    () => communications.filter(c => c.priority === 'high'),
    [communications]
  );

  const topPendingActionItems = React.useMemo(
    () => pendingActionItems.slice(0, 3),
    [pendingActionItems]
  );

  // Combined loading state
  const isLoading = childrenLoading || financialLoading || communicationsLoading || actionItemsLoading;

  const [selectedTab, setSelectedTab] = useState<'overview' | 'academic' | 'financial' | 'communication' | 'info'>('overview');
  const [selectedChild, setSelectedChild] = useState<ChildProgress | null>(null);
  const [showChildModal, setShowChildModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'academic', label: 'Academic', icon: '📚' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'communication', label: 'Messages', icon: '💬' },
    { id: 'info', label: 'School Info', icon: 'ℹ️' },
  ];

  // PERFORMANCE: Memoize helper function
  const showSnackbar = React.useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // PERFORMANCE: Wrap all event handlers in useCallback
  const onRefresh = React.useCallback(async () => {
    console.log('🔄 [EnhancedParentDashboard] Refreshing real data from API...');
    setRefreshing(true);
    try {
      // Refetch all data from API
      await Promise.all([
        refetchChildren(),
        refetchFinancial(),
        refetchCommunications(),
        refetchActionItems(),
      ]);
      console.log('✅ [EnhancedParentDashboard] Data refreshed successfully');
      setSnackbarMessage('Dashboard refreshed successfully');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('❌ [EnhancedParentDashboard] Refresh failed:', error);
      setSnackbarMessage('Failed to refresh. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setRefreshing(false);
    }
  }, [refetchChildren, refetchFinancial, refetchCommunications, refetchActionItems, showSnackbar]);

  const handleChildSelect = React.useCallback((child: ChildProgress) => {
    setSelectedChild(child);
    setShowChildModal(true);
  }, []);

  const handleActionItemComplete = React.useCallback(async (itemId: string) => {
    try {
      await completeActionItemMutation.mutateAsync({ itemId });
      showSnackbar('Action item completed successfully!');
      await refetchActionItems();
    } catch (error) {
      console.error('Failed to complete action item:', error);
      showSnackbar('Failed to complete action item. Please try again.');
    }
  }, [completeActionItemMutation, showSnackbar, refetchActionItems]);

  const handlePaymentAction = React.useCallback(() => {
    Alert.alert(
      'Payment Options',
      'Choose your payment method:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Credit Card', onPress: () => Alert.alert('Payment', 'Redirecting to secure payment gateway...') },
        { text: 'Bank Transfer', onPress: () => Alert.alert('Payment', 'Bank transfer details will be sent via email.') },
        { text: 'UPI', onPress: () => Alert.alert('Payment', 'Opening UPI payment interface...') },
      ]
    );
  }, []);

  const handleTabChange = React.useCallback((tabId: string) => {
    setSelectedTab(tabId as any);
  }, []);

  const handleCloseChildModal = React.useCallback(() => {
    setShowChildModal(false);
  }, []);

  const renderTabBar = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={[styles.tabBar, { backgroundColor: theme.Surface }]}
    >
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            selectedTab === tab.id && [styles.activeTab, { backgroundColor: theme.Primary }]
          ]}
          onPress={() => setSelectedTab(tab.id as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel,
            {
              color: selectedTab === tab.id 
                ? theme.OnPrimary 
                : theme.OnSurface
            }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Section */}
      <View style={[styles.welcomeCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.welcomeTitle, { color: theme.OnSurface }]}>
          Welcome, Parent!
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.OnSurfaceVariant }]}>
          Here's an overview of your children's progress
        </Text>
      </View>

      {/* Children Overview */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Children Progress
        </Text>
        {children.map(child => (
          <ChildCard
            key={child.id}
            child={child}
            theme={theme}
            onPress={handleChildSelect}
          />
        ))}
      </View>

      {/* Action Items */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Action Items ({pendingActionItems.length})
        </Text>
        {topPendingActionItems.map(item => (
          <ActionItemCard
            key={item.id}
            item={item}
            theme={theme}
            onComplete={handleActionItemComplete}
          />
        ))}
      </View>

      {/* Recent Communications */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Recent Messages ({unreadCommunications.length} unread)
        </Text>
        {recentCommunications.map(comm => (
          <CommunicationCard
            key={comm.id}
            communication={comm}
            theme={theme}
          />
        ))}
      </View>
    </ScrollView>
  );

  const renderFinancialTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Financial Summary */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Financial Summary
        </Text>
        
        <View style={styles.financialOverview}>
          <View style={styles.financialItem}>
            <Text style={[styles.financialLabel, { color: theme.OnSurfaceVariant }]}>
              Total Fees
            </Text>
            <Text style={[styles.financialValue, { color: theme.OnSurface }]}>
              ₹{financialSummary.totalFees.toLocaleString()}
            </Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={[styles.financialLabel, { color: theme.OnSurfaceVariant }]}>
              Paid Amount
            </Text>
            <Text style={[styles.financialValue, { color: '#4CAF50' }]}>
              ₹{financialSummary.paidAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={[styles.financialLabel, { color: theme.OnSurfaceVariant }]}>
              Pending
            </Text>
            <Text style={[styles.financialValue, { color: '#F44336' }]}>
              ₹{financialSummary.pendingAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {financialSummary.pendingAmount > 0 && (
          <View style={styles.paymentSection}>
            <Text style={[styles.nextDueDate, { color: theme.Error }]}>
              Next Due Date: {financialSummary.nextDueDate}
            </Text>
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: theme.Primary }]}
              onPress={handlePaymentAction}
            >
              <Text style={[styles.payButtonText, { color: theme.OnPrimary }]}>
                Pay Now - ₹{financialSummary.pendingAmount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Payment History */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Payment History
        </Text>
        {financialSummary.paymentHistory.map(payment => (
          <View key={payment.id} style={styles.paymentHistoryItem}>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentDescription, { color: theme.OnSurface }]}>
                {payment.description}
              </Text>
              <Text style={[styles.paymentDate, { color: theme.OnSurfaceVariant }]}>
                {payment.date} • {payment.method}
              </Text>
            </View>
            <View style={styles.paymentAmount}>
              <Text style={[styles.paymentAmountText, { color: theme.OnSurface }]}>
                ₹{payment.amount.toLocaleString()}
              </Text>
              <View style={[
                styles.paymentStatus,
                {
                  backgroundColor: payment.status === 'completed' ? '#4CAF50' :
                                   payment.status === 'pending' ? '#FF9800' : '#F44336'
                }
              ]}>
                <Text style={styles.paymentStatusText}>
                  {payment.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Discounts */}
      {financialSummary.discounts.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
            Applied Discounts
          </Text>
          {financialSummary.discounts.map(discount => (
            <View key={discount.id} style={styles.discountItem}>
              <View style={styles.discountInfo}>
                <Text style={[styles.discountDescription, { color: theme.OnSurface }]}>
                  {discount.description}
                </Text>
                <Text style={[styles.discountValidUntil, { color: theme.OnSurfaceVariant }]}>
                  Valid until: {discount.validUntil}
                </Text>
              </View>
              <Text style={[styles.discountAmount, { color: '#4CAF50' }]}>
                -₹{discount.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderChildModal = () => (
    <Modal
      visible={showChildModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowChildModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.Surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedChild && (
              <>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowChildModal(false)}
                    style={styles.closeButton}
                  >
                    <Text style={[styles.closeButtonText, { color: theme.Primary }]}>×</Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
                    {selectedChild?.name || 'Student'}'s Progress
                  </Text>
                </View>

                {/* Subject Performance */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnSurface }]}>
                    Subject Performance
                  </Text>
                  {selectedChild.subjectPerformance.map((subject, index) => (
                    <View key={index} style={[styles.subjectCard, { backgroundColor: theme.Background }]}>
                      <View style={styles.subjectHeader}>
                        <Text style={[styles.subjectName, { color: theme.OnSurface }]}>
                          {subject.subject}
                        </Text>
                        <View style={styles.subjectGrade}>
                          <Text style={[styles.subjectGradeText, { color: theme.Primary }]}>
                            {subject.currentGrade}%
                          </Text>
                          <Text style={[
                            styles.trendText,
                            {
                              color: subject.trend === 'improving' ? '#4CAF50' :
                                     subject.trend === 'declining' ? '#F44336' : '#FF9800'
                            }
                          ]}>
                            {subject.trend === 'improving' ? '↗️' :
                             subject.trend === 'declining' ? '↘️' : '→'}
                          </Text>
                        </View>
                      </View>
                      {subject.teacherNote && (
                        <Text style={[styles.teacherNote, { color: theme.OnSurfaceVariant }]}>
                          Note: {subject.teacherNote}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* Recent Activities */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnSurface }]}>
                    Recent Activities
                  </Text>
                  {selectedChild.recentActivities.slice(0, 5).map(activity => (
                    <View key={activity.id} style={[styles.activityCard, { backgroundColor: theme.Background }]}>
                      <View style={styles.activityHeader}>
                        <Text style={[styles.activityTitle, { color: theme.OnSurface }]}>
                          {activity.title}
                        </Text>
                        <Text style={[styles.activityDate, { color: theme.OnSurfaceVariant }]}>
                          {activity.date}
                        </Text>
                      </View>
                      <Text style={[styles.activityDescription, { color: theme.OnSurfaceVariant }]}>
                        {activity.description}
                      </Text>
                      {activity.score && (
                        <Text style={[styles.activityScore, { color: theme.Primary }]}>
                          Score: {activity.score}%
                        </Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* Teacher Comments */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.OnSurface }]}>
                    Teacher Comments
                  </Text>
                  {selectedChild.teacherComments.map(comment => (
                    <View key={comment.id} style={[styles.commentCard, { backgroundColor: theme.Background }]}>
                      <View style={styles.commentHeader}>
                        <Text style={[styles.commentTeacher, { color: theme.OnSurface }]}>
                          {comment.teacher} - {comment.subject}
                        </Text>
                        <Text style={[styles.commentDate, { color: theme.OnSurfaceVariant }]}>
                          {comment.date}
                        </Text>
                      </View>
                      <Text style={[styles.commentText, { color: theme.OnSurfaceVariant }]}>
                        {comment.comment}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAcademicTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Academic Overview */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Academic Performance Overview
        </Text>
        
        {children.map(child => (
          <View key={child.id} style={styles.academicChildCard}>
            <View style={styles.academicChildHeader}>
              <Text style={[styles.childName, { color: theme.OnSurface }]}>
                {child.name || 'Student'} - {child.grade}
              </Text>
              <View style={[
                styles.overallGradeCircle,
                {
                  backgroundColor: child.overallGrade >= 80 ? '#4CAF50' :
                                   child.overallGrade >= 60 ? '#FF9800' : '#F44336'
                }
              ]}>
                <Text style={styles.overallGradeText}>
                  {Math.round(child.overallGrade)}%
                </Text>
              </View>
            </View>

            {/* Subject Performance Detailed View */}
            <View style={styles.subjectsContainer}>
              {child.subjectPerformance.map((subject, index) => (
                <View key={index} style={[styles.subjectDetailCard, { backgroundColor: theme.Background }]}>
                  <View style={styles.subjectDetailHeader}>
                    <Text style={[styles.subjectName, { color: theme.OnSurface }]}>
                      {subject.subject}
                    </Text>
                    <View style={styles.subjectGradeContainer}>
                      <Text style={[styles.subjectGradeText, { color: theme.Primary }]}>
                        {subject.currentGrade}%
                      </Text>
                      <Text style={[
                        styles.trendIndicator,
                        {
                          color: subject.trend === 'improving' ? '#4CAF50' :
                                 subject.trend === 'declining' ? '#F44336' : '#FF9800'
                        }
                      ]}>
                        {subject.trend === 'improving' ? '↗️ Improving' :
                         subject.trend === 'declining' ? '↘️ Declining' : '→ Stable'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.subjectStats}>
                    <View style={styles.subjectStatItem}>
                      <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
                        Last Assessment
                      </Text>
                      <Text style={[styles.statValue, { color: theme.Primary }]}>
                        {subject.lastAssessment}%
                      </Text>
                    </View>
                    <View style={styles.subjectStatItem}>
                      <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
                        Upcoming Exams
                      </Text>
                      <Text style={[styles.statValue, { color: theme.Primary }]}>
                        {subject.upcomingExams}
                      </Text>
                    </View>
                  </View>

                  {subject.teacherNote && (
                    <View style={styles.teacherNoteContainer}>
                      <Text style={[styles.teacherNoteLabel, { color: theme.OnSurfaceVariant }]}>
                        Teacher's Note:
                      </Text>
                      <Text style={[styles.teacherNote, { color: theme.OnSurfaceVariant }]}>
                        {subject.teacherNote}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Recent Academic Activities */}
            <View style={styles.recentActivitiesSection}>
              <Text style={[styles.subsectionTitle, { color: theme.OnSurface }]}>
                Recent Academic Activities
              </Text>
              {child.recentActivities.slice(0, 3).map(activity => (
                <View key={activity.id} style={[styles.academicActivityCard, { backgroundColor: theme.Background }]}>
                  <View style={styles.activityHeader}>
                    <View style={styles.activityTitleContainer}>
                      <Text style={[styles.activityType, { color: theme.Primary }]}>
                        {activity.type.toUpperCase()}
                      </Text>
                      <Text style={[styles.activityTitle, { color: theme.OnSurface }]}>
                        {activity.title}
                      </Text>
                    </View>
                    <Text style={[styles.activityDate, { color: theme.OnSurfaceVariant }]}>
                      {activity.date}
                    </Text>
                  </View>
                  <Text style={[styles.activityDescription, { color: theme.OnSurfaceVariant }]}>
                    {activity.description}
                  </Text>
                  {activity.score && (
                    <View style={styles.scoreContainer}>
                      <Text style={[styles.scoreLabel, { color: theme.OnSurfaceVariant }]}>
                        Score:
                      </Text>
                      <Text style={[
                        styles.scoreValue,
                        {
                          color: activity.score >= 80 ? '#4CAF50' :
                                 activity.score >= 60 ? '#FF9800' : '#F44336'
                        }
                      ]}>
                        {activity.score}%
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Upcoming Assessments */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Upcoming Assessments & Deadlines
        </Text>
        
        {/* Mock upcoming assessments */}
        {[
          { subject: 'Mathematics', type: 'Unit Test', date: '2024-01-25', topics: ['Quadratic Equations', 'Functions'] },
          { subject: 'Physics', type: 'Lab Practical', date: '2024-01-28', topics: ['Simple Pendulum', 'Ohm\'s Law'] },
          { subject: 'Chemistry', type: 'Theory Exam', date: '2024-02-02', topics: ['Chemical Bonding', 'Periodic Table'] },
        ].map((assessment, index) => (
          <View key={index} style={styles.assessmentCard}>
            <View style={styles.assessmentHeader}>
              <View>
                <Text style={[styles.assessmentSubject, { color: theme.OnSurface }]}>
                  {assessment.subject}
                </Text>
                <Text style={[styles.assessmentType, { color: theme.OnSurfaceVariant }]}>
                  {assessment.type}
                </Text>
              </View>
              <View style={styles.assessmentDateContainer}>
                <Text style={[styles.assessmentDate, { color: theme.Error }]}>
                  {assessment.date}
                </Text>
                <Text style={[styles.daysLeft, { color: theme.OnSurfaceVariant }]}>
                  ({Math.ceil((new Date(assessment.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)
                </Text>
              </View>
            </View>
            <View style={styles.topicsContainer}>
              <Text style={[styles.topicsLabel, { color: theme.OnSurfaceVariant }]}>
                Topics:
              </Text>
              <Text style={[styles.topicsList, { color: theme.OnSurfaceVariant }]}>
                {assessment.topics.join(', ')}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Study Recommendations */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          AI-Powered Study Recommendations
        </Text>
        
        {[
          { 
            child: 'Arya Sharma',
            subject: 'Chemistry',
            recommendation: 'Focus on Chemical Bonding concepts - practice more numerical problems',
            priority: 'medium',
            estimatedTime: '2-3 hours/week'
          },
          {
            child: 'Dev Sharma',
            subject: 'English',
            recommendation: 'Improve grammar fundamentals - recommended grammar exercises and reading comprehension',
            priority: 'high',
            estimatedTime: '1-2 hours/day'
          },
        ].map((rec, index) => (
          <View key={index} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Text style={[styles.recommendationChild, { color: theme.OnSurface }]}>
                {rec.child} - {rec.subject}
              </Text>
              <View style={[
                styles.priorityTag,
                {
                  backgroundColor: rec.priority === 'high' ? '#F44336' :
                                   rec.priority === 'medium' ? '#FF9800' : '#4CAF50'
                }
              ]}>
                <Text style={styles.priorityTagText}>
                  {rec.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.recommendationText, { color: theme.OnSurfaceVariant }]}>
              {rec.recommendation}
            </Text>
            <Text style={[styles.estimatedTime, { color: theme.Primary }]}>
              Recommended study time: {rec.estimatedTime}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderCommunicationTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Communication Overview */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Messages & Communications
        </Text>
        
        <View style={styles.communicationStats}>
          <View style={styles.communicationStatItem}>
            <Text style={[styles.statValue, { color: theme.Primary }]}>
              {unreadCommunications.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              Unread Messages
            </Text>
          </View>
          <View style={styles.communicationStatItem}>
            <Text style={[styles.statValue, { color: theme.Primary }]}>
              {communicationsRequiringResponse.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              Require Response
            </Text>
          </View>
          <View style={styles.communicationStatItem}>
            <Text style={[styles.statValue, { color: theme.Primary }]}>
              {highPriorityCommunications.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              High Priority
            </Text>
          </View>
        </View>
      </View>

      {/* Message Categories */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Messages by Category
        </Text>

        {/* High Priority Messages */}
        <View style={styles.messageCategorySection}>
          <Text style={[styles.messageCategoryTitle, { color: '#F44336' }]}>
            🚨 High Priority Messages
          </Text>
          {highPriorityCommunications.map(comm => (
            <TouchableOpacity
              key={comm.id}
              style={[
                styles.messageCard,
                { backgroundColor: theme.Background },
                !comm.isRead && styles.unreadMessage
              ]}
              onPress={() => Alert.alert('Message Details', `From: ${comm.from}\nSubject: ${comm.subject}\n\n${comm.message}`)}
            >
              <View style={styles.communicationHeader}>
                <View style={styles.messageFromContainer}>
                  <Text style={[styles.messageFrom, { color: theme.OnSurface }]}>
                    {comm.from}
                  </Text>
                  <Text style={[styles.messageRole, { color: theme.OnSurfaceVariant }]}>
                    ({comm.fromRole})
                  </Text>
                </View>
                <Text style={[styles.communicationDate, { color: theme.OnSurfaceVariant }]}>
                  {comm.date}
                </Text>
              </View>
              <Text style={[styles.messageSubject, { color: theme.OnSurface }]}>
                {comm.subject}
              </Text>
              <Text style={[styles.messagePreview, { color: theme.OnSurfaceVariant }]} numberOfLines={2}>
                {comm.message}
              </Text>
              <View style={styles.messageFooter}>
                {comm.requiresResponse && (
                  <View style={[styles.responseRequiredTag, { backgroundColor: theme.Error }]}>
                    <Text style={[styles.responseRequiredText, { color: theme.OnError }]}>
                      Response Required
                    </Text>
                  </View>
                )}
                {!comm.isRead && (
                  <View style={[styles.unreadTag, { backgroundColor: theme.Primary }]}>
                    <Text style={[styles.unreadTagText, { color: theme.OnPrimary }]}>
                      NEW
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Regular Messages */}
        <View style={styles.messageCategorySection}>
          <Text style={[styles.messageCategoryTitle, { color: theme.OnSurface }]}>
            📬 All Messages
          </Text>
          {communications.map(comm => (
            <TouchableOpacity
              key={comm.id}
              style={[
                styles.messageCard,
                { backgroundColor: theme.Background },
                !comm.isRead && styles.unreadMessage
              ]}
              onPress={() => Alert.alert('Message Details', `From: ${comm.from}\nSubject: ${comm.subject}\n\n${comm.message}`)}
            >
              <View style={styles.communicationHeader}>
                <View style={styles.messageFromContainer}>
                  <Text style={[styles.messageFrom, { color: theme.OnSurface }]}>
                    {comm.from}
                  </Text>
                  <Text style={[styles.messageRole, { color: theme.OnSurfaceVariant }]}>
                    ({comm.fromRole})
                  </Text>
                </View>
                <Text style={[styles.communicationDate, { color: theme.OnSurfaceVariant }]}>
                  {comm.date}
                </Text>
              </View>
              <Text style={[styles.messageSubject, { color: theme.OnSurface }]}>
                {comm.subject}
              </Text>
              <Text style={[styles.messagePreview, { color: theme.OnSurfaceVariant }]} numberOfLines={2}>
                {comm.message}
              </Text>
              <View style={styles.messageFooter}>
                <View style={[
                  styles.priorityIndicator,
                  {
                    backgroundColor: comm.priority === 'high' ? '#F44336' :
                                     comm.priority === 'medium' ? '#FF9800' : '#4CAF50'
                  }
                ]}>
                  <Text style={styles.priorityIndicatorText}>
                    {comm.priority.toUpperCase()}
                  </Text>
                </View>
                {comm.requiresResponse && (
                  <View style={[styles.responseRequiredTag, { backgroundColor: theme.Error }]}>
                    <Text style={[styles.responseRequiredText, { color: theme.OnError }]}>
                      Response Required
                    </Text>
                  </View>
                )}
                {!comm.isRead && (
                  <View style={[styles.unreadTag, { backgroundColor: theme.Primary }]}>
                    <Text style={[styles.unreadTagText, { color: theme.OnPrimary }]}>
                      NEW
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Communication Actions */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Communication Actions
        </Text>
        
        <View style={styles.communicationActions}>
          <TouchableOpacity
            style={[styles.communicationActionButton, { backgroundColor: theme.Primary }]}
            onPress={() => Alert.alert('Compose Message', 'Opening message composer...')}
          >
            <Text style={[styles.communicationActionText, { color: theme.OnPrimary }]}>
              📝 Compose Message
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.communicationActionButton, { backgroundColor: theme.secondary }]}
            onPress={() => Alert.alert('Schedule Meeting', 'Opening meeting scheduler...')}
          >
            <Text style={[styles.communicationActionText, { color: theme.OnSecondary }]}>
              🗓️ Schedule Meeting
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.communicationActionButton, { backgroundColor: theme.Tertiary }]}
            onPress={() => Alert.alert('Emergency Contact', 'Calling school office...')}
          >
            <Text style={[styles.communicationActionText, { color: theme.OnTertiary }]}>
              📞 Emergency Contact
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderInfoTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* School Information Hub */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          School Information Hub
        </Text>
        
        {/* Quick Access Buttons */}
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity
            style={[styles.quickAccessButton, { backgroundColor: theme.PrimaryContainer }]}
            onPress={() => Alert.alert('School Calendar', 'Opening academic calendar...')}
          >
            <Text style={styles.quickAccessIcon}>📅</Text>
            <Text style={[styles.quickAccessLabel, { color: theme.OnPrimaryContainer }]}>
              Academic Calendar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickAccessButton, { backgroundColor: theme.secondaryContainer }]}
            onPress={() => Alert.alert('School Handbook', 'Opening student handbook...')}
          >
            <Text style={styles.quickAccessIcon}>📖</Text>
            <Text style={[styles.quickAccessLabel, { color: theme.OnSecondaryContainer }]}>
              School Handbook
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickAccessButton, { backgroundColor: theme.TertiaryContainer }]}
            onPress={() => Alert.alert('Contact Directory', 'Opening staff directory...')}
          >
            <Text style={styles.quickAccessIcon}>📞</Text>
            <Text style={[styles.quickAccessLabel, { color: theme.OnTertiaryContainer }]}>
              Staff Directory
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickAccessButton, { backgroundColor: theme.PrimaryContainer }]}
            onPress={() => Alert.alert('School Policies', 'Opening policy documents...')}
          >
            <Text style={styles.quickAccessIcon}>📋</Text>
            <Text style={[styles.quickAccessLabel, { color: theme.OnPrimaryContainer }]}>
              Policies & Rules
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Latest Announcements */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Latest School Announcements
        </Text>
        
        {[
          {
            id: '1',
            title: 'Annual Sports Day - 2024',
            content: 'The Annual Sports Day will be held on February 15, 2024. Parents are invited to attend and cheer for their children.',
            date: '2024-01-20',
            category: 'event',
            isImportant: true
          },
          {
            id: '2',
            title: 'Winter Break Schedule',
            content: 'Winter break will commence from December 23, 2023, and classes will resume on January 8, 2024.',
            date: '2024-01-18',
            category: 'academic',
            isImportant: false
          },
          {
            id: '3',
            title: 'Parent-Teacher Meeting Reminder',
            content: 'Quarterly PTMs are scheduled for January 25-27. Please confirm your slot with class teachers.',
            date: '2024-01-15',
            category: 'meeting',
            isImportant: true
          },
        ].map(announcement => (
          <View key={announcement.id} style={[
            styles.announcementCard,
            { backgroundColor: theme.Background },
            announcement.isImportant && styles.importantAnnouncement
          ]}>
            <View style={styles.announcementHeader}>
              <View style={styles.announcementTitleContainer}>
                {announcement.isImportant && (
                  <Text style={styles.importantIcon}>⚠️</Text>
                )}
                <Text style={[styles.announcementTitle, { color: theme.OnSurface }]}>
                  {announcement.title}
                </Text>
              </View>
              <Text style={[styles.announcementDate, { color: theme.OnSurfaceVariant }]}>
                {announcement.date}
              </Text>
            </View>
            <Text style={[styles.announcementContent, { color: theme.OnSurfaceVariant }]}>
              {announcement.content}
            </Text>
            <View style={[
              styles.announcementCategory,
              {
                backgroundColor: announcement.category === 'event' ? '#4CAF50' :
                                 announcement.category === 'academic' ? '#2196F3' : '#FF9800'
              }
            ]}>
              <Text style={styles.announcementCategoryText}>
                {announcement.category.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* School Contacts */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Important School Contacts
        </Text>
        
        {[
          {
            name: 'Principal Office',
            role: 'Administration',
            phone: '+91-98765-43210',
            email: 'principal@manushischool.edu',
            availability: '9:00 AM - 5:00 PM',
            emergency: true
          },
          {
            name: 'Academic Coordinator',
            role: 'Academic Affairs',
            phone: '+91-98765-43211',
            email: 'academics@manushischool.edu',
            availability: '9:00 AM - 4:00 PM',
            emergency: false
          },
          {
            name: 'Transport Coordinator',
            role: 'Transportation',
            phone: '+91-98765-43212',
            email: 'transport@manushischool.edu',
            availability: '7:00 AM - 6:00 PM',
            emergency: true
          },
          {
            name: 'School Nurse',
            role: 'Health & Medical',
            phone: '+91-98765-43213',
            email: 'nurse@manushischool.edu',
            availability: '8:00 AM - 4:00 PM',
            emergency: true
          },
        ].map((contact, index) => (
          <View key={index} style={[styles.contactCard, { backgroundColor: theme.Background }]}>
            <View style={styles.contactHeader}>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: theme.OnSurface }]}>
                  {contact.name}
                </Text>
                <Text style={[styles.contactRole, { color: theme.OnSurfaceVariant }]}>
                  {contact.role}
                </Text>
              </View>
              {contact.emergency && (
                <View style={[styles.emergencyTag, { backgroundColor: '#F44336' }]}>
                  <Text style={styles.emergencyTagText}>EMERGENCY</Text>
                </View>
              )}
            </View>
            
            <View style={styles.contactDetails}>
              <TouchableOpacity
                style={styles.contactDetailItem}
                onPress={() => Alert.alert('Call', `Calling ${contact.phone}...`)}
              >
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={[styles.contactDetailText, { color: theme.Primary }]}>
                  {contact.phone}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.contactDetailItem}
                onPress={() => Alert.alert('Email', `Opening email to ${contact.email}...`)}
              >
                <Text style={styles.contactIcon}>📧</Text>
                <Text style={[styles.contactDetailText, { color: theme.Primary }]}>
                  {contact.email}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.contactDetailItem}>
                <Text style={styles.contactIcon}>🕒</Text>
                <Text style={[styles.contactDetailText, { color: theme.OnSurfaceVariant }]}>
                  {contact.availability}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Emergency Procedures */}
      <View style={[styles.sectionCard, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
          Emergency Procedures & Safety Information
        </Text>
        
        {[
          {
            type: 'Medical Emergency',
            icon: '🏥',
            procedure: 'Contact school nurse immediately. For serious emergencies, call 108 (ambulance) and notify parents.',
            contacts: ['School Nurse: +91-98765-43213', 'Principal: +91-98765-43210'],
            color: '#F44336'
          },
          {
            type: 'Weather Emergency',
            icon: '🌪️',
            procedure: 'Students will be kept safe at school. Parents will be notified about pickup procedures via SMS/email.',
            contacts: ['Main Office: +91-98765-43210', 'Transport: +91-98765-43212'],
            color: '#FF9800'
          },
          {
            type: 'Security Concerns',
            icon: '🔒',
            procedure: 'Report immediately to security or main office. School follows lockdown protocols as needed.',
            contacts: ['Security: +91-98765-43214', 'Principal: +91-98765-43210'],
            color: '#9C27B0'
          },
        ].map((emergency, index) => (
          <View key={index} style={[styles.emergencyCard, { backgroundColor: theme.Background }]}>
            <View style={styles.emergencyHeader}>
              <View style={styles.emergencyTitleContainer}>
                <Text style={[styles.emergencyIcon, { color: emergency.color }]}>
                  {emergency.icon}
                </Text>
                <Text style={[styles.emergencyType, { color: theme.OnSurface }]}>
                  {emergency.type}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.emergencyProcedure, { color: theme.OnSurfaceVariant }]}>
              {emergency.procedure}
            </Text>
            
            <View style={styles.emergencyContacts}>
              <Text style={[styles.emergencyContactsLabel, { color: theme.OnSurface }]}>
                Emergency Contacts:
              </Text>
              {emergency.contacts.map((contact, contactIndex) => (
                <Text key={contactIndex} style={[styles.emergencyContactItem, { color: theme.Primary }]}>
                  • {contact}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'financial':
        return renderFinancialTab();
      case 'academic':
        return renderAcademicTab();
      case 'communication':
        return renderCommunicationTab();
      case 'info':
        return renderInfoTab();
      default:
        return (
          <View style={styles.comingSoon}>
            <Text style={[styles.comingSoonText, { color: theme.OnSurfaceVariant }]}>
              Dashboard content loaded successfully! Select a tab above to explore parent features.
            </Text>
          </View>
        );
    }
  };

  // Error state
  if (childrenError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.Background }]}>
        <StatusBar backgroundColor={theme.Surface} barStyle="dark-content" />
        <Appbar.Header elevated style={{ backgroundColor: theme.Surface }}>
          <Appbar.Content title="Parent Dashboard" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>⚠️ Unable to Load Dashboard</Text>
          <Text style={styles.errorSubtext}>Please check your connection and try again.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.Background }]}>
        <StatusBar backgroundColor={theme.Surface} barStyle="dark-content" />
        <Appbar.Header elevated style={{ backgroundColor: theme.Surface }}>
          <Appbar.Content title="Parent Dashboard" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.Background }]}>
      <StatusBar backgroundColor={theme.Surface} barStyle="dark-content" />

      {/* Header */}
      <Appbar.Header elevated style={{ backgroundColor: theme.Surface }}>
        <Appbar.Content
          title="Parent Dashboard"
          subtitle="Monitor your children's progress and school activities"
        />
      </Appbar.Header>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      {renderContent()}

      {/* Child Modal */}
      {renderChildModal()}

      {/* Snackbar for notifications */}
      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={{ backgroundColor: theme.Surface }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
};

// Mock data generators
function generateMockChildren(): ChildProgress[] {
  return [
    {
      id: '1',
      name: 'Arya Sharma',
      grade: 'Class 10',
      class: 'Section A',
      overallGrade: 87.5,
      attendanceRate: 94,
      assignmentsCompleted: 18,
      totalAssignments: 20,
      upcomingExams: 3,
      behaviorRating: 'excellent',
      recentActivities: [
        {
          id: '1',
          type: 'exam',
          title: 'Mathematics Unit Test',
          description: 'Scored 92% in quadratic equations test',
          date: '2024-01-15',
          score: 92,
          status: 'completed',
          importance: 'high',
        },
        {
          id: '2',
          type: 'assignment',
          title: 'Physics Lab Report',
          description: 'Submitted report on pendulum experiment',
          date: '2024-01-12',
          score: 85,
          status: 'completed',
          importance: 'medium',
        },
      ],
      subjectPerformance: [
        {
          subject: 'Mathematics',
          currentGrade: 92,
          trend: 'improving',
          lastAssessment: 94,
          upcomingExams: 1,
          teacherNote: 'Excellent progress in algebra concepts',
        },
        {
          subject: 'Physics',
          currentGrade: 88,
          trend: 'stable',
          lastAssessment: 87,
          upcomingExams: 1,
          teacherNote: 'Good understanding of mechanics',
        },
        {
          subject: 'Chemistry',
          currentGrade: 85,
          trend: 'improving',
          lastAssessment: 89,
          upcomingExams: 1,
        },
        {
          subject: 'English',
          currentGrade: 91,
          trend: 'stable',
          lastAssessment: 90,
          upcomingExams: 0,
        },
      ],
      teacherComments: [
        {
          id: '1',
          teacher: 'Ms. Priya Patel',
          subject: 'Mathematics',
          comment: 'Arya shows exceptional problem-solving skills and helps classmates understand concepts.',
          date: '2024-01-10',
          type: 'praise',
        },
        {
          id: '2',
          teacher: 'Mr. Rajesh Kumar',
          subject: 'Physics',
          comment: 'Good participation in lab activities. Needs to improve theoretical understanding.',
          date: '2024-01-08',
          type: 'suggestion',
        },
      ],
    },
    {
      id: '2',
      name: 'Dev Sharma',
      grade: 'Class 7',
      class: 'Section B',
      overallGrade: 78.3,
      attendanceRate: 89,
      assignmentsCompleted: 15,
      totalAssignments: 17,
      upcomingExams: 2,
      behaviorRating: 'good',
      recentActivities: [
        {
          id: '3',
          type: 'assignment',
          title: 'History Project',
          description: 'Submitted project on Indian Independence Movement',
          date: '2024-01-14',
          score: 82,
          status: 'completed',
          importance: 'medium',
        },
      ],
      subjectPerformance: [
        {
          subject: 'Mathematics',
          currentGrade: 75,
          trend: 'improving',
          lastAssessment: 78,
          upcomingExams: 1,
          teacherNote: 'Showing improvement after extra tutoring sessions',
        },
        {
          subject: 'Science',
          currentGrade: 82,
          trend: 'stable',
          lastAssessment: 81,
          upcomingExams: 1,
        },
        {
          subject: 'English',
          currentGrade: 79,
          trend: 'declining',
          lastAssessment: 76,
          upcomingExams: 0,
          teacherNote: 'Needs to work on grammar and vocabulary',
        },
        {
          subject: 'History',
          currentGrade: 86,
          trend: 'improving',
          lastAssessment: 89,
          upcomingExams: 0,
        },
      ],
      teacherComments: [
        {
          id: '3',
          teacher: 'Mrs. Anita Verma',
          subject: 'English',
          comment: 'Dev is a bright student but needs to be more attentive during grammar lessons.',
          date: '2024-01-12',
          type: 'concern',
        },
      ],
    },
  ];
}

function generateMockFinancialSummary(): FinancialSummary {
  return {
    totalFees: 125000,
    paidAmount: 75000,
    pendingAmount: 50000,
    nextDueDate: '2024-02-15',
    paymentHistory: [
      {
        id: '1',
        amount: 25000,
        date: '2024-01-15',
        method: 'UPI',
        description: 'Quarterly Fee - Term 3',
        status: 'completed',
      },
      {
        id: '2',
        amount: 50000,
        date: '2023-12-15',
        method: 'Bank Transfer',
        description: 'Half-yearly Fee - Term 1 & 2',
        status: 'completed',
      },
      {
        id: '3',
        amount: 15000,
        date: '2023-11-10',
        method: 'Credit Card',
        description: 'Transport Fee - Annual',
        status: 'completed',
      },
    ],
    discounts: [
      {
        id: '1',
        type: 'sibling',
        amount: 12500,
        description: 'Sibling Discount (10% for second child)',
        validUntil: '2024-03-31',
      },
      {
        id: '2',
        type: 'early_payment',
        amount: 2500,
        description: 'Early Payment Discount (2%)',
        validUntil: '2024-02-15',
      },
    ],
  };
}

function generateMockCommunications(): CommunicationItem[] {
  return [
    {
      id: '1',
      from: 'Ms. Priya Patel',
      fromRole: 'teacher',
      subject: 'Excellent Performance in Mathematics',
      message: 'I wanted to congratulate Arya on her outstanding performance in the recent mathematics unit test. She scored 92% and showed excellent problem-solving skills.',
      date: '2024-01-15',
      priority: 'medium',
      isRead: false,
      requiresResponse: false,
    },
    {
      id: '2',
      from: 'Principal Office',
      fromRole: 'admin',
      subject: 'Parent-Teacher Meeting Schedule',
      message: 'The quarterly parent-teacher meetings are scheduled for January 25-27, 2024. Please confirm your preferred time slot by January 20th.',
      date: '2024-01-12',
      priority: 'high',
      isRead: true,
      requiresResponse: true,
    },
    {
      id: '3',
      from: 'Mr. Rajesh Kumar',
      fromRole: 'teacher',
      subject: 'Physics Lab Safety Reminder',
      message: 'Reminder to send safety goggles and lab coat for Dev as we have important chemistry experiments next week.',
      date: '2024-01-10',
      priority: 'medium',
      isRead: false,
      requiresResponse: false,
    },
  ];
}

function generateMockActionItems(): ActionItem[] {
  return [
    {
      id: '1',
      title: 'Fee Payment Due',
      description: 'Quarterly fee payment for Term 4 is due',
      type: 'payment',
      dueDate: '2024-02-15',
      status: 'pending',
      priority: 'high',
    },
    {
      id: '2',
      title: 'Medical Form Submission',
      description: 'Submit updated medical and emergency contact information',
      type: 'form',
      dueDate: '2024-01-25',
      status: 'pending',
      priority: 'medium',
      childId: '1',
    },
    {
      id: '3',
      title: 'Parent-Teacher Meeting RSVP',
      description: 'Confirm your attendance and preferred time slot for PTM',
      type: 'meeting',
      dueDate: '2024-01-20',
      status: 'overdue',
      priority: 'high',
    },
    {
      id: '4',
      title: 'Field Trip Permission',
      description: 'Sign permission slip for science museum field trip',
      type: 'permission',
      dueDate: '2024-01-30',
      status: 'pending',
      priority: 'medium',
      childId: '2',
    },
  ];
}

function generateMockSchoolInfo(): SchoolInfo {
  return {
    announcements: [],
    calendar: [],
    policies: [],
    contacts: [],
    emergencyProcedures: [],
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.XL,
  },
  loadingText: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.MD,
  },
  errorText: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: '600',
    color: LightTheme.Error,
    marginBottom: Spacing.MD,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XL,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: LightTheme.Primary,
    paddingHorizontal: Spacing.XL,
    paddingVertical: Spacing.MD,
    borderRadius: 8,
    marginTop: Spacing.MD,
  },
  retryButtonText: {
    color: LightTheme.OnPrimary,
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
  },
  header: {
    padding: Spacing.LG,
    paddingBottom: Spacing.MD,
  },
  headerTitle: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight as any,
    marginBottom: Spacing.XS,
  },
  headerSubtitle: {
    fontSize: Typography.bodyLarge.fontSize,
  },
  tabBar: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderRadius: 8,
    marginRight: Spacing.SM,
    minWidth: 110,
  },
  activeTab: {
    elevation: 2,
  },
  tabIcon: {
    fontSize: 18,
    marginRight: Spacing.XS,
  },
  tabLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: Spacing.MD,
  },
  welcomeCard: {
    borderRadius: 12,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    marginBottom: Spacing.XS,
  },
  welcomeSubtitle: {
    fontSize: Typography.bodyLarge.fontSize,
  },
  sectionCard: {
    borderRadius: 12,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  childOverviewCard: {
    marginBottom: Spacing.MD,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.MD,
  },
  childAvatarText: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  childDetails: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  overallGradeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallGradeText: {
    color: 'white',
    fontSize: Typography.labelLarge.fontSize,
    fontWeight: 'bold',
  },
  childStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
  },
  actionItemCard: {
    marginBottom: Spacing.MD,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  actionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  actionItemTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  actionItemDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.SM,
  },
  actionItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionItemDue: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  communicationCard: {
    marginBottom: Spacing.MD,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  unreadCommunication: {
    paddingLeft: Spacing.SM,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  communicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  communicationFrom: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  communicationDate: {
    fontSize: Typography.bodySmall.fontSize,
  },
  communicationSubject: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight as any,
    marginBottom: Spacing.XS,
  },
  communicationMessage: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
  },
  financialOverview: {
    marginBottom: Spacing.LG,
  },
  financialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  financialLabel: {
    fontSize: Typography.bodyLarge.fontSize,
  },
  financialValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
  },
  paymentSection: {
    alignItems: 'center',
    paddingTop: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  nextDueDate: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.MD,
  },
  payButton: {
    paddingHorizontal: Spacing.XL,
    paddingVertical: Spacing.MD,
    borderRadius: 8,
  },
  payButtonText: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
  },
  paymentHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: Typography.bodySmall.fontSize,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  paymentAmountText: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentStatusText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  discountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
    paddingVertical: Spacing.SM,
  },
  discountInfo: {
    flex: 1,
  },
  discountDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginBottom: 2,
  },
  discountValidUntil: {
    fontSize: Typography.bodySmall.fontSize,
  },
  discountAmount: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: 'bold',
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    fontSize: Typography.titleMedium.fontSize,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 16,
    padding: Spacing.LG,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 32,
    fontWeight: '300',
  },
  modalTitle: {
    flex: 1,
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: Spacing.XL,
  },
  modalSectionTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  subjectCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.XS,
  },
  subjectName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  subjectGrade: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectGradeText: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: 'bold',
    marginRight: Spacing.XS,
  },
  trendText: {
    fontSize: 16,
  },
  teacherNote: {
    fontSize: Typography.bodyMedium.fontSize,
    fontStyle: 'italic',
  },
  activityCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.XS,
  },
  activityTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '500',
    flex: 1,
  },
  activityDate: {
    fontSize: Typography.bodySmall.fontSize,
  },
  activityDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.XS,
  },
  activityScore: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  commentCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.XS,
  },
  commentTeacher: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    flex: 1,
  },
  commentDate: {
    fontSize: Typography.bodySmall.fontSize,
  },
  commentText: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
  },
  // Academic Tab Styles
  academicChildCard: {
    marginBottom: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  academicChildHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  subjectsContainer: {
    marginBottom: Spacing.MD,
  },
  subjectDetailCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  subjectDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  subjectGradeContainer: {
    alignItems: 'flex-end',
  },
  trendIndicator: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.SM,
  },
  subjectStatItem: {
    alignItems: 'center',
  },
  teacherNoteContainer: {
    paddingTop: Spacing.SM,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  teacherNoteLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    marginBottom: 2,
  },
  recentActivitiesSection: {
    marginTop: Spacing.MD,
  },
  subsectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  academicActivityCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  activityTitleContainer: {
    flex: 1,
  },
  activityType: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.XS,
  },
  scoreLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    marginRight: Spacing.XS,
  },
  scoreValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: 'bold',
  },
  assessmentCard: {
    marginBottom: Spacing.MD,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  assessmentSubject: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  assessmentType: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  assessmentDateContainer: {
    alignItems: 'flex-end',
  },
  assessmentDate: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  daysLeft: {
    fontSize: Typography.bodySmall.fontSize,
  },
  topicsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicsLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginRight: Spacing.XS,
  },
  topicsList: {
    fontSize: Typography.bodyMedium.fontSize,
    flex: 1,
  },
  recommendationCard: {
    marginBottom: Spacing.MD,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  recommendationChild: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    flex: 1,
  },
  priorityTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityTagText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  recommendationText: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.SM,
    lineHeight: 20,
  },
  estimatedTime: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  // Communication Tab Styles
  communicationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.LG,
  },
  communicationStatItem: {
    alignItems: 'center',
  },
  messageCategorySection: {
    marginBottom: Spacing.LG,
  },
  messageCategoryTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: Spacing.MD,
  },
  messageCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  messageFromContainer: {
    flex: 1,
  },
  messageFrom: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
  },
  messageRole: {
    fontSize: Typography.bodySmall.fontSize,
  },
  messageSubject: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight as any,
    marginBottom: Spacing.XS,
  },
  messagePreview: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.SM,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priorityIndicator: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: Spacing.SM,
  },
  priorityIndicatorText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  responseRequiredTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: Spacing.SM,
  },
  responseRequiredText: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  unreadTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  communicationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  communicationActionButton: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderRadius: 8,
    marginBottom: Spacing.SM,
    minWidth: 140,
    alignItems: 'center',
  },
  communicationActionText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  // Info Tab Styles
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessButton: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.LG,
    borderRadius: 12,
    marginBottom: Spacing.MD,
  },
  quickAccessIcon: {
    fontSize: 32,
    marginBottom: Spacing.SM,
  },
  quickAccessLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    textAlign: 'center',
  },
  announcementCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  importantAnnouncement: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  announcementTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  importantIcon: {
    fontSize: 16,
    marginRight: Spacing.XS,
  },
  announcementTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    flex: 1,
  },
  announcementDate: {
    fontSize: Typography.bodySmall.fontSize,
  },
  announcementContent: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.SM,
  },
  announcementCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
  },
  announcementCategoryText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  contactCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginBottom: 2,
  },
  contactRole: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  emergencyTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emergencyTagText: {
    color: 'white',
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: 'bold',
  },
  contactDetails: {
    gap: Spacing.SM,
  },
  contactDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 16,
    marginRight: Spacing.SM,
  },
  contactDetailText: {
    fontSize: Typography.bodyMedium.fontSize,
  },
  emergencyCard: {
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  emergencyHeader: {
    marginBottom: Spacing.MD,
  },
  emergencyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyIcon: {
    fontSize: 24,
    marginRight: Spacing.SM,
  },
  emergencyType: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
  },
  emergencyProcedure: {
    fontSize: Typography.bodyMedium.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.MD,
  },
  emergencyContacts: {
    paddingTop: Spacing.SM,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  emergencyContactsLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.SM,
  },
  emergencyContactItem: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: 2,
  },
});

export default EnhancedParentDashboardScreen;