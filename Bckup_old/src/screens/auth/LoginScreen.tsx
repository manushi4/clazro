/**
 * LoginScreen - User authentication interface
 * Multi-role login with Material Design 3 components
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

interface LoginScreenProps {
  role: UserRole;
  onLogin: (email: string, password: string, role: UserRole) => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
  onBackToRoleSelection: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  role,
  onLogin,
  onForgotPassword,
  onSignUp,
  onBackToRoleSelection,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  const roleColors = getRoleColors(role);

  // Demo credentials for testing
  const demoCredentials = {
    Student: { email: 'student@manushi.com', password: 'demo123' },
    Teacher: { email: 'teacher@manushi.com', password: 'demo123' },
    Parent: { email: 'parent@manushi.com', password: 'demo123' },
    Admin: { email: 'admin@manushi.com', password: 'demo123' },
  };

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await onLogin(email.trim(), password, role);
    } catch (error) {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demo = demoCredentials[role];
    setEmail(demo.email);
    setPassword(demo.password);
    setErrors({});
  };

  const getRoleIcon = (userRole: UserRole) => {
    switch (userRole) {
      case 'Student': return '🎓';
      case 'Teacher': return '👩‍🏫';
      case 'Parent': return '👨‍👩‍👧‍👦';
      case 'Admin': return '⚙️';
    }
  };

  const getRoleWelcomeMessage = (userRole: UserRole) => {
    switch (userRole) {
      case 'Student': return 'Ready to learn and grow?';
      case 'Teacher': return 'Ready to inspire and teach?';
      case 'Parent': return 'Ready to support your child\'s journey?';
      case 'Admin': return 'Ready to manage the platform?';
    }
  };

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
              onPress={onBackToRoleSelection}
              testID="back-button"
              accessibilityRole="button"
              accessibilityLabel="Go back to role selection"
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.roleHeader}>
              <Text style={styles.roleIcon}>{getRoleIcon(role)}</Text>
              <Text style={styles.roleTitle}>{role} Login</Text>
              <Text style={styles.roleSubtitle}>{getRoleWelcomeMessage(role)}</Text>
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>
                Sign in to your {role.toLowerCase()} account
              </Text>

              <View style={styles.inputContainer}>
                <CoachingTextField
                  label="Email Address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Enter your email"
                  testID="email-input"
                  leadingIcon={<Text style={styles.inputIcon}>📧</Text>}
                />

                <CoachingTextField
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  error={errors.password}
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
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

                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={onForgotPassword}
                  testID="forgot-password-button"
                  accessibilityRole="button"
                  accessibilityLabel="Forgot password"
                >
                  <Text style={[styles.forgotPasswordText, { color: roleColors.primary }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Demo Login Helper */}
              <CoachingButton
                title="💡 Use Demo Credentials"
                variant="secondary"
                size="medium"
                onPress={handleDemoLogin}
                style={styles.demoButton}
                testID="demo-login-button"
              />

              <CoachingButton
                title={isLoading ? "Signing In..." : "Sign In"}
                variant="primary"
                size="large"
                onPress={handleLogin}
                disabled={isLoading}
                style={styles.loginButton}
                testID="login-button"
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <CoachingButton
                title="Create New Account"
                variant="text"
                size="large"
                onPress={onSignUp}
                style={styles.signupButton}
                testID="signup-button"
              />
            </View>

            {/* Footer Info */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By signing in, you agree to our Terms of Service and Privacy Policy
              </Text>
              <Text style={[styles.helpText, { color: roleColors.primary }]}>
                Need help? Contact support
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
    paddingBottom: Spacing.XL,
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
    fontSize: 48,
    marginBottom: Spacing.SM,
  },
  roleTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnPrimary,
    marginBottom: Spacing.XS,
    letterSpacing: Typography.headlineSmall.letterSpacing,
  },
  roleSubtitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnPrimary,
    opacity: 0.9,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
    marginTop: -Spacing.LG,
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
  formTitle: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.XS,
    letterSpacing: Typography.headlineSmall.letterSpacing,
  },
  formSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  inputContainer: {
    marginBottom: Spacing.MD,
  },
  inputIcon: {
    fontSize: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.SM,
    marginTop: Spacing.SM,
    marginBottom: Spacing.SM,
  },
  forgotPasswordText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: Typography.labelMedium.fontWeight,
  },
  demoButton: {
    marginBottom: Spacing.MD,
  },
  loginButton: {
    marginBottom: Spacing.LG,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.LG,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: LightTheme.OutlineVariant,
  },
  dividerText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    paddingHorizontal: Spacing.MD,
  },
  signupButton: {
    marginBottom: Spacing.MD,
  },
  footer: {
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.MD,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    lineHeight: Typography.bodySmall.lineHeight,
    marginBottom: Spacing.SM,
  },
  helpText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: Typography.labelMedium.fontWeight,
    textAlign: 'center',
  },
});

export default LoginScreen;