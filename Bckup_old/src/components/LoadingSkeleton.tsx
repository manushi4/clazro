import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LightTheme } from '../theme/Theme';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <LoadingSkeleton width="60%" height={24} style={{ marginBottom: 12 }} />
    <LoadingSkeleton width="100%" height={16} style={{ marginBottom: 8 }} />
    <LoadingSkeleton width="80%" height={16} style={{ marginBottom: 8 }} />
    <LoadingSkeleton width="90%" height={16} />
  </View>
);

export const ListItemSkeleton: React.FC = () => (
  <View style={styles.listItemSkeleton}>
    <LoadingSkeleton width={48} height={48} borderRadius={24} />
    <View style={styles.listItemContent}>
      <LoadingSkeleton width="70%" height={16} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width="50%" height={14} />
    </View>
  </View>
);

export const DashboardSkeleton: React.FC = () => (
  <View style={styles.dashboardSkeleton}>
    <LoadingSkeleton width="40%" height={32} style={{ marginBottom: 24 }} />

    <View style={styles.cardRow}>
      <LoadingSkeleton width="48%" height={120} borderRadius={12} />
      <LoadingSkeleton width="48%" height={120} borderRadius={12} />
    </View>

    <LoadingSkeleton width="100%" height={200} borderRadius={12} style={{ marginTop: 16 }} />

    <View style={styles.listSkeletonContainer}>
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: LightTheme.SurfaceVariant,
  },
  cardSkeleton: {
    padding: 16,
    backgroundColor: LightTheme.Surface,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: LightTheme.Surface,
    borderRadius: 8,
    marginBottom: 12,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  dashboardSkeleton: {
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listSkeletonContainer: {
    marginTop: 24,
  },
});

export default LoadingSkeleton;
