import React, { useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { T, Card, Button, Row, Chip } from '../../ui';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';
import { Colors, BorderRadius, Spacing } from '../../theme/designSystem';

type Props = NativeStackScreenProps<any, 'NewClassDetailScreen'>;

type ClassSession = {
  id: string;
  session_name?: string | null;
  subject?: string | null;
  description?: string | null;
  scheduled_start_at?: string | null;
  start_time?: string | null;
  scheduled_end_at?: string | null;
  end_time?: string | null;
  meeting_link?: string | null;
  teacher_name?: string | null;
  department?: string | null;
  location?: string | null;
  mode?: string | null;
};

export default function NewClassDetailScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { classId, title: routeTitle, teacher: routeTeacher, department: routeDept } = route.params || {};

  useEffect(() => {
    trackScreenView('NewClassDetailScreen', { classId });
  }, [classId]);

  const {
    data: classData,
    isLoading,
    isError,
    refetch,
  } = useQuery<ClassSession | null>({
    queryKey: ['class-detail', classId],
    enabled: !!classId,
    retry: 1,
    queryFn: async () => {
      if (!classId) return null;

      const selectFields =
        'id,session_name,subject,description,scheduled_start_at,start_time,scheduled_end_at,end_time,meeting_link,teacher_name,department,location,mode';

      try {
        const { data, error } = await supabase
          .from('class_sessions')
          .select(selectFields)
          .eq('id', classId)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        console.log('class_sessions not available, falling back', err);
      }

      try {
        const { data, error } = await supabase
          .from('live_sessions')
          .select(selectFields)
          .eq('id', classId)
          .maybeSingle();

        if (!error) return data || null;
      } catch (err) {
        console.log('live_sessions fetch error', err);
      }

      return null;
    },
  });

  const title = classData?.session_name || classData?.subject || routeTitle || 'Class Session';
  const teacher = classData?.teacher_name || routeTeacher || 'Faculty';
  const department = classData?.department || routeDept || 'Department';
  const description =
    classData?.description ||
    'This session covers the core concepts with interactive explanations, practice problems, and Q&A.';

  const startISO = classData?.scheduled_start_at || classData?.start_time || '';
  const endISO = classData?.scheduled_end_at || classData?.end_time || '';

  const startDate = startISO ? new Date(startISO) : null;
  const endDate = endISO ? new Date(endISO) : null;
  const now = new Date();

  const status = useMemo(() => {
    if (startDate && endDate && now >= startDate && now <= endDate) return 'LIVE';
    if (startDate && now < startDate) return 'Scheduled';
    if (endDate && now > endDate) return 'Ended';
    return 'Scheduled';
  }, [startDate, endDate, now]);

  const timeRange = useMemo(() => {
    if (!startDate || !endDate) return 'Time TBD';
    const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    return `${startDate.toLocaleTimeString([], opts)} - ${endDate.toLocaleTimeString([], opts)}`;
  }, [startDate, endDate]);

  const dateLabel = useMemo(() => {
    if (!startDate) return 'Date TBD';
    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return startDate.toLocaleDateString([], opts);
  }, [startDate]);

  const durationLabel = useMemo(() => {
    if (!startDate || !endDate) return 'Duration TBD';
    const mins = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
    return `${mins} mins`;
  }, [startDate, endDate]);

  const handleJoin = () => {
    trackAction('join_live_class', 'NewClassDetailScreen', { classId: classId || 'unknown' });
    if (classId) {
      safeNavigate('NewEnhancedLiveClass', { classId });
      return;
    }
    safeNavigate('NewVirtualClassroom', {});
  };

  const handleReminder = () => {
    trackAction('add_reminder', 'NewClassDetailScreen', { classId: classId || 'unknown' });
    Alert.alert('Reminder', 'Reminder scheduling coming soon.');
  };

  const handleRecording = async () => {
    trackAction('view_recording', 'NewClassDetailScreen', { classId: classId || 'unknown' });
    if (classData?.meeting_link) {
      try {
        await Linking.openURL(classData.meeting_link);
      } catch (err) {
        Alert.alert('Link error', 'Could not open recording link.');
      }
    } else {
      Alert.alert('Recording', 'Recording link not available.');
    }
  };

  const primaryLabel =
    status === 'LIVE' ? 'Join Live Class' : status === 'Scheduled' ? 'Add Reminder' : 'View Recording';
  const primaryAction = status === 'LIVE' ? handleJoin : status === 'Scheduled' ? handleReminder : handleRecording;

  const refreshControl = (
    <RefreshControl
      refreshing={isLoading}
      onRefresh={refetch}
      colors={[Colors.primary]}
      tintColor={Colors.primary}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.safeArea.backgroundColor as string} />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T style={styles.icon}>←</T>
        </TouchableOpacity>
        <T variant="headline" style={styles.topTitle}>
          Class Details
        </T>
        <TouchableOpacity
          onPress={() => Alert.alert('Options', 'More options coming soon')}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <T style={styles.icon}>⋮</T>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={refreshControl}>
        <Card style={styles.heroCard}>
          <Row style={styles.heroHeader}>
            <View style={styles.heroTitleArea}>
              <T variant="title" weight="bold" style={styles.heroTitle}>
                {title}
              </T>
              <T variant="body" color="textSecondary">
                {teacher} • {department}
              </T>
              <View style={styles.chipRow}>
                <Chip
                  label={status}
                  selected={status === 'LIVE'}
                  variant="filter"
                  icon={status === 'LIVE' ? 'play' : undefined}
                />
                <Chip label={dateLabel} variant="assist" />
                <Chip label={timeRange} variant="assist" />
              </View>
            </View>
          </Row>
        </Card>

        <View style={styles.actionsRow}>
          <Button variant="primary" onPress={primaryAction} fullWidth>
            {primaryLabel}
          </Button>
          <View style={{ height: Spacing.sm }} />
          <Button
            variant="secondary"
            onPress={() => {
              trackAction('open_class_feed', 'NewClassDetailScreen', { classId: classId || 'unknown' });
              // @ts-expect-error - student stack typing relaxed
              safeNavigate('ClassFeedScreen', { classId: classId || 'algebra_class_11' });
            }}
            fullWidth
          >
            Open class feed
          </Button>
        </View>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Schedule
          </T>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>
              Date
            </T>
            <T variant="body">{dateLabel}</T>
          </Row>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>
              Time
            </T>
            <T variant="body">{timeRange}</T>
          </Row>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>
              Duration
            </T>
            <T variant="body">{durationLabel}</T>
          </Row>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>
              Location
            </T>
            <T variant="body">{classData?.location || classData?.mode || 'Online'}</T>
          </Row>
        </Card>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            About this class
          </T>
          <T variant="body" color="textSecondary">
            {description}
          </T>
        </Card>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            Teacher Info
          </T>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>
              Name
            </T>
            <T variant="body">{teacher}</T>
          </Row>
          <Row style={styles.rowItem}>
            <T variant="body" style={styles.rowLabel}>
              Department
            </T>
            <T variant="body">{department}</T>
          </Row>
          <Button variant="secondary" onPress={() => Alert.alert('Teacher', 'More teacher info coming soon')}>
            View more
          </Button>
        </Card>

        <Card style={styles.card}>
          <T variant="subtitle" style={styles.cardTitle}>
            More in this subject
          </T>
          <T variant="body" color="textSecondary">
            More sessions in this subject coming soon.
          </T>
        </Card>

        {isError && (
          <T variant="body" color="error" style={styles.helperText}>
            Unable to load class details. Pull to retry.
          </T>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  topTitle: {
    color: Colors.textPrimary,
  },
  icon: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  heroCard: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
  },
  heroHeader: {
    alignItems: 'flex-start',
  },
  heroTitleArea: {
    flex: 1,
  },
  heroTitle: {
    marginBottom: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  actionsRow: {
    marginBottom: Spacing.base,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
  },
  rowItem: {
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  rowLabel: {
    color: Colors.textSecondary,
  },
  helperText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
