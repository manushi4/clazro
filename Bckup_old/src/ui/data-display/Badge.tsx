/**
 * Badge Component
 * Small status indicator with color variants
 *
 * Usage:
 * <Badge label="Active" variant="success" />
 * <Badge label="Pending" variant="warning" />
 * <Badge label="Overdue" variant="error" size="md" />
 */

import React from 'react';
import { View } from 'react-native';
import { T, sx } from '..';
import { Colors } from '../../theme/designSystem';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  /** Badge label text */
  label: string;

  /** Color variant */
  variant?: BadgeVariant;

  /** Size variant */
  size?: BadgeSize;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: {
    bg: Colors.surfaceVariant,
    text: Colors.textPrimary,
  },
  success: {
    bg: Colors.successLight,
    text: Colors.success,
  },
  warning: {
    bg: Colors.warningLight,
    text: Colors.warning,
  },
  error: {
    bg: Colors.errorLight,
    text: Colors.error,
  },
  info: {
    bg: Colors.primaryContainer,
    text: Colors.primary,
  },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'sm',
}) => {
  const colors = variantColors[variant];

  return (
    <View
      style={[
        sx({
          px: size === 'sm' ? 'sm' : 'md',
          py: size === 'sm' ? 'xs' : 'sm',
          radius: 'full',
        }),
        { backgroundColor: colors.bg },
      ]}
    >
      <T
        variant={size === 'sm' ? 'tiny' : 'caption'}
        weight="medium"
        style={{ color: colors.text }}
      >
        {label}
      </T>
    </View>
  );
};
