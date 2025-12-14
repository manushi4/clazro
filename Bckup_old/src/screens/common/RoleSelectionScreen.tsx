/**
 * Role Selection Screen (Development Tool)
 * Temporary screen to switch between Admin and Parent dashboards for testing
 *
 * Usage:
 * - Tap "Continue as Admin" to navigate to AdminNavigator
 * - Tap "Continue as Parent" to navigate to ParentNavigator
 */

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Button } from 'react-native-paper';
import { T } from '../../ui/typography/T';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';

interface RoleSelectionScreenProps {
  onSelectRole: (role: 'admin' | 'parent' | 'student' | 'teacher') => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onSelectRole }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <T variant="display" weight="bold" style={styles.title}>
          Welcome
        </T>
        <T variant="body" style={styles.subtitle}>
          Select your role to continue
        </T>
        <T variant="caption" style={styles.devNote}>
          (Development Mode)
        </T>
      </View>

      {/* Role Selection Cards */}
      <View style={styles.rolesContainer}>
        {/* Student Role */}
        <View style={styles.roleCard}>
          <View style={styles.iconContainer}>
            <T variant="display" style={styles.icon}>
              🎓
            </T>
          </View>
          <T variant="title" weight="semiBold" align="center" style={styles.roleTitle}>
            Student Dashboard
          </T>
          <T variant="caption" align="center" style={styles.roleDescription}>
            Access courses, track progress & learn effectively
          </T>
          <Button
            mode="contained"
            onPress={() => onSelectRole('student')}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Continue as Student
          </Button>
        </View>

        {/* Teacher Role */}
        <View style={styles.roleCard}>
          <View style={styles.iconContainer}>
            <T variant="display" style={styles.icon}>
              👩‍🏫
            </T>
          </View>
          <T variant="title" weight="semiBold" align="center" style={styles.roleTitle}>
            Teacher Dashboard
          </T>
          <T variant="caption" align="center" style={styles.roleDescription}>
            Manage classes, create content & mentor students
          </T>
          <Button
            mode="contained"
            onPress={() => onSelectRole('teacher')}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Continue as Teacher
          </Button>
        </View>

        {/* Admin Role */}
        <View style={styles.roleCard}>
          <View style={styles.iconContainer}>
            <T variant="display" style={styles.icon}>
              🔐
            </T>
          </View>
          <T variant="title" weight="semiBold" align="center" style={styles.roleTitle}>
            Admin Dashboard
          </T>
          <T variant="caption" align="center" style={styles.roleDescription}>
            Manage users, analytics, operations & system settings
          </T>
          <Button
            mode="contained"
            onPress={() => onSelectRole('admin')}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Continue as Admin
          </Button>
        </View>

        {/* Parent Role */}
        <View style={styles.roleCard}>
          <View style={styles.iconContainer}>
            <T variant="display" style={styles.icon}>
              👨‍👩‍👧
            </T>
          </View>
          <T variant="title" weight="semiBold" align="center" style={styles.roleTitle}>
            Parent Dashboard
          </T>
          <T variant="caption" align="center" style={styles.roleDescription}>
            View children progress, messages, fees & activities
          </T>
          <Button
            mode="contained"
            onPress={() => onSelectRole('parent')}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Continue as Parent
          </Button>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <T variant="caption" align="center" style={styles.footerText}>
          This is a temporary development screen
        </T>
        <T variant="caption" align="center" style={styles.footerText}>
          Remove before production build
        </T>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xl, // 24dp
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: Spacing.xxl, // 32dp
    marginBottom: Spacing.xl, // 24dp
    gap: Spacing.xs, // 4dp
  },
  title: {
    color: Colors.primary,
  },
  subtitle: {
    color: Colors.textSecondary,
  },
  devNote: {
    color: Colors.error,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },

  // Roles Container
  rolesContainer: {
    flex: 1,
    gap: Spacing.base, // 16dp
    justifyContent: 'center',
  },

  // Role Card
  roleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, // 12dp
    padding: Spacing.xl, // 24dp
    gap: Spacing.md, // 12dp
    alignItems: 'center',
    ...StyleSheet.create({
      shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }).shadow,
  },
  iconContainer: {
    marginBottom: Spacing.sm, // 8dp
  },
  icon: {
    fontSize: 64,
  },
  roleTitle: {
    color: Colors.textPrimary,
  },
  roleDescription: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm, // 8dp
  },

  // Button
  button: {
    width: '100%',
    borderRadius: BorderRadius.sm, // 8dp
  },
  buttonContent: {
    paddingVertical: Spacing.sm, // 8dp
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footer: {
    marginTop: Spacing.xl, // 24dp
    gap: Spacing.xs, // 4dp
  },
  footerText: {
    color: Colors.textSecondary,
    opacity: 0.7,
  },
});
