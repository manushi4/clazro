import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useRoute } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useCustomerId } from "../../../hooks/config/useCustomerId";

type ActivityItem = {
  id: string;
  type: "attendance" | "assignment" | "test" | "announcement" | "grade";
  title_en: string;
  title_hi?: string;
  description_en: string;
  description_hi?: string;
  timestamp: string;
  icon: string;
  color: string;
};

// Demo data for class activity
const DEMO_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "attendance",
    title_en: "Attendance Marked",
    title_hi: "उपस्थिति दर्ज",
    description_en: "28 present, 4 absent today",
    description_hi: "आज 28 उपस्थित, 4 अनुपस्थित",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    icon: "calendar-check",
    color: "#4CAF50",
  },
  {
    id: "2",
    type: "assignment",
    title_en: "New Assignment Created",
    title_hi: "नया असाइनमेंट बनाया",
    description_en: "Chapter 5 Exercises - Due in 3 days",
    description_hi: "अध्याय 5 अभ्यास - 3 दिनों में देय",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    icon: "clipboard-plus",
    color: "#2196F3",
  },
  {
    id: "3",
    type: "grade",
    title_en: "Grades Posted",
    title_hi: "ग्रेड पोस्ट किए",
    description_en: "Weekly Quiz results published",
    description_hi: "साप्ताहिक प्रश्नोत्तरी परिणाम प्रकाशित",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    icon: "check-circle",
    color: "#9C27B0",
  },
  {
    id: "4",
    type: "test",
    title_en: "Test Scheduled",
    title_hi: "परीक्षा निर्धारित",
    description_en: "Mid-term test on Dec 28",
    description_hi: "28 दिसंबर को मध्यावधि परीक्षा",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    icon: "file-document-edit",
    color: "#FF9800",
  },
  {
    id: "5",
    type: "announcement",
    title_en: "Announcement Sent",
    title_hi: "घोषणा भेजी गई",
    description_en: "Holiday notice shared with class",
    description_hi: "छुट्टी की सूचना कक्षा के साथ साझा की गई",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    icon: "bullhorn",
    color: "#E91E63",
  },
];

export const ClassActivityWidget: React.FC<WidgetProps> = ({ config }) => {
  const route = useRoute();
  const { colors, borderRadius } = useAppTheme();
  const { t, i18n } = useTranslation("teacher");
  const customerId = useCustomerId();

  // Get classId from route params or config
  const classId = (route.params as any)?.classId || (config?.classId as string) || "demo-1";

  // Config with defaults
  const maxItems = (config?.maxItems as number) || 5;
  const showTimestamp = config?.showTimestamp !== false;

  // For now, using demo data (would be replaced with actual query)
  const isLoading = false;
  const error = null;
  const data = DEMO_ACTIVITIES;

  // Format relative time
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const isHindi = i18n.language === "hi";

    if (diffMins < 60) {
      return isHindi ? `${diffMins} मिनट पहले` : `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return isHindi ? `${diffHours} घंटे पहले` : `${diffHours}h ago`;
    }
    if (diffDays === 1) {
      return isHindi ? "कल" : "Yesterday";
    }
    return isHindi ? `${diffDays} दिन पहले` : `${diffDays}d ago`;
  };

  // Get localized field
  const getLocalizedText = (item: ActivityItem, field: "title" | "description"): string => {
    const isHindi = i18n.language === "hi";
    if (field === "title") {
      return isHindi && item.title_hi ? item.title_hi : item.title_en;
    }
    return isHindi && item.description_hi ? item.description_hi : item.description_en;
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.classActivity.states.loading", { defaultValue: "Loading activity..." })}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.classActivity.states.error", { defaultValue: "Failed to load activity" })}
        </AppText>
      </View>
    );
  }

  // Empty state
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="history" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.classActivity.states.empty", { defaultValue: "No recent activity" })}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.slice(0, maxItems).map((activity, index) => (
        <View key={activity.id} style={styles.activityWrapper}>
          {/* Timeline connector */}
          {index < Math.min(data.length, maxItems) - 1 && (
            <View
              style={[
                styles.timelineConnector,
                { backgroundColor: colors.outlineVariant },
              ]}
            />
          )}

          <View
            style={[
              styles.activityItem,
              { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
            ]}
          >
            {/* Icon */}
            <View style={[styles.iconBox, { backgroundColor: `${activity.color}15` }]}>
              <Icon name={activity.icon} size={18} color={activity.color} />
            </View>

            {/* Content */}
            <View style={styles.activityContent}>
              <View style={styles.headerRow}>
                <AppText
                  style={[styles.activityTitle, { color: colors.onSurface }]}
                  numberOfLines={1}
                >
                  {getLocalizedText(activity, "title")}
                </AppText>
                {showTimestamp && (
                  <AppText style={[styles.timestamp, { color: colors.onSurfaceVariant }]}>
                    {formatRelativeTime(activity.timestamp)}
                  </AppText>
                )}
              </View>
              <AppText
                style={[styles.activityDescription, { color: colors.onSurfaceVariant }]}
                numberOfLines={2}
              >
                {getLocalizedText(activity, "description")}
              </AppText>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stateContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  container: {
    gap: 2,
  },
  activityWrapper: {
    position: "relative",
  },
  timelineConnector: {
    position: "absolute",
    left: 27,
    top: 52,
    width: 2,
    height: 16,
    zIndex: -1,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 12,
  },
  iconBox: {
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    marginLeft: 8,
  },
  activityDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
