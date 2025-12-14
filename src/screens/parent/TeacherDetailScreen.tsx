/**
 * TeacherDetailScreen - Fixed Screen
 *
 * Purpose: Display detailed teacher information with contact options
 * Type: Fixed (not widget-based)
 * Accessible from: teacher-contacts screen, child-detail screen
 * Roles: parent
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { useTeacherDetailQuery } from "../../hooks/queries/useTeacherDetailQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Availability status colors
const STATUS_COLORS: Record<string, string> = {
  available: '#4CAF50',
  busy: '#FF9800',
  unavailable: '#F44336',
  on_leave: '#9E9E9E',
};


export const TeacherDetailScreen: React.FC<Props> = ({
  screenId = "teacher-detail",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors } = useAppTheme();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  // Get params from route
  const teacherId = route.params?.teacherId || route.params?.id || '';

  // === DATA ===
  const { data, isLoading, error, refetch } = useTeacherDetailQuery(teacherId);
  const [refreshing, setRefreshing] = useState(false);

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { teacherId },
    });
  }, [screenId, teacherId]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(t("offline.title"), t("offline.refreshDisabled"));
      return;
    }
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [isOnline, refetch, t]);

  const handleCall = useCallback(async () => {
    if (!data?.phone) return;
    trackEvent("teacher_call_pressed", { teacherId });
    const url = `tel:${data.phone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t("errors.title"), t("teacherDetail.callError", { defaultValue: "Cannot make call" }));
      }
    } catch {
      Alert.alert(t("errors.title"), t("teacherDetail.callError", { defaultValue: "Cannot make call" }));
    }
  }, [data?.phone, trackEvent, teacherId, t]);

  const handleEmail = useCallback(async () => {
    if (!data?.email) return;
    trackEvent("teacher_email_pressed", { teacherId });
    const url = `mailto:${data.email}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t("errors.title"), t("teacherDetail.emailError", { defaultValue: "Cannot send email" }));
      }
    } catch {
      Alert.alert(t("errors.title"), t("teacherDetail.emailError", { defaultValue: "Cannot send email" }));
    }
  }, [data?.email, trackEvent, teacherId, t]);

  const handleMessage = useCallback(() => {
    trackEvent("teacher_message_pressed", { teacherId });
    navigation.navigate("compose-message", { teacherId: data?.teacher_user_id });
  }, [navigation, trackEvent, teacherId, data?.teacher_user_id]);

  // === HELPER FUNCTIONS ===
  const getStatusColor = (status: string) => STATUS_COLORS[status] || STATUS_COLORS.available;

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("status.loading")}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === ERROR STATE ===
  if (error || !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("teacherDetail.title", { defaultValue: "Teacher" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("teacherDetail.notFound", { defaultValue: "Teacher not found" })}
          </AppText>
          <AppButton label={t("actions.goBack")} onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {t("teacherDetail.title", { defaultValue: "Teacher" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      >
        {/* Profile Card */}
        <AppCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {data.avatar_url ? (
              <Image source={{ uri: data.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: `${colors.primary}20` }]}>
                <Icon name="account" size={40} color={colors.primary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <AppText style={[styles.teacherName, { color: colors.onSurface }]}>
                {data.name}
              </AppText>
              <View style={styles.subjectRow}>
                <Icon name="book-open-variant" size={16} color={colors.primary} />
                <AppText style={[styles.subjectText, { color: colors.primary }]}>
                  {data.subject}
                </AppText>
              </View>
              {data.is_class_teacher && (
                <View style={[styles.badge, { backgroundColor: `${colors.success}20` }]}>
                  <Icon name="star" size={12} color={colors.success} />
                  <AppText style={[styles.badgeText, { color: colors.success }]}>
                    {t("teacherDetail.classTeacher", { defaultValue: "Class Teacher" })}
                  </AppText>
                </View>
              )}
            </View>
          </View>

          {/* Availability Status */}
          <View style={[styles.statusRow, { borderTopColor: colors.outlineVariant }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(data.availability_status || 'available') }]} />
            <AppText style={[styles.statusText, { color: colors.onSurfaceVariant }]}>
              {t(`teacherDetail.status.${data.availability_status}`, { defaultValue: data.availability_status || 'Available' })}
            </AppText>
          </View>
        </AppCard>

        {/* Contact Actions */}
        <AppCard style={styles.actionsCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("teacherDetail.contact", { defaultValue: "Contact" })}
          </AppText>
          <View style={styles.actionsRow}>
            {data.phone && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: `${colors.success}15` }]} onPress={handleCall}>
                <Icon name="phone" size={24} color={colors.success} />
                <AppText style={[styles.actionLabel, { color: colors.success }]}>
                  {t("teacherDetail.call", { defaultValue: "Call" })}
                </AppText>
              </TouchableOpacity>
            )}
            {data.email && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]} onPress={handleEmail}>
                <Icon name="email" size={24} color={colors.primary} />
                <AppText style={[styles.actionLabel, { color: colors.primary }]}>
                  {t("teacherDetail.email", { defaultValue: "Email" })}
                </AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: `${colors.secondary}15` }]} onPress={handleMessage}>
              <Icon name="message-text" size={24} color={colors.secondary} />
              <AppText style={[styles.actionLabel, { color: colors.secondary }]}>
                {t("teacherDetail.message", { defaultValue: "Message" })}
              </AppText>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Details Card */}
        <AppCard style={styles.detailsCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("teacherDetail.details", { defaultValue: "Details" })}
          </AppText>

          {data.email && (
            <View style={styles.detailRow}>
              <Icon name="email-outline" size={20} color={colors.onSurfaceVariant} />
              <View style={styles.detailContent}>
                <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
                  {t("teacherDetail.emailLabel", { defaultValue: "Email" })}
                </AppText>
                <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
                  {data.email}
                </AppText>
              </View>
            </View>
          )}

          {data.phone && (
            <View style={styles.detailRow}>
              <Icon name="phone-outline" size={20} color={colors.onSurfaceVariant} />
              <View style={styles.detailContent}>
                <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
                  {t("teacherDetail.phoneLabel", { defaultValue: "Phone" })}
                </AppText>
                <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
                  {data.phone}
                </AppText>
              </View>
            </View>
          )}

          {data.office_hours && (
            <View style={styles.detailRow}>
              <Icon name="clock-outline" size={20} color={colors.onSurfaceVariant} />
              <View style={styles.detailContent}>
                <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
                  {t("teacherDetail.officeHours", { defaultValue: "Office Hours" })}
                </AppText>
                <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
                  {data.office_hours}
                </AppText>
              </View>
            </View>
          )}
        </AppCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 16 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 16, textAlign: "center", marginVertical: 12 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center", marginHorizontal: 8 },
  headerRight: { width: 32 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  // Profile Card
  profileCard: { padding: 20 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  profileInfo: { flex: 1 },
  teacherName: { fontSize: 20, fontWeight: "700" },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  subjectText: { fontSize: 14, fontWeight: "500" },
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8, gap: 4 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14 },
  // Actions Card
  actionsCard: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  actionsRow: { flexDirection: "row", justifyContent: "space-around", gap: 12 },
  actionButton: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 12, gap: 6 },
  actionLabel: { fontSize: 12, fontWeight: "500" },
  // Details Card
  detailsCard: { padding: 16 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: "500" },
  bottomSpacer: { height: 24 },
});
