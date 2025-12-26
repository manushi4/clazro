import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";

type ActionButton = {
  id: string;
  labelKey: string;
  defaultLabel: string;
  icon: string;
  color: string;
  route: string;
  params?: Record<string, unknown>;
};

const ACTIONS: ActionButton[] = [
  {
    id: "gradeSubmissions",
    labelKey: "gradeSubmissions",
    defaultLabel: "Grade Now",
    icon: "clipboard-check",
    color: "#4CAF50",
    route: "PendingSubmissions",
  },
  {
    id: "createAssignment",
    labelKey: "createAssignment",
    defaultLabel: "New Assignment",
    icon: "file-document-plus-outline",
    color: "#2196F3",
    route: "AssignmentCreate",
  },
  {
    id: "viewAssignments",
    labelKey: "viewAssignments",
    defaultLabel: "All Assignments",
    icon: "folder-open-outline",
    color: "#9C27B0",
    route: "AssignmentList",
  },
  {
    id: "gradingRubrics",
    labelKey: "gradingRubrics",
    defaultLabel: "Rubrics",
    icon: "format-list-checks",
    color: "#FF9800",
    route: "RubricList",
  },
];

export const GradingHubActionsWidget: React.FC<WidgetProps> = ({
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  const handlePress = (action: ActionButton) => {
    onNavigate?.(action.route, action.params);
  };

  return (
    <View style={styles.container}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.medium,
            },
          ]}
          onPress={() => handlePress(action)}
          accessibilityLabel={t(`widgets.gradingHubActions.${action.labelKey}`, action.defaultLabel)}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${action.color}20` },
            ]}
          >
            <Icon name={action.icon} size={24} color={action.color} />
          </View>
          <AppText
            style={[styles.label, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {t(`widgets.gradingHubActions.${action.labelKey}`, action.defaultLabel)}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
