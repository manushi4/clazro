/**
 * Context Switcher Component (MD3)
 * For switching between children/students in parent dashboard
 *
 * Usage:
 * <ContextSwitcher
 *   items={[
 *     { id: '1', label: 'John Doe', avatar: 'JD' },
 *     { id: '2', label: 'Jane Doe', avatar: 'JD' },
 *   ]}
 *   selectedId="1"
 *   onSelect={(id) => console.log('Selected:', id)}
 * />
 */

import React from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';
import { T } from '../typography/T';
import { Colors, Spacing, BorderRadius, Layout } from '../../theme/designSystem';

interface ContextSwitcherItem {
  id: string;
  label: string;
  avatar?: string; // Initials or URI
  avatarUri?: string; // Image URI
}

interface ContextSwitcherProps {
  items: ContextSwitcherItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  accessibilityLabel?: string;
}

export const ContextSwitcher: React.FC<ContextSwitcherProps> = ({
  items,
  selectedId,
  onSelect,
  accessibilityLabel = 'Switch context',
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityLabel={accessibilityLabel}
    >
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <ContextSwitcherItem
            key={item.id}
            item={item}
            isSelected={isSelected}
            onPress={() => onSelect(item.id)}
          />
        );
      })}
    </ScrollView>
  );
};

interface ContextSwitcherItemProps {
  item: ContextSwitcherItem;
  isSelected: boolean;
  onPress: () => void;
}

const ContextSwitcherItem: React.FC<ContextSwitcherItemProps> = ({
  item,
  isSelected,
  onPress,
}) => {
  const [pressed, setPressed] = React.useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityLabel={`Select ${item.label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={[
        styles.item,
        isSelected && styles.itemSelected,
        pressed && styles.itemPressed,
      ]}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatarUri ? (
          <Avatar.Image
            size={Layout.childSwitcher.avatar} // 24dp
            source={{ uri: item.avatarUri }}
          />
        ) : (
          <Avatar.Text
            size={Layout.childSwitcher.avatar} // 24dp
            label={item.avatar || item.label.substring(0, 2).toUpperCase()}
            style={[
              styles.avatar,
              isSelected && styles.avatarSelected,
            ]}
          />
        )}
      </View>

      {/* Label */}
      <T
        variant="caption"
        weight={isSelected ? 'semiBold' : 'medium'}
        numberOfLines={1}
        style={{
          color: isSelected ? Colors.onPrimary : Colors.textPrimary,
        }}
      >
        {item.label}
      </T>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm, // 8dp between items
    paddingHorizontal: Spacing.base, // 16dp
    paddingVertical: Spacing.sm, // 8dp
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.childSwitcher.height, // 40dp (MD3 spec)
    paddingHorizontal: Spacing.md, // 12dp
    paddingVertical: Spacing.xs, // 4dp
    gap: Spacing.xs, // 4dp between avatar and label
    borderRadius: BorderRadius.full, // Pill shape
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outline,
  },

  itemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  itemPressed: {
    opacity: 0.88, // Simulates 12% pressed state layer
  },

  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatar: {
    backgroundColor: Colors.primaryLight,
  },

  avatarSelected: {
    backgroundColor: Colors.primaryDark,
  },
});
