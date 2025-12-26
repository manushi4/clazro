import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import {
  useSubstituteQuery,
  type SubstituteRequest,
  type AvailableTeacher,
} from "../../../hooks/queries/teacher/useSubstituteQuery";

type TabType = "myRequests" | "available" | "openRequests";

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending":
      return { color: "#FF9800", icon: "clock-outline", label: "Pending" };
    case "approved":
      return { color: "#2196F3", icon: "check-circle-outline", label: "Approved" };
    case "fulfilled":
      return { color: "#4CAF50", icon: "check-circle", label: "Fulfilled" };
    case "rejected":
      return { color: "#F44336", icon: "close-circle-outline", label: "Rejected" };
    case "cancelled":
      return { color: "#9E9E9E", icon: "cancel", label: "Cancelled" };
    default:
      return { color: "#607D8B", icon: "help-circle-outline", label: status };
  }
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

export const SubstituteManagerWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const [activeTab, setActiveTab] = useState<TabType>("myRequests");

  const maxItems = (config?.maxItems as number) || 5;

  const { data, isLoading, error, refetch } = useSubstituteQuery({
    includeMyRequests: true,
    includePendingRequests: true,
    includeAvailableTeachers: true,
  });

  const handleCreateRequest = () => {
    (navigation as any).navigate("SubstituteRequestCreate");
  };

  const handleViewRequest = (request: SubstituteRequest) => {
    (navigation as any).navigate("SubstituteRequestDetail", { requestId: request.id });
  };

  const handleOfferSubstitute = (request: SubstituteRequest) => {
    (navigation as any).navigate("SubstituteOffer", { requestId: request.id });
  };

  const handleContactTeacher = (teacher: AvailableTeacher) => {
    (navigation as any).navigate("TeacherProfile", { teacherId: teacher.teacher_id });
  };

  const tabs: { key: TabType; label: string; icon: string; count?: number }[] = [
    { key: "myRequests", label: t("widgets.substituteManager.tabs.myRequests", { defaultValue: "My Requests" }), icon: "account-arrow-right", count: data?.myRequests?.length },
    { key: "available", label: t("widgets.substituteManager.tabs.available", { defaultValue: "Available" }), icon: "account-check", count: data?.availableTeachers?.length },
    { key: "openRequests", label: t("widgets.substituteManager.tabs.openRequests", { defaultValue: "Open" }), icon: "hand-wave", count: data?.pendingRequests?.length },
  ];

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.substituteManager.states.error", { defaultValue: "Failed to load data" })}
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

  const renderMyRequests = () => {
    if (!data?.myRequests?.length) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="swap-horizontal" size={32} color={colors.onSurfaceVariant} />
          <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
            {t("widgets.substituteManager.empty.myRequests", { defaultValue: "No substitute requests" })}
          </AppText>
          <TouchableOpacity
            onPress={handleCreateRequest}
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
          >
            <Icon name="plus" size={16} color={colors.onPrimary} />
            <AppText style={{ color: colors.onPrimary, fontSize: 13, fontWeight: "600" }}>
              {t("widgets.substituteManager.createRequest", { defaultValue: "Request Substitute" })}
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {data.myRequests.slice(0, maxItems).map((request, index) => {
          const statusConfig = getStatusConfig(request.status);
          return (
            <TouchableOpacity
              key={request.id}
              onPress={() => handleViewRequest(request)}
              style={[
                styles.requestCard,
                {
                  backgroundColor: colors.surface,
                  borderRadius: borderRadius.medium,
                  borderLeftWidth: 4,
                  borderLeftColor: statusConfig.color,
                },
                index < Math.min(data.myRequests.length, maxItems) - 1 && { marginBottom: 10 },
              ]}
            >
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <AppText style={[styles.className, { color: colors.onSurface }]}>
                    {request.class_name}
                  </AppText>
                  <AppText style={[styles.subject, { color: colors.onSurfaceVariant }]}>
                    {request.subject}
                  </AppText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}15` }]}>
                  <Icon name={statusConfig.icon} size={12} color={statusConfig.color} />
                  <AppText style={{ color: statusConfig.color, fontSize: 11, fontWeight: "600" }}>
                    {statusConfig.label}
                  </AppText>
                </View>
              </View>
              <View style={styles.requestDetails}>
                <View style={styles.detailItem}>
                  <Icon name="calendar" size={14} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                    {formatDate(request.request_date)}
                  </AppText>
                </View>
                <View style={styles.detailItem}>
                  <Icon name="clock-outline" size={14} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                    {formatTime(request.start_time)} - {formatTime(request.end_time)}
                  </AppText>
                </View>
              </View>
              {request.substitute_name && (
                <View style={[styles.substituteInfo, { backgroundColor: `${colors.primary}10` }]}>
                  <Icon name="account-check" size={14} color={colors.primary} />
                  <AppText style={{ color: colors.primary, fontSize: 12 }}>
                    {request.substitute_name}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderAvailableTeachers = () => {
    if (!data?.availableTeachers?.length) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="account-off" size={32} color={colors.onSurfaceVariant} />
          <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
            {t("widgets.substituteManager.empty.available", { defaultValue: "No teachers available" })}
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {data.availableTeachers.slice(0, maxItems).map((teacher, index) => (
          <TouchableOpacity
            key={teacher.id}
            onPress={() => handleContactTeacher(teacher)}
            style={[
              styles.teacherCard,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.medium,
              },
              index < Math.min(data.availableTeachers.length, maxItems) - 1 && { marginBottom: 10 },
            ]}
          >
            <View style={[styles.teacherAvatar, { backgroundColor: colors.primaryContainer }]}>
              <Icon name="account" size={24} color={colors.primary} />
            </View>
            <View style={styles.teacherInfo}>
              <AppText style={[styles.teacherName, { color: colors.onSurface }]}>
                {teacher.teacher_name}
              </AppText>
              <View style={styles.subjectTags}>
                {teacher.subjects.slice(0, 2).map((subject, idx) => (
                  <View key={idx} style={[styles.subjectTag, { backgroundColor: colors.secondaryContainer }]}>
                    <AppText style={{ color: colors.onSecondaryContainer, fontSize: 10 }}>
                      {subject}
                    </AppText>
                  </View>
                ))}
                {teacher.subjects.length > 2 && (
                  <AppText style={{ color: colors.onSurfaceVariant, fontSize: 10 }}>
                    +{teacher.subjects.length - 2}
                  </AppText>
                )}
              </View>
              <View style={styles.availabilityInfo}>
                <Icon name="calendar-check" size={12} color={colors.onSurfaceVariant} />
                <AppText style={[styles.availabilityText, { color: colors.onSurfaceVariant }]}>
                  {formatDate(teacher.available_date)}, {formatTime(teacher.start_time)} - {formatTime(teacher.end_time)}
                </AppText>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderOpenRequests = () => {
    if (!data?.pendingRequests?.length) {
      return (
        <View style={[styles.emptyTab, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="hand-okay" size={32} color={colors.onSurfaceVariant} />
          <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
            {t("widgets.substituteManager.empty.openRequests", { defaultValue: "No open requests" })}
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {data.pendingRequests.slice(0, maxItems).map((request, index) => (
          <TouchableOpacity
            key={request.id}
            onPress={() => handleOfferSubstitute(request)}
            style={[
              styles.openRequestCard,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.medium,
              },
              index < Math.min(data.pendingRequests.length, maxItems) - 1 && { marginBottom: 10 },
            ]}
          >
            <View style={styles.requestHeader}>
              <View style={[styles.requesterAvatar, { backgroundColor: colors.tertiaryContainer }]}>
                <Icon name="account" size={20} color={colors.tertiary} />
              </View>
              <View style={styles.requestInfo}>
                <AppText style={[styles.requesterName, { color: colors.onSurface }]}>
                  {request.requester_name}
                </AppText>
                <AppText style={[styles.classSubject, { color: colors.onSurfaceVariant }]}>
                  {request.class_name} - {request.subject}
                </AppText>
              </View>
            </View>
            <View style={styles.requestDetails}>
              <View style={styles.detailItem}>
                <Icon name="calendar" size={14} color={colors.onSurfaceVariant} />
                <AppText style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                  {formatDate(request.request_date)}
                </AppText>
              </View>
              <View style={styles.detailItem}>
                <Icon name="clock-outline" size={14} color={colors.onSurfaceVariant} />
                <AppText style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                  {formatTime(request.start_time)} - {formatTime(request.end_time)}
                </AppText>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleOfferSubstitute(request)}
              style={[styles.offerBtn, { backgroundColor: colors.primary }]}
            >
              <Icon name="hand-wave" size={14} color={colors.onPrimary} />
              <AppText style={{ color: colors.onPrimary, fontSize: 12, fontWeight: "600" }}>
                {t("widgets.substituteManager.offerHelp", { defaultValue: "Offer to Help" })}
              </AppText>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.key ? colors.primary : colors.surfaceVariant,
                borderRadius: borderRadius.full || 20,
              },
            ]}
          >
            <Icon
              name={tab.icon}
              size={14}
              color={activeTab === tab.key ? colors.onPrimary : colors.onSurfaceVariant}
            />
            <AppText
              style={{
                color: activeTab === tab.key ? colors.onPrimary : colors.onSurfaceVariant,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {tab.label}
            </AppText>
            {tab.count !== undefined && tab.count > 0 && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: activeTab === tab.key ? colors.onPrimary : colors.primary,
                  },
                ]}
              >
                <AppText
                  style={{
                    color: activeTab === tab.key ? colors.primary : colors.onPrimary,
                    fontSize: 10,
                    fontWeight: "700",
                  }}
                >
                  {tab.count}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create request button */}
      {activeTab === "myRequests" && (
        <TouchableOpacity
          onPress={handleCreateRequest}
          style={[styles.createBtnSmall, { backgroundColor: `${colors.primary}10` }]}
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <AppText style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
            {t("widgets.substituteManager.createRequest", { defaultValue: "Request Substitute" })}
          </AppText>
        </TouchableOpacity>
      )}

      {/* Tab content */}
      {activeTab === "myRequests" && renderMyRequests()}
      {activeTab === "available" && renderAvailableTeachers()}
      {activeTab === "openRequests" && renderOpenRequests()}

      {/* View all link */}
      <TouchableOpacity
        onPress={() => (navigation as any).navigate("SubstituteManager")}
        style={[styles.viewAllBtn, { borderColor: colors.outlineVariant }]}
      >
        <AppText style={{ color: colors.primary, fontWeight: "600" }}>
          {t("widgets.substituteManager.viewAll", { defaultValue: "View All Substitutes" })}
        </AppText>
        <Icon name="chevron-right" size={18} color={colors.primary} />
      </TouchableOpacity>
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
    gap: 8,
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emptyTab: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  createBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabScroll: {
    flexGrow: 0,
  },
  tabContainer: {
    gap: 8,
    paddingRight: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  listContainer: {},
  requestCard: {
    padding: 14,
    gap: 10,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  requestInfo: {
    flex: 1,
  },
  className: {
    fontSize: 15,
    fontWeight: "600",
  },
  subject: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  requestDetails: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  substituteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  teacherCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  teacherAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  teacherInfo: {
    flex: 1,
    gap: 4,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: "600",
  },
  subjectTags: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  subjectTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  availabilityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  availabilityText: {
    fontSize: 11,
  },
  openRequestCard: {
    padding: 14,
    gap: 10,
  },
  requesterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  requesterName: {
    fontSize: 14,
    fontWeight: "600",
  },
  classSubject: {
    fontSize: 12,
  },
  offerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 4,
  },
});
