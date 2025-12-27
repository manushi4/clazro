import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import {
  useUpcomingEventsQuery,
  type TeacherCalendarEvent,
} from "../../../hooks/queries/teacher/useTeacherCalendarQuery";

const formatEventTime = (startTime: string, endTime?: string, allDay?: boolean): string => {
  if (allDay) return "All Day";

  const start = new Date(startTime);
  const timeStr = start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  if (endTime) {
    const end = new Date(endTime);
    const endTimeStr = end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return `${timeStr} - ${endTimeStr}`;
  }

  return timeStr;
};

const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

const getEventTypeConfig = (eventType: string) => {
  switch (eventType) {
    case "class":
      return { color: "#2196F3", icon: "book-open-variant", label: "Class" };
    case "meeting":
      return { color: "#FF9800", icon: "account-group", label: "Meeting" };
    case "exam":
      return { color: "#F44336", icon: "clipboard-text", label: "Exam" };
    case "holiday":
      return { color: "#4CAF50", icon: "party-popper", label: "Holiday" };
    case "deadline":
      return { color: "#9C27B0", icon: "calendar-clock", label: "Deadline" };
    case "personal":
      return { color: "#00BCD4", icon: "account", label: "Personal" };
    default:
      return { color: "#607D8B", icon: "calendar", label: "Event" };
  }
};

export const TeacherCalendarWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  const maxItems = (config?.maxItems as number) || 5;
  const showQuickAdd = config?.showQuickAdd !== false;

  const { data, isLoading, error, refetch } = useUpcomingEventsQuery(maxItems);

  const handleEventPress = (event: TeacherCalendarEvent) => {
    (navigation as any).navigate("CalendarEventDetail", { eventId: event.id });
  };

  const handleAddEvent = () => {
    (navigation as any).navigate("CalendarEventCreate");
  };

  // Loading
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.calendar.states.error", { defaultValue: "Failed to load events" })}
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

  // Empty
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="calendar-blank-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.calendar.states.empty", { defaultValue: "No upcoming events" })}
        </AppText>
        {showQuickAdd && (
          <TouchableOpacity
            onPress={handleAddEvent}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Icon name="plus" size={16} color={colors.onPrimary} />
            <AppText style={{ color: colors.onPrimary, fontSize: 13, fontWeight: "600" }}>
              {t("widgets.calendar.addEvent", { defaultValue: "Add Event" })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Group events by date
  const groupedEvents: { [key: string]: TeacherCalendarEvent[] } = {};
  data.forEach((event) => {
    const dateKey = formatEventDate(event.start_time);
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });

  return (
    <View style={styles.container}>
      {/* Quick add button */}
      {showQuickAdd && (
        <TouchableOpacity
          onPress={handleAddEvent}
          style={[styles.quickAddBtn, { backgroundColor: `${colors.primary}10` }]}
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <AppText style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
            {t("widgets.calendar.quickAdd", { defaultValue: "Add New Event" })}
          </AppText>
        </TouchableOpacity>
      )}

      {/* Events list grouped by date */}
      {Object.entries(groupedEvents).map(([dateLabel, events]) => (
        <View key={dateLabel} style={styles.dateGroup}>
          <View style={styles.dateHeader}>
            <View style={[styles.dateBadge, { backgroundColor: colors.primary }]}>
              <AppText style={styles.dateBadgeText}>{dateLabel}</AppText>
            </View>
            <View style={[styles.dateLine, { backgroundColor: colors.outlineVariant }]} />
          </View>

          {events.map((event, index) => {
            const typeConfig = getEventTypeConfig(event.event_type);
            const eventColor = event.color || typeConfig.color;

            return (
              <TouchableOpacity
                key={event.id}
                onPress={() => handleEventPress(event)}
                style={[
                  styles.eventItem,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: borderRadius.medium,
                    borderLeftWidth: 3,
                    borderLeftColor: eventColor,
                  },
                  index < events.length - 1 && { marginBottom: 8 },
                ]}
              >
                <View style={[styles.eventIcon, { backgroundColor: `${eventColor}15` }]}>
                  <Icon name={event.icon || typeConfig.icon} size={18} color={eventColor} />
                </View>

                <View style={styles.eventContent}>
                  <AppText style={[styles.eventTitle, { color: colors.onSurface }]} numberOfLines={1}>
                    {getLocalizedField(event, "title")}
                  </AppText>
                  <View style={styles.eventMeta}>
                    <Icon name="clock-outline" size={12} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.eventTime, { color: colors.onSurfaceVariant }]}>
                      {formatEventTime(event.start_time, event.end_time, event.all_day)}
                    </AppText>
                    {event.class_name && (
                      <>
                        <View style={[styles.dot, { backgroundColor: colors.onSurfaceVariant }]} />
                        <AppText style={[styles.eventClass, { color: colors.onSurfaceVariant }]}>
                          {event.class_name}
                        </AppText>
                      </>
                    )}
                  </View>
                </View>

                <View style={[styles.typeBadge, { backgroundColor: `${eventColor}15` }]}>
                  <AppText style={{ color: eventColor, fontSize: 10, fontWeight: "600" }}>
                    {typeConfig.label}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* View full calendar */}
      <TouchableOpacity
        onPress={() => (navigation as any).navigate("TeacherCalendar")}
        style={[styles.viewAllBtn, { borderColor: colors.outlineVariant }]}
      >
        <AppText style={{ color: colors.primary, fontWeight: "600" }}>
          {t("widgets.calendar.viewFull", { defaultValue: "View Full Calendar" })}
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  quickAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  dateGroup: {
    marginBottom: 4,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  eventIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  eventContent: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventTime: {
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },
  eventClass: {
    fontSize: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
