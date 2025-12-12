/**
 * Top App Bar Component (MD3 Compliant)
 * Material Design 3 Small Top App Bar - 64dp
 *
 * Structure:
 * Leading: ☰ (menu) or ← (back)
 * Title: Center-aligned, 20sp/600
 * Trailing: Max 2 actions (notification + overflow)
 *
 * Usage:
 * <TopAppBar
 *   title="Dashboard"
 *   leadingType="menu"
 *   onMenuPress={() => {}}
 *   notificationCount={5}
 *   onNotificationPress={() => {}}
 *   onOverflowPress={() => {}}
 * />
 */

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { IconButton, Menu } from 'react-native-paper';
import { T } from '../../ui/typography/T';
import { Colors, Layout, Spacing, Shadows } from '../../theme/designSystem';

export interface OverflowMenuItem {
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
}

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  leadingType?: 'menu' | 'back'; // ☰ or ←
  onLeadingPress?: () => void; // Menu or back action
  notificationCount?: number;
  onNotificationPress?: () => void;
  onOverflowPress?: () => void; // ⋯ overflow menu (deprecated - use overflowMenuItems)
  overflowMenuItems?: OverflowMenuItem[]; // New: Menu items for overflow
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  subtitle,
  leadingType = 'menu',
  onLeadingPress,
  notificationCount = 0,
  onNotificationPress,
  onOverflowPress,
  overflowMenuItems,
}) => {
  const [menuVisible, setMenuVisible] = React.useState(false);

  // Use new menu items if provided, otherwise fall back to old callback
  const hasOverflow = overflowMenuItems && overflowMenuItems.length > 0;
  const hasLegacyOverflow = !hasOverflow && onOverflowPress;

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
      />

      {/* App Bar Content - MD3 Structure */}
      <View style={styles.appBar}>
        {/* Leading Icon - ☰ (menu) or ← (back) */}
        <View style={styles.leadingSection}>
          <IconButton
            icon={leadingType === 'back' ? 'arrow-left' : 'menu'}
            size={Layout.iconSize.default} // 24dp visual
            iconColor={Colors.onPrimary}
            onPress={onLeadingPress}
            accessibilityLabel={leadingType === 'back' ? 'Go back' : 'Open menu'}
            style={styles.iconButton}
          />
        </View>

        {/* Center Section - Title (center-aligned) */}
        <View style={styles.centerSection}>
          <T
            variant="title"
            weight="semiBold"
            numberOfLines={1}
            align="center"
            style={{ color: Colors.onPrimary }}
          >
            {title}
          </T>
          {subtitle && (
            <T
              variant="caption"
              numberOfLines={1}
              align="center"
              style={{ color: Colors.onPrimary, opacity: 0.8 }}
            >
              {subtitle}
            </T>
          )}
        </View>

        {/* Trailing Section - Max 2 actions (notification + overflow) */}
        <View style={styles.trailingSection}>
          {/* Notification Icon with Badge */}
          {onNotificationPress && (
            <View style={styles.iconContainer}>
              <IconButton
                icon="bell"
                size={Layout.iconSize.default} // 24dp visual
                iconColor={Colors.onPrimary}
                onPress={onNotificationPress}
                accessibilityLabel={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
                style={styles.iconButton}
              />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <T variant="caption" weight="bold" style={{ color: Colors.onPrimary, fontSize: 10 }}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </T>
                </View>
              )}
            </View>
          )}

          {/* Overflow Menu - New menu items approach */}
          {hasOverflow && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={Layout.iconSize.default}
                  iconColor={Colors.onPrimary}
                  onPress={() => setMenuVisible(true)}
                  accessibilityLabel="More options"
                  style={styles.iconButton}
                />
              }
            >
              {overflowMenuItems.map((item, index) => (
                <Menu.Item
                  key={index}
                  leadingIcon={item.icon}
                  onPress={() => {
                    setMenuVisible(false);
                    item.onPress();
                  }}
                  title={item.label}
                  titleStyle={item.destructive ? { color: Colors.error } : undefined}
                />
              ))}
            </Menu>
          )}

          {/* Legacy Overflow Menu - Old callback approach */}
          {hasLegacyOverflow && (
            <IconButton
              icon="dots-vertical"
              size={Layout.iconSize.default} // 24dp visual
              iconColor={Colors.onPrimary}
              onPress={onOverflowPress}
              accessibilityLabel="More options"
              style={styles.iconButton}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    ...Shadows.resting, // Elevation 1dp
  },
  appBar: {
    height: Layout.topAppBar.height, // 64dp (MD3 spec)
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xs, // 4dp
  },

  // Leading section (☰ or ←)
  leadingSection: {
    width: 56, // 48dp touch + 8dp padding
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Center section (title)
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm, // 8dp
  },

  // Trailing section (max 2 actions)
  trailingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs, // 4dp between actions
  },

  // Icon button (48dp touch target)
  iconButton: {
    margin: 0,
  },

  // Notification badge container
  iconContainer: {
    position: 'relative',
  },

  // Notification badge (red circle)
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
});
