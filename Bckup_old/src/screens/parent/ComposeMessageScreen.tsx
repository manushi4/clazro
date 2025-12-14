/**
 * ComposeMessageScreen - Hybrid Implementation
 *
 * Professional messaging interface for parent-teacher communication
 *
 * Features:
 * - Recipient selection (teachers/admin)
 * - Subject and message composition
 * - Priority selection
 * - File attachment UI (upload coming soon)
 * - Draft saving preview
 * - Send message action
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Button, Badge } from '../../ui';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<ParentStackParamList, 'ComposeMessage'>;

type Priority = 'normal' | 'high' | 'urgent';
type RecipientType = 'teacher' | 'admin' | 'principal';

interface Recipient {
  id: string;
  name: string;
  role: string;
  type: RecipientType;
}

// Sample recipients (in real implementation, fetch from DB)
const SAMPLE_RECIPIENTS: Recipient[] = [
  { id: '1', name: 'Mrs. Priya Kumar', role: 'Math Teacher', type: 'teacher' },
  { id: '2', name: 'Mr. Raj Singh', role: 'Science Teacher', type: 'teacher' },
  { id: '3', name: 'Dr. Sharma', role: 'Principal', type: 'principal' },
  { id: '4', name: 'Admin Office', role: 'Administration', type: 'admin' },
];

const ComposeMessageScreen: React.FC<Props> = ({ route, navigation }) => {
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [showRecipients, setShowRecipients] = useState(false);

  useEffect(() => {
    trackScreenView('ComposeMessage', { from: 'MessagesTab' });
  }, []);

  // Pre-fill if params provided
  useEffect(() => {
    if (route.params?.recipientId) {
      const foundRecipient = SAMPLE_RECIPIENTS.find(r => r.id === route.params.recipientId);
      if (foundRecipient) setRecipient(foundRecipient);
    }
    if (route.params?.subject) {
      setSubject(route.params.subject);
    }
  }, [route.params]);

  const handleSendMessage = () => {
    if (!recipient || !subject.trim() || !message.trim()) {
      alert('Please fill in all required fields (recipient, subject, and message)');
      return;
    }

    trackAction('send_message_attempt', 'ComposeMessage', {
      recipientType: recipient.type,
      priority,
      messageLength: message.length,
    });

    // In real implementation: Save to database
    alert(`Message sent to ${recipient.name}!\n\nSubject: ${subject}\nPriority: ${priority.toUpperCase()}\n\n(Database integration coming soon)`);

    // Navigate back
    navigation.goBack();
  };

  const getPriorityColor = (p: Priority) => {
    if (p === 'urgent') return Colors.error;
    if (p === 'high') return Colors.warning;
    return Colors.info;
  };

  return (
    <BaseScreen
      scrollable={false}
      loading={false}
      error={null}
      empty={false}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Col sx={{ p: 'md' }} gap="md">
          {/* Header */}
          <Card variant="elevated">
            <CardContent>
              <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
                ✍️ Compose New Message
              </T>
              <T variant="body" color="textSecondary">
                Send a message to teachers or school administration
              </T>
            </CardContent>
          </Card>

          {/* Recipient Selection */}
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                To: *
              </T>

              {recipient ? (
                <TouchableOpacity
                  style={styles.selectedRecipient}
                  onPress={() => setShowRecipients(!showRecipients)}
                >
                  <View style={{ flex: 1 }}>
                    <T variant="body" weight="semiBold">{recipient.name}</T>
                    <T variant="caption" color="textSecondary">{recipient.role}</T>
                  </View>
                  <Badge variant="info" label={recipient.type} />
                </TouchableOpacity>
              ) : (
                <Button
                  variant="outline"
                  onPress={() => setShowRecipients(!showRecipients)}
                >
                  Select Recipient
                </Button>
              )}

              {showRecipients && (
                <Col gap="xs" style={{ marginTop: Spacing.sm }}>
                  {SAMPLE_RECIPIENTS.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={styles.recipientOption}
                      onPress={() => {
                        setRecipient(r);
                        setShowRecipients(false);
                        trackAction('select_recipient', 'ComposeMessage', { recipientType: r.type });
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <T variant="body" weight="semiBold">{r.name}</T>
                        <T variant="caption" color="textSecondary">{r.role}</T>
                      </View>
                      <Badge variant="info" label={r.type} />
                    </TouchableOpacity>
                  ))}
                </Col>
              )}
            </CardContent>
          </Card>

          {/* Subject */}
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Subject: *
              </T>
              <TextInput
                style={styles.subjectInput}
                placeholder="Enter message subject..."
                placeholderTextColor={Colors.textSecondary}
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />
              <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                {subject.length}/100 characters
              </T>
            </CardContent>
          </Card>

          {/* Priority */}
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Priority:
              </T>
              <Row style={{ gap: Spacing.xs, flexWrap: 'wrap' }}>
                {(['normal', 'high', 'urgent'] as Priority[]).map((p) => (
                  <Button
                    key={p}
                    variant={priority === p ? 'primary' : 'outline'}
                    onPress={() => setPriority(p)}
                    style={{
                      borderColor: priority === p ? getPriorityColor(p) : undefined,
                      backgroundColor: priority === p ? getPriorityColor(p) : undefined,
                    }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </Row>
            </CardContent>
          </Card>

          {/* Message Body */}
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Message: *
              </T>
              <TextInput
                style={styles.messageInput}
                placeholder="Type your message here..."
                placeholderTextColor={Colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                maxLength={2000}
              />
              <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                {message.length}/2000 characters
              </T>
            </CardContent>
          </Card>

          {/* Attachments (Coming Soon) */}
          <Card variant="outlined" style={{ borderStyle: 'dashed' }}>
            <CardContent>
              <Row spaceBetween centerV>
                <View>
                  <T variant="body" weight="semiBold">📎 Attachments</T>
                  <T variant="caption" color="textSecondary">File upload coming soon</T>
                </View>
                <Button variant="outline" onPress={() => alert('File upload coming soon!')}>
                  Add Files
                </Button>
              </Row>
            </CardContent>
          </Card>

          {/* Actions */}
          <Row style={{ gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.xl }}>
            <Button
              variant="outline"
              onPress={() => {
                trackAction('cancel_message', 'ComposeMessage');
                navigation.goBack();
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleSendMessage}
              style={{ flex: 2 }}
            >
              📨 Send Message
            </Button>
          </Row>
        </Col>
      </ScrollView>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectedRecipient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  recipientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  subjectInput: {
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.onSurface,
    backgroundColor: Colors.surface,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.onSurface,
    backgroundColor: Colors.surface,
    minHeight: 200,
  },
});

export default ComposeMessageScreen;
