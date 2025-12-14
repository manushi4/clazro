/**
 * Skeleton Component
 * Loading placeholder with pulse animation
 *
 * Usage:
 * <Skeleton width="100%" height={20} radius="md" />
 * <SkeletonCard />
 * <SkeletonList count={3} />
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, ViewStyle } from 'react-native';
import { sx, SxProps } from '../theme/sx';
import { BorderRadius } from '../../theme/designSystem';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: keyof typeof BorderRadius;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  radius = 'md',
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        sx({ w: width, h: height, bg: 'surfaceVariant', radius }),
        { opacity },
        style,
      ]}
    />
  );
};

/**
 * Skeleton Card - Pre-built skeleton for card layouts
 */
export const SkeletonCard: React.FC = () => (
  <View style={sx({ p: 'base', bg: 'surface', radius: 'md', mb: 'base' })}>
    <Skeleton width="40%" height={16} style={sx({ mb: 'sm' })} />
    <Skeleton width="100%" height={12} style={sx({ mb: 'xs' })} />
    <Skeleton width="80%" height={12} />
  </View>
);

/**
 * Skeleton List - Multiple skeleton cards
 */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </>
);

/**
 * Skeleton Row - Horizontal layout with avatar and text
 */
export const SkeletonRow: React.FC = () => (
  <View style={[sx({ p: 'base', bg: 'surface', radius: 'md', mb: 'sm' }), { flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
    <Skeleton width={48} height={48} radius="full" />
    <View style={{ flex: 1 }}>
      <Skeleton width="60%" height={14} style={sx({ mb: 'xs' })} />
      <Skeleton width="40%" height={12} />
    </View>
  </View>
);
