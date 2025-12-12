import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTeacherContactsQuery, TeacherContact } from "../../../hooks/queries/parent/useTeacherContactsQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.teacher-contacts";

export const ParentTeacherContactsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data, isLoading, error } = useTeacherContactsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = parseInt(config?.maxItems as string) || 5;
  const showClassTeacherFirst = config?.showClassTeacherFirst !== false;
  const showAvailability = config?.showAvailability !== false;
  const showSubject = config?.showSubject !== false;
  const showContactButtons = config?.showContactButtons !== false;
  const showOfficeHours = config?.showOfficeHours === true;
  const compactMode = config?.compactMode === true;
  const enableTap = config?.enableTap !== false;
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "compact") || "list";

  const getAvailabilityColor = (status: string): string => {
    if (status === 'available') return colors.success;
    if (status === 'busy') return colors.warning;
    return colors.onSurfaceVariant;
  };

  const getAvailabilityIcon = (status: string): string => {
    if (status === 'available') return 'check-circle';
    if (status === 'busy') return 'clock';
    return 'minus-circle';
  };

  const handleTeacherPress = (teacher: TeacherContact) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "teacher_tap", teacherId: teacher.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_teacher_tap`, level: "info", data: { teacherId: teacher.id } });
    onNavigate?.(`teacher/${teacher.id}`);
  };

  const handleCall = (teacher: TeacherContact) => {
    if (!teacher.phone) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "call", teacherId: teacher.id });
    Linking.openURL(`tel:${teacher.phone}`);
  };

  const handleEmail = (teacher: TeacherContact) => {
    if (!teacher.email) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "email", teacherId: teacher.id });
    Linking.openURL(`mailto:${teacher.email}`);
  };

  const handleMessage = (teacher: TeacherContact) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "message", teacherId: teacher.id });
    onNavigate?.(`compose-message?teacherId=${teacher.id}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("teacher-contacts");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.teacherContacts.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.teacherContacts.states.error")}
        </AppText>
      </View>
    );
  }

  if (!data || data.teachers.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="account-group-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.teacherContacts.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.teacherContacts.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  // Sort teachers: class teacher first if enabled
  let displayTeachers = [...data.teachers];
  if (showClassTeacherFirst) {
    displayTeachers.sort((a, b) => {
      if (a.is_class_teacher === b.is_class_teacher) return 0;
      return a.is_class_teacher ? -1 : 1;
    });
  }
  displayTeachers = displayTeachers.slice(0, maxItems);


  const renderListItem = (teacher: TeacherContact, index: number) => (
    <TouchableOpacity
      key={teacher.id}
      style={[
        styles.listItem, 
        { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
        teacher.is_class_teacher && { borderLeftWidth: 3, borderLeftColor: colors.primary }
      ]}
      onPress={() => handleTeacherPress(teacher)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      <View style={[styles.avatarWrapper, { backgroundColor: `${colors.primary}20` }]}>
        <Icon name="account" size={24} color={colors.primary} />
      </View>
      <View style={styles.contentWrapper}>
        <View style={styles.headerRow}>
          <AppText style={[styles.nameText, { color: colors.onSurface }]} numberOfLines={1}>
            {getLocalizedField(teacher, 'name')}
          </AppText>
          {showAvailability && (
            <View style={styles.availabilityRow}>
              <Icon 
                name={getAvailabilityIcon(teacher.availability_status)} 
                size={12} 
                color={getAvailabilityColor(teacher.availability_status)} 
              />
              <AppText style={[styles.availabilityText, { color: getAvailabilityColor(teacher.availability_status) }]}>
                {t(`widgets.teacherContacts.status.${teacher.availability_status}`)}
              </AppText>
            </View>
          )}
        </View>
        {showSubject && (
          <AppText style={[styles.subjectText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {getLocalizedField(teacher, 'subject')}
          </AppText>
        )}
        <View style={styles.metaRow}>
          {teacher.is_class_teacher && (
            <View style={[styles.classTeacherBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name="star" size={10} color={colors.primary} />
              <AppText style={[styles.badgeText, { color: colors.primary }]}>
                {t("widgets.teacherContacts.classTeacher")}
              </AppText>
            </View>
          )}
          {showOfficeHours && teacher.office_hours && (
            <AppText style={[styles.officeHoursText, { color: colors.onSurfaceVariant }]}>
              {teacher.office_hours}
            </AppText>
          )}
        </View>
      </View>
      {showContactButtons && (
        <View style={styles.contactButtons}>
          {teacher.phone && (
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: `${colors.success}15` }]} onPress={() => handleCall(teacher)}>
              <Icon name="phone" size={16} color={colors.success} />
            </TouchableOpacity>
          )}
          {teacher.email && (
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: `${colors.primary}15` }]} onPress={() => handleEmail(teacher)}>
              <Icon name="email" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: `${colors.secondary}15` }]} onPress={() => handleMessage(teacher)}>
            <Icon name="message-text" size={16} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCardItem = (teacher: TeacherContact, index: number) => (
    <TouchableOpacity
      key={teacher.id}
      style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
      onPress={() => handleTeacherPress(teacher)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      {teacher.is_class_teacher && (
        <View style={[styles.cardClassTeacherIndicator, { backgroundColor: colors.primary }]} />
      )}
      <View style={[styles.cardAvatarWrapper, { backgroundColor: `${colors.primary}20` }]}>
        <Icon name="account" size={28} color={colors.primary} />
      </View>
      {showAvailability && (
        <View style={[styles.cardAvailabilityDot, { backgroundColor: getAvailabilityColor(teacher.availability_status) }]} />
      )}
      <AppText style={[styles.cardName, { color: colors.onSurface }]} numberOfLines={1}>
        {getLocalizedField(teacher, 'name')}
      </AppText>
      {showSubject && (
        <AppText style={[styles.cardSubject, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          {getLocalizedField(teacher, 'subject')}
        </AppText>
      )}
      {showContactButtons && (
        <View style={styles.cardContactRow}>
          <TouchableOpacity onPress={() => handleMessage(teacher)}>
            <Icon name="message-text" size={18} color={colors.primary} />
          </TouchableOpacity>
          {teacher.phone && (
            <TouchableOpacity onPress={() => handleCall(teacher)}>
              <Icon name="phone" size={18} color={colors.success} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCompactItem = (teacher: TeacherContact, index: number) => (
    <TouchableOpacity
      key={teacher.id}
      style={[styles.compactItem, { borderBottomColor: colors.outline }]}
      onPress={() => handleTeacherPress(teacher)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      {showAvailability && (
        <View style={[styles.compactAvailabilityDot, { backgroundColor: getAvailabilityColor(teacher.availability_status) }]} />
      )}
      {teacher.is_class_teacher && (
        <Icon name="star" size={12} color={colors.primary} />
      )}
      <AppText style={[styles.compactName, { color: colors.onSurface }]} numberOfLines={1}>
        {getLocalizedField(teacher, 'name')}
      </AppText>
      {showSubject && (
        <AppText style={[styles.compactSubject, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          {getLocalizedField(teacher, 'subject')}
        </AppText>
      )}
      {showContactButtons && (
        <TouchableOpacity onPress={() => handleMessage(teacher)}>
          <Icon name="message-text" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      {/* Available Teachers Banner */}
      {showAvailability && data.available_count > 0 && (
        <View style={[styles.availableBanner, { backgroundColor: `${colors.success}10`, borderRadius: borderRadius.small }]}>
          <Icon name="check-circle" size={16} color={colors.success} />
          <AppText style={[styles.availableBannerText, { color: colors.success }]}>
            {t("widgets.teacherContacts.availableCount", { count: data.available_count })}
          </AppText>
        </View>
      )}

      {/* Teachers List */}
      {layoutStyle === "cards" ? (
        <View style={styles.cardsContainer}>
          {displayTeachers.map((teacher, index) => renderCardItem(teacher, index))}
        </View>
      ) : layoutStyle === "compact" ? (
        <View style={[styles.compactContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          {displayTeachers.map((teacher, index) => renderCompactItem(teacher, index))}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {displayTeachers.map((teacher, index) => renderListItem(teacher, index))}
        </View>
      )}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        {data.total_count > maxItems && enableTap && (
          <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>
              {t("widgets.teacherContacts.actions.viewAll", { count: data.total_count })}
            </AppText>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  // Loading/Error/Empty states
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySubtitle: { fontSize: 12, textAlign: "center" },
  // Available banner
  availableBanner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  availableBannerText: { fontSize: 13, fontWeight: "600" },
  // List layout
  listContainer: { gap: 10 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  avatarWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  contentWrapper: { flex: 1, gap: 2 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nameText: { fontSize: 14, fontWeight: "600", flex: 1 },
  availabilityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  availabilityText: { fontSize: 10, fontWeight: "500" },
  subjectText: { fontSize: 12 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 4, alignItems: "center" },
  classTeacherBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 },
  badgeText: { fontSize: 10, fontWeight: "500" },
  officeHoursText: { fontSize: 10 },
  contactButtons: { flexDirection: "row", gap: 8 },
  contactBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  // Cards layout
  cardsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardItem: { width: "48%", padding: 14, gap: 8, alignItems: "center", position: "relative" },
  cardClassTeacherIndicator: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  cardAvatarWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cardAvailabilityDot: { position: "absolute", top: 50, right: "38%", width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: "#fff" },
  cardName: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  cardSubject: { fontSize: 11, textAlign: "center" },
  cardContactRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  // Compact layout
  compactContainer: { padding: 8 },
  compactItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, gap: 10, borderBottomWidth: 1 },
  compactAvailabilityDot: { width: 6, height: 6, borderRadius: 3 },
  compactName: { flex: 1, fontSize: 13, fontWeight: "500" },
  compactSubject: { fontSize: 11 },
  // Actions
  actionsRow: { flexDirection: "row", justifyContent: "center" },
  viewAllButton: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
