/**
 * DataTablePagination - Pagination controls for data table
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import type { DataTablePaginationProps } from '../../types/table.types';

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const { colors } = useAppTheme();
  const { isMobile } = useResponsiveContext();

  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  // Generate page numbers to show
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = isMobile ? 3 : 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and surrounding pages
      const sidePages = Math.floor((maxVisible - 3) / 2);

      // Always show first page
      pages.push(1);

      // Add ellipsis or pages before current
      if (page > sidePages + 2) {
        pages.push('ellipsis');
      }

      // Pages around current
      for (
        let i = Math.max(2, page - sidePages);
        i <= Math.min(totalPages - 1, page + sidePages);
        i++
      ) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      // Add ellipsis or pages after current
      if (page < totalPages - sidePages - 1) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (total === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceVariant + '60',
          borderTopColor: colors.outlineVariant,
        },
        isMobile && styles.containerMobile,
      ]}
    >
      {/* Info */}
      {!isMobile && (
        <AppText style={[styles.info, { color: colors.onSurfaceVariant }]}>
          Showing {startItem}-{endItem} of {total}
        </AppText>
      )}

      {/* Page size selector */}
      {!isMobile && onPageSizeChange && (
        <View style={styles.pageSizeSelector}>
          <AppText style={[styles.pageSizeLabel, { color: colors.onSurfaceVariant }]}>
            Rows per page:
          </AppText>
          <View
            style={[
              styles.selectWrapper,
              {
                borderColor: colors.outlineVariant,
                backgroundColor: colors.surface,
              },
            ]}
          >
            {pageSizeOptions.map((size) => (
              <Pressable
                key={size}
                style={[
                  styles.pageSizeOption,
                  pageSize === size && { backgroundColor: colors.primary + '20' },
                ]}
                onPress={() => onPageSizeChange(size)}
              >
                <AppText
                  style={[
                    styles.pageSizeText,
                    { color: pageSize === size ? colors.primary : colors.onSurface },
                  ]}
                >
                  {size}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Page controls */}
      <View style={styles.controls}>
        {/* Previous button */}
        <Pressable
          style={[
            styles.navButton,
            {
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surface,
            },
            !canGoPrev && styles.buttonDisabled,
          ]}
          onPress={() => canGoPrev && onPageChange(page - 1)}
          disabled={!canGoPrev}
        >
          <AppText
            style={[
              styles.navButtonText,
              { color: canGoPrev ? colors.onSurface : colors.onSurfaceVariant },
            ]}
          >
            Prev
          </AppText>
        </Pressable>

        {/* Page numbers */}
        {!isMobile && (
          <View style={styles.pageNumbers}>
            {getPageNumbers().map((pageNum, idx) =>
              pageNum === 'ellipsis' ? (
                <AppText
                  key={`ellipsis-${idx}`}
                  style={[styles.ellipsis, { color: colors.onSurfaceVariant }]}
                >
                  ...
                </AppText>
              ) : (
                <Pressable
                  key={pageNum}
                  style={[
                    styles.pageNumber,
                    page === pageNum && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => onPageChange(pageNum)}
                >
                  <AppText
                    style={[
                      styles.pageNumberText,
                      { color: page === pageNum ? '#FFFFFF' : colors.onSurface },
                      page === pageNum && styles.pageNumberTextActive,
                    ]}
                  >
                    {pageNum}
                  </AppText>
                </Pressable>
              )
            )}
          </View>
        )}

        {/* Mobile page indicator */}
        {isMobile && (
          <AppText style={[styles.mobilePageIndicator, { color: colors.onSurfaceVariant }]}>
            {page} / {totalPages}
          </AppText>
        )}

        {/* Next button */}
        <Pressable
          style={[
            styles.navButton,
            {
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surface,
            },
            !canGoNext && styles.buttonDisabled,
          ]}
          onPress={() => canGoNext && onPageChange(page + 1)}
          disabled={!canGoNext}
        >
          <AppText
            style={[
              styles.navButtonText,
              { color: canGoNext ? colors.onSurface : colors.onSurfaceVariant },
            ]}
          >
            Next
          </AppText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 16,
  },
  containerMobile: {
    justifyContent: 'center',
  },
  info: {
    fontSize: 13,
  },
  pageSizeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageSizeLabel: {
    fontSize: 13,
  },
  selectWrapper: {
    flexDirection: 'row',
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pageSizeOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pageSizeText: {
    fontSize: 13,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageNumber: {
    minWidth: 32,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberText: {
    fontSize: 13,
  },
  pageNumberTextActive: {
    fontWeight: '600',
  },
  ellipsis: {
    paddingHorizontal: 4,
    fontSize: 13,
  },
  mobilePageIndicator: {
    fontSize: 13,
    paddingHorizontal: 8,
  },
});

export default DataTablePagination;
