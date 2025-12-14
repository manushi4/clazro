/**
 * StudyGroupDetailScreen - Details for one peer study group
 * Purpose: Show group info, upcoming sessions, shared resources, and group actions
 * Design: Framer design system with comprehensive group details
 */

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Card, T, Button } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<any, 'StudyGroupDetailScreen'>;

type RouteParams = {
  groupId: string;
};

// Data Types
interface GroupMember {
  id: string;
  name: string;
  avatarEmoji: string;
  role: 'student' | 'teacher';
}

interface GroupSession {
  id: string;
  title: string;
  dateLabel: string;
  timeRangeLabel: string;
  topic: string;
  hostName: string;
}

type ResourceType = 'pdf' | 'link' | 'notes';

interface GroupResource {
  id: string;
  title: string;
  type: ResourceType;
  description?: string;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subjectName: string;
  subjectCode: string;
  members: GroupMember[];
  upcomingSessions: GroupSession[];
  resources: GroupResource[];
}

// Framer Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  subjectPill: '#EBF4FF',
  avatarBg: '#F3F4F6',
};

// Mock Data
const MOCK_STUDY_GROUPS: Record<string, StudyGroup> = {
  group_algebra_champs: {
    id: 'group_algebra_champs',
    name: 'Algebra Champions',
    description: 'Evening group to practice Algebra and share doubts.',
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    members: [
      { id: 'm1', name: 'You', avatarEmoji: '🧑‍🎓', role: 'student' },
      { id: 'm2', name: 'Riya', avatarEmoji: '👩‍🎓', role: 'student' },
      { id: 'm3', name: 'Arjun', avatarEmoji: '👨‍🎓', role: 'student' },
      { id: 'm4', name: 'Teacher A', avatarEmoji: '👩‍🏫', role: 'teacher' },
    ],
    upcomingSessions: [
      {
        id: 's1',
        title: 'Evening sprint - Linear equations',
        dateLabel: 'Today',
        timeRangeLabel: '7:00–7:45 PM',
        topic: 'Linear equations revision & Q/A',
        hostName: 'Teacher A',
      },
    ],
    resources: [
      {
        id: 'r1',
        title: 'Algebra formula sheet',
        type: 'pdf',
        description: 'Summary of key formulas for Algebra.',
      },
      {
        id: 'r2',
        title: 'Top 20 practice questions',
        type: 'pdf',
        description: 'Mixed-level Algebra problems.',
      },
    ],
  },
};

// Hook
function useStudyGroupMock(groupId: string) {
  // TODO: Fetch from Supabase
  const group = MOCK_STUDY_GROUPS[groupId] ?? MOCK_STUDY_GROUPS['group_algebra_champs'];
  return { group };
}

