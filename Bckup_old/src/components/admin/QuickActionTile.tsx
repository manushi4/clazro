/**
 * Quick Action Tile Component
 * Compact action button with icon and label
 * Used in Admin Dashboard for common admin actions
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { T } from '../../ui/typography/T';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';
import { useTheme } from '../../context/ThemeContext';

export interface QuickActionTileProps {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export const QuickActionTile: React.FC<QuickActionTileProps> = React.memo(({
  icon,
  label,
  onPress,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Tap to perform action"
      style={[
        styles.container,
        {
          backgroundColor: theme.Surface,
          borderColor: theme.Outline,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: isPressed ? 0.95 : 1 }],
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: theme.SurfaceVariant }]}>
        <T variant="title" style={styles.icon}>
          {icon}
        </T>
      </View>

      {/* Label */}
      <T variant="caption" weight="semiBold" align="center" style={styles.label}>
        {label}
      </T>
    </Pressable>
  );
});

QuickActionTile.displayName = 'QuickActionTile';

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    color: Colors.textPrimary,
  },
});
