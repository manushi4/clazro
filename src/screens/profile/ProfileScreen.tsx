/**
 * Profile Screen - Enhanced profile view with role-specific features
 *
 * Features:
 * - Profile header with avatar and role-specific stats
 * - Teacher: Classes, Students, Rating, Experience
 * - Student: XP, Streak, Badges
 * - Quick actions section (role-specific)
 * - Personal information
 * - Teaching info (teachers only)
 * - Preferences (language, theme)
 * - Notification settings
 * - Support & Account actions
 */

import React, { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useNetworkStatus } from "../../offline/networkStore";
import { AppText } from "../../ui/components/AppText";
import { OfflineBanner } from "../../offline/OfflineBanner";
import { useDemoUser } from "../../hooks/useDemoUser";
import { useUserProfileQuery } from "../../hooks/queries/useUserProfileQuery";
import { useNotificationPreferencesQuery, useUpdateNotificationPreferences } from "../../hooks/queries/profile";
import { useUpdatePreferences } from "../../hooks/mutations/profile";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { getLocalizedField } from "../../utils/getLocalizedField";

// ============================================================================
// Types
// ============================================================================

type MenuItemProps = {
  icon: string;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
};


type StatCardProps = {
  icon: string;
  value: string | number;
  label: string;
  color: string;
};

// ============================================================================
// Sub-components
// ============================================================================

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  iconColor,
  label,
  value,
  onPress,
  rightElement,
  showChevron = true,
}) => {
  const { colors, borderRadius } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.menuIconBox, { backgroundColor: `${iconColor || colors.primary}15` }]}>
        <Icon name={icon} size={20} color={iconColor || colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <AppText style={[styles.menuLabel, { color: colors.onSurface }]}>{label}</AppText>
        {value && (
          <AppText style={[styles.menuValue, { color: colors.onSurfaceVariant }]}>{value}</AppText>
        )}
      </View>
      {rightElement}
      {showChevron && onPress && (
        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      )}
    </TouchableOpacity>
  );
};


