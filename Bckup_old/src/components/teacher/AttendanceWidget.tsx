/**
 * AttendanceWidget - Live attendance statistics and summary display
 * Phase 12: Attendance Tracking UI
 * Shows real-time attendance metrics for live classes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Participant } from './ParticipantCard';

export interface AttendanceStats {
  totalStudents: number;
  presentStudents: number;
  lateJoins: number;
  attendancePercentage: number;
  averageJoinTime: number; // in minutes after class start
  onTimeStudents: number;
}

interface AttendanceWidgetProps {
  participants: Participant[];
  classStartTime?: Date;
  expectedStudents?: number;
  onTimeThreshold?: number; // minutes after class start considered "on time"
}

const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({
  participants,
  classStartTime,
  expectedStudents = 0,
  onTimeThreshold = 5, // 5 minutes grace period
}) => {
  const calculateAttendanceStats = (): AttendanceStats => {
    const students = participants.filter(p => p.role === 'student');
    const presentStudents = students.filter(p => p.isPresent);
    const totalStudents = Math.max(students.length, expectedStudents);
    
    let lateJoins = 0;
    let onTimeStudents = 0;
    let totalJoinTime = 0;
    
    if (classStartTime) {
      presentStudents.forEach(student => {
        const joinDelay = (student.joinTime.getTime() - classStartTime.getTime()) / (1000 * 60);
        totalJoinTime += Math.max(0, joinDelay);
        
        if (joinDelay <= onTimeThreshold) {
          onTimeStudents++;
        } else {
          lateJoins++;
        }
      });
    }
    
    const attendancePercentage = totalStudents > 0 ? 
      Math.round((presentStudents.length / totalStudents) * 100) : 0;
      
    const averageJoinTime = presentStudents.length > 0 ? 
      totalJoinTime / presentStudents.length : 0;
    
    return {
      totalStudents,
      presentStudents: presentStudents.length,
      lateJoins,
      attendancePercentage,
      averageJoinTime,
      onTimeStudents,
    };
  };

  const stats = calculateAttendanceStats();

  const getAttendanceColor = (percentage: number): string => {
    if (percentage >= 90) return '#4CAF50'; // Excellent - Green
    if (percentage >= 75) return '#8BC34A'; // Good - Light Green
    if (percentage >= 60) return '#FF9800'; // Fair - Orange
    return '#F44336'; // Poor - Red
  };

  const getAttendanceGrade = (percentage: number): string => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Fair';
    return 'Poor';
  };

  const formatJoinTime = (minutes: number): string => {
    if (minutes < 1) return 'On time';
    if (minutes < 60) return `${Math.round(minutes)}m late`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m late`;
  };

  return (
    <View style={styles.container} testID="attendance-widget">
      <View style={styles.header}>
        <Text style={styles.title}>📊 Attendance Overview</Text>
        <View style={[
          styles.gradeChip,
          { backgroundColor: getAttendanceColor(stats.attendancePercentage) + '20' }
        ]}>
          <Text style={[
            styles.gradeText,
            { color: getAttendanceColor(stats.attendancePercentage) }
          ]}>
            {getAttendanceGrade(stats.attendancePercentage)}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {/* Main Attendance Percentage */}
        <View style={styles.mainStat}>
          <Text style={[
            styles.mainPercentage,
            { color: getAttendanceColor(stats.attendancePercentage) }
          ]}>
            {stats.attendancePercentage}%
          </Text>
          <Text style={styles.mainLabel}>Overall Attendance</Text>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${stats.attendancePercentage}%`,
                  backgroundColor: getAttendanceColor(stats.attendancePercentage)
                }
              ]}
            />
          </View>
        </View>

        {/* Detailed Statistics */}
        <View style={styles.detailStats}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>{stats.presentStudents}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📋</Text>
              <Text style={styles.statValue}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Expected</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{stats.onTimeStudents}</Text>
              <Text style={styles.statLabel}>On Time</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏰</Text>
              <Text style={styles.statValue}>{stats.lateJoins}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Additional Insights */}
      {classStartTime && (
        <View style={styles.insights}>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>⏱️</Text>
            <Text style={styles.insightText}>
              Average join time: {formatJoinTime(stats.averageJoinTime)}
            </Text>
          </View>
          
          {stats.lateJoins > 0 && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>⚠️</Text>
              <Text style={styles.insightText}>
                {stats.lateJoins} student{stats.lateJoins > 1 ? 's' : ''} joined late
              </Text>
            </View>
          )}
          
          {stats.attendancePercentage < 75 && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>📢</Text>
              <Text style={styles.insightText}>
                Consider sending reminders for better attendance
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginVertical: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  title: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  gradeChip: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  gradeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  statsGrid: {
    marginBottom: Spacing.LG,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  mainPercentage: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: Spacing.SM,
  },
  mainLabel: {
    fontSize: Typography.bodyLarge.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailStats: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    padding: Spacing.MD,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.SM,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: Spacing.XS,
  },
  statValue: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  insights: {
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
    paddingTop: Spacing.MD,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: Spacing.SM,
  },
  insightText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    flex: 1,
  },
});

export default AttendanceWidget;