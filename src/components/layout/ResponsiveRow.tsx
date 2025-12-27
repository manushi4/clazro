/**
 * ResponsiveRow - Flexible row that stacks on mobile
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsiveContext } from '../../context/ResponsiveContext';

interface ResponsiveRowProps {
  /** Gap between items */
  gap?: number;
  /** Align items */
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  /** Justify content */
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  /** Wrap items */
  wrap?: boolean;
  /** Stack vertically on mobile */
  stackOnMobile?: boolean;
  /** Style override */
  style?: object;
  /** Children */
  children: React.ReactNode;
}

export const ResponsiveRow: React.FC<ResponsiveRowProps> = ({
  gap = 16,
  align = 'stretch',
  justify = 'flex-start',
  wrap = false,
  stackOnMobile = true,
  style,
  children,
}) => {
  const { isMobile } = useResponsiveContext();

  const shouldStack = stackOnMobile && isMobile;

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: shouldStack ? 'column' : 'row',
          alignItems: shouldStack ? 'stretch' : align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          gap: gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default ResponsiveRow;
