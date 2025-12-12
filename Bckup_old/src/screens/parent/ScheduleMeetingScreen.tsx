/**
 * ScheduleMeetingScreen - Hybrid Implementation
 *
 * Professional meeting scheduling interface for parent-teacher conferences
 *
 * Features:
 * - Teacher selection
 * - Date and time picker
 * - Meeting type selection (In-person, Video call, Phone call)
 * - Agenda and notes
 * - Duration selection
 * - Confirmation preview
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Button, Badge } from '../../ui';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'ScheduleMeeting'>;

type MeetingType = 'in-person' | 'video-call' | 'phone-call';
type Duration = 15 | 30 | 45 | 60;

interface Teacher {
  id: string;
  name: string;
  subject: string;
  availability: string;
}

// Sample teachers (in real implementation, fetch from DB)
const SAMPLE_TEACHERS: Teacher[] = [
  { id: '1', name: 'Mrs. Priya Kumar', subject: 'Mathematics', availability: 'Mon-Fri, 2-4 PM' },
  { id: '2', name: 'Mr. Raj Singh', subject: 'Science', availability: 'Mon, Wed, Fri, 10-12 PM' },
  { id: '3', name: 'Ms. Anita Desai', subject: 'English', availability: 'Tue, Thu, 3-5 PM' },
  { id: '4', name: 'Mr. Kumar Patel', subject: 'History', availability: 'Mon-Fri, 11-1 PM' },
];

const ScheduleMeetingScreen: React.FC<Props> = ({ route, navigation }) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [showTeachers, setShowTeachers] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>('video-call');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<Duration>(30);
  const [agenda, setAgenda] = useState('');

  useEffect(() => {
    trackScreenView('ScheduleMeeting', { from: 'MessagesTab' });
  }, []);

  // Pre-fill teacher if provided
  useEffect(() => {
    if (route.params?.teacherId) {
      const foundTeacher = SAMPLE_TEACHERS.find(t => t.id === route.params.teacherId);
      if (foundTeacher) setTeacher(foundTeacher);
    }
  }, [route.params]);

  const handleSchedule = () => {
    if (!teacher || !selectedDate || !selectedTime || !agenda.trim()) {
      alert('Please fill in all required fields:\n- Teacher\n- Date\n- Time\n- Agenda');
      return;
    }

    trackAction('schedule_meeting_attempt', 'ScheduleMeeting', {
      teacherId: teacher.id,
      meetingType,
      duration,
    });

    alert(`Meeting scheduled with ${teacher.name}!\n\nDate: ${selectedDate}\nTime: ${selectedTime}\nDuration: ${duration} minutes\nType: ${meetingType}\n\n(Database integration coming soon)`);

    navigation.goBack();
  };

  const getMeetingTypeIcon = (type: MeetingType) => {
    if (type === 'video-call') return '📹';
    if (type === 'phone-call') return '📞';
    return '🏫';
  };

  const getMeetingTypeLabel = (type: MeetingType) => {
    if (type === 'video-call') return 'Video Call';
    if (type === 'phone-call') return 'Phone Call';
    return 'In Person';
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
                📅 Schedule Meeting
              </T>
              <T variant="body" color="textSecondary">
                Book a parent-teacher conference
              </T>
            </CardContent>
          </Card>

          {/* Teacher Selection */}
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Select Teacher: *
              </T>

              {teacher ? (
                <TouchableOpacity
                  style={styles.selectedTeacher}
                  onPress={() => setShowTeachers(!showTeachers)}
                >
                  <View style={{ flex: 1 }}>
                    <T variant="body" weight="semiBold">{teacher.name}</T>
                    <T variant="caption" color="textSecondary">{teacher.subject}</T>
                    <T variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                      Available: {teacher.availability}
                    </T>
                  </View>
                  <Badge variant="info" label="Teacher" />
                </TouchableOpacity>
              ) : (
                <Button
                  variant="outline"
                  onPress={() => setShowTeachers(!showTeachers)}
                >
                  Choose Teacher
                </Button>
              )}

              {showTeachers && (
                <Col gap="xs" style={{ marginTop: Spacing.sm }}>
                  {SAMPLE_TEACHERS.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.teacherOption}
                      onPress={() => {
                        setTeacher(t);
                        setShowTeachers(false);
                        trackAction('select_teacher_for_meeting', 'ScheduleMeeting', { teacherId: t.id });
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <T variant="body" weight="semiBold">{t.name}</T>
                        <T variant="caption" color="textSecondary">{t.subject}</T>
                        <T variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                          Available: {t.availability}
                        </T>
                      </View>
                    </TouchableOpacity>
                  ))}
                </Col>
              )}
            </CardContent>
          </Card>

          {/* Meeting Type */}
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Meeting Type:
              </T>
              <Row style={{ gap: Spacing.xs, flexWrap: 'wrap' }}>
                {(['video-call', 'phone-call', 'in-person'] as MeetingType[]).map((type) => (
                  <Button
                    key={type}
                    variant={meetingType === type ? 'primary' : 'outline'}
                    onPress={() => setMeetingType(type)}
                    style={{ flex: 1, minWidth: 100 }}
                  >
                    {getMeetingTypeIcon(type)} {getMeetingTypeLabel(type)}
                  </Button>
                ))}
              </Row>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Date & Time: *
              </T>

              <Row style={{ gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
                    Date
                  </T>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textSecondary}
                    value={selectedDate}
                    onChangeText={setSelectedDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
                    Time
                  </T>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:MM"
                    placeholderTextColor={Colors.textSecondary}
                    value={selectedTime}
                    onChangeText={setSelectedTime}
                  />
                </View>
              </Row>

              <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                💡 Tip: Check teacher's availability above
              </T>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Duration:
              </T>
              <Row style={{ gap: Spacing.xs, flexWrap: 'wrap' }}>
                {[15, 30, 45, 60].map((d) => (
                  <Button
                    key={d}
                    variant={duration === d ? 'primary' : 'outline'}
                    onPress={() => setDuration(d as Duration)}
                  >
                    {d} min
                  </Button>
                ))}
              </Row>
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Meeting Agenda: *
              </T>
              <TextInput
                style={styles.agendaInput}
                placeholder="What would you like to discuss?&#10;&#10;Examples:&#10;- Academic performance review&#10;- Behavior concerns&#10;- Extra-curricular activities"
                placeholderTextColor={Colors.textSecondary}
                value={agenda}
                onChangeText={setAgenda}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                {agenda.length}/500 characters
              </T>
            </CardContent>
          </Card>

          {/* Meeting Link (Coming Soon for Video Calls) */}
          {meetingType === 'video-call' && (
            <Card variant="outlined" style={{ borderStyle: 'dashed' }}>
              <CardContent>
                <Row spaceBetween centerV>
                  <View>
                    <T variant="body" weight="semiBold">📹 Video Conference Link</T>
                    <T variant="caption" color="textSecondary">
                      Auto-generated on confirmation
                    </T>
                  </View>
                  <Badge variant="info" label="Auto" />
                </Row>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Row style={{ gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.xl }}>
            <Button
              variant="outline"
              onPress={() => {
                trackAction('cancel_meeting_schedule', 'ScheduleMeeting');
                navigation.goBack();
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleSchedule}
              style={{ flex: 2 }}
            >
              📅 Schedule Meeting
            </Button>
          </Row>
        </Col>
      </ScrollView>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectedTeacher: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  teacherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.onSurface,
    backgroundColor: Colors.surface,
  },
  agendaInput: {
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.onSurface,
    backgroundColor: Colors.surface,
    minHeight: 150,
  },
});

export default ScheduleMeetingScreen;
