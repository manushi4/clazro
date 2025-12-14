/**
 * Card Component (MD3)
 * Material Design 3 elevated/outlined cards
 *
 * Usage:
 * <Card variant="elevated" onPress={() => {}}>
 *   <CardHeader title="Title" subtitle="Subtitle" icon="account" />
 *   <CardContent>
 *     <T>Card content here</T>
 *   </CardContent>
 *   <CardActions>
 *     <Button>Action 1</Button>
 *     <Button>Action 2</Button>
 *   </CardActions>
 * </Card>
 */

import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Icon } from 'react-native-paper';
import { T } from '../typography/T';
import { Colors, Spacing, BorderRadius, Shadows, Layout } from '../../theme/designSystem';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  children,
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const [pressed, setPressed] = React.useState(false);
  const { theme } = useTheme();

  const getCardStyle = () => {
    const base = styles.card;

    if (variant === 'elevated') {
      return [
        base,
        { backgroundColor: theme.Surface },
        Shadows.resting,
        pressed && !disabled && Shadows.hover,
        style,
      ];
    }

    if (variant === 'outlined') {
      return [
        base,
        { backgroundColor: theme.Surface, borderWidth: 1, borderColor: theme.Outline },
        style,
      ];
    }

    if (variant === 'filled') {
      return [base, { backgroundColor: theme.SurfaceVariant }, style];
    }

    return [base, style];
  };

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={getCardStyle()}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={getCardStyle()}>{children}</View>;
};

// Card Header (optional)
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  trailing?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  trailing,
}) => {
  return (
    <View style={styles.header}>
      {icon && (
        <View style={styles.headerIcon}>
          <Icon
            source={icon}
            size={Layout.iconSize.default} // 24dp
            color={iconColor || Colors.primary}
          />
        </View>
      )}
      <View style={styles.headerText}>
        <T variant="title" weight="semiBold">
          {title}
        </T>
        {subtitle && (
          <T variant="caption" color="textSecondary">
            {subtitle}
          </T>
        )}
      </View>
      {trailing && <View style={styles.headerTrailing}>{trailing}</View>}
    </View>
  );
};

// Card Content (optional wrapper)
interface CardContentProps {
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ children }) => {
  return <View style={styles.content}>{children}</View>;
};

// Card Actions (optional)
interface CardActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'space-between';
}

export const CardActions: React.FC<CardActionsProps> = ({
  children,
  align = 'right',
}) => {
  const alignmentStyle =
    align === 'left'
      ? { justifyContent: 'flex-start' }
      : align === 'right'
      ? { justifyContent: 'flex-end' }
      : { justifyContent: 'space-between' };

  return <View style={[styles.actions, alignmentStyle]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md, // 12dp (MD3 spec)
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base, // 16dp
    gap: Spacing.md, // 12dp
  },
  headerIcon: {
    width: Layout.iconSize.default,
    height: Layout.iconSize.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTrailing: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: {
    padding: Spacing.base, // 16dp
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm, // 8dp
    gap: Spacing.sm, // 8dp
  },
});
