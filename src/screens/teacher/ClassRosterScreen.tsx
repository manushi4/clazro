import React from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAppTheme } from "../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../ui/components/AppText";
import { ClassRosterWidget } from "../../components/widgets/teacher/ClassRosterWidget";
import { useCustomerId } from "../../hooks/config/useCustomerId";
import { useAuthStore } from "../../stores/authStore";

/**
 * ClassRosterScreen - Dynamic screen showing full student roster for a class
 * Sprint 3: Class Management
 *
 * Default widgets:
 * - ClassRosterWidget (full student list with search and sorting)
 *
 * Route params: { classId: string, className?: string }
 */
export const ClassRosterScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useAppTheme();
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {className
              ? t("screens.classRoster.titleWithClass", { className, defaultValue: `${className} Students` })
              : t("screens.classRoster.title", { defaultValue: "Class Roster" })}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t("screens.classRoster.subtitle", { defaultValue: "View and manage students" })}
          </AppText>
        </View>

        {/* Full Roster Widget */}
        <View style={styles.widgetContainer}>
          <ClassRosterWidget
            customerId={customerId}
            userId={userId}
            role="teacher"
            onNavigate={handleNavigate}
            config={{
              classId,
              maxItems: 50, // Show all students
              showSearch: true,
              showAttendance: true,
              showScore: true,
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
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
  widgetContainer: {
    flex: 1,
  },
});
