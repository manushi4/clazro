/**
 * WebSidebar - Collapsible sidebar navigation for web
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/useAppTheme';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import { SidebarItem } from './SidebarItem';
import { AppText } from '../../ui/components/AppText';
import { SIDEBAR_WIDTH, NAVBAR_HEIGHT } from '../../constants/breakpoints';

interface TabItem {
  tabId: string;
  label: string;
  icon: string;
  badge?: number;
}

interface WebSidebarProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabPress: (tabId: string) => void;
  iconMap: Record<string, string>;
}

export const WebSidebar: React.FC<WebSidebarProps> = ({
  tabs,
  activeTabId,
  onTabPress,
  iconMap,
}) => {
  const { colors } = useAppTheme();
  const { isSidebarExpanded, toggleSidebar, isTablet } = useResponsiveContext();

  const sidebarWidth = isSidebarExpanded ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed;

  return (
    <View
      style={[
        styles.container,
        {
          width: sidebarWidth,
          backgroundColor: colors.surface,
          borderRightColor: colors.outlineVariant,
        },
      ]}
    >
      {/* Toggle Button */}
      {!isTablet && (
        <TouchableOpacity
          style={[styles.toggleButton, { borderColor: colors.outlineVariant }]}
          onPress={toggleSidebar}
          accessibilityLabel={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Icon
            name={isSidebarExpanded ? 'chevron-left' : 'chevron-right'}
            size={20}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      )}

      {/* Navigation Items */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSidebarExpanded && (
          <View style={styles.sectionHeader}>
            <AppText variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
              NAVIGATION
            </AppText>
          </View>
        )}

        {tabs.map((tab) => (
          <SidebarItem
            key={tab.tabId}
            icon={iconMap[tab.icon] || 'circle'}
            label={tab.label}
            isActive={activeTabId === tab.tabId}
            isExpanded={isSidebarExpanded}
            onPress={() => onTabPress(tab.tabId)}
            badge={tab.badge}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      {isSidebarExpanded && (
        <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
          <AppText variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
            v1.0.0
          </AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    borderRightWidth: 1,
    position: 'relative',
  },
  toggleButton: {
    position: 'absolute',
    right: -12,
    top: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
});

export default WebSidebar;
