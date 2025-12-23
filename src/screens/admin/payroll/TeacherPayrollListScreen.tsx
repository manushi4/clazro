/**
 * TeacherPayrollListScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display list of teachers with their payroll status for a given month
 * Type: Fixed (custom component with list functionality)
 * Accessible from: TeacherPayrollWidget (View All, Paid tap, Pending tap)
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View all teachers' payroll status with filtering
 * - Target role: admin, super_admin
 * - Screen ID: teacher-payroll-list
 * - Route params: filter (optional: 'all' | 'paid' | 'pending' | 'due-soon'), month (optional)
 * - Data requirements: teacher_payroll table, user_profiles table
 * - Required permissions: view_payroll
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing teacher_payroll table (created in Phase 3 of admin_demo.md)
 * - RLS: admin role can read teacher_payroll where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useTeacherPayrollListQuery: src/hooks/queries/admin/useTeacherPayrollListQuery.ts
 * - Types: TeacherPayrollItem, PayrollFilter
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 * - File: src/screens/admin/payroll/TeacherPayrollListScreen.tsx
 * - All required hooks (theme, i18n, analytics, offline)
 * - Loading, Error, Empty, Success states
 * - OfflineBanner at top
 * - Track screen view with useAnalytics
 *
 * ============================================================================
 * PHASE 5: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in DynamicTabNavigator.tsx as 'teacher-payroll-list'
 * - Exported from src/screens/admin/payroll/index.ts
 * - Exported from src/screens/admin/index.ts
 */

import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { format } from "date-fns";

// Theme & Branding
import { useAppTheme } from "../../../theme/useAppTheme";
import { useBranding } from "../../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../../offline/networkStore";
import { OfflineBanner } from "../../../offline/OfflineBanner";

// UI Components
import { AppText } from "../../../ui/components/AppText";
import { AppCard } from "../../../ui/components/AppCard";

// Constants
import { DEMO_CUSTOMER_ID } from "../../../lib/supabaseClient";

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  screenId?: string;
  role?: string;
  customerId?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};

type RouteParams = {
  filter?: "all" | "paid" | "pending" | "due-soon";
  month?: string; // 'YYYY-MM' format
};

type TeacherPayrollItem = {
  id: string;
  teacherId: string;
  teacherName: string;
  designation: string;
  department: string;
  employeeId: string;
  baseSalary: number;
  netSalary: number;
  status: "paid" | "pending" | "processing" | "failed";
  paymentDate: string | null;
  dueDate: string;
};

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_TEACHERS: TeacherPayrollItem[] = [
  { id: "tp1", teacherId: "t1", teacherName: "Dr. Rajesh Kumar", designation: "Senior Faculty", department: "Physics", employeeId: "EMP001", baseSalary: 85000, netSalary: 78500, status: "paid", paymentDate: "2024-12-05", dueDate: "2024-12-05" },
  { id: "tp2", teacherId: "t2", teacherName: "Prof. Sunita Sharma", designation: "HOD", department: "Chemistry", employeeId: "EMP002", baseSalary: 95000, netSalary: 87200, status: "paid", paymentDate: "2024-12-05", dueDate: "2024-12-05" },
  { id: "tp3", teacherId: "t3", teacherName: "Mr. Amit Verma", designation: "Faculty", department: "Mathematics", employeeId: "EMP003", baseSalary: 65000, netSalary: 59800, status: "pending", paymentDate: null, dueDate: "2024-12-25" },
  { id: "tp4", teacherId: "t4", teacherName: "Ms. Priya Singh", designation: "Faculty", department: "Biology", employeeId: "EMP004", baseSalary: 62000, netSalary: 57100, status: "pending", paymentDate: null, dueDate: "2024-12-25" },
  { id: "tp5", teacherId: "t5", teacherName: "Dr. Vikram Reddy", designation: "Senior Faculty", department: "Physics", employeeId: "EMP005", baseSalary: 82000, netSalary: 75600, status: "paid", paymentDate: "2024-12-10", dueDate: "2024-12-10" },
  { id: "tp6", teacherId: "t6", teacherName: "Mrs. Anita Gupta", designation: "Faculty", department: "Chemistry", employeeId: "EMP006", baseSalary: 58000, netSalary: 53400, status: "pending", paymentDate: null, dueDate: "2024-12-28" },
  { id: "tp7", teacherId: "t7", teacherName: "Mr. Suresh Patel", designation: "Faculty", department: "Mathematics", employeeId: "EMP007", baseSalary: 60000, netSalary: 55200, status: "processing", paymentDate: null, dueDate: "2024-12-20" },
  { id: "tp8", teacherId: "t8", teacherName: "Dr. Meera Joshi", designation: "Senior Faculty", department: "Biology", employeeId: "EMP008", baseSalary: 78000, netSalary: 71800, status: "paid", paymentDate: "2024-12-08", dueDate: "2024-12-08" },
  { id: "tp9", teacherId: "t9", teacherName: "Mr. Karthik Nair", designation: "Faculty", department: "Physics", employeeId: "EMP009", baseSalary: 55000, netSalary: 50600, status: "pending", paymentDate: null, dueDate: "2024-12-30" },
  { id: "tp10", teacherId: "t10", teacherName: "Ms. Sneha Patel", designation: "Faculty", department: "Chemistry", employeeId: "EMP010", baseSalary: 52000, netSalary: 47800, status: "pending", paymentDate: null, dueDate: "2024-12-25" },
  { id: "tp11", teacherId: "t11", teacherName: "Prof. Ramesh Iyer", designation: "HOD", department: "Mathematics", employeeId: "EMP011", baseSalary: 98000, netSalary: 90100, status: "paid", paymentDate: "2024-12-05", dueDate: "2024-12-05" },
  { id: "tp12", teacherId: "t12", teacherName: "Dr. Kavita Menon", designation: "Senior Faculty", department: "Biology", employeeId: "EMP012", baseSalary: 80000, netSalary: 73600, status: "paid", paymentDate: "2024-12-10", dueDate: "2024-12-10" },
];

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  paid: { color: "#4CAF50", icon: "check-circle", label: "Paid" },
  processing: { color: "#2196F3", icon: "clock-outline", label: "Processing" },
  pending: { color: "#FF9800", icon: "clock-outline", label: "Pending" },
  failed: { color: "#F44336", icon: "alert-circle", label: "Failed" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "All", icon: "format-list-bulleted" },
  { value: "paid", label: "Paid", icon: "check-circle" },
  { value: "pending", label: "Pending", icon: "clock-outline" },
  { value: "due-soon", label: "Due Soon", icon: "calendar-clock" },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatCurrency = (amount: number): string => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const getMonthName = (monthStr?: string): string => {
  if (!monthStr) return format(new Date(), "MMMM yyyy");
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return format(date, "MMMM yyyy");
};

