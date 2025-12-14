import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useEnabledWidgets, useFeatures } from "../hooks/config";
import { getWidgetEntry } from "../config/widgetRegistry";
import { WidgetContainer } from "../components/widgets/base/WidgetContainer";
import { WidgetErrorBoundary } from "../components/widgets/base/WidgetErrorBoundary";
import { usePermissions } from "../hooks/config/usePermissions";
import type { Role } from "../types/permission.types";
import { useAppTheme } from "../theme/useAppTheme";
import { useNetworkStatus } from "../offline/networkStore";
import { useTranslation } from "react-i18next";
import { useAnalytics } from "../hooks/useAnalytics";
import { addBreadcrumb } from "../error/sentry";
import type { WidgetId } from "../types/widget.types";
import { EXPECTED_WIDGET_VERSION, isVersionMismatch } from "../services/config/versioning";
import { migrateDashboardLayout } from "../services/config/migrations";
import { AppText } from "../ui/components/AppText";

type Props = {
  role: Role;
  customerId: string;
  userId: string;
};

export const DynamicDashboard: React.FC<Props> = ({ role, customerId, userId }) => {
  const { layout: widgets, changed: layoutMigrated } = migrateDashboardLayout(useEnabledWidgets(role));
  const features = useFeatures();
  const enabledFeatureIds = new Set(features.filter((f) => f.enabled).map((f) => f.featureId));
  const { has } = usePermissions(role);
  const { colors, roundness } = useAppTheme();
  const useStaticDashboard = process.env.USE_DYNAMIC_DASHBOARD === "false";
  const { isOnline } = useNetworkStatus();
  const { t } = useTranslation();
  const { trackWidgetEvent } = useAnalytics({ role, customerId, userId });

  return (
    <View style={styles.container}>
      <AppText variant="title" style={[styles.heading, { color: colors.onSurface }]}>Dashboard Widgets ({role})</AppText>
      {widgets.map((w) => {
        const entry = getWidgetEntry(w.widgetId);
        if (!entry) {
          return (
            <View
              key={w.widgetId}
              style={[
                styles.missing,
                { backgroundColor: colors.errorContainer, borderColor: colors.error, },
              ]}
            >
              <AppText style={[styles.missingText, { color: colors.onErrorContainer }]}>
                Missing widget: {w.widgetId}
              </AppText>
            </View>
          );
        }

        if (isVersionMismatch(entry.metadata.version, EXPECTED_WIDGET_VERSION)) {
          addBreadcrumb({
            category: "widget",
            message: "widget_version_mismatch",
            level: "warning",
            data: { widgetId: entry.metadata.id, expected: EXPECTED_WIDGET_VERSION, received: entry.metadata.version },
          });
        }

        // Gate by feature toggle
        if (!enabledFeatureIds.has(entry.metadata.featureId) && !useStaticDashboard) {
          return null;
        }

        // Gate by required permissions if any
        if (
          entry.metadata.requiredPermissions &&
          entry.metadata.requiredPermissions.some((code) => !has(code))
        ) {
          return null;
        }

        if (entry.metadata.requiresOnline && !isOnline) {
          const widgetTitle =
            (entry.metadata.titleKey && t(entry.metadata.titleKey)) ||
            entry.metadata.name ||
            entry.metadata.id;
          addBreadcrumb({
            category: "widget",
            message: "widget_offline_blocked",
            level: "info",
            data: { widgetId: entry.metadata.id },
          });
          return (
            <View
              key={w.widgetId}
              style={[
                styles.offline,
                { borderColor: colors.outline, backgroundColor: colors.surface },
              ]}
            >
              <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
                {t("common:status.offline_widget", {
                  widget: widgetTitle,
                  defaultValue: `${widgetTitle} requires internet.`,
                })}
              </AppText>
            </View>
          );
        }

        if (entry.metadata.deprecated && entry.metadata.replacementId) {
          const replacement = getWidgetEntry(entry.metadata.replacementId as WidgetId);
          if (replacement) {
            addBreadcrumb({
              category: "widget",
              message: "widget_replaced",
              level: "info",
              data: { from: entry.metadata.id, to: replacement.metadata.id },
            });
            const WidgetComponent = replacement.component;
            trackWidgetEvent(replacement.metadata.id, "render", { role, replacedFrom: entry.metadata.id });
            return (
              <WidgetErrorBoundary
                key={`${w.widgetId}-replaced`}
                colors={{
                  error: colors.error,
                  errorContainer: colors.errorContainer,
                  onErrorContainer: colors.onErrorContainer,
                }}
                roundness={roundness}
              >
                <WidgetContainer metadata={replacement.metadata}>
                  <WidgetComponent
                    customerId={customerId}
                    userId={userId}
                    role={role}
                    config={w.customProps ?? {}}
                    onNavigate={() => {}}
                  />
                </WidgetContainer>
              </WidgetErrorBoundary>
            );
          }
        }

        const WidgetComponent = entry.component;
        trackWidgetEvent(entry.metadata.id, "render", {
          role,
          requiresOnline: entry.metadata.requiresOnline,
          migrated: layoutMigrated,
        });
        return (
          <WidgetErrorBoundary
            key={w.widgetId}
            colors={{
              error: colors.error,
              errorContainer: colors.errorContainer,
              onErrorContainer: colors.onErrorContainer,
            }}
            roundness={roundness}
          >
          <WidgetContainer metadata={entry.metadata}>
            <WidgetComponent
              customerId={customerId}
              userId={userId}
              role={role}
              config={w.customProps ?? {}}
              onNavigate={() => {}}
            />
          </WidgetContainer>
        </WidgetErrorBoundary>
      );
    })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
  },
  missing: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  missingText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  offline: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  offlineText: {
    fontSize: 13,
  },
});
