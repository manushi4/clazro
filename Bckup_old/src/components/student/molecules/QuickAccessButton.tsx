import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { T } from '../../../ui';
import { Colors, Spacing, BorderRadius, Shadows } from '../../../theme/designSystem';

interface QuickAccessButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}

export const QuickAccessButton: React.FC<QuickAccessButtonProps> = ({
  icon,
  label,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <T variant="display" style={styles.icon}>{icon}</T>
      <T variant="caption" style={styles.label}>{label}</T>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.resting,
  },
  icon: {
    marginBottom: Spacing.xs,
  },
  label: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
});
