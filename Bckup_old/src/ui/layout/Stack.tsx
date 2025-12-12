/**
 * Stack Component
 * Flexible stack that can be row or column with auto-spacing
 *
 * Usage:
 * <Stack gap={12} direction="column">
 *   <Text>Item 1</Text>
 *   <Text>Item 2</Text>
 * </Stack>
 */

import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { sx, SxProps } from '../theme/sx';
import { Spacing } from '../../theme/designSystem';

interface StackProps extends ViewProps {
  /** Direction of stack */
  direction?: 'row' | 'column';

  /** Gap between children */
  gap?: number | keyof typeof Spacing;

  /** Center children */
  center?: boolean;

  /** Wrap children */
  wrap?: boolean;

  /** Distribute space between */
  spaceBetween?: boolean;

  /** Flex grow */
  flex?: number;

  /** Sx shorthand props */
  sx?: SxProps;

  children?: React.ReactNode;
}

export const Stack: React.FC<StackProps> = ({
  direction = 'column',
  gap,
  center,
  wrap,
  spaceBetween,
  flex,
  sx: sxProps,
  style,
  children,
  ...props
}) => {
  const computedStyle: ViewStyle = {
    flexDirection: direction,
  };

  if (gap !== undefined) {
    computedStyle.gap = typeof gap === 'number' ? gap : Spacing[gap];
  }

  if (center) {
    computedStyle.justifyContent = 'center';
    computedStyle.alignItems = 'center';
  }

  if (wrap) computedStyle.flexWrap = 'wrap';
  if (spaceBetween) computedStyle.justifyContent = 'space-between';
  if (flex !== undefined) computedStyle.flex = flex;

  return (
    <View
      style={[
        computedStyle,
        sxProps && sx(sxProps),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