export default function StudyGroupDetailScreen({ route, navigation }: Props) {
  const params = route.params as RouteParams;
  const groupId = params?.groupId || 'group_algebra_champs';

  const { group } = useStudyGroupMock(groupId);

  useEffect(() => {
    trackScreenView('StudyGroupDetailScreen', { groupId });
  }, [groupId]);

  const handleSessionDetails = useCallback((session: GroupSession) => {
    trackAction('view_session_details', 'StudyGroupDetailScreen', {
      groupId,
      sessionId: session.id,
    });
    Alert.alert(
      session.title,
      `Topic: ${session.topic}\nHost: ${session.hostName}\nTime: ${session.dateLabel} ${session.timeRangeLabel}`,
      [{ text: 'OK' }]
    );
  }, [groupId]);

  const handleOpenResource = useCallback((resource: GroupResource) => {
    trackAction('open_group_resource', 'StudyGroupDetailScreen', {
      groupId,
      resourceId: resource.id,
      type: resource.type,
    });
    Alert.alert(
      resource.title,
      `Opening ${resource.type.toUpperCase()} resource...\n\n${resource.description || 'No description'}`,
      [{ text: 'OK' }]
    );
  }, [groupId]);

  const handleOpenChat = useCallback(() => {
    trackAction('open_group_chat', 'StudyGroupDetailScreen', { groupId });
    // @ts-expect-error - Student routes not yet in ParentStackParamList
    safeNavigate('PeerChatScreen', {
      chatId: group.id,
      groupId: group.id,
      groupName: group.name,
    });
  }, [groupId, group.id, group.name]);

  const handleStartSession = useCallback(() => {
    trackAction('start_study_session_from_group', 'StudyGroupDetailScreen', { groupId });
    // @ts-expect-error - Student routes not yet in ParentStackParamList
    safeNavigate('GuidedStudySessionScreen', {
      subject: group.subjectName,
      topic: 'Group study',
      groupId: group.id,
    });
  }, [groupId, group.subjectName, group.id]);

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'pdf':
        return 'picture-as-pdf';
      case 'link':
        return 'link';
      case 'notes':
        return 'note';
      default:
        return 'insert-drive-file';
    }
  };

  const visibleMembers = group.members.slice(0, 4);
  const remainingCount = group.members.length - visibleMembers.length;

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
            Study group
          </T>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Header Card */}
        <Card style={styles.headerCard}>
          <T variant="title" weight="bold" style={styles.groupName}>
            {group.name}
          </T>
          <T variant="body" color="textSecondary" style={styles.groupDescription}>
            {group.description}
          </T>

          <View style={styles.subjectPill}>
            <Icon name="book" size={16} color={FRAMER_COLORS.primary} />
            <T variant="caption" style={styles.subjectText}>
              Subject: {group.subjectName}
            </T>
          </View>

          <View style={styles.membersSection}>
            <T variant="caption" color="textSecondary" style={styles.membersLabel}>
              Members
            </T>
            <View style={styles.membersRow}>
              {visibleMembers.map((member) => (
                <View key={member.id} style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <T style={styles.avatarEmoji}>{member.avatarEmoji}</T>
                  </View>
                </View>
              ))}
              {remainingCount > 0 && (
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatar, styles.avatarMore]}>
                    <T style={styles.avatarMoreText}>+{remainingCount}</T>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Upcoming Sessions Card */}
        <Card style={styles.sessionsCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Upcoming sessions
          </T>

          {group.upcomingSessions.length === 0 ? (
            <T variant="body" color="textSecondary" style={styles.emptyText}>
              No sessions scheduled yet.
            </T>
          ) : (
            group.upcomingSessions.map((session) => (
              <View key={session.id} style={styles.sessionItem}>
                <View style={styles.sessionInfo}>
                  <T variant="caption" color="textSecondary" style={styles.sessionTime}>
                    {session.dateLabel} • {session.timeRangeLabel}
                  </T>
                  <T variant="body" weight="semiBold" style={styles.sessionTitle}>
                    {session.title}
                  </T>
                  <T variant="caption" color="textSecondary">
                    Host: {session.hostName}
                  </T>
                </View>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => handleSessionDetails(session)}
                  accessibilityRole="button"
                  accessibilityLabel="View session details"
                >
                  <T variant="caption" style={styles.detailsButtonText}>
                    Details
                  </T>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        {/* Shared Resources Card */}
        <Card style={styles.resourcesCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Shared resources
          </T>

          {group.resources.length === 0 ? (
            <T variant="body" color="textSecondary" style={styles.emptyText}>
              No resources shared yet.
            </T>
          ) : (
            group.resources.map((resource) => (
              <TouchableOpacity
                key={resource.id}
                style={styles.resourceItem}
                onPress={() => handleOpenResource(resource)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${resource.title}`}
              >
                <View style={styles.resourceIcon}>
                  <Icon name={getResourceIcon(resource.type)} size={24} color={FRAMER_COLORS.primary} />
                </View>
                <View style={styles.resourceInfo}>
                  <T variant="body" weight="semiBold" style={styles.resourceTitle}>
                    {resource.title}
                  </T>
                  {resource.description && (
                    <T variant="caption" color="textSecondary" numberOfLines={1}>
                      {resource.description}
                    </T>
                  )}
                </View>
                <Icon name="chevron-right" size={20} color={FRAMER_COLORS.textSecondary} />
              </TouchableOpacity>
            ))
          )}
        </Card>

        {/* Actions Card */}
        <Card style={styles.actionsCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Actions
          </T>

          <Button variant="primary" onPress={handleOpenChat} style={styles.actionButton}>
            💬 Open group chat
          </Button>
          <Button variant="secondary" onPress={handleStartSession} style={styles.actionButton}>
            📚 Start study session
          </Button>
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
  headerCard: {
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
  groupName: {
    fontSize: 24,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: FRAMER_COLORS.subjectPill,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  subjectText: {
    fontSize: 12,
    color: FRAMER_COLORS.primary,
    fontWeight: '600',
  },
  membersSection: {
    marginTop: 8,
  },
  membersLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  membersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: FRAMER_COLORS.cardBg,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  avatarMore: {
    backgroundColor: FRAMER_COLORS.primary,
  },
  avatarMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionsCard: {
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
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTime: {
    fontSize: 12,
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: FRAMER_COLORS.subjectPill,
    borderRadius: 8,
    marginLeft: 8,
  },
  detailsButtonText: {
    fontSize: 12,
    color: FRAMER_COLORS.primary,
    fontWeight: '600',
  },
  resourcesCard: {
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
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: FRAMER_COLORS.subjectPill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 2,
  },
  actionsCard: {
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
  actionButton: {
    marginBottom: 12,
  },
});
