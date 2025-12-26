import React from "react";
import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../ui/components/AppText";
import { ClassCardsWidget } from "../../components/widgets/teacher/ClassCardsWidget";
import { useCustomerId } from "../../hooks/config/useCustomerId";
import { useAuthStore } from "../../stores/authStore";

/**
 * ClassHubScreen - Dynamic screen showing all classes assigned to the teacher
 * Sprint 3: Class Management
 *
 * Default widgets:
 * - ClassCardsWidget (grid of class cards)
 *
 * Future: This should use DynamicScreen component with screen_layouts from database
 */
export const ClassHubScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const { t } = useTranslation("teacher");

  // Get user context for widget props
  const customerId = useCustomerId() || "";
  const { user } = useAuthStore();
  const userId = user?.id || "";

  // Navigation handler for widgets
  const handleNavigate = (routeName: string, params?: Record<string, unknown>) => {
    (navigation as any).navigate(routeName, params);
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
            {t("screens.classHub.title", { defaultValue: "My Classes" })}
          </AppText>
          <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t("screens.classHub.subtitle", { defaultValue: "Manage your assigned classes" })}
          </AppText>
        </View>

        {/* Class Cards Widget */}
        <View style={styles.widgetContainer}>
          <ClassCardsWidget
            customerId={customerId}
            userId={userId}
            role="teacher"
            onNavigate={handleNavigate}
            config={{
              maxItems: 10,
              columns: 2,
              showStudentCount: true,
              showSubject: true,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  widgetContainer: {
    marginBottom: 16,
  },
});
