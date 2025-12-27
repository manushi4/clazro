export { useAdminDashboardQuery } from './useAdminDashboardQuery';
export type { AdminDashboardStats } from './useAdminDashboardQuery';
export { useSystemHealthQuery } from './useSystemHealthQuery';
export type { SystemHealthData, SystemHealthStatus } from './useSystemHealthQuery';
export { useAlertsQuery, useAcknowledgeAlert } from './useAlertsQuery';
export type { SystemAlert, AlertSeverity } from './useAlertsQuery';
export { useRecentActivityQuery } from './useRecentActivityQuery';
export type { RecentActivity, ActivityType } from './useRecentActivityQuery';
export { useUserStatsQuery } from './useUserStatsQuery';
export type { UserStatsData, UserStatItem } from './useUserStatsQuery';
export { useUsersListQuery } from './useUsersListQuery';
export type { UserListItem, UsersListQueryOptions } from './useUsersListQuery';
export { useRoleDistributionQuery, ROLE_CONFIG } from './useRoleDistributionQuery';
export type { RoleDistributionData, RoleDistributionStats } from './useRoleDistributionQuery';
export { usePendingApprovalsQuery, useApproveUser, useRejectUser } from './usePendingApprovalsQuery';
export type { PendingUser, PendingApprovalsQueryOptions } from './usePendingApprovalsQuery';
export { useBulkActionsQuery } from './useBulkActionsQuery';
export type { BulkActionsData, BulkActionStatus } from './useBulkActionsQuery';
export { useRecentRegistrationsQuery } from './useRecentRegistrationsQuery';
export type { RecentRegistration, RecentRegistrationsQueryOptions } from './useRecentRegistrationsQuery';
export { useFinanceSummaryQuery } from './useFinanceSummaryQuery';
export type { FinanceSummaryData, FinancePeriod } from './useFinanceSummaryQuery';
export { useExpenseSummaryQuery } from './useExpenseSummaryQuery';
export type { ExpenseSummaryData, ExpenseBreakdown, ExpenseCategory, ExpensePeriod } from './useExpenseSummaryQuery';
export { useNetProfitQuery } from './useNetProfitQuery';
export type { NetProfitData, NetProfitPeriod } from './useNetProfitQuery';
export { useTransactionsQuery } from './useTransactionsQuery';
export type { Transaction, TransactionsData, TransactionType, TransactionStatus, TransactionCategory, UseTransactionsQueryOptions } from './useTransactionsQuery';
export { usePendingPaymentsQuery } from './usePendingPaymentsQuery';
export type { PendingPayment, PendingPaymentsData, PaymentCategory, UsePendingPaymentsQueryOptions } from './usePendingPaymentsQuery';
export { useMonthlyChartQuery } from './useMonthlyChartQuery';
export type { MonthlyChartData, MonthlyDataPoint, MonthlyChartPeriod } from './useMonthlyChartQuery';
export { useCategoryBreakdownQuery } from './useCategoryBreakdownQuery';
export type { CategoryBreakdownData, CategoryItem, CategoryBreakdownPeriod, CategoryBreakdownType } from './useCategoryBreakdownQuery';
export { useKpiMetricsQuery } from './useKpiMetricsQuery';
export type { KpiMetric } from './useKpiMetricsQuery';
export { useTrendsQuery } from './useTrendsQuery';
export type { TrendData, TrendDataPoint, TrendMetric, TrendPeriod } from './useTrendsQuery';
export { useGrowthMetricsQuery } from './useGrowthMetricsQuery';
export type { GrowthData, GrowthMetric, GrowthTrendPoint, GrowthPeriod } from './useGrowthMetricsQuery';
export { useComparisonsQuery } from './useComparisonsQuery';
export type { ComparisonData, ComparisonMetric, ComparisonPeriod } from './useComparisonsQuery';
export { useEngagementQuery } from './useEngagementQuery';
export type { EngagementData, EngagementMetric, EngagementPeriod } from './useEngagementQuery';
export { useContentStatsQuery } from './useContentStatsQuery';
export type { ContentStats, ContentTypeStats, ContentStatusStats, ContentType, ContentStatus } from './useContentStatsQuery';
export { useContentListQuery, CONTENT_TYPE_CONFIG, CONTENT_STATUS_CONFIG, formatViewCount, formatDuration } from './useContentListQuery';
export type { ContentListItem, ContentListQueryOptions } from './useContentListQuery';
export { useContentCategoriesQuery, getCategoryConfig, CATEGORY_CONFIG } from './useContentCategoriesQuery';
export type { CategoryStats, ContentCategoriesData } from './useContentCategoriesQuery';
export { useOrgTreeQuery, ORG_TYPE_CONFIG } from './useOrgTreeQuery';
export type { OrgNode, OrgNodeType, OrgTreeData } from './useOrgTreeQuery';
export { useClassListQuery } from './useClassListQuery';
export type { ClassItem, ClassListData, ClassListQueryOptions } from './useClassListQuery';
export { useAdminProfileActivityQuery, groupAdminActivitiesByDate, getAdminTodayStats, ADMIN_ACTIVITY_CONFIG } from './useAdminProfileActivityQuery';
export type { AdminProfileActivity, AdminActivityType } from './useAdminProfileActivityQuery';
export { useImpersonationUsersQuery } from './useImpersonationUsersQuery';
export type { ImpersonatableUser, ImpersonationUsersData, UseImpersonationUsersQueryOptions } from './useImpersonationUsersQuery';
export { useUserDetailQuery } from './useUserDetailQuery';
export type { UserDetail, UserRole, UserStatus } from './useUserDetailQuery';
export { useStudentFeesSummaryQuery } from './useStudentFeesSummaryQuery';
export type { StudentFeesSummary } from './useStudentFeesSummaryQuery';
export { useFeeCollectionTrendQuery } from './useFeeCollectionTrendQuery';
export type { FeeCollectionTrend, MonthlyFeeData } from './useFeeCollectionTrendQuery';
export { useTeacherPayrollQuery } from './useTeacherPayrollQuery';
export type { TeacherPayrollSummary } from './useTeacherPayrollQuery';
export { useBatchPerformanceQuery } from './useBatchPerformanceQuery';
export type { BatchPerformanceData, BatchItem } from './useBatchPerformanceQuery';
export { useAttendanceOverviewQuery } from './useAttendanceOverviewQuery';
export type { AttendanceOverviewData, AbsentPerson, AttendanceAlert } from './useAttendanceOverviewQuery';
export { useAdmissionStatsQuery } from './useAdmissionStatsQuery';
export type { AdmissionStatsData, ProgramBreakdown, SourceBreakdown, RecentAdmission } from './useAdmissionStatsQuery';
export { useStudentFeeDetailQuery } from './useStudentFeeDetailQuery';
export type { StudentFeeDetail, FeeRecord, PaymentRecord } from './useStudentFeeDetailQuery';
export { useMonthlyFeeReportQuery } from './useMonthlyFeeReportQuery';
export type { MonthlyFeeReport, DailyCollection, ProgramCollection, PaymentMethodBreakdown, TopCollector, MonthlyFeeReportQueryOptions } from './useMonthlyFeeReportQuery';
export { useTeacherPayrollDetailQuery } from './useTeacherPayrollDetailQuery';
export type { TeacherPayrollDetail, PayrollBreakdown, PaymentHistory, TeacherPayrollDetailQueryOptions } from './useTeacherPayrollDetailQuery';
export { useBatchDetailQuery } from './useBatchDetailQuery';
export type { BatchDetailData, BatchStudent, BatchTest, BatchSubject } from './useBatchDetailQuery';
export { useStudentAttendanceDetailQuery } from './useStudentAttendanceDetailQuery';
export type { StudentAttendanceDetailData, AttendanceRecord, AttendanceStats, MonthlyAttendance } from './useStudentAttendanceDetailQuery';
export { useAdmissionDetailQuery } from './useAdmissionDetailQuery';
export type { AdmissionDetailData, AdmissionStatus, AdmissionSource, FollowUpRecord, StatusHistoryRecord } from './useAdmissionDetailQuery';

