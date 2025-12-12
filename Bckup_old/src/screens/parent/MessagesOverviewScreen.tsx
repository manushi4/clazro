/**
 * MessagesOverviewScreen - Modern Communication Hub
 *
 * Consolidates communication features for parents:
 * - School announcements and updates
 * - Teacher messages (placeholder)
 * - Meeting schedules (placeholder)
 * - Quick actions for communication
 *
 * Features:
 * - Real-time announcements from Supabase
 * - Filter by priority (all, high, normal)
 * - Quick navigation to detailed views
 * - Pull-to-refresh support
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<ParentStackParamList, 'TeacherCommunication'>;

type PriorityFilter = 'all' | 'high' | 'normal';

interface Announcement {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_important: boolean;
  published_by: string | null;
  published_at: string;
  expires_at: string | null;
  created_at: string;
}

const MessagesOverviewScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  useEffect(() => {
    trackScreenView('MessagesOverview', { from: 'MessagesTab' });
  }, []);

  // Fetch announcements
  const {
    data: announcements = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      console.log('🔍 [MessagesOverview] Fetching announcements...');
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ [MessagesOverview] Error:', error);
        throw error;
      }

      console.log('✅ [MessagesOverview] Loaded', data?.length || 0, 'announcements');
      return data as Announcement[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = announcements.length;
    const highPriority = announcements.filter(a => a.priority === 'high' || a.priority === 'urgent').length;
    const normalPriority = announcements.filter(a => a.priority === 'medium' || a.priority === 'low').length;

    // Calculate how many are new (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newCount = announcements.filter(a =>
      new Date(a.published_at) > oneDayAgo
    ).length;

    return { total, highPriority, normalPriority, newCount };
  }, [announcements]);

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    if (priorityFilter === 'all') return announcements;
    if (priorityFilter === 'high') {
      return announcements.filter(a => a.priority === 'high' || a.priority === 'urgent');
    }
    // normal filter
    return announcements.filter(a => a.priority === 'medium' || a.priority === 'low');
  }, [announcements, priorityFilter]);

  // Get priority badge variant
  const getPriorityVariant = (priority: string): 'error' | 'warning' | 'info' | 'success' => {
    if (priority === 'urgent') return 'error';
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    return 'info'; // low priority
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load messages' : null}
      empty={!isLoading && announcements.length === 0}
      emptyBody="No announcements available. Check back later for updates from the school."
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Summary Stats Card */}
        <Card variant="elevated">
          <CardContent>
            <T variant="title" weight="bold" style={{ marginBottom: Spacing.sm }}>
              Communication Hub
            </T>
            <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.md }}>
              Stay connected with teachers and school updates
            </T>

            {/* Stats Grid */}
            <Row spaceBetween style={{ marginTop: Spacing.md }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 32, color: Colors.primary }}>
                  {stats.total}
                </T>
                <T variant="caption" color="textSecondary">Announcements</T>
              </View>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 32, color: Colors.error }}>
                  {stats.highPriority}
                </T>
                <T variant="caption" color="textSecondary">High Priority</T>
              </View>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 32, color: Colors.success }}>
                  {stats.newCount}
                </T>
                <T variant="caption" color="textSecondary">New Today</T>
              </View>
            </Row>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="elevated">
          <CardContent>
            <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
              Quick Actions
            </T>
            <Row style={{ gap: Spacing.xs, flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                onPress={() => {
                  trackAction('view_meetings', 'MessagesOverview');
                  safeNavigate(navigation, 'MeetingsHistory', {});
                }}
              >
                📅 Meetings
              </Button>
              <Button
                variant="outline"
                onPress={() => {
                  trackAction('compose_message', 'MessagesOverview');
                  safeNavigate(navigation, 'ComposeMessage', {});
                }}
              >
                ✍️ Compose
              </Button>
              <Button
                variant="outline"
                onPress={() => {
                  trackAction('schedule_meeting', 'MessagesOverview');
                  safeNavigate(navigation, 'ScheduleMeeting', {});
                }}
              >
                📅 Schedule
              </Button>
            </Row>
          </CardContent>
        </Card>

        {/* Priority Filter */}
        <Row style={{ flexWrap: 'wrap', gap: Spacing.xs }}>
          <Button
            variant={priorityFilter === 'all' ? 'primary' : 'outline'}
            onPress={() => {
              setPriorityFilter('all');
              trackAction('filter_priority', 'MessagesOverview', { priority: 'all' });
            }}
          >
            All ({announcements.length})
          </Button>
          <Button
            variant={priorityFilter === 'high' ? 'primary' : 'outline'}
            onPress={() => {
              setPriorityFilter('high');
              trackAction('filter_priority', 'MessagesOverview', { priority: 'high' });
            }}
          >
            High Priority ({stats.highPriority})
          </Button>
          <Button
            variant={priorityFilter === 'normal' ? 'primary' : 'outline'}
            onPress={() => {
              setPriorityFilter('normal');
              trackAction('filter_priority', 'MessagesOverview', { priority: 'normal' });
            }}
          >
            Normal ({stats.normalPriority})
          </Button>
        </Row>

        {/* Announcements List */}
        <Col gap="sm">
          <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
            Latest Announcements
          </T>

          {filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} variant="elevated">
              <CardContent>
                {/* Header Row */}
                <Row spaceBetween centerV style={{ marginBottom: Spacing.sm }}>
                  <Badge
                    variant={getPriorityVariant(announcement.priority)}
                    label={announcement.priority.toUpperCase()}
                  />
                  <T variant="caption" color="textSecondary">
                    {formatDate(announcement.published_at)}
                  </T>
                </Row>

                {/* Title */}
                <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
                  {announcement.title}
                </T>

                {/* Message */}
                <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
                  {announcement.message}
                </T>

                {/* Author & Category */}
                <Row spaceBetween style={{ marginTop: Spacing.xs }}>
                  <T variant="caption" color="textSecondary" style={{ fontStyle: 'italic' }}>
                    {announcement.published_by || 'School Admin'}
                  </T>
                  <T variant="caption" color="textSecondary">
                    {announcement.category}
                  </T>
                </Row>

                {/* Expires */}
                {announcement.expires_at && (
                  <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                    Expires: {new Date(announcement.expires_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </T>
                )}
              </CardContent>
            </Card>
          ))}
        </Col>

        {/* Empty State for Filter */}
        {filteredAnnouncements.length === 0 && announcements.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
                  No {priorityFilter} priority announcements found
                </T>
                <Button
                  variant="outline"
                  onPress={() => setPriorityFilter('all')}
                  style={{ marginTop: Spacing.md }}
                >
                  Show All Announcements
                </Button>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Placeholder Sections for Future Features */}
        <Card variant="outlined" style={{ borderStyle: 'dashed' }}>
          <CardContent>
            <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
              📨 Teacher Messages
            </T>
            <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
              Direct messaging with your child's teachers
            </T>
            <T variant="caption" color="textSecondary" style={{ fontStyle: 'italic' }}>
              Coming soon - Stay tuned for updates!
            </T>
          </CardContent>
        </Card>

        <Card variant="outlined" style={{ borderStyle: 'dashed' }}>
          <CardContent>
            <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
              📅 Scheduled Meetings
            </T>
            <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
              View and manage parent-teacher meetings
            </T>
            <T variant="caption" color="textSecondary" style={{ fontStyle: 'italic' }}>
              Coming soon - Stay tuned for updates!
            </T>
          </CardContent>
        </Card>
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
});

export default MessagesOverviewScreen;
