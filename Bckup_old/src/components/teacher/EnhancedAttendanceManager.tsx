import React, {useState, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {LightTheme} from '../../theme/colors';
import {Typography} from '../../theme/typography';
import {Spacing, BorderRadius} from '../../theme/spacing';
import {EnhancedTouchableButton} from '../core/EnhancedTouchableButton';

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  avatar?: string;
  attendance?: 'present' | 'absent' | 'late' | 'excused' | 'unmarked';
  lastAttendanceDate?: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  unmarked: number;
  total: number;
}

interface EnhancedAttendanceManagerProps {
  students: Student[];
  classTitle: string;
  date?: string;
  onStudentAttendanceChange: (studentId: string, status: Student['attendance']) => void;
  onBatchMarkAll: (status: Student['attendance']) => void;
  onSubmitAttendance: (attendance: Record<string, Student['attendance']>) => void;
  alertCount?: number;
  onAlertCountChange?: (newCount: number) => void;
}

const EnhancedAttendanceManager: React.FC<EnhancedAttendanceManagerProps> = ({
  students,
  classTitle,
  date = new Date().toLocaleDateString(),
  onStudentAttendanceChange,
  onBatchMarkAll,
  onSubmitAttendance,
  alertCount = 0,
  onAlertCountChange,
}) => {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate attendance statistics
  const stats: AttendanceStats = useMemo(() => {
    const present = students.filter(s => s.attendance === 'present').length;
    const absent = students.filter(s => s.attendance === 'absent').length;
    const late = students.filter(s => s.attendance === 'late').length;
    const excused = students.filter(s => s.attendance === 'excused').length;
    const unmarked = students.filter(s => !s.attendance || s.attendance === 'unmarked').length;
    
    return {
      present,
      absent,
      late,
      excused,
      unmarked,
      total: students.length,
    };
  }, [students]);

  // Handle batch operations
  const handleBatchOperation = (status: Student['attendance']) => {
    if (selectedStudents.size === 0) {
      Alert.alert('No Selection', 'Please select students first');
      return;
    }

    selectedStudents.forEach(studentId => {
      onStudentAttendanceChange(studentId, status);
    });

    setSelectedStudents(new Set());
    ReactNativeHapticFeedback.trigger('impactMedium');
  };

  // Handle submit attendance
  const handleSubmitAttendance = async () => {
    setIsSubmitting(true);
    
    const attendanceData = students.reduce((acc, student) => {
      acc[student.id] = student.attendance || 'unmarked';
      return acc;
    }, {} as Record<string, Student['attendance']>);

    try {
      await onSubmitAttendance(attendanceData);
      
      // Update alert count (fix for user complaint: "alert number are not changing")
      if (onAlertCountChange && alertCount > 0) {
        onAlertCountChange(Math.max(0, alertCount - 1));
      }
      
      ReactNativeHapticFeedback.trigger('impactHeavy');
      Alert.alert('success', 'Attendance submitted successfully!');
    } catch (error) {
      Alert.alert('error', 'Failed to submit attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Statistics */}
      <View style={styles.header}>
        <Text style={styles.classTitle}>{classTitle}</Text>
        <Text style={styles.dateText}>{date}</Text>
        
        {/* Alert Badge */}
        {alertCount > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertText}>{alertCount}</Text>
          </View>
        )}
      </View>

      {/* Attendance Statistics Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <View style={[styles.statCard, {backgroundColor: '#E8F5E8'}]}>
          <Text style={styles.statNumber}>{stats.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#FFE8E8'}]}>
          <Text style={styles.statNumber}>{stats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#FFF4E8'}]}>
          <Text style={styles.statNumber}>{stats.late}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#E8F0FF'}]}>
          <Text style={styles.statNumber}>{stats.excused}</Text>
          <Text style={styles.statLabel}>Excused</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#F0F0F0'}]}>
          <Text style={styles.statNumber}>{stats.unmarked}</Text>
          <Text style={styles.statLabel}>Unmarked</Text>
        </View>
      </ScrollView>

      {/* Batch Operations */}
      <View style={styles.batchOperations}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <EnhancedTouchableButton
            onPress={() => onBatchMarkAll('present')}
            title="Mark All Present"
            icon="✅"
            variant="primary"
            size="small"
            style={styles.batchButton}
          />
          <EnhancedTouchableButton
            onPress={() => handleBatchOperation('present')}
            title="Mark Selected Present"
            icon="✅"
            variant="secondary"
            size="small"
            style={styles.batchButton}
            disabled={selectedStudents.size === 0}
          />
          <EnhancedTouchableButton
            onPress={() => handleBatchOperation('absent')}
            title="Mark Selected Absent"
            icon="❌"
            variant="secondary"
            size="small"
            style={styles.batchButton}
            disabled={selectedStudents.size === 0}
          />
        </ScrollView>
      </View>

      {/* Student List with Swipe Interaction */}
      <Text style={styles.sectionTitle}>
        Students ({stats.total}) - Swipe right for Present, left for Absent
      </Text>
      
      <ScrollView style={styles.studentList} showsVerticalScrollIndicator={false}>
        {students.map(student => (
          <SwipeableAttendanceRow
            key={student.id}
            student={student}
            isSelected={selectedStudents.has(student.id)}
            onAttendanceChange={(status) => onStudentAttendanceChange(student.id, status)}
            onSelectionToggle={() => {
              const newSelection = new Set(selectedStudents);
              if (newSelection.has(student.id)) {
                newSelection.delete(student.id);
              } else {
                newSelection.add(student.id);
              }
              setSelectedStudents(newSelection);
            }}
          />
        ))}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <EnhancedTouchableButton
          onPress={handleSubmitAttendance}
          title={isSubmitting ? "Submitting..." : "Submit Attendance"}
          subtitle={`${stats.unmarked} students still unmarked`}
          icon="📤"
          variant="primary"
          size="large"
          disabled={isSubmitting || stats.unmarked === stats.total}
          hapticType="impactHeavy"
          style={styles.submitButton}
        />
      </View>
    </View>
  );
};

