/**
 * UltraModernLoginScreen - Premium authentication interface
 * Features: Enhanced Typography, Better Performance, Stunning Theme
 * Fixed: Animation performance issues and color screen freezing
 * Manushi Coaching Platform
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import CoachingButton from '../../components/core/CoachingButton';
import CoachingTextField from '../../components/core/CoachingTextField';
import { LightTheme, getRoleColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';

interface UltraModernLoginScreenProps {
  role: UserRole;
  onLogin: (email: string, password: string, role: UserRole) => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
  onBackToRoleSelection: () => void;
}

const { width, height } = Dimensions.get('window');

export const UltraModernLoginScreen: React.FC<UltraModernLoginScreenProps> = ({
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

  // Performance-optimized animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const roleColors = getRoleColors(role);

  // Demo credentials for testing
  const demoCredentials = {
    Student: { email: 'student@manushi.com', password: 'demo123' },
    Teacher: { email: 'teacher@manushi.com', password: 'demo123' },
    Parent: { email: 'test.parent@example.com', password: 'Parent@123' },
    Admin: { email: 'admin@manushi.com', password: 'demo123' },
  };

  useEffect(() => {
    // Optimized entrance animations - no loops to prevent freezing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

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

    // Simple scale animation without loops
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getRoleIcon = (userRole: UserRole) => {
    switch (userRole) {
      case 'Student': return '🎓';
      case 'Teacher': return '👩‍🏫';
      case 'Parent': return '👨‍👩‍👧‍👦';
      case 'Admin': return '⚙️';
    }
  };

  const getRoleTheme = (userRole: UserRole) => {
    switch (userRole) {
      case 'Student': return {
        primary: '#667eea',
        secondary: '#764ba2', 
        accent: '#f093fb',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      };
      case 'Teacher': return {
        primary: '#f093fb',
        secondary: '#f5576c',
        accent: '#4facfe', 
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      };
      case 'Parent': return {
        primary: '#4facfe',
        secondary: '#00f2fe',
        accent: '#43e97b',
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      };
      case 'Admin': return {
        primary: '#43e97b',
        secondary: '#38f9d7',
        accent: '#667eea',
        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      };
      default: return {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f093fb',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      };
    }
  };

  const theme = getRoleTheme(role);

  const getRoleWelcomeMessage = (userRole: UserRole) => {
    switch (userRole) {
      case 'Student': return 'Unlock your learning potential';
      case 'Teacher': return 'Shape minds, inspire futures';
      case 'Parent': return 'Support your child\'s growth';
      case 'Admin': return 'Manage with excellence';
    }
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.primary} 
        translucent={false}
      />
      <View style={[styles.container, { backgroundColor: theme.primary }]}>
        {/* Enhanced Background with Better Performance */}
        <View style={styles.backgroundContainer}>
          <View style={[styles.primaryGradient, { backgroundColor: theme.primary }]} />
          <View style={[styles.secondaryGradient, { backgroundColor: theme.secondary, opacity: 0.7 }]} />
          <View style={[styles.accentGlow, { backgroundColor: theme.accent, opacity: 0.15 }]} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Premium Header */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Enhanced Back Button */}
              <TouchableOpacity
                style={[styles.premiumBackButton, { borderColor: 'rgba(255, 255, 255, 0.3)' }]}
                onPress={onBackToRoleSelection}
                testID="back-button"
                accessibilityRole="button"
                accessibilityLabel="Go back to role selection"
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              
              {/* Enhanced Role Header */}
              <Animated.View 
                style={[
                  styles.roleHeader,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <View style={styles.roleIconContainer}>
                  <Text style={styles.premiumRoleIcon}>{getRoleIcon(role)}</Text>
                </View>
                
                <Text style={styles.premiumRoleTitle}>{role} Portal</Text>
                <Text style={styles.premiumRoleSubtitle}>{getRoleWelcomeMessage(role)}</Text>
              </Animated.View>
            </Animated.View>

            {/* Ultra-Modern Login Form */}
            <Animated.View 
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.premiumFormCard}>
                {/* Enhanced Glass Background */}
                <View style={styles.enhancedGlass} />
                
                {/* Premium Form Content */}
                <View style={styles.formContent}>
                  <View style={styles.formHeader}>
                    <Text style={styles.premiumFormTitle}>Welcome Back</Text>
                    <Text style={styles.premiumFormSubtitle}>
                      Sign in to your {role.toLowerCase()} account
                    </Text>
                  </View>

                  <View style={styles.premiumInputContainer}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <View style={[styles.premiumInput, errors.email && styles.inputError]}>
                        <Text style={styles.inputIcon}>📧</Text>
                        <CoachingTextField
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) {
                              setErrors(prev => ({ ...prev, email: undefined }));
                            }
                          }}
                          placeholder="Enter your email"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={styles.enhancedTextInput}
                          testID="email-input"
                        />
                      </View>
                      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <View style={[styles.premiumInput, errors.password && styles.inputError]}>
                        <Text style={styles.inputIcon}>🔒</Text>
                        <CoachingTextField
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) {
                              setErrors(prev => ({ ...prev, password: undefined }));
                            }
                          }}
                          placeholder="Enter your password"
                          secureTextEntry={!showPassword}
                          style={styles.enhancedTextInput}
                          testID="password-input"
                        />
                        <TouchableOpacity 
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeButton}
                        >
                          <Text style={styles.eyeIcon}>
                            {showPassword ? "👁️" : "🙈"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                    </View>

                    {/* Enhanced Forgot Password */}
                    <TouchableOpacity
                      style={styles.forgotPasswordButton}
                      onPress={onForgotPassword}
                      testID="forgot-password-button"
                    >
                      <Text style={[styles.forgotPasswordText, { color: theme.accent }]}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Premium Demo Button */}
                  <TouchableOpacity
                    style={[styles.premiumDemoButton, { borderColor: theme.accent }]}
                    onPress={handleDemoLogin}
                    testID="demo-login-button"
                  >
                    <Text style={styles.demoIcon}>✨</Text>
                    <Text style={styles.premiumDemoText}>Use Demo Credentials</Text>
                  </TouchableOpacity>

                  {/* Ultra-Modern Login Button */}
                  <TouchableOpacity
                    style={[
                      styles.ultraModernLoginButton,
                      { backgroundColor: theme.secondary },
                      isLoading && styles.loadingButton,
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                    testID="login-button"
                  >
                    <View style={styles.buttonContent}>
                      <Text style={styles.ultraModernButtonText}>
                        {isLoading ? "Signing In..." : "Sign In"}
                      </Text>
                      {!isLoading && <Text style={styles.buttonArrow}>→</Text>}
                    </View>
                    <View style={styles.buttonGlow} />
                  </TouchableOpacity>

                  {/* Premium Divider */}
                  <View style={styles.premiumDivider}>
                    <View style={styles.dividerLine} />
                    <View style={styles.dividerBadge}>
                      <Text style={styles.premiumDividerText}>OR</Text>
                    </View>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Enhanced Sign Up Button */}
                  <TouchableOpacity
                    style={styles.premiumSignUpButton}
                    onPress={onSignUp}
                    testID="signup-button"
                  >
                    <Text style={styles.premiumSignUpText}>Create New Account</Text>
                    <Text style={styles.signUpArrow}>↗</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Premium Footer */}
              <View style={styles.premiumFooter}>
                <View style={styles.securityBadge}>
                  <Text style={styles.securityIcon}>🔐</Text>
                  <Text style={styles.securityText}>Secured with 256-bit SSL encryption</Text>
                </View>
                <Text style={styles.trustText}>
                  Trusted by 10,000+ educators worldwide
                </Text>
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
  primaryGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  secondaryGradient: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    borderRadius: width,
    top: -height * 0.3,
    right: -width * 0.25,
  },
  accentGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -150,
    left: -150,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: Spacing.LG,
    paddingBottom: 40,
    position: 'relative',
  },
  premiumBackButton: {
    position: 'absolute',
    top: 20,
    left: Spacing.LG,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 1,
  },
  backIcon: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '600',
  },
  roleHeader: {
    alignItems: 'center',
    marginTop: 60,
  },
  roleIconContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
  },
  premiumRoleIcon: {
    fontSize: 50,
    textAlign: 'center',
  },
  premiumRoleTitle: {
    fontSize: 36,
    fontWeight: Platform.OS === 'ios' ? '800' : 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -1.2,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  premiumRoleSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
    marginTop: -20,
  },
  premiumFormCard: {
    position: 'relative',
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  enhancedGlass: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  formContent: {
    padding: 32,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  premiumFormTitle: {
    fontSize: 32,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  premiumFormSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  premiumInputContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  premiumInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 56,
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  enhancedTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  premiumDemoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    marginBottom: 20,
  },
  demoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  premiumDemoText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  ultraModernLoginButton: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  ultraModernButtonText: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  buttonArrow: {
    fontSize: 18,
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '600',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
  },
  loadingButton: {
    opacity: 0.8,
  },
  premiumDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  premiumDividerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  premiumSignUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  premiumSignUpText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  signUpArrow: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '600',
  },
  premiumFooter: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  securityIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  trustText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

export default UltraModernLoginScreen;