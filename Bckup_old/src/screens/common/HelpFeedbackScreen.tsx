/**
 * HelpFeedbackScreen - Hybrid Implementation
 *
 * Help center and feedback submission interface
 *
 * Features:
 * - FAQ accordion sections
 * - Quick help topics
 * - Contact support form
 * - Feedback submission
 * - App version information
 * - Tutorial links
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Button, Badge } from '../../ui';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'HelpFeedback'>;

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'academic' | 'billing' | 'technical';
}

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How do I view my child\'s attendance?',
    answer: 'Go to the Children tab, select your child, and tap on "Attendance Tracking" to see detailed attendance records.',
    category: 'academic',
  },
  {
    id: '2',
    question: 'How can I pay school fees online?',
    answer: 'Navigate to the Fees tab and tap "Make Payment". You can pay via credit/debit card, UPI, or net banking.',
    category: 'billing',
  },
  {
    id: '3',
    question: 'How do I schedule a parent-teacher meeting?',
    answer: 'Go to Messages tab → tap "Schedule" button. Select the teacher, date, time, and meeting type (video/in-person/phone).',
    category: 'general',
  },
  {
    id: '4',
    question: 'Can I change the app language?',
    answer: 'Yes! Go to Settings (drawer menu) → Language → Select Hindi or English.',
    category: 'technical',
  },
  {
    id: '5',
    question: 'How do I receive notifications?',
    answer: 'Enable notifications in Settings. You\'ll receive alerts for announcements, messages, upcoming meetings, and payment reminders.',
    category: 'technical',
  },
  {
    id: '6',
    question: 'What if I forgot to pay fees on time?',
    answer: 'You can still make payments after the due date. Late fees may apply. Check the Fees tab for details.',
    category: 'billing',
  },
];

const HelpFeedbackScreen: React.FC<Props> = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | FAQItem['category']>('all');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feature');
  const [feedbackText, setFeedbackText] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    trackScreenView('HelpFeedback', { from: 'Drawer' });
  }, []);

  // Filter FAQs by category
  const filteredFAQs = selectedCategory === 'all'
    ? FAQ_DATA
    : FAQ_DATA.filter(faq => faq.category === selectedCategory);

  // Toggle FAQ expansion
  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
    trackAction('toggle_faq', 'HelpFeedback', { faqId: id });
  };

  // Get category badge variant
  const getCategoryVariant = (category: FAQItem['category']): 'info' | 'success' | 'warning' | 'error' => {
    if (category === 'academic') return 'info';
    if (category === 'billing') return 'success';
    if (category === 'technical') return 'error';
    return 'warning';
  };

  // Handle feedback submission
  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Required', 'Please enter your feedback');
      return;
    }

    trackAction('submit_feedback', 'HelpFeedback', { type: feedbackType });
    Alert.alert(
      'Feedback Submitted',
      `Thank you for your ${feedbackType} feedback!\n\nWe'll review it shortly.\n\n(Database integration coming soon)`
    );

    // Clear form
    setFeedbackText('');
    setContactEmail('');
  };

  // Handle contact support
  const handleContactSupport = () => {
    trackAction('contact_support', 'HelpFeedback');
    Alert.alert(
      'Contact Support',
      'Email: support@schoolapp.com\nPhone: +91-1800-123-4567\n\nOr submit feedback below.'
    );
  };

  // Handle external links
  const handleOpenLink = (url: string, label: string) => {
    trackAction('open_external_link', 'HelpFeedback', { link: label });
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
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
                ❓ Help & Feedback
              </T>
              <T variant="body" color="textSecondary">
                Find answers or share your thoughts with us
              </T>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card variant="elevated">
            <CardContent>
              <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Quick Help
              </T>
              <Row style={{ gap: Spacing.xs, flexWrap: 'wrap' }}>
                <Button
                  variant="outline"
                  onPress={handleContactSupport}
                >
                  📧 Contact Support
                </Button>
                <Button
                  variant="outline"
                  onPress={() => handleOpenLink('https://docs.example.com', 'User Guide')}
                >
                  📖 User Guide
                </Button>
                <Button
                  variant="outline"
                  onPress={() => handleOpenLink('https://www.youtube.com/@example', 'Video Tutorials')}
                >
                  🎥 Tutorials
                </Button>
              </Row>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card variant="elevated">
            <CardContent>
              <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Frequently Asked Questions
              </T>

              {/* Category Filter */}
              <Row style={{ gap: Spacing.xs, flexWrap: 'wrap', marginBottom: Spacing.md }}>
                <Button
                  variant={selectedCategory === 'all' ? 'primary' : 'outline'}
                  onPress={() => setSelectedCategory('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === 'general' ? 'primary' : 'outline'}
                  onPress={() => setSelectedCategory('general')}
                >
                  General
                </Button>
                <Button
                  variant={selectedCategory === 'academic' ? 'primary' : 'outline'}
                  onPress={() => setSelectedCategory('academic')}
                >
                  Academic
                </Button>
                <Button
                  variant={selectedCategory === 'billing' ? 'primary' : 'outline'}
                  onPress={() => setSelectedCategory('billing')}
                >
                  Billing
                </Button>
                <Button
                  variant={selectedCategory === 'technical' ? 'primary' : 'outline'}
                  onPress={() => setSelectedCategory('technical')}
                >
                  Technical
                </Button>
              </Row>

              {/* FAQ List */}
              <Col gap="sm">
                {filteredFAQs.map((faq) => (
                  <TouchableOpacity
                    key={faq.id}
                    style={styles.faqItem}
                    onPress={() => toggleFAQ(faq.id)}
                  >
                    <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                      <Badge
                        variant={getCategoryVariant(faq.category)}
                        label={faq.category.toUpperCase()}
                      />
                      <T variant="caption" color="textSecondary">
                        {expandedFAQ === faq.id ? '▲' : '▼'}
                      </T>
                    </Row>
                    <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
                      {faq.question}
                    </T>
                    {expandedFAQ === faq.id && (
                      <T variant="body" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                        {faq.answer}
                      </T>
                    )}
                  </TouchableOpacity>
                ))}
              </Col>

              {filteredFAQs.length === 0 && (
                <T variant="body" color="textSecondary" style={{ textAlign: 'center', paddingVertical: Spacing.lg }}>
                  No FAQs found in this category
                </T>
              )}
            </CardContent>
          </Card>

          {/* Feedback Form */}
          <Card variant="elevated">
            <CardContent>
              <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Send Feedback
              </T>

              {/* Feedback Type */}
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Type:
              </T>
              <Row style={{ gap: Spacing.xs, flexWrap: 'wrap', marginBottom: Spacing.md }}>
                {(['bug', 'feature', 'improvement', 'other'] as FeedbackType[]).map((type) => (
                  <Button
                    key={type}
                    variant={feedbackType === type ? 'primary' : 'outline'}
                    onPress={() => setFeedbackType(type)}
                  >
                    {type === 'bug' && '🐛 Bug'}
                    {type === 'feature' && '✨ Feature'}
                    {type === 'improvement' && '📈 Improvement'}
                    {type === 'other' && '💬 Other'}
                  </Button>
                ))}
              </Row>

              {/* Feedback Text */}
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Your Feedback: *
              </T>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Tell us what you think..."
                placeholderTextColor={Colors.textSecondary}
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs, marginBottom: Spacing.md }}>
                {feedbackText.length}/500 characters
              </T>

              {/* Optional Email */}
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                Email (Optional):
              </T>
              <TextInput
                style={styles.emailInput}
                placeholder="your.email@example.com"
                placeholderTextColor={Colors.textSecondary}
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Submit Button */}
              <Button
                variant="primary"
                onPress={handleSubmitFeedback}
                style={{ marginTop: Spacing.md }}
              >
                📨 Submit Feedback
              </Button>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card variant="outlined">
            <CardContent>
              <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                App Information
              </T>
              <Row spaceBetween style={{ marginBottom: Spacing.xs }}>
                <T variant="body" color="textSecondary">Version:</T>
                <T variant="body" weight="semiBold">1.0.0</T>
              </Row>
              <Row spaceBetween style={{ marginBottom: Spacing.xs }}>
                <T variant="body" color="textSecondary">Build:</T>
                <T variant="body" weight="semiBold">100</T>
              </Row>
              <Row spaceBetween style={{ marginBottom: Spacing.xs }}>
                <T variant="body" color="textSecondary">Platform:</T>
                <T variant="body" weight="semiBold">React Native</T>
              </Row>
              <Row spaceBetween>
                <T variant="body" color="textSecondary">Last Updated:</T>
                <T variant="body" weight="semiBold">Oct 2025</T>
              </Row>
            </CardContent>
          </Card>

          {/* Legal Links */}
          <Card variant="outlined">
            <CardContent>
              <Row style={{ gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="outline"
                  onPress={() => handleOpenLink('https://example.com/privacy', 'Privacy Policy')}
                >
                  Privacy Policy
                </Button>
                <Button
                  variant="outline"
                  onPress={() => handleOpenLink('https://example.com/terms', 'Terms of Service')}
                >
                  Terms of Service
                </Button>
              </Row>
            </CardContent>
          </Card>
        </Col>
      </ScrollView>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  faqItem: {
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.onSurface,
    backgroundColor: Colors.surface,
    minHeight: 150,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.onSurface,
    backgroundColor: Colors.surface,
  },
});

export default HelpFeedbackScreen;
