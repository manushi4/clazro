import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Switch,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DashboardCard from '../../components/core/DashboardCard';
import { useChildrenSummary as useParentChildren } from '../../hooks/api/useParentAPI';
// TODO: Add useChildAcademicProgress when backend service is ready
const useChildAcademicProgress = () => ({ data: null, isLoading: false, refetch: async () => {} });

interface Child {
  id: string;
  name: string;
  grade: string;
  class: string;
  avatar: string;
  overallGrade: number;
  attendance: number;
  isActive: boolean;
}

interface AcademicProgress {
  subject: string;
  currentGrade: number;
  previousGrade: number;
  trend: 'improving' | 'stable' | 'declining';
  lastAssignment: string;
  nextAssignment: string;
  teacherFeedback: string;
  participationScore: number;
  assignments: {
    completed: number;
    total: number;
    pending: number;
  };
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  category: 'academic' | 'behavioral' | 'social' | 'extracurricular';
  progress: number;
}

interface BehavioralProgress {
  week: string;
  positivePoints: number;
  concernPoints: number;
  categories: {
    participation: number;
    homework: number;
    behavior: number;
    punctuality: number;
  };
  teacherNotes: string[];
  improvements: string[];
  concerns: string[];
}

interface ChildProgressMonitoringScreenProps {
  parentId: string;
  onNavigate: (screen: string) => void;
}

