/**
 * PendingPaymentsWidget - Displays pending/outstanding payments list
 * 
 * Phase 3: Widget Component (per WIDGET_DEVELOPMENT_GUIDE.md)
 * 
 * Features:
 * - Pending payments list with overdue indicator
 * - Category display
 * - Amount formatting
 * - Days overdue badge
 * - Theme-aware colors (no hardcoded colors)
 * - Localized content support
 * - Loading, error, and empty states
 * - Tap to view payment detail
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  usePendingPaymentsQuery,
  PendingPayment,
  PaymentCategory,
} from '../../../../hooks/queries/admin/usePendingPaymentsQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';
import { format } from 'date-fns';

const WIDGET_ID = 'finance.pending-payments';

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

export const PendingPaymentsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(['admin', 'common']);
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const maxItems = Math.min(Math.max((config?.maxItems as number) || 5, 3), 20);
  const showOverdueOnly = config?.showOverdueOnly === true;
  const categoryFilter = (config?.categoryFilter as PaymentCategory | 'all') || 'all';
  const showViewAll = config?.showViewAll !== false;
  const enableTap = config?.enableTap !== false;
  const showDueDate = config?.showDueDate !== false;
  const showOverdueBadge = config?.showOverdueBadge !== false;

  // Fetch pending payments data
  const { data, isLoading, error, refetch } = usePendingPaymentsQuery({
    limit: maxItems,
    showOverdueOnly,
    categoryFilter,
  });

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
      maxItems,
      showOverdueOnly,
    });
  }, []);

  const handlePaymentPress = (payment: PendingPayment) => {
    if (!enableTap) return;
    
    trackWidgetEvent(WIDGET_ID, 'click', { 
      action: 'payment_tap', 
      paymentId: payment.id,
      isOverdue: payment.isOverdue,
    });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_payment_tap`,
      level: 'info',
      data: { paymentId: payment.id },
    });
    onNavigate?.('payment-detail', { paymentId: payment.id });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_all' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_view_all`,
      level: 'info',
    });
    onNavigate?.('finance-pending-payments');
  };

  // Render payment item
  const renderPayment = ({ item, index }: { item: PendingPayment; index: number }) => {
    const isLast = index === (data?.payments.length || 0) - 1;

    return (
      <TouchableOpacity
        style={[
          styles.paymentItem,
          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
        ]}
        onPress={() => handlePaymentPress(item)}
        disabled={!enableTap}
        accessibilityLabel={t('admin:widgets.pendingPayments.itemHint', {
          amount: formatCurrency(item.amount),
          description: item.description,
          status: item.isOverdue ? 'overdue' : 'pending',
          defaultValue: `${formatCurrency(item.amount)} - ${item.description} (${item.isOverdue ? 'overdue' : 'pending'})`,
        })}
        accessibilityRole="button"
      >
        {/* Status Indicator */}
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: item.isOverdue ? colors.error : colors.warning }
        ]}>
          <Icon
            name={item.isOverdue ? 'alert' : 'clock-outline'}
            size={16}
            color="#FFFFFF"
          />
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <AppText 
            style={[styles.description, { color: colors.onSurface }]} 
            numberOfLines={1}
          >
            {item.description}
          </AppText>
          <View style={styles.metaRow}>
            <AppText style={[styles.category, { color: colors.onSurfaceVariant }]}>
              {t(`admin:widgets.pendingPayments.categories.${item.category}`, { defaultValue: item.category })}
            </AppText>
            {showDueDate && item.transaction_date && (
              <AppText style={[styles.date, { color: colors.onSurfaceVariant }]}>
                • {formatDate(item.transaction_date)}
              </AppText>
            )}
          </View>
        </View>

        {/* Amount & Overdue Badge */}
        <View style={styles.paymentMeta}>
          <AppText style={[styles.amount, { color: colors.onSurface }]}>
            {formatCurrency(item.amount)}
          </AppText>
          {showOverdueBadge && item.isOverdue && (
            <View style={[styles.overdueBadge, { backgroundColor: `${colors.error}20` }]}>
              <AppText style={[styles.overdueText, { color: colors.error }]}>
                {t('admin:widgets.pendingPayments.daysOverdue', {
                  days: item.daysOverdue,
                  defaultValue: `${item.daysOverdue}d overdue`,
                })}
              </AppText>
            </View>
          )}
          {showOverdueBadge && !item.isOverdue && (
            <View style={[styles.pendingBadge, { backgroundColor: `${colors.warning}20` }]}>
              <AppText style={[styles.pendingText, { color: colors.warning }]}>
                {t('admin:widgets.pendingPayments.statuses.pending', { defaultValue: 'Pending' })}
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
            {t('admin:widgets.pendingPayments.title', { defaultValue: 'Pending Payments' })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.pendingPayments.states.loading', { defaultValue: 'Loading...' })}
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
            {t('admin:widgets.pendingPayments.title', { defaultValue: 'Pending Payments' })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('admin:widgets.pendingPayments.states.error', { defaultValue: 'Failed to load payments' })}
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
  if (!data || data.payments.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('admin:widgets.pendingPayments.title', { defaultValue: 'Pending Payments' })}
          </AppText>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="check-circle-outline" size={48} color={colors.success} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.pendingPayments.states.empty', { defaultValue: 'No pending payments' })}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('admin:widgets.pendingPayments.title', { defaultValue: 'Pending Payments' })}
          </AppText>
          {data.overdueCount > 0 && (
            <View style={[styles.overdueCountBadge, { backgroundColor: colors.error }]}>
              <AppText style={styles.overdueCountText}>
                {data.overdueCount}
              </AppText>
            </View>
          )}
        </View>
        {showViewAll && (
          <TouchableOpacity
            onPress={handleViewAll}
            accessibilityLabel={t('admin:widgets.pendingPayments.actions.viewAll', { defaultValue: 'View All' })}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewAll, { color: colors.primary }]}>
              {t('admin:widgets.pendingPayments.actions.viewAll', { defaultValue: 'View All' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Summary Row */}
      <View style={[styles.summaryRow, { backgroundColor: colors.surfaceVariant }]}>
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.pendingPayments.labels.totalPending', { defaultValue: 'Total Pending' })}
          </AppText>
          <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
            {formatCurrency(data.totalPendingAmount)}
          </AppText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.pendingPayments.labels.overdue', { defaultValue: 'Overdue' })}
          </AppText>
          <AppText style={[styles.summaryValue, { color: data.overdueCount > 0 ? colors.error : colors.onSurface }]}>
            {data.overdueCount}
          </AppText>
        </View>
      </View>

      {/* Payments List */}
      <FlatList
        data={data.payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer with count */}
      {data.totalCount > maxItems && (
        <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
          <AppText style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
            {t('admin:widgets.pendingPayments.showingOf', {
              showing: data.payments.length,
              total: data.totalCount,
              defaultValue: `Showing ${data.payments.length} of ${data.totalCount}`,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  overdueCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  overdueCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
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
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
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
  paymentMeta: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  overdueBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: '500',
  },
  pendingBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '500',
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

export default PendingPaymentsWidget;
