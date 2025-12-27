/**
 * Data Table Types
 */

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T = any> {
  /** Unique column ID */
  id: string;
  /** Column header text */
  header: string;
  /** Key in data object or accessor function */
  accessor: keyof T | ((row: T) => any);
  /** Column width (px or %) */
  width?: number | string;
  /** Min width */
  minWidth?: number;
  /** Max width */
  maxWidth?: number;
  /** Is column sortable */
  sortable?: boolean;
  /** Custom cell renderer */
  cell?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Hide on mobile */
  hideOnMobile?: boolean;
  /** Hide on tablet */
  hideOnTablet?: boolean;
}

export interface SortState {
  columnId: string | null;
  direction: SortDirection;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface DataTableProps<T = any> {
  /** Data array */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Unique key for each row */
  keyExtractor: (item: T, index: number) => string;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Sort state */
  sortState?: SortState;
  /** Sort change handler */
  onSortChange?: (sort: SortState) => void;
  /** Pagination state */
  pagination?: PaginationState;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange?: (pageSize: number) => void;
  /** Row click handler */
  onRowClick?: (item: T, index: number) => void;
  /** Row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: string[];
  /** Selection change handler */
  onSelectionChange?: (keys: string[]) => void;
  /** Striped rows */
  striped?: boolean;
  /** Hoverable rows */
  hoverable?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Custom row style */
  rowStyle?: (item: T, index: number) => object;
  /** Table style */
  style?: object;
}

export interface DataTableHeaderProps<T = any> {
  columns: ColumnDef<T>[];
  sortState?: SortState;
  onSortChange?: (sort: SortState) => void;
  selectable?: boolean;
  allSelected?: boolean;
  onSelectAll?: (selected: boolean) => void;
}

export interface DataTableRowProps<T = any> {
  item: T;
  columns: ColumnDef<T>[];
  index: number;
  keyValue: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (key: string, selected: boolean) => void;
  onClick?: (item: T, index: number) => void;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  style?: object;
}

export interface DataTableCellProps {
  value: any;
  column: ColumnDef;
  row: any;
  rowIndex: number;
  compact?: boolean;
}

export interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export interface ResponsiveListProps<T = any> {
  /** Data array */
  data: T[];
  /** Column definitions (for table view) */
  columns: ColumnDef<T>[];
  /** Key extractor */
  keyExtractor: (item: T, index: number) => string;
  /** Render item for list view */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Empty message */
  emptyMessage?: string;
  /** Sort state */
  sortState?: SortState;
  /** Sort change handler */
  onSortChange?: (sort: SortState) => void;
  /** Pagination */
  pagination?: PaginationState;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Row click handler */
  onRowClick?: (item: T, index: number) => void;
  /** Style */
  style?: object;
}
