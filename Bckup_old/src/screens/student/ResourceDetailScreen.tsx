import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, Chip, Row, T, Button } from '../../ui';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/designSystem';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'ResourceDetailScreen'>;

type ResourceType = 'video' | 'pdf' | 'note' | 'practice';

interface ResourceDetail {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  type: ResourceType;
  chapterTitle: string;
  duration?: string;
  description: string;
  estimatedTime?: string;
}

interface RelatedResource {
  id: string;
  title: string;
  type: ResourceType;
}

const MOCK_RESOURCES: Record<string, ResourceDetail> = {
  'res-math-1': {
    id: 'res-math-1',
    title: 'Linear Equations - Concept Video',
    subject: 'Mathematics',
    subjectCode: 'MATH',
    type: 'video',
    chapterTitle: 'Algebra · Linear Equations',
    duration: '12:30',
    description: 'Visual walkthrough of solving linear equations with worked examples and tips.',
    estimatedTime: '15m',
  },
  'res-phys-1': {
    id: 'res-phys-1',
    title: 'Newton’s Laws Notes',
    subject: 'Physics',
    subjectCode: 'PHYS',
    type: 'pdf',
    chapterTitle: 'Mechanics · Newtonian Dynamics',
    duration: '8 pages',
    description: 'Concise notes covering Newton’s three laws with force diagrams.',
    estimatedTime: '20m',
  },
};

const MOCK_RELATED: Record<string, RelatedResource[]> = {
  'res-math-1': [
    { id: 'rel-1', title: 'Practice: Linear equations MCQs', type: 'practice' },
    { id: 'rel-2', title: 'Notes: Key formulas', type: 'note' },
    { id: 'rel-3', title: 'Examples: Word problems', type: 'note' },
  ],
  'res-phys-1': [
    { id: 'rel-4', title: 'Video: Free-body diagrams', type: 'video' },
    { id: 'rel-5', title: 'Practice: Newton’s laws drill', type: 'practice' },
  ],
};

// TODO: Replace with Supabase-backed resource fetching once schema is ready.
function useResourceDetail(resourceId: string) {
  const resource = MOCK_RESOURCES[resourceId] ?? Object.values(MOCK_RESOURCES)[0];
  const related = MOCK_RELATED[resourceId] ?? [];
  return { resource, related };
}

