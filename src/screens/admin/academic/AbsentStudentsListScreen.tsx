/**
 * AbsentStudentsListScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display list of all absent students for today with filtering options
 * Type: Dynamic (list view)
 * Accessible from: AttendanceOverviewWidget "Details" button, "View All Absent"
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../../theme/useAppTheme";

// Analytics & Error Tracking
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../../offline/networkStore";
import { OfflineBanner } from "../../../offline/OfflineBanner";

// UI Components
import { AppText } from "../../../ui/components/AppText";
import { AppCard } from "../../../ui/components/AppCard";

// Query Hook
import { useAttendanceOverviewQuery, AbsentPerson } from "../../../hooks/queries/admin/useAttendanceOverviewQuery";

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

// =============================================================================
// COMPONENT
// =============================================================================

export const AbsentStudentsListScreen: React.FC<Props> = ({
  screenId = "absent-students-list",
  role = "admin",
  customerId = DEMO_CUSTOMER_ID,
  navigation: navProp,
  onFocused,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useAttendanceOverviewQuery();

  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId },
    });
  }, [screenId, role, customerId, trackScreenView]);

  const handleBack = useCallback(() => {
    trackEvent("absent_students_list_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleStudentTap = useCallback((studentId: string, studentName: string) => {
    trackEvent("absent_students_list_student_tap", { studentId, studentName });
    navigation.navigate("student-attendance-detail", { studentId, studentName });
  }, [navigation, trackEvent]);

  const renderStudentItem = ({ item }: { item: AbsentPerson }) => (
    <TouchableOpacity
      style={[styles.studentCard, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}
      onPress={() => handleStudentTap(item.id, item.name)}
      accessibilityLabel={`${item.name} from ${item.batch}`}
    >
      <View style={[styles.avatarContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="account-off" size={24} color={colors.error} />
      </View>
      <View style={styles.studentInfo}>
        <AppText style={[styles.studentName, { color: colors.onSurface }]}>{item.name}</AppText>
        <AppText style={[styles.studentBatch, { color: colors.onSurfaceVariant }]}>{item.batch}</AppText>
        {item.reason && (
          <View style={styles.reasonRow}>
            <Icon name="information-outline" size={14} color={colors.onSurfaceVariant} />
            <AppText style={[styles.reasonText, { color: colors.onSurfaceVariant }]}>{item.reason}</AppText>
          </View>
        )}
      </View>
      <Icon name="chevron-right" size={24} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("admin:absentStudentsList.title", { defaultValue: "Absent Students" })}
          </AppText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("admin:absentStudentsList.title", { defaultValue: "Absent Students" })}
          </AppText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("admin:absentStudentsList.error", { defaultValue: "Failed to load data" })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <AppText style={{ color: colors.onPrimary }}>
              {t("common:actions.retry", { defaultValue: "Retry" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const absentStudents = data?.absentStudents || [];
  const totalAbsent = data?.studentAttendance?.absent || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {!isOnline && <OfflineBanner />}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("admin:absentStudentsList.title", { defaultValue: "Absent Students" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {t("admin:absentStudentsList.subtitle", { defaultValue: "Today" })} • {totalAbsent} {t("admin:absentStudentsList.students", { defaultValue: "students" })}
          </AppText>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Summary Card */}
      <AppCard style={[styles.summaryCard, { marginHorizontal: 16, marginBottom: 12 }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.error }]}>{totalAbsent}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Absent</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.success }]}>{data?.studentAttendance?.present || 0}</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Present</AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>{data?.studentAttendance?.percentage || 0}%</AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Attendance</AppText>
          </View>
        </View>
      </AppCard>

      {/* Student List */}
      <FlatList
        data={absentStudents}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="check-circle-outline" size={64} color={colors.success} />
            <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
              {t("admin:absentStudentsList.noAbsent", { defaultValue: "No Absent Students" })}
            </AppText>
            <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
              {t("admin:absentStudentsList.allPresent", { defaultValue: "All students are present today!" })}
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  headerSpacer: { width: 32 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { fontSize: 15, marginTop: 12, textAlign: "center" },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  summaryCard: { padding: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 24, fontWeight: "700" },
  summaryLabel: { fontSize: 12, marginTop: 4 },
  summaryDivider: { width: 1, height: 40 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  studentInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: "600" },
  studentBatch: { fontSize: 13, marginTop: 2 },
  reasonRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  reasonText: { fontSize: 12, fontStyle: "italic" },
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptyMessage: { fontSize: 14, marginTop: 8, textAlign: "center" },
});

export default AbsentStudentsListScreen;
