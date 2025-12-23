/**
 * AdmissionDetailScreen - Fixed Screen (Admin)
 *
 * Purpose: Display detailed information about a specific admission/inquiry
 *          including student info, follow-up history, status timeline, and actions
 * Type: Fixed (custom component - not widget-based)
 * Accessible from: AdmissionStatsWidget recent admission tap, AdmissionsListScreen row tap
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: View comprehensive admission/inquiry details with full history
 * - Target role: admin, super_admin, counselor
 * - Screen ID: admission-detail
 * - Route params: admissionId (required)
 * - Data requirements: admissions table, user_profiles table
 * - Required permissions: view_admissions, manage_admissions
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses admissions table (created in Phase 5 of admin_demo.md)
 * - RLS: admin role can read admissions where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useAdmissionDetailQuery: src/hooks/queries/admin/useAdmissionDetailQuery.ts
 * - Types: AdmissionDetailData, AdmissionStatus, FollowUpRecord, StatusHistoryRecord
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
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

// Query Hook
import { 
  useAdmissionDetailQuery,
  AdmissionStatus,
  AdmissionSource,
  FollowUpRecord,
  StatusHistoryRecord,
} from "../../../hooks/queries/admin/useAdmissionDetailQuery";

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
  admissionId?: string;
  studentName?: string;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_CONFIG: Record<AdmissionStatus, { icon: string; color: string; label: string }> = {
  'inquiry': { icon: 'help-circle', color: '#9E9E9E', label: 'Inquiry' },
  'follow-up': { icon: 'phone-in-talk', color: '#2196F3', label: 'Follow-up' },
  'demo-scheduled': { icon: 'calendar-clock', color: '#FF9800', label: 'Demo Scheduled' },
  'demo-done': { icon: 'calendar-check', color: '#4CAF50', label: 'Demo Done' },
  'negotiation': { icon: 'handshake', color: '#9C27B0', label: 'Negotiation' },
  'admitted': { icon: 'check-circle', color: '#4CAF50', label: 'Admitted' },
  'rejected': { icon: 'close-circle', color: '#F44336', label: 'Rejected' },
  'dropped': { icon: 'account-remove', color: '#795548', label: 'Dropped' },
};

const SOURCE_CONFIG: Record<AdmissionSource, { icon: string; label: string }> = {
  'walk-in': { icon: 'walk', label: 'Walk-in' },
  'website': { icon: 'web', label: 'Website' },
  'referral': { icon: 'account-group', label: 'Referral' },
  'advertisement': { icon: 'bullhorn', label: 'Advertisement' },
  'social-media': { icon: 'share-variant', label: 'Social Media' },
  'other': { icon: 'dots-horizontal', label: 'Other' },
};

const PROGRAM_COLORS: Record<string, string> = {
  JEE: "#2196F3",
  NEET: "#4CAF50",
  Foundation: "#FF9800",
};

const FOLLOW_UP_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  'call': { icon: 'phone', color: '#2196F3' },
  'email': { icon: 'email', color: '#9C27B0' },
  'sms': { icon: 'message-text', color: '#4CAF50' },
  'visit': { icon: 'account-eye', color: '#FF9800' },
  'demo': { icon: 'presentation', color: '#E91E63' },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number | null): string => {
  if (amount === null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPhone = (phone: string): string => {
  return phone.replace(/(\+91)(\d{5})(\d{5})/, "$1 $2 $3");
};

// =============================================================================
// COMPONENT
// =============================================================================

export const AdmissionDetailScreen: React.FC<Props> = ({
  screenId = "admission-detail",
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

  // Get route params
  const params = (route?.params || {}) as RouteParams;
  const admissionId = params.admissionId;
  const studentNameParam = params.studentName;

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "followup" | "timeline">("details");

  // ===========================================================================
  // DATA FETCHING
  // ===========================================================================
  const {
    data: admissionDetail,
    isLoading,
    error,
    refetch,
  } = useAdmissionDetailQuery({ admissionId: admissionId || "" });

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId, admissionId },
    });

    if (admissionId) {
      trackEvent("admission_detail_viewed", { screenId, admissionId });
    }
  }, [screenId, role, customerId, admissionId, trackScreenView, trackEvent]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    trackEvent("admission_detail_back_pressed");
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

  const handleCall = useCallback((phone: string) => {
    trackEvent("admission_detail_call", { admissionId, phone });
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  }, [admissionId, trackEvent]);

  const handleWhatsApp = useCallback((phone: string) => {
    trackEvent("admission_detail_whatsapp", { admissionId, phone });
    const cleanPhone = phone.replace(/\s/g, '').replace('+', '');
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
  }, [admissionId, trackEvent]);

  const handleEmail = useCallback((email: string) => {
    trackEvent("admission_detail_email", { admissionId, email });
    Linking.openURL(`mailto:${email}`);
  }, [admissionId, trackEvent]);

  const handleAddFollowUp = useCallback(() => {
    trackEvent("admission_detail_add_followup", { admissionId });
    navigation.navigate("admission-followup-create", { admissionId });
  }, [navigation, admissionId, trackEvent]);

  const handleUpdateStatus = useCallback(() => {
    trackEvent("admission_detail_update_status", { admissionId });
    navigation.navigate("admission-status-update", { admissionId });
  }, [navigation, admissionId, trackEvent]);

  const handleConvertToStudent = useCallback(() => {
    trackEvent("admission_detail_convert", { admissionId });
    navigation.navigate("admission-convert", { admissionId });
  }, [navigation, admissionId, trackEvent]);

  const handleEditAdmission = useCallback(() => {
    trackEvent("admission_detail_edit", { admissionId });
    navigation.navigate("admission-edit", { admissionId });
  }, [navigation, admissionId, trackEvent]);

  // ===========================================================================
  // RENDER - No admissionId provided
  // ===========================================================================
  if (!admissionId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <Icon name="account-question" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Error" })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:admissionDetail.noAdmissionSelected", { 
              defaultValue: "No admission selected. Please select an admission from the list." 
            })}
          </AppText>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]} 
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
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
            {t("common:errors.generic", { defaultValue: "Something went wrong." })}
          </AppText>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]} 
            onPress={() => refetch()}
            accessibilityLabel="Try again"
            accessibilityRole="button"
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
  // RENDER - Empty State
  // ===========================================================================
  if (!admissionDetail) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerContent}>
          <Icon name="account-search" size={64} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("admin:admissionDetail.noData", { defaultValue: "Admission Not Found" })}
          </AppText>
          <AppText style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
            {t("admin:admissionDetail.noDataMessage", { 
              defaultValue: "The requested admission record could not be found." 
            })}
          </AppText>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]} 
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
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
  // RENDER - Success State
  // ===========================================================================
  const statusConfig = STATUS_CONFIG[admissionDetail.status];
  const sourceConfig = SOURCE_CONFIG[admissionDetail.source];
  const programColor = PROGRAM_COLORS[admissionDetail.program] || colors.primary;
  const isTerminalStatus = ['admitted', 'rejected', 'dropped'].includes(admissionDetail.status);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.headerBackButton} 
          accessibilityLabel="Go back" 
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {admissionDetail.studentName}
          </AppText>
          <View style={styles.headerBadgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
              <Icon name={statusConfig.icon} size={12} color={statusConfig.color} />
              <AppText style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </AppText>
            </View>
            <View style={[styles.programBadge, { backgroundColor: `${programColor}20` }]}>
              <AppText style={[styles.programBadgeText, { color: programColor }]}>
                {admissionDetail.program}
              </AppText>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          onPress={handleEditAdmission} 
          style={styles.headerActionButton}
          accessibilityLabel="Edit admission"
          accessibilityRole="button"
        >
          <Icon name="pencil" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            colors={[colors.primary]} 
            tintColor={colors.primary} 
          />
        }
      >
        {/* Overdue Alert */}
        {admissionDetail.isOverdue && (
          <View style={[styles.alertCard, { backgroundColor: `${colors.error}15`, borderLeftColor: colors.error }]}>
            <Icon name="alert-circle" size={18} color={colors.error} />
            <AppText style={[styles.alertText, { color: colors.onSurface }]}>
              Follow-up overdue! Last scheduled: {formatDate(admissionDetail.nextFollowUp)}
            </AppText>
          </View>
        )}

        {/* Quick Actions Card */}
        <AppCard style={styles.quickActionsCard}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: `${colors.primary}15` }]}
              onPress={() => handleCall(admissionDetail.phone)}
            >
              <Icon name="phone" size={22} color={colors.primary} />
              <AppText style={[styles.quickActionText, { color: colors.primary }]}>Call</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: "#25D36615" }]}
              onPress={() => handleWhatsApp(admissionDetail.phone)}
            >
              <Icon name="whatsapp" size={22} color="#25D366" />
              <AppText style={[styles.quickActionText, { color: "#25D366" }]}>WhatsApp</AppText>
            </TouchableOpacity>
            {admissionDetail.email && (
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: `${colors.secondary}15` }]}
                onPress={() => handleEmail(admissionDetail.email!)}
              >
                <Icon name="email" size={22} color={colors.secondary} />
                <AppText style={[styles.quickActionText, { color: colors.secondary }]}>Email</AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: `${colors.tertiary}15` }]}
              onPress={handleAddFollowUp}
            >
              <Icon name="plus-circle" size={22} color={colors.tertiary} />
              <AppText style={[styles.quickActionText, { color: colors.tertiary }]}>Follow-up</AppText>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Summary Card */}
        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                {admissionDetail.daysInPipeline}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Days in Pipeline
              </AppText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.summaryItem}>
              <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                {admissionDetail.followUpHistory.length}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Follow-ups
              </AppText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.summaryItem}>
              <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                {formatCurrency(admissionDetail.feeQuoted)}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Fee Quoted
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceVariant }]}>
          {(["details", "followup", "timeline"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.surface }]}
              onPress={() => setActiveTab(tab)}
            >
              <AppText 
                style={[
                  styles.tabText, 
                  { color: activeTab === tab ? colors.primary : colors.onSurfaceVariant }
                ]}
              >
                {tab === "details" ? "Details" : tab === "followup" ? "Follow-ups" : "Timeline"}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Details Tab */}
        {activeTab === "details" && (
          <>
            {/* Student Information */}
            <AppCard style={styles.infoCard}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Student Information
              </AppText>
              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <Icon name="account" size={16} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Name:</AppText>
                  <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                    {admissionDetail.studentName}
                    {admissionDetail.studentNameHi && ` (${admissionDetail.studentNameHi})`}
                  </AppText>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="phone" size={16} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Phone:</AppText>
                  <TouchableOpacity onPress={() => handleCall(admissionDetail.phone)}>
                    <AppText style={[styles.infoValue, { color: colors.primary }]}>
                      {admissionDetail.phone}
                    </AppText>
                  </TouchableOpacity>
                </View>
                {admissionDetail.altPhone && (
                  <View style={styles.infoRow}>
                    <Icon name="phone-plus" size={16} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Alt Phone:</AppText>
                    <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                      {admissionDetail.altPhone}
                    </AppText>
                  </View>
                )}
                {admissionDetail.email && (
                  <View style={styles.infoRow}>
                    <Icon name="email" size={16} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Email:</AppText>
                    <TouchableOpacity onPress={() => handleEmail(admissionDetail.email!)}>
                      <AppText style={[styles.infoValue, { color: colors.primary }]}>
                        {admissionDetail.email}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                )}
                {admissionDetail.currentClass && (
                  <View style={styles.infoRow}>
                    <Icon name="school" size={16} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Class:</AppText>
                    <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                      {admissionDetail.currentClass}
                    </AppText>
                  </View>
                )}
                {admissionDetail.currentSchool && (
                  <View style={styles.infoRow}>
                    <Icon name="domain" size={16} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>School:</AppText>
                    <AppText style={[styles.infoValue, { color: colors.onSurface }]} numberOfLines={2}>
                      {admissionDetail.currentSchool}
                    </AppText>
                  </View>
                )}
              </View>
            </AppCard>

            {/* Parent Information */}
            {(admissionDetail.parentName || admissionDetail.parentPhone) && (
              <AppCard style={styles.infoCard}>
                <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Parent Information
                </AppText>
                <View style={styles.infoGrid}>
                  {admissionDetail.parentName && (
                    <View style={styles.infoRow}>
                      <Icon name="account-tie" size={16} color={colors.onSurfaceVariant} />
                      <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Name:</AppText>
                      <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                        {admissionDetail.parentName}
                      </AppText>
                    </View>
                  )}
                  {admissionDetail.parentPhone && (
                    <View style={styles.infoRow}>
                      <Icon name="phone" size={16} color={colors.onSurfaceVariant} />
                      <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Phone:</AppText>
                      <TouchableOpacity onPress={() => handleCall(admissionDetail.parentPhone!)}>
                        <AppText style={[styles.infoValue, { color: colors.primary }]}>
                          {admissionDetail.parentPhone}
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </AppCard>
            )}

            {/* Admission Details */}
            <AppCard style={styles.infoCard}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Admission Details
              </AppText>
              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <Icon name="calendar" size={16} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Inquiry Date:</AppText>
                  <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                    {formatDate(admissionDetail.inquiryDate)}
                  </AppText>
                </View>
                <View style={styles.infoRow}>
                  <Icon name={sourceConfig.icon} size={16} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Source:</AppText>
                  <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                    {sourceConfig.label}
                    {admissionDetail.referralName && ` (${admissionDetail.referralName})`}
                  </AppText>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="book-education" size={16} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Program:</AppText>
                  <AppText style={[styles.infoValue, { color: programColor }]}>
                    {admissionDetail.program}
                  </AppText>
                </View>
                {admissionDetail.batchPreference && (
                  <View style={styles.infoRow}>
                    <Icon name="account-group" size={16} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Batch Pref:</AppText>
                    <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                      {admissionDetail.batchPreference}
                    </AppText>
                  </View>
                )}
                {admissionDetail.assignedToName && (
                  <View style={styles.infoRow}>
                    <Icon name="account-tie" size={16} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Assigned To:</AppText>
                    <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                      {admissionDetail.assignedToName}
                    </AppText>
                  </View>
                )}
                {admissionDetail.nextFollowUp && (
                  <View style={styles.infoRow}>
                    <Icon name="calendar-clock" size={16} color={admissionDetail.isOverdue ? colors.error : colors.onSurfaceVariant} />
                    <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Next Follow-up:</AppText>
                    <AppText style={[styles.infoValue, { color: admissionDetail.isOverdue ? colors.error : colors.onSurface }]}>
                      {formatDate(admissionDetail.nextFollowUp)}
                    </AppText>
                  </View>
                )}
              </View>
            </AppCard>

            {/* Fee Information */}
            <AppCard style={styles.infoCard}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Fee Information
              </AppText>
              <View style={styles.feeRow}>
                <View style={styles.feeItem}>
                  <AppText style={[styles.feeLabel, { color: colors.onSurfaceVariant }]}>Quoted</AppText>
                  <AppText style={[styles.feeValue, { color: colors.onSurface }]}>
                    {formatCurrency(admissionDetail.feeQuoted)}
                  </AppText>
                </View>
                <Icon name="arrow-right" size={20} color={colors.onSurfaceVariant} />
                <View style={styles.feeItem}>
                  <AppText style={[styles.feeLabel, { color: colors.onSurfaceVariant }]}>Final</AppText>
                  <AppText style={[styles.feeValue, { color: admissionDetail.feeFinal ? colors.success : colors.onSurfaceVariant }]}>
                    {formatCurrency(admissionDetail.feeFinal)}
                  </AppText>
                </View>
              </View>
            </AppCard>

            {/* Notes */}
            {admissionDetail.notes && (
              <AppCard style={styles.infoCard}>
                <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Notes
                </AppText>
                <AppText style={[styles.notesText, { color: colors.onSurface }]}>
                  {admissionDetail.notes}
                </AppText>
              </AppCard>
            )}
          </>
        )}

        {/* Follow-up Tab */}
        {activeTab === "followup" && (
          <AppCard style={styles.followUpCard}>
            <View style={styles.followUpHeader}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Follow-up History
              </AppText>
              <TouchableOpacity onPress={handleAddFollowUp}>
                <Icon name="plus-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {admissionDetail.followUpHistory.length === 0 ? (
              <View style={styles.emptyFollowUp}>
                <Icon name="phone-off" size={40} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyFollowUpText, { color: colors.onSurfaceVariant }]}>
                  No follow-ups recorded yet
                </AppText>
              </View>
            ) : (
              admissionDetail.followUpHistory.map((followUp, index) => {
                const typeConfig = FOLLOW_UP_TYPE_CONFIG[followUp.type] || FOLLOW_UP_TYPE_CONFIG.call;
                return (
                  <View
                    key={followUp.id}
                    style={[
                      styles.followUpItem,
                      index < admissionDetail.followUpHistory.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={[styles.followUpIcon, { backgroundColor: `${typeConfig.color}15` }]}>
                      <Icon name={typeConfig.icon} size={18} color={typeConfig.color} />
                    </View>
                    <View style={styles.followUpContent}>
                      <View style={styles.followUpMeta}>
                        <AppText style={[styles.followUpDate, { color: colors.onSurface }]}>
                          {formatDate(followUp.date)}
                        </AppText>
                        <AppText style={[styles.followUpBy, { color: colors.onSurfaceVariant }]}>
                          by {followUp.createdBy}
                        </AppText>
                      </View>
                      <AppText style={[styles.followUpNotes, { color: colors.onSurface }]}>
                        {followUp.notes}
                      </AppText>
                      <View style={styles.followUpOutcome}>
                        <Icon name="check-circle" size={14} color={colors.success} />
                        <AppText style={[styles.followUpOutcomeText, { color: colors.onSurfaceVariant }]}>
                          {followUp.outcome}
                        </AppText>
                      </View>
                      {followUp.nextAction && (
                        <View style={styles.followUpNextAction}>
                          <Icon name="arrow-right-circle" size={14} color={colors.primary} />
                          <AppText style={[styles.followUpNextActionText, { color: colors.primary }]}>
                            {followUp.nextAction}
                          </AppText>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </AppCard>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <AppCard style={styles.timelineCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Status Timeline
            </AppText>
            {admissionDetail.statusHistory.map((history, index) => {
              const toStatusConfig = STATUS_CONFIG[history.toStatus];
              const isLast = index === admissionDetail.statusHistory.length - 1;
              return (
                <View key={history.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: toStatusConfig.color }]}>
                      <Icon name={toStatusConfig.icon} size={12} color="#FFF" />
                    </View>
                    {!isLast && (
                      <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <AppText style={[styles.timelineStatus, { color: toStatusConfig.color }]}>
                        {toStatusConfig.label}
                      </AppText>
                      <AppText style={[styles.timelineDate, { color: colors.onSurfaceVariant }]}>
                        {formatDateTime(history.changedAt)}
                      </AppText>
                    </View>
                    {history.reason && (
                      <AppText style={[styles.timelineReason, { color: colors.onSurface }]}>
                        {history.reason}
                      </AppText>
                    )}
                    <AppText style={[styles.timelineBy, { color: colors.onSurfaceVariant }]}>
                      by {history.changedBy}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </AppCard>
        )}

        {/* Action Buttons */}
        {!isTerminalStatus && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateStatus}
            >
              <Icon name="swap-horizontal" size={20} color="#FFF" />
              <AppText style={styles.primaryActionButtonText}>Update Status</AppText>
            </TouchableOpacity>
            {admissionDetail.status === 'negotiation' && (
              <TouchableOpacity
                style={[styles.secondaryActionButton, { backgroundColor: colors.success }]}
                onPress={handleConvertToStudent}
              >
                <Icon name="account-check" size={20} color="#FFF" />
                <AppText style={styles.primaryActionButtonText}>Convert to Student</AppText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorTitle: { fontSize: 20, fontWeight: "600", marginTop: 12 },
  errorMessage: { fontSize: 14, textAlign: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "600", marginTop: 12 },
  emptyMessage: { fontSize: 14, textAlign: "center" },
  actionButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  actionButtonText: { color: "#FFF", fontSize: 14, fontWeight: "600" },

  // Header
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBackButton: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  headerBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  programBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  programBadgeText: { fontSize: 10, fontWeight: "600" },
  headerActionButton: { padding: 8 },

  // Content
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },

  // Alert
  alertCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 8, borderLeftWidth: 4 },
  alertText: { flex: 1, fontSize: 13 },

  // Quick Actions
  quickActionsCard: { padding: 12 },
  quickActionsRow: { flexDirection: "row", justifyContent: "space-around" },
  quickActionButton: { alignItems: "center", padding: 12, borderRadius: 8, minWidth: 70 },
  quickActionText: { fontSize: 11, marginTop: 4, fontWeight: "500" },

  // Summary
  summaryCard: { padding: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryValue: { fontSize: 20, fontWeight: "700" },
  summaryLabel: { fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 40 },

  // Tabs
  tabContainer: { flexDirection: "row", borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabText: { fontSize: 12, fontWeight: "500" },

  // Info Cards
  infoCard: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  infoGrid: { gap: 10 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  infoLabel: { fontSize: 12, width: 80 },
  infoValue: { fontSize: 13, flex: 1 },

  // Fee
  feeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  feeItem: { alignItems: "center" },
  feeLabel: { fontSize: 11 },
  feeValue: { fontSize: 18, fontWeight: "700", marginTop: 4 },

  // Notes
  notesText: { fontSize: 13, lineHeight: 20 },

  // Follow-up
  followUpCard: { padding: 16 },
  followUpHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  emptyFollowUp: { alignItems: "center", paddingVertical: 24 },
  emptyFollowUpText: { fontSize: 13, marginTop: 8 },
  followUpItem: { flexDirection: "row", paddingVertical: 12 },
  followUpIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 12 },
  followUpContent: { flex: 1 },
  followUpMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  followUpDate: { fontSize: 13, fontWeight: "600" },
  followUpBy: { fontSize: 11 },
  followUpNotes: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  followUpOutcome: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  followUpOutcomeText: { fontSize: 11 },
  followUpNextAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  followUpNextActionText: { fontSize: 11, fontWeight: "500" },

  // Timeline
  timelineCard: { padding: 16 },
  timelineItem: { flexDirection: "row" },
  timelineLeft: { alignItems: "center", marginRight: 12 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  timelineLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  timelineStatus: { fontSize: 13, fontWeight: "600" },
  timelineDate: { fontSize: 10 },
  timelineReason: { fontSize: 12, marginBottom: 4 },
  timelineBy: { fontSize: 10 },

  // Action Buttons
  actionButtonsContainer: { gap: 12, marginTop: 8 },
  primaryActionButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 8 },
  secondaryActionButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 8 },
  primaryActionButtonText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
});

export default AdmissionDetailScreen;
