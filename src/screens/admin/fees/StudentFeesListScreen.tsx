/**
 * StudentFeesListScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display list of students with their fee status
 * Type: Fixed (custom component with list functionality)
 * Accessible from: StudentFeesDashboardWidget, Finance Dashboard
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

import { useAppTheme } from "../../../theme/useAppTheme";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { OfflineBanner } from "../../../offline/OfflineBanner";
import { AppText } from "../../../ui/components/AppText";
import { AppCard } from "../../../ui/components/AppCard";
import { DEMO_CUSTOMER_ID } from "../../../lib/supabaseClient";

type Props = {
  screenId?: string;
  navigation?: any;
  route?: any;
};

type RouteParams = {
  filter?: "all" | "pending" | "overdue" | "paid";
};

type StudentFeeItem = {
  id: string;
  studentName: string;
  batch: string;
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  status: "paid" | "pending" | "partial" | "overdue";
  lastPaymentDate?: string;
  dueDate?: string;
};

// Demo data
const DEMO_STUDENTS: StudentFeeItem[] = [
  { id: "1", studentName: "Rahul Sharma", batch: "JEE Advanced 2025-A", totalFees: 150000, paidAmount: 100000, pendingAmount: 50000, status: "overdue", dueDate: "2024-10-15" },
  { id: "2", studentName: "Priya Singh", batch: "NEET 2025-B", totalFees: 120000, paidAmount: 120000, pendingAmount: 0, status: "paid", lastPaymentDate: "2024-12-01" },
  { id: "3", studentName: "Amit Kumar", batch: "JEE Mains 2025-C", totalFees: 100000, paidAmount: 50000, pendingAmount: 50000, status: "partial", dueDate: "2024-12-31" },
  { id: "4", studentName: "Sneha Patel", batch: "Foundation XI-A", totalFees: 80000, paidAmount: 0, pendingAmount: 80000, status: "pending", dueDate: "2025-01-15" },
  { id: "5", studentName: "Vikram Reddy", batch: "JEE Advanced 2025-A", totalFees: 150000, paidAmount: 75000, pendingAmount: 75000, status: "overdue", dueDate: "2024-11-01" },
  { id: "6", studentName: "Ananya Gupta", batch: "NEET 2025-B", totalFees: 120000, paidAmount: 120000, pendingAmount: 0, status: "paid", lastPaymentDate: "2024-11-15" },
  { id: "7", studentName: "Karthik Nair", batch: "Foundation XI-B", totalFees: 80000, paidAmount: 40000, pendingAmount: 40000, status: "pending", dueDate: "2025-01-31" },
  { id: "8", studentName: "Meera Joshi", batch: "JEE Mains 2025-C", totalFees: 100000, paidAmount: 0, pendingAmount: 100000, status: "overdue", dueDate: "2024-09-30" },
];

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  paid: { color: "#4CAF50", icon: "check-circle", label: "Paid" },
  partial: { color: "#FF9800", icon: "clock-outline", label: "Partial" },
  pending: { color: "#2196F3", icon: "clock-outline", label: "Pending" },
  overdue: { color: "#F44336", icon: "alert-circle", label: "Overdue" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "All", icon: "format-list-bulleted" },
  { value: "pending", label: "Pending", icon: "clock-outline" },
  { value: "overdue", label: "Overdue", icon: "alert-circle" },
  { value: "paid", label: "Paid", icon: "check-circle" },
];

const formatCurrency = (amount: number): string => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
};

export const StudentFeesListScreen: React.FC<Props> = ({
  screenId = "student-fees-list",
  navigation: navProp,
  route: routeProp,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const navigation = navProp || useNavigation<any>();
  const route = routeProp || useRoute<any>();

  const params = (route?.params || {}) as RouteParams;
  const initialFilter = params.filter || "all";

  const [filter, setFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({ category: "navigation", message: `Screen viewed: ${screenId}`, level: "info" });
  }, [screenId, trackScreenView]);

  const filteredStudents = useMemo(() => {
    let result = DEMO_STUDENTS;
    if (filter !== "all") {
      result = result.filter((s) => s.status === filter || (filter === "pending" && s.status === "partial"));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) => s.studentName.toLowerCase().includes(query) || s.batch.toLowerCase().includes(query));
    }
    return result;
  }, [filter, searchQuery]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
  }, []);

  const handleStudentPress = useCallback((student: StudentFeeItem) => {
    trackEvent("student_fee_item_pressed", { studentId: student.id });
    navigation.navigate("student-fee-detail", { studentId: student.id, studentName: student.studentName });
  }, [navigation, trackEvent]);

  const renderStudent = ({ item }: { item: StudentFeeItem }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <TouchableOpacity onPress={() => handleStudentPress(item)} activeOpacity={0.7}>
        <AppCard style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <View style={styles.studentInfo}>
              <AppText style={[styles.studentName, { color: colors.onSurface }]}>{item.studentName}</AppText>
              <AppText style={[styles.studentBatch, { color: colors.onSurfaceVariant }]}>{item.batch}</AppText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
              <Icon name={statusConfig.icon} size={14} color={statusConfig.color} />
              <AppText style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</AppText>
            </View>
          </View>
          <View style={styles.feeRow}>
            <View style={styles.feeItem}>
              <AppText style={[styles.feeLabel, { color: colors.onSurfaceVariant }]}>Total</AppText>
              <AppText style={[styles.feeValue, { color: colors.onSurface }]}>{formatCurrency(item.totalFees)}</AppText>
            </View>
            <View style={styles.feeItem}>
              <AppText style={[styles.feeLabel, { color: colors.onSurfaceVariant }]}>Paid</AppText>
              <AppText style={[styles.feeValue, { color: "#4CAF50" }]}>{formatCurrency(item.paidAmount)}</AppText>
            </View>
            <View style={styles.feeItem}>
              <AppText style={[styles.feeLabel, { color: colors.onSurfaceVariant }]}>Pending</AppText>
              <AppText style={[styles.feeValue, { color: item.pendingAmount > 0 ? "#F44336" : colors.onSurface }]}>{formatCurrency(item.pendingAmount)}</AppText>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <OfflineBanner />
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>Student Fees</AppText>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder="Search students..."
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

      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.filterChip, { backgroundColor: filter === opt.value ? colors.primaryContainer : colors.surfaceVariant }]}
            onPress={() => setFilter(opt.value)}
          >
            <Icon name={opt.icon} size={14} color={filter === opt.value ? colors.primary : colors.onSurfaceVariant} />
            <AppText style={[styles.filterText, { color: filter === opt.value ? colors.primary : colors.onSurfaceVariant }]}>{opt.label}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-search" size={64} color={colors.onSurfaceVariant} />
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>No students found</AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  searchContainer: { flexDirection: "row", alignItems: "center", margin: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
  filterText: { fontSize: 12, fontWeight: "500" },
  listContent: { padding: 16, paddingTop: 8, gap: 12 },
  studentCard: { padding: 14 },
  studentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: "600" },
  studentBatch: { fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 11, fontWeight: "600" },
  feeRow: { flexDirection: "row", justifyContent: "space-between" },
  feeItem: { alignItems: "center" },
  feeLabel: { fontSize: 11 },
  feeValue: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  cardFooter: { position: "absolute", right: 12, top: "50%", marginTop: -10 },
  emptyContainer: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14 },
});

export default StudentFeesListScreen;
