/**
 * UserRoleSelectorWidget - Role Selection for User Creation
 *
 * Widget ID: admin.user-role-selector
 * Purpose: Select user role during creation
 * Screen: users-create
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../../theme/useAppTheme";
import { AppText } from "../../../../ui/components/AppText";
import { AppCard } from "../../../../ui/components/AppCard";
import type { WidgetProps } from "../../../../types/widget.types";

// =============================================================================
// TYPES
// =============================================================================

type UserRole = "student" | "teacher" | "parent" | "admin";

type RoleConfig = {
  value: UserRole;
  labelKey: string;
  icon: string;
  color: string;
  description: string;
};

type CustomProps = {
  selectedRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  showDescription?: boolean;
  columns?: 2 | 4;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const ROLES: RoleConfig[] = [
  {
    value: "student",
    labelKey: "admin:widgets.userList.roles.student",
    icon: "school",
    color: "#2196F3",
    description: "Can access learning content and submit assignments",
  },
  {
    value: "teacher",
    labelKey: "admin:widgets.userList.roles.teacher",
    icon: "human-male-board",
    color: "#4CAF50",
    description: "Can manage classes, create content, and grade students",
  },
  {
    value: "parent",
    labelKey: "admin:widgets.userList.roles.parent",
    icon: "account-child",
    color: "#FF9800",
    description: "Can view child progress and communicate with teachers",
  },
  {
    value: "admin",
    labelKey: "admin:widgets.userList.roles.admin",
    icon: "shield-account",
    color: "#9C27B0",
    description: "Full system access and user management",
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export const UserRoleSelectorWidget: React.FC<WidgetProps> = ({
  customProps = {},
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);

  const {
    selectedRole: initialRole = "student",
    onRoleChange,
    showDescription = true,
    columns = 2,
  } = customProps as CustomProps;

  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  const handleRoleSelect = useCallback((role: UserRole) => {
    setSelectedRole(role);
    onRoleChange?.(role);
  }, [onRoleChange]);

  const selectedRoleConfig = ROLES.find((r) => r.value === selectedRole);

  return (
    <AppCard style={styles.container}>
      <AppText style={[styles.title, { color: colors.onSurface }]}>
        {t("admin:userCreate.selectRole", { defaultValue: "Select Role" })}
      </AppText>

      <View style={[styles.roleGrid, { gap: columns === 4 ? 8 : 12 }]}>
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.value;
          return (
            <TouchableOpacity
              key={role.value}
              style={[
                styles.roleCard,
                {
                  width: columns === 4 ? "23%" : "47%",
                  backgroundColor: isSelected ? `${role.color}15` : colors.surfaceVariant,
                  borderColor: isSelected ? role.color : colors.outlineVariant,
                  borderRadius: borderRadius.md,
                },
              ]}
              onPress={() => handleRoleSelect(role.value)}
              activeOpacity={0.7}
            >
              <Icon
                name={role.icon}
                size={columns === 4 ? 24 : 28}
                color={isSelected ? role.color : colors.onSurfaceVariant}
              />
              <AppText
                style={[
                  styles.roleLabel,
                  {
                    color: isSelected ? role.color : colors.onSurfaceVariant,
                    fontSize: columns === 4 ? 12 : 14,
                  },
                ]}
              >
                {t(role.labelKey, { defaultValue: role.value })}
              </AppText>
              {isSelected && (
                <Icon
                  name="check-circle"
                  size={16}
                  color={role.color}
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {showDescription && selectedRoleConfig && (
        <View style={[styles.descriptionBox, { backgroundColor: `${selectedRoleConfig.color}10` }]}>
          <Icon name="information" size={18} color={selectedRoleConfig.color} />
          <AppText style={[styles.descriptionText, { color: colors.onSurfaceVariant }]}>
            {t(`admin:userCreate.roleDescriptions.${selectedRole}`, {
              defaultValue: selectedRoleConfig.description,
            })}
          </AppText>
        </View>
      )}
    </AppCard>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  roleCard: {
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    position: "relative",
  },
  roleLabel: {
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  checkIcon: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  descriptionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 10,
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default UserRoleSelectorWidget;
