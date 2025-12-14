/**
 * AddToPlaylistModal - Modal for adding study materials to playlists
 * Purpose: Allow students to add materials to existing playlists or create new ones
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { T } from '../../ui';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { trackAction } from '../../utils/navigationAnalytics';

interface AddToPlaylistModalProps {
  visible: boolean;
  materialId: string | null;
  materialTitle: string;
  onClose: () => void;
}

interface Playlist {
  id: string;
  name: string;
  items_count: number;
  has_material: boolean;
}

export default function AddToPlaylistModal({
  visible,
  materialId,
  materialTitle,
  onClose,
}: AddToPlaylistModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Fetch user's playlists
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['user-playlists', user?.id, materialId],
    queryFn: async () => {
      if (!user?.id || !materialId) return [];

      // Get user's playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('id, name')
        .eq('created_by_user_id', user.id)
        .eq('type', 'personal')
        .order('created_at', { ascending: false });

      if (playlistsError) throw playlistsError;

      // Get count of items in each playlist and check if material is already added
      const playlistsWithInfo = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          // Get total items count
          const { count } = await supabase
            .from('playlist_items')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlist.id);

          // Check if this material is already in this playlist
          const { data: existingItem } = await supabase
            .from('playlist_items')
            .select('id')
            .eq('playlist_id', playlist.id)
            .eq('material_id', materialId)
            .single();

          return {
            id: playlist.id,
            name: playlist.name,
            items_count: count || 0,
            has_material: !!existingItem,
          };
        })
      );

      return playlistsWithInfo as Playlist[];
    },
    enabled: visible && !!user?.id && !!materialId,
  });

  // Toggle material in playlist
  const toggleMutation = useMutation({
    mutationFn: async ({ playlistId, add }: { playlistId: string; add: boolean }) => {
      if (!materialId) return;

      if (add) {
        // Add to playlist
        const { data: items } = await supabase
          .from('playlist_items')
          .select('position')
          .eq('playlist_id', playlistId)
          .order('position', { ascending: false })
          .limit(1);

        const nextPosition = items && items.length > 0 ? items[0].position + 1 : 0;

        const { error } = await supabase.from('playlist_items').insert({
          playlist_id: playlistId,
          material_id: materialId,
          position: nextPosition,
        });

        if (error) throw error;
      } else {
        // Remove from playlist
        const { error } = await supabase
          .from('playlist_items')
          .delete()
          .eq('playlist_id', playlistId)
          .eq('material_id', materialId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] });
    },
  });

  // Create new playlist
  const createPlaylistMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) return;

      // Create playlist
      const { data: playlist, error: createError } = await supabase
        .from('playlists')
        .insert({
          created_by_user_id: user.id,
          created_by_role: 'student',
          name: name,
          type: 'personal',
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add material to new playlist
      if (materialId && playlist) {
        const { error: addError } = await supabase.from('playlist_items').insert({
          playlist_id: playlist.id,
          material_id: materialId,
          position: 0,
        });

        if (addError) throw addError;
      }

      return playlist;
    },
    onSuccess: () => {
      setNewPlaylistName('');
      setShowCreateNew(false);
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] });
      trackAction('create_playlist', 'AddToPlaylistModal', { from: 'modal' });
    },
  });

  const handleToggle = (playlistId: string, currentlyHas: boolean) => {
    toggleMutation.mutate({ playlistId, add: !currentlyHas });
    trackAction('toggle_playlist_item', 'AddToPlaylistModal', {
      playlistId,
      materialId,
      action: currentlyHas ? 'remove' : 'add',
    });
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    createPlaylistMutation.mutate(newPlaylistName.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <T variant="h3" style={styles.title}>Add to Playlist</T>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <T variant="h3" style={styles.closeIcon}>×</T>
            </TouchableOpacity>
          </View>

          {/* Material Name */}
          <View style={styles.materialInfo}>
            <T variant="caption" style={styles.materialLabel}>Adding:</T>
            <T variant="body" weight="bold" style={styles.materialTitle} numberOfLines={1}>
              {materialTitle}
            </T>
          </View>

          {/* Playlists List */}
          <ScrollView style={styles.playlistsList}>
            {isLoading ? (
              <T variant="body" style={styles.loadingText}>Loading playlists...</T>
            ) : playlists && playlists.length > 0 ? (
              playlists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={styles.playlistItem}
                  onPress={() => handleToggle(playlist.id, playlist.has_material)}
                >
                  <View style={styles.checkbox}>
                    {playlist.has_material && (
                      <T variant="body" style={styles.checkmark}>✓</T>
                    )}
                  </View>
                  <View style={styles.playlistInfo}>
                    <T variant="body" weight="medium" style={styles.playlistName}>
                      {playlist.name}
                    </T>
                    <T variant="caption" style={styles.playlistCount}>
                      {playlist.items_count} {playlist.items_count === 1 ? 'item' : 'items'}
                    </T>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <T variant="body" style={styles.emptyText}>
                  No playlists yet
                </T>
                <T variant="caption" style={styles.emptySubtext}>
                  Create your first playlist below
                </T>
              </View>
            )}
          </ScrollView>

          {/* Create New Playlist */}
          {!showCreateNew ? (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateNew(true)}
            >
              <T variant="body" weight="bold" style={styles.createButtonText}>
                + Create New Playlist
              </T>
            </TouchableOpacity>
          ) : (
            <View style={styles.createForm}>
              <TextInput
                style={styles.input}
                placeholder="Playlist name"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />
              <View style={styles.createActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCreateNew(false);
                    setNewPlaylistName('');
                  }}
                >
                  <T variant="caption" style={styles.cancelButtonText}>Cancel</T>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCreatePlaylist}
                  disabled={createPlaylistMutation.isPending}
                >
                  <T variant="caption" weight="bold" style={styles.saveButtonText}>
                    {createPlaylistMutation.isPending ? 'Creating...' : 'Create'}
                  </T>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 32,
    color: '#6B7280',
  },
  materialInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  materialLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  materialTitle: {
    fontSize: 16,
    color: '#1F2937',
  },
  playlistsList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 20,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    fontSize: 16,
    color: '#4A90E2',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  playlistCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  createForm: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