const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.statCard}>
      <Icon name={icon} size={22} color={color} />
      <AppText style={[styles.statCardValue, { color: colors.onSurface }]}>{value}</AppText>
      <AppText style={[styles.statCardLabel, { color: colors.onSurfaceVariant }]}>{label}</AppText>
    </View>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("profile");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const { userId, role } = useDemoUser();
  const logout = useAuthStore((state) => state.logout);
  const { themeMode, setThemeMode } = useThemeStore();

  // Queries
  const { data: profile, isLoading, error, refetch, isRefetching } = useUserProfileQuery(userId);
  const { data: notifPrefs } = useNotificationPreferencesQuery(userId);

  // Mutations
  const updatePreferences = useUpdatePreferences();
  const updateNotificationPrefs = useUpdateNotificationPreferences();

  // Local state
  const [pushEnabled, setPushEnabled] = useState(notifPrefs?.push_enabled ?? true);

  // Demo teacher stats (in production, fetch from API)
  const teacherStats = {
    classesCount: 6,
    studentsCount: 180,
    rating: 4.8,
    experience: 5,
  };

  React.useEffect(() => {
    trackScreenView("profile");
  }, []);

  React.useEffect(() => {
    if (notifPrefs) {
      setPushEnabled(notifPrefs.push_enabled);
    }
  }, [notifPrefs]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleEditProfile = useCallback(() => {
    trackEvent("profile_edit_tap", "profile");
    navigation.navigate("EditProfile");
  }, [navigation, trackEvent]);

  const handleLanguageChange = useCallback(() => {
    const currentLang = i18n.language;
    const newLang = currentLang === "en" ? "hi" : "en";

    Alert.alert(
      t("settings.language.title", { defaultValue: "Change Language" }),
      t("settings.language.confirm", {
        defaultValue: `Switch to ${newLang === "hi" ? "Hindi" : "English"}?`,
      }),
      [
        { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("common:actions.confirm", { defaultValue: "Confirm" }),
          onPress: async () => {
            await i18n.changeLanguage(newLang);
            if (userId) {
              updatePreferences.mutate({ userId, language: newLang });
            }
            trackEvent("language_changed", "profile", { from: currentLang, to: newLang });
          },
        },
      ]
    );
  }, [t, userId, updatePreferences, trackEvent]);

  const handleThemeChange = useCallback(() => {
    const options: Array<{ label: string; value: "system" | "light" | "dark" }> = [
      { label: t("settings.theme.system", { defaultValue: "System" }), value: "system" },
      { label: t("settings.theme.light", { defaultValue: "Light" }), value: "light" },
      { label: t("settings.theme.dark", { defaultValue: "Dark" }), value: "dark" },
    ];

    Alert.alert(
      t("settings.theme.title", { defaultValue: "Choose Theme" }),
      undefined,
      [
        ...options.map((opt) => ({
          text: opt.label + (themeMode === opt.value ? " *" : ""),
          onPress: () => {
            setThemeMode(opt.value);
            if (userId) {
              updatePreferences.mutate({ userId, theme_mode: opt.value });
            }
            trackEvent("theme_changed", "profile", { theme: opt.value });
          },
        })),
        { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
      ]
    );
  }, [t, themeMode, setThemeMode, userId, updatePreferences, trackEvent]);

  const handlePushToggle = useCallback(
    (value: boolean) => {
      setPushEnabled(value);
      if (userId) {
        updateNotificationPrefs.mutate({ userId, push_enabled: value });
      }
      trackEvent("push_notifications_toggled", "profile", { enabled: value });
    },
    [userId, updateNotificationPrefs, trackEvent]
  );

  const handleNotificationSettings = useCallback(() => {
    trackEvent("notification_settings_tap", "profile");
    Alert.alert(
      t("settings.notifications.manage", { defaultValue: "Manage Notifications" }),
      t("common:status.comingSoon", { defaultValue: "This feature is coming soon!" })
    );
  }, [t, trackEvent]);

  const handleHelpFeedback = useCallback(() => {
    trackEvent("help_feedback_tap", "profile");
    navigation.navigate("HelpFeedback");
  }, [navigation, trackEvent]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      t("logout.title", { defaultValue: "Logout" }),
      t("logout.confirm", { defaultValue: "Are you sure you want to logout?" }),
      [
        { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("logout.button", { defaultValue: "Logout" }),
          style: "destructive",
          onPress: () => {
            trackEvent("logout", "auth");
            logout();
          },
        },
      ]
    );
  }, [t, trackEvent, logout]);


  // ============================================================================
  // Helpers
  // ============================================================================

  const getThemeLabel = () => {
    switch (themeMode) {
      case "light":
        return t("settings.theme.light", { defaultValue: "Light" });
      case "dark":
        return t("settings.theme.dark", { defaultValue: "Dark" });
      default:
        return t("settings.theme.system", { defaultValue: "System" });
    }
  };

  const getRoleLabel = (userRole: string) => {
    const roleMap: Record<string, string> = {
      student: t("roles.student", { defaultValue: "Student" }),
      teacher: t("roles.teacher", { defaultValue: "Teacher" }),
      parent: t("roles.parent", { defaultValue: "Parent" }),
      admin: t("roles.admin", { defaultValue: "Administrator" }),
    };
    return roleMap[userRole] || userRole;
  };

  const isTeacher = profile?.role === "teacher" || role === "teacher";
  const isStudent = profile?.role === "student" || role === "student";

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("states.loading", { defaultValue: "Loading profile..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("states.error", { defaultValue: "Failed to load profile" })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <AppText style={{ color: colors.onPrimary }}>
              {t("common:actions.retry", { defaultValue: "Retry" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // Success State
  // ============================================================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
        }
      >
        {/* ================================================================== */}
        {/* Profile Header */}
        {/* ================================================================== */}
        <View style={[styles.headerCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleEditProfile}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <AppText style={[styles.avatarInitials, { color: colors.onPrimary }]}>
                  {profile?.first_name?.[0]?.toUpperCase() || "U"}
                </AppText>
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Icon name="pencil" size={12} color={colors.onPrimary} />
            </View>
          </TouchableOpacity>

          <AppText style={[styles.userName, { color: colors.onSurface }]}>
            {profile?.display_name || `${profile?.first_name} ${profile?.last_name || ""}`.trim()}
          </AppText>

          <AppText style={[styles.userRole, { color: colors.onSurfaceVariant }]}>
            {getRoleLabel(profile?.role || role || "student")}
          </AppText>

          {/* Teacher Stats */}
          {isTeacher && (
            <View style={styles.statsGrid}>
              <StatCard
                icon="google-classroom"
                value={teacherStats.classesCount}
                label={t("teacher.stats.classes", { defaultValue: "Classes" })}
                color="#2196F3"
              />
              <StatCard
                icon="account-group"
                value={teacherStats.studentsCount}
                label={t("teacher.stats.students", { defaultValue: "Students" })}
                color="#4CAF50"
              />
              <StatCard
                icon="star"
                value={teacherStats.rating}
                label={t("teacher.stats.rating", { defaultValue: "Rating" })}
                color="#FFB800"
              />
              <StatCard
                icon="briefcase"
                value={`${teacherStats.experience}y`}
                label={t("teacher.stats.experience", { defaultValue: "Experience" })}
                color="#9C27B0"
              />
            </View>
          )}

          {/* Student Stats */}
          {isStudent && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="star" size={20} color="#FFB800" />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                  {profile?.total_xp?.toLocaleString() || 0}
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("stats.xp", { defaultValue: "XP" })}
                </AppText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
              <View style={styles.statItem}>
                <Icon name="fire" size={20} color="#FF6B35" />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                  {profile?.current_streak || 0}
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("stats.streak", { defaultValue: "Day Streak" })}
                </AppText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
              <View style={styles.statItem}>
                <Icon name="medal" size={20} color="#9C27B0" />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                  {profile?.badges_count || 0}
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("stats.badges", { defaultValue: "Badges" })}
                </AppText>
              </View>
            </View>
          )}
        </View>


        {/* ================================================================== */}
        {/* Teaching Info - Teachers Only */}
        {/* ================================================================== */}
        {isTeacher && (
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("teacher.teachingInfo", { defaultValue: "Teaching Information" })}
            </AppText>
            <View style={styles.menuGroup}>
              <MenuItem
                icon="book-open-variant"
                iconColor="#2196F3"
                label={t("teacher.fields.subjects", { defaultValue: "Subjects" })}
                value="Mathematics, Physics"
                showChevron={false}
              />
              <MenuItem
                icon="google-classroom"
                iconColor="#4CAF50"
                label={t("teacher.fields.classes", { defaultValue: "Classes Assigned" })}
                value="10-A, 10-B, 11-A, 11-B, 12-A, 12-B"
                showChevron={false}
              />
              <MenuItem
                icon="domain"
                iconColor="#9C27B0"
                label={t("teacher.fields.department", { defaultValue: "Department" })}
                value="Science"
                showChevron={false}
              />
              <MenuItem
                icon="calendar"
                iconColor="#FF9800"
                label={t("teacher.fields.joinDate", { defaultValue: "Joined" })}
                value="August 2019"
                showChevron={false}
              />
            </View>
          </View>
        )}

        {/* ================================================================== */}
        {/* Personal Info Section */}
        {/* ================================================================== */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("sections.personal", { defaultValue: "Personal Information" })}
          </AppText>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="email-outline"
              label={t("fields.email", { defaultValue: "Email" })}
              value={profile?.email || t("common:notSet", { defaultValue: "Not set" })}
              onPress={handleEditProfile}
            />
            <MenuItem
              icon="phone-outline"
              label={t("fields.phone", { defaultValue: "Phone" })}
              value={profile?.phone || t("common:notSet", { defaultValue: "Not set" })}
              onPress={handleEditProfile}
            />
            {isStudent && (
              <>
                <MenuItem
                  icon="school-outline"
                  label={t("fields.class", { defaultValue: "Class" })}
                  value={
                    profile?.class_name_en
                      ? `${getLocalizedField(profile, "class_name")}${profile?.section ? ` - ${profile.section}` : ""}`
                      : t("common:notSet", { defaultValue: "Not set" })
                  }
                  showChevron={false}
                />
                <MenuItem
                  icon="badge-account-outline"
                  label={t("fields.rollNumber", { defaultValue: "Roll Number" })}
                  value={profile?.roll_number || t("common:notSet", { defaultValue: "Not set" })}
                  showChevron={false}
                />
              </>
            )}
            {isTeacher && (
              <MenuItem
                icon="identifier"
                label={t("teacher.fields.employeeId", { defaultValue: "Employee ID" })}
                value="EMP-2019-0042"
                showChevron={false}
              />
            )}
          </View>
        </View>

        {/* ================================================================== */}
        {/* Preferences Section */}
        {/* ================================================================== */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("sections.preferences", { defaultValue: "Preferences" })}
          </AppText>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="translate"
              iconColor="#2196F3"
              label={t("settings.language.label", { defaultValue: "Language" })}
              value={i18n.language === "hi" ? "Hindi" : "English"}
              onPress={handleLanguageChange}
            />
            <MenuItem
              icon="theme-light-dark"
              iconColor="#9C27B0"
              label={t("settings.theme.label", { defaultValue: "Theme" })}
              value={getThemeLabel()}
              onPress={handleThemeChange}
            />
          </View>
        </View>

        {/* ================================================================== */}
        {/* Notifications Section */}
        {/* ================================================================== */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("sections.notifications", { defaultValue: "Notifications" })}
          </AppText>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="bell-outline"
              iconColor="#FF9800"
              label={t("settings.notifications.push", { defaultValue: "Push Notifications" })}
              showChevron={false}
              rightElement={
                <Switch
                  value={pushEnabled}
                  onValueChange={handlePushToggle}
                  trackColor={{ false: colors.outline, true: `${colors.primary}80` }}
                  thumbColor={pushEnabled ? colors.primary : colors.surfaceVariant}
                />
              }
            />
            <MenuItem
              icon="bell-cog-outline"
              iconColor="#FF9800"
              label={t("settings.notifications.manage", { defaultValue: "Manage Notifications" })}
              onPress={handleNotificationSettings}
            />
          </View>
        </View>

        {/* ================================================================== */}
        {/* Support Section */}
        {/* ================================================================== */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("sections.support", { defaultValue: "Support" })}
          </AppText>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="help-circle-outline"
              iconColor="#4CAF50"
              label={t("support.helpFeedback", { defaultValue: "Help & Feedback" })}
              onPress={handleHelpFeedback}
            />
            <MenuItem
              icon="shield-check-outline"
              iconColor="#2196F3"
              label={t("support.privacy", { defaultValue: "Privacy Policy" })}
              onPress={() => Alert.alert("Privacy Policy", "Opening privacy policy...")}
            />
            <MenuItem
              icon="information-outline"
              iconColor="#607D8B"
              label={t("support.about", { defaultValue: "About" })}
              value="v1.0.0"
              showChevron={false}
            />
          </View>
        </View>

        {/* ================================================================== */}
        {/* Logout Button */}
        {/* ================================================================== */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.medium }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Icon name="logout" size={20} color={colors.error} />
          <AppText style={[styles.logoutText, { color: colors.error }]}>
            {t("logout.button", { defaultValue: "Logout" })}
          </AppText>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },

  // Header Card
  headerCard: { padding: 24, alignItems: "center", marginBottom: 20 },
  avatarContainer: { position: "relative", marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center" },
  avatarInitials: { fontSize: 40, fontWeight: "700" },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  userRole: { fontSize: 14, marginBottom: 16 },

  // Student Stats Row
  statsRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  statItem: { alignItems: "center", paddingHorizontal: 16 },
  statValue: { fontSize: 18, fontWeight: "700", marginTop: 4 },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 40, opacity: 0.3 },

  // Teacher Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  statCard: {
    width: "23%",
    alignItems: "center",
    paddingVertical: 8,
  },
  statCardValue: { fontSize: 18, fontWeight: "700", marginTop: 4 },
  statCardLabel: { fontSize: 10, marginTop: 2, textAlign: "center" },


  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 12, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  menuGroup: { gap: 8 },

  // Menu Items
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "500" },
  menuValue: { fontSize: 13, marginTop: 2 },

  // Logout
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, gap: 10 },
  logoutText: { fontSize: 16, fontWeight: "600" },

  bottomSpacer: { height: 32 },
});

export default ProfileScreen;
