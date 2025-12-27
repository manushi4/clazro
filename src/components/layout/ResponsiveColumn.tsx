/**
 * ResponsiveColumn - Grid column with responsive span
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsiveContext } from '../../context/ResponsiveContext';

interface ResponsiveColumnProps {
  /** Default span (1-4) */
  span?: 1 | 2 | 3 | 4;
  /** Span on mobile */
  mobileSpan?: 1 | 2 | 3 | 4;
  /** Span on tablet */
  tabletSpan?: 1 | 2 | 3 | 4;
  /** Span on desktop */
  desktopSpan?: 1 | 2 | 3 | 4;
  /** Style override */
  style?: object;
  /** Children */
  children: React.ReactNode;
}

export const ResponsiveColumn: React.FC<ResponsiveColumnProps> = ({
  span = 1,
  mobileSpan,
  tabletSpan,
  desktopSpan,
  style,
  children,
}) => {
  const { layoutMode, isWeb } = useResponsiveContext();

  const currentSpan = layoutMode === 'desktop'
    ? (desktopSpan ?? span)
    : layoutMode === 'tablet'
    ? (tabletSpan ?? span)
    : (mobileSpan ?? span);

  // On web with CSS grid, use gridColumn
  if (isWeb) {
    return (
      <View
        style={[
          styles.column,
          {
            // @ts-ignore - Web-specific style
            gridColumn: `span ${currentSpan}`,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // On mobile, calculate width percentage (assumes 4-column grid)
  const widthPercent = (currentSpan / 4) * 100;

  return (
    <View style={[styles.column, { width: `${widthPercent}%` }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    minWidth: 0, // Allow shrinking
  },
});

export default ResponsiveColumn;
