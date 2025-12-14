import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

const WIDGET_ID = "hero.greeting";

// Get greeting based on time of day and style
const getGreeting = (style: string, customGreeting?: string): string => {
  if (customGreeting) return customGreeting;
  
  const hour = new Date().getHours();
  
  if (style === "formal") {
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }
  
  if (style === "minimal") {
    return "Hello";
  }
  
  if (style === "emoji") {
    if (hour < 12) return "🌅 Good Morning";
    if (hour < 17) return "☀️ Good Afternoon";
    return "🌙 Good Evening";
  }
  
  // friendly (default)
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

export const HeroCardWidget: React.FC<WidgetProps> = ({ 
  role, 
  branding, 
  userId, 
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Size-aware config
  const greetingStyle = (config?.greetingStyle as string) || "friendly";
  const customGreeting = config?.customGreeting as string;
  const showEmoji = config?.showEmoji !== false && size !== "compact";
  const showAvatar = config?.showAvatar !== false;
  const avatarStyle = (config?.avatarStyle as string) || "circle";
  const showUserName = config?.showUserName !== false;
  const showSubtitle = config?.showSubtitle !== false && size !== "compact";
  const customSubtitle = config?.customSubtitle as string;
  const showStats = config?.showStats !== false && size !== "compact";
  const statsLayout = (config?.statsLayout as string) || "horizontal";
  const showStreak = config?.showStreak !== false;
  const showStudyTime = config?.showStudyTime !== false;
  const showScore = config?.showScore !== false;
  const showXP = config?.showXP === true || size === "expanded";

  const greeting = getGreeting(greetingStyle, customGreeting);
  const userName = "Student"; // Would come from user profile
  const subtitle = customSubtitle || t("widgets.heroCard.subtitle", { defaultValue: "Ready to learn something new today?" });

  const avatarBorderRadius = avatarStyle === "circle" ? 28 : avatarStyle === "rounded" ? 12 : 4;

  // Count visible stats
  const visibleStats = [showStreak, showStudyTime, showScore, showXP].filter(Boolean).length;

  // Handle profile tap
  const handleProfilePress = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "profile_tap" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_profile_tap`, level: "info" });
    onNavigate?.("profile");
  };

  // Handle stat tap
  const handleStatPress = (stat: string) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "stat_tap", stat });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_stat_tap`, level: "info", data: { stat } });
    onNavigate?.(`progress/${stat}`);
  };

  return (
    <View style={styles.container}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>Offline</AppText>
        </View>
      )}

      {/* Greeting section */}
      <View style={styles.greetingRow}>
        <View style={styles.textSection}>
          <AppText style={[styles.greeting, { color: colors.onSurfaceVariant }]}>
            {greeting} {showEmoji && greetingStyle !== "emoji" && "👋"}
          </AppText>
          {showUserName && (
            <AppText style={[styles.userName, { color: colors.onSurface }, size === "compact" && styles.compactUserName]}>
              {userName}
            </AppText>
          )}
          {showSubtitle && (
            <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {subtitle}
            </AppText>
          )}
        </View>

        {/* Avatar */}
        {showAvatar && (
          <TouchableOpacity 
            style={[
              styles.avatar, 
              { 
                backgroundColor: colors.primaryContainer,
                borderRadius: avatarBorderRadius,
              }
            ]}
            onPress={handleProfilePress}
          >
            <Icon name="account" size={size === "compact" ? 24 : 32} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick stats */}
      {showStats && visibleStats > 0 && (
        <View style={[
          styles.statsRow, 
          { backgroundColor: colors.surfaceVariant },
          statsLayout === "grid" && styles.statsGrid
        ]}>
          {showStreak && (
            <TouchableOpacity 
              style={[styles.statItem, statsLayout === "grid" && styles.statItemGrid]}
              onPress={() => handleStatPress("streak")}
            >
              <Icon name="fire" size={18} color={colors.primary} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>7</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.heroCard.labels.streak", { defaultValue: "Day Streak" })}
              </AppText>
            </TouchableOpacity>
          )}
          {showStreak && showStudyTime && statsLayout === "horizontal" && (
            <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
          )}
          {showStudyTime && (
            <TouchableOpacity 
              style={[styles.statItem, statsLayout === "grid" && styles.statItemGrid]}
              onPress={() => handleStatPress("study-time")}
            >
              <Icon name="clock-outline" size={18} color={colors.secondary} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>2.5h</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.heroCard.labels.today", { defaultValue: "Today" })}
              </AppText>
            </TouchableOpacity>
          )}
          {showStudyTime && showScore && statsLayout === "horizontal" && (
            <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
          )}
          {showScore && (
            <TouchableOpacity 
              style={[styles.statItem, statsLayout === "grid" && styles.statItemGrid]}
              onPress={() => handleStatPress("score")}
            >
              <Icon name="trophy" size={18} color={colors.warning} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>85%</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.heroCard.labels.score", { defaultValue: "Score" })}
              </AppText>
            </TouchableOpacity>
          )}
          {showScore && showXP && statsLayout === "horizontal" && (
            <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
          )}
          {showXP && (
            <TouchableOpacity 
              style={[styles.statItem, statsLayout === "grid" && styles.statItemGrid]}
              onPress={() => handleStatPress("xp")}
            >
              <Icon name="star" size={18} color={colors.tertiary} />
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>1,250</AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.heroCard.labels.xp", { defaultValue: "XP" })}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  greetingRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  textSection: { flex: 1, gap: 4 },
  greeting: { fontSize: 14, fontWeight: "500" },
  userName: { fontSize: 24, fontWeight: "700" },
  compactUserName: { fontSize: 20 },
  subtitle: { fontSize: 14, marginTop: 4 },
  avatar: { width: 56, height: 56, alignItems: "center", justifyContent: "center", marginLeft: 12 },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12 },
  statsGrid: { flexWrap: "wrap", justifyContent: "flex-start" },
  statItem: { alignItems: "center", flex: 1, gap: 4 },
  statItemGrid: { flex: 0, width: "50%", paddingVertical: 8 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 32 },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
});
