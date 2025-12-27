import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";

type ActionButton = {
  id: string;
  label: string;
  icon: string;
  color: string;
  route: string;
};

const ACTIONS: ActionButton[] = [
  {
    id: "grading",
    label: "Grading Hub",
    icon: "clipboard-check-outline",
    color: "#4CAF50",
    route: "GradingHub",
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: "file-document-multiple-outline",
    color: "#2196F3",
    route: "AssignmentCreate",
  },
];

export const GradingQuickActionsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  const layoutStyle = (config?.layoutStyle as "row" | "grid") || "row";

  return (
    <View style={[styles.container, layoutStyle === "grid" && styles.gridContainer]}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          onPress={() => onNavigate?.(action.route)}
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
            <Icon name={action.icon} size={24} color={action.color} />
          </View>
          <AppText
            style={[styles.label, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {t(`widgets.gradingActions.${action.id}`, { defaultValue: action.label })}
          </AppText>
          <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
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
    flex: 1,
    minWidth: "45%",
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default GradingQuickActionsWidget;
