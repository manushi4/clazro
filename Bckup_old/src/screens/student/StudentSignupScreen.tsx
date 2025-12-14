/**
 * StudentSignupScreen
 * Multi-step signup form with complete Framer design system
 * Features: Progress bar, animated steps, input validation, smooth transitions
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  FadeInUp,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { T } from '../../ui/typography/T';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';
import { useAuth } from '../../context/AuthContext';
import { FramerButton } from '../../ui/framer/components';

// Framer Design System - Complete Colors
const COLORS = {
  primary: '#2D5BFF',
  success: '#22C55E',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  background: '#F7F7F7',
  card: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#374151',
  textTertiary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#DADCE0',
  borderFocus: '#2D5BFF',
  stroke: '#E5E7EB',
  clearButton: '#E5E7EB',
  iconBg: 'rgba(45, 91, 255, 0.15)',
};

const SPACING = {
  logoSize: 56,
  inputHeight: 48,
  buttonHeight: 52,
  progressBarHeight: 6,
  stepDotSize: 8,
  iconContainer: 32,
};

const ANIMATION = {
  spring: { stiffness: 120, damping: 15 },
  springFast: { stiffness: 200, damping: 15 },
  delays: {
    header: 0,
    form: 100,
    button: 200,
  },
};

type Props = NativeStackScreenProps<any, 'StudentSignupScreen'>;

interface StudentSignupScreenProps extends Partial<Props> {
  onBackToLogin?: () => void;
  onSignupSuccess?: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  instituteCode: string;
  grade: string;
}

interface StepConfig {
  title: string;
  subtitle: string;
  fields: (keyof FormData)[];
}

const STEPS: StepConfig[] = [
  {
    title: 'Personal Information',
    subtitle: 'Tell us about yourself',
    fields: ['fullName', 'email', 'phone'],
  },
  {
    title: 'Create Password',
    subtitle: 'Secure your account',
    fields: ['password', 'confirmPassword'],
  },
  {
    title: 'Institute Details',
    subtitle: 'Connect to your institute',
    fields: ['instituteCode', 'grade'],
  },
];

const StudentSignupScreen: React.FC<StudentSignupScreenProps> = ({
  navigation,
  onBackToLogin,
  onSignupSuccess,
}) => {
  const { signUp } = useAuth();

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    instituteCode: '',
    grade: '',
  });

  // UI state
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Refs
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const focusedFieldRef = useRef<keyof FormData | null>(null);

  // Animations
  const shakeAnimation = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    console.log('🎬 [StudentSignupScreen] Component mounted');
    trackScreenView('StudentSignupScreen');
    // Ensure keyboard is dismissed when screen loads
    Keyboard.dismiss();
    console.log('⌨️ [StudentSignupScreen] Initial keyboard dismiss called');
  }, []);

  useEffect(() => {
    console.log(`📊 [StudentSignupScreen] Step changed to: ${currentStep + 1}/${STEPS.length}`);
    console.log(`📝 [StudentSignupScreen] Current step fields:`, STEPS[currentStep].fields);

    // Animate progress bar
    const progress = ((currentStep + 1) / STEPS.length) * 100;
    progressWidth.value = withSpring(progress, {
      damping: 20,
      stiffness: 100,
    });

    // Ensure keyboard is dismissed when step changes
    Keyboard.dismiss();
    console.log('⌨️ [StudentSignupScreen] Keyboard dismissed on step change');

    // Clear focused field ref when step changes
    focusedFieldRef.current = null;
    console.log('🎯 [StudentSignupScreen] Focused field ref cleared');
  }, [currentStep]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const triggerShake = () => {
    shakeAnimation.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const validateField = (field: keyof FormData, value: string): string | null => {
    switch (field) {
      case 'fullName':
        return value.trim().length < 2 ? 'Name must be at least 2 characters' : null;
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email address' : null;
      case 'phone':
        return !/^\d{10}$/.test(value.replace(/\D/g, '')) ? 'Phone must be 10 digits' : null;
      case 'password':
        return value.length < 8 ? 'Password must be at least 8 characters' : null;
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords do not match' : null;
      case 'instituteCode':
        return value.trim().length !== 6 ? 'Institute code must be 6 characters' : null;
      case 'grade':
        return !value.trim() ? 'Please select your grade' : null;
      default:
        return null;
    }
  };

  const validateCurrentStep = (): boolean => {
    const currentFields = STEPS[currentStep].fields;
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let hasError = false;

    currentFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasError = true;
      }
    });

    setErrors(newErrors);

    if (hasError) {
      triggerShake();
    }

    return !hasError;
  };

  const handleNext = () => {
    console.log(`⏭️ [StudentSignupScreen] handleNext called - Current step: ${currentStep + 1}`);

    if (!validateCurrentStep()) {
      console.log('❌ [StudentSignupScreen] Validation failed - staying on current step');
      return;
    }

    trackAction('signup_step_completed', 'StudentSignupScreen', {
      step: currentStep + 1,
    });

    if (currentStep < STEPS.length - 1) {
      console.log(`➡️ [StudentSignupScreen] Moving to step ${currentStep + 2}`);
      // Dismiss keyboard before moving to next step
      Keyboard.dismiss();
      console.log('⌨️ [StudentSignupScreen] Keyboard dismissed before step change');
      // Small delay for smooth transition
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        console.log(`✅ [StudentSignupScreen] Step changed to ${currentStep + 2}`);
      }, 100);
    } else {
      console.log('🎉 [StudentSignupScreen] Final step - calling handleSignup');
      handleSignup();
    }
  };

  const handleBack = () => {
    console.log(`⬅️ [StudentSignupScreen] handleBack called - Current step: ${currentStep + 1}`);

    if (currentStep > 0) {
      console.log(`⬅️ [StudentSignupScreen] Going back to step ${currentStep}`);
      setCurrentStep(currentStep - 1);
      setErrors({});
    } else {
      console.log('🔙 [StudentSignupScreen] Going back to login screen');
      if (onBackToLogin) {
        onBackToLogin();
      } else {
        safeNavigate('StudentLoginScreen');
      }
    }
  };

  const handleSignup = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        instituteCode: formData.instituteCode,
        grade: formData.grade,
        role: 'student',
      });

      trackAction('signup_completed', 'StudentSignupScreen', {
        email: formData.email,
      });

      if (onSignupSuccess) {
        onSignupSuccess();
      } else {
        safeNavigate('StudentDashboard');
      }
    } catch (error: any) {
      setErrors({ email: error.message || 'Signup failed. Please try again.' });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    console.log(`✏️ [StudentSignupScreen] Field "${field}" changed:`, value.substring(0, 20));
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderInput = (
    field: keyof FormData,
    placeholder: string,
    icon: string,
    options?: {
      secureTextEntry?: boolean;
      keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      maxLength?: number;
    }
  ) => {
    console.log(`🎨 [StudentSignupScreen] Rendering input for "${field}"`);
    const hasError = !!errors[field];
    const isPassword = field === 'password';
    const isConfirmPassword = field === 'confirmPassword';
    const showPasswordToggle = isPassword || isConfirmPassword;
    const isPasswordVisible = isPassword ? showPassword : showConfirmPassword;

    return (
      <View style={styles.inputGroup} key={field}>
        <View
          style={[
            styles.inputWrapper,
            hasError && styles.inputError,
          ]}
        >
          <View style={styles.inputIcon}>
            <Icon name={icon} size={20} color={COLORS.textMuted} />
          </View>

          <TextInput
            ref={ref => { inputRefs.current[field] = ref; }}
            value={formData[field]}
            onChangeText={value => updateFormData(field, value)}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={options?.secureTextEntry && !isPasswordVisible}
            keyboardType={options?.keyboardType || 'default'}
            autoCapitalize={options?.autoCapitalize || 'sentences'}
            autoFocus={false}
            maxLength={options?.maxLength}
            onFocus={() => {
              console.log(`🎯 [StudentSignupScreen] Field FOCUSED: "${field}" (step ${currentStep + 1})`);
              focusedFieldRef.current = field;
            }}
            onBlur={() => {
              console.log(`👋 [StudentSignupScreen] Field BLURRED: "${field}" (step ${currentStep + 1})`);
              focusedFieldRef.current = null;
            }}
            blurOnSubmit={STEPS[currentStep].fields.indexOf(field) === STEPS[currentStep].fields.length - 1}
            returnKeyType={
              STEPS[currentStep].fields.indexOf(field) === STEPS[currentStep].fields.length - 1
                ? currentStep === STEPS.length - 1 ? 'done' : 'next'
                : 'next'
            }
            onSubmitEditing={() => {
              console.log(`⏎ [StudentSignupScreen] onSubmitEditing called for "${field}"`);
              const currentFields = STEPS[currentStep].fields;
              const currentIndex = currentFields.indexOf(field);
              if (currentIndex < currentFields.length - 1) {
                // Move to next field in current step
                const nextField = currentFields[currentIndex + 1];
                console.log(`➡️ [StudentSignupScreen] Moving to next field: "${nextField}"`);
                inputRefs.current[nextField]?.focus();
              } else {
                // Last field in step - dismiss keyboard, don't auto-advance
                console.log('⌨️ [StudentSignupScreen] Last field - dismissing keyboard');
                Keyboard.dismiss();
              }
            }}
            style={styles.input}
          />

          {/* Clear button */}
          {formData[field].length > 0 && !showPasswordToggle && (
            <TouchableOpacity
              onPress={() => updateFormData(field, '')}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={14} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}

          {/* Password toggle */}
          {showPasswordToggle && (
            <TouchableOpacity
              onPress={() => {
                if (isPassword) {
                  setShowPassword(!showPassword);
                } else {
                  setShowConfirmPassword(!showConfirmPassword);
                }
              }}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                size={20}
                color={COLORS.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Error message */}
        {hasError && (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
            <T style={styles.errorText}>{errors[field]}</T>
          </Animated.View>
        )}
      </View>
    );
  };

  const currentStepConfig = STEPS[currentStep];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.delay(ANIMATION.delays.header).duration(400)}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                accessibilityLabel="Go back"
              >
                <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Icon name="school" size={28} color={COLORS.primary} />
                </View>
                <T style={styles.logoText}>Manushi</T>
              </View>
            </View>
          </Animated.View>

          {/* Progress Bar */}
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <View style={styles.progressSection}>
              {/* Step indicators */}
              <View style={styles.stepsContainer}>
                {STEPS.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stepDot,
                      index <= currentStep && styles.stepDotActive,
                    ]}
                  />
                ))}
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, progressStyle]} />
              </View>

              {/* Step info */}
              <T style={styles.stepText}>
                Step {currentStep + 1} of {STEPS.length}
              </T>
            </View>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={shakeStyle}>
            <View style={styles.card}>
              {/* Step Title */}
              <T style={styles.stepTitle}>{currentStepConfig.title}</T>
              <T style={styles.stepSubtitle}>{currentStepConfig.subtitle}</T>

              {/* Form Fields */}
              <View style={styles.formFields}>
                {currentStep === 0 && (
                  <>
                    {renderInput('fullName', 'Full Name', 'person', {
                      autoCapitalize: 'words',
                    })}
                    {renderInput('email', 'Email Address', 'mail-outline', {
                      keyboardType: 'email-address',
                      autoCapitalize: 'none',
                    })}
                    {renderInput('phone', 'Phone Number', 'phone', {
                      keyboardType: 'phone-pad',
                      maxLength: 10,
                    })}
                  </>
                )}

                {currentStep === 1 && (
                  <>
                    {renderInput('password', 'Password', 'lock-outline', {
                      secureTextEntry: true,
                      autoCapitalize: 'none',
                    })}
                    {renderInput('confirmPassword', 'Confirm Password', 'lock-outline', {
                      secureTextEntry: true,
                      autoCapitalize: 'none',
                    })}

                    {/* Password requirements */}
                    <View style={styles.passwordHints}>
                      <View style={styles.hintRow}>
                        <Icon
                          name={formData.password.length >= 8 ? 'check-circle' : 'radio-button-unchecked'}
                          size={16}
                          color={formData.password.length >= 8 ? COLORS.success : COLORS.textTertiary}
                        />
                        <T style={styles.hintText}>At least 8 characters</T>
                      </View>
                      <View style={styles.hintRow}>
                        <Icon
                          name={formData.password === formData.confirmPassword && formData.confirmPassword ? 'check-circle' : 'radio-button-unchecked'}
                          size={16}
                          color={formData.password === formData.confirmPassword && formData.confirmPassword ? COLORS.success : COLORS.textTertiary}
                        />
                        <T style={styles.hintText}>Passwords match</T>
                      </View>
                    </View>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    {renderInput('instituteCode', 'Institute Code', 'business', {
                      autoCapitalize: 'characters',
                      maxLength: 6,
                    })}
                    {renderInput('grade', 'Grade/Class', 'school', {
                      autoCapitalize: 'words',
                    })}

                    {/* Institute help text */}
                    <View style={styles.helpBox}>
                      <Icon name="info-outline" size={16} color={COLORS.primary} />
                      <T style={styles.helpText}>
                        Get your institute code from your teacher or scan the QR code provided by your institute.
                      </T>
                    </View>
                  </>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInUp.delay(ANIMATION.delays.button).springify()}>
            <View style={styles.actions}>
              <FramerButton
                title={currentStep === STEPS.length - 1 ? 'Create Account' : 'Continue'}
                onPress={handleNext}
                loading={loading}
                style={styles.primaryButton}
              />

              {/* Login link */}
              <View style={styles.loginLink}>
                <T style={styles.loginText}>Already have an account? </T>
                <TouchableOpacity
                  onPress={() => {
                    if (onBackToLogin) {
                      onBackToLogin();
                    } else {
                      safeNavigate('StudentLoginScreen');
                    }
                  }}
                  accessibilityLabel="Go to login"
                >
                  <T style={styles.loginLinkText}>Sign In</T>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 40, // Balance the back button
  },
  logo: {
    width: SPACING.logoSize,
    height: SPACING.logoSize,
    borderRadius: 16,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  progressSection: {
    marginBottom: 24,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepDot: {
    width: SPACING.stepDotSize,
    height: SPACING.stepDotSize,
    borderRadius: SPACING.stepDotSize / 2,
    backgroundColor: COLORS.stroke,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressBarBg: {
    height: SPACING.progressBarHeight,
    backgroundColor: COLORS.stroke,
    borderRadius: SPACING.progressBarHeight / 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.progressBarHeight / 2,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textAlign: 'right',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  formFields: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: SPACING.inputHeight,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  inputFocused: {
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    width: SPACING.iconContainer,
    height: SPACING.iconContainer,
    borderRadius: 8,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.clearButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.error,
    marginLeft: 12,
  },
  passwordHints: {
    gap: 8,
    marginTop: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.iconBg,
    borderRadius: 10,
    marginTop: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    // Additional styles if needed
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default StudentSignupScreen;
