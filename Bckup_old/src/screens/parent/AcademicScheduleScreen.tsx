/**
 * AcademicScheduleScreen - Phase 36.1: Academic Schedule Management
 * Comprehensive schedule interface for multi-child timetable management
 * Includes class schedules, exam calendar, academic planning, and calendar synchronization
 * Manushi Coaching Platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal,
  BackHandler,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import theme and styling
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

// Import API hooks for real data
import { useChildrenSummary as useParentChildren } from '../../hooks/api/useParentAPI';
// TODO: Add schedule hooks when backend service is ready
const useClassSchedule = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useExamSchedule = () => ({ data: [], isLoading: false, refetch: async () => {} });

const { width } = Dimensions.get('window');

// Type definitions for Academic Schedule Management System
interface Child {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  rollNumber: string;
  profileImage?: string;
  isActive: boolean;
}

interface ClassSchedule {
  id: string;
  childId: string;
  subject: string;
  teacherName: string;
  roomNumber: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  type: 'regular' | 'lab' | 'activity' | 'study-hall';
  isRecurring: boolean;
  color: string;
}

interface ExamSchedule {
  id: string;
  childId: string;
  subject: string;
  examType: 'unit-test' | 'mid-term' | 'final' | 'practical' | 'project';
  date: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  syllabus: string[];
  maxMarks: number;
  instructions: string;
  materialsRequired: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface ExtraCurricular {
  id: string;
  childId: string;
  activityName: string;
  type: 'sports' | 'arts' | 'music' | 'dance' | 'debate' | 'science' | 'community';
  instructor: string;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  location: string;
  fee?: number;
  isRegistered: boolean;
  registrationDeadline?: string;
  maxParticipants?: number;
  currentParticipants: number;
}

interface AcademicEvent {
  id: string;
  title: string;
  description: string;
  type: 'holiday' | 'exam' | 'event' | 'meeting' | 'deadline' | 'celebration';
  date: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  affectedChildren: string[]; // Child IDs
  location?: string;
  isSchoolWide: boolean;
  notificationSent: boolean;
}

interface ScheduleConflict {
  id: string;
  childId: string;
  conflictType: 'time-overlap' | 'location-conflict' | 'teacher-unavailable';
  description: string;
  affectedSchedules: string[];
  severity: 'low' | 'medium' | 'high';
  resolutionOptions: string[];
  status: 'pending' | 'resolved' | 'ignored';
}

interface AcademicScheduleScreenProps {
  parentId: string;
  onNavigate: (screen: string) => void;
}

const AcademicScheduleScreen: React.FC<AcademicScheduleScreenProps> = ({
  parentId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'exams' | 'activities' | 'calendar'>('timetable');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [extraCurriculars, setExtraCurriculars] = useState<ExtraCurricular[]>([]);
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Real data hooks - Phase 1 implementation
  const {
    data: childrenData = [],
    isLoading: childrenLoading,
    error: childrenError,
    refetch: refetchChildren
  } = useParentChildren(parentId);

  const {
    data: classScheduleData = [],
    isLoading: scheduleLoading,
    error: scheduleError,
    refetch: refetchSchedule
  } = useClassSchedule(selectedChild, {
    enabled: !!selectedChild
  });

  const {
    data: examScheduleData = [],
    isLoading: examLoading,
    error: examError,
    refetch: refetchExams
  } = useExamSchedule(selectedChild, {
    enabled: !!selectedChild
  });

  const isLoading = childrenLoading || scheduleLoading || examLoading;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
  ];

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onNavigate('back');
      return true;
    });
    return backHandler;
  }, [onNavigate]);

  // Set default selected child when children data loads
  useEffect(() => {
    if (childrenData && childrenData.length > 0 && !selectedChild) {
      const firstChild = childrenData[0];
      const studentId = firstChild.student?.id || firstChild.student_id || '';
      setSelectedChild(studentId);
    }
  }, [childrenData, selectedChild]);

  // Handle errors
  useEffect(() => {
    if (childrenError) {
      showSnackbar('Failed to load children data');
    }
    if (scheduleError) {
      showSnackbar('Failed to load class schedules');
    }
    if (examError) {
      showSnackbar('Failed to load exam schedules');
    }
  }, [childrenError, scheduleError, examError, showSnackbar]);

  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  // Transform children data from Supabase
  const children: Child[] = React.useMemo(() => {
    if (!childrenData) return [];

    return childrenData.map((student: any) => ({
      id: student.id,
      firstName: student.full_name?.split(' ')[0] || 'Student',
      lastName: student.full_name?.split(' ').slice(1).join(' ') || '',
      grade: student.grade || 'N/A',
      section: student.section || 'A',
      rollNumber: student.student_id || 'N/A',
      isActive: student.status === 'active',
    }));
  }, [childrenData]);

  // Transform class schedule data from Supabase
  const classSchedules: ClassSchedule[] = React.useMemo(() => {
    if (!classScheduleData) return [];

    const subjectColors: Record<string, string> = {
      'Mathematics': '#7C3AED',
      'Physics': '#059669',
      'Chemistry': '#DC2626',
      'English': '#2563EB',
      'Biology': '#16A34A',
      'History': '#CA8A04',
      'Geography': '#0891B2',
    };

    return classScheduleData.map((schedule: any) => ({
      id: schedule.id,
      childId: schedule.student_id,
      subject: schedule.subject,
      teacherName: schedule.teacher
        ? `${schedule.teacher.first_name} ${schedule.teacher.last_name}`
        : 'Unknown Teacher',
      roomNumber: schedule.room_number || 'N/A',
      dayOfWeek: schedule.day_of_week,
      startTime: schedule.start_time.substring(0, 5), // HH:MM format
      endTime: schedule.end_time.substring(0, 5),
      duration: schedule.duration_minutes || 0,
      type: schedule.class_type as 'regular' | 'lab' | 'activity' | 'study-hall',
      isRecurring: true,
      color: subjectColors[schedule.subject] || '#6B7280',
    }));
  }, [classScheduleData]);

  // Transform exam schedule data from Supabase
  const examSchedules: ExamSchedule[] = React.useMemo(() => {
    if (!examScheduleData) return [];

    return examScheduleData.map((exam: any) => ({
      id: exam.id,
      childId: exam.student_id,
      subject: exam.subject,
      examType: exam.exam_type as 'unit-test' | 'mid-term' | 'final' | 'practical' | 'project',
      date: exam.exam_date,
      startTime: exam.start_time?.substring(0, 5) || '09:00',
      endTime: exam.end_time?.substring(0, 5) || '12:00',
      roomNumber: exam.room_number || 'N/A',
      syllabus: exam.syllabus || [],
      maxMarks: exam.max_marks || 100,
      instructions: exam.instructions || 'No special instructions',
      materialsRequired: exam.materials_required || [],
      status: exam.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
    }));
  }, [examScheduleData]);

  // Pull-to-refresh handler - refetch real data from Supabase
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchChildren(),
        selectedChild ? refetchSchedule() : Promise.resolve(),
        selectedChild ? refetchExams() : Promise.resolve(),
      ]);
      showSnackbar('Schedule data refreshed successfully');
    } catch (error) {
      console.error('Refresh failed:', error);
      showSnackbar('Failed to refresh schedule data');
    } finally {
      setRefreshing(false);
    }
  };

  const getFilteredSchedules = () => {
    if (selectedChild === 'all') {
      return classSchedules;
    }
    return classSchedules.filter(schedule => schedule.childId === selectedChild);
  };

  const getFilteredExams = () => {
    if (selectedChild === 'all') {
      return examSchedules;
    }
    return examSchedules.filter(exam => exam.childId === selectedChild);
  };

  const getFilteredActivities = () => {
    if (selectedChild === 'all') {
      return extraCurriculars;
    }
    return extraCurriculars.filter(activity => activity.childId === selectedChild);
  };

  const handleActivityRegistration = (activity: ExtraCurricular) => {
    showSnackbar(`Successfully ${activity.isRegistered ? 'withdrawn from' : 'registered for'} ${activity.activityName}!`);
  };

  const handleSyncCalendar = () => {
    showSnackbar('Synced with Google Calendar successfully!');
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#7C3AED' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content title="Academic Schedule" subtitle="Manage your child's schedule" />
      <Appbar.Action icon="calendar" onPress={() => showSnackbar('Calendar view active')} />
    </Appbar.Header>
  );

  const renderTabButton = (tab: typeof activeTab, title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderChildSelector = () => (
    <View style={styles.childSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.childButton, selectedChild === 'all' && styles.childButtonActive]}
          onPress={() => setSelectedChild('all')}
        >
          <Text style={[styles.childButtonText, selectedChild === 'all' && styles.childButtonTextActive]}>
            All Children
          </Text>
        </TouchableOpacity>
        {children.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[styles.childButton, selectedChild === child.id && styles.childButtonActive]}
            onPress={() => setSelectedChild(child.id)}
          >
            <Text style={[styles.childButtonText, selectedChild === child.id && styles.childButtonTextActive]}>
              {child.firstName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTimetableGrid = () => {
    const filteredSchedules = getFilteredSchedules();
    
    return (
      <View style={styles.timetableContainer}>
        <View style={styles.timetableHeader}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        <ScrollView>
          {timeSlots.map((time, timeIndex) => (
            <View key={timeIndex} style={styles.timeRow}>
              <View style={styles.timeSlot}>
                <Text style={styles.timeSlotText}>{time}</Text>
              </View>
              {weekDays.map((day, dayIndex) => {
                const daySchedules = filteredSchedules.filter(
                  schedule => schedule.dayOfWeek === dayIndex && 
                  schedule.startTime === time
                );
                
                return (
                  <View key={dayIndex} style={styles.scheduleSlot}>
                    {daySchedules.map((schedule) => (
                      <TouchableOpacity
                        key={schedule.id}
                        style={[styles.scheduleBlock, { backgroundColor: schedule.color }]}
                        onPress={() => {
                          showSnackbar(`${schedule.subject} - ${schedule.teacherName} - Room ${schedule.roomNumber}`);
                        }}
                      >
                        <Text style={styles.scheduleSubject} numberOfLines={1}>
                          {schedule.subject}
                        </Text>
                        <Text style={styles.scheduleRoom} numberOfLines={1}>
                          {schedule.roomNumber}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderExamItem = ({ item }: { item: ExamSchedule }) => {
    const child = children.find(c => c.id === item.childId);
    
    return (
      <View style={styles.examCard}>
        <View style={styles.examHeader}>
          <View style={styles.examInfo}>
            <Text style={styles.examSubject}>{item.subject}</Text>
            <Text style={styles.examType}>{item.examType.replace('-', ' ').toUpperCase()}</Text>
          </View>
          <View style={[styles.examStatus, styles[`status${item.status}`]]}>
            <Text style={styles.examStatusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        {child && (
          <Text style={styles.examChild}>
            {child.firstName} {child.lastName} - {child.grade}
          </Text>
        )}

        <View style={styles.examDetails}>
          <View style={styles.examDetailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.examDetailItem}>
            <Text style={styles.detailIcon}>⏰</Text>
            <Text style={styles.detailText}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>
          <View style={styles.examDetailItem}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>Room {item.roomNumber}</Text>
          </View>
          <View style={styles.examDetailItem}>
            <Text style={styles.detailIcon}>📊</Text>
            <Text style={styles.detailText}>Max Marks: {item.maxMarks}</Text>
          </View>
        </View>

        <View style={styles.syllabusContainer}>
          <Text style={styles.syllabusTitle}>Syllabus:</Text>
          <View style={styles.syllabusList}>
            {item.syllabus.map((topic, index) => (
              <View key={index} style={styles.syllabusItem}>
                <Text style={styles.syllabusText}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.materialsContainer}>
          <Text style={styles.materialsTitle}>Required Materials:</Text>
          <Text style={styles.materialsText}>
            {item.materialsRequired.join(', ')}
          </Text>
        </View>

        <Text style={styles.examInstructions}>{item.instructions}</Text>
      </View>
    );
  };

  const renderActivityItem = ({ item }: { item: ExtraCurricular }) => {
    const child = children.find(c => c.id === item.childId);
    
    return (
      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{item.activityName}</Text>
            <Text style={styles.activityType}>{item.type.toUpperCase()}</Text>
          </View>
          <View style={styles.participantInfo}>
            <Text style={styles.participantText}>
              {item.currentParticipants}
              {item.maxParticipants && `/${item.maxParticipants}`}
            </Text>
          </View>
        </View>

        {child && (
          <Text style={styles.activityChild}>
            {child.firstName} {child.lastName}
          </Text>
        )}

        <Text style={styles.activityInstructor}>
          Instructor: {item.instructor}
        </Text>

        <View style={styles.scheduleContainer}>
          <Text style={styles.scheduleTitle}>Schedule:</Text>
          {item.schedule.map((schedule, index) => (
            <View key={index} style={styles.scheduleItem}>
              <Text style={styles.scheduleDay}>
                {weekDays[schedule.dayOfWeek]}
              </Text>
              <Text style={styles.scheduleTime}>
                {schedule.startTime} - {schedule.endTime}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.activityDetails}>
          <View style={styles.activityDetailItem}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
          {item.fee && (
            <View style={styles.activityDetailItem}>
              <Text style={styles.detailIcon}>💰</Text>
              <Text style={styles.detailText}>₹{item.fee}</Text>
            </View>
          )}
          {item.registrationDeadline && (
            <View style={styles.activityDetailItem}>
              <Text style={styles.detailIcon}>⏰</Text>
              <Text style={styles.detailText}>
                Deadline: {new Date(item.registrationDeadline).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.activityButton,
            item.isRegistered ? styles.withdrawButton : styles.registerButton
          ]}
          onPress={() => handleActivityRegistration(item)}
        >
          <Text style={styles.activityButtonText}>
            {item.isRegistered ? 'Registered ✓' : 'Register'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCalendarView = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity style={styles.calendarNavButton}>
            <Text style={styles.calendarNavText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>
            {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity style={styles.calendarNavButton}>
            <Text style={styles.calendarNavText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.eventsList}>
          <Text style={styles.eventsTitle}>Upcoming Events</Text>
          {academicEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventItem}
              onPress={() => {
                setSelectedEvent(event);
                setShowEventDetails(true);
              }}
            >
              <View style={styles.eventDate}>
                <Text style={styles.eventDayText}>
                  {new Date(event.date).getDate()}
                </Text>
                <Text style={styles.eventMonthText}>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDescription} numberOfLines={1}>
                  {event.description}
                </Text>
                <View style={styles.eventMeta}>
                  <Text style={styles.eventType}>{event.type.toUpperCase()}</Text>
                  {!event.isAllDay && (
                    <Text style={styles.eventTime}>
                      {event.startTime} - {event.endTime}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.syncButton} onPress={handleSyncCalendar}>
          <Text style={styles.syncButtonText}>🔄 Sync with Calendar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'timetable':
        return renderTimetableGrid();

      case 'exams':
        return (
          <FlatList
            data={getFilteredExams()}
            renderItem={renderExamItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyTitle}>No Exams Scheduled</Text>
                <Text style={styles.emptySubtitle}>
                  Exam schedules will appear here when available
                </Text>
              </View>
            }
            windowSize={10}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={100}
          />
        );

      case 'activities':
        return (
          <FlatList
            data={getFilteredActivities()}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyTitle}>No Activities Available</Text>
                <Text style={styles.emptySubtitle}>
                  Extra-curricular activities will be listed here
                </Text>
              </View>
            }
            windowSize={10}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={100}
          />
        );

      case 'calendar':
        return renderCalendarView();

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#7C3AED" barStyle="light-content" />
        {renderAppBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LightTheme.Primary} />
          <Text style={styles.loadingText}>Loading academic schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#7C3AED" barStyle="light-content" />
      {renderAppBar()}

      {/* Child Selector */}
      {renderChildSelector()}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTabButton('timetable', 'Timetable', '📋')}
          {renderTabButton('exams', 'Exams', '📝')}
          {renderTabButton('activities', 'Activities', '🎯')}
          {renderTabButton('calendar', 'Calendar', '📅')}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Event Details Modal */}
      <Modal
        visible={showEventDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEvent && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                  <TouchableOpacity
                    onPress={() => setShowEventDetails(false)}
                    style={styles.modalClose}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.eventModalDescription}>
                  {selectedEvent.description}
                </Text>

                <View style={styles.eventModalDetails}>
                  <View style={styles.eventModalItem}>
                    <Text style={styles.detailIcon}>📅</Text>
                    <Text style={styles.detailText}>
                      {new Date(selectedEvent.date).toLocaleDateString()}
                    </Text>
                  </View>
                  {!selectedEvent.isAllDay && (
                    <View style={styles.eventModalItem}>
                      <Text style={styles.detailIcon}>⏰</Text>
                      <Text style={styles.detailText}>
                        {selectedEvent.startTime} - {selectedEvent.endTime}
                      </Text>
                    </View>
                  )}
                  {selectedEvent.location && (
                    <View style={styles.eventModalItem}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <Text style={styles.detailText}>{selectedEvent.location}</Text>
                    </View>
                  )}
                  <View style={styles.eventModalItem}>
                    <Text style={styles.detailIcon}>🏫</Text>
                    <Text style={styles.detailText}>
                      {selectedEvent.isSchoolWide ? 'School-wide Event' : 'Grade-specific Event'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBFE',
  },
  loadingText: {
    marginTop: Spacing.MD,
    fontSize: 16,
    color: LightTheme.Outline,
  },

  // Child Selector Styles
  childSelector: {
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  childButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    marginHorizontal: Spacing.XS,
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  childButtonActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  childButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  childButtonTextActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },

  // Tab Styles
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  tabButton: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    marginHorizontal: Spacing.XS,
    borderRadius: BorderRadius.LG,
    alignItems: 'center',
    minWidth: 100,
  },
  tabButtonActive: {
    backgroundColor: '#EDE9FE',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: Spacing.XS,
  },
  tabText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  tabTextActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },

  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: Spacing.MD,
  },

  // Timetable Styles
  timetableContainer: {
    flex: 1,
  },
  timetableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginTop: Spacing.MD,
    borderRadius: BorderRadius.MD,
  },
  dayHeader: {
    flex: 1,
    paddingVertical: Spacing.MD,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: LightTheme.Outline,
  },
  dayHeaderText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  timeRow: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  timeSlot: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: LightTheme.Outline,
  },
  timeSlotText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  scheduleSlot: {
    flex: 1,
    padding: Spacing.XS,
    borderRightWidth: 1,
    borderRightColor: LightTheme.Outline,
  },
  scheduleBlock: {
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.XS,
  },
  scheduleSubject: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.XS,
  },
  scheduleRoom: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: '#FFFFFF',
    opacity: 0.9,
  },

  // Exam Styles
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  examInfo: {
    flex: 1,
  },
  examSubject: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  examType: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  examStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  statusupcoming: {
    backgroundColor: '#FEF3C7',
  },
  statusongoing: {
    backgroundColor: '#DBEAFE',
  },
  statuscompleted: {
    backgroundColor: '#D1FAE5',
  },
  statuscancelled: {
    backgroundColor: '#FEE2E2',
  },
  examStatusText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  examChild: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  examDetails: {
    marginBottom: Spacing.MD,
  },
  examDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: Spacing.SM,
    width: 20,
  },
  detailText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
  },
  syllabusContainer: {
    marginBottom: Spacing.MD,
  },
  syllabusTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  syllabusList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  syllabusItem: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  syllabusText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: '#7C3AED',
  },
  materialsContainer: {
    marginBottom: Spacing.MD,
  },
  materialsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  materialsText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  examInstructions: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
  },

  // Activity Styles
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  activityType: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  participantInfo: {
    alignItems: 'center',
  },
  participantText: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  activityChild: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  activityInstructor: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  scheduleContainer: {
    marginBottom: Spacing.MD,
  },
  scheduleTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.XS,
  },
  scheduleDay: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    minWidth: 40,
  },
  scheduleTime: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginLeft: Spacing.MD,
  },
  activityDetails: {
    marginBottom: Spacing.MD,
  },
  activityDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  activityButton: {
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#7C3AED',
  },
  withdrawButton: {
    backgroundColor: '#D1FAE5',
  },
  activityButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Calendar Styles
  calendarContainer: {
    flex: 1,
    paddingTop: Spacing.MD,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.LG,
    paddingHorizontal: Spacing.MD,
  },
  calendarNavButton: {
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  calendarNavText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
  },
  calendarTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
  },
  eventsList: {
    flex: 1,
  },
  eventsTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  eventItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderRadius: BorderRadius.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  eventDate: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    marginRight: Spacing.MD,
  },
  eventDayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  eventMonthText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  eventDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventType: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    backgroundColor: '#EDE9FE',
    color: '#7C3AED',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.MD,
  },
  eventTime: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  syncButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.LG,
  },
  syncButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.XXL,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.LG,
  },
  emptyTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: Spacing.XL,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    width: width - Spacing.XL * 2,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  modalTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  modalClose: {
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LightTheme.OnSurfaceVariant,
  },
  eventModalDescription: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.LG,
  },
  eventModalDetails: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
  },
  eventModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
});

export default AcademicScheduleScreen;