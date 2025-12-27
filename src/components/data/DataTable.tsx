/**
 * DataTable - Full-featured data table for web
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import { DataTableHeader } from './DataTableHeader';
import { DataTableRow } from './DataTableRow';
import { DataTablePagination } from './DataTablePagination';
import type { DataTableProps, ColumnDef } from '../../types/table.types';

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data available',
  sortState,
  onSortChange,
  pagination,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  striped = true,
  hoverable = true,
  compact = false,
  rowStyle,
  style,
}: DataTableProps<T>): React.ReactElement {
  const { colors } = useAppTheme();

  // Handle selection
  const handleSelect = (key: string, selected: boolean) => {
    if (!onSelectionChange) return;

    if (selected) {
      onSelectionChange([...selectedKeys, key]);
    } else {
      onSelectionChange(selectedKeys.filter((k) => k !== key));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (!onSelectionChange) return;

    if (selected) {
      onSelectionChange(data.map((item, idx) => keyExtractor(item, idx)));
    } else {
      onSelectionChange([]);
    }
  };

  const allSelected = useMemo(() => {
    if (data.length === 0) return false;
    return data.every((item, idx) => selectedKeys.includes(keyExtractor(item, idx)));
  }, [data, selectedKeys, keyExtractor]);

  // Loading state
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          style,
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading...
          </AppText>
        </View>
      </View>
    );
  }

  // Empty state
  if (!data.length) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          style,
        ]}
      >
        <DataTableHeader
          columns={columns}
          sortState={sortState}
          onSortChange={onSortChange}
          selectable={selectable}
          allSelected={false}
          onSelectAll={handleSelectAll}
        />
        <View style={styles.emptyContainer}>
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {emptyMessage}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
        style,
      ]}
    >
      {/* Horizontal scroll for small screens */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.tableInner}>
          {/* Header */}
          <DataTableHeader
            columns={columns}
            sortState={sortState}
            onSortChange={onSortChange}
            selectable={selectable}
            allSelected={allSelected}
            onSelectAll={handleSelectAll}
          />

          {/* Body */}
          <View style={styles.body}>
            {data.map((item, index) => {
              const key = keyExtractor(item, index);
              const isLast = index === data.length - 1;

              return (
                <DataTableRow
                  key={key}
                  item={item}
                  columns={columns}
                  index={index}
                  keyValue={key}
                  selectable={selectable}
                  selected={selectedKeys.includes(key)}
                  onSelect={handleSelect}
                  onClick={onRowClick}
                  striped={striped}
                  hoverable={hoverable}
                  compact={compact}
                  style={[
                    isLast && styles.lastRow,
                    rowStyle?.(item, index),
                  ]}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Pagination */}
      {pagination && onPageChange && (
        <DataTablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableInner: {
    minWidth: '100%',
  },
  body: {
    width: '100%',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default DataTable;
