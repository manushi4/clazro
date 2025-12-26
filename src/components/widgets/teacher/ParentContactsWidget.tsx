import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import {
  useParentContactsQuery,
  type ParentContact,
} from "../../../hooks/queries/teacher/useParentContactsQuery";

const getRelationIcon = (relation: string): string => {
  switch (relation) {
    case "father":
      return "face-man";
    case "mother":
      return "face-woman";
    case "guardian":
      return "account-supervisor";
    default:
      return "account";
  }
};

const getRelationLabel = (relation: string): string => {
  switch (relation) {
    case "father":
      return "Father";
    case "mother":
      return "Mother";
    case "guardian":
      return "Guardian";
    default:
      return "Parent";
  }
};

export const ParentContactsWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const [searchQuery, setSearchQuery] = useState("");

  const maxItems = (config?.maxItems as number) || 5;
  const showSearch = config?.showSearch !== false;

  const { data, isLoading, error, refetch } = useParentContactsQuery({
    limit: maxItems,
    searchQuery: searchQuery.length >= 2 ? searchQuery : undefined,
  });

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (contact: ParentContact) => {
    (navigation as any).navigate("ComposeMessage", {
      recipientId: contact.parent_id,
      recipientName: contact.parent_name,
      studentId: contact.student_id,
      studentName: contact.student_name,
    });
  };

  const handleContactPress = (contact: ParentContact) => {
    (navigation as any).navigate("ParentDetail", { parentId: contact.parent_id });
  };

  // Loading
  if (isLoading) {
    return (
      <View
        style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View
        style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}
      >
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.parentContacts.states.error", { defaultValue: "Failed to load contacts" })}
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
  if (!data?.length && !searchQuery) {
    return (
      <View
        style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}
      >
        <Icon name="account-group-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.parentContacts.states.empty", { defaultValue: "No parent contacts yet" })}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      {showSearch && (
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
          ]}
        >
          <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder={t("widgets.parentContacts.searchPlaceholder", {
              defaultValue: "Search by name...",
            })}
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close-circle" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* No results */}
      {searchQuery && !data?.length && (
        <View style={styles.noResults}>
          <Icon name="account-search-outline" size={32} color={colors.onSurfaceVariant} />
          <AppText style={{ color: colors.onSurfaceVariant }}>
            {t("widgets.parentContacts.noResults", { defaultValue: "No contacts found" })}
          </AppText>
        </View>
      )}

      {/* Contacts list */}
      <View style={styles.list}>
        {data?.map((contact, index) => (
          <TouchableOpacity
            key={contact.id}
            onPress={() => handleContactPress(contact)}
            style={[
              styles.contactItem,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.medium,
              },
              index < (data?.length || 0) - 1 && { marginBottom: 8 },
            ]}
          >
            {/* Avatar */}
            <View
              style={[
                styles.avatar,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Icon
                name={getRelationIcon(contact.relation)}
                size={22}
                color={colors.primary}
              />
            </View>

            {/* Info */}
            <View style={styles.contactInfo}>
              <AppText
                style={[styles.parentName, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {contact.parent_name}
              </AppText>
              <View style={styles.studentRow}>
                <Icon name="school" size={12} color={colors.onSurfaceVariant} />
                <AppText
                  style={[styles.studentName, { color: colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {contact.student_name}
                  {contact.student_class && ` - ${contact.student_class}`}
                </AppText>
              </View>
              <View style={styles.relationRow}>
                <AppText style={[styles.relationText, { color: colors.onSurfaceVariant }]}>
                  {getRelationLabel(contact.relation)}
                </AppText>
                {contact.last_contacted_at && (
                  <AppText style={[styles.lastContact, { color: colors.onSurfaceVariant }]}>
                    Last: {new Date(contact.last_contacted_at).toLocaleDateString()}
                  </AppText>
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {contact.parent_phone && (
                <TouchableOpacity
                  onPress={() => handleCall(contact.parent_phone!)}
                  style={[styles.actionBtn, { backgroundColor: `${colors.tertiary || "#4CAF50"}15` }]}
                >
                  <Icon name="phone" size={18} color={colors.tertiary || "#4CAF50"} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleMessage(contact)}
                style={[styles.actionBtn, { backgroundColor: `${colors.primary}15` }]}
              >
                <Icon name="message-text" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* View all */}
      <TouchableOpacity
        onPress={() => (navigation as any).navigate("ParentContactsList")}
        style={[styles.viewAllBtn, { borderColor: colors.outlineVariant }]}
      >
        <AppText style={{ color: colors.primary, fontWeight: "600" }}>
          {t("widgets.parentContacts.viewAll", { defaultValue: "View All Contacts" })}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  noResults: {
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  list: {},
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  parentName: {
    fontSize: 14,
    fontWeight: "600",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  studentName: {
    fontSize: 12,
  },
  relationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  relationText: {
    fontSize: 11,
    fontStyle: "italic",
  },
  lastContact: {
    fontSize: 10,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