export default function ResourceDetailScreen({ route, navigation }: Props) {
  const resourceId = route.params?.resourceId as string;
  const { resource, related } = useResourceDetail(resourceId);
  const [isCompleted, setIsCompleted] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    trackScreenView('ResourceDetailScreen', { resourceId });
  }, [resourceId]);

  const subjectChip = useMemo(() => `${resource.subject}`, [resource.subject]);
  const typeChip = useMemo(() => {
    if (resource.type === 'video') return 'Video';
    if (resource.type === 'pdf') return 'PDF';
    if (resource.type === 'note') return 'Notes';
    return 'Practice';
  }, [resource.type]);

  const handleComplete = () => {
    const next = !isCompleted;
    setIsCompleted(next);
    trackAction('resource_mark_complete', 'ResourceDetailScreen', { resourceId, completed: next });
  };

  const handleAddToPlaylist = () => {
    trackAction('resource_add_playlist', 'ResourceDetailScreen', { resourceId });
    Alert.alert('Playlist', 'Add to playlist coming soon.');
  };

  const handleDownload = () => {
    trackAction('resource_download', 'ResourceDetailScreen', { resourceId });
    Alert.alert('Download', 'Download feature coming soon.');
  };

  const handleOpenAIStudy = () => {
    trackAction('resource_open_ai_study', 'ResourceDetailScreen', { resourceId });
    navigation.navigate('NewEnhancedAIStudy', { resourceId, mode: 'resource' });
  };

  const handleSaveNotes = () => {
    trackAction('resource_save_notes', 'ResourceDetailScreen', { resourceId });
    Alert.alert('Notes saved', 'Your notes have been saved locally (placeholder).');
  };

  const handleSummarizeNotes = () => {
    trackAction('resource_summarize_notes', 'ResourceDetailScreen', { resourceId });
    Alert.alert('AI Summary', 'AI summary will be generated here (placeholder).');
  };

  const openRelated = (rel: RelatedResource) => {
    trackAction('open_related_resource', 'ResourceDetailScreen', { relatedId: rel.id, resourceId });
    navigation.navigate('ResourceDetailScreen', { resourceId: rel.id });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BaseScreen backgroundColor={Colors.background} scrollable={false} contentContainerStyle={styles.baseContent}>
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.lg }} showsVerticalScrollIndicator={false}>
          <Row style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
              <T style={styles.icon}>←</T>
            </TouchableOpacity>
            <T variant="headline" style={styles.topTitle}>
              Resource details
            </T>
            <View style={{ width: 24 }} />
          </Row>

          <Card style={styles.headerCard}>
            <Row style={{ marginBottom: Spacing.xs }}>
              <Chip label={subjectChip} variant="assist" />
              <Chip label={typeChip} variant="assist" />
            </Row>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              {resource.title}
            </T>
            <T variant="caption" color="textSecondary">
              Chapter: {resource.chapterTitle} {resource.duration ? `• ${resource.duration}` : ''}
            </T>
          </Card>

          <Card style={styles.previewCard}>
            <View style={styles.previewPlaceholder}>
              <T variant="body" color="textSecondary">
                Preview area / player placeholder
              </T>
              <T variant="caption" color="textSecondary">
                (Video frame / PDF / Notes)
              </T>
            </View>
          </Card>

          <Card style={styles.actionsCard}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.sm }}>
              Actions
            </T>
            <Row style={styles.actionsRow}>
              <Button variant={isCompleted ? 'secondary' : 'primary'} onPress={handleComplete} style={styles.actionButton}>
                {isCompleted ? 'Completed' : 'Mark as completed'}
              </Button>
              <Button variant="outline" onPress={handleAddToPlaylist} style={styles.actionButton}>
                Add to playlist
              </Button>
            </Row>
            <Row style={styles.actionsRow}>
              <Button variant="outline" onPress={handleDownload} style={styles.actionButton}>
                Download
              </Button>
              <Button variant="outline" onPress={handleOpenAIStudy} style={styles.actionButton}>
                Open in AI Study
              </Button>
            </Row>
          </Card>

          <Card style={styles.notesCard}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.sm }}>
              Your notes
            </T>
            <View style={styles.notesBox}>
              <TextInput
                style={styles.notesInput}
                placeholder="Write notes here..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>
            <Row style={styles.actionsRow}>
              <Button variant="primary" onPress={handleSaveNotes} style={styles.actionButton}>
                Save notes
              </Button>
              <Button variant="secondary" onPress={handleSummarizeNotes} style={styles.actionButton}>
                Summarize notes with AI
              </Button>
            </Row>
          </Card>

          <Card style={styles.sectionCard}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.sm }}>
              Related resources
            </T>
            {related.length === 0 && (
              <T variant="body" color="textSecondary">
                No related resources yet.
              </T>
            )}
            {related.map((rel) => (
              <TouchableOpacity
                key={rel.id}
                style={styles.relatedRow}
                onPress={() => openRelated(rel)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${rel.title}`}
              >
                <View>
                  <T variant="body" weight="bold">
                    {rel.title}
                  </T>
                  <T variant="caption" color="textSecondary">
                    {typeChipFor(rel.type)}
                  </T>
                </View>
                <T variant="body" color="textSecondary">
                  ›
                </T>
              </TouchableOpacity>
            ))}
          </Card>
        </ScrollView>
      </BaseScreen>
    </SafeAreaView>
  );
}

function typeChipFor(type: ResourceType) {
  switch (type) {
    case 'video':
      return 'Video';
    case 'pdf':
      return 'PDF';
    case 'note':
      return 'Notes';
    default:
      return 'Practice';
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  baseContent: {
    paddingHorizontal: Spacing.base,
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  topTitle: {
    color: Colors.textPrimary,
  },
  icon: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  headerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    ...Shadows.resting,
  },
  previewCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    ...Shadows.resting,
  },
  previewPlaceholder: {
    height: 180,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    ...Shadows.resting,
  },
  notesCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    ...Shadows.resting,
  },
  sectionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    ...Shadows.resting,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  notesBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    minHeight: 120,
    marginBottom: Spacing.sm,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    color: Colors.textPrimary,
  },
  relatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
});
