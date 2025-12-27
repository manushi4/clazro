/**
 * WebTopNav - Top navigation bar for web
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/useAppTheme';
import { useBranding } from '../../context/BrandingContext';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import { AppText } from '../../ui/components/AppText';
import { NAVBAR_HEIGHT, SIDEBAR_WIDTH } from '../../constants/breakpoints';

interface WebTopNavProps {
  notificationCount?: number;
  onMenuPress?: () => void;
}

export const WebTopNav: React.FC<WebTopNavProps> = ({
  notificationCount = 0,
  onMenuPress,
}) => {
  const { colors } = useAppTheme();
  const branding = useBranding();
  const navigation = useNavigation();
  const { isSidebarExpanded, toggleSidebar, isTablet } = useResponsiveContext();

  const handleNotificationPress = () => {
    navigation.navigate('notifications' as never);
  };

  const handleProfilePress = () => {
    navigation.navigate('edit-profile' as never);
  };

  const handleSettingsPress = () => {
    navigation.navigate('settings' as never);
  };

  return (
    <View style={[styles.container, {
      backgroundColor: colors.surface,
      borderBottomColor: colors.outlineVariant,
    }]}>
      {/* Left Section - Menu Toggle & Logo */}
      <View style={styles.leftSection}>
        {(isTablet || !isSidebarExpanded) && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={toggleSidebar}
            accessibilityLabel="Toggle sidebar"
          >
            <Icon name="menu" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        )}
        <View style={styles.logoContainer}>
          <AppText variant="titleMedium" style={{ color: colors.primary, fontWeight: '700' }}>
            {branding.appName || 'ManushiCoaching'}
          </AppText>
        </View>
      </View>

      {/* Center Section - Search */}
      <View style={styles.centerSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder="Search..."
            placeholderTextColor={colors.onSurfaceVariant}
          />
        </View>
      </View>

      {/* Right Section - Actions */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNotificationPress}
          accessibilityLabel={`Notifications, ${notificationCount} unread`}
        >
          <Icon name="bell-outline" size={24} color={colors.onSurface} />
          {notificationCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <AppText variant="labelSmall" style={styles.badgeText}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleSettingsPress}
          accessibilityLabel="Settings"
        >
          <Icon name="cog-outline" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: colors.primaryContainer }]}
          onPress={handleProfilePress}
          accessibilityLabel="Profile"
        >
          <Icon name="account" size={20} color={colors.onPrimaryContainer} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: NAVBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    maxWidth: 480,
    marginHorizontal: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    outlineStyle: 'none',
  } as any,
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default WebTopNav;
