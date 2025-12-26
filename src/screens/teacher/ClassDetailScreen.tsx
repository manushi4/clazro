import React from "react";
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAppTheme } from "../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../ui/components/AppText";
import { ClassStatsWidget } from "../../components/widgets/teacher/ClassStatsWidget";
import { ClassRosterWidget } from "../../components/widgets/teacher/ClassRosterWidget";
import { ClassActivityWidget } from "../../components/widgets/teacher/ClassActivityWidget";
import { useCustomerId } from "../../hooks/config/useCustomerId";
import { useAuthStore } from "../../stores/authStore";

/**
 * ClassDetailScreen - Dynamic screen showing details of a specific class
 * Sprint 3: Class Management
 *
 * Default widgets:
 * - ClassStatsWidget (class statistics)
 * - ClassRosterWidget (student list)
 * - ClassActivityWidget (recent activity)
 *
 * Route params: { classId: string, className?: string }
 */
export const ClassDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  // Get user context for widget props
  const customerId = useCustomerId() || "";
  const { user } = useAuthStore();
  const userId = user?.id || "";

  // Get route params
  const { classId, className } = (route.params as { classId: string; className?: string }) || {};

  // Navigation handler for widgets
  const handleNavigate = (routeName: string, params?: Record<string, unknown>) => {
    (navigation as any).navigate(routeName, params);
  };

  // Quick action buttons
  const quickActions = [
    {
      id: "attendance",
      icon: "calendar-check",
      label: t("screens.classDetail.actions.markAttendance", { defaultValue: "Attendance" }),
      color: "#4CAF50",
      route: "AttendanceMarkScreen",
    },
    {
      id: "assignment",
      icon: "clipboard-plus",
      label: t("screens.classDetail.actions.newAssignment", { defaultValue: "Assignment" }),
      color: "#2196F3",
      route: "CreateAssignment",
    },
    {
      id: "test",
      icon: "file-document-edit",
      label: t("screens.classDetail.actions.newTest", { defaultValue: "Test" }),
      color: "#FF9800",
      route: "CreateTest",
    },
    {
      id: "announce",
      icon: "bullhorn",
      label: t("screens.classDetail.actions.announce", { defaultValue: "Announce" }),
      color: "#9C27B0",
      route: "CreateAnnouncement",
    },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    (navigation as any).navigate(action.route, { classId, className });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {className || t("screens.classDetail.title", { defaultValue: "Class Details" })}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t("screens.classDetail.subtitle", { defaultValue: "Overview and management" })}
          </AppText>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              onPress={() => handleQuickAction(action)}
              style={[
                styles.quickActionBtn,
                { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
              ]}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                <Icon name={action.icon} size={20} color={action.color} />
              </View>
              <AppText style={[styles.quickActionLabel, { color: colors.onSurface }]} numberOfLines={1}>
                {action.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Class Stats Widget */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("screens.classDetail.sections.stats", { defaultValue: "Class Statistics" })}
          </AppText>
          <ClassStatsWidget
            customerId={customerId}
            userId={userId}
            role="teacher"
            onNavigate={handleNavigate}
            config={{
              classId,
              layoutStyle: "grid",
              columns: 2,
              showTrends: true,
            }}
          />
        </View>

        {/* Recent Activity Widget */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("screens.classDetail.sections.activity", { defaultValue: "Recent Activity" })}
          </AppText>
          <ClassActivityWidget
            customerId={customerId}
            userId={userId}
            role="teacher"
            onNavigate={handleNavigate}
            config={{
              classId,
              maxItems: 5,
              showTimestamp: true,
            }}
          />
        </View>

        {/* Student Roster Widget (compact) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("screens.classDetail.sections.roster", { defaultValue: "Students" })}
            </AppText>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate("ClassRoster", { classId, className })}
            >
              <AppText style={[styles.viewAllLink, { color: colors.primary }]}>
                {t("common.viewAll", { defaultValue: "View All" })}
              </AppText>
            </TouchableOpacity>
          </View>
          <ClassRosterWidget
            customerId={customerId}
            userId={userId}
            role="teacher"
            onNavigate={handleNavigate}
            config={{
              classId,
              maxItems: 5,
              showSearch: false,
              showAttendance: true,
              showScore: true,
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: "center",
    padding: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: "500",
  },
});
