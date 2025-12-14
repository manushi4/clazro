/**
 * TeacherRemarksWidget - Displays teacher remarks/feedback
 * Widget ID: parent.teacher-remarks
 * Used in: child-report-card screen
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildReportCardQuery } from "../../../hooks/queries/parent/useChildReportCardQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.teacher-remarks";

type Remark = {
  id: string;
  teacher_name: string;
  date: string;
  remark_en: string;
  remark_hi?: string;
  type: 'positive' | 'improvement' | 'general';
};

const REMARK_STYLES: Record<string, { icon: string; color: string }> = {
  positive: { icon: 'star', color: '#4CAF50' },
  improvement: { icon: 'alert-circle', color: '#FF9800' },
  general: { icon: 'information', color: '#2196F3' },
};

export const TeacherRemarksWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data: reportCards, isLoading, error } = useChildReportCardQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.teacherRemarks.error", { defaultValue: "Failed to load remarks" })}
        </AppText>
      </View>
    );
  }

  // Mock remarks data (would come from report card or separate query)
  const remarks: Remark[] = reportCards?.[0]?.teacher_remarks || [
    {
      id: '1',
      teacher_name: 'Class Teacher',
      date: new Date().toISOString(),
      remark_en: 'Shows consistent improvement in academics. Keep up the good work!',
      remark_hi: 'शिक्षाविदों में लगातार सुधार दिखाता है। अच्छा काम जारी रखें!',
      type: 'positive',
    },
    {
      id: '2',
      teacher_name: 'Math Teacher',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      remark_en: 'Needs to practice more word problems. Regular practice recommended.',
      remark_hi: 'अधिक शब्द समस्याओं का अभ्यास करने की आवश्यकता है।',
      type: 'improvement',
    },
  ];

  if (!remarks || remarks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="comment-text-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.teacherRemarks.empty", { defaultValue: "No remarks yet" })}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="comment-account" size={20} color={colors.primary} />
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("widgets.teacherRemarks.title", { defaultValue: "Teacher Remarks" })}
        </AppText>
      </View>

      <View style={styles.remarksList}>
        {remarks.map((remark, index) => {
          const remarkStyle = REMARK_STYLES[remark.type] || REMARK_STYLES.general;
          return (
            <View
              key={remark.id}
              style={[
                styles.remarkItem,
                { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
                index > 0 && styles.remarkItemMargin
              ]}
            >
              <View style={[styles.remarkIcon, { backgroundColor: `${remarkStyle.color}15` }]}>
                <Icon name={remarkStyle.icon} size={18} color={remarkStyle.color} />
              </View>
              <View style={styles.remarkContent}>
                <View style={styles.remarkHeader}>
                  <AppText style={[styles.teacherName, { color: colors.onSurface }]}>
                    {remark.teacher_name}
                  </AppText>
                  <AppText style={[styles.remarkDate, { color: colors.onSurfaceVariant }]}>
                    {formatDate(remark.date)}
                  </AppText>
                </View>
                <AppText style={[styles.remarkText, { color: colors.onSurfaceVariant }]}>
                  {getLocalizedField(remark, 'remark')}
                </AppText>
                <View style={[styles.typeBadge, { backgroundColor: `${remarkStyle.color}15` }]}>
                  <AppText style={[styles.typeText, { color: remarkStyle.color }]}>
                    {t(`widgets.teacherRemarks.type.${remark.type}`, { defaultValue: remark.type })}
                  </AppText>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  remarksList: { gap: 0 },
  remarkItem: { flexDirection: "row", padding: 14, gap: 12 },
  remarkItemMargin: { marginTop: 10 },
  remarkIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  remarkContent: { flex: 1 },
  remarkHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  teacherName: { fontSize: 14, fontWeight: "600" },
  remarkDate: { fontSize: 11 },
  remarkText: { fontSize: 13, lineHeight: 20 },
  typeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
  typeText: { fontSize: 10, fontWeight: "500", textTransform: "capitalize" },
});
