/**
 * RegisterScreen - User registration interface
 * Multi-role registration with Material Design 3 components
 * Error-free React Native 0.81+ implementation
 * Manushi Coaching Platform
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import CoachingButton from '../../components/core/CoachingButton';
import CoachingTextField from '../../components/core/CoachingTextField';
import { LightTheme, getRoleColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';

interface RegisterScreenProps {
  role: UserRole;
  onRegister: (userData: RegistrationData, role: UserRole) => void;
  onBackToLogin: () => void;
  onBackToRoleSelection: () => void;
}

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  grade?: string; // For students
  subjects?: string; // For teachers
  childName?: string; // For parents
  organization?: string; // For admins
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  grade?: string;
  subjects?: string;
  childName?: string;
  organization?: string;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  role,
  onRegister,
  onBackToLogin,
  onBackToRoleSelection,
}) => {
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: '',
    grade: '',
    subjects: '',
    childName: '',
    organization: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentStep, setCurrentStep] = useState(1);

  const roleColors = getRoleColors(role);
  const totalSteps = 2;

  const updateFormData = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    // Role-specific validations
    if (role === 'Student' && !formData.grade?.trim()) {
      newErrors.grade = 'Grade/Class is required';
    }

    if (role === 'Teacher' && !formData.subjects?.trim()) {
      newErrors.subjects = 'Subject specialization is required';
    }

    if (role === 'Parent' && !formData.childName?.trim()) {
      newErrors.childName = 'Child\'s name is required';
    }

    if (role === 'Admin' && !formData.organization?.trim()) {
      newErrors.organization = 'Organization name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleRegister = async () => {
    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await onRegister(formData, role);
    } catch (error) {
      Alert.alert('Registration Failed', 'Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (userRole: UserRole) => {
    switch (userRole) {
      case 'Student': return '🎓';
      case 'Teacher': return '👩‍🏫';
      case 'Parent': return '👨‍👩‍👧‍👦';
      case 'Admin': return '⚙️';
    }
  };

  const getRoleSpecificFields = () => {
    switch (role) {
      case 'Student':
        return (
          <CoachingTextField
            label="Grade/Class"
            value={formData.grade || ''}
            onChangeText={(text) => updateFormData('grade', text)}
            error={errors.grade}
            placeholder="e.g., Grade 10, Class XII"
            leadingIcon={<Text style={styles.inputIcon}>📚</Text>}
            testID="grade-input"
          />
        );
      
      case 'Teacher':
        return (
          <CoachingTextField
            label="Subject Specialization"
            value={formData.subjects || ''}
            onChangeText={(text) => updateFormData('subjects', text)}
            error={errors.subjects}
            placeholder="e.g., Mathematics, Physics"
            leadingIcon={<Text style={styles.inputIcon}>📖</Text>}
            testID="subjects-input"
          />
        );
      
      case 'Parent':
        return (
          <CoachingTextField
            label="Child's Name"
            value={formData.childName || ''}
            onChangeText={(text) => updateFormData('childName', text)}
            error={errors.childName}
            placeholder="Enter your child's name"
            leadingIcon={<Text style={styles.inputIcon}>👶</Text>}
            testID="child-name-input"
          />
        );
      
      case 'Admin':
        return (
          <CoachingTextField
            label="Organization Name"
            value={formData.organization || ''}
            onChangeText={(text) => updateFormData('organization', text)}
            error={errors.organization}
            placeholder="Enter organization name"
            leadingIcon={<Text style={styles.inputIcon}>🏢</Text>}
            testID="organization-input"
          />
        );
      
      default:
        return null;
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtitle}>Let's start with your basic details</Text>

      <View style={styles.nameContainer}>
        <View style={styles.halfInput}>
          <CoachingTextField
            label="First Name"
            value={formData.firstName}
            onChangeText={(text) => updateFormData('firstName', text)}
            error={errors.firstName}
            placeholder="John"
            leadingIcon={<Text style={styles.inputIcon}>👤</Text>}
            testID="first-name-input"
          />
        </View>
        <View style={styles.halfInput}>
          <CoachingTextField
            label="Last Name"
            value={formData.lastName}
            onChangeText={(text) => updateFormData('lastName', text)}
            error={errors.lastName}
            placeholder="Doe"
            testID="last-name-input"
          />
        </View>
      </View>

      <CoachingTextField
        label="Email Address"
        value={formData.email}
        onChangeText={(text) => updateFormData('email', text)}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="john.doe@example.com"
        leadingIcon={<Text style={styles.inputIcon}>📧</Text>}
        testID="email-input"
      />

      <CoachingTextField
        label="Password"
        value={formData.password}
        onChangeText={(text) => updateFormData('password', text)}
        error={errors.password}
        secureTextEntry={!showPassword}
        placeholder="Create a strong password"
        helperText="Must contain uppercase, lowercase, and number"
        leadingIcon={<Text style={styles.inputIcon}>🔒</Text>}
        trailingIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.inputIcon}>
              {showPassword ? "👁️" : "🙈"}
            </Text>
          </TouchableOpacity>
        }
        testID="password-input"
      />

      <CoachingTextField
        label="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(text) => updateFormData('confirmPassword', text)}
        error={errors.confirmPassword}
        secureTextEntry={!showConfirmPassword}
        placeholder="Confirm your password"
        leadingIcon={<Text style={styles.inputIcon}>🔐</Text>}
        trailingIcon={
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Text style={styles.inputIcon}>
              {showConfirmPassword ? "👁️" : "🙈"}
            </Text>
          </TouchableOpacity>
        }
        testID="confirm-password-input"
      />

      <CoachingButton
        title="Next Step"
        variant="primary"
        size="large"
        onPress={handleNextStep}
        style={styles.nextButton}
        testID="next-step-button"
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Additional Information</Text>
      <Text style={styles.stepSubtitle}>Tell us more about yourself</Text>

      <CoachingTextField
        label="Phone Number (Optional)"
        value={formData.phoneNumber || ''}
        onChangeText={(text) => updateFormData('phoneNumber', text)}
        error={errors.phoneNumber}
        keyboardType="phone-pad"
        placeholder="+1 (555) 123-4567"
        leadingIcon={<Text style={styles.inputIcon}>📱</Text>}
        testID="phone-input"
      />

      {getRoleSpecificFields()}

      <View style={styles.buttonContainer}>
        <CoachingButton
          title="Back"
          variant="secondary"
          size="medium"
          onPress={handlePrevStep}
          style={styles.backButton}
          testID="back-step-button"
        />

        <CoachingButton
          title={isLoading ? "Creating Account..." : "Create Account"}
          variant="primary"
          size="medium"
          onPress={handleRegister}
          disabled={isLoading}
          style={styles.registerButton}
          testID="register-button"
        />
      </View>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={roleColors.primary} />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: roleColors.primary }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={currentStep === 1 ? onBackToLogin : handlePrevStep}
              testID="header-back-button"
              accessibilityRole="button"
              accessibilityLabel={currentStep === 1 ? "Go back to login" : "Go to previous step"}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.roleHeader}>
              <Text style={styles.roleIcon}>{getRoleIcon(role)}</Text>
              <Text style={styles.roleTitle}>Create {role} Account</Text>
              <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {Array.from({ length: totalSteps }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index < currentStep 
                        ? LightTheme.OnPrimary 
                        : 'rgba(255, 255, 255, 0.3)'
                    }
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              {currentStep === 1 ? renderStep1() : renderStep2()}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text 
                  style={[styles.linkText, { color: roleColors.primary }]}
                  onPress={onBackToLogin}
                >
                  Sign In
                </Text>
              </Text>
              <Text style={styles.privacyText}>
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Spacing.LG,
    paddingBottom: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.LG,
    left: Spacing.LG,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.SM,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  backIcon: {
    fontSize: 20,
    color: LightTheme.OnPrimary,
  },
  roleHeader: {
    alignItems: 'center',
    marginTop: Spacing.LG,
  },
  roleIcon: {
    fontSize: 40,
    marginBottom: Spacing.SM,
  },
  roleTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnPrimary,
    marginBottom: Spacing.XS,
    textAlign: 'center',
  },
  progressText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnPrimary,
    opacity: 0.8,
    marginBottom: Spacing.MD,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: Spacing.XS,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
    marginTop: -Spacing.MD,
  },
  formCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    shadowColor: LightTheme.OnSurface,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  stepSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -Spacing.MD,
  },
  halfInput: {
    flex: 0.48,
  },
  inputIcon: {
    fontSize: 16,
  },
  nextButton: {
    marginTop: Spacing.MD,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.LG,
  },
  registerButton: {
    flex: 0.6,
  },
  footer: {
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.MD,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  linkText: {
    fontWeight: Typography.labelMedium.fontWeight,
  },
  privacyText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    lineHeight: Typography.bodySmall.lineHeight,
  },
});

export default RegisterScreen;