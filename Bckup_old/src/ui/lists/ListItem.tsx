/**
 * ListItem Component (MD3)
 * Material Design 3 list items with proper heights and touch targets
 *
 * Usage:
 * <ListItem
 *   size="comfortable"
 *   leading={<Avatar.Text label="JD" />}
 *   title="John Doe"
 *   subtitle="Software Engineer"
 *   trailing={<Icon source="chevron-right" />}
 *   onPress={() => {}}
 * />
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { T } from '../typography/T';
import { Colors, Spacing, Layout, StateLayers } from '../../theme/designSystem';

interface ListItemProps {
  size?: 'min' | 'comfortable' | 'spacious'; // 56/64/72dp
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  supporting?: string; // Third line (for 3-line list items)
  trailing?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  divider?: boolean;
  accessibilityLabel?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  size = 'comfortable',
  leading,
  title,
  subtitle,
  supporting,
  trailing,
  onPress,
  disabled = false,
  selected = false,
  divider = false,
  accessibilityLabel,
}) => {
  const [pressed, setPressed] = React.useState(false);

  const getHeight = () => {
    if (size === 'min') return Layout.listRow.min; // 56dp
    if (size === 'comfortable') return Layout.listRow.comfortable; // 64dp
    if (size === 'spacious') return Layout.listRow.spacious; // 72dp
    return Layout.listRow.comfortable;
  };

  const getContainerStyle = () => {
    const base = [
      styles.container,
      { minHeight: getHeight() },
      selected && styles.containerSelected,
      disabled && styles.containerDisabled,
    ];

    if (pressed && !disabled) {
      return [...base, styles.containerPressed];
    }

    return base;
  };

  const content = (
    <View style={getContainerStyle()}>
      {/* Leading element (avatar, icon, checkbox, etc.) */}
      {leading && <View style={styles.leading}>{leading}</View>}

      {/* Text content */}
      <View style={styles.textContainer}>
        <T
          variant="body"
          weight={selected ? 'semiBold' : 'regular'}
          numberOfLines={1}
          style={{ color: disabled ? Colors.disabledText : Colors.textPrimary }}
        >
          {title}
        </T>
        {subtitle && (
          <T
            variant="caption"
            color={disabled ? 'disabledText' : 'textSecondary'}
            numberOfLines={1}
          >
            {subtitle}
          </T>
        )}
        {supporting && (
          <T
            variant="caption"
            color={disabled ? 'disabledText' : 'textTertiary'}
            numberOfLines={1}
          >
            {supporting}
          </T>
        )}
      </View>

      {/* Trailing element (icon, button, switch, etc.) */}
      {trailing && <View style={styles.trailing}>{trailing}</View>}

      {/* Divider */}
      {divider && <View style={styles.divider} />}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base, // 16dp
    paddingVertical: Spacing.sm, // 8dp
    backgroundColor: Colors.surface,
  },

  containerSelected: {
    backgroundColor: Colors.primaryContainer,
  },

  containerPressed: {
    backgroundColor: Colors.surfaceVariant,
    opacity: 0.88, // Simulates 12% pressed state layer
  },

  containerDisabled: {
    opacity: 0.38,
  },

  leading: {
    marginRight: Spacing.base, // 16dp
    justifyContent: 'center',
    alignItems: 'center',
  },

  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  trailing: {
    marginLeft: Spacing.base, // 16dp
    justifyContent: 'center',
    alignItems: 'center',
  },

  divider: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.base,
    right: 0,
    height: 1,
    backgroundColor: Colors.divider,
  },
});
