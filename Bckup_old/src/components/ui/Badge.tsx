/**
 * Badge & Status Component Library - Coaching Management Platform
 * Complete Status Indicators with Material Design 3
 * 
 * Based on coaching research design specifications
 * Implements StatusBadge, PriorityIndicator, ProgressIndicator, and specialized badges
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../context/ThemeContext';
import {LabelText, BodyText, Caption} from './Typography';

// Design tokens from coaching research
const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
};

const BORDER_RADIUS = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  FULL: 50,
};

// Semantic colors from coaching research
const SEMANTIC_COLORS = {
  success: '#4CAF50',
  successLight: '#81C784',
  successDark: '#388E3C',
  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningDark: '#F57C00',
  error: '#F44336',
  errorLight: '#E57373',
  errorDark: '#D32F2F',
  info: '#2196F3',
  infoLight: '#64B5F6',
  infoDark: '#1976D2',
};

// Badge Types
export enum BadgeVariant {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
  Info = 'info',
  Neutral = 'neutral',
  Primary = 'primary',
}

export enum BadgeSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export enum Priority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

// Status Badge Props
interface StatusBadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
  style?: ViewStyle;
  testID?: string;
}

// Status Badge Component
const StatusBadge: React.FC<StatusBadgeProps> = ({
  text,
  variant = BadgeVariant.Neutral,
  size = BadgeSize.Medium,
  icon,
  style,
  testID,
}) => {
  const {theme} = useTheme();

  const getVariantColors = () => {
    switch (variant) {
      case BadgeVariant.success:
        return {
          background: SEMANTIC_COLORS.success + '20',
          text: SEMANTIC_COLORS.success,
          border: SEMANTIC_COLORS.success + '40',
        };
      case BadgeVariant.warning:
        return {
          background: SEMANTIC_COLORS.warning + '20',
          text: SEMANTIC_COLORS.warning,
          border: SEMANTIC_COLORS.warning + '40',
        };
      case BadgeVariant.error:
        return {
          background: SEMANTIC_COLORS.error + '20',
          text: SEMANTIC_COLORS.error,
          border: SEMANTIC_COLORS.error + '40',
        };
      case BadgeVariant.info:
        return {
          background: SEMANTIC_COLORS.info + '20',
          text: SEMANTIC_COLORS.info,
          border: SEMANTIC_COLORS.info + '40',
        };
      case BadgeVariant.primary:
        return {
          background: theme.primary + '20',
          text: theme.primary,
          border: theme.primary + '40',
        };
      default: // Neutral
        return {
          background: theme.SurfaceVariant,
          text: theme.OnSurfaceVariant,
          border: theme.Outline + '40',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case BadgeSize.Small:
        return {
          paddingHorizontal: SPACING.sm,
          paddingVertical: SPACING.xs,
          fontSize: 10,
          iconSize: 12,
          borderRadius: BORDER_RADIUS.xs,
        };
      case BadgeSize.Large:
        return {
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          fontSize: 14,
          iconSize: 18,
          borderRadius: BORDER_RADIUS.sm,
        };
      default: // Medium
        return {
          paddingHorizontal: SPACING.sm + 2,
          paddingVertical: SPACING.xs + 1,
          fontSize: 12,
          iconSize: 14,
          borderRadius: BORDER_RADIUS.xs + 2,
        };
    }
  };

  const colors = getVariantColors();
  const sizeConfig = getSizeConfig();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderRadius: sizeConfig.borderRadius,
        },
        style,
      ]}
      testID={testID}>
      
      {icon && (
        <Icon
          name={icon}
          size={sizeConfig.iconSize}
          color={colors.text}
          style={styles.badgeIcon}
        />
      )}
      
      <LabelText
        color={colors.text}
        style={{fontSize: sizeConfig.fontSize, fontWeight: '500'}}>
        {text}
      </LabelText>
    </View>
  );
};

// Priority Indicator Props
interface PriorityIndicatorProps {
  priority: Priority;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  testID?: string;
}

// Priority Indicator Component
const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  priority,
  showText = true,
  size = 'medium',
  style,
  testID,
}) => {
  const {theme} = useTheme();

  const getPriorityConfig = () => {
    switch (priority) {
      case Priority.High:
        return {
          color: SEMANTIC_COLORS.error,
          text: 'High Priority',
          icon: 'priority-high',
        };
      case Priority.Medium:
        return {
          color: SEMANTIC_COLORS.warning,
          text: 'Medium Priority',
          icon: 'remove',
        };
      case Priority.Low:
        return {
          color: SEMANTIC_COLORS.success,
          text: 'Low Priority',
          icon: 'keyboard-arrow-down',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {dotSize: 6, iconSize: 16, fontSize: 12};
      case 'large':
        return {dotSize: 12, iconSize: 24, fontSize: 16};
      default:
        return {dotSize: 8, iconSize: 20, fontSize: 14};
    }
  };

  const priorityConfig = getPriorityConfig();
  const sizeConfig = getSizeConfig();

  return (
    <View style={[styles.priorityContainer, style]} testID={testID}>
      <View
        style={[
          styles.priorityDot,
          {
            width: sizeConfig.dotSize,
            height: sizeConfig.dotSize,
            backgroundColor: priorityConfig.color,
            borderRadius: sizeConfig.dotSize / 2,
          },
        ]}
      />
      
      {showText && (
        <BodyText
          size={size === 'small' ? 'small' : 'medium'}
          color={theme.OnSurfaceVariant}
          style={styles.priorityText}>
          {priorityConfig.text}
        </BodyText>
      )}
    </View>
  );
};

// Progress Badge Props
interface ProgressBadgeProps {
  progress: number; // 0-100
  total?: number;
  label?: string;
  variant?: 'circular' | 'linear';
  size?: BadgeSize;
  showPercentage?: boolean;
  style?: ViewStyle;
  testID?: string;
}

// Progress Badge Component
const ProgressBadge: React.FC<ProgressBadgeProps> = ({
  progress,
  total,
  label,
  variant = 'linear',
  size = BadgeSize.Medium,
  showPercentage = true,
  style,
  testID,
}) => {
  const {theme} = useTheme();
  const progressPercentage = Math.min(Math.max(progress, 0), 100);

  const getSizeConfig = () => {
    switch (size) {
      case BadgeSize.Small:
        return {
          height: 16,
          fontSize: 10,
          circularSize: 32,
        };
      case BadgeSize.Large:
        return {
          height: 24,
          fontSize: 14,
          circularSize: 56,
        };
      default:
        return {
          height: 20,
          fontSize: 12,
          circularSize: 44,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  const getProgressColor = () => {
    if (progressPercentage >= 80) return SEMANTIC_COLORS.success;
    if (progressPercentage >= 50) return SEMANTIC_COLORS.info;
    if (progressPercentage >= 25) return SEMANTIC_COLORS.warning;
    return SEMANTIC_COLORS.error;
  };

  const progressColor = getProgressColor();

  if (variant === 'circular') {
    const circumference = 2 * Math.PI * (sizeConfig.circularSize / 2 - 4);
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

    return (
      <View style={[styles.circularProgressContainer, style]} testID={testID}>
        <View
          style={[
            styles.circularProgress,
            {
              width: sizeConfig.circularSize,
              height: sizeConfig.circularSize,
            },
          ]}>
          
          {/* Background Circle */}
          <View
            style={[
              styles.circularProgressBackground,
              {
                width: sizeConfig.circularSize,
                height: sizeConfig.circularSize,
                borderRadius: sizeConfig.circularSize / 2,
                borderColor: theme.Outline + '40',
              },
            ]}
          />
          
          {/* Progress Text */}
          <View style={styles.circularProgressContent}>
            <BodyText
              size={size === BadgeSize.Small ? 'small' : 'medium'}
              color={theme.OnSurface}
              style={[styles.progressText, {fontWeight: '600'}]}>
              {showPercentage ? `${progressPercentage}%` : `${progress}${total ? `/${total}` : ''}`}
            </BodyText>
            {label && (
              <Caption color={theme.OnSurfaceVariant}>
                {label}
              </Caption>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.linearProgressContainer, style]} testID={testID}>
      {label && (
        <View style={styles.progressHeader}>
          <BodyText
            size="small"
            color={theme.OnSurface}
            style={styles.progressLabel}>
            {label}
          </BodyText>
          {showPercentage && (
            <BodyText
              size="small"
              color={progressColor}
              style={styles.progressPercentage}>
              {progressPercentage}%
            </BodyText>
          )}
        </View>
      )}
      
      <View
        style={[
          styles.progressTrack,
          {
            height: sizeConfig.height,
            backgroundColor: theme.SurfaceVariant,
            borderRadius: sizeConfig.height / 2,
          },
        ]}>
        
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercentage}%`,
              height: sizeConfig.height,
              backgroundColor: progressColor,
              borderRadius: sizeConfig.height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

// Notification Badge Props
interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'error' | 'primary' | 'success';
  style?: ViewStyle;
  testID?: string;
}

// Notification Badge Component
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  size = 'medium',
  variant = 'error',
  style,
  testID,
}) => {
  const {theme} = useTheme();

  if (count <= 0) return null;

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          minWidth: 16,
          height: 16,
          fontSize: 10,
        };
      case 'large':
        return {
          minWidth: 24,
          height: 24,
          fontSize: 14,
        };
      default:
        return {
          minWidth: 20,
          height: 20,
          fontSize: 12,
        };
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'primary':
        return theme.primary;
      case 'success':
        return SEMANTIC_COLORS.success;
      default:
        return SEMANTIC_COLORS.error;
    }
  };

  const sizeConfig = getSizeConfig();
  const backgroundColor = getVariantColor();
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <View
      style={[
        styles.notificationBadge,
        {
          backgroundColor,
          minWidth: sizeConfig.minWidth,
          height: sizeConfig.height,
          borderRadius: sizeConfig.height / 2,
        },
        style,
      ]}
      testID={testID}>
      
      <LabelText
        color="#FFFFFF"
        style={[
          styles.notificationText,
          {fontSize: sizeConfig.fontSize, fontWeight: '600'},
        ]}>
        {displayCount}
      </LabelText>
    </View>
  );
};

// Online Status Indicator
interface OnlineStatusProps {
  isOnline: boolean;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({
  isOnline,
  size = 'medium',
  showText = false,
  style,
  testID,
}) => {
  const {theme} = useTheme();

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {dotSize: 8, fontSize: 10};
      case 'large':
        return {dotSize: 16, fontSize: 14};
      default:
        return {dotSize: 12, fontSize: 12};
    }
  };

  const sizeConfig = getSizeConfig();
  const statusColor = isOnline ? SEMANTIC_COLORS.success : theme.Outline;
  const statusText = isOnline ? 'Online' : 'Offline';

  return (
    <View style={[styles.onlineStatusContainer, style]} testID={testID}>
      <View
        style={[
          styles.onlineStatusDot,
          {
            width: sizeConfig.dotSize,
            height: sizeConfig.dotSize,
            backgroundColor: statusColor,
            borderRadius: sizeConfig.dotSize / 2,
          },
        ]}
      />
      
      {showText && (
        <BodyText
          size={size === 'small' ? 'small' : 'medium'}
          color={theme.OnSurfaceVariant}
          style={styles.onlineStatusText}>
          {statusText}
        </BodyText>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  
  badgeIcon: {
    marginRight: SPACING.xs,
  },
  
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  priorityDot: {
    marginRight: SPACING.sm,
  },
  
  priorityText: {
    fontSize: 12,
  },
  
  circularProgressContainer: {
    alignItems: 'center',
  },
  
  circularProgress: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  circularProgressBackground: {
    position: 'absolute',
    borderWidth: 2,
  },
  
  circularProgressContent: {
    alignItems: 'center',
  },
  
  progressText: {
    textAlign: 'center',
  },
  
  linearProgressContainer: {
    width: '100%',
  },
  
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  
  progressLabel: {
    flex: 1,
  },
  
  progressPercentage: {
    fontWeight: '600',
  },
  
  progressTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  
  progressFill: {
    borderRadius: 10,
  },
  
  notificationBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  
  notificationText: {
    textAlign: 'center',
  },
  
  onlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  onlineStatusDot: {
    marginRight: SPACING.sm,
  },
  
  onlineStatusText: {
    fontSize: 12,
  },
});

export default StatusBadge;