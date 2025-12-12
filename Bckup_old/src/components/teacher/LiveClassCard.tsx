/**
 * LiveClassCard - Enhanced live class management component for teacher dashboard
 * Phase 10: Live Class Entry Point
 * Integrates with existing TeacherDashboard Control Center
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../core/CoachingButton';

export interface ClassSession {
  id: string;
  subject: string;
  grade: string;
  time: string;
  duration: string;
  status: 'upcoming' | 'live' | 'completed';
  studentsCount: number;
  attendanceRate: number;
  enrolledStudents?: number;
}

interface LiveClassCardProps {
  classSchedule: ClassSession[];
  onStartClass: (classId: string) => void;
  onJoinClass: (classId: string) => void;
  onControlClass: (classId: string) => void;
}

const LiveClassCard: React.FC<LiveClassCardProps> = ({
  classSchedule,
  onStartClass,
  onJoinClass,
  onControlClass,
}) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'live': 
        return '#4CAF50';
      case 'upcoming': 
        return '#FF9800';
      case 'completed': 
        return '#9E9E9E';
      default: 
        return LightTheme.OnSurfaceVariant;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'live': 
        return '🔴';
      case 'upcoming': 
        return '⏰';
      case 'completed': 
        return '✅';
      default: 
        return '📅';
    }
  };

  const renderClassCard = (classSession: ClassSession) => (
    <TouchableOpacity 
      key={classSession.id}
      style={[
        styles.classCard,
        classSession.status === 'live' && styles.liveClassCard
      ]}
      onPress={() => {
        if (classSession.status === 'live') {
          onControlClass(classSession.id);
        } else if (classSession.status === 'upcoming') {
          onStartClass(classSession.id);
        }
      }}
      activeOpacity={0.7}
      testID={`class-card-${classSession.id}`}
    >
      <View style={styles.classHeader}>
        <View style={styles.classInfo}>
          <Text style={styles.classSubject}>{classSession.subject}</Text>
          <Text style={styles.classGrade}>
            {classSession.grade} • {classSession.studentsCount} students
          </Text>
          <Text style={styles.classTime}>
            {classSession.time} • {classSession.duration}
          </Text>
        </View>
        
        <View style={styles.classActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(classSession.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(classSession.status)}</Text>
            <Text style={styles.statusText}>
              {classSession.status === 'live' ? 'LIVE' : classSession.status.toUpperCase()}
            </Text>
          </View>
          
          {classSession.status === 'live' && (
            <CoachingButton
              title="Control Class"
              variant="primary"
              size="small"
              onPress={() => onControlClass(classSession.id)}
              style={styles.actionButton}
              testID={`control-class-${classSession.id}`}
            />
          )}
          
          {classSession.status === 'upcoming' && (
            <CoachingButton
              title="Start Class"
              variant="secondary"
              size="small"
              onPress={() => onStartClass(classSession.id)}
              style={styles.actionButton}
              testID={`start-class-${classSession.id}`}
            />
          )}

          {classSession.status === 'completed' && (
            <CoachingButton
              title="View Report"
              variant="text"
              size="small"
              onPress={() => onJoinClass(classSession.id)}
              style={styles.actionButton}
              testID={`view-report-${classSession.id}`}
            />
          )}
        </View>
      </View>

      <View style={styles.attendanceSection}>
        <Text style={styles.attendanceLabel}>
          Attendance: {classSession.attendanceRate}%
        </Text>
        <View style={styles.attendanceBar}>
          <View 
            style={[
              styles.attendanceFill, 
              { width: `${classSession.attendanceRate}%` }
            ]}
          />
        </View>
        {classSession.status === 'live' && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!classSchedule || classSchedule.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📅</Text>
        <Text style={styles.emptyTitle}>No Classes Today</Text>
        <Text style={styles.emptyDescription}>
          Your schedule is clear. Use this time to prepare for tomorrow's classes!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>📋 Today's Classes</Text>
        <Text style={styles.classCount}>
          {classSchedule.length} {classSchedule.length === 1 ? 'class' : 'classes'}
        </Text>
      </View>
      
      {classSchedule.map(renderClassCard)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
    paddingHorizontal: Spacing.SM,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  classCount: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  classCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  liveClassCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    elevation: 4,
    shadowOpacity: 0.15,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  classInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  classSubject: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  classGrade: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  classTime: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  classActions: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.SM,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: Spacing.XS,
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButton: {
    minWidth: 100,
  },
  attendanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendanceLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    minWidth: 80,
  },
  attendanceBar: {
    flex: 1,
    height: 6,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 3,
    marginHorizontal: Spacing.SM,
  },
  attendanceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: Spacing.XS,
  },
  liveText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#4CAF50',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.XXL,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.MD,
    marginVertical: Spacing.MD,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.MD,
  },
  emptyTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  emptyDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    lineHeight: Typography.bodyMedium.lineHeight,
  },
});

export default LiveClassCard;