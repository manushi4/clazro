/**
 * QuickStats - Stats bar for admin dashboards
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import { useResponsiveContext } from '../../context/ResponsiveContext';

export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: string;
  color?: string;
  onPress?: () => void;
}

interface QuickStatsProps {
  stats: StatItem[];
  style?: object;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  stats,
  style,
}) => {
  const { colors } = useAppTheme();
  const { isMobile, isTablet } = useResponsiveContext();

  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return colors.success || '#4CAF50';
      case 'decrease':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'arrow-up';
      case 'decrease':
        return 'arrow-down';
      default:
        return 'minus';
    }
  };

  // Responsive column count
  const columns = isMobile ? 2 : isTablet ? 3 : stats.length;
  const itemWidth = `${100 / columns}%`;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
      {stats.map((stat, index) => {
        const isLast = (index + 1) % columns === 0 || index === stats.length - 1;
        const StatWrapper = stat.onPress ? Pressable : View;

        return (
          <StatWrapper
            key={stat.id}
            style={[
              styles.stat,
              { width: itemWidth as any },
              !isLast && { borderRightWidth: 1, borderRightColor: colors.outlineVariant },
              stat.onPress && styles.statClickable,
            ]}
            // @ts-ignore
            onPress={stat.onPress}
          >
            {/* Icon */}
            {stat.icon && (
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: (stat.color || colors.primary) + '15' },
                ]}
              >
                <Icon
                  name={stat.icon}
                  size={20}
                  color={stat.color || colors.primary}
                />
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              <AppText style={[styles.value, { color: colors.onSurface }]}>
                {stat.value}
              </AppText>
              <AppText style={[styles.label, { color: colors.onSurfaceVariant }]}>
                {stat.label}
              </AppText>
            </View>

            {/* Change indicator */}
            {stat.change && (
              <View style={styles.changeContainer}>
                <Icon
                  name={getChangeIcon(stat.change.type)}
                  size={14}
                  color={getChangeColor(stat.change.type)}
                />
                <AppText
                  style={[
                    styles.changeText,
                    { color: getChangeColor(stat.change.type) },
                  ]}
                >
                  {Math.abs(stat.change.value)}%
                </AppText>
              </View>
            )}
          </StatWrapper>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  statClickable: {
    // @ts-ignore - Web specific
    cursor: 'pointer',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  label: {
    fontSize: 12,
    marginTop: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default QuickStats;
