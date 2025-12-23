/**
 * AdmissionsListScreen - Dynamic Screen (Admin)
 *
 * Purpose: Display list of all admission inquiries with filtering options
 * Type: Dynamic (list view)
 * Accessible from: AdmissionStatsWidget "View All", status/program taps
 */

import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
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
import { useAdmissionStatsQuery } from "../../../hooks/queries/admin/useAdmissionStatsQuery";

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
  status?: string;
  program?: string;
};

type AdmissionItem = {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  program: string;
  status: 'inquiry' | 'follow-up' | 'admitted' | 'rejected';
  date: string;
  counselor: string;
};

// Demo data
const DEMO_ADMISSIONS: AdmissionItem[] = [
  { id: 'adm1', studentName: 'Arjun Mehta', parentName: 'Rajesh Mehta', phone: '+91 98765 43210', program: 'JEE', status: 'inquiry', date: '2024-12-20', counselor: 'Ms. Priya' },
  { id: 'adm2', studentName: 'Sneha Gupta', parentName: 'Amit Gupta', phone: '+91 98765 43211', program: 'NEET', status: 'follow-up', date: '2024-12-19', counselor: 'Mr. Sharma' },
  { id: 'adm3', studentName: 'Rahul Singh', parentName: 'Vikram Singh', phone: '+91 98765 43212', program: 'JEE', status: 'admitted', date: '2024-12-18', counselor: 'Ms. Priya' },
  { id: 'adm4', studentName: 'Priya Patel', parentName: 'Suresh Patel', phone: '+91 98765 43213', program: 'Foundation', status: 'inquiry', date: '2024-12-17', counselor: 'Mr. Sharma' },
  { id: 'adm5', studentName: 'Amit Kumar', parentName: 'Ramesh Kumar', phone: '+91 98765 43214', program: 'NEET', status: 'admitted', date: '2024-12-16', counselor: 'Ms. Priya' },
  { id: 'adm6', studentName: 'Neha Verma', parentName: 'Sanjay Verma', phone: '+91 98765 43215', program: 'JEE', status: 'follow-up', date: '2024-12-15', counselor: 'Mr. Sharma' },
  { id: 'adm7', studentName: 'Vikram Reddy', parentName: 'Krishna Reddy', phone: '+91 98765 43216', program: 'Foundation', status: 'rejected', date: '2024-12-14', counselor: 'Ms. Priya' },
  { id: 'adm8', studentName: 'Ananya Sharma', parentName: 'Deepak Sharma', phone: '+91 98765 43217', program: 'NEET', status: 'inquiry', date: '2024-12-13', counselor: 'Mr. Sharma' },
];

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  inquiry: { color: '#2196F3', icon: 'help-circle', label: 'Inquiry' },
  'follow-up': { color: '#FF9800', icon: 'clock-outline', label: 'Follow-up' },
  admitted: { color: '#4CAF50', icon: 'check-circle', label: 'Admitted' },
  rejected: { color: '#F44336', icon: 'close-circle', label: 'Rejected' },
};

const PROGRAM_COLORS: Record<string, string> = {
  JEE: '#2196F3',
  NEET: '#4CAF50',
  Foundation: '#FF9800',
};

// =============================================================================
// COMPONENT
// =============================================================================

