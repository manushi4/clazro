/**
 * Admin Screen Skeleton Loaders
 * Week 1, Days 5-7: Per-card skeleton loaders for better UX
 *
 * Usage:
 * - KPICardSkeleton: For dashboard KPI cards
 * - UserListItemSkeleton: For user management list
 * - TicketListItemSkeleton: For support ticket list
 * - FinancialCardSkeleton: For financial report cards
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import LoadingSkeleton from '../LoadingSkeleton';
import { Colors, Spacing } from '../../theme/designSystem';

/**
 * KPI Card Skeleton
 * For dashboard metric cards (Active Users, Revenue, etc.)
 */
export const KPICardSkeleton: React.FC = () => (
  <View style={styles.kpiCard}>
    {/* Icon placeholder */}
    <LoadingSkeleton width={48} height={48} borderRadius={24} style={styles.kpiIcon} />

    {/* Value and label */}
    <View style={styles.kpiContent}>
      <LoadingSkeleton width="60%" height={32} style={styles.kpiValue} />
      <LoadingSkeleton width="80%" height={16} style={styles.kpiLabel} />
    </View>

    {/* Trend indicator */}
    <View style={styles.kpiTrend}>
      <LoadingSkeleton width={60} height={20} borderRadius={10} />
    </View>
  </View>
);

/**
 * User List Item Skeleton
 * For user management table rows
 */
export const UserListItemSkeleton: React.FC = () => (
  <View style={styles.userListItem}>
    {/* Avatar */}
    <LoadingSkeleton width={40} height={40} borderRadius={20} />

    {/* User info */}
    <View style={styles.userInfo}>
      <LoadingSkeleton width="70%" height={16} style={{ marginBottom: 6 }} />
      <LoadingSkeleton width="50%" height={14} />
    </View>

    {/* Role badge */}
    <View style={styles.userRole}>
      <LoadingSkeleton width={80} height={24} borderRadius={12} />
    </View>

    {/* Status badge */}
    <View style={styles.userStatus}>
      <LoadingSkeleton width={70} height={24} borderRadius={12} />
    </View>

    {/* Actions */}
    <View style={styles.userActions}>
      <LoadingSkeleton width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} />
      <LoadingSkeleton width={32} height={32} borderRadius={16} />
    </View>
  </View>
);

/**
 * Ticket List Item Skeleton
 * For support ticket rows
 */
export const TicketListItemSkeleton: React.FC = () => (
  <View style={styles.ticketListItem}>
    {/* Priority indicator */}
    <View style={styles.ticketPriority}>
      <LoadingSkeleton width={4} height="100%" />
    </View>

    {/* Ticket content */}
    <View style={styles.ticketContent}>
      {/* Subject and status */}
      <View style={styles.ticketHeader}>
        <LoadingSkeleton width="60%" height={18} style={{ marginBottom: 4 }} />
        <LoadingSkeleton width={80} height={20} borderRadius={10} />
      </View>

      {/* Meta info */}
      <View style={styles.ticketMeta}>
        <LoadingSkeleton width={100} height={14} style={{ marginRight: 12 }} />
        <LoadingSkeleton width={120} height={14} />
      </View>
    </View>

    {/* Assigned avatar */}
    <LoadingSkeleton width={32} height={32} borderRadius={16} />
  </View>
);

/**
 * Financial Card Skeleton
 * For revenue/payment cards
 */
export const FinancialCardSkeleton: React.FC = () => (
  <View style={styles.financialCard}>
    {/* Header */}
    <View style={styles.financialHeader}>
      <LoadingSkeleton width="50%" height={20} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width={80} height={16} borderRadius={8} />
    </View>

    {/* Amount */}
    <LoadingSkeleton width="70%" height={36} style={{ marginVertical: 12 }} />

    {/* Chart placeholder */}
    <View style={styles.financialChart}>
      <LoadingSkeleton width="100%" height={120} borderRadius={8} />
    </View>

    {/* Footer stats */}
    <View style={styles.financialFooter}>
      <View style={styles.financialStat}>
        <LoadingSkeleton width={60} height={12} style={{ marginBottom: 4 }} />
        <LoadingSkeleton width={40} height={16} />
      </View>
      <View style={styles.financialStat}>
        <LoadingSkeleton width={60} height={12} style={{ marginBottom: 4 }} />
        <LoadingSkeleton width={40} height={16} />
      </View>
    </View>
  </View>
);

/**
 * Analytics Card Skeleton
 * For analytics dashboard cards
 */
export const AnalyticsCardSkeleton: React.FC = () => (
  <View style={styles.analyticsCard}>
    {/* Title */}
    <LoadingSkeleton width="60%" height={20} style={{ marginBottom: 16 }} />

    {/* Chart area */}
    <LoadingSkeleton width="100%" height={200} borderRadius={8} style={{ marginBottom: 16 }} />

    {/* Legend */}
    <View style={styles.analyticsLegend}>
      <View style={styles.analyticsLegendItem}>
        <LoadingSkeleton width={12} height={12} borderRadius={6} style={{ marginRight: 8 }} />
        <LoadingSkeleton width={80} height={14} />
      </View>
      <View style={styles.analyticsLegendItem}>
        <LoadingSkeleton width={12} height={12} borderRadius={6} style={{ marginRight: 8 }} />
        <LoadingSkeleton width={80} height={14} />
      </View>
    </View>
  </View>
);

/**
 * Settings Card Skeleton
 * For system settings toggles
 */
export const SettingsCardSkeleton: React.FC = () => (
  <View style={styles.settingsCard}>
    {/* Icon and title */}
    <View style={styles.settingsHeader}>
      <LoadingSkeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
      <View style={styles.settingsInfo}>
        <LoadingSkeleton width="70%" height={18} style={{ marginBottom: 6 }} />
        <LoadingSkeleton width="90%" height={14} />
      </View>
    </View>

    {/* Toggle */}
    <LoadingSkeleton width={51} height={31} borderRadius={16} />
  </View>
);

/**
 * Container for multiple skeletons
 * Renders N skeleton items
 */
interface SkeletonListProps {
  count?: number;
  ItemSkeleton: React.FC;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 5,
  ItemSkeleton
}) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <ItemSkeleton key={index} />
    ))}
  </>
);

const styles = StyleSheet.create({
  // KPI Card
  kpiCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  kpiIcon: {
    marginBottom: Spacing.sm,
  },
  kpiContent: {
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    marginBottom: 4,
  },
  kpiLabel: {
    marginBottom: 8,
  },
  kpiTrend: {
    alignSelf: 'flex-start',
  },

  // User List Item
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  userRole: {
    marginRight: Spacing.sm,
  },
  userStatus: {
    marginRight: Spacing.sm,
  },
  userActions: {
    flexDirection: 'row',
  },

  // Ticket List Item
  ticketListItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  ticketPriority: {
    width: 4,
  },
  ticketContent: {
    flex: 1,
    padding: Spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Financial Card
  financialCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  financialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialChart: {
    marginVertical: Spacing.md,
  },
  financialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  financialStat: {
    flex: 1,
  },

  // Analytics Card
  analyticsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyticsLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  analyticsLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Settings Card
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsInfo: {
    flex: 1,
  },
});

export default {
  KPICardSkeleton,
  UserListItemSkeleton,
  TicketListItemSkeleton,
  FinancialCardSkeleton,
  AnalyticsCardSkeleton,
  SettingsCardSkeleton,
  SkeletonList,
};
