/**
 * StatusBadge - Core status indicator component
 * Used for assignment status, payment status, user status, etc.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LightTheme, SemanticColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

export type BadgeType = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'small' | 'medium' | 'large';

interface StatusBadgeProps {
  text: string;
  type: BadgeType;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  text,
  type,
  size = 'medium',
  icon,
  style,
  textStyle,
  testID,
}) => {
  const getBadgeColors = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: SemanticColors.Success + '20',
          textColor: SemanticColors.successDark,
          borderColor: SemanticColors.Success + '40',
        };
      case 'warning':
        return {
          backgroundColor: SemanticColors.Warning + '20',
          textColor: SemanticColors.warningDark,
          borderColor: SemanticColors.Warning + '40',
        };
      case 'error':
        return {
          backgroundColor: SemanticColors.Error + '20',
          textColor: SemanticColors.errorDark,
          borderColor: SemanticColors.Error + '40',
        };
      case 'info':
        return {
          backgroundColor: SemanticColors.Info + '20',
          textColor: SemanticColors.infoDark,
          borderColor: SemanticColors.Info + '40',
        };
      case 'primary':
        return {
          backgroundColor: LightTheme.Primary + '20',
          textColor: LightTheme.Primary,
          borderColor: LightTheme.Primary + '40',
        };
      default: // neutral
        return {
          backgroundColor: LightTheme.SurfaceVariant,
          textColor: LightTheme.OnSurfaceVariant,
          borderColor: LightTheme.OutlineVariant,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: Spacing.SM,
          paddingVertical: Spacing.XS / 2,
          fontSize: Typography.labelSmall.fontSize,
          iconSize: 12,
        };
      case 'large':
        return {
          paddingHorizontal: Spacing.MD,
          paddingVertical: Spacing.SM,
          fontSize: Typography.labelLarge.fontSize,
          iconSize: 18,
        };
      default: // medium
        return {
          paddingHorizontal: Spacing.SM + 2,
          paddingVertical: Spacing.XS,
          fontSize: Typography.labelMedium.fontSize,
          iconSize: 14,
        };
    }
  };

  const colors = getBadgeColors();
  const sizes = getSizeStyles();

  const badgeStyle: ViewStyle = {
    backgroundColor: colors.backgroundColor,
    borderRadius: BorderRadius.XS + 2,
    paddingHorizontal: sizes.paddingHorizontal,
    paddingVertical: sizes.paddingVertical,
    borderWidth: 0.5,
    borderColor: colors.borderColor,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  };

  const badgeTextStyle: TextStyle = {
    color: colors.textColor,
    fontSize: sizes.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: Typography.labelMedium.fontWeight,
    letterSpacing: Typography.labelMedium.letterSpacing,
  };

  return (
    <View 
      style={[badgeStyle, style]} 
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${text}`}
    >
      {icon && (
        <View style={[styles.iconContainer, { marginRight: text ? Spacing.XS : 0 }]}>
          {icon}
        </View>
      )}
      {text && (
        <Text style={[badgeTextStyle, textStyle]}>
          {text}
        </Text>
      )}
    </View>
  );
};

// Priority Indicator Component
export type PriorityLevel = 'high' | 'medium' | 'low';

interface PriorityIndicatorProps {
  priority: PriorityLevel;
  showText?: boolean;
  size?: BadgeSize;
  style?: ViewStyle;
  testID?: string;
}

const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  priority,
  showText = true,
  size = 'medium',
  style,
  testID,
}) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'high':
        return {
          type: 'error' as BadgeType,
          text: 'High Priority',
          shortText: 'High',
          dotColor: SemanticColors.Error,
        };
      case 'medium':
        return {
          type: 'warning' as BadgeType,
          text: 'Medium Priority',
          shortText: 'Medium',
          dotColor: SemanticColors.Warning,
        };
      default: // low
        return {
          type: 'success' as BadgeType,
          text: 'Low Priority',
          shortText: 'Low',
          dotColor: SemanticColors.Success,
        };
    }
  };

  const config = getPriorityConfig();

  if (!showText) {
    return (
      <View 
        style={[styles.priorityDot, { backgroundColor: config.dotColor }, style]}
        testID={testID}
        accessibilityRole="image"
        accessibilityLabel={config.text}
      />
    );
  }

  const icon = (
    <View style={[styles.priorityDotSmall, { backgroundColor: config.dotColor }]} />
  );

  return (
    <StatusBadge
      text={config.shortText}
      type={config.type}
      size={size}
      icon={icon}
      style={style}
      testID={testID}
    />
  );
};

// Assignment Status Badge Component
export type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'overdue' | 'draft';

interface AssignmentStatusBadgeProps {
  status: AssignmentStatus;
  size?: BadgeSize;
  style?: ViewStyle;
  testID?: string;
}

const AssignmentStatusBadge: React.FC<AssignmentStatusBadgeProps> = ({
  status,
  size = 'medium',
  style,
  testID,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'submitted':
        return {
          type: 'success' as BadgeType,
          text: 'Submitted',
        };
      case 'graded':
        return {
          type: 'primary' as BadgeType,
          text: 'Graded',
        };
      case 'overdue':
        return {
          type: 'error' as BadgeType,
          text: 'Overdue',
        };
      case 'draft':
        return {
          type: 'neutral' as BadgeType,
          text: 'Draft',
        };
      default: // pending
        return {
          type: 'warning' as BadgeType,
          text: 'Pending',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <StatusBadge
      text={config.text}
      type={config.type}
      size={size}
      style={style}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default StatusBadge;