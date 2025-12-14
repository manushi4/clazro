/**
 * NewAssignmentDetailScreen - EXACT match to HTML reference
 * Purpose: Assignment details with countdown, tabs, requirements, and submission
 * Design: Material Design with sticky header, timer, tabs, and action footer
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'NewAssignmentDetailScreen'>;

type Tab = 'instructions' | 'submission';

interface Requirement {
  id: string;
  text: string;
}

interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'docx';
}

export default function NewAssignmentDetailScreen({ route, navigation }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('instructions');
  const [timeRemaining, setTimeRemaining] = useState({
    days: 2,
    hours: 10,
    minutes: 30,
  });

  const title = route.params?.title || 'Cell Structure Essay';
  const course = route.params?.course || 'Biology 101';
  const teacher = route.params?.teacher || 'Ms. Davison';
  const points = route.params?.points || 100;
  const status = route.params?.status || 'Not Started';

  useEffect(() => {
    trackScreenView('NewAssignmentDetailScreen');
  }, []);

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        let { days, hours, minutes } = prev;

        if (minutes > 0) {
          minutes--;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
        }

        return { days, hours, minutes };
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const requirements: Requirement[] = [
    { id: '1', text: 'Minimum 500 words.' },
    { id: '2', text: 'Include at least 3 credible sources, cited in APA format.' },
    { id: '3', text: 'Submit as a PDF or DOCX file.' },
  ];

  const attachments: Attachment[] = [
    { id: '1', name: 'EssayRubric.pdf', type: 'pdf' },
    { id: '2', name: 'ReadingMaterial.docx', type: 'docx' },
  ];

  const handleTabPress = (tab: Tab) => {
    setActiveTab(tab);
    trackAction('tab_press', 'NewAssignmentDetailScreen', { tab });
  };

  const handleDownload = (attachment: Attachment) => {
    trackAction('download_attachment', 'NewAssignmentDetailScreen', {
      attachmentId: attachment.id,
    });
  };

  const handleSaveDraft = () => {
    trackAction('save_draft', 'NewAssignmentDetailScreen');
  };

  const handleSubmit = () => {
    trackAction('submit_assignment', 'NewAssignmentDetailScreen');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Not Started':
        return '#EA580C';
      case 'In Progress':
        return '#2563EB';
      case 'Submitted':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            trackAction('back_button', 'NewAssignmentDetailScreen');
            navigation.goBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T variant="h2" style={styles.icon}>←</T>
        </TouchableOpacity>

        <T variant="body" weight="bold" style={styles.topBarTitle}>
          {course}: {title}
        </T>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => trackAction('more_options', 'NewAssignmentDetailScreen')}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <T variant="h2" style={styles.icon}>⋮</T>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Assignment Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <T variant="caption" weight="semiBold" style={styles.teacherName}>
              {teacher}
            </T>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor()}20` },
              ]}
            >
              <T
                variant="caption"
                weight="semiBold"
                style={[styles.statusText, { color: getStatusColor() }]}
              >
                {status}
              </T>
            </View>
          </View>

          <T variant="h2" weight="bold" style={styles.assignmentTitle}>
            {title}
          </T>

          <View style={styles.headerBottom}>
            <View>
              <T variant="body" style={styles.course}>
                {course}
              </T>
            </View>
            <T variant="body" weight="bold" style={styles.points}>
              {points} pts
            </T>
          </View>
        </View>

        {/* Timer Section */}
        <View style={styles.timerSection}>
          <T variant="caption" weight="semiBold" style={styles.timerLabel}>
            Due In
          </T>
          <View style={styles.timerGrid}>
            <View style={styles.timerItem}>
              <View style={styles.timerBox}>
                <T variant="h1" weight="bold" style={styles.timerValue}>
                  {String(timeRemaining.days).padStart(2, '0')}
                </T>
              </View>
              <T variant="caption" style={styles.timerUnit}>
                Days
              </T>
            </View>

            <View style={styles.timerItem}>
              <View style={styles.timerBox}>
                <T variant="h1" weight="bold" style={styles.timerValue}>
                  {String(timeRemaining.hours).padStart(2, '0')}
                </T>
              </View>
              <T variant="caption" style={styles.timerUnit}>
                Hours
              </T>
            </View>

            <View style={styles.timerItem}>
              <View style={styles.timerBox}>
                <T variant="h1" weight="bold" style={styles.timerValue}>
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </T>
              </View>
              <T variant="caption" style={styles.timerUnit}>
                Minutes
              </T>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'instructions' && styles.tabActive,
            ]}
            onPress={() => handleTabPress('instructions')}
            accessibilityRole="button"
            accessibilityLabel="Instructions tab"
          >
            <T
              variant="body"
              weight="bold"
              style={[
                styles.tabText,
                activeTab === 'instructions' && styles.tabTextActive,
              ]}
            >
              Instructions
            </T>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'submission' && styles.tabActive,
            ]}
            onPress={() => handleTabPress('submission')}
            accessibilityRole="button"
            accessibilityLabel="My Submission tab"
          >
            <T
              variant="body"
              weight="bold"
              style={[
                styles.tabText,
                activeTab === 'submission' && styles.tabTextActive,
              ]}
            >
              My Submission
            </T>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'instructions' && (
          <View style={styles.instructionsContent}>
            {/* Description */}
            <View style={styles.section}>
              <T variant="title" weight="bold" style={styles.sectionTitle}>
                Description
              </T>
              <T variant="body" style={styles.description}>
                Write a comprehensive essay on the structure and function of
                eukaryotic cells. Your essay should detail the roles of major
                organelles, including the nucleus, mitochondria, endoplasmic
                reticulum, and Golgi apparatus. Compare and contrast plant and
                animal cells, highlighting key differences.
              </T>
            </View>

            {/* Requirements */}
            <View style={styles.section}>
              <T variant="title" weight="bold" style={styles.sectionTitle}>
                Requirements
              </T>
              <View style={styles.requirementsList}>
                {requirements.map((req) => (
                  <View key={req.id} style={styles.requirementItem}>
                    <T style={styles.checkIcon}>✓</T>
                    <T variant="body" style={styles.requirementText}>
                      {req.text}
                    </T>
                  </View>
                ))}
              </View>
            </View>

            {/* Attachments */}
            <View style={styles.section}>
              <T variant="title" weight="bold" style={styles.sectionTitle}>
                Attachments
              </T>
              <View style={styles.attachmentsList}>
                {attachments.map((attachment) => (
                  <TouchableOpacity
                    key={attachment.id}
                    style={styles.attachmentCard}
                    onPress={() => handleDownload(attachment)}
                    accessibilityRole="button"
                    accessibilityLabel={`Download ${attachment.name}`}
                  >
                    <View style={styles.attachmentLeft}>
                      <T
                        style={[
                          styles.fileIcon,
                          attachment.type === 'pdf'
                            ? styles.pdfIcon
                            : styles.docxIcon,
                        ]}
                      >
                        {attachment.type === 'pdf' ? '📄' : '📝'}
                      </T>
                      <T variant="body" weight="semiBold" style={styles.fileName}>
                        {attachment.name}
                      </T>
                    </View>
                    <T style={styles.downloadIcon}>⬇</T>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'submission' && (
          <View style={styles.submissionContent}>
            <View style={styles.emptyState}>
              <T variant="h2" style={styles.emptyIcon}>
                📝
              </T>
              <T variant="body" style={styles.emptyText}>
                No submission yet
              </T>
              <T variant="caption" style={styles.emptySubtext}>
                Tap Submit below to start your assignment
              </T>
            </View>
          </View>
        )}

        {/* Spacer for sticky footer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Sticky Action Footer */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.saveDraftButton}
          onPress={handleSaveDraft}
          accessibilityRole="button"
          accessibilityLabel="Save draft"
        >
          <T variant="body" weight="bold" style={styles.saveDraftText}>
            Save Draft
          </T>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit assignment"
        >
          <T variant="body" weight="bold" style={styles.submitText}>
            Submit
          </T>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Top App Bar
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  icon: {
    fontSize: 24,
    color: '#333333',
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#111827',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  scrollContent: {
    paddingBottom: 100, // Space for sticky footer
  },
  // Header Card
  headerCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,

    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teacherName: {
    color: '#4A90E2',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 13,
  },
  assignmentTitle: {
    color: '#111827',
    fontSize: 24,
    lineHeight: 30,
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  course: {
    color: '#6B7280',
    fontSize: 15,
  },
  points: {
    color: '#111827',
    fontSize: 15,
  },
  // Timer Section
  timerSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  timerLabel: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 8,
  },
  timerGrid: {
    flexDirection: 'row',

  },
  timerItem: {
    flex: 1,
    alignItems: 'center',

  },
  timerBox: {
    width: '100%',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  timerValue: {
    color: '#111827',
    fontSize: 32,
  },
  timerUnit: {
    color: '#6B7280',
    fontSize: 12,
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    color: '#6B7280',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#4A90E2',
  },
  // Instructions Content
  instructionsContent: {
    paddingHorizontal: 16,

  },
  section: {

  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
  },
  description: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 24,
  },
  // Requirements
  requirementsList: {

  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',

  },
  checkIcon: {
    fontSize: 20,
    color: '#4A90E2',
    marginTop: 2,
  },
  requirementText: {
    flex: 1,
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
  },
  // Attachments
  attachmentsList: {

  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',

    flex: 1,
  },
  fileIcon: {
    fontSize: 24,
  },
  pdfIcon: {
    color: '#EF4444',
  },
  docxIcon: {
    color: '#3B82F6',
  },
  fileName: {
    color: '#111827',
    fontSize: 15,
    flex: 1,
  },
  downloadIcon: {
    fontSize: 20,
    color: '#6B7280',
  },
  // Submission Content
  submissionContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,

  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  // Sticky Footer
  footerSpacer: {
    height: 80,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',

    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  saveDraftButton: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftText: {
    color: '#4A90E2',
    fontSize: 15,
  },
  submitButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});
