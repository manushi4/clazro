/**
 * AI Insight Detail Screen - Fixed (Custom Component)
 *
 * Purpose: Display detailed AI insight with full description, actions, and metadata
 * Type: Fixed (not widget-based)
 * Accessible from: ai-insights screen, notifications
 */

import React, { useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useAppTheme } from "../../theme/useAppTheme";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";
import { getLocalizedField } from "../../utils/getLocalizedField";
import {
  useAiInsightDetailQuery,
  useMarkInsightReadMutation,
  useDismissInsightMutation,
} from "../../hooks/queries/useAiInsightDetailQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

const INSIGHT_TYPE_ICONS: Record<string, string> = {
  performance: "chart-line",
  attendance: "calendar-check",
  behavior: "account-alert",
  recommendation: "lightbulb-on",
  alert: "alert-circle",
  achievement: "trophy",
};

const CATEGORY_ICONS: Record<string, string> = {
  academic: "school",
  attendance: "calendar",
  social: "account-group",
  health: "heart-pulse",
  general: "information",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#EF4444",
  normal: "#F59E0B",
  low: "#10B981",
};

export const AiInsightDetailScreen: React.FC<Props> = ({
  screenId = "ai-insight-detail",
  role,
  navigation: navProp,
  onFocused,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  const insightId = route.params?.insightId;
  const { data: insight, isLoading, error, refetch } = useAiInsightDetailQuery(insightId);
  const markReadMutation = useMarkInsightReadMutation();
  const dismissMutation = useDismissInsightMutation();

  useEffect(() => {
    trackScreenView(screenId);
  }, [screenId, trackScreenView]);

  // Mark as read when viewed
  useEffect(() => {
    if (insight && !insight.is_read && isOnline) {
      markReadMutation.mutate(insight.id);
    }
  }, [insight?.id, insight?.is_read, isOnline]);

  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleAction = useCallback(async () => {
    if (!insight?.action_url) return;

    trackEvent("insight_action_pressed", { insightId: insight.id, type: insight.insight_type });

    if (insight.action_url.startsWith("http")) {
      try {
        await Linking.openURL(insight.action_url);
      } catch {
        Alert.alert(t("errors.title"), t("errors.openUrl"));
      }
    } else {
      navigation.navigate(insight.action_url, route.params);
    }
  }, [insight, navigation, trackEvent, t, route.params]);

  const handleDismiss = useCallback(() => {
    if (!isOnline) {
      Alert.alert(t("offline.title"), t("offline.actionRequired"));
      return;
    }

    Alert.alert(
      t("aiInsightDetail.dismissTitle"),
      t("aiInsightDetail.dismissMessage"),
      [
        { text: t("actions.cancel"), style: "cancel" },
        {
          text: t("actions.ok"),
          onPress: () => {
            dismissMutation.mutate(insight!.id, {
              onSuccess: () => navigation.goBack(),
            });
          },
        },
      ]
    );
  }, [insight, isOnline, dismissMutation, navigation, t]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
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

  // Error state
  if (error || !insight) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("aiInsightDetail.title")}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("aiInsightDetail.notFound")}
          </AppText>
          <AppButton label={t("actions.goBack")} onPress={handleBack} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const title = getLocalizedField(insight, "title");
  const description = getLocalizedField(insight, "description");
  const actionLabel = getLocalizedField(insight, "action_label");
  const typeIcon = INSIGHT_TYPE_ICONS[insight.insight_type] || "information";
  const categoryIcon = CATEGORY_ICONS[insight.category] || "information";
  const priorityColor = PRIORITY_COLORS[insight.priority] || colors.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("aiInsightDetail.title")}
        </AppText>
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
          <Icon name="close" size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Type & Priority Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: colors.primaryContainer }]}>
            <Icon name={typeIcon} size={16} color={colors.primary} />
            <AppText style={[styles.badgeText, { color: colors.primary }]}>
              {t(`aiInsightDetail.types.${insight.insight_type}`)}
            </AppText>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "20" }]}>
            <AppText style={[styles.badgeText, { color: priorityColor }]}>
              {t(`aiInsightDetail.priority.${insight.priority}`)}
            </AppText>
          </View>
        </View>

        {/* Title Card */}
        <AppCard style={styles.titleCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
            <Icon name={typeIcon} size={32} color={colors.primary} />
          </View>
          <AppText style={[styles.title, { color: colors.onSurface }]}>{title}</AppText>
          <View style={styles.metaRow}>
            <Icon name={categoryIcon} size={14} color={colors.onSurfaceVariant} />
            <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              {t(`aiInsightDetail.categories.${insight.category}`)}
            </AppText>
            <AppText style={[styles.metaDot, { color: colors.onSurfaceVariant }]}>•</AppText>
            <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              {formatDate(insight.created_at)}
            </AppText>
          </View>
        </AppCard>

        {/* Description Card */}
        <AppCard style={styles.descriptionCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("aiInsightDetail.details")}
          </AppText>
          <AppText style={[styles.description, { color: colors.onSurfaceVariant }]}>
            {description}
          </AppText>
        </AppCard>

        {/* Validity Info */}
        {insight.valid_until && (
          <AppCard style={styles.validityCard}>
            <View style={styles.validityRow}>
              <Icon name="clock-outline" size={18} color={colors.onSurfaceVariant} />
              <AppText style={[styles.validityText, { color: colors.onSurfaceVariant }]}>
                {t("aiInsightDetail.validUntil")}: {formatDate(insight.valid_until)}
              </AppText>
            </View>
          </AppCard>
        )}

        {/* Action Button */}
        {insight.action_url && actionLabel && (
          <AppButton
            label={actionLabel}
            onPress={handleAction}
            variant="primary"
            style={styles.actionButton}
          />
        )}

        {/* Dismiss Button */}
        {!insight.is_dismissed && (
          <AppButton
            label={t("aiInsightDetail.dismiss")}
            onPress={handleDismiss}
            variant="outline"
            style={styles.dismissActionButton}
          />
        )}
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerRight: { width: 32 },
  dismissButton: { padding: 4 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  badgeRow: { flexDirection: "row", gap: 8 },
  typeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  priorityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  titleCard: { alignItems: "center", padding: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12 },
  metaDot: { fontSize: 12 },
  descriptionCard: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22 },
  validityCard: { padding: 12 },
  validityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  validityText: { fontSize: 13 },
  actionButton: { marginTop: 8 },
  dismissActionButton: { marginTop: 4 },
});

export default AiInsightDetailScreen;
