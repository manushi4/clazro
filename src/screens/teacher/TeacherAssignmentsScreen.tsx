import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';
import { OfflineBanner } from '../../offline/OfflineBanner';
import { getLocalizedField } from '../../utils/getLocalizedField';
import { useTeacherAssignmentsQuery } from '../../hooks/queries/teacher/useTeacherAssignmentsQuery';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Widgets
import { CreateAssignmentWidget } from '../../components/widgets/teacher/CreateAssignmentWidget';
import { GradingStatsWidget } from '../../components/widgets/teacher/GradingStatsWidget';
import { PendingGradingWidget } from '../../components/widgets/teacher/PendingGradingWidget';

type Props = NativeStackScreenProps<any, 'TeacherAssignments'>;

type TabType = 'all' | 'pending' | 'graded' | 'draft';

const TABS: { id: TabType; labelKey: string; defaultLabel: string; icon: string }[] = [
  { id: 'all', labelKey: 'all', defaultLabel: 'All', icon: 'file-document-multiple-outline' },
  { id: 'pending', labelKey: 'pending', defaultLabel: 'Pending', icon: 'clock-outline' },
  { id: 'graded', labelKey: 'graded', defaultLabel: 'Graded', icon: 'check-circle-outline' },
  { id: 'draft', labelKey: 'draft', defaultLabel: 'Drafts', icon: 'file-edit-outline' },
];

export const TeacherAssignmentsScreen: React.FC<Props> = () => {
  const navigation = useNavigation<any>();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Fetch assignments
  const { data: assignments, isLoading, error, refetch, isRefetching } = useTeacherAssignmentsQuery({
    status: activeTab === 'all' ? undefined : activeTab,
  });

  const handleCreateAssignment = useCallback(() => {
    navigation.navigate('AssignmentCreate');
  }, [navigation]);

  const handleAssignmentPress = useCallback((assignmentId: string) => {
    navigation.navigate('AssignmentDetailTeacher', { assignmentId });
  }, [navigation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return colors.success;
      case 'draft': return colors.warning;
      case 'graded': return colors.primary;
      default: return colors.onSurfaceVariant;
    }
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t('screens.assignments.title', { defaultValue: 'Assignments' })}
          </AppText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t('screens.assignments.title', { defaultValue: 'Assignments' })}
        </AppText>
        <TouchableOpacity onPress={handleCreateAssignment} style={styles.backBtn}>
          <Icon name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab.id ? colors.primary : colors.surfaceVariant,
                  borderRadius: borderRadius.medium,
                },
              ]}
            >
              <Icon
                name={tab.icon}
                size={18}
                color={activeTab === tab.id ? colors.onPrimary : colors.onSurfaceVariant}
              />
              <AppText
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab.id ? colors.onPrimary : colors.onSurfaceVariant },
                ]}
              >
                {t(`screens.assignments.tabs.${tab.labelKey}`, { defaultValue: tab.defaultLabel })}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
        }
      >
        {/* Widget 1: Create Assignment Banner */}
        <View style={styles.widgetSection}>
          <CreateAssignmentWidget
            config={{ variant: 'banner', showIcon: true, showDescription: true }}
            onNavigate={(route) => navigation.navigate(route)}
          />
        </View>

        {/* Widget 2: Grading Stats */}
        <View style={styles.widgetSection}>
          <View style={styles.sectionHeader}>
            <Icon name="chart-bar" size={18} color={colors.primary} />
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t('screens.assignments.sections.overview', { defaultValue: 'Overview' })}
            </AppText>
          </View>
          <GradingStatsWidget
            config={{ showDistribution: true, showAvgScore: true }}
            onNavigate={(route, params) => navigation.navigate(route, params)}
          />
        </View>

        {/* Widget 3: Pending Grading Preview */}
        <View style={styles.widgetSection}>
          <View style={styles.sectionHeader}>
            <Icon name="clock-outline" size={18} color={colors.warning} />
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t('screens.assignments.sections.pendingGrading', { defaultValue: 'Pending Grading' })}
            </AppText>
          </View>
          <PendingGradingWidget
            config={{ maxItems: 3, showProgress: true }}
            onNavigate={(route, params) => navigation.navigate(route, params)}
          />
        </View>

        {/* Error State */}
        {error && (
          <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.medium }]}>
            <Icon name="alert-circle-outline" size={40} color={colors.error} />
            <AppText style={{ color: colors.error, marginTop: 8 }}>
              {t('screens.assignments.states.error', { defaultValue: 'Failed to load assignments' })}
            </AppText>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.retryBtn, { backgroundColor: colors.error }]}
            >
              <AppText style={{ color: colors.onError }}>Retry</AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State - Only show when no assignments */}
        {!error && (!assignments || assignments.length === 0) && (
          <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
            <Icon name="file-document-outline" size={48} color={colors.onSurfaceVariant} />
            <AppText style={{ color: colors.onSurfaceVariant, marginTop: 12, fontSize: 16 }}>
              {t('screens.assignments.states.empty', { defaultValue: 'No assignments yet' })}
            </AppText>
            <TouchableOpacity
              onPress={handleCreateAssignment}
              style={[styles.createBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
            >
              <Icon name="plus" size={20} color={colors.onPrimary} />
              <AppText style={{ color: colors.onPrimary, fontWeight: '600' }}>
                {t('screens.assignments.actions.create', { defaultValue: 'Create Assignment' })}
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* Assignments List */}
        {assignments && assignments.length > 0 && (
          <View style={styles.widgetSection}>
            <View style={styles.sectionHeader}>
              <Icon name="file-document-multiple-outline" size={18} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t('screens.assignments.sections.allAssignments', { defaultValue: 'All Assignments' })}
              </AppText>
              <AppText style={[styles.countBadge, { color: colors.onSurfaceVariant }]}>
                ({assignments.length})
              </AppText>
            </View>
            <View style={styles.listContainer}>
              {assignments.map((assignment) => (
              <TouchableOpacity
                key={assignment.id}
                onPress={() => handleAssignmentPress(assignment.id)}
                style={[styles.assignmentCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
              >
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(assignment.status) }]} />
                <View style={styles.cardContent}>
                  <AppText style={[styles.assignmentTitle, { color: colors.onSurface }]} numberOfLines={1}>
                    {getLocalizedField(assignment, 'title')}
                  </AppText>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Icon name="book-outline" size={14} color={colors.onSurfaceVariant} />
                      <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                        {assignment.subject_name || 'General'}
                      </AppText>
                    </View>
                    <View style={styles.metaItem}>
                      <Icon name="account-group-outline" size={14} color={colors.onSurfaceVariant} />
                      <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                        {assignment.submissions_count || 0} submissions
                      </AppText>
                    </View>
                  </View>
                  {assignment.due_date && (
                    <View style={styles.dueDateRow}>
                      <Icon name="calendar-outline" size={14} color={colors.warning} />
                      <AppText style={[styles.dueText, { color: colors.warning }]}>
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </AppText>
                    </View>
                  )}
                </View>
                <Icon name="chevron-right" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleCreateAssignment}
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 16,
  },
  widgetSection: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  countBadge: {
    fontSize: 13,
    fontWeight: '500',
  },
  stateContainer: {
    padding: 32,
    alignItems: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
  },
  listContainer: {
    gap: 12,
  },
  assignmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  statusIndicator: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  cardContent: {
    flex: 1,
    paddingLeft: 4,
  },
  assignmentTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default TeacherAssignmentsScreen;
