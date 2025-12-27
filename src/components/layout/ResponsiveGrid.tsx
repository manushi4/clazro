/**
 * ResponsiveGrid - Responsive grid layout component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import { GRID_COLUMNS } from '../../constants/breakpoints';

interface ResponsiveGridProps {
  /** Number of columns on mobile */
  mobileColumns?: 1 | 2 | 3 | 4;
  /** Number of columns on tablet */
  tabletColumns?: 1 | 2 | 3 | 4;
  /** Number of columns on desktop */
  desktopColumns?: 1 | 2 | 3 | 4;
  /** Gap between items */
  gap?: number;
  /** Row gap (if different from column gap) */
  rowGap?: number;
  /** Style override */
  style?: object;
  /** Children */
  children: React.ReactNode;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 4,
  gap = 16,
  rowGap,
  style,
  children,
}) => {
  const { layoutMode, isWeb } = useResponsiveContext();

  const columns = layoutMode === 'desktop'
    ? desktopColumns
    : layoutMode === 'tablet'
    ? tabletColumns
    : mobileColumns;

  const childArray = React.Children.toArray(children);

  // On web, use CSS grid for better performance
  if (isWeb) {
    return (
      <View
        style={[
          styles.webGrid,
          {
            // @ts-ignore - Web-specific styles
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: gap,
            rowGap: rowGap ?? gap,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // On mobile, use flexbox rows
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < childArray.length; i += columns) {
    rows.push(childArray.slice(i, i + columns));
  }

  return (
    <View style={[styles.container, style]}>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.row,
            { marginBottom: rowIndex < rows.length - 1 ? (rowGap ?? gap) : 0 },
          ]}
        >
          {row.map((child, colIndex) => (
            <View
              key={colIndex}
              style={[
                styles.cell,
                {
                  width: `${100 / columns}%`,
                  paddingLeft: colIndex > 0 ? gap / 2 : 0,
                  paddingRight: colIndex < columns - 1 ? gap / 2 : 0,
                },
              ]}
            >
              {child}
            </View>
          ))}
          {/* Fill empty cells */}
          {row.length < columns &&
            Array(columns - row.length)
              .fill(null)
              .map((_, i) => (
                <View
                  key={`empty-${i}`}
                  style={[styles.cell, { width: `${100 / columns}%` }]}
                />
              ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  webGrid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  cell: {
    flexShrink: 0,
  },
});

export default ResponsiveGrid;
