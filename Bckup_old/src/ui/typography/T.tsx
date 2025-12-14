/**
 * T (Typography) Component
 * Unified text component with variants
 *
 * Usage:
 * <T variant="title">Hello World</T>
 * <T variant="body" color="textSecondary" numberOfLines={2}>Long text...</T>
 */

import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { Colors, Typography } from '../../theme/designSystem';
import { useTheme } from '../../context/ThemeContext';

type TextVariant =
  | 'display'    // 22sp - Large displays
  | 'headline'   // 20sp - App title, top bar
  | 'title'      // 18sp - Section headers
  | 'h1'         // Alias for display
  | 'h2'         // Alias for title
  | 'h3'         // Alias for subtitle
  | 'subtitle'   // 16sp - Card titles
  | 'body'       // 16sp - Body default
  | 'label'      // 14sp - Input labels
  | 'meta'       // 14sp - Secondary/metadata
  | 'caption'    // 13sp - Captions
  | 'tiny';      // 12sp - Badges, tiny labels

type ColorKey = keyof typeof Colors | string;

interface TProps extends Omit<TextProps, 'style'> {
  /** Text variant */
  variant?: TextVariant;

  /** Text color (Colors token or hex) */
  color?: ColorKey;

  /** Font weight */
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';

  /** Text alignment */
  align?: 'left' | 'center' | 'right' | 'justify';

  /** Number of lines (with ellipsis) */
  numberOfLines?: number;

  /** Custom style */
  style?: TextStyle;

  children?: React.ReactNode;
}

export const T: React.FC<TProps> = ({
  variant = 'body',
  color,
  weight,
  align,
  numberOfLines,
  style,
  children,
  ...props
}) => {
  // Use theme colors
  const { theme } = useTheme();
  const textStyle: TextStyle = {};

  // Variant styles
  switch (variant) {
    case 'display':
    case 'h1':
      textStyle.fontSize = Typography.fontSize.display;
      textStyle.fontWeight = Typography.fontWeight.bold;
      textStyle.color = theme.OnSurface;
      break;

    case 'headline':
      textStyle.fontSize = Typography.fontSize.headline;
      textStyle.fontWeight = Typography.fontWeight.bold;
      textStyle.color = theme.OnSurface;
      break;

    case 'title':
    case 'h2':
      textStyle.fontSize = Typography.fontSize.title;
      textStyle.fontWeight = Typography.fontWeight.semiBold;
      textStyle.color = theme.OnSurface;
      break;

    case 'subtitle':
    case 'h3':
      textStyle.fontSize = Typography.fontSize.subtitle;
      textStyle.fontWeight = Typography.fontWeight.medium;
      textStyle.color = theme.OnSurface;
      break;

    case 'body':
      textStyle.fontSize = Typography.fontSize.body;
      textStyle.fontWeight = Typography.fontWeight.regular;
      textStyle.color = theme.OnSurface;
      break;

    case 'label':
    case 'meta':
      textStyle.fontSize = Typography.fontSize.small;
      textStyle.fontWeight = Typography.fontWeight.regular;
      textStyle.color = theme.OnSurfaceVariant;
      break;

    case 'caption':
      textStyle.fontSize = Typography.fontSize.caption;
      textStyle.fontWeight = Typography.fontWeight.regular;
      textStyle.color = theme.OnSurfaceVariant;
      break;

    case 'tiny':
      textStyle.fontSize = Typography.fontSize.tiny;
      textStyle.fontWeight = Typography.fontWeight.medium;
      textStyle.color = theme.OnSurfaceVariant;
      break;
  }

  // Override color if specified
  if (color) {
    // Try to get from theme first, then Colors, then use as-is
    const themeColor = (theme as any)[color];
    textStyle.color = themeColor || Colors[color as keyof typeof Colors] || color;
  }

  // Override weight if specified
  if (weight) {
    textStyle.fontWeight = Typography.fontWeight[weight];
  }

  // Text alignment
  if (align) {
    textStyle.textAlign = align;
  }

  return (
    <Text
      style={[textStyle, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={numberOfLines ? 'tail' : undefined}
      {...props}
    >
      {children}
    </Text>
  );
};

/**
 * Truncate helper
 * Returns props for truncating text
 */
export const truncate = (lines: number) => ({
  numberOfLines: lines,
  ellipsizeMode: 'tail' as const,
});
