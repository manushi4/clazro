/**
 * Chip Component (MD3)
 * Material Design 3 chip variants: filter, assist, suggestion
 *
 * Usage:
 * <Chip variant="filter" label="Active" selected onPress={() => {}} />
 * <Chip variant="assist" label="View All" icon="arrow-right" onPress={() => {}} />
 * <Chip variant="suggestion" label="Try this" onPress={() => {}} />
 */

import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { T } from '../typography/T';
import { Colors, Spacing, BorderRadius, Typography, Layout, StateLayers } from '../../theme/designSystem';

interface ChipProps {
  variant?: 'filter' | 'assist' | 'suggestion';
  label: string;
  selected?: boolean;
  icon?: string;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export const Chip: React.FC<ChipProps> = ({
  variant = 'filter',
  label,
  selected = false,
  icon,
  disabled = false,
  onPress,
  accessibilityLabel,
}) => {
  const [pressed, setPressed] = React.useState(false);

  // Chip styling based on variant and state
  const getChipStyle = () => {
    const base = styles.chip;

    if (disabled) {
      return [base, styles.chipDisabled];
    }

    if (variant === 'filter') {
      if (selected) {
        return [base, styles.chipFilterSelected, pressed && styles.chipPressed];
      }
      return [base, styles.chipFilter, pressed && styles.chipPressed];
    }

    if (variant === 'assist') {
      return [base, styles.chipAssist, pressed && styles.chipPressed];
    }

    if (variant === 'suggestion') {
      return [base, styles.chipSuggestion, pressed && styles.chipPressed];
    }

    return base;
  };

  const getTextColor = () => {
    if (disabled) return Colors.disabledText;
    if (variant === 'filter' && selected) return Colors.onPrimary;
    return Colors.textPrimary;
  };

  const getIconColor = () => {
    if (disabled) return Colors.disabledText;
    if (variant === 'filter' && selected) return Colors.onPrimary;
    return Colors.textSecondary;
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: variant === 'filter' ? selected : undefined }}
      hitSlop={{ top: 8, right: 4, bottom: 8, left: 4 }} // Ensure 48dp touch target
      style={getChipStyle()}
    >
      <View style={styles.chipContent}>
        {icon && (
          <Icon
            source={icon}
            size={Layout.iconSize.small} // 16dp
            color={getIconColor()}
          />
        )}
        <T
          variant="caption"
          weight="medium"
          style={{ color: getTextColor() }}
        >
          {label}
        </T>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: 32,                       // MD3 spec: 32dp
    borderRadius: BorderRadius.sm,    // 8dp
    paddingHorizontal: Spacing.md,    // 12dp
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,                  // 4dp between icon and label
  },

  // Filter chip (outlined or filled when selected)
  chipFilter: {
    backgroundColor: Colors.surface,
    borderColor: Colors.outline,
  },
  chipFilterSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // Assist chip (elevated, no border)
  chipAssist: {
    backgroundColor: Colors.surface,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Suggestion chip (outlined)
  chipSuggestion: {
    backgroundColor: Colors.surface,
    borderColor: Colors.outline,
  },

  // Pressed state (apply state layer)
  chipPressed: {
    opacity: 0.88, // Simulates 12% pressed state layer
  },

  // Disabled state
  chipDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.disabled,
    opacity: 0.38,
  },
});
