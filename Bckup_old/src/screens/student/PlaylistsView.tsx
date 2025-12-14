/**
 * PlaylistsView - View for displaying student's playlists
 * Purpose: Show both assigned playlists (from teachers) and personal playlists
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { T } from '../../ui';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { trackAction } from '../../utils/navigationAnalytics';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  type: 'personal' | 'assigned';
  priority?: string;
  created_at: string;
  items_count: number;
  assigned_by_teacher?: string;
  due_date?: string;
  progress?: number;
}

export default function PlaylistsView() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'assigned' | 'personal'>('assigned');

  // Fetch all playlists
  const { data: playlists, isLoading, refetch } = useQuery({
    queryKey: ['all-playlists', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get personal playlists
      const { data: personalPlaylists, error: personalError } = await supabase
        .from('playlists')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('type', 'personal')
        .order('created_at', { ascending: false });

      if (personalError) throw personalError;

      // Get assigned playlists
      const { data: assignments, error: assignmentsError } = await supabase
        .from('playlist_assignments')
        .select(`
          id,
          due_date,
          notes,
          playlists (
            id,
            name,
            description,
            priority,
            created_at
          ),
          teachers (
            first_name,
            last_name
          )
        `)
        .eq('assigned_to_student', user.id);

      if (assignmentsError) throw assignmentsError;

      // Get item counts for all playlists
      const allPlaylistIds = [
        ...(personalPlaylists || []).map(p => p.id),
        ...(assignments || []).map(a => a.playlists?.id).filter(Boolean),
      ];

      const playlistsWithCounts = await Promise.all([
        // Personal playlists
        ...((personalPlaylists || []).map(async (playlist) => {
          const { count } = await supabase
            .from('playlist_items')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlist.id);

          return {
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            type: 'personal' as const,
            created_at: playlist.created_at,
            items_count: count || 0,
          };
        })),
        // Assigned playlists
        ...((assignments || []).map(async (assignment) => {
          if (!assignment.playlists) return null;

          const { count } = await supabase
            .from('playlist_items')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', assignment.playlists.id);

          // Calculate progress
          const { data: progressData } = await supabase
            .from('playlist_progress')
            .select('completed')
            .eq('playlist_id', assignment.playlists.id)
            .eq('student_id', user.id);

          const completedCount = progressData?.filter(p => p.completed).length || 0;
          const totalCount = count || 0;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return {
            id: assignment.playlists.id,
            name: assignment.playlists.name,
            description: assignment.playlists.description,
            type: 'assigned' as const,
            priority: assignment.playlists.priority,
            created_at: assignment.playlists.created_at,
            items_count: count || 0,
            assigned_by_teacher: assignment.teachers ? `${assignment.teachers.first_name} ${assignment.teachers.last_name}` : 'Teacher',
            due_date: assignment.due_date,
            progress,
          };
        })),
      ]);

      return playlistsWithCounts.filter(Boolean) as Playlist[];
    },
    enabled: !!user?.id,
  });

  const assignedPlaylists = playlists?.filter(p => p.type === 'assigned') || [];
  const personalPlaylists = playlists?.filter(p => p.type === 'personal') || [];

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const formatDueDate = (dateString: string): { text: string; urgent: boolean } => {
    const now = new Date();
    const due = new Date(dateString);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue!', urgent: true };
    if (diffDays === 0) return { text: 'Due today', urgent: true };
    if (diffDays === 1) return { text: 'Due tomorrow', urgent: true };
    if (diffDays < 7) return { text: `Due in ${diffDays} days`, urgent: true };
    return { text: `Due in ${Math.ceil(diffDays / 7)} weeks`, urgent: false };
  };

  const handleCreatePlaylist = () => {
    Alert.prompt(
      'Create Playlist',
      'Enter playlist name',
      async (name) => {
        if (!name || !name.trim()) return;

        try {
          const { error } = await supabase.from('playlists').insert({
            created_by_user_id: user?.id,
            created_by_role: 'student',
            name: name.trim(),
            type: 'personal',
          });

          if (error) throw error;

          refetch();
          trackAction('create_playlist', 'PlaylistsView', { name });
        } catch (error) {
          console.error('Failed to create playlist:', error);
          Alert.alert('Error', 'Failed to create playlist');
        }
      }
    );
  };

  const handlePlaylistPress = (playlistId: string) => {
    trackAction('open_playlist', 'PlaylistsView', { playlistId });
    navigation.navigate('PlaylistDetail', { playlistId });
  };

  return (
    <View style={styles.container}>
      {/* Sub-tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assigned' && styles.tabActive]}
          onPress={() => setActiveTab('assigned')}
        >
          <T
            variant="body"
            weight="medium"
            style={activeTab === 'assigned' ? styles.tabTextActive : styles.tabTextInactive}
          >
            Assigned
          </T>
          {assignedPlaylists.length > 0 && (
            <View style={styles.badge}>
              <T variant="caption" style={styles.badgeText}>{assignedPlaylists.length}</T>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.tabActive]}
          onPress={() => setActiveTab('personal')}
        >
          <T
            variant="body"
            weight="medium"
            style={activeTab === 'personal' ? styles.tabTextActive : styles.tabTextInactive}
          >
            My Playlists
          </T>
          {personalPlaylists.length > 0 && (
            <View style={styles.badge}>
              <T variant="caption" style={styles.badgeText}>{personalPlaylists.length}</T>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Assigned Playlists */}
        {activeTab === 'assigned' && (
          <View style={styles.section}>
            {assignedPlaylists.length > 0 ? (
              assignedPlaylists.map((playlist) => {
                const dueDateInfo = playlist.due_date ? formatDueDate(playlist.due_date) : null;

                return (
                  <TouchableOpacity
                    key={playlist.id}
                    style={styles.playlistCard}
                    onPress={() => handlePlaylistPress(playlist.id)}
                    activeOpacity={0.7}
                  >
                    {/* Header with priority indicator */}
                    <View style={styles.cardHeader}>
                      <View style={styles.titleRow}>
                        <T variant="body" weight="bold" style={styles.playlistTitle}>
                          {playlist.name}
                        </T>
                        {playlist.priority === 'mandatory' && (
                          <View style={styles.mandatoryBadge}>
                            <T variant="caption" style={styles.mandatoryText}>MANDATORY</T>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Teacher info */}
                    <View style={styles.metaRow}>
                      <T variant="caption" style={styles.teacherText}>
                        📌 Assigned by: {playlist.assigned_by_teacher}
                      </T>
                    </View>

                    {/* Due date */}
                    {dueDateInfo && (
                      <View style={styles.metaRow}>
                        <T
                          variant="caption"
                          style={[styles.dueDate, dueDateInfo.urgent && styles.dueDateUrgent]}
                        >
                          {dueDateInfo.urgent ? '🔴' : '🟢'} {dueDateInfo.text}
                        </T>
                      </View>
                    )}

                    {/* Progress bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${playlist.progress}%` }]} />
                      </View>
                      <T variant="caption" style={styles.progressText}>
                        {playlist.progress}% complete
                      </T>
                    </View>

                    {/* Items count */}
                    <T variant="caption" style={styles.itemsCount}>
                      {playlist.items_count} {playlist.items_count === 1 ? 'material' : 'materials'}
                    </T>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <T variant="h3" style={styles.emptyIcon}>📚</T>
                <T variant="body" style={styles.emptyText}>No assigned playlists</T>
                <T variant="caption" style={styles.emptySubtext}>
                  Your teacher hasn't assigned any playlists yet
                </T>
              </View>
            )}
          </View>
        )}

        {/* Personal Playlists */}
        {activeTab === 'personal' && (
          <View style={styles.section}>
            {/* Create button */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreatePlaylist}
            >
              <T variant="body" weight="bold" style={styles.createButtonText}>
                + Create New Playlist
              </T>
            </TouchableOpacity>

            {personalPlaylists.length > 0 ? (
              personalPlaylists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={styles.playlistCard}
                  onPress={() => handlePlaylistPress(playlist.id)}
                  activeOpacity={0.7}
                >
                  <T variant="body" weight="bold" style={styles.playlistTitle}>
                    {playlist.name}
                  </T>

                  <View style={styles.personalMeta}>
                    <T variant="caption" style={styles.metaText}>
                      {playlist.items_count} {playlist.items_count === 1 ? 'item' : 'items'}
                    </T>
                    <T variant="caption" style={styles.metaText}>•</T>
                    <T variant="caption" style={styles.metaText}>
                      Created {formatTimeAgo(playlist.created_at)}
                    </T>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <T variant="h3" style={styles.emptyIcon}>📂</T>
                <T variant="body" style={styles.emptyText}>No playlists yet</T>
                <T variant="caption" style={styles.emptySubtext}>
                  Create your first playlist to organize study materials
                </T>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4A90E2',
  },
  tabTextActive: {
    fontSize: 16,
    color: '#4A90E2',
  },
  tabTextInactive: {
    fontSize: 16,
    color: '#6B7280',
  },
  badge: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  playlistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playlistTitle: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  mandatoryBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  mandatoryText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  metaRow: {
    marginBottom: 4,
  },
  teacherText: {
    fontSize: 13,
    color: '#6B7280',
  },
  dueDate: {
    fontSize: 13,
    color: '#10B981',
  },
  dueDateUrgent: {
    color: '#EF4444',
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemsCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  personalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
