/**
 * FinanceReportsScreen - Admin Finance Reports Fixed Screen
 *
 * Purpose: Generate and view financial reports with export capabilities
 * Type: Fixed (custom UI) - Report generation and viewing
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useAppTheme } from "../../theme/useAppTheme";
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";

type Props = {
  screenId?: string;
  navigation?: any;
  onFocused?: () => void;
};

type ReportType = "revenue" | "expense" | "profit" | "collection" | "summary";
type ReportPeriod = "week" | "month" | "quarter" | "year";

type Report = {
  id: string;
  name: string;
  type: ReportType;
  period: ReportPeriod;
  generatedAt: string;
  size: string;
};

const DEMO_REPORTS: Report[] = [
  { id: "1", name: "Monthly Revenue Report", type: "revenue", period: "month", generatedAt: new Date(Date.now() - 1800000).toISOString(), size: "2.4 MB" },
  { id: "2", name: "Quarterly Expense Summary", type: "expense", period: "quarter", generatedAt: new Date(Date.now() - 7200000).toISOString(), size: "1.8 MB" },
  { id: "3", name: "Fee Collection Report", type: "collection", period: "month", generatedAt: new Date(Date.now() - 86400000).toISOString(), size: "3.1 MB" },
  { id: "4", name: "Annual Financial Summary", type: "summary", period: "year", generatedAt: new Date(Date.now() - 172800000).toISOString(), size: "5.6 MB" },
];

const REPORT_TYPES = [
  { value: "revenue" as ReportType, label: "Revenue", icon: "cash-plus", color: "#4CAF50" },
  { value: "expense" as ReportType, label: "Expense", icon: "cash-minus", color: "#F44336" },
  { value: "profit" as ReportType, label: "Profit", icon: "chart-line", color: "#2196F3" },
  { value: "collection" as ReportType, label: "Collection", icon: "cash-check", color: "#FF9800" },
  { value: "summary" as ReportType, label: "Summary", icon: "file-document", color: "#9C27B0" },
];

const PERIODS = [
  { value: "week" as ReportPeriod, label: "Week" },
  { value: "month" as ReportPeriod, label: "Month" },
  { value: "quarter" as ReportPeriod, label: "Quarter" },
  { value: "year" as ReportPeriod, label: "Year" },
];

export const FinanceReportsScreen: React.FC<Props> = ({ screenId = "finance-reports", navigation: navProp }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();

  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("month");
  const [reports, setReports] = useState<Report[]>(DEMO_REPORTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({ category: "navigation", message: `Screen viewed: ${screenId}`, level: "info" });
  }, [screenId, trackScreenView]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedType) {
      Alert.alert("Select Type", "Please select a report type.");
      return;
    }
    if (!isOnline) {
      Alert.alert("Offline", "This action requires internet.");
      return;
    }
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    const typeConfig = REPORT_TYPES.find((t) => t.value === selectedType);
    const newReport: Report = {
      id: `new-${Date.now()}`,
      name: `${PERIODS.find((p) => p.value === selectedPeriod)?.label} ${typeConfig?.label} Report`,
      type: selectedType,
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      size: `${(Math.random() * 4 + 1).toFixed(1)} MB`,
    };
    setReports((prev) => [newReport, ...prev]);
    setIsGenerating(false);
    setSelectedType(null);
    trackEvent("report_generated", { type: selectedType, period: selectedPeriod });
    Alert.alert("Success", "Report generated successfully.");
  }, [selectedType, selectedPeriod, isOnline, trackEvent]);

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getTypeConfig = (type: ReportType) => REPORT_TYPES.find((t) => t.value === type);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>Finance Reports</AppText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      >
        <AppCard style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>Generate New Report</AppText>
          <AppText style={[styles.label, { color: colors.onSurfaceVariant }]}>Report Type</AppText>
          <View style={styles.typeGrid}>
            {REPORT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.typeCard, { backgroundColor: selectedType === type.value ? `${type.color}15` : colors.surfaceVariant, borderColor: selectedType === type.value ? type.color : colors.outlineVariant, borderRadius: borderRadius.md }]}
                onPress={() => setSelectedType(selectedType === type.value ? null : type.value)}
              >
                <Icon name={type.icon} size={24} color={selectedType === type.value ? type.color : colors.onSurfaceVariant} />
                <AppText style={[styles.typeLabel, { color: selectedType === type.value ? type.color : colors.onSurfaceVariant }]}>{type.label}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          <AppText style={[styles.label, { color: colors.onSurfaceVariant, marginTop: 16 }]}>Period</AppText>
          <View style={styles.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.periodChip, { backgroundColor: selectedPeriod === p.value ? colors.primaryContainer : colors.surfaceVariant, borderRadius: borderRadius.full }]}
                onPress={() => setSelectedPeriod(p.value)}
              >
                <AppText style={[styles.periodText, { color: selectedPeriod === p.value ? colors.primary : colors.onSurfaceVariant }]}>{p.label}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: isGenerating || !isOnline ? colors.outlineVariant : colors.primary, borderRadius: borderRadius.md }]}
            onPress={handleGenerate}
            disabled={isGenerating || !isOnline}
          >
            {isGenerating ? <ActivityIndicator size="small" color="#FFF" /> : <><Icon name="file-plus" size={20} color="#FFF" /><AppText style={styles.generateText}>Generate Report</AppText></>}
          </TouchableOpacity>
        </AppCard>

        <AppCard style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>Recent Reports</AppText>
          {reports.map((report) => {
            const cfg = getTypeConfig(report.type);
            return (
              <View key={report.id} style={[styles.reportItem, { borderBottomColor: colors.outlineVariant }]}>
                <View style={[styles.reportIcon, { backgroundColor: `${cfg?.color}20` }]}>
                  <Icon name={cfg?.icon || "file"} size={24} color={cfg?.color} />
                </View>
                <View style={styles.reportInfo}>
                  <AppText style={[styles.reportName, { color: colors.onSurface }]} numberOfLines={1}>{report.name}</AppText>
                  <AppText style={[styles.reportMeta, { color: colors.onSurfaceVariant }]}>{formatTime(report.generatedAt)} • {report.size}</AppText>
                </View>
                <View style={styles.reportActions}>
                  <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="file-pdf-box" size={18} color="#F44336" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="file-excel" size={18} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  section: { padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: { width: "31%", padding: 12, alignItems: "center", borderWidth: 1.5 },
  typeLabel: { fontSize: 11, fontWeight: "500", marginTop: 6 },
  periodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 8 },
  periodText: { fontSize: 13, fontWeight: "500" },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, marginTop: 20, gap: 8 },
  generateText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  reportItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  reportIcon: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  reportInfo: { flex: 1 },
  reportName: { fontSize: 14, fontWeight: "600" },
  reportMeta: { fontSize: 12, marginTop: 2 },
  reportActions: { flexDirection: "row", gap: 8 },
  exportBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});

export default FinanceReportsScreen;
