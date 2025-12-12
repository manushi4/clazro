/**
 * NewCollaborativeAssignment - Premium Minimal Design
 * Purpose: Group assignment collaboration workspace
 * Used in: StudentNavigator (AssignmentsStack)
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card } from '../../ui';
import { Badge } from '../../ui';
import { Button } from '../../ui';
import { Chip } from '../../ui';
import { Row } from '../../ui';
import { T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { getAvatarEmoji } from '../../utils/avatarUtils';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'NewCollaborativeAssignment'>;

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  is_current_user: boolean;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  due_date: string;
}

interface ActiveEditor {
  id: string;
  name: string;
  avatar: string;
  section: string;
  cursorPosition: { x: number; y: number };
}

interface Version {
  id: string;
  version: number;
  timestamp: string;
  author: string;
  changes: string;
}

interface Contribution {
  memberId: string;
  memberName: string;
  avatar: string;
  linesAdded: number;
  editsCount: number;
  percentage: number;
}

export default function NewCollaborativeAssignment({ route, navigation }: Props) {
  const { user } = useAuth();
  const assignmentId = route.params?.assignmentId;

  // State for new features
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showContributions, setShowContributions] = useState(false);

  const [activeEditors, setActiveEditors] = useState<ActiveEditor[]>([
    { id: '1', name: 'Sarah J.', avatar: '👩‍🎓', section: 'Introduction', cursorPosition: { x: 120, y: 80 } },
    { id: '2', name: 'Mike C.', avatar: '👨‍🎓', section: 'Analysis', cursorPosition: { x: 200, y: 150 } },
  ]);

  const [versionHistory, setVersionHistory] = useState<Version[]>([
    { id: '1', version: 5, timestamp: '10 min ago', author: 'Sarah J.', changes: 'Updated introduction section' },
    { id: '2', version: 4, timestamp: '1 hour ago', author: 'Mike C.', changes: 'Added data analysis' },
    { id: '3', version: 3, timestamp: '3 hours ago', author: 'You', changes: 'Fixed methodology' },
    { id: '4', version: 2, timestamp: '1 day ago', author: 'Emma D.', changes: 'Initial draft' },
  ]);

  const [contributions, setContributions] = useState<Contribution[]>([
    { memberId: '1', memberName: 'Sarah J.', avatar: '👩‍🎓', linesAdded: 180, editsCount: 45, percentage: 35 },
    { memberId: '2', memberName: 'You', avatar: '👤', linesAdded: 150, editsCount: 38, percentage: 30 },
    { memberId: '3', memberName: 'Mike C.', avatar: '👨‍🎓', linesAdded: 120, editsCount: 30, percentage: 25 },
    { memberId: '4', memberName: 'Emma D.', avatar: '👧', linesAdded: 50, editsCount: 12, percentage: 10 },
  ]);

  React.useEffect(() => {
    trackScreenView('NewCollaborativeAssignment', { assignmentId });
  }, [assignmentId]);

  // Handlers for new features
  const handleRestoreVersion = (versionId: string, version: number) => {
    trackAction('restore_version', 'NewCollaborativeAssignment', { versionId, version });
    Alert.alert('Restore Version', `Restoring to version ${version}...`);
  };

  // Fetch assignment details
  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['assignment-detail', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error('No assignment ID');

      const { data, error } = await supabase
        .from('assignments')
        .select('id, title, subject, due_date')
        .eq('id', assignmentId)
        .single();

      if (error) throw error;
      return data as Assignment;
    },
    enabled: !!assignmentId,
  });

  // Fetch team members
  const { data: teamMembers, isLoading: teamLoading } = useQuery({
    queryKey: ['team-members', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error('No assignment ID');

      const { data, error } = await supabase
        .from('assignment_team_members')
        .select('*, students(id, name, email)')
        .eq('assignment_id', assignmentId)
        .order('role', { ascending: false });

      if (error) throw error;

      return (data || []).map(member => ({
        id: member.id,
        name: (member.students as any)?.name || 'Unknown',
        role: member.role || 'Member',
        avatar: getAvatarEmoji(member.student_id || member.id),
        is_current_user: member.student_id === user?.id,
      })) as TeamMember[];
    },
    enabled: !!assignmentId,
  });

  // Fetch assignment tasks/progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['assignment-progress', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error('No assignment ID');

      const { data, error } = await supabase
        .from('assignment_tasks')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!assignmentId,
  });

  const getDaysRemaining = () => {
    if (!assignment?.due_date) return 0;
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'pending':
        return '⏳';
      default:
        return '⏳';
    }
  };

  const isLoading = assignmentLoading || teamLoading || progressLoading;
  const daysRemaining = getDaysRemaining();

  return (
    <BaseScreen
      scrollable={false}
      loading={isLoading}
      error={!assignmentId ? 'No assignment ID provided' : null}
      empty={!assignment}
      emptyMessage="Assignment not found"
    >
      {assignment && (
        <ScrollView style={styles.container}>
          <Card style={styles.headerCard}>
            <T variant="h2" weight="bold">
              {assignment.title}
            </T>
            <T variant="caption" style={styles.subject}>
              {assignment.subject} • Due in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </T>
          </Card>

          <Card style={styles.teamCard}>
            <T variant="title" weight="semiBold" style={styles.sectionTitle}>
              Team Members ({teamMembers?.length || 0})
            </T>
            {teamMembers && teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    <T variant="body">{member.avatar}</T>
                  </View>
                  <View style={styles.memberInfo}>
                    <T variant="body" weight="semiBold">
                      {member.name} {member.is_current_user && '(You)'}
                    </T>
                    <T variant="caption" style={styles.memberRole}>
                      {member.role}
                    </T>
                  </View>
                </View>
              ))
            ) : (
              <T variant="body" style={styles.emptyText}>
                No team members found
              </T>
            )}
          </Card>

          {/* 1. Real-time Collaboration & 4. Live Cursors */}
          {activeEditors.length > 0 && (
            <Card style={styles.activeEditorsCard}>
              <View style={styles.cardHeader}>
                <T variant="title" weight="semiBold">
                  🟢 Active Now ({activeEditors.length})
                </T>
              </View>
              {activeEditors.map((editor) => (
                <View key={editor.id} style={styles.editorItem}>
                  <T variant="body">{editor.avatar}</T>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <T variant="body" weight="semiBold">{editor.name}</T>
                    <T variant="caption" style={{ color: '#6B7280' }}>
                      Editing: {editor.section}
                    </T>
                  </View>
                  <View style={styles.liveCursor}>
                    <T variant="caption" style={{ color: '#10B981' }}>✎</T>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* 2. Version History */}
          <Card style={styles.versionCard}>
            <View style={styles.cardHeader}>
              <T variant="title" weight="semiBold">
                📜 Version History
              </T>
              <Button
                variant="ghost"
                onPress={() => setShowVersionHistory(!showVersionHistory)}
              >
                {showVersionHistory ? 'Hide' : 'Show'}
              </Button>
            </View>
            {showVersionHistory && (
              <View style={styles.versionsContainer}>
                {versionHistory.map((version) => (
                  <View key={version.id} style={styles.versionItem}>
                    <View style={{ flex: 1 }}>
                      <Row gap="xs" style={{ marginBottom: 4 }}>
                        <Badge variant="info" label={`v${version.version}`} />
                        <T variant="caption" style={{ color: '#6B7280' }}>
                          {version.timestamp}
                        </T>
                      </Row>
                      <T variant="body">{version.changes}</T>
                      <T variant="caption" style={{ color: '#9CA3AF', marginTop: 4 }}>
                        by {version.author}
                      </T>
                    </View>
                    <Button
                      variant="outline"
                      onPress={() => handleRestoreVersion(version.id, version.version)}
                    >
                      Restore
                    </Button>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* 3. Member Contributions Tracking */}
          <Card style={styles.contributionsCard}>
            <View style={styles.cardHeader}>
              <T variant="title" weight="semiBold">
                📊 Contributions
              </T>
              <Button
                variant="ghost"
                onPress={() => setShowContributions(!showContributions)}
              >
                {showContributions ? 'Hide' : 'Show'}
              </Button>
            </View>
            {showContributions && (
              <View style={styles.contributionsContainer}>
                {contributions.map((contribution) => (
                  <View key={contribution.memberId} style={styles.contributionItem}>
                    <T variant="h3">{contribution.avatar}</T>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <T variant="body" weight="semiBold">{contribution.memberName}</T>
                      <T variant="caption" style={{ color: '#6B7280' }}>
                        {contribution.linesAdded} lines • {contribution.editsCount} edits
                      </T>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${contribution.percentage}%` }]} />
                      </View>
                    </View>
                    <T variant="body" weight="bold" style={{ color: '#3B82F6' }}>
                      {contribution.percentage}%
                    </T>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card style={styles.progressCard}>
            <T variant="title" weight="semiBold" style={styles.sectionTitle}>
              Progress
            </T>
            {progress && progress.length > 0 ? (
              progress.map((task: any) => (
                <T key={task.id} variant="body">
                  {task.name}: {getStatusIcon(task.status)} {task.status.replace('_', ' ')}
                </T>
              ))
            ) : (
              <>
                <T variant="body">Research: ⏳ Pending</T>
                <T variant="body">Draft: ⏳ Pending</T>
                <T variant="body">Review: ⏳ Pending</T>
              </>
            )}
          </Card>
        </ScrollView>
      )}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerCard: {
    padding: 16,
    marginBottom: 16,

  },
  subject: {
    color: '#6B7280',
  },
  teamCard: {
    padding: 16,
    marginBottom: 16,

  },
  sectionTitle: {
    marginBottom: 4,
  },
  memberItem: {
    flexDirection: 'row',

    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,

  },
  memberRole: {
    color: '#6B7280',
  },
  progressCard: {
    padding: 16,
    marginBottom: 32,

  },
  emptyText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  activeEditorsCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  liveCursor: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionCard: {
    padding: 16,
    marginBottom: 16,
  },
  versionsContainer: {

    marginTop: 8,
  },
  versionItem: {
    flexDirection: 'row',

    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  contributionsCard: {
    padding: 16,
    marginBottom: 16,
  },
  contributionsContainer: {

    marginTop: 8,
  },
  contributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
});
