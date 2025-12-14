/**
 * ClassNotes - Premium Minimal Design
 * Purpose: Take and save notes during live classes
 * Used in: StudentNavigator (ClassesStack) - from NewEnhancedLiveClass
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card } from '../../ui/surfaces/Card';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'ClassNotes'>;

interface ClassNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function ClassNotes({ route, navigation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const classId = route.params?.classId;
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  React.useEffect(() => {
    trackScreenView('ClassNotes', { classId });
  }, [classId]);

  // Fetch saved notes
  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['class-notes', classId, user?.id],
    queryFn: async () => {
      if (!classId || !user?.id) throw new Error('Missing class or user ID');

      const { data, error } = await supabase
        .from('class_notes')
        .select('*')
        .eq('class_id', classId)
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((note) => ({
        id: note.id,
        title: note.title || 'Untitled Note',
        content: note.content || '',
        created_at: note.created_at,
        updated_at: note.updated_at,
      })) as ClassNote[];
    },
    enabled: !!classId && !!user?.id,
  });

  // Save/Update note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!classId || !user?.id) throw new Error('Missing class or user ID');

      if (selectedNoteId) {
        // Update existing note
        const { data, error } = await supabase
          .from('class_notes')
          .update({
            title,
            content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedNoteId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('class_notes')
          .insert({
            class_id: classId,
            student_id: user.id,
            title,
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-notes', classId, user?.id] });
      setNoteTitle('');
      setNoteContent('');
      setIsEditing(false);
      setSelectedNoteId(null);
      Alert.alert('Success', 'Note saved successfully');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('class_notes').delete().eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-notes', classId, user?.id] });
      Alert.alert('Deleted', 'Note deleted successfully');
    },
  });

  const handleSave = useCallback(() => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert('Error', 'Please enter both title and content');
      return;
    }

    trackAction('save_note', 'ClassNotes', {
      classId,
      isUpdate: !!selectedNoteId,
      contentLength: noteContent.length,
    });

    saveNoteMutation.mutate({ title: noteTitle.trim(), content: noteContent.trim() });
  }, [noteTitle, noteContent, classId, selectedNoteId, saveNoteMutation]);

  const handleNoteSelect = (note: ClassNote) => {
    trackAction('select_note', 'ClassNotes', { classId, noteId: note.id });
    setSelectedNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setIsEditing(true);
  };

  const handleNewNote = () => {
    trackAction('new_note', 'ClassNotes', { classId });
    setSelectedNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setIsEditing(true);
  };

  const handleDelete = (noteId: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          trackAction('delete_note', 'ClassNotes', { classId, noteId });
          deleteNoteMutation.mutate(noteId);
          if (selectedNoteId === noteId) {
            setSelectedNoteId(null);
            setNoteTitle('');
            setNoteContent('');
            setIsEditing(false);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <BaseScreen scrollable={false} loading={isLoading} error={error ? 'Failed to load notes' : null}>
      <View style={styles.container}>
        {!isEditing ? (
          // Notes List View
          <>
            <View style={styles.header}>
              <T variant="h2" weight="bold">
                Class Notes
              </T>
              <TouchableOpacity
                style={styles.newButton}
                onPress={handleNewNote}
                accessibilityRole="button"
                accessibilityLabel="Create new note"
              >
                <T variant="body" weight="semiBold" style={styles.newButtonText}>
                  ➕ New Note
                </T>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notesList} showsVerticalScrollIndicator={false}>
              {notes && notes.length > 0 ? (
                notes.map((note) => (
                  <Card key={note.id} style={styles.noteCard}>
                    <TouchableOpacity onPress={() => handleNoteSelect(note)}>
                      <T variant="title" weight="semiBold" style={styles.noteTitle}>
                        {note.title}
                      </T>
                      <T variant="body" style={styles.notePreview} numberOfLines={2}>
                        {note.content}
                      </T>
                      <View style={styles.noteFooter}>
                        <T variant="caption" style={styles.noteDate}>
                          {formatDate(note.updated_at)}
                        </T>
                        <TouchableOpacity
                          onPress={() => handleDelete(note.id)}
                          accessibilityRole="button"
                          accessibilityLabel="Delete note"
                        >
                          <T variant="caption" style={styles.deleteButton}>
                            🗑️ Delete
                          </T>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Card>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <T variant="h1">📝</T>
                  <T variant="title" weight="semiBold" style={styles.emptyTitle}>
                    No Notes Yet
                  </T>
                  <T variant="body" style={styles.emptyText}>
                    Create your first note to start taking class notes
                  </T>
                </View>
              )}
            </ScrollView>
          </>
        ) : (
          // Note Editor View
          <ScrollView style={styles.editorContainer} showsVerticalScrollIndicator={false}>
            <Card style={styles.editorCard}>
              <TextInput
                style={styles.titleInput}
                value={noteTitle}
                onChangeText={setNoteTitle}
                placeholder="Note Title"
                maxLength={100}
                accessibilityLabel="Note title"
              />

              <View style={styles.divider} />

              <TextInput
                style={styles.contentInput}
                value={noteContent}
                onChangeText={setNoteContent}
                placeholder="Start writing your notes here..."
                multiline
                textAlignVertical="top"
                accessibilityLabel="Note content"
              />
            </Card>

            <View style={styles.editorActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setSelectedNoteId(null);
                  setNoteTitle('');
                  setNoteContent('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing"
              >
                <T variant="body" weight="semiBold" style={styles.cancelText}>
                  Cancel
                </T>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.saveButton,
                  saveNoteMutation.isPending && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={saveNoteMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Save note"
              >
                <T variant="body" weight="semiBold" style={styles.saveText}>
                  {saveNoteMutation.isPending ? '⏳ Saving...' : '💾 Save'}
                </T>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  newButtonText: {
    color: '#FFFFFF',
  },
  notesList: {
    flex: 1,
  },
  noteCard: {
    padding: 16,
    marginBottom: 12,

  },
  noteTitle: {
    marginBottom: 4,
  },
  notePreview: {
    color: '#6B7280',
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  noteDate: {
    color: '#9CA3AF',
  },
  deleteButton: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,

  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
  },
  editorContainer: {
    flex: 1,
  },
  editorCard: {
    padding: 16,
    marginBottom: 16,
    minHeight: 400,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'System',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    minHeight: 300,
    fontFamily: 'System',
  },
  editorActions: {
    flexDirection: 'row',

  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveText: {
    color: '#FFFFFF',
  },
});