// Swipeable Student Row Component
const SwipeableAttendanceRow: React.FC<{
  student: Student;
  isSelected: boolean;
  onAttendanceChange: (status: Student['attendance']) => void;
  onSelectionToggle: () => void;
}> = ({student, isSelected, onAttendanceChange, onSelectionToggle}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const hasGivenFeedback = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        ReactNativeHapticFeedback.trigger('impactLight');
        hasGivenFeedback.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);

        // Provide haptic feedback at swipe thresholds
        if (Math.abs(gestureState.dx) > 100 && !hasGivenFeedback.current) {
          hasGivenFeedback.current = true;
          opacity.setValue(0.8);
          ReactNativeHapticFeedback.trigger('impactMedium');
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 100;

        if (gestureState.dx > threshold) {
          // Swipe right - Present
          onAttendanceChange('present');
          ReactNativeHapticFeedback.trigger('impactHeavy');
        } else if (gestureState.dx < -threshold) {
          // Swipe left - Absent
          onAttendanceChange('absent');
          ReactNativeHapticFeedback.trigger('impactHeavy');
        }

        // Animate back to original position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();

        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        hasGivenFeedback.current = false;
      },
    })
  ).current;

  const getAttendanceColor = (status?: Student['attendance']) => {
    switch (status) {
      case 'present': return '#4CAF50';
      case 'absent': return '#F44336';
      case 'late': return '#FF9800';
      case 'excused': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getAttendanceIcon = (status?: Student['attendance']) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      case 'excused': return '📋';
      default: return '❓';
    }
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.studentRow,
        {
          transform: [{translateX}],
          opacity,
        },
        isSelected && styles.selectedRow,
      ]}
    >
      <TouchableOpacity
        style={styles.studentRowContent}
        onPress={onSelectionToggle}
        activeOpacity={0.7}
      >
          {/* Student Avatar */}
          <View style={styles.avatarContainer}>
            {student.avatar ? (
              <Image source={{uri: student.avatar}} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, {backgroundColor: getAttendanceColor(student.attendance)}]}>
                <Text style={styles.avatarText}>
                  {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </Text>
              </View>
            )}
          </View>

          {/* Student Info */}
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentRoll}>Roll: {student.rollNumber}</Text>
            {student.lastAttendanceDate && (
              <Text style={styles.lastAttendance}>
                Last: {student.lastAttendanceDate}
              </Text>
            )}
          </View>

          {/* Attendance Status */}
          <View style={[styles.attendanceStatus, {backgroundColor: getAttendanceColor(student.attendance)}]}>
            <Text style={styles.attendanceIcon}>
              {getAttendanceIcon(student.attendance)}
            </Text>
            <Text style={styles.attendanceText}>
              {student.attendance || 'Unmarked'}
            </Text>
          </View>

          {/* Selection Indicator */}
          {isSelected && (
            <View style={styles.selectionIndicator}>
              <Text style={styles.selectionIcon}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
    padding: Spacing.LG,
  },
  header: {
    marginBottom: Spacing.LG,
    alignItems: 'center',
    position: 'relative',
  },
  classTitle: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight as any,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  dateText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  alertBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  alertText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginBottom: Spacing.LG,
  },
  statCard: {
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    marginRight: Spacing.SM,
    alignItems: 'center',
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
  },
  statLabel: {
    fontSize: 12,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS / 2,
  },
  batchOperations: {
    marginBottom: Spacing.LG,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  batchButton: {
    marginRight: Spacing.SM,
    minWidth: 120,
  },
  studentList: {
    flex: 1,
    marginBottom: Spacing.LG,
  },
  studentRow: {
    backgroundColor: LightTheme.Surface,
    marginBottom: Spacing.SM,
    borderRadius: BorderRadius.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedRow: {
    borderColor: LightTheme.Primary,
    borderWidth: 2,
  },
  studentRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.MD,
  },
  avatarContainer: {
    marginRight: Spacing.MD,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  studentRoll: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginTop: 2,
  },
  lastAttendance: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginTop: 2,
    fontStyle: 'italic',
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
  },
  attendanceIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  attendanceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: LightTheme.Primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitContainer: {
    paddingTop: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  submitButton: {
    width: '100%',
  },
});

export default EnhancedAttendanceManager;