/**
 * AttendanceIndicator - Individual participant attendance status indicator
 * Phase 12: Attendance Tracking UI
 * Shows individual participant attendance status with visual indicators
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LightTheme, SemanticColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'left-early';

interface AttendanceIndicatorProps {
  status: AttendanceStatus;
  joinTime?: Date;
  leaveTime?: Date;
  classStartTime?: Date;
  onTimeThreshold?: number; // minutes after class start considered "on time"
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showTime?: boolean;
}

const AttendanceIndicator: React.FC<AttendanceIndicatorProps> = ({
  status,
  joinTime,
  leaveTime,
  classStartTime,
  onTimeThreshold = 5,
  size = 'medium',
  showLabel = true,
  showTime = false,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'present':
        return {
          icon: '✅',
          label: 'Present',
          color: SemanticColors.Success,
          backgroundColor: SemanticColors.Success + '20',
        };
      case 'late':
        return {
          icon: '⏰',
          label: 'Late',
          color: SemanticColors.Warning,
          backgroundColor: SemanticColors.Warning + '20',
        };
      case 'absent':
        return {
          icon: '❌',
          label: 'Absent',
          color: SemanticColors.Error,
          backgroundColor: SemanticColors.Error + '20',
        };
      case 'left-early':
        return {
          icon: '🚪',
          label: 'Left Early',
          color: SemanticColors.Warning,
          backgroundColor: SemanticColors.Warning + '20',
        };
      default:
        return {
          icon: '❓',
          label: 'Unknown',
          color: LightTheme.OnSurfaceVariant,
          backgroundColor: LightTheme.SurfaceVariant,
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          containerSize: 24,
          iconSize: 12,
          labelSize: Typography.bodySmall.fontSize,
          padding: Spacing.XS / 2,
        };
      case 'large':
        return {
          containerSize: 48,
          iconSize: 20,
          labelSize: Typography.bodyLarge.fontSize,
          padding: Spacing.SM,
        };
      default: // medium
        return {
          containerSize: 32,
          iconSize: 16,
          labelSize: Typography.bodyMedium.fontSize,
          padding: Spacing.XS,
        };
    }
  };

  const calculateLateTime = (): string | null => {
    if (!joinTime || !classStartTime || status !== 'late') return null;
    
    const lateMinutes = Math.floor(
      (joinTime.getTime() - classStartTime.getTime()) / (1000 * 60)
    );
    
    if (lateMinutes < 1) return null;
    if (lateMinutes < 60) return `${lateMinutes}m late`;
    
    const hours = Math.floor(lateMinutes / 60);
    const minutes = lateMinutes % 60;
    return `${hours}h ${minutes}m late`;
  };

  const calculateEarlyLeave = (): string | null => {
    if (!leaveTime || status !== 'left-early') return null;
    
    const now = new Date();
    const leftEarlyMinutes = Math.floor(
      (now.getTime() - leaveTime.getTime()) / (1000 * 60)
    );
    
    if (leftEarlyMinutes < 1) return 'Just left';
    if (leftEarlyMinutes < 60) return `Left ${leftEarlyMinutes}m ago`;
    
    const hours = Math.floor(leftEarlyMinutes / 60);
    const minutes = leftEarlyMinutes % 60;
    return `Left ${hours}h ${minutes}m ago`;
  };

  const getTimeDisplay = (): string | null => {
    if (!showTime) return null;
    
    switch (status) {
      case 'late':
        return calculateLateTime();
      case 'left-early':
        return calculateEarlyLeave();
      case 'present':
        if (joinTime && classStartTime) {
          const joinDelay = Math.floor(
            (joinTime.getTime() - classStartTime.getTime()) / (1000 * 60)
          );
          return joinDelay <= onTimeThreshold ? 'On time' : calculateLateTime();
        }
        return null;
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = getSizeConfig();
  const timeDisplay = getTimeDisplay();

  return (
    <View style={styles.container} testID={`attendance-indicator-${status}`}>
      <View
        style={[
          styles.indicator,
          {
            width: sizeConfig.containerSize,
            height: sizeConfig.containerSize,
            backgroundColor: statusConfig.backgroundColor,
            borderColor: statusConfig.color,
          }
        ]}
      >
        <Text
          style={[
            styles.icon,
            {
              fontSize: sizeConfig.iconSize,
            }
          ]}
        >
          {statusConfig.icon}
        </Text>
      </View>
      
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              {
                fontSize: sizeConfig.labelSize,
                color: statusConfig.color,
              }
            ]}
          >
            {statusConfig.label}
          </Text>
          
          {timeDisplay && (
            <Text style={styles.timeText}>
              {timeDisplay}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// Quick Status Dot Component for compact spaces
interface AttendanceStatusDotProps {
  status: AttendanceStatus;
  size?: number;
}

const AttendanceStatusDot: React.FC<AttendanceStatusDotProps> = ({
  status,
  size = 8,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'present':
        return SemanticColors.Success;
      case 'late':
        return SemanticColors.Warning;
      case 'absent':
        return SemanticColors.Error;
      case 'left-early':
        return SemanticColors.Warning;
      default:
        return LightTheme.OnSurfaceVariant;
    }
  };

  return (
    <View
      style={[
        styles.statusDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getStatusColor(),
        }
      ]}
      testID={`attendance-dot-${status}`}
      accessibilityLabel={`Attendance status: ${status}`}
    />
  );
};

// Attendance Summary Badge Component
interface AttendanceSummaryProps {
  presentCount: number;
  totalCount: number;
  size?: 'small' | 'medium';
}

const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({
  presentCount,
  totalCount,
  size = 'medium',
}) => {
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  
  const getPercentageColor = () => {
    if (percentage >= 90) return SemanticColors.Success;
    if (percentage >= 75) return SemanticColors.Warning;
    return SemanticColors.Error;
  };

  const fontSize = size === 'small' ? Typography.bodySmall.fontSize : Typography.bodyMedium.fontSize;

  return (
    <View style={styles.summaryContainer} testID="attendance-summary">
      <View style={styles.summaryContent}>
        <Text style={[styles.summaryText, { fontSize }]}>
          {presentCount}/{totalCount}
        </Text>
        <Text
          style={[
            styles.percentageText,
            {
              fontSize: fontSize - 2,
              color: getPercentageColor(),
            }
          ]}
        >
          ({percentage}%)
        </Text>
      </View>
      
      <AttendanceStatusDot
        status={percentage >= 90 ? 'present' : percentage >= 75 ? 'late' : 'absent'}
        size={size === 'small' ? 6 : 8}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  indicator: {
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon: {
    textAlign: 'center',
  },
  labelContainer: {
    alignItems: 'center',
    marginTop: Spacing.XS / 2,
  },
  label: {
    fontWeight: '500',
    textAlign: 'center',
  },
  timeText: {
    fontSize: Typography.bodySmall.fontSize - 1,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
  },
  statusDot: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.XS,
  },
  summaryText: {
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  percentageText: {
    marginLeft: Spacing.XS / 2,
    fontWeight: '500',
  },
});

export default AttendanceIndicator;