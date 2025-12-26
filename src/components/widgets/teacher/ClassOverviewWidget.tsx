import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useClassOverviewQuery, ClassOverviewItem, AtRiskStudent } from "../../../hooks/queries/teacher/useClassOverviewQuery";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ClassAction = "attendance" | "roster" | "assignment" | "notifyParents";
type StudentAction = "call" | "whatsapp" | "remedial" | "meeting";

interface ClassOverviewWidgetProps extends WidgetProps {
  config?: {
    maxStudentsPerClass?: number;
    attendanceThreshold?: number;
    scoreThreshold?: number;
    showQuickActions?: boolean;
    showStudentActions?: boolean;
    expandedByDefault?: boolean;
  };
}

export const ClassOverviewWidget: React.FC<ClassOverviewWidgetProps> = ({
  config,
  onNavigate,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t, i18n } = useTranslation("teacher");

  // === CONFIG (with defaults) ===
  const maxStudentsPerClass = config?.maxStudentsPerClass || 3;
  const attendanceThreshold = config?.attendanceThreshold || 75;
  const scoreThreshold = config?.scoreThreshold || 60;
  const showQuickActions = config?.showQuickActions !== false;
  const showStudentActions = config?.showStudentActions !== false;
  const expandedByDefault = config?.expandedByDefault || false;

  // === STATE ===
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // === DATA ===
  const { data, isLoading, error, refetch } = useClassOverviewQuery({
    maxStudentsPerClass,
    attendanceThreshold,
    scoreThreshold,
  });

  // === HANDLERS ===
  const toggleClass = (classId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const handleClassAction = (classItem: ClassOverviewItem, action: ClassAction) => {
    switch (action) {
      case "attendance":
        onNavigate?.("AttendanceMark", { classId: classItem.id, className: classItem.name });
        break;
      case "roster":
        onNavigate?.("ClassRoster", { classId: classItem.id, className: classItem.name });
        break;
      case "assignment":
        onNavigate?.("CreateAssignment", {
          classId: classItem.id,
          className: classItem.name,
          isRemedial: true,
          targetStudents: classItem.at_risk_students.map(s => s.student_id),
        });
        break;
      case "notifyParents":
        // Notify all at-risk students' parents
        const studentNames = classItem.at_risk_students.map(s => s.name_en).join(", ");
        Alert.alert(
          t("widgets.classOverview.alerts.notifyTitle", { defaultValue: "Notify Parents" }),
          t("widgets.classOverview.alerts.notifyMessage", {
            defaultValue: `Send progress alert to parents of: ${studentNames}?`,
            students: studentNames
          }),
          [
            { text: t("common.cancel", { defaultValue: "Cancel" }), style: "cancel" },
            {
              text: t("common.send", { defaultValue: "Send" }),
              onPress: () => {
                onNavigate?.("BulkMessage", {
                  classId: classItem.id,
                  recipients: classItem.at_risk_students.map(s => s.student_id),
                  messageType: "progress-alert",
                });
              }
            },
          ]
        );
        break;
    }
  };

  const handleStudentAction = (student: AtRiskStudent, classItem: ClassOverviewItem, action: StudentAction) => {
    setSelectedStudent(null);

    switch (action) {
      case "call":
        if (student.parent_phone) {
          onNavigate?.("PhoneCall", { phone: student.parent_phone, studentName: student.name_en });
        } else {
          Alert.alert(
            t("widgets.classOverview.alerts.noPhone", { defaultValue: "No Phone Number" }),
            t("widgets.classOverview.alerts.noPhoneMessage", { defaultValue: "Parent phone number not available" })
          );
        }
        break;
      case "whatsapp":
        onNavigate?.("WhatsAppMessage", {
          studentId: student.student_id,
          studentName: student.name_en,
          context: "at-risk-alert",
        });
        break;
      case "remedial":
        onNavigate?.("CreateAssignment", {
          classId: classItem.id,
          isRemedial: true,
          targetStudents: [student.student_id],
          studentName: student.name_en,
        });
        break;
      case "meeting":
        onNavigate?.("ScheduleMeeting", {
          studentId: student.student_id,
          studentName: student.name_en,
          classId: classItem.id,
          meetingType: "parent-teacher",
        });
        break;
    }
  };

  const toggleStudentActions = (studentId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedStudent(prev => prev === studentId ? null : studentId);
  };

  const getRiskColor = (reason: AtRiskStudent["risk_reason"]) => {
    switch (reason) {
      case "both":
        return colors.error;
      case "low_attendance":
        return colors.warning;
      case "low_score":
        return "#FF6B6B";
      default:
        return colors.warning;
    }
  };

  const getRiskIcon = (reason: AtRiskStudent["risk_reason"]) => {
    switch (reason) {
      case "both":
        return "alert-circle";
      case "low_attendance":
        return "account-clock";
      case "low_score":
        return "chart-line-variant";
      default:
        return "alert";
    }
  };

  const getRiskLabel = (reason: AtRiskStudent["risk_reason"]) => {
    switch (reason) {
      case "both":
        return t("widgets.classOverview.risk.both", { defaultValue: "Attendance & Score" });
      case "low_attendance":
        return t("widgets.classOverview.risk.attendance", { defaultValue: "Low Attendance" });
      case "low_score":
        return t("widgets.classOverview.risk.score", { defaultValue: "Low Score" });
      default:
        return "";
    }
  };

  // Progress ring component
  const ProgressRing = ({ value, color, size = 28 }: { value: number; color: string; size?: number }) => {
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(100, Math.max(0, value));
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <View style={[styles.ringBg, { width: size, height: size, borderRadius: size / 2, borderColor: `${color}30` }]} />
        <View
          style={[
            styles.ringProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: color,
              borderTopColor: "transparent",
              borderRightColor: progress > 25 ? color : "transparent",
              borderBottomColor: progress > 50 ? color : "transparent",
              borderLeftColor: progress > 75 ? color : "transparent",
              transform: [{ rotate: `${(progress / 100) * 360 - 90}deg` }],
            }
          ]}
        />
        <AppText style={[styles.ringValue, { color }]}>{value.toFixed(0)}</AppText>
      </View>
    );
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.classOverview.states.loading", { defaultValue: "Loading classes..." })}
        </AppText>
      </View>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={28} color={colors.error} />
        <AppText style={{ color: colors.error, marginTop: 8 }}>
          {t("widgets.classOverview.states.error", { defaultValue: "Failed to load classes" })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("common.retry", { defaultValue: "Retry" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // === EMPTY STATE ===
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="school-outline" size={36} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8, textAlign: "center" }}>
          {t("widgets.classOverview.states.empty", { defaultValue: "No classes assigned" })}
        </AppText>
      </View>
    );
  }

  // === SUCCESS STATE ===
  return (
    <View style={styles.container}>
      {data.map((classItem) => {
        const isExpanded = expandedByDefault || expandedClasses.has(classItem.id);
        const hasAtRisk = classItem.at_risk_students.length > 0;

        return (
          <View
            key={classItem.id}
            style={[
              styles.classCard,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.medium,
              },
            ]}
          >
            {/* Class Header - Tappable to expand/collapse */}
            <TouchableOpacity
              onPress={() => toggleClass(classItem.id)}
              style={styles.classHeader}
              activeOpacity={0.7}
            >
              <View style={styles.classInfo}>
                <View style={styles.classNameRow}>
                  <AppText style={[styles.className, { color: colors.onSurface }]}>
                    {classItem.name}
                  </AppText>
                  {hasAtRisk && (
                    <View style={[styles.atRiskBadge, { backgroundColor: `${colors.error}20` }]}>
                      <Icon name="alert" size={12} color={colors.error} />
                      <AppText style={[styles.atRiskBadgeText, { color: colors.error }]}>
                        {classItem.at_risk_count}
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText style={[styles.classSubject, { color: colors.onSurfaceVariant }]}>
                  {classItem.subject}
                </AppText>
              </View>

              {/* Visual Stats with Progress Rings */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="account-group" size={14} color={colors.primary} />
                  <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                    {classItem.total_students}
                  </AppText>
                </View>
                <View style={[styles.ringContainer, { marginHorizontal: 4 }]}>
                  <ProgressRing
                    value={classItem.avg_attendance}
                    color={classItem.avg_attendance >= 85 ? colors.success : colors.warning}
                  />
                </View>
                <View style={styles.ringContainer}>
                  <ProgressRing
                    value={classItem.avg_score}
                    color={classItem.avg_score >= 70 ? colors.primary : colors.error}
                  />
                </View>
                <Icon
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.onSurfaceVariant}
                  style={{ marginLeft: 4 }}
                />
              </View>
            </TouchableOpacity>

            {/* Expanded Content */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                {/* Quick Actions - Enhanced */}
                {showQuickActions && (
                  <View style={[styles.quickActions, { borderTopColor: `${colors.onSurfaceVariant}15` }]}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: `${colors.success}12` }]}
                      onPress={() => handleClassAction(classItem, "attendance")}
                    >
                      <Icon name="calendar-check" size={18} color={colors.success} />
                      <AppText style={[styles.actionLabel, { color: colors.success }]}>
                        {t("widgets.classOverview.actions.attendance", { defaultValue: "Attendance" })}
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: `${colors.primary}12` }]}
                      onPress={() => handleClassAction(classItem, "roster")}
                    >
                      <Icon name="account-group" size={18} color={colors.primary} />
                      <AppText style={[styles.actionLabel, { color: colors.primary }]}>
                        {t("widgets.classOverview.actions.roster", { defaultValue: "Roster" })}
                      </AppText>
                    </TouchableOpacity>
                    {hasAtRisk && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: `${colors.warning}12` }]}
                          onPress={() => handleClassAction(classItem, "assignment")}
                        >
                          <Icon name="clipboard-edit" size={18} color={colors.warning} />
                          <AppText style={[styles.actionLabel, { color: colors.warning }]}>
                            {t("widgets.classOverview.actions.remedial", { defaultValue: "Remedial" })}
                          </AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: `${colors.error}12` }]}
                          onPress={() => handleClassAction(classItem, "notifyParents")}
                        >
                          <Icon name="bell-ring" size={18} color={colors.error} />
                          <AppText style={[styles.actionLabel, { color: colors.error }]}>
                            {t("widgets.classOverview.actions.notify", { defaultValue: "Notify" })}
                          </AppText>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}

                {/* At-Risk Students with Actions */}
                {hasAtRisk ? (
                  <View style={styles.atRiskSection}>
                    <View style={styles.sectionHeader}>
                      <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
                        {t("widgets.classOverview.needsAttention", { defaultValue: "Needs Attention" })}
                      </AppText>
                      <AppText style={[styles.sectionCount, { color: colors.error }]}>
                        {classItem.at_risk_count} {t("widgets.classOverview.students", { defaultValue: "students" })}
                      </AppText>
                    </View>
                    {classItem.at_risk_students.map((student) => {
                      const isSelected = selectedStudent === student.id;
                      const riskColor = getRiskColor(student.risk_reason);

                      return (
                        <View key={student.id}>
                          <TouchableOpacity
                            style={[
                              styles.studentRow,
                              { backgroundColor: `${riskColor}08` },
                              isSelected && { backgroundColor: `${riskColor}15` },
                            ]}
                            onPress={() => showStudentActions ? toggleStudentActions(student.id) : onNavigate?.("StudentDetail", { studentId: student.student_id })}
                            onLongPress={() => onNavigate?.("StudentDetail", { studentId: student.student_id })}
                          >
                            <View style={[styles.studentAvatar, { backgroundColor: `${riskColor}20` }]}>
                              <Icon
                                name={getRiskIcon(student.risk_reason)}
                                size={16}
                                color={riskColor}
                              />
                            </View>
                            <View style={styles.studentInfo}>
                              <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
                                {i18n.language === "hi" && student.name_hi ? student.name_hi : student.name_en}
                              </AppText>
                              <View style={styles.studentStats}>
                                <View style={[styles.miniStat, { backgroundColor: `${colors.warning}15` }]}>
                                  <Icon name="calendar-clock" size={10} color={colors.warning} />
                                  <AppText style={[styles.miniStatText, { color: colors.warning }]}>
                                    {student.attendance_rate}%
                                  </AppText>
                                </View>
                                <View style={[styles.miniStat, { backgroundColor: `${colors.primary}15` }]}>
                                  <Icon name="chart-line" size={10} color={colors.primary} />
                                  <AppText style={[styles.miniStatText, { color: colors.primary }]}>
                                    {student.average_score}%
                                  </AppText>
                                </View>
                                {student.assignments_pending > 0 && (
                                  <View style={[styles.miniStat, { backgroundColor: `${colors.error}15` }]}>
                                    <Icon name="file-clock" size={10} color={colors.error} />
                                    <AppText style={[styles.miniStatText, { color: colors.error }]}>
                                      {student.assignments_pending}
                                    </AppText>
                                  </View>
                                )}
                              </View>
                            </View>
                            <Icon
                              name={isSelected ? "chevron-up" : "dots-vertical"}
                              size={18}
                              color={colors.onSurfaceVariant}
                            />
                          </TouchableOpacity>

                          {/* Student Quick Actions */}
                          {isSelected && showStudentActions && (
                            <View style={[styles.studentActions, { backgroundColor: `${riskColor}05` }]}>
                              <TouchableOpacity
                                style={[styles.studentActionBtn, { backgroundColor: colors.success }]}
                                onPress={() => handleStudentAction(student, classItem, "call")}
                              >
                                <Icon name="phone" size={16} color={colors.onPrimary || "#fff"} />
                                <AppText style={[styles.studentActionLabel, { color: colors.onPrimary || "#fff" }]}>
                                  {t("widgets.classOverview.studentActions.call", { defaultValue: "Call Parent" })}
                                </AppText>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.studentActionBtn, { backgroundColor: "#25D366" }]}
                                onPress={() => handleStudentAction(student, classItem, "whatsapp")}
                              >
                                <Icon name="whatsapp" size={16} color="#fff" />
                                <AppText style={[styles.studentActionLabel, { color: "#fff" }]}>
                                  {t("widgets.classOverview.studentActions.whatsapp", { defaultValue: "WhatsApp" })}
                                </AppText>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.studentActionBtn, { backgroundColor: colors.warning }]}
                                onPress={() => handleStudentAction(student, classItem, "remedial")}
                              >
                                <Icon name="clipboard-edit" size={16} color="#fff" />
                                <AppText style={[styles.studentActionLabel, { color: "#fff" }]}>
                                  {t("widgets.classOverview.studentActions.remedial", { defaultValue: "Remedial" })}
                                </AppText>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.studentActionBtn, { backgroundColor: colors.primary }]}
                                onPress={() => handleStudentAction(student, classItem, "meeting")}
                              >
                                <Icon name="calendar-account" size={16} color={colors.onPrimary || "#fff"} />
                                <AppText style={[styles.studentActionLabel, { color: colors.onPrimary || "#fff" }]}>
                                  {t("widgets.classOverview.studentActions.meeting", { defaultValue: "PTM" })}
                                </AppText>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={[styles.noRiskSection, { backgroundColor: `${colors.success}08` }]}>
                    <Icon name="check-circle" size={24} color={colors.success} />
                    <View style={styles.noRiskContent}>
                      <AppText style={[styles.noRiskText, { color: colors.success }]}>
                        {t("widgets.classOverview.allGood", { defaultValue: "All students on track!" })}
                      </AppText>
                      <AppText style={[styles.noRiskSubtext, { color: colors.onSurfaceVariant }]}>
                        {t("widgets.classOverview.allGoodSubtext", { defaultValue: "No students need immediate attention" })}
                      </AppText>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stateContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  classCard: {
    overflow: "hidden",
  },
  classHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  classInfo: {
    flex: 1,
  },
  classNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  className: {
    fontSize: 15,
    fontWeight: "600",
  },
  classSubject: {
    fontSize: 12,
    marginTop: 2,
  },
  atRiskBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  atRiskBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  ringContainer: {
    position: "relative",
  },
  ringBg: {
    position: "absolute",
    borderWidth: 3,
  },
  ringProgress: {
    position: "absolute",
    borderWidth: 3,
  },
  ringValue: {
    fontSize: 9,
    fontWeight: "700",
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  atRiskSection: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: "600",
  },
  studentStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniStatText: {
    fontSize: 10,
    fontWeight: "600",
  },
  studentActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 10,
    marginTop: -4,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  studentActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  studentActionLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  noRiskSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 10,
    marginTop: 4,
  },
  noRiskContent: {
    flex: 1,
  },
  noRiskText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noRiskSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
});
