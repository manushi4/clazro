/**
 * DoubtDetailScreen - View complete doubt details
 * Purpose: Shows full doubt information including images, status, and teacher responses
 * Used in: StudentNavigator (AssignmentsStack) - from NewDoubtSubmission
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Share } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card } from '../../ui/surfaces/Card';
import { T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { logDatabaseError } from '../../utils/errorLogger';

type Props = NativeStackScreenProps<any, 'DoubtDetailScreen'>;

interface DoubtDetail {
  id: string;
  student_id: string;
  subject_code: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'viewed' | 'answered' | 'closed' | 'reopened';
  attachments: { images?: string[] } | null;
  created_at: string;
  updated_at: string;
  teacher_response?: string;
  teacher_response_at?: string;
}

export default function DoubtDetailScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const doubtId = route.params?.doubtId;

  React.useEffect(() => {
    trackScreenView('DoubtDetailScreen', { doubtId });
  }, [doubtId]);

  // Fetch doubt details
  const { data: doubt, isLoading, error } = useQuery({
    queryKey: ['doubt-detail', doubtId],
    queryFn: async () => {
      if (!doubtId) throw new Error('No doubt ID provided');

      const { data, error } = await supabase
        .from('doubts')
        .select('*')
        .eq('id', doubtId)
        .single();

      if (error) {
        logDatabaseError('DoubtDetailScreen', 'Fetch doubt detail', error);
        throw error;
      }

      return data as DoubtDetail;
    },
    enabled: !!doubtId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      console.log('Attempting to delete doubt:', doubtId, 'for user:', user?.id);

      const { data, error } = await supabase
        .from('doubts')
        .delete()
        .eq('id', doubtId)
        .eq('student_id', user?.id)
        .select();

      console.log('Delete result:', { data, error });

      if (error) {
        logDatabaseError('DoubtDetailScreen', 'Delete doubt', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Doubt not found or already deleted');
      }

      return data;
    },
    onSuccess: () => {
      console.log('Delete successful, invalidating queries');
      trackAction('delete_doubt_success', 'DoubtDetailScreen', { doubtId });

      // Navigate back immediately to avoid trying to load deleted doubt
      navigation.goBack();

      // Invalidate queries after navigation
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['doubt-history'] });
      }, 100);
    },
    onError: (error: any) => {
      console.error('Error deleting doubt:', error);
      logDatabaseError('DoubtDetailScreen', 'Delete doubt failed', error);
      Alert.alert('Error', `Failed to delete doubt: ${error.message || 'Please try again.'}`);
    },
  });

  const handleDelete = () => {
    trackAction('delete_doubt_attempt', 'DoubtDetailScreen', { doubtId });
    Alert.alert(
      '🗑️ Delete Doubt?',
      `Are you sure you want to delete "${doubt?.title}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const handleEdit = () => {
    trackAction('edit_doubt', 'DoubtDetailScreen', { doubtId });
    navigation.navigate('NewDoubtSubmission', { editDoubtId: doubtId });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return '#10B981';
      case 'viewed': return '#F59E0B';
      case 'open': return '#3B82F6';
      case 'closed': return '#6B7280';
      case 'reopened': return '#8B5CF6';
      default: return '#9CA3AF';
    }
  };

  const formatDate = (dateString: string) => {
    // Add 'Z' to indicate UTC timezone if not present
    const utcString = dateString.includes('Z') || dateString.includes('+') ? dateString : `${dateString}Z`;
    const date = new Date(utcString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPending = doubt?.status === 'open' || doubt?.status === 'viewed';

  const handleShare = async () => {
    if (!doubt) return;

    try {
      const shareContent = `📚 Doubt: ${doubt.title}\n\n${doubt.description}\n\nSubject: ${doubt.subject_code}\nStatus: ${doubt.status.toUpperCase()}`;

      await Share.share({
        message: shareContent,
        title: 'Share Doubt',
      });

      trackAction('share_doubt', 'DoubtDetailScreen', { doubtId });
    } catch (error) {
      console.error('Error sharing doubt:', error);
    }
  };

  const handleMenuPress = () => {
    Alert.alert(
      'Doubt Options',
      'Choose an action',
      isPending ? [
        { text: 'Edit Doubt', onPress: handleEdit },
        { text: 'Delete Doubt', onPress: handleDelete, style: 'destructive' },
        { text: 'Share', onPress: handleShare },
        { text: 'Cancel', style: 'cancel' },
      ] : [
        { text: 'Share', onPress: handleShare },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <BaseScreen
      scrollable={false}
      loading={isLoading}
      error={error ? 'Failed to load doubt details' : null}
      empty={!doubt}
      emptyMessage="Doubt not found"
    >
      {doubt && (
        <View style={styles.fullContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <T style={styles.backIcon}>←</T>
            </TouchableOpacity>

            <View style={styles.topBarCenter}>
              <T variant="caption" style={styles.topBarLabel}>DOUBT DETAILS</T>
            </View>

            <TouchableOpacity
              onPress={handleMenuPress}
              style={styles.menuButton}
              accessibilityRole="button"
              accessibilityLabel="More options"
            >
              <T style={styles.menuIcon}>⋮</T>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Card */}
            <Card style={styles.headerCard}>
              <View style={styles.headerRow}>
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: `${getPriorityColor(doubt.priority)}20` }]}>
                    <T variant="caption" weight="semiBold" style={{ color: getPriorityColor(doubt.priority) }}>
                      {doubt.priority.toUpperCase()} PRIORITY
                    </T>
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${getStatusColor(doubt.status)}20` }]}>
                    <T variant="caption" weight="semiBold" style={{ color: getStatusColor(doubt.status) }}>
                      {doubt.status.toUpperCase()}
                    </T>
                  </View>
                </View>
              </View>

              <T variant="h2" weight="bold" style={styles.title}>
                {doubt.title}
              </T>

            <View style={styles.metadata}>
              <T variant="caption" style={styles.metaText}>
                📚 {doubt.subject_code}
              </T>
              <T variant="caption" style={styles.metaText}>
                📅 {formatDate(doubt.created_at)}
              </T>
            </View>
          </Card>

          {/* Description Card */}
          <Card style={styles.card}>
            <T variant="title" weight="semiBold" style={styles.sectionTitle}>
              Description
            </T>
            <T variant="body" style={styles.description}>
              {doubt.description}
            </T>
          </Card>

          {/* Attachments Card */}
          {doubt.attachments && doubt.attachments.images && doubt.attachments.images.length > 0 && (
            <Card style={styles.card}>
              <T variant="title" weight="semiBold" style={styles.sectionTitle}>
                Attachments ({doubt.attachments.images.length})
              </T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                {doubt.attachments.images.map((imageUrl, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      trackAction('view_doubt_image', 'DoubtDetailScreen', { doubtId, imageIndex: index });
                      Alert.alert('Image Viewer', 'Full-screen image viewer coming soon!');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`View image ${index + 1}`}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Card>
          )}

          {/* Teacher Response Card */}
          {doubt.teacher_response ? (
            <Card style={styles.card}>
              <T variant="title" weight="semiBold" style={styles.sectionTitle}>
                Teacher's Response
              </T>
              <T variant="body" style={styles.teacherResponse}>
                {doubt.teacher_response}
              </T>
              {doubt.teacher_response_at && (
                <T variant="caption" style={styles.responseDate}>
                  Responded on {formatDate(doubt.teacher_response_at)}
                </T>
              )}
            </Card>
          ) : (
            <Card style={styles.card}>
              <T variant="title" weight="semiBold" style={styles.sectionTitle}>
                Teacher's Response
              </T>
              <View style={styles.noResponse}>
                <T variant="body" style={styles.noResponseText}>
                  ⏳ Waiting for teacher's response
                </T>
                <T variant="caption" style={styles.noResponseSubtext}>
                  You'll be notified when your teacher responds to this doubt
                </T>
              </View>
            </Card>
          )}

          {/* Timeline Card */}
          <Card style={styles.card}>
            <T variant="title" weight="semiBold" style={styles.sectionTitle}>
              Timeline
            </T>
            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#3B82F6' }]} />
                <View style={styles.timelineContent}>
                  <T variant="body" weight="semiBold">Submitted</T>
                  <T variant="caption" style={styles.timelineDate}>
                    {formatDate(doubt.created_at)}
                  </T>
                </View>
              </View>

              {doubt.status === 'viewed' && (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]} />
                  <View style={styles.timelineContent}>
                    <T variant="body" weight="semiBold">Viewed by Teacher</T>
                    <T variant="caption" style={styles.timelineDate}>
                      {formatDate(doubt.updated_at)}
                    </T>
                  </View>
                </View>
              )}

              {doubt.status === 'answered' && (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                  <View style={styles.timelineContent}>
                    <T variant="body" weight="semiBold">Answered</T>
                    <T variant="caption" style={styles.timelineDate}>
                      {doubt.teacher_response_at ? formatDate(doubt.teacher_response_at) : formatDate(doubt.updated_at)}
                    </T>
                  </View>
                </View>
              )}
            </View>
          </Card>

          {/* Bottom padding */}
          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Bottom Bar with Doubt Name */}
        <View style={styles.bottomBar}>
          <T variant="body" weight="semiBold" style={styles.bottomBarText} numberOfLines={1}>
            {doubt.title}
          </T>
        </View>
      </View>
      )}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  topBar: {
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1F2937',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarLabel: {
    color: '#6B7280',
    letterSpacing: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomBarText: {
    color: '#1F2937',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionButtonsHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconHeader: {
    fontSize: 18,
  },
  title: {
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaText: {
    color: '#6B7280',
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  description: {
    color: '#4B5563',
    lineHeight: 22,
    fontSize: 15,
  },
  imagesScroll: {
    marginTop: 8,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  teacherResponse: {
    color: '#1F2937',
    lineHeight: 22,
    fontSize: 15,
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  responseDate: {
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  noResponse: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  noResponseText: {
    color: '#6B7280',
    marginBottom: 4,
  },
  noResponseSubtext: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    color: '#6B7280',
    marginTop: 2,
  },
});
