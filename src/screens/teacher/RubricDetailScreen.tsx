import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../ui/components/AppText';
import { OfflineBanner } from '../../offline/OfflineBanner';
import { getLocalizedField } from '../../utils/getLocalizedField';
import { useRubricTemplatesQuery } from '../../hooks/queries/teacher/useRubricTemplatesQuery';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'RubricDetail'>;

// Sample criteria for each rubric type
const RUBRIC_CRITERIA: Record<string, { name: string; levels: string[] }[]> = {
  essay: [
    { name: 'Content & Ideas', levels: ['Exceptional', 'Proficient', 'Developing', 'Beginning'] },
    { name: 'Organization', levels: ['Exceptional', 'Proficient', 'Developing', 'Beginning'] },
    { name: 'Grammar & Mechanics', levels: ['Exceptional', 'Proficient', 'Developing', 'Beginning'] },
    { name: 'Style & Voice', levels: ['Exceptional', 'Proficient', 'Developing', 'Beginning'] },
  ],
  presentation: [
    { name: 'Content Knowledge', levels: ['Excellent', 'Good', 'Satisfactory', 'Needs Work'] },
    { name: 'Delivery & Confidence', levels: ['Excellent', 'Good', 'Satisfactory', 'Needs Work'] },
    { name: 'Visual Aids', levels: ['Excellent', 'Good', 'Satisfactory', 'Needs Work'] },
    { name: 'Q&A Response', levels: ['Excellent', 'Good', 'Satisfactory', 'Needs Work'] },
  ],
  'lab-report': [
    { name: 'Procedure', levels: ['Complete', 'Adequate', 'Partial', 'Incomplete'] },
    { name: 'Data Collection', levels: ['Complete', 'Adequate', 'Partial', 'Incomplete'] },
    { name: 'Analysis', levels: ['Complete', 'Adequate', 'Partial', 'Incomplete'] },
    { name: 'Conclusion', levels: ['Complete', 'Adequate', 'Partial', 'Incomplete'] },
  ],
  project: [
    { name: 'Planning', levels: ['Excellent', 'Good', 'Fair', 'Poor'] },
    { name: 'Execution', levels: ['Excellent', 'Good', 'Fair', 'Poor'] },
    { name: 'Innovation', levels: ['Excellent', 'Good', 'Fair', 'Poor'] },
    { name: 'Documentation', levels: ['Excellent', 'Good', 'Fair', 'Poor'] },
  ],
  homework: [
    { name: 'Accuracy', levels: ['Excellent', 'Good', 'Needs Improvement'] },
    { name: 'Completeness', levels: ['Excellent', 'Good', 'Needs Improvement'] },
    { name: 'Neatness', levels: ['Excellent', 'Good', 'Needs Improvement'] },
  ],
  participation: [
    { name: 'Engagement', levels: ['Active', 'Moderate', 'Minimal'] },
    { name: 'Questions Asked', levels: ['Active', 'Moderate', 'Minimal'] },
    { name: 'Collaboration', levels: ['Active', 'Moderate', 'Minimal'] },
  ],
};

