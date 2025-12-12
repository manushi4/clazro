/**
 * Divider Component
 * Horizontal or vertical line divider
 *
 * Usage:
 * <Divider />
 * <Divider direction="vertical" />
 * <Divider color="primary" thickness={2} />
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors } from '../../theme/designSystem';

interface DividerProps {
  /** Direction of divider */
  direction?: 'horizontal' | 'vertical';

  /** Color (Colors token or hex) */
  color?: keyof typeof Colors | string;

  /** Thickness in pixels */
  thickness?: number;

  /** Margin around divider */
  margin?: number;

  /** Custom style */
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  direction = 'horizontal',
  color = 'divider',
  thickness = 1,
  margin = 0,
  style,
}) => {
  const dividerColor = Colors[color as keyof typeof Colors] || color;

  const baseStyle: ViewStyle = {
    backgroundColor: dividerColor,
  };

  if (direction === 'horizontal') {
    baseStyle.height = thickness;
    baseStyle.width = '100%';
    if (margin > 0) {
      baseStyle.marginVertical = margin;
    }
  } else {
    baseStyle.width = thickness;
    baseStyle.height = '100%';
    if (margin > 0) {
      baseStyle.marginHorizontal = margin;
    }
  }

  return <View style={[baseStyle, style]} />;
};
