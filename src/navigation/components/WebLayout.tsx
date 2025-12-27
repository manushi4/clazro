/**
 * WebLayout - Container with sidebar + content area
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import { SIDEBAR_WIDTH, NAVBAR_HEIGHT } from '../../constants/breakpoints';

interface WebLayoutProps {
  sidebar: React.ReactNode;
  topNav: React.ReactNode;
  children: React.ReactNode;
}

export const WebLayout: React.FC<WebLayoutProps> = ({
  sidebar,
  topNav,
  children,
}) => {
  const { colors } = useAppTheme();
  const { isSidebarExpanded, isTablet, isMobile } = useResponsiveContext();

  const sidebarWidth = isSidebarExpanded ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed;

  // On mobile, hide sidebar completely
  if (isMobile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {topNav}
        <View style={styles.mobileContent}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Navigation */}
      {topNav}

      {/* Main Content Area */}
      <View style={styles.mainContainer}>
        {/* Sidebar */}
        {sidebar}

        {/* Content */}
        <View style={[styles.content, { marginLeft: 0 }]}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  mobileContent: {
    flex: 1,
  },
});

export default WebLayout;
