/**
 * ShareProgressReportScreen - Shareable progress snapshot
 * Purpose: Create and share progress reports with customizable options
 * Design: Framer design system with report preview and sharing options
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Card, T, Button, Chip } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'ShareProgressReportScreen'>;

type ReportTimeRange = '7d' | '30d' | 'term';
type ReportDetailLevel = 'summary' | 'detailed';

interface ShareReportState {
  timeRange: ReportTimeRange;
  detailLevel: ReportDetailLevel;
  includeTests: boolean;
  includeAssignments: boolean;
  includeAI: boolean;
}

interface ReportPreviewData {
  studentName: string;
  classLabel: string;
  overallMasteryPercent: number;
  topSubjectName: string;
  streakDays: number;
  xp: number;
}

// Framer Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  previewBg: '#F9FAFB',
  success: '#22C55E',
};

// Mock Data
const MOCK_REPORT_PREVIEW: ReportPreviewData = {
  studentName: 'Alex Sharma',
  classLabel: 'Class 10 A',
  overallMasteryPercent: 76,
  topSubjectName: 'Mathematics',
  streakDays: 4,
  xp: 1240,
};

export default function ShareProgressReportScreen({ navigation }: Props) {
  const [options, setOptions] = useState<ShareReportState>({
    timeRange: '7d',
    detailLevel: 'summary',
    includeTests: true,
    includeAssignments: true,
    includeAI: false,
  });

  const [preview, setPreview] = useState<ReportPreviewData>(MOCK_REPORT_PREVIEW);

  useEffect(() => {
    trackScreenView('ShareProgressReportScreen');
  }, []);

  const handleTimeRangeChange = useCallback((timeRange: ReportTimeRange) => {
    setOptions((prev) => ({ ...prev, timeRange }));
  }, []);

  const handleDetailLevelChange = useCallback((detailLevel: ReportDetailLevel) => {
    setOptions((prev) => ({ ...prev, detailLevel }));
  }, []);

  const toggleInclude = useCallback((field: 'includeTests' | 'includeAssignments' | 'includeAI') => {
    setOptions((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleRefreshPreview = useCallback(() => {
    trackAction('share_report_refresh', 'ShareProgressReportScreen', options);
    // TODO: Fetch updated preview from Supabase based on options
    // For now, keep same mock preview
    Alert.alert('Preview Updated', 'Report preview refreshed with current options.');
  }, [options]);

  const handleShare = useCallback(
    (type: 'image' | 'pdf') => {
      trackAction('share_report_share', 'ShareProgressReportScreen', { type, options });
      // TODO: Generate actual image/PDF and share
      Alert.alert(
        'Share Report',
        `Sharing as ${type === 'image' ? 'Image' : 'PDF'}...\n\nThis feature will generate a shareable ${type} file.`,
        [{ text: 'OK' }]
      );
    },
    [options]
  );

  const getTimeRangeLabel = (range: ReportTimeRange) => {
    if (range === '7d') return 'Last 7 days';
    if (range === '30d') return 'Last 30 days';
    return 'This term';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={24} color={FRAMER_COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <T variant="title" weight="bold" style={styles.headerTitle}>
            Share progress report
          </T>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <T variant="body" color="textSecondary" style={styles.subtitle}>
          Create a shareable snapshot of your progress
        </T>

        {/* Preview Card */}
        <Card style={styles.previewCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Preview
          </T>

          <View style={styles.previewContent}>
            <View style={styles.previewRow}>
              <T variant="body" weight="semiBold" style={styles.previewLabel}>
                Student:
              </T>
              <T variant="body" style={styles.previewValue}>
                {preview.studentName}
              </T>
            </View>

            <View style={styles.previewRow}>
              <T variant="body" weight="semiBold" style={styles.previewLabel}>
                Class:
              </T>
              <T variant="body" style={styles.previewValue}>
                {preview.classLabel}
              </T>
            </View>

            <View style={styles.previewRow}>
              <T variant="body" weight="semiBold" style={styles.previewLabel}>
                Overall mastery:
              </T>
              <T variant="title" weight="bold" style={[styles.previewValue, { color: FRAMER_COLORS.success }]}>
                {preview.overallMasteryPercent}%
              </T>
            </View>

            <View style={styles.previewRow}>
              <T variant="body" weight="semiBold" style={styles.previewLabel}>
                Top subject:
              </T>
              <T variant="body" style={styles.previewValue}>
                {preview.topSubjectName}
              </T>
            </View>

            <View style={styles.previewRow}>
              <T variant="body" weight="semiBold" style={styles.previewLabel}>
                Streak:
              </T>
              <T variant="body" style={styles.previewValue}>
                {preview.streakDays} days
              </T>
            </View>

            <View style={styles.previewRow}>
              <T variant="body" weight="semiBold" style={styles.previewLabel}>
                XP:
              </T>
              <T variant="body" style={styles.previewValue}>
                {preview.xp}
              </T>
            </View>
          </View>
        </Card>

        {/* Options Card */}
        <Card style={styles.optionsCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Report options
          </T>

          {/* Time Range */}
          <View style={styles.optionSection}>
            <T variant="body" weight="semiBold" style={styles.optionLabel}>
              Time range
            </T>
            <View style={styles.chipRow}>
              <Chip
                label="Last 7 days"
                variant="filter"
                selected={options.timeRange === '7d'}
                onPress={() => handleTimeRangeChange('7d')}
              />
              <Chip
                label="Last 30 days"
                variant="filter"
                selected={options.timeRange === '30d'}
                onPress={() => handleTimeRangeChange('30d')}
              />
              <Chip
                label="This term"
                variant="filter"
                selected={options.timeRange === 'term'}
                onPress={() => handleTimeRangeChange('term')}
              />
            </View>
          </View>

          {/* Detail Level */}
          <View style={styles.optionSection}>
            <T variant="body" weight="semiBold" style={styles.optionLabel}>
              Detail level
            </T>
            <View style={styles.chipRow}>
              <Chip
                label="Summary"
                variant="filter"
                selected={options.detailLevel === 'summary'}
                onPress={() => handleDetailLevelChange('summary')}
              />
              <Chip
                label="Detailed"
                variant="filter"
                selected={options.detailLevel === 'detailed'}
                onPress={() => handleDetailLevelChange('detailed')}
              />
            </View>
          </View>

          {/* Include Options */}
          <View style={styles.optionSection}>
            <T variant="body" weight="semiBold" style={styles.optionLabel}>
              Include
            </T>
            <View style={styles.checkboxList}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => toggleInclude('includeTests')}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: options.includeTests }}
              >
                <Icon
                  name={options.includeTests ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={options.includeTests ? FRAMER_COLORS.primary : FRAMER_COLORS.textSecondary}
                />
                <T variant="body" style={styles.checkboxLabel}>
                  Tests
                </T>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => toggleInclude('includeAssignments')}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: options.includeAssignments }}
              >
                <Icon
                  name={options.includeAssignments ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={options.includeAssignments ? FRAMER_COLORS.primary : FRAMER_COLORS.textSecondary}
                />
                <T variant="body" style={styles.checkboxLabel}>
                  Assignments
                </T>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => toggleInclude('includeAI')}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: options.includeAI }}
              >
                <Icon
                  name={options.includeAI ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={options.includeAI ? FRAMER_COLORS.primary : FRAMER_COLORS.textSecondary}
                />
                <T variant="body" style={styles.checkboxLabel}>
                  AI sessions
                </T>
              </TouchableOpacity>
            </View>
          </View>

          <Button variant="outline" onPress={handleRefreshPreview} style={styles.refreshButton}>
            Refresh preview
          </Button>
        </Card>

        {/* Share Card */}
        <Card style={styles.shareCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Share
          </T>

          <View style={styles.shareButtons}>
            <Button
              variant="primary"
              onPress={() => handleShare('image')}
              style={styles.shareButton}
            >
              📸 Share image
            </Button>
            <Button
              variant="secondary"
              onPress={() => handleShare('pdf')}
              style={styles.shareButton}
            >
              📄 Share PDF
            </Button>
          </View>

          <T variant="caption" color="textSecondary" style={styles.privacyNote}>
            🔒 We never post without your permission.
          </T>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  previewCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 16,
  },
  previewContent: {
    padding: 16,
    backgroundColor: FRAMER_COLORS.previewBg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: FRAMER_COLORS.primary,
    borderStyle: 'dashed',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
  },
  previewValue: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
  },
  optionsCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  optionSection: {
    marginBottom: 20,
  },
  optionLabel: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxList: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
  },
  refreshButton: {
    marginTop: 8,
  },
  shareCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  shareButtons: {
    gap: 12,
    marginBottom: 16,
  },
  shareButton: {
    width: '100%',
  },
  privacyNote: {
    fontSize: 12,
    textAlign: 'center',
  },
});
