/**
 * TransactionsWidget - Web Version with DataTable
 *
 * Displays financial transactions in a sortable, paginated table on web.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import { AppCard } from '../../../../ui/components/AppCard';
import { DataTable } from '../../../data/DataTable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useTransactionsQuery,
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../../../../hooks/queries/admin/useTransactionsQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';
import { format } from 'date-fns';
import type { ColumnDef, SortState, PaginationState } from '../../../../types/table.types';

const WIDGET_ID = 'finance.transactions';

// Format currency
const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('en-IN')}`;
};

// Format date
const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'dd MMM yyyy');
  } catch {
    return '';
  }
};

export const TransactionsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(['admin', 'common']);
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const maxItems = Math.min(Math.max((config?.maxItems as number) || 10, 3), 50);
  const typeFilter = (config?.typeFilter as TransactionType | 'all') || 'all';
  const statusFilter = (config?.statusFilter as TransactionStatus | 'all') || 'all';
  const showViewAll = config?.showViewAll !== false;
  const enableTap = config?.enableTap !== false;

  const [sortState, setSortState] = useState<SortState>({
    columnId: 'transaction_date',
    direction: 'desc',
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: maxItems,
    total: 0,
  });
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>(typeFilter);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>(statusFilter);

  // Fetch transactions data
  const { data, isLoading, error, refetch } = useTransactionsQuery({
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
    typeFilter: selectedType,
    statusFilter: selectedStatus,
  });

  // Get status color using theme
  const getStatusColor = useCallback((status: TransactionStatus): string => {
    const statusColors: Record<TransactionStatus, string> = {
      completed: colors.success,
      pending: colors.warning,
      failed: colors.error,
    };
    return statusColors[status] || colors.outline;
  }, [colors]);

  // Get type color using theme
  const getTypeColor = useCallback((type: TransactionType): string => {
    return type === 'income' ? colors.success : colors.error;
  }, [colors]);

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      maxItems,
    });
  }, []);

  const handleTransactionClick = useCallback((transaction: Transaction) => {
    if (!enableTap) return;

    trackWidgetEvent(WIDGET_ID, 'click', {
      action: 'transaction_tap',
      transactionId: transaction.id,
      type: transaction.type,
    });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_transaction_tap`,
      level: 'info',
      data: { transactionId: transaction.id },
    });
    onNavigate?.('transaction-detail', { transactionId: transaction.id });
  }, [enableTap, onNavigate, trackWidgetEvent]);

  const handleViewAll = useCallback(() => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_all' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_view_all`,
      level: 'info',
    });
    onNavigate?.('finance-transactions');
  }, [onNavigate, trackWidgetEvent]);

  // Define table columns
  const columns: ColumnDef<Transaction>[] = useMemo(() => [
    {
      id: 'type',
      header: '',
      accessor: 'type',
      width: 48,
      cell: (value) => {
        const typeColor = getTypeColor(value);
        return (
          <View style={[styles.typeIndicator, { backgroundColor: typeColor }]}>
            <Icon
              name={value === 'income' ? 'arrow-down' : 'arrow-up'}
              size={16}
              color="#FFFFFF"
            />
          </View>
        );
      },
    },
    {
      id: 'description',
      header: t('admin:widgets.transactions.columns.description', { defaultValue: 'Description' }),
      accessor: 'description',
      sortable: true,
      minWidth: 200,
      cell: (value, row) => (
        <View>
          <AppText style={[styles.description, { color: colors.onSurface }]} numberOfLines={1}>
            {value}
          </AppText>
          <AppText style={[styles.category, { color: colors.onSurfaceVariant }]}>
            {t(`admin:widgets.transactions.categories.${row.category}`, { defaultValue: row.category })}
          </AppText>
        </View>
      ),
    },
    {
      id: 'transaction_date',
      header: t('admin:widgets.transactions.columns.date', { defaultValue: 'Date' }),
      accessor: 'transaction_date',
      sortable: true,
      width: 120,
      hideOnMobile: true,
      cell: (value) => (
        <AppText style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
          {formatDate(value)}
        </AppText>
      ),
    },
    {
      id: 'amount',
      header: t('admin:widgets.transactions.columns.amount', { defaultValue: 'Amount' }),
      accessor: 'amount',
      sortable: true,
      width: 140,
      align: 'right',
      cell: (value, row) => {
        const typeColor = getTypeColor(row.type);
        return (
          <AppText style={[styles.amount, { color: typeColor }]}>
            {row.type === 'income' ? '+' : '-'}{formatCurrency(value)}
          </AppText>
        );
      },
    },
    {
      id: 'status',
      header: t('admin:widgets.transactions.columns.status', { defaultValue: 'Status' }),
      accessor: 'status',
      sortable: true,
      width: 110,
      hideOnMobile: true,
      cell: (value) => {
        const statusColor = getStatusColor(value);
        return (
          <View style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}>
            <AppText style={[styles.statusText, { color: statusColor }]}>
              {t(`admin:widgets.transactions.statuses.${value}`, { defaultValue: value })}
            </AppText>
          </View>
        );
      },
    },
  ], [t, colors, getTypeColor, getStatusColor]);

  const renderFilterChip = (
    label: string,
    value: string,
    selected: boolean,
    onPress: () => void,
    color?: string
  ) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected
            ? color || colors.primary
            : colors.surfaceVariant,
          borderRadius: borderRadius.small,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <AppText
        style={[
          styles.filterChipText,
          { color: selected ? "#FFFFFF" : colors.onSurfaceVariant },
        ]}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading && !data?.transactions?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('admin:widgets.transactions.title', { defaultValue: 'Transactions' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.transactions.states.loading', { defaultValue: 'Loading...' })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Error state
  if (error && !data?.transactions?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('admin:widgets.transactions.title', { defaultValue: 'Transactions' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('admin:widgets.transactions.states.error', { defaultValue: 'Failed to load transactions' })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primaryContainer }]}
            onPress={() => refetch()}
          >
            <AppText style={{ color: colors.primary }}>
              {t('common:actions.retry', { defaultValue: 'Retry' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('admin:widgets.transactions.title', { defaultValue: 'Transactions' })}
        </AppText>
        {showViewAll && (
          <TouchableOpacity onPress={handleViewAll}>
            <AppText style={[styles.viewAll, { color: colors.primary }]}>
              {t('admin:widgets.transactions.actions.viewAll', { defaultValue: 'View All' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <AppText style={[styles.filterLabel, { color: colors.onSurfaceVariant }]}>
            Type:
          </AppText>
          <View style={styles.filterRow}>
            {renderFilterChip(
              t('admin:widgets.transactions.filters.all', { defaultValue: 'All' }),
              'all',
              selectedType === 'all',
              () => setSelectedType('all')
            )}
            {renderFilterChip(
              t('admin:widgets.transactions.filters.income', { defaultValue: 'Income' }),
              'income',
              selectedType === 'income',
              () => setSelectedType('income'),
              colors.success
            )}
            {renderFilterChip(
              t('admin:widgets.transactions.filters.expense', { defaultValue: 'Expense' }),
              'expense',
              selectedType === 'expense',
              () => setSelectedType('expense'),
              colors.error
            )}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <AppText style={[styles.filterLabel, { color: colors.onSurfaceVariant }]}>
            Status:
          </AppText>
          <View style={styles.filterRow}>
            {renderFilterChip(
              t('admin:widgets.transactions.filters.all', { defaultValue: 'All' }),
              'all-status',
              selectedStatus === 'all',
              () => setSelectedStatus('all')
            )}
            {(['completed', 'pending', 'failed'] as TransactionStatus[]).map((status) =>
              renderFilterChip(
                t(`admin:widgets.transactions.statuses.${status}`, { defaultValue: status }),
                status,
                selectedStatus === status,
                () => setSelectedStatus(status),
                getStatusColor(status)
              )
            )}
          </View>
        </View>
      </View>

      {/* Data Table */}
      <DataTable
        data={data?.transactions || []}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={isLoading}
        emptyMessage={t('admin:widgets.transactions.states.empty', { defaultValue: 'No transactions' })}
        sortState={sortState}
        onSortChange={setSortState}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: data?.totalCount || 0,
        }}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onRowClick={handleTransactionClick}
        striped
        hoverable
      />
    </AppCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  filtersContainer: {
    marginBottom: 16,
    gap: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 50,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
  },
  category: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 13,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});

export default TransactionsWidget;
