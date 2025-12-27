/**
 * DataTableHeader - Sortable table header row
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import type { DataTableHeaderProps, SortState, ColumnDef } from '../../types/table.types';

export const DataTableHeader = <T,>({
  columns,
  sortState,
  onSortChange,
  selectable = false,
  allSelected = false,
  onSelectAll,
}: DataTableHeaderProps<T>): React.ReactElement => {
  const { colors } = useAppTheme();
  const { isMobile, isTablet } = useResponsiveContext();

  const handleSort = (column: ColumnDef<T>) => {
    if (!column.sortable || !onSortChange) return;

    const newDirection =
      sortState?.columnId === column.id
        ? sortState.direction === 'asc'
          ? 'desc'
          : sortState.direction === 'desc'
          ? null
          : 'asc'
        : 'asc';

    onSortChange({
      columnId: newDirection ? column.id : null,
      direction: newDirection,
    });
  };

  const renderSortIcon = (column: ColumnDef<T>) => {
    if (!column.sortable) return null;

    const isActive = sortState?.columnId === column.id;
    const direction = sortState?.direction;

    return (
      <View style={styles.sortIcon}>
        <AppText
          style={[
            styles.sortIconText,
            { color: isActive ? colors.primary : colors.onSurfaceVariant },
          ]}
        >
          {isActive && direction === 'asc'
            ? ' ^'
            : isActive && direction === 'desc'
            ? ' v'
            : ' -'}
        </AppText>
      </View>
    );
  };

  // Filter columns based on responsive visibility
  const visibleColumns = columns.filter((col) => {
    if (isMobile && col.hideOnMobile) return false;
    if (isTablet && col.hideOnTablet) return false;
    return true;
  });

  return (
    <View style={[styles.headerRow, { backgroundColor: colors.surfaceVariant }]}>
      {/* Checkbox column */}
      {selectable && (
        <Pressable
          style={styles.checkbox}
          onPress={() => onSelectAll?.(!allSelected)}
        >
          <View
            style={[
              styles.checkboxInner,
              { borderColor: colors.outline },
              allSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            {allSelected && (
              <AppText style={styles.checkmark}>ok</AppText>
            )}
          </View>
        </Pressable>
      )}

      {/* Column headers */}
      {visibleColumns.map((column) => {
        const alignStyle =
          column.align === 'center'
            ? styles.alignCenter
            : column.align === 'right'
            ? styles.alignRight
            : styles.alignLeft;

        const CellWrapper = column.sortable ? Pressable : View;

        return (
          <CellWrapper
            key={column.id}
            style={[
              styles.headerCell,
              alignStyle,
              column.width ? { width: column.width as any } : { flex: 1 },
              column.minWidth ? { minWidth: column.minWidth } : null,
              column.sortable && styles.sortable,
            ]}
            // @ts-ignore
            onPress={column.sortable ? () => handleSort(column) : undefined}
          >
            <AppText style={[styles.headerText, { color: colors.onSurfaceVariant }]}>
              {column.header}
            </AppText>
            {renderSortIcon(column)}
          </CellWrapper>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  headerCell: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortIcon: {
    marginLeft: 4,
  },
  sortIconText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortable: {
    // @ts-ignore - Web specific
    cursor: 'pointer',
  },
  alignLeft: {
    justifyContent: 'flex-start',
  },
  alignCenter: {
    justifyContent: 'center',
  },
  alignRight: {
    justifyContent: 'flex-end',
  },
  checkbox: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
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

export default DataTableHeader;
