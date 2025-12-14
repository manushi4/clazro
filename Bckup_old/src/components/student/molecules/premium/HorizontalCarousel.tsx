/**
 * HorizontalCarousel Component - Premium Minimal Design
 * Purpose: Generic horizontal scrolling carousel with snap
 * Used in: NewStudentDashboard, NewScheduleScreen, any screen with horizontal lists
 */

import React from 'react';
import { FlatList, View, StyleSheet, FlatListProps } from 'react-native';

interface HorizontalCarouselProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  snapToInterval?: number;
  accessibilityLabel: string;
  keyExtractor?: (item: T, index: number) => string;
  contentContainerStyle?: FlatListProps<T>['contentContainerStyle'];
}

export const HorizontalCarousel = <T,>({
  data,
  renderItem,
  snapToInterval = 172, // 160dp card width + 12dp gap
  accessibilityLabel,
  keyExtractor,
  contentContainerStyle,
}: HorizontalCarouselProps<T>) => {
  const defaultKeyExtractor = (item: T, index: number) => {
    if (typeof item === 'object' && item !== null && 'id' in item) {
      return String((item as any).id);
    }
    return `item-${index}`;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={({ item, index }) => (
          <View style={styles.itemWrapper}>
            {renderItem(item, index)}
          </View>
        )}
        keyExtractor={keyExtractor || defaultKeyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapToInterval}
        decelerationRate="fast"
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="list"
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={3}
        windowSize={5}
        getItemLayout={(data, index) => ({
          length: snapToInterval,
          offset: snapToInterval * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  itemWrapper: {
    // Item wrapper for consistent spacing
  },
});