export const AdmissionsListScreen: React.FC<Props> = ({
  screenId = "admissions-list",
  role = "admin",
  customerId = DEMO_CUSTOMER_ID,
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = routeProp || useRoute<any>();

  const params = (route?.params || {}) as RouteParams;
  const filterStatus = params.status;
  const filterProgram = params.program;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(filterStatus || filterProgram || null);

  const { data, isLoading, error, refetch } = useAdmissionStatsQuery();

  // Filter admissions based on params
  const filteredAdmissions = useMemo(() => {
    let result = DEMO_ADMISSIONS;
    if (filterStatus) {
      result = result.filter(a => a.status === filterStatus);
    }
    if (filterProgram) {
      result = result.filter(a => a.program === filterProgram);
    }
    return result;
  }, [filterStatus, filterProgram]);

  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId, filterStatus, filterProgram },
    });
  }, [screenId, role, customerId, filterStatus, filterProgram, trackScreenView]);

  const handleBack = useCallback(() => {
    trackEvent("admissions_list_back_pressed");
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

  const handleAdmissionTap = useCallback((admissionId: string) => {
    trackEvent("admissions_list_item_tap", { admissionId });
    navigation.navigate("admission-detail", { admissionId });
  }, [navigation, trackEvent]);

  const handleAddNew = useCallback(() => {
    trackEvent("admissions_list_add_new");
    navigation.navigate("admission-create");
  }, [navigation, trackEvent]);

  const getTitle = () => {
    if (filterStatus) {
      return STATUS_CONFIG[filterStatus]?.label || 'Admissions';
    }
    if (filterProgram) {
      return `${filterProgram} Admissions`;
    }
    return 'All Admissions';
  };

  const renderAdmissionItem = ({ item }: { item: AdmissionItem }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const programColor = PROGRAM_COLORS[item.program] || colors.primary;

    return (
      <TouchableOpacity
        style={[styles.admissionCard, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}
        onPress={() => handleAdmissionTap(item.id)}
        accessibilityLabel={`${item.studentName}, ${item.program}, ${statusConfig.label}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <AppText style={[styles.studentName, { color: colors.onSurface }]}>{item.studentName}</AppText>
            <AppText style={[styles.parentName, { color: colors.onSurfaceVariant }]}>Parent: {item.parentName}</AppText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
            <Icon name={statusConfig.icon} size={14} color={statusConfig.color} />
            <AppText style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</AppText>
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Icon name="school" size={14} color={programColor} />
            <AppText style={[styles.detailText, { color: programColor }]}>{item.program}</AppText>
          </View>
          <View style={styles.detailRow}>
            <Icon name="phone" size={14} color={colors.onSurfaceVariant} />
            <AppText style={[styles.detailText, { color: colors.onSurfaceVariant }]}>{item.phone}</AppText>
          </View>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={14} color={colors.onSurfaceVariant} />
            <AppText style={[styles.detailText, { color: colors.onSurfaceVariant }]}>{item.date}</AppText>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.outlineVariant }]}>
          <AppText style={[styles.counselorText, { color: colors.onSurfaceVariant }]}>
            Counselor: {item.counselor}
          </AppText>
          <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>{getTitle()}</AppText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {!isOnline && <OfflineBanner />}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>{getTitle()}</AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {filteredAdmissions.length} records
          </AppText>
        </View>
        <TouchableOpacity onPress={handleAddNew} style={styles.addButton}>
          <Icon name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      {data && (
        <AppCard style={[styles.summaryCard, { marginHorizontal: 16, marginBottom: 12 }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <AppText style={[styles.summaryValue, { color: colors.primary }]}>{data.totalInquiries}</AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Inquiries</AppText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.summaryItem}>
              <AppText style={[styles.summaryValue, { color: colors.success }]}>{data.totalAdmitted}</AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Admitted</AppText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.summaryItem}>
              <AppText style={[styles.summaryValue, { color: colors.tertiary }]}>{data.conversionRate}%</AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Conversion</AppText>
            </View>
          </View>
        </AppCard>
      )}

      {/* Admission List */}
      <FlatList
        data={filteredAdmissions}
        renderItem={renderAdmissionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-school-outline" size={64} color={colors.outline} />
            <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>No Admissions Found</AppText>
            <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
              No admission records match your filter criteria.
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
  addButton: { padding: 4 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  summaryCard: { padding: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "700" },
  summaryLabel: { fontSize: 11, marginTop: 4 },
  summaryDivider: { width: 1, height: 40 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  admissionCard: { padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: "600" },
  parentName: { fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 11, fontWeight: "600" },
  cardDetails: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  counselorText: { fontSize: 12 },
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptyMessage: { fontSize: 14, marginTop: 8, textAlign: "center" },
});

export default AdmissionsListScreen;
