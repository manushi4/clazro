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
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import {
  useTeacherCalendarQuery,
  type TeacherCalendarEvent,
} from "../../../hooks/queries/teacher/useTeacherCalendarQuery";

type EventType = "all" | "class" | "meeting" | "exam" | "deadline";

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

const formatEventDateTime = (startTime: string, endTime?: string, allDay?: boolean): string => {
  const start = new Date(startTime);
  const dateStr = start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  if (allDay) return `${dateStr} - All Day`;

  const timeStr = start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  if (endTime) {
    const end = new Date(endTime);
    const endTimeStr = end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return `${dateStr}, ${timeStr} - ${endTimeStr}`;
  }

  return `${dateStr}, ${timeStr}`;
};

const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isTomorrow = (dateString: string): boolean => {
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

export const CalendarEventsWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const [selectedType, setSelectedType] = useState<EventType>("all");

  const maxItems = (config?.maxItems as number) || 10;
  const showFilters = config?.showFilters !== false;

  const { data, isLoading, error, refetch } = useTeacherCalendarQuery({
    eventType: selectedType === "all" ? undefined : selectedType,
  });

  const handleEventPress = (event: TeacherCalendarEvent) => {
    (navigation as any).navigate("CalendarEventDetail", { eventId: event.id });
  };

  const handleCreateEvent = () => {
    (navigation as any).navigate("CalendarEventCreate");
  };

  const filterOptions: { key: EventType; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "calendar" },
    { key: "class", label: "Classes", icon: "book-open-variant" },
    { key: "meeting", label: "Meetings", icon: "account-group" },
    { key: "exam", label: "Exams", icon: "clipboard-text" },
    { key: "deadline", label: "Deadlines", icon: "calendar-clock" },
  ];

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
          {t("widgets.calendarEvents.states.error", { defaultValue: "Failed to load events" })}
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
          {t("widgets.calendarEvents.states.empty", { defaultValue: "No events scheduled" })}
        </AppText>
        <TouchableOpacity
          onPress={handleCreateEvent}
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
        >
          <Icon name="plus" size={16} color={colors.onPrimary} />
          <AppText style={{ color: colors.onPrimary, fontSize: 13, fontWeight: "600" }}>
            {t("widgets.calendarEvents.create", { defaultValue: "Create Event" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => setSelectedType(option.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedType === option.key ? colors.primary : colors.surfaceVariant,
                  borderRadius: borderRadius.full || 20,
                },
              ]}
            >
              <Icon
                name={option.icon}
                size={14}
                color={selectedType === option.key ? colors.onPrimary : colors.onSurfaceVariant}
              />
              <AppText
                style={{
                  color: selectedType === option.key ? colors.onPrimary : colors.onSurfaceVariant,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {option.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Create button */}
      <TouchableOpacity
        onPress={handleCreateEvent}
        style={[styles.createBtnSmall, { backgroundColor: `${colors.primary}10` }]}
      >
        <Icon name="plus" size={16} color={colors.primary} />
        <AppText style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
          {t("widgets.calendarEvents.addNew", { defaultValue: "Add New Event" })}
        </AppText>
      </TouchableOpacity>

      {/* Events list */}
      <View style={styles.eventsList}>
        {data.slice(0, maxItems).map((event, index) => {
          const typeConfig = getEventTypeConfig(event.event_type);
          const eventColor = event.color || typeConfig.color;
          const eventIsToday = isToday(event.start_time);
          const eventIsTomorrow = isTomorrow(event.start_time);

          return (
            <TouchableOpacity
              key={event.id}
              onPress={() => handleEventPress(event)}
              style={[
                styles.eventCard,
                {
                  backgroundColor: colors.surface,
                  borderRadius: borderRadius.medium,
                  borderLeftWidth: 4,
                  borderLeftColor: eventColor,
                },
                index < Math.min(data.length, maxItems) - 1 && { marginBottom: 10 },
              ]}
            >
              {/* Header row */}
              <View style={styles.eventHeader}>
                <View style={[styles.eventIcon, { backgroundColor: `${eventColor}15` }]}>
                  <Icon name={event.icon || typeConfig.icon} size={20} color={eventColor} />
                </View>
                <View style={styles.eventHeaderContent}>
                  <View style={styles.titleRow}>
                    <AppText style={[styles.eventTitle, { color: colors.onSurface }]} numberOfLines={1}>
                      {getLocalizedField(event, "title")}
                    </AppText>
                    {(eventIsToday || eventIsTomorrow) && (
                      <View style={[styles.dayBadge, { backgroundColor: eventIsToday ? colors.error : colors.primary }]}>
                        <AppText style={styles.dayBadgeText}>
                          {eventIsToday ? "Today" : "Tomorrow"}
                        </AppText>
                      </View>
                    )}
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: `${eventColor}15` }]}>
                    <AppText style={{ color: eventColor, fontSize: 10, fontWeight: "600" }}>
                      {typeConfig.label}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* DateTime */}
              <View style={styles.dateTimeRow}>
                <Icon name="clock-outline" size={14} color={colors.onSurfaceVariant} />
                <AppText style={[styles.dateTimeText, { color: colors.onSurfaceVariant }]}>
                  {formatEventDateTime(event.start_time, event.end_time, event.all_day)}
                </AppText>
              </View>

              {/* Class/Location info */}
              {(event.class_name || event.location) && (
                <View style={styles.infoRow}>
                  {event.class_name && (
                    <View style={styles.infoItem}>
                      <Icon name="school" size={12} color={colors.onSurfaceVariant} />
                      <AppText style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                        {event.class_name}
                      </AppText>
                    </View>
                  )}
                  {event.location && (
                    <View style={styles.infoItem}>
                      <Icon name="map-marker" size={12} color={colors.onSurfaceVariant} />
                      <AppText style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                        {event.location}
                      </AppText>
                    </View>
                  )}
                </View>
              )}

              {/* Description preview */}
              {event.description_en && (
                <AppText
                  style={[styles.description, { color: colors.onSurfaceVariant }]}
                  numberOfLines={2}
                >
                  {getLocalizedField(event, "description")}
                </AppText>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* View all link */}
      {data.length > maxItems && (
        <TouchableOpacity
          onPress={() => (navigation as any).navigate("TeacherCalendar")}
          style={[styles.viewAllBtn, { borderColor: colors.outlineVariant }]}
        >
          <AppText style={{ color: colors.primary, fontWeight: "600" }}>
            {t("widgets.calendarEvents.viewAll", { defaultValue: `View All ${data.length} Events` })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
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
  filterScroll: {
    flexGrow: 0,
  },
  filterContainer: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  eventsList: {},
  eventCard: {
    padding: 14,
    gap: 10,
  },
  eventHeader: {
    flexDirection: "row",
    gap: 12,
  },
  eventIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  eventHeaderContent: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateTimeText: {
    fontSize: 13,
  },
  infoRow: {
    flexDirection: "row",
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
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
