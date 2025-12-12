/**
 * CollapsibleHeader Component
 * Based on LogRocket's proven pattern (2024)
 * Simple height interpolation with fixed constants
 */

import React, { useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface CollapsibleHeaderProps {
  children: React.ReactNode;
  backgroundColor?: string;
  maxHeight?: number;
  minHeight?: number;
}

interface CollapsibleHeaderReturn {
  headerComponent: React.ReactElement;
  onScroll: any;
  scrollEventThrottle: number;
}

/**
 * Hook to manage collapsible header behavior
 * Uses proven interpolation pattern from LogRocket
 */
export const useCollapsibleHeader = (
  props: CollapsibleHeaderProps
): CollapsibleHeaderReturn => {
  const {
    children,
    backgroundColor = '#FFFBFE',
    maxHeight = 250,
    minHeight = 60,
  } = props;

  // Animated scroll value
  const scrollY = useRef(new Animated.Value(0)).current;

  // Calculate scroll distance
  const SCROLL_DISTANCE = maxHeight - minHeight;

  // Interpolate header height
  const animatedHeaderHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [maxHeight, minHeight],
    extrapolate: 'clamp',
  });

  // Scroll event handler
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false } // Height animation requires useNativeDriver: false
  );

  // Header component with animated height
  const headerComponent = (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          height: animatedHeaderHeight,
          backgroundColor,
        },
      ]}
    >
      {children}
    </Animated.View>
  );

  return {
    headerComponent,
    onScroll,
    scrollEventThrottle: 16,
  };
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default useCollapsibleHeader;
