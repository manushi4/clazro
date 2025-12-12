/**
 * Spacer Component
 * Creates empty space between components
 *
 * Usage:
 * <Spacer size={16} />
 * <Spacer size="base" />
 * <Spacer size="lg" />
 */

import React from 'react';
import { View } from 'react-native';
import { Spacing } from '../../theme/designSystem';

interface SpacerProps {
  /** Size of spacer (number or Spacing token) */
  size: number | keyof typeof Spacing;

  /** Direction of space (default: vertical) */
  direction?: 'horizontal' | 'vertical';
}

export const Spacer: React.FC<SpacerProps> = ({
  size,
  direction = 'vertical',
}) => {
  const spacing = typeof size === 'number' ? size : Spacing[size];

  return (
    <View
      style={{
        width: direction === 'horizontal' ? spacing : undefined,
        height: direction === 'vertical' ? spacing : undefined,
      }}
    />
  );
};
