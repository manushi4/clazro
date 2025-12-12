/**
 * LegalScreen - Terms & privacy viewer
 * Purpose: Display legal documents (Terms of Service, Privacy Policy)
 * Design: Framer design system with document selection and scrollable content
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Card, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'LegalScreen'>;

type LegalDocId = 'terms' | 'privacy';

interface LegalDocument {
  id: LegalDocId;
  title: string;
  lastUpdatedLabel: string;
  content: string;
}

// Framer Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  selectedBg: '#EBF4FF',
  selectedBorder: '#2D5BFF',
};

// Mock Data
const MOCK_LEGAL_DOCS: LegalDocument[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    lastUpdatedLabel: 'Updated: 15 Jan 2025',
    content: `TERMS OF SERVICE

Last Updated: January 15, 2025

1. ACCEPTANCE OF TERMS

By accessing and using this educational platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement.

2. USE LICENSE

Permission is granted to temporarily access the materials (information or software) on the Service for personal, non-commercial educational use only.

This is the grant of a license, not a transfer of title, and under this license you may not:
• Modify or copy the materials
• Use the materials for any commercial purpose
• Attempt to decompile or reverse engineer any software contained on the Service
• Remove any copyright or other proprietary notations from the materials
• Transfer the materials to another person or "mirror" the materials on any other server

3. USER ACCOUNTS

When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.

You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.

4. CONTENT

Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content").

You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.

5. STUDENT DATA PROTECTION

We are committed to protecting student privacy and data security:
• Student data is used solely for educational purposes
• We do not sell student data to third parties
• Parents/guardians have the right to access and request deletion of their child's data
• All data is encrypted in transit and at rest

6. INTELLECTUAL PROPERTY

The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of the platform and its licensors.

7. TERMINATION

We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.

8. LIMITATION OF LIABILITY

In no event shall the platform, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.

9. GOVERNING LAW

These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.

10. CHANGES TO TERMS

We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.

11. CONTACT US

If you have any questions about these Terms, please contact us at:
• Email: legal@educationplatform.com
• Phone: +91 1800 123 4567

---

By using this Service, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.`,
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    lastUpdatedLabel: 'Updated: 12 May 2024',
    content: `PRIVACY POLICY

Last Updated: May 12, 2024

1. INTRODUCTION

Welcome to our educational platform. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data and tell you about your privacy rights.

2. DATA WE COLLECT

We may collect, use, store and transfer different kinds of personal data about you:

STUDENT DATA:
• Identity Data: first name, last name, username
• Contact Data: email address, phone number
• Profile Data: class/grade, subjects, learning preferences
• Usage Data: attendance records, test scores, assignment submissions
• Technical Data: IP address, browser type, device information

PARENT/GUARDIAN DATA:
• Identity and contact information
• Relationship to student

3. HOW WE USE YOUR DATA

We use your personal data for the following purposes:

EDUCATIONAL PURPOSES:
• To provide and maintain our educational services
• To track learning progress and performance
• To generate personalized learning recommendations
• To facilitate communication between students, teachers, and parents

ANALYTICS & IMPROVEMENT:
• To analyze usage patterns and improve our platform
• To develop new features and educational content
• To ensure platform security and prevent fraud

COMMUNICATION:
• To send important updates about classes, assignments, and tests
• To notify about platform updates and new features
• To respond to support requests

4. DATA SHARING

We DO NOT sell student data to third parties.

We may share data with:
• Teachers and administrators at your educational institution
• Parents/guardians (for student accounts)
• Service providers who help us operate the platform (under strict confidentiality agreements)
• Law enforcement when required by law

5. DATA SECURITY

We implement appropriate technical and organizational measures to protect your data:
• All data is encrypted in transit (HTTPS/TLS)
• Data at rest is encrypted using industry-standard encryption
• Access to student data is restricted to authorized personnel only
• Regular security audits and updates
• Secure authentication and password requirements

6. DATA RETENTION

• Student academic data: Retained for the duration of enrollment plus 2 years
• Account data: Retained until account deletion is requested
• Analytics data: Aggregated and anonymized data may be retained longer for research

7. YOUR RIGHTS

Under data protection laws, you have rights including:
• Right to access your personal data
• Right to correct inaccurate data
• Right to request deletion of your data
• Right to object to processing of your data
• Right to data portability
• Right to withdraw consent

To exercise these rights, contact us at privacy@educationplatform.com

8. PARENTAL RIGHTS

Parents/guardians have the right to:
• Review their child's personal information
• Request correction or deletion of their child's data
• Refuse further collection or use of their child's information
• Be notified of data breaches affecting their child's information

9. COOKIES AND TRACKING

We use cookies and similar tracking technologies to:
• Remember your preferences and settings
• Analyze platform usage and performance
• Provide personalized learning experiences

You can control cookies through your browser settings.

10. THIRD-PARTY SERVICES

Our platform may integrate with third-party services (video conferencing, learning tools). These services have their own privacy policies. We recommend reviewing their policies.

11. CHILDREN'S PRIVACY

Our platform is designed for educational use by students of all ages. We comply with applicable children's privacy laws (COPPA, GDPR) and obtain parental consent when required.

12. INTERNATIONAL DATA TRANSFERS

Your data may be processed in countries outside your residence. We ensure appropriate safeguards are in place for such transfers.

13. CHANGES TO THIS POLICY

We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.

14. CONTACT US

If you have questions about this privacy policy or our data practices:
• Email: privacy@educationplatform.com
• Phone: +91 1800 123 4567
• Address: Education Platform Legal Team, Bangalore, India

15. DATA PROTECTION OFFICER

For data protection concerns, contact our Data Protection Officer:
• Email: dpo@educationplatform.com

---

By using our platform, you acknowledge that you have read and understood this Privacy Policy.`,
  },
];

// Hook
function useLegalDocsMock() {
  // TODO: Fetch legal documents from Supabase or API
  return { docs: MOCK_LEGAL_DOCS };
}

export default function LegalScreen({ navigation }: Props) {
  const { docs } = useLegalDocsMock();
  const [selectedId, setSelectedId] = useState<LegalDocId>('terms');

  const selectedDoc = useMemo(
    () => docs.find((d) => d.id === selectedId) ?? docs[0],
    [docs, selectedId]
  );

  useEffect(() => {
    trackScreenView('LegalScreen');
  }, []);

  const handleSelectDoc = (id: LegalDocId) => {
    setSelectedId(id);
    trackAction('legal_select_doc', 'LegalScreen', { id });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={24} color={FRAMER_COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <T variant="title" weight="bold" style={styles.headerTitle}>
            Legal & privacy
          </T>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Documents List Card */}
        <Card style={styles.documentsCard}>
          <T variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Documents
          </T>

          {docs.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={[
                styles.documentItem,
                selectedId === doc.id && styles.documentItemSelected,
              ]}
              onPress={() => handleSelectDoc(doc.id)}
              accessibilityRole="button"
              accessibilityLabel={`View ${doc.title}`}
              accessibilityState={{ selected: selectedId === doc.id }}
            >
              <View style={styles.documentInfo}>
                <T
                  variant="body"
                  weight="semiBold"
                  style={[
                    styles.documentTitle,
                    selectedId === doc.id && styles.documentTitleSelected,
                  ]}
                >
                  {doc.title}
                </T>
                <T variant="caption" color="textSecondary" style={styles.documentUpdated}>
                  {doc.lastUpdatedLabel}
                </T>
              </View>
              {selectedId === doc.id && (
                <Icon name="check-circle" size={20} color={FRAMER_COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </Card>

        {/* Content Card */}
        <Card style={styles.contentCard}>
          <T variant="subtitle" weight="bold" style={styles.contentTitle}>
            {selectedDoc.title}
          </T>
          <T variant="caption" color="textSecondary" style={styles.contentUpdated}>
            {selectedDoc.lastUpdatedLabel}
          </T>

          <ScrollView
            style={styles.contentScrollView}
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            <T variant="body" style={styles.contentText}>
              {selectedDoc.content}
            </T>
          </ScrollView>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  documentsCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  documentItemSelected: {
    backgroundColor: FRAMER_COLORS.selectedBg,
    borderColor: FRAMER_COLORS.selectedBorder,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
  },
  documentTitleSelected: {
    color: FRAMER_COLORS.primary,
  },
  documentUpdated: {
    fontSize: 12,
  },
  contentCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: FRAMER_COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
    minHeight: 400,
  },
  contentTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 8,
  },
  contentUpdated: {
    fontSize: 12,
    marginBottom: 16,
  },
  contentScrollView: {
    maxHeight: 500,
  },
  contentText: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    lineHeight: 22,
  },
});
