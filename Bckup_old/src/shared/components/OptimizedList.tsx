/**
 * OptimizedList Component
 * High-performance FlatList with memoization and optimizations
 *
 * Usage:
 * <OptimizedList
 *   data={students}
 *   rowHeight={72}
 *   keyExtractor={(s) => s.id}
 *   renderItem={(student) => (
 *     <ListItem
 *       title={student.name}
 *       subtitle={student.studentId}
 *       onPress={() => navigate('StudentDetails', { studentId: student.id })}
 *     />
 *   )}
 *   emptyTitle="No students"
 *   emptyBody="Add students to see them here"
 * />
 */

import React from 'react';
import { FlatList, FlatListProps } from 'react-native';
import { EmptyState } from '../../ui/feedback/EmptyState';

interface OptimizedListProps<T> extends Partial<FlatListProps<T>> {
  /** Array of data items */
  data: T[];

  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;

  /** Key extractor function */
  keyExtractor: (item: T, index: number) => string;

  /** Fixed row height for getItemLayout optimization */
  rowHeight?: number;

  /** Empty state props */
  emptyTitle?: string;
  emptyBody?: string;
  emptyIcon?: string;
  onEmptyCTA?: () => void;
  emptyCtaLabel?: string;
}

export function OptimizedList<T>({
  data,
  renderItem,
  keyExtractor,
  rowHeight,
  emptyTitle = 'No items',
  emptyBody = 'Nothing to show yet',
  emptyIcon = 'inbox',
  onEmptyCTA,
  emptyCtaLabel = 'Refresh',
  ...flatListProps
}: OptimizedListProps<T>) {
  // Memoize row component to prevent unnecessary re-renders
  const MemoRow = React.memo(
    ({ item, index }: { item: T; index: number }) => (
      <>{renderItem(item, index)}</>
    ),
    // Only re-render if item reference changes
    (prev, next) => prev.item === next.item && prev.index === next.index
  );

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={({ item, index }) => <MemoRow item={item} index={index} />}
      getItemLayout={
        rowHeight
          ? (_, index) => ({
              length: rowHeight,
              offset: rowHeight * index,
              index,
            })
          : undefined
      }
      // Performance optimizations
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews
      // Empty state
      ListEmptyComponent={
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          body={emptyBody}
          cta={
            onEmptyCTA
              ? {
                  label: emptyCtaLabel,
                  onPress: onEmptyCTA,
                }
              : undefined
          }
        />
      }
      {...flatListProps}
    />
  );
}
