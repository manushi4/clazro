/**
 * PlaylistDetailScreen - Detailed view of a playlist with materials
 * Purpose: View playlist contents, track progress, mark completion
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { T } from '../../ui';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { trackAction } from '../../utils/navigationAnalytics';

interface PlaylistMaterial {
  id: string;
  material_id: string;
  position: number;
  is_locked: boolean;
  teacher_notes?: string;
  material: {
    id: string;
    title: string;
    type: string;
    file_url?: string;
  };
  progress?: {
    completed: boolean;
    time_spent: number;
  };
}

interface PlaylistDetail {
  id: string;
  name: string;
  description?: string;
  type: 'personal' | 'assigned';
  priority?: string;
  sequential_order: boolean;
  created_at: string;
  assignment?: {
    due_date?: string;
    notes?: string;
    teacher_name: string;
  };
  items: PlaylistMaterial[];
}

export default function PlaylistDetailScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const playlistId = route.params?.playlistId;

  // Fetch playlist details with materials
  const { data: playlist, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ['playlist-detail', playlistId],
    queryFn: async () => {
      if (!playlistId) throw new Error('No playlist ID');

      console.log('📋 Fetching playlist:', playlistId);

      // Get playlist info
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (playlistError) {
        console.error('❌ Playlist query error:', playlistError);
        throw playlistError;
      }

      console.log('✅ Playlist data:', playlistData);

      // Get assignment info if assigned playlist
      let assignmentData = null;
      if (playlistData.type === 'assigned') {
        const { data: assignment, error: assignmentError } = await supabase
          .from('playlist_assignments')
          .select(`
            due_date,
            notes,
            teachers (
              first_name,
              last_name
            )
          `)
          .eq('playlist_id', playlistId)
          .eq('assigned_to_student', user?.id)
          .single();

        if (!assignmentError && assignment) {
          assignmentData = {
            due_date: assignment.due_date,
            notes: assignment.notes,
            teacher_name: assignment.teachers
              ? `${assignment.teachers.first_name} ${assignment.teachers.last_name}`
              : 'Teacher',
          };
        }
      }

      // Get playlist items with materials
      const { data: items, error: itemsError } = await supabase
        .from('playlist_items')
        .select(`
          id,
          material_id,
          position,
          is_locked,
          teacher_notes,
          study_materials (
            id,
            title,
            type,
            file_url
          )
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (itemsError) throw itemsError;

      // Get progress for each item (if assigned playlist)
      const itemsWithProgress = await Promise.all(
        (items || []).map(async (item: any) => {
          let progress = undefined;

          if (playlistData.type === 'assigned') {
            const { data: progressData } = await supabase
              .from('playlist_progress')
              .select('completed, time_spent')
              .eq('playlist_id', playlistId)
              .eq('student_id', user?.id)
              .eq('material_id', item.material_id)
              .single();

            progress = progressData || { completed: false, time_spent: 0 };
          }

          const materialData = {
            id: item.id,
            material_id: item.material_id,
            position: item.position,
            is_locked: item.is_locked,
            teacher_notes: item.teacher_notes,
            material: item.study_materials,
            progress,
          };

          console.log('📦 Material item:', materialData);
          return materialData;
        })
      );

      console.log('📋 Full playlist data:', {
        items: itemsWithProgress.length,
        sample: itemsWithProgress[0],
      });

      return {
        id: playlistData.id,
        name: playlistData.name,
        description: playlistData.description,
        type: playlistData.type,
        priority: playlistData.priority,
        sequential_order: playlistData.sequential_order,
        created_at: playlistData.created_at,
        assignment: assignmentData,
        items: itemsWithProgress,
      } as PlaylistDetail;
    },
    enabled: !!playlistId && !!user?.id,
  });

  // Toggle completion
  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ materialId, completed }: { materialId: string; completed: boolean }) => {
      if (!user?.id || !playlistId) return;

      if (completed) {
        // Mark as complete
        const { error } = await supabase
          .from('playlist_progress')
          .upsert({
            playlist_id: playlistId,
            student_id: user.id,
            material_id: materialId,
            completed: true,
            completed_at: new Date().toISOString(),
          });

        if (error) throw error;

        // Unlock next item if sequential
        if (playlist?.sequential_order) {
          const currentIndex = playlist.items.findIndex(i => i.material_id === materialId);
          const nextItem = playlist.items[currentIndex + 1];

          if (nextItem && nextItem.is_locked) {
            await supabase
              .from('playlist_items')
              .update({ is_locked: false })
              .eq('id', nextItem.id);
          }
        }
      } else {
        // Mark as incomplete
        const { error } = await supabase
          .from('playlist_progress')
          .upsert({
            playlist_id: playlistId,
            student_id: user.id,
            material_id: materialId,
            completed: false,
            completed_at: null,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-detail', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['all-playlists'] });
    },
  });

  // Remove item from personal playlist
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('playlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-detail', playlistId] });
    },
  });

  const handleMaterialPress = (item: PlaylistMaterial) => {
    if (item.is_locked) {
      Alert.alert(
        'Locked Material',
        'Complete the previous materials to unlock this one.'
      );
      return;
    }

    console.log('📱 Opening material:', {
      id: item.material_id,
      title: item.material.title,
      type: item.material.type,
      fileUrl: item.material.file_url,
      materialObject: item.material,
    });

    trackAction('open_material_from_playlist', 'PlaylistDetailScreen', {
      playlistId,
      materialId: item.material_id,
    });

    navigation.navigate('ResourceViewer', {
      resource: {
        id: item.material_id,
        title: item.material.title,
        type: item.material.type,
        fileUrl: item.material.file_url || '',
        subject: '', // Not needed for viewing
      },
    });
  };

  const handleToggleCompletion = (item: PlaylistMaterial) => {
    if (playlist?.type !== 'assigned') return;

    const isCompleted = item.progress?.completed || false;
    toggleCompletionMutation.mutate({
      materialId: item.material_id,
      completed: !isCompleted,
    });

    trackAction('toggle_material_completion', 'PlaylistDetailScreen', {
      playlistId,
      materialId: item.material_id,
      completed: !isCompleted,
    });
  };

  const handleRemoveItem = (item: PlaylistMaterial) => {
    Alert.alert(
      'Remove Material',
      `Remove "${item.material.title}" from this playlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItemMutation.mutate(item.id),
        },
      ]
    );
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

  const calculateProgress = () => {
    if (!playlist || playlist.type !== 'assigned') return 0;
    const completedCount = playlist.items.filter(i => i.progress?.completed).length;
    return playlist.items.length > 0
      ? Math.round((completedCount / playlist.items.length) * 100)
      : 0;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <T variant="body" style={styles.loadingText}>Loading playlist...</T>
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={styles.container}>
        <T variant="body" style={styles.errorText}>Playlist not found</T>
        {queryError && (
          <T variant="caption" style={styles.errorDetails}>
            {String(queryError)}
          </T>
        )}
      </View>
    );
  }

  const progress = calculateProgress();
  const dueDateInfo = playlist.assignment?.due_date
    ? formatDueDate(playlist.assignment.due_date)
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <T variant="h3" style={styles.backIcon}>←</T>
        </TouchableOpacity>
        <T variant="h3" style={styles.headerTitle}>Playlist Details</T>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Playlist Info */}
        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <T variant="h2" style={styles.playlistTitle}>{playlist.name}</T>
            {playlist.priority === 'mandatory' && (
              <View style={styles.mandatoryBadge}>
                <T variant="caption" style={styles.mandatoryText}>MANDATORY</T>
              </View>
            )}
          </View>

          {playlist.description && (
            <T variant="body" style={styles.description}>{playlist.description}</T>
          )}

          {/* Assigned playlist metadata */}
          {playlist.type === 'assigned' && playlist.assignment && (
            <>
              <View style={styles.metaRow}>
                <T variant="caption" style={styles.metaLabel}>Assigned by:</T>
                <T variant="caption" style={styles.metaValue}>
                  {playlist.assignment.teacher_name}
                </T>
              </View>

              {dueDateInfo && (
                <View style={styles.metaRow}>
                  <T variant="caption" style={styles.metaLabel}>Due date:</T>
                  <T
                    variant="caption"
                    style={[styles.metaValue, dueDateInfo.urgent && styles.dueDateUrgent]}
                  >
                    {dueDateInfo.urgent ? '🔴' : '🟢'} {dueDateInfo.text}
                  </T>
                </View>
              )}

              {playlist.assignment.notes && (
                <View style={styles.notesBox}>
                  <T variant="caption" style={styles.notesLabel}>Teacher Notes:</T>
                  <T variant="caption" style={styles.notesText}>
                    {playlist.assignment.notes}
                  </T>
                </View>
              )}

              {/* Progress */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <T variant="caption" style={styles.progressText}>
                  {progress}% complete ({playlist.items.filter(i => i.progress?.completed).length}/{playlist.items.length} materials)
                </T>
              </View>
            </>
          )}

          {/* Personal playlist metadata */}
          {playlist.type === 'personal' && (
            <T variant="caption" style={styles.itemCount}>
              {playlist.items.length} {playlist.items.length === 1 ? 'material' : 'materials'}
            </T>
          )}
        </View>

        {/* Materials List */}
        <View style={styles.materialsSection}>
          <T variant="h3" style={styles.sectionTitle}>Materials</T>

          {playlist.items.length > 0 ? (
            playlist.items.map((item, index) => {
              const isCompleted = item.progress?.completed || false;
              const isLocked = item.is_locked;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.materialCard,
                    isLocked && styles.materialCardLocked,
                    isCompleted && styles.materialCardCompleted,
                  ]}
                  onPress={() => handleMaterialPress(item)}
                  disabled={isLocked}
                  activeOpacity={0.7}
                >
                  {/* Position number */}
                  <View style={styles.positionBadge}>
                    <T variant="caption" style={styles.positionText}>{index + 1}</T>
                  </View>

                  {/* Material content */}
                  <View style={styles.materialContent}>
                    <T variant="body" weight="bold" style={styles.materialTitle}>
                      {item.material.title}
                    </T>

                    <View style={styles.materialMeta}>
                      <T variant="caption" style={styles.materialType}>
                        {item.material.type}
                      </T>
                    </View>

                    {item.teacher_notes && (
                      <View style={styles.teacherNotesBox}>
                        <T variant="caption" style={styles.teacherNotesText}>
                          📝 {item.teacher_notes}
                        </T>
                      </View>
                    )}

                    {isLocked && (
                      <View style={styles.lockedBadge}>
                        <T variant="caption" style={styles.lockedText}>
                          🔒 Complete previous materials to unlock
                        </T>
                      </View>
                    )}
                  </View>

                  {/* Action buttons */}
                  <View style={styles.materialActions}>
                    {playlist.type === 'assigned' && !isLocked && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleCompletion(item);
                        }}
                        style={styles.completionButton}
                      >
                        <T variant="h3" style={[styles.completionIcon, isCompleted && styles.completionIconActive]}>
                          {isCompleted ? '✓' : '○'}
                        </T>
                      </TouchableOpacity>
                    )}

                    {playlist.type === 'personal' && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(item);
                        }}
                        style={styles.removeButton}
                      >
                        <T variant="body" style={styles.removeIcon}>×</T>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <T variant="h3" style={styles.emptyIcon}>📚</T>
              <T variant="body" style={styles.emptyText}>No materials yet</T>
              <T variant="caption" style={styles.emptySubtext}>
                Add materials from the library
              </T>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 28,
    color: '#4A90E2',
  },
  headerTitle: {
    fontSize: 18,
    color: '#1F2937',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6B7280',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#EF4444',
  },
  errorDetails: {
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    color: '#6B7280',
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  playlistTitle: {
    fontSize: 22,
    color: '#1F2937',
    flex: 1,
  },
  mandatoryBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  mandatoryText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
  },
  metaValue: {
    fontSize: 13,
    color: '#1F2937',
  },
  dueDateUrgent: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  notesBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#78350F',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemCount: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  materialsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 12,
  },
  materialCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  materialCardLocked: {
    opacity: 0.6,
    backgroundColor: '#F3F4F6',
  },
  materialCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: 'bold',
  },
  materialContent: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 4,
  },
  materialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  materialType: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  materialDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  teacherNotesBox: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  teacherNotesText: {
    fontSize: 12,
    color: '#1E40AF',
  },
  lockedBadge: {
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  lockedText: {
    fontSize: 11,
    color: '#DC2626',
  },
  materialActions: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  completionButton: {
    padding: 8,
  },
  completionIcon: {
    fontSize: 28,
    color: '#D1D5DB',
  },
  completionIconActive: {
    color: '#10B981',
  },
  removeButton: {
    padding: 8,
  },
  removeIcon: {
    fontSize: 28,
    color: '#EF4444',
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
  },
});
