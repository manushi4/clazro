/**
 * Reusable Dashboard Layout Component
 * Wrap all dashboard screens with this for consistent layout
 */

import React from 'react';
import { ScrollView, RefreshControl, StyleSheet, View } from 'react-native';
import { Colors, Spacing } from '../../theme/designSystem';

interface DashboardLayoutProps {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  showPadding?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  refreshing = false,
  onRefresh,
  showPadding = true,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={showPadding && styles.contentContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
};

export const Section: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View style={styles.section}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  section: {
    padding: Spacing.lg,
    paddingTop: Spacing.base,
  },
});