export const ChildProgressMonitoringScreen: React.FC<ChildProgressMonitoringScreenProps> = ({
  parentId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'behavior' | 'milestones' | 'insights'>('overview');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Real data hooks - Phase 1 implementation
  const {
    data: childrenData = [],
    isLoading: childrenLoading,
    error: childrenError,
    refetch: refetchChildren
  } = useParentChildren(parentId);

  const {
    data: academicData = [],
    isLoading: academicLoading,
    error: academicError,
    refetch: refetchAcademic
  } = useChildAcademicProgress(selectedChild, {
    enabled: !!selectedChild
  });

  const isLoading = childrenLoading || academicLoading;

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onNavigate('back');
      return true;
    });
    return backHandler;
  }, [onNavigate]);

  // Set default selected child when children data loads
  useEffect(() => {
    if (childrenData && childrenData.length > 0 && !selectedChild) {
      const firstChild = childrenData[0];
      const studentId = firstChild.student?.id || firstChild.student_id || '';
      setSelectedChild(studentId);
    }
  }, [childrenData, selectedChild]);

  // Handle errors
  useEffect(() => {
    if (childrenError) {
      showSnackbar('Failed to load children data');
    }
    if (academicError) {
      showSnackbar('Failed to load academic progress');
    }
  }, [childrenError, academicError, showSnackbar]);

  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  // Transform real children data from Supabase
  const children: Child[] = React.useMemo(() => {
    if (!childrenData) return [];

    return childrenData.map((student: any, index: number) => {
      // Calculate overall grade from academic data if available
      let overallGrade = 0;
      if (academicData && student.id === selectedChild) {
        const grades = academicData.map((r: any) => parseFloat(r.current_grade) || 0);
        overallGrade = grades.length > 0
          ? grades.reduce((sum: number, g: number) => sum + g, 0) / grades.length
          : 0;
      }

      return {
        id: student.id,
        name: student.full_name || student.student_name || 'Student',
        grade: student.grade || 'N/A',
        class: student.class || 'N/A',
        avatar: index % 2 === 0 ? '👧' : '👦',
        overallGrade: Math.round(overallGrade * 10) / 10,
        attendance: 0, // Not available in Phase 1
        isActive: student.status === 'active',
      };
    });
  }, [childrenData, academicData, selectedChild]);

  // Transform academic progress data from Supabase
  const academicProgress: Record<string, AcademicProgress[]> = React.useMemo(() => {
    if (!academicData || !selectedChild) return {};

    const transformed: AcademicProgress[] = academicData.map((record: any) => ({
      subject: record.subject,
      currentGrade: parseFloat(record.current_grade) || 0,
      previousGrade: 0, // Not available in current schema
      trend: record.grade_trend as 'improving' | 'stable' | 'declining',
      lastAssignment: '', // Not available in Phase 1
      nextAssignment: '', // Not available in Phase 1
      teacherFeedback: record.teacher_feedback || 'No feedback available',
      participationScore: parseFloat(record.participation_score) || 0,
      assignments: {
        completed: record.assignments_completed || 0,
        total: record.assignments_total || 0,
        pending: record.assignments_pending || 0,
      },
    }));

    return { [selectedChild]: transformed };
  }, [academicData, selectedChild]);

  // Milestones feature not implemented yet
  const [milestones] = useState<Record<string, Milestone[]>>({});

  // Behavioral progress feature not implemented yet
  const [behavioralProgress] = useState<Record<string, BehavioralProgress[]>>({});

  const currentChild = children.find(child => child.id === selectedChild);
  const currentAcademics = academicProgress[selectedChild] || [];
  const currentMilestones = milestones[selectedChild] || [];
  const currentBehavior = behavioralProgress[selectedChild] || [];

  // Pull-to-refresh handler - refetch real data
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Build array of refetch promises conditionally
      const refetchPromises = [refetchChildren()];

      // Only add academic refetch if a child is selected
      if (selectedChild) {
        refetchPromises.push(refetchAcademic());
      }

      // Use allSettled to allow partial success
      const results = await Promise.allSettled(refetchPromises);

      // Check for failures
      const failed = results.filter(r => r.status === 'rejected');
      const succeeded = results.filter(r => r.status === 'fulfilled');

      if (failed.length === 0) {
        showSnackbar('Data refreshed successfully');
      } else if (succeeded.length > 0) {
        showSnackbar(`Partially refreshed (${failed.length} section(s) failed)`);
        console.warn('Some refetches failed:', failed);
      } else {
        throw new Error('All refetches failed');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      showSnackbar('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [refetchChildren, refetchAcademic, selectedChild, showSnackbar]);

  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return '#4CAF50';
    if (grade >= 80) return '#FF9800';
    if (grade >= 70) return '#FFC107';
    return '#F44336';
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'improving': return '📈';
      case 'stable': return '➡️';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in-progress': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'overdue': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: LightTheme.Primary }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content title="Child Progress Monitoring" subtitle="Track your child's academic journey" />
      <Appbar.Action icon="file-chart" onPress={() => onNavigate('download-reports')} />
    </Appbar.Header>
  );

  const renderChildSelector = () => (
    <View style={styles.childSelector}>
      <Text style={styles.selectorTitle}>Select Child</Text>
      <Text style={styles.selectorSubtitle}>Tap to view progress details</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.childList}
        contentContainerStyle={styles.childListContent}
      >
        {children.map((child, index) => (
          <TouchableOpacity
            key={child.id}
            style={[
              styles.childCard,
              selectedChild === child.id && styles.selectedChildCard,
              !child.isActive && styles.inactiveChildCard,
            ]}
            onPress={() => setSelectedChild(child.id)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Select ${child.name}, ${child.grade}, ${selectedChild === child.id ? 'currently selected' : 'tap to select'}`}
            accessibilityState={{ selected: selectedChild === child.id }}
          >
            {selectedChild === child.id && (
              <View style={styles.selectedIndicator}>
                <Icon name="check-circle" size={16} color={LightTheme.Primary} />
              </View>
            )}
            <View style={styles.childAvatarContainer}>
              <Text style={styles.childAvatar}>{child.avatar}</Text>
            </View>
            <Text style={[styles.childName, selectedChild === child.id && styles.selectedChildName]}>
              {child.name.split(' ')[0]}
            </Text>
            <Text style={[styles.childGrade, selectedChild === child.id && styles.selectedChildText]}>
              {child.grade}
            </Text>
            {!child.isActive && (
              <View style={styles.inactiveLabel}>
                <Icon name="school" size={10} color={LightTheme.OnSecondary} />
                <Text style={styles.inactiveLabelText}>Alumni</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {currentChild && (
        <>
          <DashboardCard title={`📊 ${currentChild.name} - Overview`} style={styles.card}>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <Text style={[styles.overviewNumber, { color: getGradeColor(currentChild.overallGrade) }]}>
                  {currentChild.overallGrade}%
                </Text>
                <Text style={styles.overviewLabel}>Overall Grade</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={[styles.overviewNumber, { color: getGradeColor(currentChild.attendance) }]}>
                  {currentChild.attendance}%
                </Text>
                <Text style={styles.overviewLabel}>Attendance</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewNumber}>{currentAcademics.length}</Text>
                <Text style={styles.overviewLabel}>Subjects</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewNumber}>
                  {currentMilestones.filter(m => m.status === 'completed').length}
                </Text>
                <Text style={styles.overviewLabel}>Goals Achieved</Text>
              </View>
            </View>
          </DashboardCard>

          <DashboardCard title="📈 Recent Performance" style={styles.card}>
            <View style={styles.performanceList}>
              {currentAcademics.slice(0, 4).map((subject, index) => (
                <View key={index} style={styles.performanceItem}>
                  <View style={styles.performanceHeader}>
                    <Text style={styles.subjectName}>{subject.subject}</Text>
                    <View style={styles.performanceRight}>
                      <Text style={styles.trendIcon}>{getTrendIcon(subject.trend)}</Text>
                      <Text style={[styles.currentGrade, { color: getGradeColor(subject.currentGrade) }]}>
                        {subject.currentGrade}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.lastAssignment}>{subject.lastAssignment}</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${(subject.assignments.completed / subject.assignments.total) * 100}%`,
                          backgroundColor: getGradeColor(subject.currentGrade)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.assignmentInfo}>
                    {subject.assignments.completed}/{subject.assignments.total} assignments completed
                  </Text>
                </View>
              ))}
            </View>
          </DashboardCard>

          <DashboardCard title="🎯 Active Goals" style={styles.card}>
            <View style={styles.milestonesList}>
              {currentMilestones.filter(m => m.status !== 'completed').slice(0, 3).map((milestone) => (
                <TouchableOpacity
                  key={milestone.id}
                  style={styles.milestoneItem}
                  onPress={() => {
                    setSelectedMilestone(milestone);
                    setShowMilestoneModal(true);
                  }}
                >
                  <View style={styles.milestoneHeader}>
                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                    <Text style={[styles.milestoneStatus, { color: getStatusColor(milestone.status) }]}>
                      {milestone.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                  <View style={styles.milestoneProgress}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${milestone.progress}%`,
                            backgroundColor: getStatusColor(milestone.status)
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{milestone.progress}%</Text>
                  </View>
                  <Text style={styles.milestoneTarget}>
                    Target: {milestone.targetDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </DashboardCard>

          <DashboardCard title="💡 Quick Insights" style={styles.card}>
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>🌟</Text>
                <Text style={styles.insightText}>
                  {currentChild.name.split(' ')[0]} has shown consistent improvement in Mathematics this month
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>⚠️</Text>
                <Text style={styles.insightText}>
                  Science grade trending down - consider additional practice sessions
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>📅</Text>
                <Text style={styles.insightText}>
                  {currentAcademics.reduce((sum, subject) => sum + subject.assignments.pending, 0)} assignments due this week
                </Text>
              </View>
            </View>
          </DashboardCard>
        </>
      )}
    </ScrollView>
  );

  const renderAcademicsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Academic Progress</Text>
        <View style={styles.tabActions}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowComparison(!showComparison)}
          >
            <Text style={styles.toggleButtonText}>
              {showComparison ? 'Hide' : 'Show'} Comparison
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {currentAcademics.map((subject, index) => (
        <DashboardCard key={index} title={`📚 ${subject.subject}`} style={styles.subjectCard}>
          <View style={styles.subjectHeader}>
            <View style={styles.gradeContainer}>
              <Text style={[styles.currentGradeText, { color: getGradeColor(subject.currentGrade) }]}>
                {subject.currentGrade}%
              </Text>
              <View style={styles.trendContainer}>
                <Text style={styles.trendIcon}>{getTrendIcon(subject.trend)}</Text>
                <Text style={styles.trendText}>
                  {subject.currentGrade > subject.previousGrade ? '+' : ''}
                  {(subject.currentGrade - subject.previousGrade).toFixed(1)}
                </Text>
              </View>
            </View>
            <View style={styles.participationScore}>
              <Text style={styles.participationLabel}>Participation</Text>
              <Text style={[styles.participationValue, { color: getGradeColor(subject.participationScore) }]}>
                {subject.participationScore}%
              </Text>
            </View>
          </View>

          <View style={styles.assignmentProgress}>
            <Text style={styles.assignmentTitle}>Assignment Progress</Text>
            <View style={styles.assignmentStats}>
              <View style={styles.assignmentStat}>
                <Text style={styles.assignmentNumber}>{subject.assignments.completed}</Text>
                <Text style={styles.assignmentLabel}>Completed</Text>
              </View>
              <View style={styles.assignmentStat}>
                <Text style={styles.assignmentNumber}>{subject.assignments.pending}</Text>
                <Text style={styles.assignmentLabel}>Pending</Text>
              </View>
              <View style={styles.assignmentStat}>
                <Text style={styles.assignmentNumber}>{subject.assignments.total}</Text>
                <Text style={styles.assignmentLabel}>Total</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(subject.assignments.completed / subject.assignments.total) * 100}%`,
                    backgroundColor: getGradeColor(subject.currentGrade)
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.recentActivity}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <Text style={styles.lastAssignmentText}>{subject.lastAssignment}</Text>
            <Text style={styles.nextAssignmentText}>{subject.nextAssignment}</Text>
          </View>

          <View style={styles.teacherFeedback}>
            <Text style={styles.feedbackTitle}>Teacher Feedback</Text>
            <Text style={styles.feedbackText}>{subject.teacherFeedback}</Text>
          </View>
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderBehaviorTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.tabTitle}>Behavioral Progress</Text>
      
      {currentBehavior.map((week, index) => (
        <DashboardCard key={index} title={`📅 ${week.week}`} style={styles.behaviorCard}>
          <View style={styles.behaviorHeader}>
            <View style={styles.pointsContainer}>
              <View style={styles.positivePoints}>
                <Text style={styles.pointsNumber}>{week.positivePoints}</Text>
                <Text style={styles.pointsLabel}>Positive Points</Text>
              </View>
              <View style={styles.concernPoints}>
                <Text style={styles.pointsNumber}>{week.concernPoints}</Text>
                <Text style={styles.pointsLabel}>Concerns</Text>
              </View>
            </View>
          </View>

          <View style={styles.categoryScores}>
            <Text style={styles.categoryTitle}>Category Scores</Text>
            <View style={styles.categoryGrid}>
              {Object.entries(week.categories).map(([category, score]) => (
                <View key={category} style={styles.categoryItem}>
                  <Text style={styles.categoryName}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                  <Text style={[styles.categoryScore, { color: getGradeColor(score) }]}>
                    {score}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.teacherNotesSection}>
            <Text style={styles.notesTitle}>Teacher Notes</Text>
            {week.teacherNotes.map((note, noteIndex) => (
              <Text key={noteIndex} style={styles.noteText}>• {note}</Text>
            ))}
          </View>

          {week.improvements.length > 0 && (
            <View style={styles.improvementsSection}>
              <Text style={styles.improvementsTitle}>✅ Improvements</Text>
              {week.improvements.map((improvement, impIndex) => (
                <Text key={impIndex} style={styles.improvementText}>• {improvement}</Text>
              ))}
            </View>
          )}

          {week.concerns.length > 0 && (
            <View style={styles.concernsSection}>
              <Text style={styles.concernsTitle}>⚠️ Areas for Attention</Text>
              {week.concerns.map((concern, conIndex) => (
                <Text key={conIndex} style={styles.concernText}>• {concern}</Text>
              ))}
            </View>
          )}
        </DashboardCard>
      ))}
    </ScrollView>
  );

  const renderMilestonesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Goals & Milestones</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => showSnackbar('Add Goal feature - Coming soon! This will allow you to create custom goals for your child.')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Add new goal"
        >
          <Text style={styles.addButtonText}>+ Add Goal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.milestoneStats}>
        <View style={styles.milestoneStatItem}>
          <Text style={styles.milestoneStatNumber}>
            {currentMilestones.filter(m => m.status === 'completed').length}
          </Text>
          <Text style={styles.milestoneStatLabel}>Completed</Text>
        </View>
        <View style={styles.milestoneStatItem}>
          <Text style={styles.milestoneStatNumber}>
            {currentMilestones.filter(m => m.status === 'in-progress').length}
          </Text>
          <Text style={styles.milestoneStatLabel}>In Progress</Text>
        </View>
        <View style={styles.milestoneStatItem}>
          <Text style={styles.milestoneStatNumber}>
            {currentMilestones.filter(m => m.status === 'pending').length}
          </Text>
          <Text style={styles.milestoneStatLabel}>Pending</Text>
        </View>
      </View>

      {currentMilestones.map((milestone) => (
        <TouchableOpacity
          key={milestone.id}
          style={styles.milestoneCard}
          onPress={() => {
            setSelectedMilestone(milestone);
            setShowMilestoneModal(true);
          }}
        >
          <View style={styles.milestoneCardHeader}>
            <Text style={styles.milestoneCardTitle}>{milestone.title}</Text>
            <Text style={[styles.milestoneCardStatus, { color: getStatusColor(milestone.status) }]}>
              {milestone.status.replace('-', ' ').toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.milestoneCardDescription}>{milestone.description}</Text>
          
          <View style={styles.milestoneCardProgress}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${milestone.progress}%`,
                    backgroundColor: getStatusColor(milestone.status)
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{milestone.progress}%</Text>
          </View>

          <View style={styles.milestoneCardFooter}>
            <Text style={styles.milestoneCategoryText}>
              {milestone.category.charAt(0).toUpperCase() + milestone.category.slice(1)}
            </Text>
            <Text style={styles.milestoneTargetDate}>
              Target: {milestone.targetDate.toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderInsightsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.tabTitle}>AI-Powered Insights</Text>
      
      <DashboardCard title="🎯 Personalized Recommendations" style={styles.card}>
        <View style={styles.recommendationsList}>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationIcon}>📚</Text>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Schedule Extra Math Practice</Text>
              <Text style={styles.recommendationText}>
                Based on recent performance trends, scheduling 2-3 extra math practice sessions per week could help improve algebra scores by 15-20%.
              </Text>
              <View style={styles.recommendationActions}>
                <TouchableOpacity
                  style={styles.recommendationButton}
                  onPress={() => {
                    showSnackbar('Redirecting to scheduling...');
                    // TODO: Navigate to scheduling screen when available
                    // onNavigate('schedule-tutoring');
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Schedule extra math practice sessions"
                >
                  <Text style={styles.recommendationButtonText}>Schedule Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.recommendationDismiss}
                  onPress={() => showSnackbar('Recommendation dismissed')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss recommendation"
                >
                  <Text style={styles.recommendationDismissText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationIcon}>👥</Text>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Study Group Opportunity</Text>
              <Text style={styles.recommendationText}>
                Your child could benefit from joining the Science study group. Students in similar situations have shown 25% improvement in understanding.
              </Text>
              <View style={styles.recommendationActions}>
                <TouchableOpacity
                  style={styles.recommendationButton}
                  onPress={() => {
                    showSnackbar('Loading study group information...');
                    // TODO: Navigate to study groups screen when available
                    // onNavigate('study-groups');
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Learn more about study group"
                >
                  <Text style={styles.recommendationButtonText}>Learn More</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.recommendationDismiss}
                  onPress={() => showSnackbar('Recommendation dismissed')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss study group recommendation"
                >
                  <Text style={styles.recommendationDismissText}>Not Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </DashboardCard>

      <DashboardCard title="📊 Comparative Analysis" style={styles.card}>
        <View style={styles.comparisonChart}>
          <Text style={styles.chartTitle}>Performance vs Grade Average</Text>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Your Child</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#9E9E9E' }]} />
              <Text style={styles.legendText}>Grade Average</Text>
            </View>
          </View>
          
          {currentAcademics.map((subject, index) => (
            <View key={index} style={styles.chartRow}>
              <Text style={styles.chartSubject}>{subject.subject}</Text>
              <View style={styles.chartBars}>
                <View style={styles.chartBar}>
                  <View 
                    style={[
                      styles.chartBarFill, 
                      { 
                        width: `${subject.currentGrade}%`, 
                        backgroundColor: '#4CAF50' 
                      }
                    ]} 
                  />
                </View>
                <View style={styles.chartBar}>
                  <View 
                    style={[
                      styles.chartBarFill, 
                      { 
                        width: `${Math.max(75, subject.currentGrade - 5)}%`, 
                        backgroundColor: '#9E9E9E' 
                      }
                    ]} 
                  />
                </View>
              </View>
              <Text style={styles.chartValue}>{subject.currentGrade}%</Text>
            </View>
          ))}
        </View>
      </DashboardCard>

      <DashboardCard title="🔮 Predictive Insights" style={styles.card}>
        <View style={styles.predictiveInsights}>
          <View style={styles.predictionItem}>
            <Text style={styles.predictionIcon}>🎯</Text>
            <View style={styles.predictionContent}>
              <Text style={styles.predictionTitle}>End of Semester Projection</Text>
              <Text style={styles.predictionText}>
                Based on current trends, your child is projected to achieve an overall grade of <Text style={styles.projectedGrade}>89.2%</Text> by semester end.
              </Text>
            </View>
          </View>

          <View style={styles.predictionItem}>
            <Text style={styles.predictionIcon}>📈</Text>
            <View style={styles.predictionContent}>
              <Text style={styles.predictionTitle}>Improvement Opportunities</Text>
              <Text style={styles.predictionText}>
                Focus on Science assignments could potentially increase overall grade by 2-3 percentage points.
              </Text>
            </View>
          </View>

          <View style={styles.predictionItem}>
            <Text style={styles.predictionIcon}>⚠️</Text>
            <View style={styles.predictionContent}>
              <Text style={styles.predictionTitle}>Early Warning</Text>
              <Text style={styles.predictionText}>
                Current trajectory suggests risk of falling behind in Science. Early intervention recommended.
              </Text>
            </View>
          </View>
        </View>
      </DashboardCard>
    </ScrollView>
  );

  const renderMilestoneModal = () => (
    <Modal
      visible={showMilestoneModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowMilestoneModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowMilestoneModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Goal Details</Text>
          <TouchableOpacity
            onPress={() => {
              showSnackbar('Edit goal feature - Coming soon!');
              // TODO: Navigate to goal edit screen when available
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Edit goal"
          >
            <Text style={styles.modalSave}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {selectedMilestone && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.milestoneDetailHeader}>
              <Text style={styles.milestoneDetailTitle}>{selectedMilestone.title}</Text>
              <Text style={[styles.milestoneDetailStatus, { color: getStatusColor(selectedMilestone.status) }]}>
                {selectedMilestone.status.replace('-', ' ').toUpperCase()}
              </Text>
            </View>
            
            <Text style={styles.milestoneDetailDescription}>{selectedMilestone.description}</Text>
            
            <View style={styles.milestoneDetailProgress}>
              <Text style={styles.progressLabel}>Progress: {selectedMilestone.progress}%</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${selectedMilestone.progress}%`,
                      backgroundColor: getStatusColor(selectedMilestone.status)
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.milestoneDetailInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category:</Text>
                <Text style={styles.infoValue}>
                  {selectedMilestone.category.charAt(0).toUpperCase() + selectedMilestone.category.slice(1)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Target Date:</Text>
                <Text style={styles.infoValue}>{selectedMilestone.targetDate.toLocaleDateString()}</Text>
              </View>
              {selectedMilestone.completedDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Completed:</Text>
                  <Text style={styles.infoValue}>{selectedMilestone.completedDate.toLocaleDateString()}</Text>
                </View>
              )}
            </View>

            <View style={styles.milestoneActions}>
              {selectedMilestone.status !== 'completed' && (
                <TouchableOpacity
                  style={styles.milestoneActionButton}
                  onPress={() => showSnackbar('Update Progress feature - Coming soon! You will be able to track goal progress here.')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Update goal progress"
                >
                  <Text style={styles.milestoneActionText}>Update Progress</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.milestoneActionButton}
                onPress={() => showSnackbar('Add Note feature - Coming soon! You will be able to add notes to goals here.')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Add note to goal"
              >
                <Text style={styles.milestoneActionText}>Add Note</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.milestoneActionButton}
                onPress={() => showSnackbar('Share with Teacher feature - Coming soon! You will be able to share goals with teachers.')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Share goal with teacher"
              >
                <Text style={styles.milestoneActionText}>Share with Teacher</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={LightTheme.Primary} barStyle="light-content" />
        {renderAppBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LightTheme.Primary} />
          <Text style={styles.loadingText}>Loading child progress monitoring...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={LightTheme.Primary} barStyle="light-content" />
      {renderAppBar()}

      {renderChildSelector()}

      <View style={styles.tabBar}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'academics', label: '📚 Academics' },
          { key: 'behavior', label: '🎭 Behavior' },
          { key: 'milestones', label: '🎯 Goals' },
          { key: 'insights', label: '💡 Insights' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab.key && styles.activeTabButtonText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'academics' && renderAcademicsTab()}
      {activeTab === 'behavior' && renderBehaviorTab()}
      {activeTab === 'milestones' && renderMilestonesTab()}
      {activeTab === 'insights' && renderInsightsTab()}

      {renderMilestoneModal()}

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
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
    fontSize: 16,
    color: LightTheme.Outline,
  },
  childSelector: {
    backgroundColor: LightTheme.Surface,
    paddingVertical: Spacing.LG,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectorTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    paddingHorizontal: Spacing.LG,
    marginBottom: Spacing.XS,
  },
  selectorSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    paddingHorizontal: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  childList: {
    paddingHorizontal: Spacing.SM,
  },
  childListContent: {
    paddingHorizontal: Spacing.MD,
  },
  childCard: {
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.LG,
    marginHorizontal: Spacing.SM,
    borderRadius: BorderRadius.LG,
    backgroundColor: LightTheme.SurfaceVariant,
    minWidth: 110,
    minHeight: 120,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedChildCard: {
    backgroundColor: LightTheme.PrimaryContainer,
    borderColor: LightTheme.Primary,
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  inactiveChildCard: {
    opacity: 0.6,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  childAvatarContainer: {
    marginBottom: Spacing.SM,
  },
  childAvatar: {
    fontSize: 36,
  },
  childName: {
    fontSize: Typography.labelLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
    textAlign: 'center',
  },
  selectedChildName: {
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '700',
  },
  childGrade: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  selectedChildText: {
    color: LightTheme.OnPrimaryContainer,
  },
  inactiveLabel: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: LightTheme.Secondary,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inactiveLabelText: {
    fontSize: Typography.labelSmall.fontSize,
    color: LightTheme.OnSecondary,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: LightTheme.Primary,
  },
  tabButtonText: {
    fontSize: Typography.labelSmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: LightTheme.Primary,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.LG,
  },
  tabTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  tabActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  toggleButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: LightTheme.SecondaryContainer,
    borderRadius: BorderRadius.SM,
  },
  toggleButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
  },
  addButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: LightTheme.Primary,
    borderRadius: BorderRadius.SM,
  },
  addButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  card: {
    marginBottom: Spacing.LG,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.MD,
  },
  overviewItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  overviewNumber: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight,
    marginBottom: Spacing.XS,
  },
  overviewLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  performanceList: {
    gap: Spacing.LG,
  },
  performanceItem: {
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  subjectName: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  performanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  trendIcon: {
    fontSize: 16,
  },
  currentGrade: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '600',
  },
  lastAssignment: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  progressBar: {
    height: 8,
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.SM,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.SM,
  },
  assignmentInfo: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'right',
  },
  milestonesList: {
    gap: Spacing.MD,
  },
  milestoneItem: {
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  milestoneTitle: {
    flex: 1,
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginRight: Spacing.MD,
  },
  milestoneStatus: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  milestoneDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  milestoneProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  progressText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginLeft: Spacing.SM,
    minWidth: 40,
  },
  milestoneTarget: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  insightsList: {
    gap: Spacing.MD,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: Spacing.MD,
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    lineHeight: 20,
  },
  subjectCard: {
    marginBottom: Spacing.LG,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.LG,
  },
  gradeContainer: {
    alignItems: 'flex-start',
  },
  currentGradeText: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight,
    marginBottom: Spacing.XS,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  trendText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  participationScore: {
    alignItems: 'flex-end',
  },
  participationLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  participationValue: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: '600',
  },
  assignmentProgress: {
    marginBottom: Spacing.LG,
  },
  assignmentTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  assignmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.SM,
  },
  assignmentStat: {
    alignItems: 'center',
  },
  assignmentNumber: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  assignmentLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  recentActivity: {
    marginBottom: Spacing.LG,
  },
  activityTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  lastAssignmentText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  nextAssignmentText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
  },
  teacherFeedback: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
  },
  feedbackTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  feedbackText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 20,
  },
  behaviorCard: {
    marginBottom: Spacing.LG,
  },
  behaviorHeader: {
    marginBottom: Spacing.LG,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  positivePoints: {
    alignItems: 'center',
    padding: Spacing.MD,
    backgroundColor: '#E8F5E8',
    borderRadius: BorderRadius.SM,
    flex: 1,
    marginRight: Spacing.SM,
  },
  concernPoints: {
    alignItems: 'center',
    padding: Spacing.MD,
    backgroundColor: '#FFF3E0',
    borderRadius: BorderRadius.SM,
    flex: 1,
    marginLeft: Spacing.SM,
  },
  pointsNumber: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight,
    marginBottom: Spacing.XS,
  },
  pointsLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  categoryScores: {
    marginBottom: Spacing.LG,
  },
  categoryTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  categoryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  categoryName: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  categoryScore: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '600',
  },
  teacherNotesSection: {
    marginBottom: Spacing.MD,
  },
  notesTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  noteText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
    lineHeight: 20,
  },
  improvementsSection: {
    backgroundColor: '#E8F5E8',
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.MD,
  },
  improvementsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: '#2E7D32',
    marginBottom: Spacing.SM,
  },
  improvementText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#388E3C',
    marginBottom: Spacing.XS,
  },
  concernsSection: {
    backgroundColor: '#FFF3E0',
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
  },
  concernsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: '#F57C00',
    marginBottom: Spacing.SM,
  },
  concernText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#FF8F00',
    marginBottom: Spacing.XS,
  },
  milestoneStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.LG,
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
  },
  milestoneStatItem: {
    alignItems: 'center',
  },
  milestoneStatNumber: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  milestoneStatLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  milestoneCard: {
    padding: Spacing.LG,
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  milestoneCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  milestoneCardTitle: {
    flex: 1,
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginRight: Spacing.MD,
  },
  milestoneCardStatus: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  milestoneCardDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
    lineHeight: 20,
  },
  milestoneCardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  milestoneCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneCategoryText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  milestoneTargetDate: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  recommendationsList: {
    gap: Spacing.LG,
  },
  recommendationItem: {
    flexDirection: 'row',
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  recommendationIcon: {
    fontSize: 24,
    marginRight: Spacing.MD,
    marginTop: Spacing.XS,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  recommendationText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 20,
    marginBottom: Spacing.MD,
  },
  recommendationActions: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  recommendationButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: LightTheme.Primary,
    borderRadius: BorderRadius.SM,
  },
  recommendationButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnPrimary,
    fontWeight: '500',
  },
  recommendationDismiss: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
  },
  recommendationDismissText: {
    fontSize: Typography.labelMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  comparisonChart: {
    gap: Spacing.MD,
  },
  chartTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  chartSubject: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    width: 80,
  },
  chartBars: {
    flex: 1,
    marginHorizontal: Spacing.MD,
  },
  chartBar: {
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.XS,
  },
  chartBarFill: {
    height: '100%',
    borderRadius: BorderRadius.SM,
  },
  chartValue: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  predictiveInsights: {
    gap: Spacing.MD,
  },
  predictionItem: {
    flexDirection: 'row',
    padding: Spacing.MD,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
  },
  predictionIcon: {
    fontSize: 20,
    marginRight: Spacing.MD,
    marginTop: 2,
  },
  predictionContent: {
    flex: 1,
  },
  predictionTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  predictionText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 20,
  },
  projectedGrade: {
    fontWeight: '600',
    color: LightTheme.Primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  modalCancel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  modalTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  modalSave: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.Primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.LG,
  },
  milestoneDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.LG,
  },
  milestoneDetailTitle: {
    flex: 1,
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginRight: Spacing.MD,
  },
  milestoneDetailStatus: {
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: '600',
  },
  milestoneDetailDescription: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: 24,
    marginBottom: Spacing.LG,
  },
  milestoneDetailProgress: {
    marginBottom: Spacing.LG,
  },
  progressLabel: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  milestoneDetailInfo: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.LG,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  infoLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  infoValue: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  milestoneActions: {
    gap: Spacing.MD,
  },
  milestoneActionButton: {
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    backgroundColor: LightTheme.SecondaryContainer,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  milestoneActionText: {
    fontSize: Typography.labelLarge.fontSize,
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
  },
});

export default ChildProgressMonitoringScreen;