export const RubricDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const rubricId = route.params?.rubricId;

  // Fetch all rubric templates and find the one we need
  const { data: templates, isLoading, error, refetch } = useRubricTemplatesQuery({ limit: 20 });

  const rubric = templates?.find((r) => r.id === rubricId);
  const criteria = RUBRIC_CRITERIA[rubricId] || [];

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t('screens.rubricDetail.title', { defaultValue: 'Rubric Details' })}
          </AppText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={{ color: colors.onSurfaceVariant, marginTop: 12 }}>
            {t('common:status.loading', { defaultValue: 'Loading...' })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === ERROR STATE ===
  if (error || !rubric) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t('screens.rubricDetail.title', { defaultValue: 'Rubric Details' })}
          </AppText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <AppText style={{ color: colors.error, marginTop: 12, fontSize: 16 }}>
            {t('screens.rubricDetail.states.error', { defaultValue: 'Rubric not found' })}
          </AppText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <AppText style={{ color: colors.onPrimary }}>
              {t('common:actions.retry', { defaultValue: 'Retry' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {getLocalizedField(rubric, 'name')}
        </AppText>
        <TouchableOpacity style={styles.backBtn}>
          <Icon name="pencil-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Rubric Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${rubric.color}20` }]}>
            <Icon name={rubric.icon} size={32} color={rubric.color} />
          </View>
          <AppText style={[styles.rubricName, { color: colors.onSurface }]}>
            {getLocalizedField(rubric, 'name')}
          </AppText>
          <AppText style={[styles.rubricDesc, { color: colors.onSurfaceVariant }]}>
            {getLocalizedField(rubric, 'description')}
          </AppText>

          <View style={styles.statsRow}>
            <View style={[styles.statItem, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}>
              <AppText style={[styles.statValue, { color: colors.primary }]}>{rubric.criteria_count}</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t('screens.rubricDetail.criteria', { defaultValue: 'Criteria' })}
              </AppText>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}>
              <AppText style={[styles.statValue, { color: colors.primary }]}>{rubric.max_score}</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t('screens.rubricDetail.maxScore', { defaultValue: 'Max Score' })}
              </AppText>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}>
              <AppText style={[styles.statValue, { color: rubric.is_system ? colors.success : colors.primary }]}>
                {rubric.is_system ? 'System' : 'Custom'}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t('screens.rubricDetail.type', { defaultValue: 'Type' })}
              </AppText>
            </View>
          </View>
        </View>

        {/* Criteria Section */}
        <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
          {t('screens.rubricDetail.gradingCriteria', { defaultValue: 'Grading Criteria' })}
        </AppText>

        {criteria.length > 0 ? (
          criteria.map((criterion, index) => (
            <View
              key={index}
              style={[styles.criterionCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
            >
              <View style={styles.criterionHeader}>
                <View style={[styles.criterionNumber, { backgroundColor: `${rubric.color}20` }]}>
                  <AppText style={[styles.criterionNumberText, { color: rubric.color }]}>{index + 1}</AppText>
                </View>
                <AppText style={[styles.criterionName, { color: colors.onSurface }]}>{criterion.name}</AppText>
              </View>
              <View style={styles.levelsRow}>
                {criterion.levels.map((level, levelIndex) => (
                  <View
                    key={levelIndex}
                    style={[
                      styles.levelChip,
                      {
                        backgroundColor: levelIndex === 0 ? `${colors.success}20` : colors.surface,
                        borderRadius: borderRadius.small,
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        styles.levelText,
                        { color: levelIndex === 0 ? colors.success : colors.onSurfaceVariant },
                      ]}
                    >
                      {level}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
            <Icon name="clipboard-text-outline" size={40} color={colors.onSurfaceVariant} />
            <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
              {t('screens.rubricDetail.noCriteria', { defaultValue: 'No criteria defined' })}
            </AppText>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
            onPress={() => navigation.navigate('AssignmentCreate', { rubricTemplate: rubricId })}
          >
            <Icon name="plus" size={20} color={colors.onPrimary} />
            <AppText style={[styles.actionBtnText, { color: colors.onPrimary }]}>
              {t('screens.rubricDetail.useForAssignment', { defaultValue: 'Use for Assignment' })}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnOutline, { borderColor: colors.outline, borderRadius: borderRadius.medium }]}
            onPress={() => navigation.navigate('RubricCreate', { templateId: rubricId })}
          >
            <Icon name="content-copy" size={20} color={colors.primary} />
            <AppText style={[styles.actionBtnText, { color: colors.primary }]}>
              {t('screens.rubricDetail.duplicate', { defaultValue: 'Duplicate' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flex: 1,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rubricName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  rubricDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  criterionCard: {
    padding: 14,
    marginBottom: 10,
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  criterionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  criterionNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  criterionName: {
    fontSize: 15,
    fontWeight: '600',
  },
  levelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelText: {
    fontSize: 12,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
