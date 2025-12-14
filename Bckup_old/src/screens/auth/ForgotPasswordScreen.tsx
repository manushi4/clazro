/**
 * ForgotPasswordScreen - Phase 42.3: Forgot Password Implementation
 * Material Design 3 compliant forgot password flow
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeOut, SlideInUp, SlideInDown, ZoomIn, BounceIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

// Import Supabase Auth
import { supabase } from '../../services/supabase';

const { width, height } = Dimensions.get('window');

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
  onResetSent: (email: string) => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBackToLogin,
  onResetSent,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendReset = async () => {
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    setIsLoading(true);

    try {
      // Send password reset email using Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'manushicoaching://reset-password',
      });

      if (error) {
        throw error;
      }

      // Show success message
      Alert.alert(
        'Reset Link Sent!',
        `A password reset link has been sent to ${email}. Please check your email and follow the instructions to reset your password.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onResetSent(email);
              onBackToLogin();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: LightTheme.Background }]}>
      <StatusBar backgroundColor={LightTheme.Primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: LightTheme.Primary }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackToLogin}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={LightTheme.OnPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: LightTheme.OnPrimary }]}>
          Reset Password
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.heroSection}>
          <View style={[styles.iconContainer, { backgroundColor: LightTheme.primaryContainer }]}>
            <Icon name="lock-reset" size={48} color={LightTheme.OnPrimaryContainer} />
          </View>
          <Text style={[styles.title, { color: LightTheme.OnBackground }]}>
            Forgot Your Password?
          </Text>
          <Text style={[styles.subtitle, { color: LightTheme.OnSurfaceVariant }]}>
            No worries! Enter your email address and we'll send you a link to reset your password.
          </Text>
        </Animated.View>

        {/* Form Section */}
        <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.formSection}>
          <View style={[styles.formContainer, { backgroundColor: LightTheme.Surface }]}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: LightTheme.OnSurface }]}>
                Email Address *
              </Text>
              <View style={[
                styles.inputContainer, 
                { 
                  borderColor: emailError ? LightTheme.Error : LightTheme.Outline,
                  backgroundColor: LightTheme.Background,
                }
              ]}>
                <Icon 
                  name="email" 
                  size={20} 
                  color={emailError ? LightTheme.Error : LightTheme.OnSurfaceVariant} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    { color: LightTheme.OnSurface }
                  ]}
                  placeholder="Enter your email address"
                  placeholderTextColor={LightTheme.Outline}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>
              {emailError ? (
                <Animated.View animation="fadeInLeft" duration={300}>
                  <Text style={[styles.errorText, { color: LightTheme.Error }]}>
                    {emailError}
                  </Text>
                </Animated.View>
              ) : null}
            </View>

            {/* Send Reset Button */}
            <TouchableOpacity
              style={[
                styles.resetButton,
                { 
                  backgroundColor: isLoading || !email.trim() 
                    ? LightTheme.Outline 
                    : LightTheme.Primary 
                }
              ]}
              onPress={handleSendReset}
              disabled={isLoading || !email.trim()}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.resetButtonText, { color: LightTheme.OnSurface }]}>
                    Sending...
                  </Text>
                </View>
              ) : (
                <>
                  <Icon name="send" size={20} color={LightTheme.OnPrimary} style={styles.buttonIcon} />
                  <Text style={[styles.resetButtonText, { color: LightTheme.OnPrimary }]}>
                    Send Reset Link
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpSection}>
              <Icon name="info" size={16} color={LightTheme.OnSurfaceVariant} />
              <Text style={[styles.helpText, { color: LightTheme.OnSurfaceVariant }]}>
                The reset link will expire in 24 hours. Check your spam folder if you don't receive it.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Alternative Actions */}
        <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.actionsSection}>
          <Text style={[styles.alternativeText, { color: LightTheme.OnSurfaceVariant }]}>
            Remember your password?
          </Text>
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={onBackToLogin}
            activeOpacity={0.7}
          >
            <Text style={[styles.backToLoginText, { color: LightTheme.Primary }]}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Support Section */}
        <Animated.View entering={FadeInUp.duration(800).delay(600)} style={styles.supportSection}>
          <View style={[styles.supportCard, { backgroundColor: LightTheme.secondaryContainer }]}>
            <Icon name="help" size={24} color={LightTheme.OnSecondaryContainer} />
            <Text style={[styles.supportTitle, { color: LightTheme.OnSecondaryContainer }]}>
              Still Having Trouble?
            </Text>
            <Text style={[styles.supportText, { color: LightTheme.OnSecondaryContainer }]}>
              Contact our support team for additional assistance with your account.
            </Text>
            <TouchableOpacity
              style={[styles.supportButton, { backgroundColor: LightTheme.Secondary }]}
              onPress={() => setSupportModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.supportButtonText, { color: LightTheme.OnSecondary }]}>
                Contact Support
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Comprehensive Support Modal */}
      <Modal
        visible={supportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.supportModal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎧 Contact Support</Text>
                <TouchableOpacity
                  onPress={() => setSupportModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color={LightTheme.OnSurface} />
                </TouchableOpacity>
              </View>

              <Text style={styles.supportDescription}>
                Our support team is ready to help you with account recovery, technical issues, and any questions you may have.
              </Text>

              {/* Quick Actions */}
              <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
                
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => Alert.alert('Chat Started', 'Connecting you to a live support agent...')}
                >
                  <View style={styles.quickActionContent}>
                    <View style={styles.quickActionIconContainer}>
                      <Icon name="chat" size={20} color={LightTheme.OnPrimaryContainer} />
                    </View>
                    <View style={styles.quickActionText}>
                      <Text style={styles.quickActionTitle}>Live Chat Support</Text>
                      <Text style={styles.quickActionSubtitle}>Average response: 2 minutes</Text>
                    </View>
                    <View style={styles.statusIndicator}>
                      <View style={styles.onlineStatus} />
                      <Text style={styles.statusText}>Online</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => Alert.alert('Video Call', 'Scheduling video support session...')}
                >
                  <View style={styles.quickActionContent}>
                    <View style={styles.quickActionIconContainer}>
                      <Icon name="video-call" size={20} color={LightTheme.OnPrimaryContainer} />
                    </View>
                    <View style={styles.quickActionText}>
                      <Text style={styles.quickActionTitle}>Video Support</Text>
                      <Text style={styles.quickActionSubtitle}>For complex technical issues</Text>
                    </View>
                    <Icon name="arrow-forward" size={20} color={LightTheme.OnSurfaceVariant} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => Alert.alert('Ticket Created', 'Support ticket #12345 created. We\'ll respond within 2 hours.')}
                >
                  <View style={styles.quickActionContent}>
                    <View style={styles.quickActionIconContainer}>
                      <Icon name="support" size={20} color={LightTheme.OnPrimaryContainer} />
                    </View>
                    <View style={styles.quickActionText}>
                      <Text style={styles.quickActionTitle}>Create Support Ticket</Text>
                      <Text style={styles.quickActionSubtitle}>For detailed follow-up assistance</Text>
                    </View>
                    <Icon name="arrow-forward" size={20} color={LightTheme.OnSurfaceVariant} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Contact Methods */}
              <View style={styles.contactMethodsSection}>
                <Text style={styles.sectionTitle}>📞 Contact Methods</Text>
                
                <View style={styles.contactMethodsGrid}>
                  <TouchableOpacity 
                    style={styles.contactMethodCard}
                    onPress={() => Alert.alert('Phone Support', 'Calling +1-800-COACHING...')}
                  >
                    <Icon name="phone" size={24} color={LightTheme.Primary} />
                    <Text style={styles.contactMethodTitle}>Phone</Text>
                    <Text style={styles.contactMethodText}>+1-800-COACHING</Text>
                    <Text style={styles.contactMethodHours}>24/7 Available</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.contactMethodCard}
                    onPress={() => Alert.alert('Email Support', 'Opening email to support@manushi-coaching.com...')}
                  >
                    <Icon name="email" size={24} color={LightTheme.Primary} />
                    <Text style={styles.contactMethodTitle}>Email</Text>
                    <Text style={styles.contactMethodText}>support@manushi</Text>
                    <Text style={styles.contactMethodHours}>Response: 2 hours</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Knowledge Base */}
              <View style={styles.knowledgeBaseSection}>
                <Text style={styles.sectionTitle}>📚 Self-Help Resources</Text>
                
                {[
                  { title: 'Password Recovery Guide', icon: 'lock-reset', desc: 'Step-by-step password recovery process' },
                  { title: 'Account Troubleshooting', icon: 'build', desc: 'Common account issues and solutions' },
                  { title: 'Security Best Practices', icon: 'security', desc: 'Keep your account safe and secure' },
                  { title: 'FAQs & Common Issues', icon: 'help', desc: 'Answers to frequently asked questions' }
                ].map((item, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.knowledgeBaseItem}
                    onPress={() => Alert.alert(item.title, `Opening ${item.title} guide...`)}
                  >
                    <View style={styles.knowledgeBaseIcon}>
                      <Icon name={item.icon} size={20} color={LightTheme.Primary} />
                    </View>
                    <View style={styles.knowledgeBaseContent}>
                      <Text style={styles.knowledgeBaseTitle}>{item.title}</Text>
                      <Text style={styles.knowledgeBaseDesc}>{item.desc}</Text>
                    </View>
                    <Icon name="arrow-forward" size={16} color={LightTheme.OnSurfaceVariant} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Community Support */}
              <View style={styles.communitySection}>
                <Text style={styles.sectionTitle}>👥 Community Support</Text>
                <TouchableOpacity 
                  style={styles.communityButton}
                  onPress={() => Alert.alert('Community Forum', 'Opening Manushi Coaching community forum...')}
                >
                  <View style={styles.communityContent}>
                    <Icon name="forum" size={24} color={LightTheme.OnPrimaryContainer} />
                    <View style={styles.communityText}>
                      <Text style={styles.communityTitle}>Join Community Forum</Text>
                      <Text style={styles.communitySubtitle}>Connect with other users and get peer support</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Support Hours */}
              <View style={styles.supportHoursSection}>
                <Text style={styles.sectionTitle}>⏰ Support Hours</Text>
                <View style={styles.hoursContainer}>
                  <View style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>Live Chat & Phone:</Text>
                    <Text style={styles.hoursTime}>24/7 Available</Text>
                  </View>
                  <View style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>Email Support:</Text>
                    <Text style={styles.hoursTime}>Response within 2 hours</Text>
                  </View>
                  <View style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>Video Support:</Text>
                    <Text style={styles.hoursTime}>Monday - Friday, 9 AM - 8 PM EST</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: Spacing.SM,
    marginRight: Spacing.SM,
  },
  headerTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: Typography.titleLarge.fontWeight as any,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.XXL,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.LG,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    textAlign: 'center',
    marginBottom: Spacing.MD,
  },
  subtitle: {
    fontSize: Typography.bodyLarge.fontSize,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.MD,
  },
  formSection: {
    paddingHorizontal: Spacing.LG,
    marginBottom: Spacing.XL,
  },
  formContainer: {
    padding: Spacing.LG,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputGroup: {
    marginBottom: Spacing.LG,
  },
  inputLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '500',
    marginBottom: Spacing.SM,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.MD,
    height: 56,
  },
  inputIcon: {
    marginRight: Spacing.SM,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.bodyLarge.fontSize,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: Typography.bodySmall.fontSize,
    marginTop: Spacing.XS,
    marginLeft: Spacing.SM,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    marginBottom: Spacing.LG,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: Spacing.SM,
  },
  resetButtonText: {
    fontSize: Typography.labelLarge.fontSize,
    fontWeight: Typography.labelLarge.fontWeight as any,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.SM,
  },
  helpText: {
    fontSize: Typography.bodySmall.fontSize,
    marginLeft: Spacing.SM,
    lineHeight: 18,
    flex: 1,
  },
  actionsSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    marginBottom: Spacing.XL,
  },
  alternativeText: {
    fontSize: Typography.bodyMedium.fontSize,
    marginBottom: Spacing.SM,
  },
  backToLoginButton: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.LG,
  },
  backToLoginText: {
    fontSize: Typography.labelLarge.fontSize,
    fontWeight: Typography.labelLarge.fontWeight as any,
  },
  supportSection: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XXL,
  },
  supportCard: {
    padding: Spacing.LG,
    borderRadius: 16,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    marginTop: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  supportText: {
    fontSize: Typography.bodyMedium.fontSize,
    textAlign: 'center',
    marginBottom: Spacing.LG,
    lineHeight: 20,
  },
  supportButton: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.LG,
    borderRadius: 20,
  },
  supportButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontWeight: Typography.labelMedium.fontWeight as any,
  },
  // Support Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportModal: {
    width: width * 0.95,
    maxHeight: height * 0.9,
    backgroundColor: LightTheme.Surface,
    borderRadius: 20,
    padding: Spacing.LG,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  modalTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontWeight: Typography.headlineSmall.fontWeight as any,
    color: LightTheme.OnSurface,
  },
  closeButton: {
    padding: Spacing.SM,
  },
  supportDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.LG,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  quickActionsSection: {
    marginBottom: Spacing.LG,
  },
  quickActionButton: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LightTheme.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight as any,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  quickActionSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: Spacing.XS,
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#4CAF50',
    fontWeight: '600',
  },
  contactMethodsSection: {
    marginBottom: Spacing.LG,
  },
  contactMethodsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactMethodCard: {
    flex: 1,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: Spacing.MD,
    alignItems: 'center',
    marginHorizontal: Spacing.XS,
  },
  contactMethodTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight as any,
    color: LightTheme.OnSurface,
    marginTop: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  contactMethodText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  contactMethodHours: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.Primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  knowledgeBaseSection: {
    marginBottom: Spacing.LG,
  },
  knowledgeBaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 8,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  knowledgeBaseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LightTheme.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  knowledgeBaseContent: {
    flex: 1,
  },
  knowledgeBaseTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: Typography.titleSmall.fontWeight as any,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  knowledgeBaseDesc: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  communitySection: {
    marginBottom: Spacing.LG,
  },
  communityButton: {
    backgroundColor: LightTheme.primaryContainer,
    borderRadius: 12,
    padding: Spacing.MD,
  },
  communityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityText: {
    flex: 1,
    marginLeft: Spacing.MD,
  },
  communityTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    color: LightTheme.OnPrimaryContainer,
    marginBottom: Spacing.XS,
  },
  communitySubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnPrimaryContainer,
  },
  supportHoursSection: {
    marginBottom: Spacing.MD,
  },
  hoursContainer: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: Spacing.MD,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  hoursDay: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '600',
  },
  hoursTime: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
  },
});

export default ForgotPasswordScreen;