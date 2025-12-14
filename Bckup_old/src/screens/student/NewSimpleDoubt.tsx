/**
 * NewSimpleDoubt - Premium Minimal Design
 * Purpose: Quick doubt submission form
 * Used in: StudentNavigator (HomeStack)
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, CardHeader, CardContent } from '../../ui';
import { Button } from '../../ui';
import { Row } from '../../ui';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'NewSimpleDoubt'>;

interface RelatedDoubt {
  id: string;
  title: string;
  answers: number;
}

const DOUBT_TEMPLATES = [
  "I don't understand how to...",
  "Can you explain the concept of...",
  "What's the difference between...",
  "How do I solve...",
  "Why does...",
  "What are the steps to...",
];

export default function NewSimpleDoubt({ navigation }: Props) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [relatedDoubts, setRelatedDoubts] = useState<RelatedDoubt[]>([]);

  React.useEffect(() => {
    trackScreenView('NewSimpleDoubt');
  }, []);

  const handleUseTemplate = (template: string) => {
    setQuestion(template);
    setShowTemplates(false);
    trackAction('use_doubt_template', 'NewSimpleDoubt', { template });
  };

  const handleVoiceInput = () => {
    Alert.alert(
      'Voice Input',
      'Voice input feature would require react-native-voice package.\n\nFor demo purposes, we can simulate voice input.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate',
          onPress: () => {
            const simulatedText = 'How do I solve quadratic equations using the formula?';
            setQuestion(question ? `${question} ${simulatedText}` : simulatedText);
            trackAction('voice_input', 'NewSimpleDoubt');
          },
        },
      ]
    );
  };

  const searchRelatedDoubts = (text: string) => {
    if (text.length < 5) {
      setRelatedDoubts([]);
      return;
    }

    // Simulate searching for related doubts
    const mockRelated: RelatedDoubt[] = [
      { id: '1', title: 'Similar doubt about equations and formulas', answers: 3 },
      { id: '2', title: 'Related question on solving problems', answers: 5 },
      { id: '3', title: 'How to approach this type of question', answers: 2 },
    ];
    setRelatedDoubts(mockRelated);
  };

  const handleQuestionChange = (text: string) => {
    setQuestion(text);
    searchRelatedDoubts(text);
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !question.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and question.');
      return;
    }

    setIsSubmitting(true);
    trackAction('submit_doubt', 'NewSimpleDoubt');

    try {
      const { error } = await supabase.from('doubts').insert({
        student_id: user?.id,
        subject: subject.trim(),
        question: question.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert('Success', 'Your doubt has been submitted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit doubt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseScreen scrollable={true}>
      <View style={styles.container}>
        {/* Quick Actions */}
        <Row gap="xs" style={{ marginBottom: 16 }}>
          <Button
            variant="outline"
            onPress={() => setShowTemplates(true)}
            style={{ flex: 1 }}
            disabled={isSubmitting}
          >
            📝 Templates
          </Button>
          <Button
            variant="outline"
            onPress={handleVoiceInput}
            style={{ flex: 1 }}
            disabled={isSubmitting}
          >
            🎤 Voice
          </Button>
        </Row>

        <Card style={styles.formCard}>
          <T variant="h2" weight="bold" style={styles.title}>
            Ask a Quick Question
          </T>
          <T variant="body" style={styles.subtitle}>
            Get help from your teachers
          </T>

          <View style={styles.inputGroup}>
            <T variant="body" weight="semiBold" style={styles.label}>
              Subject
            </T>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g., Mathematics, Physics"
              editable={!isSubmitting}
              accessibilityLabel="Subject input"
            />
          </View>

          <View style={styles.inputGroup}>
            <T variant="body" weight="semiBold" style={styles.label}>
              Your Question
            </T>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={question}
              onChangeText={handleQuestionChange}
              placeholder="Describe your doubt in detail..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isSubmitting}
              accessibilityLabel="Question input"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Submit doubt"
          >
            <T variant="body" weight="semiBold" style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : '📤 Submit Doubt'}
            </T>
          </TouchableOpacity>
        </Card>

        {/* Related Doubts */}
        {relatedDoubts.length > 0 && (
          <Card style={styles.relatedCard}>
            <T variant="body" weight="semiBold" style={{ marginBottom: 12 }}>
              💡 Related Doubts
            </T>
            <T variant="caption" style={{ color: '#6B7280', marginBottom: 12 }}>
              These similar doubts might help you
            </T>
            {relatedDoubts.map((doubt) => (
              <TouchableOpacity
                key={doubt.id}
                style={styles.relatedDoubtItem}
                onPress={() => trackAction('view_related_doubt', 'NewSimpleDoubt', { doubtId: doubt.id })}
                accessibilityRole="button"
                accessibilityLabel={`View related doubt: ${doubt.title}`}
              >
                <View style={{ flex: 1 }}>
                  <T variant="body">{doubt.title}</T>
                  <T variant="caption" style={{ color: '#9CA3AF', marginTop: 4 }}>
                    {doubt.answers} answer{doubt.answers !== 1 ? 's' : ''}
                  </T>
                </View>
                <T variant="body">›</T>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Templates Modal */}
        <Modal visible={showTemplates} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <Card style={styles.templatesModal}>
              <CardHeader
                title="Quick Templates"
                trailing={
                  <TouchableOpacity
                    onPress={() => setShowTemplates(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Close templates"
                  >
                    <T variant="h3">✕</T>
                  </TouchableOpacity>
                }
              />
              <CardContent>
                <T variant="body" style={{ color: '#6B7280', marginBottom: 12 }}>
                  Select a template to get started quickly
                </T>
                {DOUBT_TEMPLATES.map((template, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.templateOption}
                    onPress={() => handleUseTemplate(template)}
                    accessibilityRole="button"
                    accessibilityLabel={`Use template: ${template}`}
                  >
                    <T variant="body">{template}</T>
                    <T variant="body">›</T>
                  </TouchableOpacity>
                ))}
              </CardContent>
            </Card>
          </View>
        </Modal>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  formCard: {
    padding: 20,

  },
  title: {
    marginBottom: -12,
  },
  subtitle: {
    color: '#6B7280',
  },
  inputGroup: {

  },
  label: {
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'System',
  },
  textArea: {
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
  relatedCard: {
    padding: 16,
    marginTop: 16,
  },
  relatedDoubtItem: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  templatesModal: {
    width: '100%',
    maxHeight: '70%',
  },
  templateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
});
