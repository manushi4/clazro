import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, Chip, Row, T, Button } from '../../ui';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/designSystem';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'DoubtDetailScreen'>;

type Sender = 'you' | 'teacher' | 'ai';

type DoubtMessage = {
  id: string;
  sender: Sender;
  text: string;
  timeLabel: string;
};

type DoubtDetail = {
  id: string;
  subject: string;
  chapter: string;
  status: 'Pending' | 'Answered' | 'Escalated';
  askedAgo: string;
  source: 'Teacher' | 'Peer' | 'Self' | 'AI';
  question: string;
  attachments: string[];
  messages: DoubtMessage[];
};

const MOCK_DOUBTS: Record<string, DoubtDetail> = {
  math_linear_1: {
    id: 'math_linear_1',
    subject: 'Mathematics',
    chapter: 'Linear equations',
    status: 'Pending',
    askedAgo: '2h ago',
    source: 'Teacher',
    question:
      'Stuck on Q4 of worksheet. After moving terms, I get 3x = 12 but the solution says 2x = 12. What am I missing?',
    attachments: ['worksheet_q4.png', 'rough_work.jpg'],
    messages: [
      { id: 'm1', sender: 'you', text: 'Can someone check my steps for Q4?', timeLabel: '2h ago' },
      {
        id: 'm2',
        sender: 'teacher',
        text: 'Check the sign when moving 2x to the left. You subtracted instead of adding.',
        timeLabel: '1h ago',
      },
      {
        id: 'm3',
        sender: 'ai',
        text: 'Hint: Combine like terms carefully: 5x - 3x = 2x, not 3x.',
        timeLabel: 'just now',
      },
    ],
  },
  phys_newton_1: {
    id: 'phys_newton_1',
    subject: 'Physics',
    chapter: 'Newton’s Laws',
    status: 'Answered',
    askedAgo: '5h ago',
    source: 'Self',
    question: 'Unsure how to pick normal force direction on an inclined plane with friction.',
    attachments: ['free_body_diagram.jpg'],
    messages: [
      { id: 'p1', sender: 'you', text: 'Does normal tilt perpendicular to the plane?', timeLabel: '5h ago' },
      {
        id: 'p2',
        sender: 'teacher',
        text: 'Yes, always perpendicular to the surface. Then decompose weight into parallel/perpendicular components.',
        timeLabel: '4h ago',
      },
      {
        id: 'p3',
        sender: 'ai',
        text: 'Remember: N = mg cosθ if no additional vertical forces.',
        timeLabel: '4h ago',
      },
    ],
  },
};

const statusColor: Record<DoubtDetail['status'], string> = {
  Pending: Colors.warning,
  Answered: Colors.success,
  Escalated: Colors.error,
};

const senderLabel: Record<Sender, string> = {
  you: 'You',
  teacher: 'Teacher',
  ai: 'AI',
};

const senderBubbleStyle: Record<Sender, { alignSelf: 'flex-start' | 'flex-end'; backgroundColor: string }> = {
  you: { alignSelf: 'flex-end', backgroundColor: Colors.primaryContainer },
  teacher: { alignSelf: 'flex-start', backgroundColor: Colors.surface },
  ai: { alignSelf: 'flex-start', backgroundColor: Colors.infoLight },
};

