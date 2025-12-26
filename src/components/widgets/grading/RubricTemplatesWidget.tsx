import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { useRubricTemplatesQuery } from "../../../hooks/queries/teacher/useRubricTemplatesQuery";

export const RubricTemplatesWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");

  // === CONFIG (with defaults) ===
  const maxItems = (config?.maxItems as number) || 6;
  const layoutStyle = (config?.layoutStyle as "grid" | "list") || "grid";
  const showCreateButton = config?.showCreateButton !== false;

  // === DATA ===
  const { data, isLoading, error, refetch } = useRubricTemplatesQuery({ limit: maxItems });

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.rubricTemplates.states.loading", { defaultValue: "Loading templates..." })}
        </AppText>
      </View>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.medium }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.rubricTemplates.states.error", { defaultValue: "Failed to load templates" })}
        </AppText>
        <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.error }]}>
          <AppText style={{ color: colors.onError, fontSize: 12 }}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // === EMPTY STATE ===
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="clipboard-text-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.rubricTemplates.states.empty", { defaultValue: "No rubric templates" })}
        </AppText>
        {showCreateButton && (
          <TouchableOpacity
            onPress={() => onNavigate?.("RubricCreate")}
            style={[styles.createBtnSmall, { backgroundColor: colors.primary }]}
          >
            <Icon name="plus" size={16} color={colors.onPrimary} />
            <AppText style={{ color: colors.onPrimary, fontSize: 12 }}>
              {t("widgets.rubricTemplates.createCustom", { defaultValue: "Create Rubric" })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const templates = data.slice(0, maxItems);

  // === LIST LAYOUT ===
  if (layoutStyle === "list") {
    return (
      <View style={styles.container}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            onPress={() => onNavigate?.("RubricDetail", { rubricId: template.id })}
            style={[styles.listItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          >
            <View style={[styles.iconBox, { backgroundColor: `${template.color}15` }]}>
              <Icon name={template.icon} size={22} color={template.color} />
            </View>
            <View style={styles.listContent}>
              <AppText style={[styles.templateName, { color: colors.onSurface }]}>
                {getLocalizedField(template, 'name')}
              </AppText>
              <AppText style={[styles.templateDesc, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {getLocalizedField(template, 'description')}
              </AppText>
              <View style={styles.metaRow}>
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {template.criteria_count} {t("widgets.rubricTemplates.criteria", { defaultValue: "criteria" })}
                </AppText>
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {template.max_score} {t("widgets.rubricTemplates.points", { defaultValue: "pts" })}
                </AppText>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        ))}

        {showCreateButton && (
          <TouchableOpacity
            onPress={() => onNavigate?.("RubricCreate")}
            style={[styles.createBtn, { borderColor: colors.primary, borderRadius: borderRadius.medium }]}
          >
            <Icon name="plus" size={18} color={colors.primary} />
            <AppText style={[styles.createBtnText, { color: colors.primary }]}>
              {t("widgets.rubricTemplates.createCustom", { defaultValue: "Create Custom Rubric" })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // === GRID LAYOUT (default) ===
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            onPress={() => onNavigate?.("RubricDetail", { rubricId: template.id })}
            style={[styles.gridItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          >
            <View style={[styles.gridIcon, { backgroundColor: `${template.color}15` }]}>
              <Icon name={template.icon} size={28} color={template.color} />
            </View>
            <AppText style={[styles.gridName, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(template, 'name')}
            </AppText>
            <AppText style={[styles.gridMeta, { color: colors.onSurfaceVariant }]}>
              {template.criteria_count} {t("widgets.rubricTemplates.criteria", { defaultValue: "criteria" })}
            </AppText>
          </TouchableOpacity>
        ))}

        {showCreateButton && (
          <TouchableOpacity
            onPress={() => onNavigate?.("RubricCreate")}
            style={[styles.gridItem, styles.createGridItem, { borderColor: colors.outline, borderRadius: borderRadius.medium }]}
          >
            <View style={[styles.gridIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name="plus" size={28} color={colors.primary} />
            </View>
            <AppText style={[styles.gridName, { color: colors.primary }]}>
              {t("widgets.rubricTemplates.custom", { defaultValue: "Custom" })}
            </AppText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  stateContainer: { padding: 20, alignItems: "center", gap: 8 },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginTop: 4 },
  createBtnSmall: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  // List styles
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    flex: 1,
    gap: 2,
  },
  templateName: {
    fontSize: 14,
    fontWeight: "600",
  },
  templateDesc: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Grid styles
  gridScroll: {
    paddingRight: 16,
    gap: 10,
  },
  gridItem: {
    width: 100,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  gridIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  gridName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  gridMeta: {
    fontSize: 10,
    textAlign: "center",
  },
  createGridItem: {
    borderWidth: 1,
    borderStyle: "dashed",
    backgroundColor: "transparent",
  },
});
