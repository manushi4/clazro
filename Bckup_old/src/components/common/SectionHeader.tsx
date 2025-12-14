/**
 * Reusable Section Header Component
 * Use this for all section titles
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Colors, Typography, Spacing } from '../../theme/designSystem';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  onIconPress?: () => void;
  rightComponent?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  onIconPress,
  rightComponent,
}) => {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="titleLarge" style={styles.sectionTitle}>
        {title}
      </Text>
      {rightComponent ? (
        rightComponent
      ) : icon ? (
        <IconButton icon={icon} size={24} onPress={onIconPress} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
  },
});
