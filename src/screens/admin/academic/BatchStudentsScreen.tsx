/**
 * BatchStudentsScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display all students in a specific batch with performance metrics,
 *          search, filtering, and sorting capabilities
 * Type: Fixed (custom component with list functionality)
 * Accessible from: BatchPerformanceWidget student count tap, BatchDetailScreen
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View all students in a batch with performance data
 * - Target role: admin, super_admin
 * - Screen ID: batch-students
 * - Route params: batchId (required), sortBy (optional), filterBy (optional)
 * - Data requirements: batch_performance table, user_profiles table
 * - Required permissions: view_batches, view_students
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing batch_performance table (created in Phase 4 of admin_demo.md)
 * - Uses user_profiles table for student details
 * - RLS: admin role can read where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useBatchStudentsQuery: src/hooks/queries/admin/useBatchStudentsQuery.ts
 * - Types: BatchStudentItem
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
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
  batchId?: string;
  batchName?: string;
  sortBy?: "rank" | "name" | "score" | "attendance";
  filterBy?: "all" | "top-performers" | "at-risk" | "low-attendance";
};

type BatchStudentItem = {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  avgScore: number;
  attendance: number;
  rank: number;
  trend: number;
  testsAttended: number;
  totalTests: number;
  lastTestScore: number;
  status: "active" | "inactive" | "on-leave";
};

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_STUDENTS: BatchStudentItem[] = [
  { id: "s1", name: "Arjun Sharma", rollNumber: "JEE-A-001", email: "arjun.s@email.com", phone: "+91 98765 43201", avgScore: 95, attendance: 98, rank: 1, trend: 3, testsAttended: 12, totalTests: 12, lastTestScore: 97, status: "active" },
  { id: "s2", name: "Priya Patel", rollNumber: "JEE-A-002", email: "priya.p@email.com", phone: "+91 98765 43202", avgScore: 93, attendance: 96, rank: 2, trend: 2, testsAttended: 12, totalTests: 12, lastTestScore: 94, status: "active" },
  { id: "s3", name: "Rahul Kumar", rollNumber: "JEE-A-003", email: "rahul.k@email.com", phone: "+91 98765 43203", avgScore: 91, attendance: 94, rank: 3, trend: -1, testsAttended: 11, totalTests: 12, lastTestScore: 88, status: "active" },
  { id: "s4", name: "Sneha Gupta", rollNumber: "JEE-A-004", email: "sneha.g@email.com", phone: "+91 98765 43204", avgScore: 90, attendance: 97, rank: 4, trend: 4, testsAttended: 12, totalTests: 12, lastTestScore: 92, status: "active" },
  { id: "s5", name: "Amit Singh", rollNumber: "JEE-A-005", email: "amit.s@email.com", phone: "+91 98765 43205", avgScore: 88, attendance: 92, rank: 5, trend: 1, testsAttended: 11, totalTests: 12, lastTestScore: 89, status: "active" },
  { id: "s6", name: "Neha Verma", rollNumber: "JEE-A-006", email: "neha.v@email.com", phone: "+91 98765 43206", avgScore: 86, attendance: 90, rank: 6, trend: -2, testsAttended: 11, totalTests: 12, lastTestScore: 82, status: "active" },
  { id: "s7", name: "Vikram Reddy", rollNumber: "JEE-A-007", email: "vikram.r@email.com", phone: "+91 98765 43207", avgScore: 84, attendance: 88, rank: 7, trend: 0, testsAttended: 10, totalTests: 12, lastTestScore: 85, status: "active" },
  { id: "s8", name: "Anita Joshi", rollNumber: "JEE-A-008", email: "anita.j@email.com", phone: "+91 98765 43208", avgScore: 82, attendance: 95, rank: 8, trend: 3, testsAttended: 12, totalTests: 12, lastTestScore: 86, status: "active" },
  { id: "s9", name: "Karthik Nair", rollNumber: "JEE-A-009", email: "karthik.n@email.com", phone: "+91 98765 43209", avgScore: 80, attendance: 78, rank: 9, trend: -3, testsAttended: 9, totalTests: 12, lastTestScore: 75, status: "active" },
  { id: "s10", name: "Meera Iyer", rollNumber: "JEE-A-010", email: "meera.i@email.com", phone: "+91 98765 43210", avgScore: 78, attendance: 85, rank: 10, trend: 1, testsAttended: 10, totalTests: 12, lastTestScore: 80, status: "active" },
  { id: "s11", name: "Suresh Menon", rollNumber: "JEE-A-011", email: "suresh.m@email.com", phone: "+91 98765 43211", avgScore: 75, attendance: 82, rank: 11, trend: -1, testsAttended: 10, totalTests: 12, lastTestScore: 72, status: "active" },
  { id: "s12", name: "Pooja Sharma", rollNumber: "JEE-A-012", email: "pooja.s@email.com", phone: "+91 98765 43212", avgScore: 72, attendance: 75, rank: 12, trend: -4, testsAttended: 9, totalTests: 12, lastTestScore: 68, status: "on-leave" },
  { id: "s13", name: "Ravi Krishnan", rollNumber: "JEE-A-013", email: "ravi.k@email.com", phone: "+91 98765 43213", avgScore: 68, attendance: 70, rank: 13, trend: -2, testsAttended: 8, totalTests: 12, lastTestScore: 65, status: "active" },
  { id: "s14", name: "Divya Pillai", rollNumber: "JEE-A-014", email: "divya.p@email.com", phone: "+91 98765 43214", avgScore: 65, attendance: 68, rank: 14, trend: 0, testsAttended: 8, totalTests: 12, lastTestScore: 62, status: "active" },
  { id: "s15", name: "Arun Bhat", rollNumber: "JEE-A-015", email: "arun.b@email.com", phone: "+91 98765 43215", avgScore: 60, attendance: 65, rank: 15, trend: -5, testsAttended: 7, totalTests: 12, lastTestScore: 55, status: "at-risk" },
];

// =============================================================================
// CONSTANTS
// =============================================================================

const RANK_BADGES = ["🥇", "🥈", "🥉"];

const FILTER_OPTIONS = [
  { value: "all", label: "All Students", icon: "account-group" },
  { value: "top-performers", label: "Top Performers", icon: "trophy" },
  { value: "at-risk", label: "At Risk", icon: "alert" },
  { value: "low-attendance", label: "Low Attendance", icon: "calendar-remove" },
];

const SORT_OPTIONS = [
  { value: "rank", label: "Rank", icon: "sort-numeric-ascending" },
  { value: "name", label: "Name", icon: "sort-alphabetical-ascending" },
  { value: "score", label: "Score", icon: "chart-line" },
  { value: "attendance", label: "Attendance", icon: "calendar-check" },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getPerformanceColor = (score: number, colors: any): string => {
  if (score >= 85) return colors.success || "#4CAF50";
  if (score >= 70) return colors.warning || "#FF9800";
  return colors.error || "#F44336";
};

const getAttendanceColor = (attendance: number, colors: any): string => {
  if (attendance >= 90) return colors.success || "#4CAF50";
  if (attendance >= 75) return colors.warning || "#FF9800";
  return colors.error || "#F44336";
};

const getTrendIcon = (trend: number): string => {
  if (trend > 0) return "trending-up";
  if (trend < 0) return "trending-down";
  return "minus";
};

const getTrendColor = (trend: number, colors: any): string => {
  if (trend > 0) return colors.success || "#4CAF50";
  if (trend < 0) return colors.error || "#F44336";
  return colors.onSurfaceVariant;
};

const getStatusColor = (status: string, colors: any): string => {
  switch (status) {
    case "active": return colors.success || "#4CAF50";
    case "on-leave": return colors.warning || "#FF9800";
    case "at-risk": return colors.error || "#F44336";
    default: return colors.onSurfaceVariant;
  }
};

// =============================================================================
// COMPONENT
// =============================================================================

export const BatchStudentsScreen: React.FC<Props> = ({
  screenId = "batch-students",
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
  const batchId = params.batchId || "";
  const batchName = params.batchName || "Batch Students";
  const initialSort = params.sortBy || "rank";
  const initialFilter = params.filterBy || "all";

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [students, setStudents] = useState<BatchStudentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [filterBy, setFilterBy] = useState<string>(initialFilter);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ===========================================================================
  // DATA FETCHING (Demo)
  // ===========================================================================
  const loadData = useCallback(async () => {
    try {
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStudents(DEMO_STUDENTS);
    } catch (err) {
      setError("Failed to load students");
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
      data: { role, customerId, batchId },
    });
    loadData();
  }, [screenId, role, customerId, batchId, trackScreenView, loadData]);

  // ===========================================================================
  // FILTERED & SORTED DATA
  // ===========================================================================
  const processedStudents = useMemo(() => {
    let result = [...students];

    // Apply filter
    if (filterBy === "top-performers") {
      result = result.filter((s) => s.avgScore >= 85);
    } else if (filterBy === "at-risk") {
      result = result.filter((s) => s.avgScore < 70 || s.attendance < 75);
    } else if (filterBy === "low-attendance") {
      result = result.filter((s) => s.attendance < 80);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.rollNumber.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "score":
          return b.avgScore - a.avgScore;
        case "attendance":
          return b.attendance - a.attendance;
        case "rank":
        default:
          return a.rank - b.rank;
      }
    });

    return result;
  }, [students, filterBy, searchQuery, sortBy]);

  // ===========================================================================
  // SUMMARY STATS
  // ===========================================================================
  const summaryStats = useMemo(() => {
    const total = students.length;
    const avgScore = total > 0 
      ? Math.round(students.reduce((sum, s) => sum + s.avgScore, 0) / total) 
      : 0;
    const avgAttendance = total > 0
      ? Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / total)
      : 0;
    const topPerformers = students.filter((s) => s.avgScore >= 85).length;
    const atRisk = students.filter((s) => s.avgScore < 70 || s.attendance < 75).length;
    return { total, avgScore, avgAttendance, topPerformers, atRisk };
  }, [students]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("batch_students_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleStudentPress = useCallback(
    (student: BatchStudentItem) => {
      trackEvent("batch_students_item_pressed", { studentId: student.id, batchId });
      navigation.navigate("student-attendance-detail", { studentId: student.id });
    },
    [navigation, trackEvent, batchId]
  );

  const handleContactStudent = useCallback(
    (student: BatchStudentItem) => {
      trackEvent("batch_students_contact_pressed", { studentId: student.id });
      // In real app, would open phone/email
    },
    [trackEvent]
  );

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
  // RENDER - No batchId
  // ===========================================================================
  if (!batchId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <Icon name="school-outline" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Error" })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:batchStudents.noBatchSelected", { defaultValue: "No batch selected. Please select a batch first." })}
          </AppText>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleBack}
          >
            <AppText style={styles.actionButtonText}>
              {t("common:actions.goBack", { defaultValue: "Go Back" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER ITEM
  // ===========================================================================
  const renderStudent = ({ item, index }: { item: BatchStudentItem; index: number }) => {
    const isTopThree = item.rank <= 3;
    const scoreColor = getPerformanceColor(item.avgScore, colors);
    const attendanceColor = getAttendanceColor(item.attendance, colors);
    const statusColor = getStatusColor(item.status, colors);

    return (
      <TouchableOpacity onPress={() => handleStudentPress(item)} activeOpacity={0.7}>
        <AppCard style={styles.studentCard}>
          {/* Header Row */}
          <View style={styles.studentHeader}>
            <View style={styles.rankContainer}>
              {isTopThree ? (
                <AppText style={styles.rankBadge}>{RANK_BADGES[item.rank - 1]}</AppText>
              ) : (
                <View style={[styles.rankCircle, { backgroundColor: colors.surfaceVariant }]}>
                  <AppText style={[styles.rankNumber, { color: colors.onSurfaceVariant }]}>
                    {item.rank}
                  </AppText>
                </View>
              )}
            </View>
            <View style={styles.studentInfo}>
              <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText style={[styles.rollNumber, { color: colors.onSurfaceVariant }]}>
                {item.rollNumber}
              </AppText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <AppText style={[styles.statusText, { color: statusColor }]}>
                {item.status === "active" ? "Active" : item.status === "on-leave" ? "Leave" : "At Risk"}
              </AppText>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Score</AppText>
              <View style={styles.statValueRow}>
                <AppText style={[styles.statValue, { color: scoreColor }]}>{item.avgScore}%</AppText>
                <View style={styles.trendContainer}>
                  <Icon name={getTrendIcon(item.trend)} size={12} color={getTrendColor(item.trend, colors)} />
                  <AppText style={[styles.trendText, { color: getTrendColor(item.trend, colors) }]}>
                    {Math.abs(item.trend)}
                  </AppText>
                </View>
              </View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.statItem}>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Attendance</AppText>
              <AppText style={[styles.statValue, { color: attendanceColor }]}>{item.attendance}%</AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.statItem}>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Tests</AppText>
              <AppText style={[styles.statValue, { color: colors.primary }]}>
                {item.testsAttended}/{item.totalTests}
              </AppText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.statItem}>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Last Test</AppText>
              <AppText style={[styles.statValue, { color: getPerformanceColor(item.lastTestScore, colors) }]}>
                {item.lastTestScore}%
              </AppText>
            </View>
          </View>

          {/* Contact Row */}
          <View style={styles.contactRow}>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleContactStudent(item)}
            >
              <Icon name="phone" size={14} color={colors.primary} />
              <AppText style={[styles.contactText, { color: colors.primary }]} numberOfLines={1}>
                {item.phone}
              </AppText>
            </TouchableOpacity>
            <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
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
            {t("admin:batchStudents.title", { defaultValue: "Batch Students" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {batchName} • {summaryStats.total} students
          </AppText>
        </View>
        <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)} style={styles.sortBtn}>
          <Icon name="sort" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>
              {summaryStats.avgScore}%
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Avg Score</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.success }]}>
              {summaryStats.avgAttendance}%
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Attendance</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: "#FFD700" }]}>
              {summaryStats.topPerformers}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Top Performers</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.error }]}>
              {summaryStats.atRisk}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>At Risk</AppText>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder={t("admin:batchStudents.searchPlaceholder", { defaultValue: "Search students..." })}
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
                backgroundColor: filterBy === opt.value ? colors.primaryContainer : colors.surfaceVariant,
              },
            ]}
            onPress={() => setFilterBy(opt.value)}
          >
            <Icon
              name={opt.icon}
              size={14}
              color={filterBy === opt.value ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[
                styles.filterText,
                { color: filterBy === opt.value ? colors.primary : colors.onSurfaceVariant },
              ]}
            >
              {opt.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort Menu (Dropdown) */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.sortMenuItem,
                sortBy === opt.value && { backgroundColor: colors.primaryContainer },
              ]}
              onPress={() => {
                setSortBy(opt.value);
                setShowSortMenu(false);
              }}
            >
              <Icon
                name={opt.icon}
                size={16}
                color={sortBy === opt.value ? colors.primary : colors.onSurfaceVariant}
              />
              <AppText
                style={[
                  styles.sortMenuText,
                  { color: sortBy === opt.value ? colors.primary : colors.onSurface },
                ]}
              >
                {opt.label}
              </AppText>
              {sortBy === opt.value && (
                <Icon name="check" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Student List */}
      <FlatList
        data={processedStudents}
        renderItem={renderStudent}
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
              {t("admin:batchStudents.noStudents", { defaultValue: "No students found" })}
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
  sortBtn: {
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
    fontSize: 10,
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
    flexWrap: "wrap",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterText: {
    fontSize: 11,
    fontWeight: "500",
  },
  sortMenu: {
    position: "absolute",
    top: 56,
    right: 16,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 100,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  sortMenuText: {
    fontSize: 14,
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  studentCard: {
    padding: 14,
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  rankContainer: {
    width: 32,
    alignItems: "center",
  },
  rankBadge: {
    fontSize: 20,
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: "600",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
  },
  rollNumber: {
    fontSize: 12,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendText: {
    fontSize: 10,
    fontWeight: "500",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    fontSize: 12,
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

export default BatchStudentsScreen;
