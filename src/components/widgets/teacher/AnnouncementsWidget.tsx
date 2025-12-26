import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import {
  useTeacherAnnouncementsQuery,
  type TeacherAnnouncement,
} from "../../../hooks/queries/teacher/useTeacherAnnouncementsQuery";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case "urgent":
      return "#F44336";
    case "high":
      return "#FF9800";
    case "normal":
      return "#2196F3";
    case "low":
      return "#9E9E9E";
    default:
      return "#2196F3";
  }
};

export const AnnouncementsWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  const maxItems = (config?.maxItems as number) || 3;

  const { data, isLoading, error, refetch } = useTeacherAnnouncementsQuery({
    limit: maxItems,
  });

  const handleAnnouncementPress = (announcement: TeacherAnnouncement) => {
    (navigation as any).navigate("AnnouncementDetail", {
      announcementId: announcement.id,
    });
  };

  const handleCreatePress = () => {
    (navigation as any).navigate("CreateAnnouncement");
  };

  // Loading
  if (isLoading) {
    return (
      <View
        style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View
        style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}
      >
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.announcements.states.error", { defaultValue: "Failed to load" })}
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

  // Empty
  if (!data?.length) {
    return (
      <View
        style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}
      >
        <Icon name="bullhorn-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.announcements.states.empty", { defaultValue: "No announcements yet" })}
        </AppText>
        <TouchableOpacity
          onPress={handleCreatePress}
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
        >
          <Icon name="plus" size={16} color={colors.onPrimary} />
          <AppText style={{ color: colors.onPrimary, fontSize: 13, fontWeight: "600" }}>
            {t("widgets.announcements.create", { defaultValue: "Create Announcement" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Create button */}
      <TouchableOpacity
        onPress={handleCreatePress}
        style={[styles.createBtnSmall, { backgroundColor: `${colors.primary}10` }]}
      >
        <Icon name="plus" size={16} color={colors.primary} />
        <AppText style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
          {t("widgets.announcements.new", { defaultValue: "New Announcement" })}
        </AppText>
      </TouchableOpacity>

      {/* Announcements list */}
      <View style={styles.list}>
        {data.map((announcement, index) => (
          <TouchableOpacity
            key={announcement.id}
            onPress={() => handleAnnouncementPress(announcement)}
            style={[
              styles.item,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.medium,
                borderLeftWidth: 3,
                borderLeftColor: announcement.color || colors.primary,
              },
              index < data.length - 1 && { marginBottom: 10 },
            ]}
          >
            {/* Icon and pinned badge */}
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: `${announcement.color || colors.primary}15` },
                ]}
              >
                <Icon
                  name={announcement.icon || "bullhorn"}
                  size={20}
                  color={announcement.color || colors.primary}
                />
              </View>
              {announcement.is_pinned && (
                <Icon
                  name="pin"
                  size={14}
                  color={colors.primary}
                  style={styles.pinIcon}
                />
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <AppText
                  style={[styles.title, { color: colors.onSurface }]}
                  numberOfLines={1}
                >
                  {getLocalizedField(announcement, "title")}
                </AppText>
                {announcement.priority !== "normal" && (
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: `${getPriorityColor(announcement.priority)}15` },
                    ]}
                  >
                    <AppText
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(announcement.priority) },
                      ]}
                    >
                      {announcement.priority}
                    </AppText>
                  </View>
                )}
              </View>

              <AppText
                style={[styles.contentText, { color: colors.onSurfaceVariant }]}
                numberOfLines={2}
              >
                {getLocalizedField(announcement, "content")}
              </AppText>

              <View style={styles.metaRow}>
                {announcement.target_class_name && (
                  <View style={styles.targetBadge}>
                    <Icon name="school" size={12} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                      {announcement.target_class_name}
                    </AppText>
                  </View>
                )}
                <View style={styles.statsRow}>
                  <Icon name="eye" size={12} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {announcement.views_count}
                  </AppText>
                </View>
                <AppText style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
                  {formatDate(announcement.created_at)}
                </AppText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* View all */}
      <TouchableOpacity
        onPress={() => (navigation as any).navigate("AnnouncementsList")}
        style={[styles.viewAllBtn, { borderColor: colors.outlineVariant }]}
      >
        <AppText style={{ color: colors.primary, fontWeight: "600" }}>
          {t("widgets.announcements.viewAll", { defaultValue: "View All Announcements" })}
        </AppText>
        <Icon name="chevron-right" size={18} color={colors.primary} />
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
    gap: 8,
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  createBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  list: {},
  item: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  iconContainer: {
    alignItems: "center",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pinIcon: {
    marginTop: 4,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  contentText: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  targetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  dateText: {
    fontSize: 11,
    marginLeft: "auto",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 4,
  },
});
