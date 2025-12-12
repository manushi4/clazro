/**
 * ModernWelcomeScreen - Ultra-modern role selection interface
 * Features: Glassmorphism, Advanced Animations, Gradient Backgrounds
 * Modern UI Design with Contemporary Patterns
 * Manushi Coaching Platform
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import CoachingButton from '../../components/core/CoachingButton';
import { LightTheme, getRoleColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';

interface ModernWelcomeScreenProps {
  onRoleSelect: (role: UserRole) => void;
}

const { width, height } = Dimensions.get('window');

export const ModernWelcomeScreen: React.FC<ModernWelcomeScreenProps> = ({
  onRoleSelect,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const slideAnim = new Animated.Value(height);
  
  const roleOptions: Array<{
    role: UserRole;
    title: string;
    description: string;
    icon: string;
    gradient: string[];
    accent: string;
  }> = [
    {
      role: 'Student',
      title: 'Student',
      description: 'Unlock your potential with personalized learning experiences',
      icon: '🎓',
      gradient: ['#667eea', '#764ba2'],
      accent: '#667eea',
    },
    {
      role: 'Teacher',
      title: 'Teacher', 
      description: 'Inspire minds and shape the future of education',
      icon: '👩‍🏫',
      gradient: ['#f093fb', '#f5576c'],
      accent: '#f093fb',
    },
    {
      role: 'Parent',
      title: 'Parent',
      description: 'Stay connected with your child\'s educational journey',
      icon: '👨‍👩‍👧‍👦',
      gradient: ['#4facfe', '#00f2fe'],
      accent: '#4facfe',
    },
    {
      role: 'Admin',
      title: 'Administrator',
      description: 'Manage and optimize the learning ecosystem',
      icon: '⚙️',
      gradient: ['#43e97b', '#38f9d7'],
      accent: '#43e97b',
    },
  ];

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRolePress = (role: UserRole) => {
    setSelectedRole(role);

    // Scale animation for selection
    const scaleDown = Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    });

    const scaleUp = Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    });

    Animated.sequence([scaleDown, scaleUp]).start(() => {
      setTimeout(() => {
        onRoleSelect(role);
      }, 300);
    });
  };

  const RoleCard: React.FC<{option: typeof roleOptions[0], index: number}> = ({ option, index }) => {
    const [cardAnim] = useState(new Animated.Value(0));
    const [pressAnim] = useState(new Animated.Value(1));

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }).start();
    }, [cardAnim, index]);

    const handlePressIn = () => {
      Animated.timing(pressAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.roleCardContainer,
          {
            opacity: cardAnim,
            transform: [
              { scale: pressAnim },
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.modernRoleCard,
            selectedRole === option.role && styles.selectedCard,
          ]}
          onPress={() => handleRolePress(option.role)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {/* Glass Background */}
          <View style={styles.glassBackground} />
          
          {/* Gradient Accent */}
          <View 
            style={[
              styles.gradientAccent,
              {
                backgroundColor: option.accent,
              }
            ]} 
          />

          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Icon with Glow Effect */}
            <View style={[styles.iconContainer, { shadowColor: option.accent }]}>
              <Text style={styles.modernIcon}>{option.icon}</Text>
              <View style={[styles.iconGlow, { backgroundColor: option.accent }]} />
            </View>
            
            {/* Role Information */}
            <View style={styles.roleInfo}>
              <Text style={styles.modernRoleTitle}>{option.title}</Text>
              <Text style={styles.modernRoleDescription}>
                {option.description}
              </Text>
            </View>

            {/* Action Arrow */}
            <View style={styles.actionArrow}>
              <Text style={[styles.arrowIcon, { color: option.accent }]}>→</Text>
            </View>
          </View>

          {/* Selection Indicator */}
          {selectedRole === option.role && (
            <Animated.View style={[styles.selectionIndicator, { backgroundColor: option.accent }]} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        {/* Dynamic Background */}
        <View style={styles.backgroundContainer}>
          <View style={styles.gradientBackground} />
          <View style={styles.meshGradient1} />
          <View style={styles.meshGradient2} />
          <View style={styles.meshGradient3} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Modern Header */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.logoContainer}>
                <View style={styles.logoGlow} />
                <Text style={styles.logoIcon}>🏆</Text>
              </View>

              <Text style={styles.modernTitle}>Manushi</Text>
              <Text style={styles.modernSubtitle}>Coaching Platform</Text>

              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeText}>
                  Choose Your Path
                </Text>
                <Text style={styles.descriptionText}>
                  Select your role to begin your personalized learning journey
                </Text>
              </View>
            </Animated.View>

            {/* Modern Role Selection */}
            <Animated.View
              style={[
                styles.roleContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Select Your Role</Text>
                <View style={styles.sectionUnderline} />
              </View>

              <View style={styles.rolesGrid}>
                {roleOptions.map((option, index) => (
                  <RoleCard key={option.role} option={option} index={index} />
                ))}
              </View>
            </Animated.View>

            {/* Modern Footer */}
            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={styles.footerContent}>
                <Text style={styles.footerText}>
                  ✨ Secure • Intelligent • Transformative
                </Text>
                <View style={styles.footerDots}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
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
    backgroundColor: '#0f0f23',
  },
  meshGradient1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#667eea',
    opacity: 0.1,
    top: -150,
    right: -150,
  },
  meshGradient2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#f093fb',
    opacity: 0.15,
    bottom: 100,
    left: -125,
  },
  meshGradient3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4facfe',
    opacity: 0.1,
    top: '40%',
    right: -100,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.LG,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.XL,
    paddingBottom: Spacing.LG,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: Spacing.LG,
  },
  logoGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    opacity: 0.3,
    blur: 20,
  },
  logoIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  modernTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: Spacing.XS,
    letterSpacing: -1,
    textShadowColor: 'rgba(102, 126, 234, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  modernSubtitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.XL,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  welcomeTextContainer: {
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.SM,
    letterSpacing: -0.5,
  },
  descriptionText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width - Spacing.XL * 2,
  },
  roleContainer: {
    flex: 1,
    paddingVertical: Spacing.LG,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: Spacing.XL,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: Spacing.SM,
  },
  sectionUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#667eea',
    borderRadius: 1.5,
  },
  rolesGrid: {
    gap: Spacing.LG,
  },
  roleCardContainer: {
    marginBottom: Spacing.MD,
  },
  modernRoleCard: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: Spacing.XS,
  },
  glassBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  },
  gradientAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    opacity: 0.8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.LG,
    minHeight: 100,
  },
  iconContainer: {
    position: 'relative',
    marginRight: Spacing.LG,
  },
  modernIcon: {
    fontSize: 32,
    textAlign: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    top: -9,
    left: -9,
    opacity: 0.2,
    blur: 15,
  },
  roleInfo: {
    flex: 1,
  },
  modernRoleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.XS,
    letterSpacing: -0.3,
  },
  modernRoleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  actionArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.XL,
    marginTop: 'auto',
  },
  footerContent: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: Spacing.MD,
    letterSpacing: 0.5,
  },
  footerDots: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#667eea',
  },
});

export default ModernWelcomeScreen;