export default function DoubtDetailScreen({ route, navigation }: Props) {
  const { doubtId } = route.params || { doubtId: 'math_linear_1' };
  const [helpful, setHelpful] = useState<null | 'yes' | 'no'>(null);
  const [followUp, setFollowUp] = useState('');

  const doubt = useMemo(() => MOCK_DOUBTS[doubtId] ?? MOCK_DOUBTS.math_linear_1, [doubtId]);

  useEffect(() => {
    trackScreenView('DoubtDetailScreen', { doubtId });
  }, [doubtId]);

  const handleHelpful = (value: 'yes' | 'no') => {
    setHelpful(value);
    trackAction('doubt_helpful', 'DoubtDetailScreen', { doubtId, value });
  };

  const handleSend = () => {
    if (!followUp.trim()) return;
    trackAction('doubt_follow_up', 'DoubtDetailScreen', { doubtId, messageLength: followUp.length });
    Alert.alert('Sent', 'Follow-up question sent (placeholder).');
    setFollowUp('');
  };

  return (
    <BaseScreen scrollable={false}>
      <View style={styles.container}>
        <Row style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <T variant="title">←</T>
          </TouchableOpacity>
          <T variant="title" weight="bold">
            Doubt detail
          </T>
          <View style={{ width: 28 }} />
        </Row>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Card style={styles.metaCard}>
            <T variant="body" weight="medium">
              Subject: {doubt.subject} • Chapter: {doubt.chapter}
            </T>
            <Row style={styles.statusRow}>
              <Chip variant="solid" color={statusColor[doubt.status]}>
                {doubt.status}
              </Chip>
              <Chip variant="outline">{`Asked: ${doubt.askedAgo}`}</Chip>
              <Chip variant="outline">{`Source: ${doubt.source}`}</Chip>
            </Row>
          </Card>

          <Card style={styles.questionCard}>
            <T variant="body" color="textSecondary">
              {doubt.question}
            </T>
          </Card>

          <Card style={styles.attachmentsCard}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.sm }}>
              Attachments
            </T>
            {doubt.attachments.map((file) => (
              <View key={file} style={styles.attachmentRow}>
                <T variant="body">• {file}</T>
              </View>
            ))}
            {doubt.attachments.length === 0 && (
              <T variant="caption" color="textSecondary">
                No attachments added.
              </T>
            )}
          </Card>

          <Card style={styles.conversationCard}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.sm }}>
              Conversation
            </T>
            {doubt.messages.map((msg) => {
              const style = senderBubbleStyle[msg.sender];
              return (
                <View key={msg.id} style={[styles.messageBubble, style]}>
                  <Row style={styles.messageHeader}>
                    <T variant="caption" weight="medium">
                      {senderLabel[msg.sender]}
                    </T>
                    <T variant="caption" color="textSecondary">
                      {msg.timeLabel}
                    </T>
                  </Row>
                  <T variant="body">{msg.text}</T>
                </View>
              );
            })}
          </Card>

          <Card style={styles.helpfulCard}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <T variant="body" weight="medium">
                Was this helpful?
              </T>
              <Row>
                <Button
                  variant={helpful === 'yes' ? 'primary' : 'outline'}
                  onPress={() => handleHelpful('yes')}
                  style={styles.helpfulBtn}
                >
                  Yes
                </Button>
                <Button
                  variant={helpful === 'no' ? 'primary' : 'outline'}
                  onPress={() => handleHelpful('no')}
                  style={styles.helpfulBtn}
                >
                  No
                </Button>
              </Row>
            </Row>
          </Card>

          <Row style={styles.actionsRow}>
            <Button
              variant="secondary"
              onPress={() => {
                trackAction('doubt_practice_related', 'DoubtDetailScreen', { doubtId });
                navigation.navigate('NewEnhancedAIStudy' as any, { mode: 'practice', doubtId });
              }}
              style={styles.actionButton}
            >
              Practice related questions
            </Button>
            <Button
              variant="outline"
              onPress={() => {
                trackAction('doubt_add_to_notes', 'DoubtDetailScreen', { doubtId });
                Alert.alert('Saved', 'Added to notes (placeholder).');
              }}
              style={styles.actionButton}
            >
              Add to notes
            </Button>
          </Row>

          <Card style={styles.followUpCard}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.sm }}>
              Ask a follow-up
            </T>
            <TextInput
              value={followUp}
              onChangeText={setFollowUp}
              placeholder="Type your follow-up question..."
              multiline
              style={styles.input}
              textAlignVertical="top"
            />
            <Row style={{ justifyContent: 'flex-end' }}>
              <Button variant="primary" onPress={handleSend}>
                Send
              </Button>
            </Row>
          </Card>
        </ScrollView>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  metaCard: {
    marginBottom: Spacing.md,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    ...Shadows.resting,
  },
  statusRow: {
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  questionCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.resting,
  },
  attachmentsCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.resting,
  },
  attachmentRow: {
    paddingVertical: 4,
  },
  conversationCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.resting,
  },
  messageBubble: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    maxWidth: '90%',
  },
  messageHeader: {
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  helpfulCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.resting,
  },
  helpfulBtn: {
    marginLeft: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '48%',
  },
  followUpCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.resting,
  },
  input: {
    minHeight: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
});
