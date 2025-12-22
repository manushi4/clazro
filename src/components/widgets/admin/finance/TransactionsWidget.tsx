/**
 * TransactionsWidget - Displays recent financial transactions list
 * 
 * Phase 3: Widget Component (per WIDGET_DEVELOPMENT_GUIDE.md)
 * 
 * Features:
 * - Transaction list with type indicator (income=green, expense=red)
 * - Status chips (completed, pending, failed)
 * - Category display
 * - Amount formatting with +/- prefix
 * - Type and status filtering
 * - Theme-aware colors (no hardcoded colors)
 * - Localized content support
 * - Loading, error, and empty states
 * - Tap to view transaction detail
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
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

const WIDGET_ID = 'finance.transactions';

// Format currency
const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Format date
const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'dd MMM');
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

  // Config options with defaults (per spec: maxItems 3-20, default 5)
  const maxItems = Math.min(Math.max((config?.maxItems as number) || 5, 3), 20);
  const typeFilter = (config?.typeFilter as TransactionType | 'all') || 'all';
  const statusFilter = (config?.statusFilter as TransactionStatus | 'all') || 'all';
  const showViewAll = config?.showViewAll !== false;
  const enableTap = config?.enableTap !== false;
  const showDate = config?.showDate !== false;
  const showStatus = config?.showStatus !== false;

  // Fetch transactions data
  const { data, isLoading, error, refetch } = useTransactionsQuery({
    limit: maxItems,
    typeFilter,
    statusFilter,
  });

  // Get status color using theme
  const getStatusColor = (status: TransactionStatus): string => {
    const statusColors: Record<TransactionStatus, string> = {
      completed: colors.success,
      pending: colors.warning,
      failed: colors.error,
    };
    return statusColors[status] || colors.outline;
  };

  // Get type color using theme
  const getTypeColor = (type: TransactionType): string => {
    return type === 'income' ? colors.success : colors.error;
  };

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      maxItems,
      typeFilter,
      statusFilter,
    });
  }, []);

  const handleTransactionPress = (transaction: Transaction) => {
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
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_all' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_view_all`,
      level: 'info',
    });
    onNavigate?.('finance-transactions');
  };

  // Render transaction item
  const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => {
    const typeColor = getTypeColor(item.type);
    const statusColor = getStatusColor(item.status);
    const isLast = index === (data?.transactions.length || 0) - 1;

    return (
      <TouchableOpacity
        style={[
          styles.transactionItem,
          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
        ]}
        onPress={() => handleTransactionPress(item)}
        disabled={!enableTap}
        accessibilityLabel={t('admin:widgets.transactions.itemHint', {
          type: item.type,
          amount: formatCurrency(item.amount),
          description: item.description,
          defaultValue: `${item.type}: ${formatCurrency(item.amount)} - ${item.description}`,
        })}
        accessibilityRole="button"
      >
        {/* Type Indicator */}
        <View style={[styles.typeIndicator, { backgroundColor: typeColor }]}>
          <Icon
            name={item.type === 'income' ? 'arrow-down' : 'arrow-up'}
            size={16}
            color="#FFFFFF"
          />
        </View>

        {/* Transaction Info */}
        <View style={styles.transactionInfo}>
          <AppText 
            style={[styles.description, { color: colors.onSurface }]} 
            numberOfLines={1}
          >
            {item.description}
          </AppText>
          <View style={styles.metaRow}>
            <AppText style={[styles.category, { color: colors.onSurfaceVariant }]}>
              {t(`admin:widgets.transactions.categories.${item.category}`, { defaultValue: item.category })}
            </AppText>
            {showDate && item.transaction_date && (
              <AppText style={[styles.date, { color: colors.onSurfaceVariant }]}>
                • {formatDate(item.transaction_date)}
              </AppText>
            )}
          </View>
        </View>

        {/* Amount & Status */}
        <View style={styles.transactionMeta}>
          <AppText style={[styles.amount, { color: typeColor }]}>
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
          </AppText>
          {showStatus && (
            <View style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}>
              <AppText style={[styles.statusText, { color: statusColor }]}>
                {t(`admin:widgets.transactions.statuses.${item.status}`, { defaultValue: item.status })}
              </AppText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('admin:widgets.transactions.title', { defaultValue: 'Recent Transactions' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.transactions.states.loading', { defaultValue: 'Loading...' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('admin:widgets.transactions.title', { defaultValue: 'Recent Transactions' })}
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
            accessibilityLabel={t('common:actions.retry', { defaultValue: 'Retry' })}
            accessibilityRole="button"
          >
            <AppText style={{ color: colors.primary }}>
              {t('common:actions.retry', { defaultValue: 'Retry' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (!data || data.transactions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('admin:widgets.transactions.title', { defaultValue: 'Recent Transactions' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="cash-remove" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.transactions.states.empty', { defaultValue: 'No transactions' })}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t('admin:widgets.transactions.title', { defaultValue: 'Recent Transactions' })}
        </AppText>
        {showViewAll && (
          <TouchableOpacity
            onPress={handleViewAll}
            accessibilityLabel={t('admin:widgets.transactions.actions.viewAll', { defaultValue: 'View All' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewAll, { color: colors.primary }]}>
              {t('admin:widgets.transactions.actions.viewAll', { defaultValue: 'View All' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Transactions List */}
      <FlatList
        data={data.transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer with count */}
      {data.totalCount > maxItems && (
        <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
          <AppText style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.transactions.showingOf', {
              showing: data.transactions.length,
              total: data.totalCount,
              defaultValue: `Showing ${data.transactions.length} of ${data.totalCount}`,
            })}
          </AppText>
        </View>
      )}
    </View>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  category: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 12,
    marginLeft: 4,
  },
  transactionMeta: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusChip: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});

export default TransactionsWidget;
