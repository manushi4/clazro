/**
 * DataTableCell - Individual table cell
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import type { DataTableCellProps } from '../../types/table.types';

export const DataTableCell: React.FC<DataTableCellProps> = ({
  value,
  column,
  row,
  rowIndex,
  compact = false,
}) => {
  const { colors } = useAppTheme();

  // Get cell content
  const renderContent = () => {
    // Custom cell renderer
    if (column.cell) {
      return column.cell(value, row, rowIndex);
    }

    // Default: render as text
    if (value === null || value === undefined) {
      return (
        <AppText style={[styles.cellText, { color: colors.onSurfaceVariant }]}>
          -
        </AppText>
      );
    }

    // Boolean
    if (typeof value === 'boolean') {
      return (
        <AppText style={[styles.cellText, { color: colors.onSurface }]}>
          {value ? 'Yes' : 'No'}
        </AppText>
      );
    }

    // Date
    if (value instanceof Date) {
      return (
        <AppText style={[styles.cellText, { color: colors.onSurface }]}>
          {value.toLocaleDateString()}
        </AppText>
      );
    }

    // Array
    if (Array.isArray(value)) {
      return (
        <AppText style={[styles.cellText, { color: colors.onSurface }]}>
          {value.join(', ')}
        </AppText>
      );
    }

    // Object (show JSON)
    if (typeof value === 'object') {
      return (
        <AppText style={[styles.cellText, { color: colors.onSurface }]} numberOfLines={1}>
          {JSON.stringify(value)}
        </AppText>
      );
    }

    // String or number
    return (
      <AppText style={[styles.cellText, { color: colors.onSurface }]} numberOfLines={2}>
        {String(value)}
      </AppText>
    );
  };

  const alignStyle = column.align === 'center'
    ? styles.alignCenter
    : column.align === 'right'
    ? styles.alignRight
    : styles.alignLeft;

  return (
    <View
      style={[
        styles.cell,
        compact && styles.cellCompact,
        alignStyle,
        column.width ? { width: column.width as any } : { flex: 1 },
        column.minWidth ? { minWidth: column.minWidth } : null,
        column.maxWidth ? { maxWidth: column.maxWidth } : null,
      ]}
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  cellCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cellText: {
    fontSize: 14,
    lineHeight: 20,
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
});

export default DataTableCell;
