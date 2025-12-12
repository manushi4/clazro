/**
 * Reusable Dashboard Header Component (MD3)
 * Use this on all dashboard screens for consistency
 *
 * Features:
 * - Optional Child Switcher integration
 * - Search, notifications, profile actions
 * - Welcome message with user info
 * - Material Design 3 styling
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Chip, IconButton } from 'react-native-paper';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '../../theme/designSystem';
import { ChildSwitcher, Child } from './ChildSwitcher';

interface DashboardHeaderProps {
  userName: string;
  userEmail?: string;
  welcomeMessage?: string;
  statusMessage?: string;
  avatarInitials?: string;
  avatarColor?: string;
  showStatus?: boolean;

  // Child Switcher (optional)
  children?: Child[];
  selectedChildId?: string | 'all';
  onSelectChild?: (childId: string | 'all') => void;
  showChildSwitcher?: boolean;

  // Actions (optional)
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
  notificationCount?: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  userEmail,
  welcomeMessage = 'Welcome back,',
  statusMessage = 'Connected to Supabase ✓',
  avatarInitials,
  avatarColor = Colors.primary,
  showStatus = true,
  children = [],
  selectedChildId = 'all',
  onSelectChild,
  showChildSwitcher = false,
  onSearchPress,
  onNotificationsPress,
  onProfilePress,
  notificationCount = 0,
}) => {
  const initials = avatarInitials || userName.substring(0, 2).toUpperCase();

  return (
    <View style={styles.header}>
      {/* Top App Bar (56dp) - Optional */}
      {(showChildSwitcher || onSearchPress || onNotificationsPress) && (
        <View style={styles.topAppBar}>
          {showChildSwitcher && children.length > 0 && onSelectChild && (
            <ChildSwitcher
              children={children}
              selectedChildId={selectedChildId}
              onSelectChild={onSelectChild}
            />
          )}
          <View style={styles.spacer} />
          {onSearchPress && (
            <IconButton
              icon="magnify"
              size={Layout.iconSize.default}
              iconColor={Colors.textPrimary}
              onPress={onSearchPress}
              style={styles.actionButton}
            />
          )}
          {onNotificationsPress && (
            <View>
              <IconButton
                icon="bell-outline"
                size={Layout.iconSize.default}
                iconColor={Colors.textPrimary}
                onPress={onNotificationsPress}
                style={styles.actionButton}
              />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* User Info Section */}
      <View style={styles.headerContent}>
        <Avatar.Text
          size={Layout.avatarSize.xlarge}
          label={initials}
          style={[styles.avatar, { backgroundColor: avatarColor }]}
        />
        <View style={styles.headerText}>
          <Text variant="bodyMedium" style={styles.welcomeText}>
            {welcomeMessage}
          </Text>
          <Text variant="headlineSmall" style={styles.nameText}>
            {userName}
          </Text>
          {userEmail && (
            <Text variant="bodySmall" style={styles.emailText}>
              {userEmail}
            </Text>
          )}
        </View>
        {onProfilePress && (
          <Avatar.Text
            size={Layout.avatarSize.small}
            label={initials}
            style={[styles.profileAvatar, { backgroundColor: avatarColor }]}
          />
        )}
      </View>

      {showStatus && (
        <Chip icon="check-circle" mode="outlined" style={styles.statusChip}>
          {statusMessage}
        </Chip>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    ...Shadows.resting,
  },

  // Top App Bar (56dp)
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.topAppBar.height,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  spacer: {
    flex: 1,
  },
  actionButton: {
    margin: 0,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.onPrimary,
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.bold,
  },

  // User Info Section
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  avatar: {
    ...Shadows.glow(Colors.primary),
  },
  profileAvatar: {
    marginLeft: 'auto',
  },
  headerText: {
    marginLeft: Spacing.base,
    flex: 1,
  },
  welcomeText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.small,
    letterSpacing: Typography.letterSpacing.wide,
  },
  nameText: {
    fontWeight: Typography.fontWeight.bold,
    marginTop: 4,
    fontSize: Typography.fontSize.headline,
    color: Colors.textPrimary,
  },
  emailText: {
    color: Colors.textTertiary,
    marginTop: 4,
    fontSize: Typography.fontSize.caption,
  },

  // Status Chip
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.successContainer,
    borderRadius: BorderRadius.sm,
  },
});
