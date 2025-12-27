import React from "react";
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
import { AppText } from "../../../ui/components/AppText";
import {
  useTeacherMessagesQuery,
  type TeacherMessage,
} from "../../../hooks/queries/teacher/useTeacherMessagesQuery";

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getRoleIcon = (role: string): string => {
  switch (role) {
    case "parent":
      return "account-child";
    case "student":
      return "school";
    case "admin":
      return "shield-account";
    default:
      return "account";
  }
};

const getRoleColor = (role: string, colors: any): string => {
  switch (role) {
    case "parent":
      return "#9C27B0";
    case "student":
      return "#2196F3";
    case "admin":
      return "#FF5722";
    default:
      return colors.primary;
  }
};

export const MessagesInboxWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  const maxItems = (config?.maxItems as number) || 5;
  const showUnreadBadge = config?.showUnreadBadge !== false;

  const { data, isLoading, error, refetch } = useTeacherMessagesQuery({
    limit: maxItems,
  });

  const unreadCount = data?.filter((m) => !m.is_read).length || 0;

  const handleMessagePress = (message: TeacherMessage) => {
    (navigation as any).navigate("MessageDetail", { messageId: message.id });
  };

  const handleComposePress = () => {
    (navigation as any).navigate("ComposeMessage");
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
          {t("widgets.messagesInbox.states.error", { defaultValue: "Failed to load messages" })}
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
      <View
        style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}
      >
        <Icon name="email-open-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("widgets.messagesInbox.states.empty", { defaultValue: "No messages yet" })}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with unread badge */}
      {showUnreadBadge && unreadCount > 0 && (
        <View style={styles.header}>
          <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
            <AppText style={styles.unreadText}>{unreadCount} unread</AppText>
          </View>
          <TouchableOpacity onPress={handleComposePress}>
            <Icon name="pencil-plus" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages list */}
      <View style={styles.messagesList}>
        {data.map((message, index) => (
          <TouchableOpacity
            key={message.id}
            onPress={() => handleMessagePress(message)}
            style={[
              styles.messageItem,
              {
                backgroundColor: message.is_read
                  ? colors.surface
                  : `${colors.primary}08`,
                borderRadius: borderRadius.medium,
                borderLeftWidth: message.is_read ? 0 : 3,
                borderLeftColor: colors.primary,
              },
              index < data.length - 1 && { marginBottom: 8 },
            ]}
          >
            {/* Avatar */}
            <View
              style={[
                styles.avatar,
                { backgroundColor: `${getRoleColor(message.sender_role, colors)}15` },
              ]}
            >
              <Icon
                name={getRoleIcon(message.sender_role)}
                size={20}
                color={getRoleColor(message.sender_role, colors)}
              />
            </View>

            {/* Content */}
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <AppText
                  style={[
                    styles.senderName,
                    { color: colors.onSurface },
                    !message.is_read && { fontWeight: "700" },
                  ]}
                  numberOfLines={1}
                >
                  {message.sender_name}
                </AppText>
                <AppText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                  {formatTimeAgo(message.created_at)}
                </AppText>
              </View>

              {message.student_name && (
                <AppText
                  style={[styles.studentName, { color: colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  Re: {message.student_name}
                </AppText>
              )}

              <AppText
                style={[
                  styles.subject,
                  { color: colors.onSurface },
                  !message.is_read && { fontWeight: "600" },
                ]}
                numberOfLines={1}
              >
                {message.subject}
              </AppText>

              <AppText
                style={[styles.preview, { color: colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {message.preview}
              </AppText>
            </View>

            {/* Unread indicator */}
            {!message.is_read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* View all button */}
      <TouchableOpacity
        onPress={() => (navigation as any).navigate("MessagesInbox")}
        style={[styles.viewAllBtn, { borderColor: colors.outlineVariant }]}
      >
        <AppText style={{ color: colors.primary, fontWeight: "600" }}>
          {t("widgets.messagesInbox.viewAll", { defaultValue: "View All Messages" })}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unreadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  messagesList: {},
  messageItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  messageContent: {
    flex: 1,
    gap: 2,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  senderName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  timeText: {
    fontSize: 11,
  },
  studentName: {
    fontSize: 11,
    fontStyle: "italic",
  },
  subject: {
    fontSize: 13,
    marginTop: 2,
  },
  preview: {
    fontSize: 12,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
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
