import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";

type RubricTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: number;
  maxScore: number;
};

// Pre-defined rubric templates
const RUBRIC_TEMPLATES: RubricTemplate[] = [
  {
    id: 'essay',
    name: 'Essay Writing',
    description: 'Content, Structure, Grammar, Style',
    icon: 'file-document-edit-outline',
    color: '#2196F3',
    criteria: 4,
    maxScore: 100,
  },
  {
    id: 'presentation',
    name: 'Presentation',
    description: 'Content, Delivery, Visuals, Q&A',
    icon: 'presentation',
    color: '#9C27B0',
    criteria: 4,
    maxScore: 100,
  },
  {
    id: 'lab-report',
    name: 'Lab Report',
    description: 'Procedure, Data, Analysis, Conclusion',
    icon: 'flask-outline',
    color: '#4CAF50',
    criteria: 4,
    maxScore: 100,
  },
  {
    id: 'project',
    name: 'Project Work',
    description: 'Planning, Execution, Innovation, Documentation',
    icon: 'folder-star-outline',
    color: '#FF9800',
    criteria: 4,
    maxScore: 100,
  },
  {
    id: 'homework',
    name: 'Homework',
    description: 'Accuracy, Completeness, Neatness',
    icon: 'book-open-outline',
    color: '#00BCD4',
    criteria: 3,
    maxScore: 50,
  },
  {
    id: 'participation',
    name: 'Class Participation',
    description: 'Engagement, Questions, Collaboration',
    icon: 'account-group-outline',
    color: '#E91E63',
    criteria: 3,
    maxScore: 25,
  },
];

export const RubricTemplatesWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const maxItems = (config?.maxItems as number) || 6;
  const layoutStyle = (config?.layoutStyle as "grid" | "list") || "grid";

  const templates = RUBRIC_TEMPLATES.slice(0, maxItems);

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
                {t(`widgets.rubricTemplates.${template.id}.name`, { defaultValue: template.name })}
              </AppText>
              <AppText style={[styles.templateDesc, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {template.description}
              </AppText>
              <View style={styles.metaRow}>
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {template.criteria} {t("widgets.rubricTemplates.criteria", { defaultValue: "criteria" })}
                </AppText>
                <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {template.maxScore} {t("widgets.rubricTemplates.points", { defaultValue: "pts" })}
                </AppText>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => onNavigate?.("RubricCreate")}
          style={[styles.createBtn, { borderColor: colors.primary, borderRadius: borderRadius.medium }]}
        >
          <Icon name="plus" size={18} color={colors.primary} />
          <AppText style={[styles.createBtnText, { color: colors.primary }]}>
            {t("widgets.rubricTemplates.createCustom", { defaultValue: "Create Custom Rubric" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Grid layout
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
              {t(`widgets.rubricTemplates.${template.id}.name`, { defaultValue: template.name })}
            </AppText>
            <AppText style={[styles.gridMeta, { color: colors.onSurfaceVariant }]}>
              {template.criteria} {t("widgets.rubricTemplates.criteria", { defaultValue: "criteria" })}
            </AppText>
          </TouchableOpacity>
        ))}

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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
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
