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
  useTeacherQuickActionsQuery,
  type TeacherQuickAction,
} from "../../../hooks/queries/teacher/useTeacherQuickActionsQuery";

export const TeacherQuickActionsWidget: React.FC<WidgetProps> = ({
  config,
}) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  // Config with defaults
  const maxItems = (config?.maxItems as number) || 8;
  const columns = (config?.columns as number) || 4;
  const showLabels = config?.showLabels !== false;
  const layoutStyle = (config?.layoutStyle as "grid" | "list") || "grid";

  // Data
  const { data, isLoading, error, refetch } = useTeacherQuickActionsQuery({
    limit: maxItems,
  });

  // Handle action press
  const handleActionPress = (action: TeacherQuickAction) => {
    if (action.route) {
      (navigation as any).navigate(action.route, action.route_params || {});
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View
        style={[
          styles.stateContainer,
          { backgroundColor: colors.surfaceVariant },
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        style={[
          styles.stateContainer,
          { backgroundColor: colors.errorContainer },
        ]}
      >
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.quickActions.states.error", {
            defaultValue: "Failed to load",
          })}
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

  // Empty state
  if (!data?.length) {
    return (
      <View
        style={[
          styles.stateContainer,
          { backgroundColor: colors.surfaceVariant },
        ]}
      >
        <Icon name="gesture-tap" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.quickActions.states.empty", {
            defaultValue: "No quick actions available",
          })}
        </AppText>
      </View>
    );
  }

  // List layout
  if (layoutStyle === "list") {
    return (
      <View style={styles.listContainer}>
        {data.slice(0, maxItems).map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => handleActionPress(action)}
            style={[
              styles.listItem,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.medium,
              },
            ]}
          >
            <View
              style={[
                styles.listIconBox,
                { backgroundColor: `${action.color}20` },
              ]}
            >
              <Icon name={action.icon} size={22} color={action.color} />
            </View>
            <View style={styles.listContent}>
              <AppText
                style={[styles.listTitle, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {getLocalizedField(action, "title")}
              </AppText>
              {action.description_en && (
                <AppText
                  style={[
                    styles.listDescription,
                    { color: colors.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {getLocalizedField(action, "description")}
                </AppText>
              )}
            </View>
            <Icon
              name="chevron-right"
              size={20}
              color={colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Grid layout (default)
  const itemWidth = columns === 3 ? "31%" : columns === 4 ? "23%" : "48%";

  return (
    <View style={[styles.gridContainer, { gap: 10 }]}>
      {data.slice(0, maxItems).map((action) => (
        <TouchableOpacity
          key={action.id}
          onPress={() => handleActionPress(action)}
          style={[
            styles.gridItem,
            {
              width: itemWidth,
              backgroundColor: `${action.color}08`,
              borderRadius: borderRadius.large || 16,
              borderWidth: 1,
              borderColor: `${action.color}20`,
            },
          ]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.gridIconBox,
              { backgroundColor: `${action.color}18` },
            ]}
          >
            <Icon name={action.icon} size={22} color={action.color} />
          </View>
          {showLabels && (
            <AppText
              style={[styles.gridLabel, { color: colors.onSurface }]}
              numberOfLines={2}
            >
              {getLocalizedField(action, "title")}
            </AppText>
          )}
        </TouchableOpacity>
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
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  // Grid layout
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  gridIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
  },
  // List layout
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  listIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  listDescription: {
    fontSize: 12,
  },
});
