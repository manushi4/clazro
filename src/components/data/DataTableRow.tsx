/**
 * DataTableRow - Table row with cells
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import { DataTableCell } from './DataTableCell';
import type { DataTableRowProps, ColumnDef } from '../../types/table.types';

export const DataTableRow = <T,>({
  item,
  columns,
  index,
  keyValue,
  selectable = false,
  selected = false,
  onSelect,
  onClick,
  striped = false,
  hoverable = true,
  compact = false,
  style,
}: DataTableRowProps<T>): React.ReactElement => {
  const { colors } = useAppTheme();
  const { isMobile, isTablet } = useResponsiveContext();
  const [isHovered, setIsHovered] = useState(false);

  // Get cell value from accessor
  const getCellValue = (column: ColumnDef<T>): any => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return (item as any)[column.accessor];
  };

  // Filter columns based on responsive visibility
  const visibleColumns = columns.filter((col) => {
    if (isMobile && col.hideOnMobile) return false;
    if (isTablet && col.hideOnTablet) return false;
    return true;
  });

  const rowBackgroundColor = selected
    ? colors.primary + '15'
    : isHovered && hoverable
    ? colors.surfaceVariant + '60'
    : striped && index % 2 === 1
    ? colors.surfaceVariant + '40'
    : 'transparent';

  const handlePress = () => {
    if (onClick) {
      onClick(item, index);
    }
  };

  const RowWrapper = onClick || hoverable ? Pressable : View;

  return (
    <RowWrapper
      style={[
        styles.row,
        { backgroundColor: rowBackgroundColor },
        { borderBottomColor: colors.outlineVariant },
        onClick && styles.clickable,
        style,
      ]}
      onPress={onClick ? handlePress : undefined}
      // @ts-ignore - Web specific
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      {selectable && (
        <Pressable
          style={styles.checkbox}
          onPress={() => onSelect?.(keyValue, !selected)}
        >
          <View
            style={[
              styles.checkboxInner,
              { borderColor: colors.outline },
              selected && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            {selected && (
              <AppText style={styles.checkmark}>ok</AppText>
            )}
          </View>
        </Pressable>
      )}

      {/* Cells */}
      {visibleColumns.map((column) => (
        <DataTableCell
          key={column.id}
          value={getCellValue(column)}
          column={column}
          row={item}
          rowIndex={index}
          compact={compact}
        />
      ))}
    </RowWrapper>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  clickable: {
    // @ts-ignore - Web specific
    cursor: 'pointer',
  },
  checkbox: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default DataTableRow;
