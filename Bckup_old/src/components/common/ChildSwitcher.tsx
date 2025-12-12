/**
 * Child Switcher Component (MD3)
 *
 * Pill-shaped switcher for selecting which child's data to view
 * Appears in Top App Bar
 *
 * Specifications:
 * - Height: 40dp
 * - Avatar: 24dp (left)
 * - Name: 14-16sp (center)
 * - Dropdown icon: right
 * - Opens bottom sheet with all children
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Text, Avatar, IconButton, Portal, Surface } from 'react-native-paper';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Layout } from '../../theme/designSystem';

export interface Child {
  id: string;
  name: string;
  grade?: string;
  attendance?: 'present' | 'absent' | 'unknown';
  avatarInitials?: string;
  avatarColor?: string;
}

interface ChildSwitcherProps {
  children: Child[];
  selectedChildId: string | 'all';
  onSelectChild: (childId: string | 'all') => void;
  showAllOption?: boolean;
}

export const ChildSwitcher: React.FC<ChildSwitcherProps> = ({
  children,
  selectedChildId,
  onSelectChild,
  showAllOption = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedChild = selectedChildId === 'all'
    ? { id: 'all', name: 'All Children', avatarInitials: 'All' }
    : children.find(c => c.id === selectedChildId);

  const initials = selectedChild?.avatarInitials ||
                   selectedChild?.name.substring(0, 2).toUpperCase() ||
                   'CH';

  const getAttendanceDotColor = (attendance?: string) => {
    switch (attendance) {
      case 'present': return Colors.success;
      case 'absent': return Colors.error;
      default: return Colors.textTertiary;
    }
  };

  return (
    <>
      {/* Child Switcher Pill */}
      <TouchableOpacity
        style={styles.pill}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Avatar.Text
          size={Layout.childSwitcher.avatar}
          label={initials}
          style={[
            styles.avatar,
            { backgroundColor: selectedChild?.avatarColor || Colors.primary }
          ]}
          labelStyle={styles.avatarLabel}
        />
        <Text style={styles.name} numberOfLines={1}>
          {selectedChild?.name || 'Select Child'}
        </Text>
        <IconButton
          icon="chevron-down"
          size={20}
          iconColor={Colors.textSecondary}
          style={styles.chevron}
        />
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Portal>
        <Modal
          visible={isOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          >
            <Surface style={styles.bottomSheet} elevation={5}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHandle} />
                <Text variant="titleLarge" style={styles.sheetTitle}>
                  Select Child
                </Text>
              </View>

              <FlatList
                data={showAllOption ? [{ id: 'all', name: 'All Children' }, ...children] : children}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.childItem,
                      selectedChildId === item.id && styles.childItemSelected
                    ]}
                    onPress={() => {
                      onSelectChild(item.id);
                      setIsOpen(false);
                    }}
                  >
                    <Avatar.Text
                      size={Layout.avatarSize.medium}
                      label={item.avatarInitials || item.name.substring(0, 2).toUpperCase()}
                      style={[
                        styles.childAvatar,
                        { backgroundColor: item.avatarColor || Colors.primary }
                      ]}
                    />
                    <View style={styles.childInfo}>
                      <Text variant="bodyLarge" style={styles.childName}>
                        {item.name}
                      </Text>
                      {item.grade && (
                        <Text variant="bodySmall" style={styles.childGrade}>
                          {item.grade}
                        </Text>
                      )}
                    </View>
                    {item.attendance && item.id !== 'all' && (
                      <View
                        style={[
                          styles.attendanceDot,
                          { backgroundColor: getAttendanceDotColor(item.attendance) }
                        ]}
                      />
                    )}
                    {selectedChildId === item.id && (
                      <IconButton
                        icon="check"
                        size={24}
                        iconColor={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
              />

              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => {
                  setIsOpen(false);
                  // Navigate to manage children screen
                }}
              >
                <IconButton icon="account-cog" size={20} iconColor={Colors.primary} />
                <Text style={styles.manageText}>Manage Children</Text>
              </TouchableOpacity>
            </Surface>
          </TouchableOpacity>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  // Switcher Pill (40dp height)
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.childSwitcher.height,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.xs,
    ...Shadows.resting,
  },
  avatar: {
    marginRight: Spacing.sm,
  },
  avatarLabel: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.medium,
  },
  name: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginRight: Spacing.xs,
    maxWidth: 120,
  },
  chevron: {
    margin: 0,
  },

  // Bottom Sheet
  overlay: {
    flex: 1,
    backgroundColor: Colors.scrim,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '60%',
    paddingBottom: Spacing.lg,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sheetHandle: {
    width: 32,
    height: 4,
    backgroundColor: Colors.outline,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },

  // Child List Items
  listContent: {
    paddingVertical: Spacing.sm,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    minHeight: Layout.listRow.comfortable,
  },
  childItemSelected: {
    backgroundColor: Colors.primaryContainer,
  },
  childAvatar: {
    marginRight: Spacing.base,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  childGrade: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  attendanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },

  // Footer
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  manageText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
});
