/**
 * Data Table Styles
 */

import { StyleSheet } from 'react-native';

export const createTableStyles = (colors: {
  background: string;
  surface: string;
  surfaceVariant: string;
  primary: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
}) => StyleSheet.create({
  // Table container
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },

  // Table element
  table: {
    width: '100%',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },

  headerCell: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerCellCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  sortIcon: {
    marginLeft: 4,
  },

  sortable: {
    cursor: 'pointer',
  },

  // Body
  body: {
    width: '100%',
  },

  // Row
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },

  rowLast: {
    borderBottomWidth: 0,
  },

  rowStriped: {
    backgroundColor: colors.surfaceVariant + '40',
  },

  rowHoverable: {
    // @ts-ignore - Web specific
    cursor: 'pointer',
  },

  rowSelected: {
    backgroundColor: colors.primary + '15',
  },

  // Cell
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
    color: colors.onSurface,
  },

  // Checkbox
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
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  // Loading
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },

  // Empty
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },

  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surfaceVariant + '60',
  },

  paginationInfo: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },

  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },

  paginationButtonDisabled: {
    opacity: 0.5,
  },

  paginationButtonText: {
    fontSize: 13,
    color: colors.onSurface,
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

  pageNumberActive: {
    backgroundColor: colors.primary,
  },

  pageNumberText: {
    fontSize: 13,
    color: colors.onSurface,
  },

  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  pageSizeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  pageSizeLabel: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },

  pageSizeSelect: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    fontSize: 13,
    color: colors.onSurface,
  },
});

export default createTableStyles;
