/**
 * Prediction Detail Screen - Fixed (Custom Component)
 *
 * Purpose: Display detailed AI prediction with confidence score, recommendations
 * Type: Fixed (not widget-based)
 * Accessible from: ai-predictions screen, ai-insights screen
 */

import React, { useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
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
  usePredictionDetailQuery,
  useMarkPredictionReadMutation,
} from "../../hooks/queries/usePredictionDetailQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

const PREDICTION_TYPE_ICONS: Record<string, string> = {
  grade: "school",
  attendance: "calendar-check",
  performance: "chart-line",
  behavior: "account-alert",
  improvement: "trending-up",
};

const CATEGORY_ICONS: Record<string, string> = {
  academic: "book-open-variant",
  attendance: "calendar",
  social: "account-group",
  health: "heart-pulse",
  general: "information",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#DC2626",
  high: "#EF4444",
  normal: "#F59E0B",
  low: "#10B981",
};

export const PredictionDetailScreen: React.FC<Props> = ({
  screenId = "prediction-detail",
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

  const predictionId = route.params?.predictionId;
  const { data: prediction, isLoading, error, refetch } = usePredictionDetailQuery(predictionId);
  const markReadMutation = useMarkPredictionReadMutation();

  useEffect(() => {
    trackScreenView(screenId);
  }, [screenId, trackScreenView]);

  // Mark as read when viewed
  useEffect(() => {
    if (prediction && !prediction.is_read && isOnline) {
      markReadMutation.mutate(prediction.id);
    }
  }, [prediction?.id, prediction?.is_read, isOnline]);

  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "#10B981";
    if (score >= 0.6) return "#F59E0B";
    return "#EF4444";
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
  if (error || !prediction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("predictionDetail.title")}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("predictionDetail.notFound")}
          </AppText>
          <AppButton label={t("actions.goBack")} onPress={handleBack} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const title = getLocalizedField(prediction, "title");
  const description = getLocalizedField(prediction, "description");
  const recommendation = getLocalizedField(prediction, "recommendation");
  const typeIcon = PREDICTION_TYPE_ICONS[prediction.prediction_type] || "chart-line";
  const categoryIcon = CATEGORY_ICONS[prediction.category] || "information";
  const priorityColor = PRIORITY_COLORS[prediction.priority] || colors.primary;
  const confidenceColor = getConfidenceColor(prediction.confidence_score);
  const confidencePercent = Math.round(prediction.confidence_score * 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("predictionDetail.title")}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Type & Priority Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: colors.primaryContainer }]}>
            <Icon name={typeIcon} size={16} color={colors.primary} />
            <AppText style={[styles.badgeText, { color: colors.primary }]}>
              {t(`predictionDetail.types.${prediction.prediction_type}`)}
            </AppText>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "20" }]}>
            <AppText style={[styles.badgeText, { color: priorityColor }]}>
              {t(`predictionDetail.priority.${prediction.priority}`)}
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
              {t(`predictionDetail.categories.${prediction.category}`)}
            </AppText>
            <AppText style={[styles.metaDot, { color: colors.onSurfaceVariant }]}>•</AppText>
            <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              {formatDate(prediction.created_at)}
            </AppText>
          </View>
        </AppCard>

        {/* Confidence Score Card */}
        <AppCard style={styles.confidenceCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("predictionDetail.confidenceScore")}
          </AppText>
          <View style={styles.confidenceRow}>
            <View style={styles.confidenceCircle}>
              <View style={[styles.confidenceProgress, { 
                borderColor: confidenceColor,
                borderWidth: 4,
              }]}>
                <AppText style={[styles.confidenceValue, { color: confidenceColor }]}>
                  {confidencePercent}%
                </AppText>
              </View>
            </View>
            <View style={styles.confidenceInfo}>
              <AppText style={[styles.confidenceLabel, { color: colors.onSurfaceVariant }]}>
                {confidencePercent >= 80 
                  ? t("predictionDetail.confidenceHigh")
                  : confidencePercent >= 60
                  ? t("predictionDetail.confidenceMedium")
                  : t("predictionDetail.confidenceLow")}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Description Card */}
        <AppCard style={styles.descriptionCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("predictionDetail.details")}
          </AppText>
          <AppText style={[styles.description, { color: colors.onSurfaceVariant }]}>
            {description}
          </AppText>
        </AppCard>

        {/* Predicted Outcome */}
        {prediction.predicted_outcome && (
          <AppCard style={styles.outcomeCard}>
            <View style={styles.outcomeHeader}>
              <Icon name="target" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface, marginLeft: 8 }]}>
                {t("predictionDetail.predictedOutcome")}
              </AppText>
            </View>
            <AppText style={[styles.outcomeText, { color: colors.onSurface }]}>
              {prediction.predicted_outcome}
            </AppText>
          </AppCard>
        )}

        {/* Recommendation Card */}
        {recommendation && (
          <AppCard style={[styles.recommendationCard, { backgroundColor: colors.primaryContainer }]}>
            <View style={styles.recommendationHeader}>
              <Icon name="lightbulb-on" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.primary, marginLeft: 8 }]}>
                {t("predictionDetail.recommendation")}
              </AppText>
            </View>
            <AppText style={[styles.recommendationText, { color: colors.onPrimaryContainer }]}>
              {recommendation}
            </AppText>
          </AppCard>
        )}

        {/* Validity Info */}
        {prediction.valid_until && (
          <AppCard style={styles.validityCard}>
            <View style={styles.validityRow}>
              <Icon name="clock-outline" size={18} color={colors.onSurfaceVariant} />
              <AppText style={[styles.validityText, { color: colors.onSurfaceVariant }]}>
                {t("predictionDetail.validUntil")}: {formatDate(prediction.valid_until)}
              </AppText>
            </View>
          </AppCard>
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
  confidenceCard: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  confidenceCircle: { width: 80, height: 80 },
  confidenceProgress: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", backgroundColor: "transparent" },
  confidenceValue: { fontSize: 20, fontWeight: "700" },
  confidenceInfo: { flex: 1 },
  confidenceLabel: { fontSize: 14 },
  descriptionCard: { padding: 16 },
  description: { fontSize: 15, lineHeight: 22 },
  outcomeCard: { padding: 16 },
  outcomeHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  outcomeText: { fontSize: 15, fontWeight: "500" },
  recommendationCard: { padding: 16 },
  recommendationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  recommendationText: { fontSize: 15, lineHeight: 22 },
  validityCard: { padding: 12 },
  validityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  validityText: { fontSize: 13 },
});

export default PredictionDetailScreen;
