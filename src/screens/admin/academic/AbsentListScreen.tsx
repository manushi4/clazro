/**
 * AbsentListScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display comprehensive list of all absent students and teachers
 *          with filtering, search, and date selection capabilities
 * Type: Dynamic (list view with filters)
 * Accessible from: AttendanceOverviewWidget "View All" absent,
 *                  AttendanceDashboardScreen "View All" button
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View all absent students/teachers with filtering
 * - Target role: admin, super_admin
 * - Screen ID: absent-list
 * - Route params: date (optional), type (optional: 'students' | 'teachers' | 'all')
 * - Data requirements: daily_attendance table, user_profiles table
 * - Required permissions: view_attendance
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing daily_attendance table (created in Phase 4 of admin_demo.md)
 * - RLS: admin role can read where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useAbsentListQuery: src/hooks/queries/admin/useAbsentListQuery.ts
 * - Types: AbsentPerson
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
  date?: string;
  type?: "students" | "teachers" | "all";
};

type AbsentPerson = {
  id: string;
  name: string;
  type: "student" | "teacher";
  batch?: string;
  subject?: string;
  reason: string | null;
  daysAbsent: number;
  phone?: string;
  email?: string;
  rollNumber?: string;
};

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_ABSENT_STUDENTS: AbsentPerson[] = [
  { id: "s1", name: "Rahul Sharma", type: "student", batch: "JEE Advanced 2025-A", reason: "Medical", daysAbsent: 1, rollNumber: "JEE-A-015", phone: "+91 98765 43201" },
  { id: "s2", name: "Priya Singh", type: "student", batch: "NEET 2025-B", reason: null, daysAbsent: 2, rollNumber: "NEET-B-023", phone: "+91 98765 43202" },
  { id: "s3", name: "Amit Kumar", type: "student", batch: "JEE Mains 2025-C", reason: "Family emergency", daysAbsent: 1, rollNumber: "JEE-C-008", phone: "+91 98765 43203" },
  { id: "s4", name: "Sneha Patel", type: "student", batch: "Foundation XI-A", reason: "Sick", daysAbsent: 3, rollNumber: "FND-A-012", phone: "+91 98765 43204" },
  { id: "s5", name: "Vikram Reddy", type: "student", batch: "NEET 2025-A", reason: null, daysAbsent: 1, rollNumber: "NEET-A-031", phone: "+91 98765 43205" },
  { id: "s6", name: "Ananya Gupta", type: "student", batch: "JEE Advanced 2025-A", reason: "Travel", daysAbsent: 2, rollNumber: "JEE-A-022", phone: "+91 98765 43206" },
  { id: "s7", name: "Karthik Nair", type: "student", batch: "Foundation XI-B", reason: "Not informed", daysAbsent: 1, rollNumber: "FND-B-007", phone: "+91 98765 43207" },
  { id: "s8", name: "Meera Iyer", type: "student", batch: "NEET 2025-B", reason: "Medical checkup", daysAbsent: 1, rollNumber: "NEET-B-019", phone: "+91 98765 43208" },
  { id: "s9", name: "Arjun Menon", type: "student", batch: "JEE Mains 2025-C", reason: null, daysAbsent: 4, rollNumber: "JEE-C-033", phone: "+91 98765 43209" },
  { id: "s10", name: "Divya Pillai", type: "student", batch: "Foundation XI-A", reason: "Fever", daysAbsent: 2, rollNumber: "FND-A-028", phone: "+91 98765 43210" },
];

const DEMO_ABSENT_TEACHERS: AbsentPerson[] = [
  { id: "t1", name: "Dr. Meera Joshi", type: "teacher", subject: "Biology", reason: "Conference", daysAbsent: 1, phone: "+91 98765 11001", email: "meera.j@allen.in" },
  { id: "t2", name: "Prof. Rajesh Kumar", type: "teacher", subject: "Physics", reason: "Medical leave", daysAbsent: 2, phone: "+91 98765 11002", email: "rajesh.k@allen.in" },
];


// =============================================================================
// CONSTANTS
// =============================================================================

const FILTER_OPTIONS = [
  { value: "all", label: "All", icon: "account-group" },
  { value: "students", label: "Students", icon: "account-school" },
  { value: "teachers", label: "Teachers", icon: "human-male-board" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name", icon: "sort-alphabetical-ascending" },
  { value: "daysAbsent", label: "Days Absent", icon: "sort-numeric-descending" },
  { value: "batch", label: "Batch/Subject", icon: "sort-variant" },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
};

const getDaysAbsentColor = (days: number, colors: any): string => {
  if (days >= 3) return colors.error || "#F44336";
  if (days >= 2) return colors.warning || "#FF9800";
  return colors.onSurfaceVariant;
};

// =============================================================================
// COMPONENT
// =============================================================================

export const AbsentListScreen: React.FC<Props> = ({
  screenId = "absent-list",
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
  const selectedDate = params.date || new Date().toISOString().split("T")[0];
  const initialType = params.type || "all";

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [absentList, setAbsentList] = useState<AbsentPerson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>(initialType);
  const [sortBy, setSortBy] = useState<string>("daysAbsent");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ===========================================================================
  // DATA FETCHING (Demo)
  // ===========================================================================
  const loadData = useCallback(async () => {
    try {
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAbsentList([...DEMO_ABSENT_STUDENTS, ...DEMO_ABSENT_TEACHERS]);
    } catch (err) {
      setError("Failed to load absent list");
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
      data: { role, customerId, date: selectedDate, type: initialType },
    });
    loadData();
  }, [screenId, role, customerId, selectedDate, initialType, trackScreenView, loadData]);


  // ===========================================================================
  // FILTERED & SORTED DATA
  // ===========================================================================
  const processedList = useMemo(() => {
    let result = [...absentList];

    // Apply type filter
    if (filterType === "students") {
      result = result.filter((p) => p.type === "student");
    } else if (filterType === "teachers") {
      result = result.filter((p) => p.type === "teacher");
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.batch && p.batch.toLowerCase().includes(query)) ||
          (p.subject && p.subject.toLowerCase().includes(query)) ||
          (p.rollNumber && p.rollNumber.toLowerCase().includes(query))
      );
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "daysAbsent":
          return b.daysAbsent - a.daysAbsent;
        case "batch":
          const aGroup = a.batch || a.subject || "";
          const bGroup = b.batch || b.subject || "";
          return aGroup.localeCompare(bGroup);
        default:
          return b.daysAbsent - a.daysAbsent;
      }
    });

    return result;
  }, [absentList, filterType, searchQuery, sortBy]);

  // ===========================================================================
  // SUMMARY STATS
  // ===========================================================================
  const summaryStats = useMemo(() => {
    const students = absentList.filter((p) => p.type === "student");
    const teachers = absentList.filter((p) => p.type === "teacher");
    const noReason = absentList.filter((p) => !p.reason);
    const multiDay = absentList.filter((p) => p.daysAbsent >= 2);
    return {
      total: absentList.length,
      students: students.length,
      teachers: teachers.length,
      noReason: noReason.length,
      multiDay: multiDay.length,
    };
  }, [absentList]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("absent_list_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handlePersonPress = useCallback(
    (person: AbsentPerson) => {
      trackEvent("absent_list_person_pressed", { personId: person.id, type: person.type });
      if (person.type === "student") {
        navigation.navigate("student-attendance-detail", { studentId: person.id, studentName: person.name });
      }
      // Teachers don't have a detail screen yet
    },
    [navigation, trackEvent]
  );

  const handleContactPress = useCallback(
    (person: AbsentPerson) => {
      trackEvent("absent_list_contact_pressed", { personId: person.id });
      // In real app, would open phone dialer or messaging
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
  // RENDER ITEM
  // ===========================================================================
  const renderPerson = ({ item }: { item: AbsentPerson }) => {
    const isStudent = item.type === "student";
    const daysColor = getDaysAbsentColor(item.daysAbsent, colors);

    return (
      <TouchableOpacity
        onPress={() => handlePersonPress(item)}
        activeOpacity={0.7}
        disabled={!isStudent}
      >
        <AppCard style={styles.personCard}>
          {/* Header Row */}
          <View style={styles.personHeader}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: isStudent ? colors.primaryContainer : colors.tertiaryContainer || colors.secondaryContainer },
              ]}
            >
              <Icon
                name={isStudent ? "account-school" : "human-male-board"}
                size={24}
                color={isStudent ? colors.primary : colors.tertiary || colors.secondary}
              />
            </View>
            <View style={styles.personInfo}>
              <AppText style={[styles.personName, { color: colors.onSurface }]} numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText style={[styles.personDetail, { color: colors.onSurfaceVariant }]}>
                {isStudent ? item.batch : item.subject}
                {item.rollNumber && ` • ${item.rollNumber}`}
              </AppText>
            </View>
            <View style={[styles.daysAbsentBadge, { backgroundColor: `${daysColor}20` }]}>
              <AppText style={[styles.daysAbsentText, { color: daysColor }]}>
                {item.daysAbsent} {item.daysAbsent === 1 ? "day" : "days"}
              </AppText>
            </View>
          </View>

          {/* Reason Row */}
          <View style={styles.reasonRow}>
            <Icon
              name={item.reason ? "information-outline" : "help-circle-outline"}
              size={14}
              color={item.reason ? colors.onSurfaceVariant : colors.warning}
            />
            <AppText
              style={[
                styles.reasonText,
                { color: item.reason ? colors.onSurfaceVariant : colors.warning },
              ]}
              numberOfLines={1}
            >
              {item.reason || "No reason provided"}
            </AppText>
          </View>

          {/* Contact Row */}
          {item.phone && (
            <View style={[styles.contactRow, { borderTopColor: colors.outlineVariant }]}>
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => handleContactPress(item)}
              >
                <Icon name="phone" size={14} color={colors.primary} />
                <AppText style={[styles.contactText, { color: colors.primary }]}>
                  {item.phone}
                </AppText>
              </TouchableOpacity>
              {isStudent && (
                <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
              )}
            </View>
          )}
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
            {t("admin:absentList.title", { defaultValue: "Absent Today" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {formatDate(selectedDate)} • {summaryStats.total} absent
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
              {summaryStats.students}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Students</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.tertiary || colors.secondary }]}>
              {summaryStats.teachers}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Teachers</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.warning }]}>
              {summaryStats.noReason}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>No Reason</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.error }]}>
              {summaryStats.multiDay}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>2+ Days</AppText>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder={t("admin:absentList.searchPlaceholder", { defaultValue: "Search by name, batch, roll no..." })}
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
                backgroundColor: filterType === opt.value ? colors.primaryContainer : colors.surfaceVariant,
              },
            ]}
            onPress={() => setFilterType(opt.value)}
          >
            <Icon
              name={opt.icon}
              size={14}
              color={filterType === opt.value ? colors.primary : colors.onSurfaceVariant}
            />
            <AppText
              style={[
                styles.filterText,
                { color: filterType === opt.value ? colors.primary : colors.onSurfaceVariant },
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
              {sortBy === opt.value && <Icon name="check" size={16} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Absent List */}
      <FlatList
        data={processedList}
        renderItem={renderPerson}
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
            <Icon name="check-circle-outline" size={64} color={colors.success} />
            <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
              {t("admin:absentList.noAbsent", { defaultValue: "No Absences Found" })}
            </AppText>
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {filterType !== "all"
                ? t("admin:absentList.noMatchingFilter", { defaultValue: "No matching results for this filter" })
                : t("admin:absentList.allPresent", { defaultValue: "Everyone is present today!" })}
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
    fontSize: 18,
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
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterText: {
    fontSize: 12,
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
    gap: 10,
  },
  personCard: {
    padding: 14,
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: "600",
  },
  personDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  daysAbsentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysAbsentText: {
    fontSize: 11,
    fontWeight: "600",
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginLeft: 56,
    gap: 6,
  },
  reasonText: {
    fontSize: 12,
    fontStyle: "italic",
    flex: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default AbsentListScreen;
