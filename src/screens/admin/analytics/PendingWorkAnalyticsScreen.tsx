/**
 * PendingWorkAnalyticsScreen - Dedicated Pending Work/Tasks Analytics Screen
 *
 * Purpose: Shows pending work analytics (assignments, tasks, homework pending review)
 * Accessible from: KpiGridWidget pending work/task metrics
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { BarChart } from "react-native-chart-kit";

import { useAppTheme } from "../../../theme/useAppTheme";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { OfflineBanner } from "../../../offline/OfflineBanner";
import { AppText } from "../../../ui/components/AppText";
import { useTrendsQuery } from "../../../hooks/queries/admin/useTrendsQuery";
import type { TrendPeriod } from "../../../hooks/queries/admin/useTrendsQuery";

const SCREEN_WIDTH = Dimensions.get("window").width;

const PERIOD_OPTIONS: { value: TrendPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

export const PendingWorkAnalyticsScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = useNavigation<any>();

  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>("month");

  // Fetch pending work data
  const { data, isLoading, error, refetch, isRefetching } = useTrendsQuery({
    metric: "assignments",
    period: selectedPeriod,
  });

  useFocusEffect(
    useCallback(() => {
      trackScreenView("pending-work-analytics");
      addBreadcrumb({
        category: "navigation",
        message: "Pending Work Analytics Screen viewed",
        level: "info",
      });
    }, [trackScreenView])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePeriodChange = (period: TrendPeriod) => {
    setSelectedPeriod(period);
    trackEvent("pending_work_analytics_period_change", { period });
  };

  const chartWidth = SCREEN_WIDTH - 48;

  // Pending work by type
  const workByTypeData = {
    labels: ["Assign.", "H.Work", "Tests", "Projects"],
    datasets: [{ data: [24, 18, 8, 5] }],
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          Pending Work Analytics
        </AppText>
        <View style={styles.headerRight}>
          <Icon name="clipboard-clock" size={24} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.periodBtn,
                {
                  backgroundColor:
                    selectedPeriod === option.value ? colors.primary : colors.surfaceVariant,
                  borderRadius: borderRadius.small,
                },
              ]}
              onPress={() => handlePeriodChange(option.value)}
            >
              <AppText
                style={[
                  styles.periodText,
                  {
                    color:
                      selectedPeriod === option.value ? colors.onPrimary : colors.onSurfaceVariant,
                  },
                ]}
              >
                {option.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.warningContainer, borderRadius: borderRadius.medium },
            ]}
          >
            <Icon name="clipboard-clock-outline" size={28} color={colors.warning} />
            <AppText style={[styles.summaryValue, { color: colors.warning }]}>
              {data?.currentValue || 55}
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Total Pending
            </AppText>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.errorContainer, borderRadius: borderRadius.medium },
            ]}
          >
            <Icon name="alert-circle" size={28} color={colors.error} />
            <AppText style={[styles.summaryValue, { color: colors.error }]}>
              12
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Overdue
            </AppText>
          </View>
        </View>

        {/* Pending by Type Chart */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <View style={styles.chartHeader}>
            <Icon name="chart-bar" size={20} color={colors.primary} />
            <AppText style={[styles.chartTitle, { color: colors.onSurface }]}>
              Pending by Type
            </AppText>
          </View>
          <BarChart
            data={workByTypeData}
            width={chartWidth}
            height={180}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: () => colors.warning,
              labelColor: () => colors.onSurfaceVariant,
              barPercentage: 0.6,
              propsForBackgroundLines: { stroke: colors.outlineVariant, strokeWidth: 0.5 },
            }}
            style={{ borderRadius: borderRadius.medium }}
          />
        </View>

        {/* Pending Work Stats */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.statsTitle, { color: colors.onSurface }]}>
            Work Status Overview
          </AppText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="clipboard-check" size={24} color={colors.success} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                145
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Reviewed
              </AppText>
            </View>
            <View style={styles.statItem}>
              <Icon name="clipboard-clock" size={24} color={colors.warning} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                55
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Pending
              </AppText>
            </View>
            <View style={styles.statItem}>
              <Icon name="clipboard-alert" size={24} color={colors.error} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                12
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                Overdue
              </AppText>
            </View>
          </View>
        </View>

        {/* Pending by Teacher */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.statsTitle, { color: colors.onSurface }]}>
            Pending by Teacher
          </AppText>
          {[
            { teacher: "Mr. Sharma", pending: 12, subject: "Mathematics" },
            { teacher: "Ms. Gupta", pending: 9, subject: "Science" },
            { teacher: "Mr. Verma", pending: 8, subject: "English" },
            { teacher: "Ms. Singh", pending: 6, subject: "Social Studies" },
          ].map((item, index) => (
            <View key={item.teacher} style={styles.teacherRow}>
              <View style={[styles.teacherAvatar, { backgroundColor: `${colors.primary}20` }]}>
                <AppText style={[styles.avatarText, { color: colors.primary }]}>
                  {item.teacher.split(' ')[1]?.[0] || item.teacher[0]}
                </AppText>
              </View>
              <View style={styles.teacherInfo}>
                <AppText style={[styles.teacherName, { color: colors.onSurface }]}>
                  {item.teacher}
                </AppText>
                <AppText style={[styles.teacherSubject, { color: colors.onSurfaceVariant }]}>
                  {item.subject}
                </AppText>
              </View>
              <View style={[styles.pendingBadge, { backgroundColor: colors.warningContainer }]}>
                <AppText style={[styles.pendingCount, { color: colors.warning }]}>
                  {item.pending}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {/* Pending by Class */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.statsTitle, { color: colors.onSurface }]}>
            Pending by Class
          </AppText>
          {[
            { class: "Class 10-A", pending: 15, total: 45 },
            { class: "Class 10-B", pending: 12, total: 42 },
            { class: "Class 9-A", pending: 18, total: 48 },
            { class: "Class 9-B", pending: 10, total: 44 },
          ].map((item) => (
            <View key={item.class} style={styles.classRow}>
              <View style={styles.classInfo}>
                <AppText style={[styles.className, { color: colors.onSurface }]}>
                  {item.class}
                </AppText>
                <AppText style={[styles.classTotal, { color: colors.onSurfaceVariant }]}>
                  {item.total} students
                </AppText>
              </View>
              <View style={styles.pendingInfo}>
                <View
                  style={[
                    styles.pendingBar,
                    { backgroundColor: colors.surfaceVariant, borderRadius: 4 },
                  ]}
                >
                  <View
                    style={[
                      styles.pendingFill,
                      {
                        width: `${(item.pending / item.total) * 100}%`,
                        backgroundColor: item.pending > 15 ? colors.error : colors.warning,
                        borderRadius: 4,
                      },
                    ]}
                  />
                </View>
                <AppText
                  style={[
                    styles.pendingText,
                    { color: item.pending > 15 ? colors.error : colors.warning },
                  ]}
                >
                  {item.pending} pending
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.surfaceVariant }]}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading pending work analytics...</AppText>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.errorContainer }]}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <AppText style={{ color: colors.error }}>Failed to load pending work data</AppText>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.retryBtn, { backgroundColor: colors.error }]}
            >
              <AppText style={{ color: colors.onError }}>Retry</AppText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4, minWidth: 32, minHeight: 44, justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerRight: { width: 32, alignItems: "flex-end" },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 16 },
  periodRow: { flexDirection: "row", gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  periodText: { fontSize: 14, fontWeight: "500" },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, padding: 16, alignItems: "center", gap: 8 },
  summaryValue: { fontSize: 24, fontWeight: "700" },
  summaryLabel: { fontSize: 12 },
  chartCard: { padding: 16 },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  chartTitle: { fontSize: 16, fontWeight: "600" },
  statsCard: { padding: 16 },
  statsTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  statsGrid: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 6 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11 },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "600" },
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 14, fontWeight: "500" },
  teacherSubject: { fontSize: 12, marginTop: 2 },
  pendingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pendingCount: { fontSize: 14, fontWeight: "700" },
  classRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  classInfo: { flex: 1 },
  className: { fontSize: 14, fontWeight: "500" },
  classTotal: { fontSize: 12, marginTop: 2 },
  pendingInfo: { flexDirection: "column", alignItems: "flex-end", gap: 4, flex: 1 },
  pendingBar: { width: "100%", height: 8, overflow: "hidden" },
  pendingFill: { height: "100%" },
  pendingText: { fontSize: 12, fontWeight: "600" },
  loadingCard: { padding: 48, alignItems: "center", borderRadius: 12 },
  errorCard: { padding: 24, alignItems: "center", gap: 8, borderRadius: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
});

export default PendingWorkAnalyticsScreen;
