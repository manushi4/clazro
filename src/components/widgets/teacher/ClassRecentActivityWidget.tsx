import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import {
  useClassRecentActivityQuery,
  getRelativeTime,
  ACTIVITY_TYPE_CONFIG,
  ActivityType,
} from "../../../hooks/queries/teacher/useClassRecentActivityQuery";

const FILTER_OPTIONS: Array<{ key: ActivityType | 'all'; labelKey: string }> = [
  { key: 'all', labelKey: 'all' },
  { key: 'assignment', labelKey: 'assignment' },
  { key: 'test', labelKey: 'test' },
  { key: 'attendance', labelKey: 'attendance' },
  { key: 'grade', labelKey: 'grade' },
  { key: 'announcement', labelKey: 'announcement' },
];

export const ClassRecentActivityWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t, i18n } = useTranslation("teacher");
  const isHindi = i18n.language === 'hi';

  // === CONFIG (with defaults) ===
  const maxItems = (config?.maxItems as number) || 7;
  const showFilter = config?.showFilter !== false;
  const showClassName = config?.showClassName !== false;

  // === LOCAL STATE ===
  const [activeFilter, setActiveFilter] = useState<ActivityType | 'all'>('all');

  // === DATA ===
  const { data, isLoading, error, refetch } = useClassRecentActivityQuery({
    activityType: activeFilter === 'all' ? undefined : activeFilter,
    limit: maxItems,
  });

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.activityTimeline.states.loading", { defaultValue: "Loading activity..." })}
        </AppText>
      </View>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error, marginTop: 4 }}>
          {t("widgets.activityTimeline.states.error", { defaultValue: "Failed to load activity" })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("common.retry", { defaultValue: "Retry" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // === EMPTY STATE ===
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="clipboard-text-clock-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.activityTimeline.states.empty", { defaultValue: "No recent activity" })}
        </AppText>
      </View>
    );
  }

  // === RENDER FILTER CHIPS ===
  const renderFilterChips = () => {
    if (!showFilter) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeFilter === option.key;
          const config = option.key !== 'all' ? ACTIVITY_TYPE_CONFIG[option.key] : null;

          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => setActiveFilter(option.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive
                    ? config?.color || colors.primary
                    : colors.surfaceVariant,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              {config && (
                <Icon
                  name={config.icon}
                  size={14}
                  color={isActive ? '#FFFFFF' : config.color}
                  style={{ marginRight: 4 }}
                />
              )}
              <AppText
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#FFFFFF' : colors.onSurfaceVariant,
                }}
              >
                {option.key === 'all'
                  ? t("widgets.activityTimeline.filters.all", { defaultValue: "All" })
                  : isHindi
                    ? ACTIVITY_TYPE_CONFIG[option.key].labelHi
                    : ACTIVITY_TYPE_CONFIG[option.key].labelEn
                }
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // === SUCCESS STATE ===
  return (
    <View style={styles.container}>
      {renderFilterChips()}

      <View style={styles.timeline}>
        {data.slice(0, maxItems).map((activity, index) => {
          const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activity_type];
          const isLast = index === data.length - 1 || index === maxItems - 1;

          return (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityItem}
              onPress={() => {
                if (activity.related_id && activity.related_type) {
                  onNavigate?.(activity.related_type, { id: activity.related_id });
                }
              }}
              activeOpacity={0.7}
            >
              {/* Timeline line */}
              {!isLast && (
                <View
                  style={[
                    styles.timelineLine,
                    { backgroundColor: colors.outline },
                  ]}
                />
              )}

              {/* Activity icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${typeConfig.color}20` },
                ]}
              >
                <Icon name={typeConfig.icon} size={18} color={typeConfig.color} />
              </View>

              {/* Activity content */}
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <AppText
                    style={[styles.activityTitle, { color: colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {getLocalizedField(activity, 'title')}
                  </AppText>
                  <AppText style={[styles.timestamp, { color: colors.onSurfaceVariant }]}>
                    {getRelativeTime(activity.created_at)}
                  </AppText>
                </View>

                {(activity.description_en || activity.description_hi) && (
                  <AppText
                    style={[styles.activityDescription, { color: colors.onSurfaceVariant }]}
                    numberOfLines={1}
                  >
                    {getLocalizedField(activity, 'description')}
                  </AppText>
                )}

                {showClassName && (
                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.classTag,
                        { backgroundColor: `${typeConfig.color}15` },
                      ]}
                    >
                      <Icon name="google-classroom" size={12} color={typeConfig.color} />
                      <AppText
                        style={[styles.className, { color: typeConfig.color }]}
                      >
                        {activity.class_name}
                      </AppText>
                    </View>
                    {activity.actor_name && (
                      <AppText style={[styles.actorName, { color: colors.onSurfaceVariant }]}>
                        {activity.actor_name}
                      </AppText>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* View All Link */}
      <TouchableOpacity
        style={styles.viewAllContainer}
        onPress={() => onNavigate?.("ClassActivityLog")}
      >
        <AppText style={[styles.viewAllText, { color: colors.primary }]}>
          {t("widgets.activityTimeline.viewAll", { defaultValue: "View all activity" })}
        </AppText>
        <Icon name="chevron-right" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stateContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeline: {
    paddingLeft: 4,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    gap: 12,
  },
  timelineLine: {
    position: "absolute",
    left: 19,
    top: 44,
    bottom: -8,
    width: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  activityTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 11,
  },
  activityDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  classTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  className: {
    fontSize: 11,
    fontWeight: "500",
  },
  actorName: {
    fontSize: 11,
  },
  viewAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
