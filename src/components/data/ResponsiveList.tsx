/**
 * ResponsiveList - Shows DataTable on web/tablet, FlatList on mobile
 */

import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import { DataTable } from './DataTable';
import type { ResponsiveListProps } from '../../types/table.types';

export function ResponsiveList<T>({
  data,
  columns,
  keyExtractor,
  renderItem,
  loading = false,
  emptyMessage = 'No data available',
  sortState,
  onSortChange,
  pagination,
  onPageChange,
  onRowClick,
  style,
}: ResponsiveListProps<T>): React.ReactElement {
  const { colors } = useAppTheme();
  const { isMobile } = useResponsiveContext();

  // On web/tablet, show data table
  if (!isMobile) {
    return (
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={keyExtractor}
        loading={loading}
        emptyMessage={emptyMessage}
        sortState={sortState}
        onSortChange={onSortChange}
        pagination={pagination}
        onPageChange={onPageChange}
        onRowClick={onRowClick}
        striped={true}
        hoverable={true}
        style={style}
      />
    );
  }

  // On mobile, show list
  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          Loading...
        </AppText>
      </View>
    );
  }

  if (!data.length) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {emptyMessage}
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={({ item, index }) => (
        <View style={styles.listItem}>{renderItem(item, index)}</View>
      )}
      contentContainerStyle={[styles.listContent, style]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
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
  listContent: {
    padding: 16,
  },
  listItem: {
    marginBottom: 12,
  },
});

export default ResponsiveList;
