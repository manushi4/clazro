import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";

export const CreateAssignmentWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  // Config options
  const variant = (config?.variant as "card" | "button" | "banner") || "card";
  const showIcon = config?.showIcon !== false;
  const showDescription = config?.showDescription !== false;

  const handlePress = () => {
    onNavigate?.("AssignmentCreate");
  };

  // Banner variant - full width prominent CTA
  if (variant === "banner") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.banner, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
        activeOpacity={0.8}
      >
        <View style={styles.bannerContent}>
          {showIcon && (
            <View style={[styles.bannerIcon, { backgroundColor: `${colors.onPrimary}20` }]}>
              <Icon name="file-document-plus-outline" size={28} color={colors.onPrimary} />
            </View>
          )}
          <View style={styles.bannerText}>
            <AppText style={[styles.bannerTitle, { color: colors.onPrimary }]}>
              {t("widgets.createAssignment.title", { defaultValue: "Create Assignment" })}
            </AppText>
            {showDescription && (
              <AppText style={[styles.bannerDesc, { color: `${colors.onPrimary}CC` }]}>
                {t("widgets.createAssignment.description", { defaultValue: "Create a new assignment for your students" })}
              </AppText>
            )}
          </View>
        </View>
        <Icon name="arrow-right" size={24} color={colors.onPrimary} />
      </TouchableOpacity>
    );
  }

  // Button variant - compact action button
  if (variant === "button") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.button, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={20} color={colors.onPrimary} />
        <AppText style={[styles.buttonText, { color: colors.onPrimary }]}>
          {t("widgets.createAssignment.buttonLabel", { defaultValue: "New Assignment" })}
        </AppText>
      </TouchableOpacity>
    );
  }

  // Card variant (default) - detailed card with icon
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.card, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIconBox, { backgroundColor: `${colors.primary}15` }]}>
        <Icon name="file-document-plus-outline" size={32} color={colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
          {t("widgets.createAssignment.title", { defaultValue: "Create Assignment" })}
        </AppText>
        {showDescription && (
          <AppText style={[styles.cardDesc, { color: colors.onSurfaceVariant }]}>
            {t("widgets.createAssignment.description", { defaultValue: "Create a new assignment for your students" })}
          </AppText>
        )}
      </View>
      <View style={[styles.cardArrow, { backgroundColor: `${colors.primary}10` }]}>
        <Icon name="chevron-right" size={24} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Card variant
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  cardIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardDesc: {
    fontSize: 13,
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  // Button variant
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  // Banner variant
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  bannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  bannerDesc: {
    fontSize: 13,
  },
});

export default CreateAssignmentWidget;
