/**
 * MeetingsHistoryScreen - Hybrid Implementation
 *
 * Meeting history and management interface for parent-teacher meetings
 *
 * Features:
 * - Upcoming and past meetings view
 * - Meeting status badges (scheduled, completed, cancelled)
 * - Filter by meeting type and status
 * - Quick actions (join call, reschedule, view details)
 * - Meeting details preview
 * - Empty states for no meetings
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Button, Badge } from '../../ui';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<ParentStackParamList, 'MeetingsHistory'>;

type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';
type MeetingType = 'in-person' | 'video-call' | 'phone-call';
type FilterTab = 'upcoming' | 'past' | 'all';

interface Meeting {
  id: string;
  teacherName: string;
  teacherSubject: string;
  date: string; // ISO date string
  time: string;
  duration: number; // minutes
  type: MeetingType;
  status: MeetingStatus;
  agenda: string;
  notes?: string;
  videoLink?: string;
}

// Sample meetings data (in real implementation, fetch from DB)
const SAMPLE_MEETINGS: Meeting[] = [
  {
    id: '1',
    teacherName: 'Mrs. Priya Kumar',
    teacherSubject: 'Mathematics',
    date: '2025-11-01',
    time: '14:00',
    duration: 30,
    type: 'video-call',
    status: 'scheduled',
    agenda: 'Discuss recent test performance and upcoming project',
    videoLink: 'https://meet.example.com/abc123',
  },
  {
    id: '2',
    teacherName: 'Mr. Raj Singh',
    teacherSubject: 'Science',
    date: '2025-11-05',
    time: '10:30',
    duration: 45,
    type: 'in-person',
    status: 'scheduled',
    agenda: 'Science fair project planning',
  },
  {
    id: '3',
    teacherName: 'Ms. Anita Desai',
    teacherSubject: 'English',
    date: '2025-10-20',
    time: '15:00',
    duration: 30,
    type: 'phone-call',
    status: 'completed',
    agenda: 'Review reading progress',
    notes: 'Student showing great improvement in comprehension skills',
  },
  {
    id: '4',
    teacherName: 'Mr. Kumar Patel',
    teacherSubject: 'History',
    date: '2025-10-15',
    time: '11:00',
    duration: 30,
    type: 'video-call',
    status: 'completed',
    agenda: 'Discuss homework completion',
    notes: 'Need to improve consistency with assignments',
  },
  {
    id: '5',
    teacherName: 'Mrs. Priya Kumar',
    teacherSubject: 'Mathematics',
    date: '2025-10-10',
    time: '16:00',
    duration: 30,
    type: 'in-person',
    status: 'cancelled',
    agenda: 'Mid-term review',
  },
];

const MeetingsHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [filterTab, setFilterTab] = useState<FilterTab>('upcoming');
  const [selectedType, setSelectedType] = useState<MeetingType | 'all'>('all');

  useEffect(() => {
    trackScreenView('MeetingsHistory', { from: 'MessagesTab' });
  }, []);

  // Filter meetings by tab
  const filteredByTab = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (filterTab === 'upcoming') {
      return SAMPLE_MEETINGS.filter(m => m.date >= today && m.status === 'scheduled');
    }
    if (filterTab === 'past') {
      return SAMPLE_MEETINGS.filter(m => m.date < today || m.status !== 'scheduled');
    }
    return SAMPLE_MEETINGS; // all
  }, [filterTab]);

  // Filter by meeting type
  const filteredMeetings = useMemo(() => {
    if (selectedType === 'all') return filteredByTab;
    return filteredByTab.filter(m => m.type === selectedType);
  }, [filteredByTab, selectedType]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const upcoming = SAMPLE_MEETINGS.filter(m => m.date >= today && m.status === 'scheduled').length;
    const completed = SAMPLE_MEETINGS.filter(m => m.status === 'completed').length;
    const cancelled = SAMPLE_MEETINGS.filter(m => m.status === 'cancelled').length;
    return { upcoming, completed, cancelled };
  }, []);

  // Meeting type icon
  const getMeetingTypeIcon = (type: MeetingType) => {
    if (type === 'video-call') return '📹';
    if (type === 'phone-call') return '📞';
    return '🏫';
  };

  // Status badge variant
  const getStatusVariant = (status: MeetingStatus): 'info' | 'success' | 'error' => {
    if (status === 'completed') return 'success';
    if (status === 'cancelled') return 'error';
    return 'info'; // scheduled
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dateOnly = dateString.split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateOnly === todayStr) return 'Today';
    if (dateOnly === tomorrowStr) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Check if meeting is joinable (video call within 15 minutes)
  const isJoinable = (meeting: Meeting) => {
    if (meeting.type !== 'video-call' || meeting.status !== 'scheduled') return false;
    const now = new Date();
    const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
    const diffMinutes = (meetingDateTime.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes <= 15 && diffMinutes >= -meeting.duration;
  };

  // Handle join meeting
  const handleJoinMeeting = (meeting: Meeting) => {
    if (!meeting.videoLink) {
      Alert.alert('No Video Link', 'Video conference link not available');
      return;
    }
    trackAction('join_meeting', 'MeetingsHistory', { meetingId: meeting.id });
    Alert.alert(
      'Join Meeting',
      `Opening video call with ${meeting.teacherName}\n\n(Integration coming soon)`,
    );
  };

  // Handle reschedule
  const handleReschedule = (meeting: Meeting) => {
    trackAction('reschedule_meeting', 'MeetingsHistory', { meetingId: meeting.id });
    Alert.alert(
      'Reschedule Meeting',
      `Reschedule with ${meeting.teacherName}?\n\n(Database integration coming soon)`
    );
  };

  // Handle cancel
  const handleCancel = (meeting: Meeting) => {
    trackAction('cancel_meeting', 'MeetingsHistory', { meetingId: meeting.id });
    Alert.alert(
      'Cancel Meeting',
      `Are you sure you want to cancel this meeting with ${meeting.teacherName}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => {
          Alert.alert('Meeting Cancelled', '(Database integration coming soon)');
        }},
      ]
    );
  };

  return (
    <BaseScreen
      scrollable={false}
      loading={false}
      error={null}
      empty={false}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Col sx={{ p: 'md' }} gap="md">
          {/* Header */}
          <Card variant="elevated">
            <CardContent>
              <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
                📅 Meetings History
              </T>
              <T variant="body" color="textSecondary">
                View and manage parent-teacher meetings
              </T>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card variant="elevated">
            <CardContent>
              <Row spaceBetween style={{ marginBottom: Spacing.md }}>
                <View style={styles.statBox}>
                  <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.info }}>
                    {stats.upcoming}
                  </T>
                  <T variant="caption" color="textSecondary">Upcoming</T>
                </View>
                <View style={styles.statBox}>
                  <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.success }}>
                    {stats.completed}
                  </T>
                  <T variant="caption" color="textSecondary">Completed</T>
                </View>
                <View style={styles.statBox}>
                  <T variant="display" weight="bold" style={{ fontSize: 28, color: Colors.error }}>
                    {stats.cancelled}
                  </T>
                  <T variant="caption" color="textSecondary">Cancelled</T>
                </View>
              </Row>

              {/* Quick Action */}
              <Button
                variant="primary"
                onPress={() => {
                  trackAction('schedule_new_meeting', 'MeetingsHistory');
                  safeNavigate(navigation, 'ScheduleMeeting', {});
                }}
              >
                📅 Schedule New Meeting
              </Button>
            </CardContent>
          </Card>

          {/* Tab Filter */}
          <Row style={{ gap: Spacing.xs, flexWrap: 'wrap' }}>
            <Button
              variant={filterTab === 'upcoming' ? 'primary' : 'outline'}
              onPress={() => {
                setFilterTab('upcoming');
                trackAction('filter_tab', 'MeetingsHistory', { tab: 'upcoming' });
              }}
            >
              Upcoming ({stats.upcoming})
            </Button>
            <Button
              variant={filterTab === 'past' ? 'primary' : 'outline'}
              onPress={() => {
                setFilterTab('past');
                trackAction('filter_tab', 'MeetingsHistory', { tab: 'past' });
              }}
            >
              Past
            </Button>
            <Button
              variant={filterTab === 'all' ? 'primary' : 'outline'}
              onPress={() => {
                setFilterTab('all');
                trackAction('filter_tab', 'MeetingsHistory', { tab: 'all' });
              }}
            >
              All ({SAMPLE_MEETINGS.length})
            </Button>
          </Row>

          {/* Meeting Type Filter */}
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Filter by Type:
              </T>
              <Row style={{ gap: Spacing.xs, flexWrap: 'wrap' }}>
                <Button
                  variant={selectedType === 'all' ? 'primary' : 'outline'}
                  onPress={() => setSelectedType('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedType === 'video-call' ? 'primary' : 'outline'}
                  onPress={() => setSelectedType('video-call')}
                >
                  📹 Video
                </Button>
                <Button
                  variant={selectedType === 'phone-call' ? 'primary' : 'outline'}
                  onPress={() => setSelectedType('phone-call')}
                >
                  📞 Phone
                </Button>
                <Button
                  variant={selectedType === 'in-person' ? 'primary' : 'outline'}
                  onPress={() => setSelectedType('in-person')}
                >
                  🏫 In-Person
                </Button>
              </Row>
            </CardContent>
          </Card>

          {/* Meetings List */}
          {filteredMeetings.length > 0 ? (
            <Col gap="sm">
              {filteredMeetings.map((meeting) => (
                <Card key={meeting.id} variant="elevated">
                  <CardContent>
                    {/* Header Row */}
                    <Row spaceBetween centerV style={{ marginBottom: Spacing.sm }}>
                      <Row centerV style={{ gap: Spacing.xs }}>
                        <T variant="title">{getMeetingTypeIcon(meeting.type)}</T>
                        <Badge
                          variant={getStatusVariant(meeting.status)}
                          label={meeting.status.toUpperCase()}
                        />
                      </Row>
                      <T variant="caption" color="textSecondary">
                        {formatDate(meeting.date)}
                      </T>
                    </Row>

                    {/* Teacher Info */}
                    <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
                      {meeting.teacherName}
                    </T>
                    <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
                      {meeting.teacherSubject}
                    </T>

                    {/* Meeting Details */}
                    <View style={styles.detailsBox}>
                      <Row spaceBetween style={{ marginBottom: Spacing.xs }}>
                        <T variant="body" color="textSecondary">Time:</T>
                        <T variant="body" weight="semiBold">
                          {formatTime(meeting.time)}
                        </T>
                      </Row>
                      <Row spaceBetween style={{ marginBottom: Spacing.xs }}>
                        <T variant="body" color="textSecondary">Duration:</T>
                        <T variant="body" weight="semiBold">
                          {meeting.duration} minutes
                        </T>
                      </Row>
                    </View>

                    {/* Agenda */}
                    <T variant="body" weight="semiBold" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
                      Agenda:
                    </T>
                    <T variant="body" color="textSecondary" style={{ fontStyle: 'italic' }}>
                      {meeting.agenda}
                    </T>

                    {/* Notes (if completed) */}
                    {meeting.notes && (
                      <>
                        <T variant="body" weight="semiBold" style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
                          Notes:
                        </T>
                        <T variant="body" color="textSecondary">
                          {meeting.notes}
                        </T>
                      </>
                    )}

                    {/* Actions */}
                    <Row style={{ gap: Spacing.xs, marginTop: Spacing.md, flexWrap: 'wrap' }}>
                      {meeting.status === 'scheduled' && isJoinable(meeting) && (
                        <Button
                          variant="primary"
                          onPress={() => handleJoinMeeting(meeting)}
                          style={{ flex: 1, minWidth: 100 }}
                        >
                          📹 Join Call
                        </Button>
                      )}
                      {meeting.status === 'scheduled' && (
                        <>
                          <Button
                            variant="outline"
                            onPress={() => handleReschedule(meeting)}
                            style={{ flex: 1, minWidth: 100 }}
                          >
                            🔄 Reschedule
                          </Button>
                          <Button
                            variant="outline"
                            onPress={() => handleCancel(meeting)}
                            style={{ flex: 1, minWidth: 100 }}
                          >
                            ❌ Cancel
                          </Button>
                        </>
                      )}
                      {meeting.status === 'completed' && (
                        <Button
                          variant="outline"
                          onPress={() => {
                            trackAction('view_meeting_details', 'MeetingsHistory', { meetingId: meeting.id });
                            Alert.alert('Meeting Details', `Full details for meeting with ${meeting.teacherName}\n\n(Coming soon)`);
                          }}
                          style={{ flex: 1 }}
                        >
                          📄 View Details
                        </Button>
                      )}
                    </Row>
                  </CardContent>
                </Card>
              ))}
            </Col>
          ) : (
            <Card variant="outlined">
              <CardContent>
                <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                  <T variant="display" style={{ fontSize: 48, marginBottom: Spacing.md }}>
                    📅
                  </T>
                  <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
                    No Meetings Found
                  </T>
                  <T variant="body" color="textSecondary" style={{ textAlign: 'center', marginBottom: Spacing.md }}>
                    {filterTab === 'upcoming' && 'No upcoming meetings scheduled'}
                    {filterTab === 'past' && 'No past meetings to display'}
                    {filterTab === 'all' && 'No meetings found with the selected filters'}
                  </T>
                  <Button
                    variant="primary"
                    onPress={() => {
                      trackAction('schedule_new_meeting_empty', 'MeetingsHistory');
                      safeNavigate(navigation, 'ScheduleMeeting', {});
                    }}
                  >
                    📅 Schedule Your First Meeting
                  </Button>
                </View>
              </CardContent>
            </Card>
          )}
        </Col>
      </ScrollView>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  detailsBox: {
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
});

export default MeetingsHistoryScreen;
