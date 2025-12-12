/**
 * DashboardCard - Core card component for dashboard sections
 * Implements Material Design 3 card specifications
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius, Elevation } from '../../theme/spacing';

export type DashboardCardVariant = 'elevated' | 'filled' | 'outlined';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: DashboardCardVariant;
  onPress?: () => void;
  headerAction?: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  children,
  variant = 'elevated',
  onPress,
  headerAction,
  style,
  contentStyle,
  testID,
}) => {
  const getCardStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.MD,
      padding: Spacing.MD,
      marginBottom: Spacing.MD,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: LightTheme.Surface,
          shadowColor: LightTheme.OnSurface,
          shadowOffset: {
            width: 0,
            height: Elevation.Level1,
          },
          shadowOpacity: 0.1,
          shadowRadius: Elevation.Level2,
          elevation: Elevation.Level1,
        };
      
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: LightTheme.SurfaceVariant,
        };
      
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: LightTheme.Surface,
          borderWidth: 1,
          borderColor: LightTheme.OutlineVariant,
        };
      
      default:
        return {
          ...baseStyle,
          backgroundColor: LightTheme.Surface,
          elevation: Elevation.Level1,
        };
    }
  };

  const CardContent = () => (
    <View style={[getCardStyles(), style]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
        {headerAction && (
          <View style={styles.headerAction}>
            {headerAction}
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${title} card`}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} accessibilityRole="text" accessibilityLabel={`${title} section`}>
      <CardContent />
    </View>
  );
};

// Statistics Card Component
interface StatisticsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  change,
  icon,
  color = LightTheme.Primary,
  onPress,
  style,
  testID,
}) => {
  const CardContent = () => (
    <View style={[styles.statisticsCard, style]}>
      {/* Icon and Title Row */}
      <View style={styles.statisticsHeader}>
        {icon && (
          <View style={[styles.statisticsIcon, { backgroundColor: color + '20' }]}>
            {icon}
          </View>
        )}
        <Text style={styles.statisticsTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Value Display */}
      <Text style={[styles.statisticsValue, { color: color }]}>
        {value}
      </Text>

      {/* Change Indicator */}
      {change && (
        <View style={styles.changeContainer}>
          <Text
            style={[
              styles.changeText,
              {
                color: change.isPositive
                  ? LightTheme.Primary
                  : LightTheme.Error,
              },
            ]}
          >
            {change.isPositive ? '↗' : '↘'} {Math.abs(change.value)}%
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${value}`}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} accessibilityRole="text" accessibilityLabel={`${title}: ${value}`}>
      <CardContent />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    letterSpacing: Typography.titleMedium.letterSpacing,
  },
  subtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
    letterSpacing: Typography.bodyMedium.letterSpacing,
  },
  headerAction: {
    marginLeft: Spacing.SM,
  },
  content: {
    // Content styles can be customized via contentStyle prop
  },
  statisticsCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    shadowColor: LightTheme.OnSurface,
    shadowOffset: {
      width: 0,
      height: Elevation.Level1,
    },
    shadowOpacity: 0.1,
    shadowRadius: Elevation.Level2,
    elevation: Elevation.Level1,
    minHeight: 120,
  },
  statisticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  statisticsIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.SM,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.SM,
  },
  statisticsTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    flex: 1,
  },
  statisticsValue: {
    fontSize: Typography.headlineMedium.fontSize,
    fontFamily: Typography.headlineMedium.fontFamily,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: Typography.labelMedium.fontWeight,
  },
});

export default DashboardCard;