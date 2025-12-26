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
  params?: Record<string, any>;
};

const ACTIONS: ActionButton[] = [
  {
    id: "grading",
    labelKey: "grading",
    defaultLabel: "Grading Hub",
    icon: "clipboard-check-outline",
    color: "#4CAF50",
    route: "GradingHub",
  },
  {
    id: "assignment",
    labelKey: "assignment",
    defaultLabel: "Assignment",
    icon: "file-document-plus-outline",
    color: "#2196F3",
    route: "TeacherAssignments",
  },
  {
    id: "attendance",
    labelKey: "attendance",
    defaultLabel: "Attendance",
    icon: "calendar-check",
    color: "#9C27B0",
    route: "AttendanceMark",
  },
  {
    id: "reports",
    labelKey: "reports",
    defaultLabel: "Reports",
    icon: "chart-bar",
    color: "#FF9800",
    route: "StudentReports",
  },
  {
    id: "message",
    labelKey: "message",
    defaultLabel: "Send Message",
    icon: "message-text-outline",
    color: "#00BCD4",
    route: "BroadcastMessage",
  },
  {
    id: "atRisk",
    labelKey: "atRisk",
    defaultLabel: "At-Risk",
    icon: "alert-circle-outline",
    color: "#F44336",
    route: "AtRiskStudents",
  },
];

export const StudentQuickActionsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  const layoutStyle = (config?.layoutStyle as "row" | "grid") || "grid";
  const maxItems = (config?.maxItems as number) || 6;
  const displayActions = ACTIONS.slice(0, maxItems);

  return (
    <View style={[styles.container, layoutStyle === "grid" && styles.gridContainer]}>
      {displayActions.map((action) => (
        <TouchableOpacity
          key={action.id}
          onPress={() => onNavigate?.(action.route, action.params)}
          style={[
            styles.button,
            layoutStyle === "grid" && styles.gridButton,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.medium,
            },
          ]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconBox,
              { backgroundColor: `${action.color}15` },
            ]}
          >
            <Icon name={action.icon} size={22} color={action.color} />
          </View>
          <AppText
            style={[styles.label, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {t(`widgets.studentQuickActions.${action.labelKey}`, { defaultValue: action.defaultLabel })}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  gridButton: {
    width: "48%",
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default StudentQuickActionsWidget;
