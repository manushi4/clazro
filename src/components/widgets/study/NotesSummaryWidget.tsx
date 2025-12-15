/**
 * Notes Summary Widget (notes.summary)
 * Shows total notes count, recent notes, and pinned notes
 * Follows Widget Development Guide phases 1-7
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useNotesSummaryQuery, type StudentNote } from "../../../hooks/queries/useNotesSummaryQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "notes.summary";

export const NotesSummaryWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useNotesSummaryQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options with defaults
  const maxNotes = (config?.maxNotes as number) || (size === "compact" ? 3 : 5);
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const showPinned = config?.showPinned !== false;
  const showWordCount = config?.showWordCount !== false;
  const showTags = config?.showTags !== false && size !== "compact";
  const showStats = config?.showStats !== false;
  const enableTap = config?.enableTap !== false;

  // Color mapping using theme colors
  const getNoteColor = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    };
    return colorMap[colorKey] || colors.primary;
  };

  // Event handlers
  const handleNotePress = (note: StudentNote) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "note_tap", noteId: note.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_note_tap`, level: "info", data: { noteId: note.id } });
    onNavigate?.(`note-detail/${note.id}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("notes");
  };

  const handleAddNote = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "add_note" });
    onNavigate?.("note-create");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.notesSummary.states.loading")}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>
          {t("widgets.notesSummary.states.error")}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
          onPress={() => refetch()}
        >
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.notesSummary.actions.retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.totalNotes === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="note-off-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.notesSummary.states.empty")}
        </AppText>
        {enableTap && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
            onPress={handleAddNote}
          >
            <Icon name="plus" size={16} color={colors.onPrimary} />
            <AppText style={[styles.addButtonText, { color: colors.onPrimary }]}>
              {t("widgets.notesSummary.actions.addNote")}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const displayNotes = showPinned && data.pinnedNotes.length > 0 
    ? [...data.pinnedNotes, ...data.recentNotes.filter(n => !n.is_pinned)].slice(0, maxNotes)
    : data.recentNotes.slice(0, maxNotes);

  // Render note item
  const renderNoteItem = (note: StudentNote, index: number) => {
    const noteColor = getNoteColor(note.color);

    return (
      <TouchableOpacity
        key={note.id}
        style={[
          layoutStyle === "grid" ? styles.gridItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
        ]}
        onPress={enableTap ? () => handleNotePress(note) : undefined}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={[styles.colorIndicator, { backgroundColor: noteColor }]} />
        <View style={styles.noteContent}>
          <View style={styles.noteHeader}>
            <AppText 
              style={[styles.noteTitle, { color: colors.onSurface }]} 
              numberOfLines={1}
            >
              {getLocalizedField(note, "title")}
            </AppText>
            {note.is_pinned && (
              <Icon name="pin" size={14} color={colors.primary} />
            )}
          </View>
          {showTags && note.tags && note.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {note.tags.slice(0, 2).map((tag, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: `${noteColor}20` }]}>
                  <AppText style={[styles.tagText, { color: noteColor }]}>{tag}</AppText>
                </View>
              ))}
              {note.tags.length > 2 && (
                <AppText style={[styles.moreTagsText, { color: colors.onSurfaceVariant }]}>
                  +{note.tags.length - 2}
                </AppText>
              )}
            </View>
          )}
          {showWordCount && (
            <AppText style={[styles.wordCount, { color: colors.onSurfaceVariant }]}>
              {t("widgets.notesSummary.labels.words", { count: note.word_count })}
            </AppText>
          )}
        </View>
        <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats Banner */}
      {showStats && (
        <View style={[styles.statsBanner, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <View style={styles.statItem}>
            <Icon name="note-multiple" size={20} color={colors.primary} />
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>{data.totalNotes}</AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.notesSummary.labels.totalNotes")}
            </AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.statItem}>
            <Icon name="text" size={20} color={colors.secondary} />
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {data.totalWords > 1000 ? `${(data.totalWords / 1000).toFixed(1)}k` : data.totalWords}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.notesSummary.labels.totalWords")}
            </AppText>
          </View>
          {data.pinnedNotes.length > 0 && (
            <>
              <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
              <View style={styles.statItem}>
                <Icon name="pin" size={20} color={colors.warning} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>{data.pinnedNotes.length}</AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.notesSummary.labels.pinned")}
                </AppText>
              </View>
            </>
          )}
        </View>
      )}

      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBar, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <Icon name="cloud-off-outline" size={14} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline")}
          </AppText>
        </View>
      )}

      {/* List Layout */}
      {layoutStyle === "list" && (
        <View style={styles.listContainer}>
          {displayNotes.map((note, index) => renderNoteItem(note, index))}
        </View>
      )}

      {/* Grid Layout */}
      {layoutStyle === "grid" && (
        <View style={styles.gridContainer}>
          {displayNotes.map((note, index) => renderNoteItem(note, index))}
        </View>
      )}

      {/* Cards Layout - Horizontal Scroll */}
      {layoutStyle === "cards" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {displayNotes.map((note, index) => {
            const noteColor = getNoteColor(note.color);
            return (
              <TouchableOpacity
                key={note.id}
                style={[
                  styles.cardItem,
                  { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
                ]}
                onPress={enableTap ? () => handleNotePress(note) : undefined}
                disabled={!enableTap}
                activeOpacity={0.7}
              >
                <View style={[styles.cardColorBar, { backgroundColor: noteColor }]} />
                <View style={styles.cardHeader}>
                  <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
                    {getLocalizedField(note, "title")}
                  </AppText>
                  {note.is_pinned && <Icon name="pin" size={12} color={colors.primary} />}
                </View>
                {showWordCount && (
                  <AppText style={[styles.cardWordCount, { color: colors.onSurfaceVariant }]}>
                    {t("widgets.notesSummary.labels.words", { count: note.word_count })}
                  </AppText>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* View All / Add Note Buttons */}
      <View style={styles.actionsRow}>
        {enableTap && data.totalNotes > maxNotes && (
          <TouchableOpacity
            style={[styles.viewAllButton, { borderColor: colors.outline }]}
            onPress={handleViewAll}
            activeOpacity={0.7}
          >
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>
              {t("widgets.notesSummary.actions.viewAll", { count: data.totalNotes })}
            </AppText>
            <Icon name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
        {enableTap && (
          <TouchableOpacity
            style={[styles.addNoteButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
            onPress={handleAddNote}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  centerContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { fontSize: 13, marginTop: 8, textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  addButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12 },
  addButtonText: { fontSize: 13, fontWeight: "600" },

  // Stats banner
  statsBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", padding: 12 },
  statItem: { alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 10 },
  statDivider: { width: 1, height: 36 },

  // Offline indicator
  offlineBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  offlineText: { fontSize: 11 },

  // List layout
  listContainer: { gap: 8 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10, overflow: "hidden" },
  colorIndicator: { width: 4, height: "100%", borderRadius: 2, position: "absolute", left: 0, top: 0, bottom: 0 },
  noteContent: { flex: 1, paddingLeft: 8, gap: 4 },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  noteTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  tagsContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: "500" },
  moreTagsText: { fontSize: 10 },
  wordCount: { fontSize: 11 },

  // Grid layout
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "48%", padding: 12, gap: 8, overflow: "hidden" },

  // Cards layout
  cardsContainer: { gap: 12, paddingRight: 4 },
  cardItem: { width: 140, padding: 12, gap: 8, overflow: "hidden" },
  cardColorBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 4, marginTop: 4 },
  cardTitle: { fontSize: 12, fontWeight: "600", flex: 1 },
  cardWordCount: { fontSize: 10 },

  // Actions row
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  viewAllButton: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center", paddingVertical: 10, borderTopWidth: 1 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
  addNoteButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginLeft: 8 },
});