const isDueSoon = (dueDate: string): boolean => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 5 && diffDays >= 0;
};

// =============================================================================
// COMPONENT
// =============================================================================

export const TeacherPayrollListScreen: React.FC<Props> = ({
  screenId = "teacher-payroll-list",
  role = "admin",
  customerId = DEMO_CUSTOMER_ID,
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  // ===========================================================================
  // HOOKS
  // ===========================================================================
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = routeProp || useRoute<any>();

  // Get route params with defaults
  const params = (route?.params || {}) as RouteParams;
  const initialFilter = params.filter || "all";
  const month = params.month || format(new Date(), "yyyy-MM");

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [teachers, setTeachers] = useState<TeacherPayrollItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ===========================================================================
  // DATA FETCHING (Demo)
  // ===========================================================================
  const loadData = useCallback(async () => {
    try {
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setTeachers(DEMO_TEACHERS);
    } catch (err) {
      setError("Failed to load payroll data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId, filter: initialFilter, month },
    });
    loadData();
  }, [screenId, role, customerId, initialFilter, month, trackScreenView, loadData]);

  // ===========================================================================
  // FILTERED DATA
  // ===========================================================================
  const filteredTeachers = useMemo(() => {
    let result = teachers;

    // Apply status filter
    if (filter === "paid") {
      result = result.filter((t) => t.status === "paid");
    } else if (filter === "pending") {
      result = result.filter((t) => t.status === "pending" || t.status === "processing");
    } else if (filter === "due-soon") {
      result = result.filter((t) => t.status !== "paid" && isDueSoon(t.dueDate));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.teacherName.toLowerCase().includes(query) ||
          t.department.toLowerCase().includes(query) ||
          t.employeeId.toLowerCase().includes(query)
      );
    }

    return result;
  }, [teachers, filter, searchQuery]);

  // ===========================================================================
  // SUMMARY STATS
  // ===========================================================================
  const summaryStats = useMemo(() => {
    const total = teachers.reduce((sum, t) => sum + t.netSalary, 0);
    const paid = teachers.filter((t) => t.status === "paid").reduce((sum, t) => sum + t.netSalary, 0);
    const pending = teachers.filter((t) => t.status !== "paid").reduce((sum, t) => sum + t.netSalary, 0);
    const paidCount = teachers.filter((t) => t.status === "paid").length;
    const pendingCount = teachers.filter((t) => t.status !== "paid").length;
    return { total, paid, pending, paidCount, pendingCount };
  }, [teachers]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("teacher_payroll_list_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleTeacherPress = useCallback(
    (teacher: TeacherPayrollItem) => {
      trackEvent("teacher_payroll_item_pressed", { teacherId: teacher.teacherId });
      navigation.navigate("teacher-payroll-detail", { teacherId: teacher.teacherId, month });
    },
    [navigation, trackEvent, month]
  );

  const handleProcessAll = useCallback(() => {
    trackEvent("teacher_payroll_process_all_pressed");
    navigation.navigate("payroll-processing", { month });
  }, [navigation, trackEvent, month]);

  // ===========================================================================
  // RENDER - Loading State
  // ===========================================================================
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("common:status.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER - Error State
  // ===========================================================================
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Oops!" })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {error}
          </AppText>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={loadData}
          >
            <AppText style={styles.actionButtonText}>
              {t("common:actions.retry", { defaultValue: "Try Again" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER ITEM
  // ===========================================================================
  const renderTeacher = ({ item }: { item: TeacherPayrollItem }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const dueSoon = item.status !== "paid" && isDueSoon(item.dueDate);

    return (
      <TouchableOpacity onPress={() => handleTeacherPress(item)} activeOpacity={0.7}>
        <AppCard style={styles.teacherCard}>
          <View style={styles.teacherHeader}>
            <View style={styles.teacherInfo}>
              <AppText style={[styles.teacherName, { color: colors.onSurface }]}>
                {item.teacherName}
              </AppText>
              <AppText style={[styles.teacherMeta, { color: colors.onSurfaceVariant }]}>
                {item.designation} • {item.department}
              </AppText>
              <AppText style={[styles.employeeId, { color: colors.onSurfaceVariant }]}>
                {item.employeeId}
              </AppText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
              <Icon name={statusConfig.icon} size={14} color={statusConfig.color} />
              <AppText style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </AppText>
            </View>
          </View>

          <View style={styles.salaryRow}>
            <View style={styles.salaryItem}>
              <AppText style={[styles.salaryLabel, { color: colors.onSurfaceVariant }]}>Base</AppText>
              <AppText style={[styles.salaryValue, { color: colors.onSurface }]}>
                {formatCurrency(item.baseSalary)}
              </AppText>
            </View>
            <View style={styles.salaryItem}>
              <AppText style={[styles.salaryLabel, { color: colors.onSurfaceVariant }]}>Net</AppText>
              <AppText style={[styles.salaryValue, { color: colors.primary }]}>
                {formatCurrency(item.netSalary)}
              </AppText>
            </View>
            <View style={styles.salaryItem}>
              <AppText style={[styles.salaryLabel, { color: colors.onSurfaceVariant }]}>
                {item.status === "paid" ? "Paid On" : "Due"}
              </AppText>
              <AppText
                style={[
                  styles.salaryValue,
                  { color: dueSoon ? "#F44336" : colors.onSurface },
                ]}
              >
                {item.status === "paid" ? formatDate(item.paymentDate) : formatDate(item.dueDate)}
              </AppText>
            </View>
          </View>

          {dueSoon && (
            <View style={[styles.dueSoonBadge, { backgroundColor: "#F4433615" }]}>
              <Icon name="alert" size={12} color="#F44336" />
              <AppText style={[styles.dueSoonText, { color: "#F44336" }]}>Due Soon</AppText>
            </View>
          )}

          <View style={styles.cardFooter}>
            <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  };

  // ===========================================================================
  // RENDER - Success State
  // ===========================================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("admin:teacherPayrollList.title", { defaultValue: "Teacher Payroll" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {getMonthName(month)}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={handleProcessAll}
          style={styles.processBtn}
          disabled={summaryStats.pendingCount === 0}
        >
          <Icon
            name="credit-card-outline"
            size={22}
            color={summaryStats.pendingCount > 0 ? colors.primary : colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>
              {formatCurrency(summaryStats.total)}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Total</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: "#4CAF50" }]}>
              {formatCurrency(summaryStats.paid)}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Paid ({summaryStats.paidCount})
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: "#FF9800" }]}>
              {formatCurrency(summaryStats.pending)}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Pending ({summaryStats.pendingCount})
            </AppText>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder={t("admin:teacherPayrollList.searchPlaceholder", { defaultValue: "Search teachers..." })}
          placeholderTextColor={colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Icon name="close-circle" size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === opt.value ? colors.primaryContainer : colors.surfaceVariant,
              },
            ]}
            onPress={() => setFilter(opt.value)}
          >
            <Icon
              name={opt.icon}
              size={14}
              color={filter === opt.value ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[
                styles.filterText,
                { color: filter === opt.value ? colors.primary : colors.onSurfaceVariant },
              ]}
            >
              {opt.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Teacher List */}
      <FlatList
        data={filteredTeachers}
        renderItem={renderTeacher}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-search" size={64} color={colors.onSurfaceVariant} />
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {t("admin:teacherPayrollList.noTeachers", { defaultValue: "No teachers found" })}
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  processBtn: {
    padding: 4,
  },
  summaryContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  teacherCard: {
    padding: 14,
  },
  teacherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: "600",
  },
  teacherMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  employeeId: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  salaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  salaryItem: {
    alignItems: "center",
  },
  salaryLabel: {
    fontSize: 11,
  },
  salaryValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  dueSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
    gap: 4,
  },
  dueSoonText: {
    fontSize: 10,
    fontWeight: "600",
  },
  cardFooter: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -10,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});

export default TeacherPayrollListScreen;