// Sprint 6: Finance Reports
export { useFinanceReportsQuery } from './useFinanceReportsQuery';
export type {
  FinanceReportsData,
  ReportPeriod,
  ReportType,
  MonthlyTrendPoint,
  CategoryItem,
  CollectionMetrics,
  PeriodComparison,
  UseFinanceReportsQueryOptions,
} from './useFinanceReportsQuery';

// Sprint 7: Analytics Dashboard
export { useAnalyticsDashboardQuery } from './useAnalyticsDashboardQuery';
export type {
  AnalyticsDashboardData,
  AnalyticsPeriod,
  AnalyticsMetric,
  KpiMetric,
  TrendDataPoint,
  TrendData,
  EngagementData,
  GrowthMetric,
  GrowthData,
  ComparisonData,
  UseAnalyticsDashboardQueryOptions,
} from './useAnalyticsDashboardQuery';

// Sprint 9: Settings + Audit
export { useAuditLogsQuery, formatAuditLogMessage, getAuditLogRelativeTime, AUDIT_ACTION_CONFIG, AUDIT_ENTITY_CONFIG } from './useAuditLogsQuery';
export type {
  AuditLog,
  AuditAction,
  AuditEntityType,
  UseAuditLogsQueryOptions,
} from './useAuditLogsQuery';
