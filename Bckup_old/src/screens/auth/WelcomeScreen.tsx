/**
 * WelcomeScreen - Entry point for authentication
 * Multi-role selection with Material Design 3
 * Manushi Coaching Platform
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import CoachingButton from '../../components/core/CoachingButton';
import { LightTheme, getRoleColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';

interface WelcomeScreenProps {
  onRoleSelect: (role: UserRole) => void;
}

const { width } = Dimensions.get('window');

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onRoleSelect,
}) => {
  const roleOptions: Array<{
    role: UserRole;
    title: string;
    description: string;
    icon: string;
  }> = [
    {
      role: 'Student',
      title: 'Student',
      description: 'Track progress, access courses, and learn effectively',
      icon: '🎓',
    },
    {
      role: 'Teacher',
      title: 'Teacher', 
      description: 'Manage classes, create content, and mentor students',
      icon: '👩‍🏫',
    },
    {
      role: 'Parent',
      title: 'Parent',
      description: 'Monitor child progress and communicate with teachers',
      icon: '👨‍👩‍👧‍👦',
    },
    {
      role: 'Admin',
      title: 'Administrator',
      description: 'Manage platform, users, and system settings',
      icon: '⚙️',
    },
  ];

  const handleRoleSelect = (role: UserRole) => {
    onRoleSelect(role);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={LightTheme.Primary} />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🏆</Text>
              <Text style={styles.appTitle}>Manushi</Text>
              <Text style={styles.appSubtitle}>Coaching Platform</Text>
            </View>
            
            <Text style={styles.welcomeText}>
              Welcome to Your Learning Journey
            </Text>
            <Text style={styles.descriptionText}>
              Choose your role to get started with personalized coaching experience
            </Text>
          </View>

          {/* Role Selection Cards */}
          <View style={styles.roleContainer}>
            <Text style={styles.sectionTitle}>Select Your Role</Text>
            
            {roleOptions.map((option) => {
              const roleColors = getRoleColors(option.role);
              
              return (
                <View key={option.role} style={styles.roleCard}>
                  <View style={[styles.roleIcon, { backgroundColor: roleColors.primary + '20' }]}>
                    <Text style={styles.roleEmoji}>{option.icon}</Text>
                  </View>
                  
                  <View style={styles.roleContent}>
                    <Text style={styles.roleTitle}>{option.title}</Text>
                    <Text style={styles.roleDescription}>{option.description}</Text>
                  </View>
                  
                  <CoachingButton
                    title="Select"
                    variant="role-based"
                    role={option.role}
                    size="medium"
                    onPress={() => handleRoleSelect(option.role)}
                    style={styles.selectButton}
                    testID={`role-select-${option.role.toLowerCase()}`}
                  />
                </View>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure • Private • Effective Learning
            </Text>
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
    paddingHorizontal: Spacing.LG,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.XL,
    paddingBottom: Spacing.LG,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: Spacing.SM,
  },
  appTitle: {
    fontSize: Typography.headlineLarge.fontSize,
    fontFamily: Typography.headlineLarge.fontFamily,
    fontWeight: Typography.headlineLarge.fontWeight,
    color: LightTheme.Primary,
    letterSpacing: Typography.headlineLarge.letterSpacing,
  },
  appSubtitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
    letterSpacing: Typography.titleMedium.letterSpacing,
  },
  welcomeText: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.OnSurface,
    textAlign: 'center',
    marginBottom: Spacing.SM,
    letterSpacing: Typography.headlineSmall.letterSpacing,
  },
  descriptionText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    lineHeight: Typography.bodyLarge.lineHeight,
    maxWidth: width - Spacing.XL * 2,
  },
  roleContainer: {
    flex: 1,
    paddingVertical: Spacing.LG,
  },
  sectionTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
    letterSpacing: Typography.titleLarge.letterSpacing,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.LG,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
    shadowColor: LightTheme.OnSurface,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: LightTheme.OutlineVariant,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.MD,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleContent: {
    flex: 1,
    marginRight: Spacing.SM,
  },
  roleTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
    letterSpacing: Typography.titleMedium.letterSpacing,
  },
  roleDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: Typography.bodyMedium.lineHeight,
  },
  selectButton: {
    minWidth: 80,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.LG,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
});

export default WelcomeScreen;