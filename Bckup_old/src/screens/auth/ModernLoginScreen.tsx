/**
 * ModernLoginScreen - Ultra-modern authentication interface
 * Features: Glassmorphism, Floating Elements, Advanced Animations
 * Contemporary UI Design with Smooth Interactions
 * Manushi Coaching Platform
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import CoachingButton from '../../components/core/CoachingButton';
import CoachingTextField from '../../components/core/CoachingTextField';
import { LightTheme, getRoleColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';

interface ModernLoginScreenProps {
  role: UserRole;
  onLogin: (email: string, password: string, role: UserRole) => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
  onBackToRoleSelection: () => void;
}

const { width, height } = Dimensions.get('window');

export const ModernLoginScreen: React.FC<ModernLoginScreenProps> = ({
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

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(height);
  const floatAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(1);

  const roleColors = getRoleColors(role);

  // Demo credentials for testing
  const demoCredentials = {
    Student: { email: 'student@manushi.com', password: 'demo123' },
    Teacher: { email: 'teacher@manushi.com', password: 'demo123' },
    Parent: { email: 'parent@manushi.com', password: 'demo123' },
    Admin: { email: 'admin@manushi.com', password: 'demo123' },
  };

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();

    // Pulse animation for role icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
  }, []);

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

    // Animate demo fill
    const scaleDown = Animated.timing(pulseAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    });
    
    const scaleUp = Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    });

    Animated.sequence([scaleDown, scaleUp]).start();
  };

  const getRoleIcon = (userRole: UserRole) => {
    switch (userRole) {
      case 'Student': return '🎓';
      case 'Teacher': return '👩‍🏫';
      case 'Parent': return '👨‍👩‍👧‍👦';
      case 'Admin': return '⚙️';
    }
  };

  const getRoleGradient = (userRole: UserRole) => {
    switch (userRole) {
      case 'Student': return ['#667eea', '#764ba2'];
      case 'Teacher': return ['#f093fb', '#f5576c'];
      case 'Parent': return ['#4facfe', '#00f2fe'];
      case 'Admin': return ['#43e97b', '#38f9d7'];
      default: return ['#667eea', '#764ba2'];
    }
  };

  const getRoleWelcomeMessage = (userRole: UserRole) => {
    switch (userRole) {
      case 'Student': return 'Ready to excel and grow?';
      case 'Teacher': return 'Ready to inspire minds?';
      case 'Parent': return 'Ready to support their journey?';
      case 'Admin': return 'Ready to lead the platform?';
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        {/* Dynamic Background */}
        <View style={styles.backgroundContainer}>
          <View style={[styles.gradientBackground, { backgroundColor: getRoleGradient(role)[0] }]} />
          <Animated.View 
            style={[
              styles.floatingOrb1,
              {
                transform: [{
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                }],
              },
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingOrb2,
              {
                transform: [{
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 15],
                  }),
                }],
              },
            ]} 
          />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Modern Header */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim.interpolate({
                    inputRange: [0, height],
                    outputRange: [0, -100],
                  }) }],
                },
              ]}
            >
              {/* Back Button with Glass Effect */}
              <TouchableOpacity
                style={styles.modernBackButton}
                onPress={onBackToRoleSelection}
                testID="back-button"
                accessibilityRole="button"
                accessibilityLabel="Go back to role selection"
              >
                <View style={styles.backButtonGlass} />
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              
              {/* Role Header with Animation */}
              <View style={styles.roleHeader}>
                <Animated.View 
                  style={[
                    styles.roleIconContainer,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <View style={[styles.roleIconGlow, { backgroundColor: getRoleGradient(role)[1] }]} />
                  <Text style={styles.modernRoleIcon}>{getRoleIcon(role)}</Text>
                </Animated.View>
                
                <Text style={styles.modernRoleTitle}>{role} Portal</Text>
                <Text style={styles.modernRoleSubtitle}>{getRoleWelcomeMessage(role)}</Text>
              </View>
            </Animated.View>

            {/* Modern Login Form */}
            <Animated.View 
              style={[
                styles.formContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.modernFormCard}>
                {/* Glass Background */}
                <View style={styles.formGlassBackground} />
                
                {/* Form Content */}
                <View style={styles.formContent}>
                  <View style={styles.formHeader}>
                    <Text style={styles.modernFormTitle}>Welcome Back</Text>
                    <Text style={styles.modernFormSubtitle}>
                      Sign in to your {role.toLowerCase()} account
                    </Text>
                  </View>

                  <View style={styles.modernInputContainer}>
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
                      style={styles.modernInput}
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
                      style={styles.modernInput}
                    />

                    {/* Forgot Password Link */}
                    <TouchableOpacity
                      style={styles.modernForgotButton}
                      onPress={onForgotPassword}
                      testID="forgot-password-button"
                    >
                      <Text style={styles.modernForgotText}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Demo Credentials Button */}
                  <TouchableOpacity
                    style={styles.demoCredentialsButton}
                    onPress={handleDemoLogin}
                    testID="demo-login-button"
                  >
                    <View style={styles.demoButtonGlass} />
                    <Text style={styles.demoButtonIcon}>✨</Text>
                    <Text style={styles.demoButtonText}>Use Demo Credentials</Text>
                  </TouchableOpacity>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[
                      styles.modernLoginButton,
                      { backgroundColor: getRoleGradient(role)[0] },
                      isLoading && styles.loadingButton,
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                    testID="login-button"
                  >
                    <View style={styles.buttonGlass} />
                    <Text style={styles.modernLoginButtonText}>
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Text>
                    {!isLoading && <Text style={styles.buttonArrow}>→</Text>}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.modernDivider}>
                    <View style={styles.dividerLine} />
                    <View style={styles.dividerTextContainer}>
                      <Text style={styles.modernDividerText}>OR</Text>
                    </View>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Sign Up Button */}
                  <TouchableOpacity
                    style={styles.modernSignUpButton}
                    onPress={onSignUp}
                    testID="signup-button"
                  >
                    <View style={styles.signUpButtonGlass} />
                    <Text style={styles.modernSignUpText}>Create New Account</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Modern Footer */}
              <View style={styles.modernFooter}>
                <Text style={styles.modernFooterText}>
                  Secured with end-to-end encryption
                </Text>
                <View style={styles.securityBadge}>
                  <Text style={styles.securityIcon}>🔐</Text>
                  <Text style={styles.securityText}>256-bit SSL</Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  floatingOrb1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: 100,
    right: -100,
    blur: 20,
  },
  floatingOrb2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: 200,
    left: -75,
    blur: 15,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XL,
    position: 'relative',
  },
  modernBackButton: {
    position: 'absolute',
    top: 60,
    left: Spacing.LG,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    overflow: 'hidden',
  },
  backButtonGlass: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
  },
  backIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  roleHeader: {
    alignItems: 'center',
    marginTop: 60,
  },
  roleIconContainer: {
    position: 'relative',
    marginBottom: Spacing.LG,
  },
  roleIconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -15,
    left: -15,
    opacity: 0.3,
    blur: 20,
  },
  modernRoleIcon: {
    fontSize: 50,
    textAlign: 'center',
  },
  modernRoleTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: Spacing.XS,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  modernRoleSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
    marginTop: -30,
  },
  modernFormCard: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: Spacing.XL,
  },
  formGlassBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
  },
  formContent: {
    padding: Spacing.XL,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: Spacing.XL,
  },
  modernFormTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.SM,
    letterSpacing: -0.5,
  },
  modernFormSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  modernInputContainer: {
    marginBottom: Spacing.LG,
  },
  modernInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: Spacing.MD,
  },
  inputIcon: {
    fontSize: 18,
  },
  modernForgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.SM,
    marginTop: Spacing.SM,
  },
  modernForgotText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  demoCredentialsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    marginBottom: Spacing.LG,
    overflow: 'hidden',
    position: 'relative',
  },
  demoButtonGlass: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  demoButtonIcon: {
    fontSize: 16,
    marginRight: Spacing.SM,
  },
  demoButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  modernLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    marginBottom: Spacing.LG,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGlass: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  modernLoginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  buttonArrow: {
    fontSize: 18,
    color: '#ffffff',
    marginLeft: Spacing.SM,
    fontWeight: '600',
  },
  loadingButton: {
    opacity: 0.8,
  },
  modernDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.LG,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerTextContainer: {
    paddingHorizontal: Spacing.MD,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 4,
  },
  modernDividerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    letterSpacing: 1,
  },
  modernSignUpButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  signUpButtonGlass: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
  },
  modernSignUpText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  modernFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.LG,
  },
  modernFooterText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: Spacing.SM,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  securityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  securityText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});

export default ModernLoginScreen;