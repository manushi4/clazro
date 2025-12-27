/**
 * ResponsiveContainer - Max-width container centered on large screens
 */

import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import { CONTAINER_MAX_WIDTH } from '../../constants/breakpoints';
import type { ContainerProps } from '../../types/responsive.types';

interface ResponsiveContainerProps extends ContainerProps {
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: object;
  contentStyle?: object;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  maxWidth = 'xl',
  centered = true,
  padding = 16,
  scrollable = true,
  refreshing = false,
  onRefresh,
  style,
  contentStyle,
  children,
}) => {
  const { colors } = useAppTheme();
  const { isDesktop, isWeb } = useResponsiveContext();

  const containerMaxWidth = CONTAINER_MAX_WIDTH[maxWidth];

  const containerStyle = [
    styles.container,
    isWeb && isDesktop && centered && {
      maxWidth: containerMaxWidth,
      marginHorizontal: 'auto',
    },
    { padding },
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[containerStyle, contentStyle]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.scroll, { backgroundColor: colors.background }]}>
      <View style={[containerStyle, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    width: '100%',
  },
});

export default ResponsiveContainer;
