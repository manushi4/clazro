import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useUserProfileQuery, DEMO_USER_ID } from "../../../hooks/queries/useUserProfileQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

export const ProfileCardWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  userId,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("profile");

  // Config options with defaults
  const showAvatar = config?.showAvatar !== false;
  const showClass = config?.showClass !== false;
  const showSchool = config?.showSchool !== false;
  const showStats = config?.showStats !== false;
  const showEditButton = config?.showEditButton !== false;
  const avatarSize = (config?.avatarSize as "small" | "medium" | "large") || "medium";
  const layoutStyle = (config?.layoutStyle as "horizontal" | "vertical") || "horizontal";

  // Fetch user profile
  const { data: profile, isLoading, error } = useUserProfileQuery(userId || DEMO_USER_ID);

  // Avatar sizes
  const avatarSizes = { small: 48, medium: 64, large: 80 };
  const avatarDimension = avatarSizes[avatarSize];

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="account-alert" size={32} color={colors.error} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.profileCard.states.error")}
        </AppText>
      </View>
    );
  }

  // Get display name
  const displayName = profile.display_name || `${profile.first_name} ${profile.last_name || ""}`.trim();
  
  // Get localized class and school
  const className = getLocalizedField(profile, "class_name");
  const schoolName = getLocalizedField(profile, "school_name");

  // Stats data
  const stats = [
    { icon: "lightning-bolt", value: profile.total_xp, label: t("widgets.profileCard.stats.xp") },
    { icon: "fire", value: profile.current_streak, label: t("widgets.profileCard.stats.streak") },
    { icon: "medal", value: profile.badges_count, label: t("widgets.profileCard.stats.badges") },
  ];

  const handleEditPress = () => {
    onNavigate?.("edit-profile");
  };

  // Vertical layout
  if (layoutStyle === "vertical") {
    return (
      <View style={styles.container}>
        {/* Avatar centered */}
        {showAvatar && (
          <View style={styles.avatarCentered}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={[
                  styles.avatar,
                  {
                    width: avatarDimension,
                    height: avatarDimension,
                    borderRadius: avatarDimension / 2,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    width: avatarDimension,
                    height: avatarDimension,
                    borderRadius: avatarDimension / 2,
                    backgroundColor: colors.primaryContainer,
                  },
                ]}
              >
                <Icon
                  name="account"
                  size={avatarDimension * 0.5}
                  color={colors.primary}
                />
              </View>
            )}
          </View>
        )}

        {/* Name and info centered */}
        <View style={styles.infoCentered}>
          <AppText style={[styles.name, { color: colors.onSurface }]}>
            {displayName}
          </AppText>
          {showClass && className && (
            <AppText style={[styles.classInfo, { color: colors.onSurfaceVariant }]}>
              {className}{profile.section ? ` - ${profile.section}` : ""}
            </AppText>
          )}
          {showSchool && schoolName && (
            <AppText style={[styles.schoolInfo, { color: colors.onSurfaceVariant }]}>
              {schoolName}
            </AppText>
          )}
        </View>

        {/* Stats row */}
        {showStats && (
          <View style={[styles.statsRow, { borderTopColor: colors.outlineVariant }]}>
            {stats.map((stat, index) => (
              <View key={stat.label} style={styles.statItem}>
                <Icon name={stat.icon} size={18} color={colors.primary} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                  {stat.value}
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {stat.label}
                </AppText>
              </View>
            ))}
          </View>
        )}

        {/* Edit button */}
        {showEditButton && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primaryContainer }]}
            onPress={handleEditPress}
          >
            <Icon name="pencil" size={16} color={colors.primary} />
            <AppText style={[styles.editButtonText, { color: colors.primary }]}>
              {t("widgets.profileCard.actions.edit")}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Horizontal layout (default)
  return (
    <View style={styles.container}>
      <View style={styles.horizontalContent}>
        {/* Avatar */}
        {showAvatar && (
          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={[
                  styles.avatar,
                  {
                    width: avatarDimension,
                    height: avatarDimension,
                    borderRadius: avatarDimension / 2,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    width: avatarDimension,
                    height: avatarDimension,
                    borderRadius: avatarDimension / 2,
                    backgroundColor: colors.primaryContainer,
                  },
                ]}
              >
                <Icon
                  name="account"
                  size={avatarDimension * 0.5}
                  color={colors.primary}
                />
              </View>
            )}
          </View>
        )}

        {/* Info */}
        <View style={styles.infoContainer}>
          <AppText style={[styles.name, { color: colors.onSurface }]}>
            {displayName}
          </AppText>
          {showClass && className && (
            <AppText style={[styles.classInfo, { color: colors.onSurfaceVariant }]}>
              {className}{profile.section ? ` - ${profile.section}` : ""}
            </AppText>
          )}
          {showSchool && schoolName && (
            <AppText style={[styles.schoolInfo, { color: colors.onSurfaceVariant }]}>
              {schoolName}
            </AppText>
          )}
        </View>

        {/* Edit button */}
        {showEditButton && (
          <TouchableOpacity
            style={[styles.editIconButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={handleEditPress}
          >
            <Icon name="pencil" size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats row */}
      {showStats && (
        <View style={[styles.statsRow, { borderTopColor: colors.outlineVariant }]}>
          {stats.map((stat, index) => (
            <View key={stat.label} style={styles.statItem}>
              <Icon name={stat.icon} size={18} color={colors.primary} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                {stat.value}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {stat.label}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  horizontalContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {},
  avatarCentered: {
    alignItems: "center",
  },
  avatar: {
    resizeMode: "cover",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
    gap: 2,
  },
  infoCentered: {
    alignItems: "center",
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  classInfo: {
    fontSize: 13,
  },
  schoolInfo: {
    fontSize: 12,
  },
  editIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statLabel: {
    fontSize: 11,
  },
});

export default ProfileCardWidget;
