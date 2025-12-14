/**
 * Col Component
 * Flexbox column with gap and helpers
 *
 * Usage:
 * <Col gap={12} center>
 *   <Text>Item 1</Text>
 *   <Text>Item 2</Text>
 * </Col>
 */

import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { sx, SxProps } from '../theme/sx';
import { Spacing } from '../../theme/designSystem';

interface ColProps extends ViewProps {
  /** Gap between children */
  gap?: number | keyof typeof Spacing;

  /** Center children vertically and horizontally */
  center?: boolean;

  /** Center children vertically only */
  centerV?: boolean;

  /** Center children horizontally only */
  centerH?: boolean;

  /** Wrap children */
  wrap?: boolean;

  /** Distribute space between children */
  spaceBetween?: boolean;

  /** Distribute space around children */
  spaceAround?: boolean;

  /** Distribute space evenly */
  spaceEvenly?: boolean;

  /** Flex grow */
  flex?: number;

  /** Sx shorthand props */
  sx?: SxProps;

  children?: React.ReactNode;
}

export const Col: React.FC<ColProps> = ({
  gap,
  center,
  centerV,
  centerH,
  wrap,
  spaceBetween,
  spaceAround,
  spaceEvenly,
  flex,
  sx: sxProps,
  style,
  children,
  ...props
}) => {
  const computedStyle: ViewStyle = {
    flexDirection: 'column',
  };

  if (gap !== undefined) {
    computedStyle.gap = typeof gap === 'number' ? gap : Spacing[gap];
  }

  if (center) {
    computedStyle.justifyContent = 'center';
    computedStyle.alignItems = 'center';
  } else {
    if (centerV) computedStyle.justifyContent = 'center';
    if (centerH) computedStyle.alignItems = 'center';
  }

  if (wrap) computedStyle.flexWrap = 'wrap';
  if (spaceBetween) computedStyle.justifyContent = 'space-between';
  if (spaceAround) computedStyle.justifyContent = 'space-around';
  if (spaceEvenly) computedStyle.justifyContent = 'space-evenly';
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
