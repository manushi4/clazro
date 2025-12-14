/**
 * Continue Learning Widget (continue.learning)
 * Shows recently accessed learning items for quick resume
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useContinueLearningQuery, ContinueLearningItem, ContinueLearningItemType } from "../../../hooks/queries/useContinueLearningQuery";

const WIDGET_ID = "continue.learning";

const TYPE_ICONS: Record<string, string> = {
  resource: "book-open-variant",
  ai_session: "robot",
  assignment: "clipboard-text",
  test_review: "file-document-check",
  doubt: "chat-question",
  lesson: "school",
  video: "play-circle",
};

export const ContinueLearningWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  
  // Config options
  const maxItems = Math.min((config?.maxItems as number) || 4, 6);
  const showProgress = config?.showProgress !== false;
  const showTimeAgo = config?.showTimeAgo !== false;
  const showType = config?.showType !== false;
  const layoutStyle = (config?.layoutStyle as string) || "horizontal";
  const itemTypes = config?.itemTypes as ContinueLearningItemType[] | undefined;
  const enableTap = config?.enableTap !== false;
  const compactMode = config?.compactMode === true || size === "compact";
  
  const { data, isLoading, error, refetch } = useContinueLearningQuery(maxItems, itemTypes);

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, layoutStyle, loadTime: Date.now() - renderStart.current });
  }, []);

  const handleItemPress = (item: ContinueLearningItem) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "item_tap", itemType: item.item_type, itemId: item.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_item_tap`, level: "info", data: { itemType: item.item_type } });
    onNavigate?.(item.route);
  };


  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.continueLearning.states.loading")}</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="book-off-outline" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>{t("widgets.continueLearning.states.error")}</AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>{t("widgets.continueLearning.actions.retry")}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data?.length) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="book-open-page-variant-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.continueLearning.states.empty")}</AppText>
      </View>
    );
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      resource: t("widgets.continueLearning.types.resource"),
      ai_session: t("widgets.continueLearning.types.aiSession"),
      assignment: t("widgets.continueLearning.types.assignment"),
      test_review: t("widgets.continueLearning.types.testReview"),
      doubt: t("widgets.continueLearning.types.doubt"),
      lesson: t("widgets.continueLearning.types.lesson"),
      video: t("widgets.continueLearning.types.video"),
    };
    return labels[type] || type;
  };

  const renderHorizontalLayout = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
      {data.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.horizontalCard, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handleItemPress(item)}
          disabled={!enableTap}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}>
            <Icon name={TYPE_ICONS[item.item_type] || "book"} size={20} color={item.color} />
          </View>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>{item.title}</AppText>
          {item.subtitle && !compactMode && (
            <AppText style={[styles.cardSubtitle, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{item.subtitle}</AppText>
          )}
          {showProgress && item.progress_percentage < 100 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.outline + "30" }]}>
                <View style={[styles.progressFill, { width: `${item.progress_percentage}%`, backgroundColor: item.color }]} />
              </View>
              <AppText style={[styles.progressText, { color: colors.onSurfaceVariant }]}>{item.progress_percentage}%</AppText>
            </View>
          )}
          {showTimeAgo && (
            <AppText style={[styles.timeAgo, { color: colors.onSurfaceVariant }]}>{item.time_ago}</AppText>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );


  const renderVerticalLayout = () => (
    <View style={styles.verticalList}>
      {data.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.verticalCard, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handleItemPress(item)}
          disabled={!enableTap}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}>
            <Icon name={TYPE_ICONS[item.item_type] || "book"} size={20} color={item.color} />
          </View>
          <View style={styles.verticalContent}>
            <View style={styles.verticalHeader}>
              <AppText style={[styles.verticalTitle, { color: colors.onSurface }]} numberOfLines={1}>{item.title}</AppText>
              {showType && (
                <View style={[styles.typeBadge, { backgroundColor: item.color + "20" }]}>
                  <AppText style={[styles.typeText, { color: item.color }]}>{getTypeLabel(item.item_type)}</AppText>
                </View>
              )}
            </View>
            {item.subtitle && (
              <AppText style={[styles.verticalSubtitle, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{item.subtitle}</AppText>
            )}
            <View style={styles.verticalFooter}>
              {showProgress && item.progress_percentage < 100 && (
                <View style={styles.progressContainerSmall}>
                  <View style={[styles.progressBarSmall, { backgroundColor: colors.outline + "30" }]}>
                    <View style={[styles.progressFill, { width: `${item.progress_percentage}%`, backgroundColor: item.color }]} />
                  </View>
                  <AppText style={[styles.progressTextSmall, { color: colors.onSurfaceVariant }]}>{item.progress_percentage}%</AppText>
                </View>
              )}
              {showTimeAgo && (
                <AppText style={[styles.timeAgoSmall, { color: colors.onSurfaceVariant }]}>{item.time_ago}</AppText>
              )}
            </View>
          </View>
          {enableTap && <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>{t("common:offline")}</AppText>
        </View>
      )}
      {layoutStyle === "horizontal" ? renderHorizontalLayout() : renderVerticalLayout()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8 },
  centerContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { fontSize: 13, marginTop: 8, textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  horizontalScroll: { paddingHorizontal: 4, gap: 12 },
  horizontalCard: { width: 140, padding: 12, borderRadius: 12, gap: 8 },
  iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  cardSubtitle: { fontSize: 11, lineHeight: 14 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  progressFill: { height: "100%", borderRadius: 2 },
  progressText: { fontSize: 10, fontWeight: "500" },
  timeAgo: { fontSize: 10, marginTop: 4 },
  verticalList: { gap: 8 },
  verticalCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 12 },
  verticalContent: { flex: 1, gap: 4 },
  verticalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  verticalTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeText: { fontSize: 10, fontWeight: "600" },
  verticalSubtitle: { fontSize: 12 },
  verticalFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  progressContainerSmall: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  progressBarSmall: { width: 60, height: 3, borderRadius: 2 },
  progressTextSmall: { fontSize: 10, fontWeight: "500" },
  timeAgoSmall: { fontSize: 10 },
});
