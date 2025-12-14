/**
 * Design System Demo Screen
 * Visual verification of all Phase 1 components and theme system
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

import {
  CoachingButton,
  CoachingTextField,
  DashboardCard,
  StatisticsCard,
  StatusBadge,
  PriorityIndicator,
  AssignmentStatusBadge,
  CoachingProgressBar,
  CircularProgress,
  SubjectProgress,
  MultiProgress,
} from '../components/core';

import {
  LightTheme,
  DarkTheme,
  PrimaryColors,
  SemanticColors,
  RoleColors,
  getRoleColors,
} from '../theme/colors';

import { Typography, ComponentTypography } from '../theme/typography';
import { Spacing, BorderRadius, Elevation } from '../theme/spacing';

export const DesignSystemDemo: React.FC = () => {
  const [textFieldValue, setTextFieldValue] = useState('');
  const [textFieldError, setTextFieldError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = isDarkMode ? DarkTheme : LightTheme;

  const handleButtonPress = (buttonName: string) => {
    Alert.alert('Button Pressed', `${buttonName} was pressed`);
  };

  const handleTextFieldChange = (text: string) => {
    setTextFieldValue(text);
    if (text.length < 3 && text.length > 0) {
      setTextFieldError('Minimum 3 characters required');
    } else {
      setTextFieldError('');
    }
  };

  const multiProgressData = [
    { name: 'Mathematics', progress: 0.89, color: SemanticColors.Success, grade: 'A-' },
    { name: 'Physics', progress: 0.78, color: RoleColors.Teacher, grade: 'B+' },
    { name: 'Chemistry', progress: 0.92, color: PrimaryColors.primary500, grade: 'A' },
    { name: 'English', progress: 0.65, color: SemanticColors.Warning, grade: 'B' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.OnBackground }]}>
            🎨 Design System Demo
          </Text>
          <Text style={[styles.subtitle, { color: theme.OnSurfaceVariant }]}>
            Phase 1: Material Design 3 Components
          </Text>
        </View>

        {/* Theme Toggle */}
        <DashboardCard
          title="Theme System"
          subtitle="Light/Dark mode support"
          style={{ marginBottom: Spacing.LG }}
        >
          <CoachingButton
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onPress={() => setIsDarkMode(!isDarkMode)}
            variant="secondary"
            fullWidth
          />
        </DashboardCard>

        {/* Color System Demo */}
        <DashboardCard
          title="Color System"
          subtitle="Material Design 3 palette"
          style={{ marginBottom: Spacing.LG }}
        >
          <View style={styles.colorSection}>
            <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
              Primary Colors
            </Text>
            <View style={styles.colorRow}>
              {Object.entries(PrimaryColors).slice(0, 5).map(([key, color]) => (
                <View key={key} style={styles.colorItem}>
                  <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                  <Text style={[styles.colorLabel, { color: theme.OnSurfaceVariant }]}>
                    {key.replace('Primary', '')}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.colorSection}>
            <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
              Role Colors
            </Text>
            <View style={styles.colorRow}>
              {Object.entries(RoleColors).map(([role, color]) => (
                <View key={role} style={styles.colorItem}>
                  <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                  <Text style={[styles.colorLabel, { color: theme.OnSurfaceVariant }]}>
                    {role}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.colorSection}>
            <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
              Semantic Colors
            </Text>
            <View style={styles.colorRow}>
              <View style={styles.colorItem}>
                <View style={[styles.colorSwatch, { backgroundColor: SemanticColors.Success }]} />
                <Text style={[styles.colorLabel, { color: theme.OnSurfaceVariant }]}>Success</Text>
              </View>
              <View style={styles.colorItem}>
                <View style={[styles.colorSwatch, { backgroundColor: SemanticColors.Warning }]} />
                <Text style={[styles.colorLabel, { color: theme.OnSurfaceVariant }]}>Warning</Text>
              </View>
              <View style={styles.colorItem}>
                <View style={[styles.colorSwatch, { backgroundColor: SemanticColors.Error }]} />
                <Text style={[styles.colorLabel, { color: theme.OnSurfaceVariant }]}>Error</Text>
              </View>
              <View style={styles.colorItem}>
                <View style={[styles.colorSwatch, { backgroundColor: SemanticColors.Info }]} />
                <Text style={[styles.colorLabel, { color: theme.OnSurfaceVariant }]}>Info</Text>
              </View>
            </View>
          </View>
        </DashboardCard>

        {/* Typography Demo */}
        <DashboardCard
          title="Typography System"
          subtitle="Material Design 3 type scale"
          style={{ marginBottom: Spacing.LG }}
        >
          <View style={styles.typographyDemo}>
            <Text style={[{ 
              fontSize: Typography.displayMedium.fontSize,
              fontFamily: Typography.displayMedium.fontFamily,
              color: theme.OnSurface,
              marginBottom: Spacing.SM
            }]}>
              Display Medium
            </Text>
            <Text style={[{
              fontSize: Typography.headlineLarge.fontSize,
              fontFamily: Typography.headlineLarge.fontFamily,
              color: theme.OnSurface,
              marginBottom: Spacing.SM
            }]}>
              Headline Large
            </Text>
            <Text style={[{
              fontSize: Typography.titleLarge.fontSize,
              fontFamily: Typography.titleLarge.fontFamily,
              fontWeight: Typography.titleLarge.fontWeight,
              color: theme.OnSurface,
              marginBottom: Spacing.SM
            }]}>
              Title Large
            </Text>
            <Text style={[{
              fontSize: Typography.bodyLarge.fontSize,
              fontFamily: Typography.bodyLarge.fontFamily,
              color: theme.OnSurface,
              marginBottom: Spacing.SM
            }]}>
              Body Large - This is the primary text style for readable content in the application.
            </Text>
            <Text style={[{
              fontSize: Typography.labelLarge.fontSize,
              fontFamily: Typography.labelLarge.fontFamily,
              fontWeight: Typography.labelLarge.fontWeight,
              color: theme.OnSurfaceVariant,
            }]}>
              LABEL LARGE - FOR BUTTONS AND INTERACTIVE ELEMENTS
            </Text>
          </View>
        </DashboardCard>

        {/* Button Components Demo */}
        <DashboardCard
          title="Button Components"
          subtitle="All variants and states"
          style={{ marginBottom: Spacing.LG }}
        >
          <View style={styles.buttonDemo}>
            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Button Variants
            </Text>
            <View style={styles.buttonRow}>
              <CoachingButton
                title="Primary"
                onPress={() => handleButtonPress('Primary')}
                variant="primary"
                style={styles.demoButton}
              />
              <CoachingButton
                title="Secondary"
                onPress={() => handleButtonPress('Secondary')}
                variant="secondary"
                style={styles.demoButton}
              />
            </View>
            <View style={styles.buttonRow}>
              <CoachingButton
                title="Text"
                onPress={() => handleButtonPress('Text')}
                variant="text"
                style={styles.demoButton}
              />
              <CoachingButton
                title="Student"
                onPress={() => handleButtonPress('Student')}
                variant="role-based"
                role="Student"
                style={styles.demoButton}
              />
            </View>

            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Button Sizes
            </Text>
            <View style={styles.buttonColumn}>
              <CoachingButton
                title="Small Button"
                onPress={() => handleButtonPress('Small')}
                size="small"
                style={styles.demoButtonFull}
              />
              <CoachingButton
                title="Medium Button"
                onPress={() => handleButtonPress('Medium')}
                size="medium"
                style={styles.demoButtonFull}
              />
              <CoachingButton
                title="Large Button"
                onPress={() => handleButtonPress('Large')}
                size="large"
                style={styles.demoButtonFull}
              />
            </View>

            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Button States
            </Text>
            <View style={styles.buttonColumn}>
              <CoachingButton
                title="Disabled Button"
                onPress={() => handleButtonPress('Disabled')}
                disabled={true}
                style={styles.demoButtonFull}
              />
              <CoachingButton
                title="Loading Button"
                onPress={() => handleButtonPress('Loading')}
                loading={true}
                style={styles.demoButtonFull}
              />
            </View>
          </View>
        </DashboardCard>

        {/* Text Field Demo */}
        <DashboardCard
          title="Text Field Components"
          subtitle="Input fields with validation"
          style={{ marginBottom: Spacing.LG }}
        >
          <View style={styles.textFieldDemo}>
            <CoachingTextField
              label="Standard Text Field"
              value={textFieldValue}
              onChangeText={handleTextFieldChange}
              helperText="Enter at least 3 characters"
              error={textFieldError}
              containerStyle={styles.demoTextField}
            />
            <CoachingTextField
              label="Email Address"
              value="user@example.com"
              onChangeText={() => {}}
              keyboardType="email-address"
              containerStyle={styles.demoTextField}
            />
            <CoachingTextField
              label="Password"
              value="password123"
              onChangeText={() => {}}
              secureTextEntry={true}
              containerStyle={styles.demoTextField}
            />
            <CoachingTextField
              label="Required Field"
              value=""
              onChangeText={() => {}}
              required={true}
              containerStyle={styles.demoTextField}
            />
          </View>
        </DashboardCard>

        {/* Status Badges Demo */}
        <DashboardCard
          title="Status & Badge Components"
          subtitle="Status indicators and priorities"
          style={{ marginBottom: Spacing.LG }}
        >
          <View style={styles.badgeDemo}>
            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Status Badges
            </Text>
            <View style={styles.badgeRow}>
              <StatusBadge text="success" type="success" />
              <StatusBadge text="warning" type="warning" />
              <StatusBadge text="error" type="error" />
              <StatusBadge text="info" type="info" />
            </View>

            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Priority Indicators
            </Text>
            <View style={styles.badgeRow}>
              <PriorityIndicator priority="high" />
              <PriorityIndicator priority="medium" />
              <PriorityIndicator priority="low" />
            </View>

            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Assignment Status
            </Text>
            <View style={styles.badgeRow}>
              <AssignmentStatusBadge status="pending" />
              <AssignmentStatusBadge status="submitted" />
              <AssignmentStatusBadge status="graded" />
              <AssignmentStatusBadge status="overdue" />
            </View>
          </View>
        </DashboardCard>

        {/* Progress Components Demo */}
        <DashboardCard
          title="Progress Components"
          subtitle="Progress bars and indicators"
          style={{ marginBottom: Spacing.LG }}
        >
          <View style={styles.progressDemo}>
            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Linear Progress
            </Text>
            <CoachingProgressBar
              progress={0.75}
              label="Assignment Progress"
              style={styles.demoProgress}
            />
            <CoachingProgressBar
              progress={0.45}
              label="Course Completion"
              color={SemanticColors.Warning}
              style={styles.demoProgress}
            />

            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Circular Progress
            </Text>
            <View style={styles.circularProgressRow}>
              <CircularProgress
                progress={0.89}
                size={80}
                label="Math"
                color={SemanticColors.Success}
              />
              <CircularProgress
                progress={0.67}
                size={80}
                label="Physics"
                color={RoleColors.Teacher}
              />
              <CircularProgress
                progress={0.92}
                size={80}
                label="Chemistry"
                color={PrimaryColors.primary500}
              />
            </View>

            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Subject Progress
            </Text>
            <SubjectProgress
              subject="Mathematics"
              level="advanced"
              progress={0.89}
              grade="A-"
              style={styles.demoProgress}
            />
            <SubjectProgress
              subject="Physics"
              level="intermediate"
              progress={0.67}
              grade="B+"
              style={styles.demoProgress}
            />

            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Multi-Subject Progress
            </Text>
            <MultiProgress
              subjects={multiProgressData}
              title="Academic Performance"
            />
          </View>
        </DashboardCard>

        {/* Statistics Cards Demo */}
        <DashboardCard
          title="Statistics Cards"
          subtitle="Dashboard statistics display"
          style={{ marginBottom: Spacing.LG }}
        >
          <View style={styles.statsDemo}>
            <View style={styles.statsRow}>
              <StatisticsCard
                title="Total Students"
                value="1,234"
                change={{ value: 12, isPositive: true }}
                color={RoleColors.Student}
                style={styles.statCard}
              />
              <StatisticsCard
                title="Active Courses"
                value="56"
                change={{ value: 5, isPositive: true }}
                color={RoleColors.Teacher}
                style={styles.statCard}
              />
            </View>
            <View style={styles.statsRow}>
              <StatisticsCard
                title="Assignments"
                value="89"
                change={{ value: 8, isPositive: false }}
                color={SemanticColors.Warning}
                style={styles.statCard}
              />
              <StatisticsCard
                title="Revenue"
                value="₹2.4L"
                change={{ value: 15, isPositive: true }}
                color={SemanticColors.Success}
                style={styles.statCard}
              />
            </View>
          </View>
        </DashboardCard>

        {/* Spacing & Layout Demo */}
        <DashboardCard
          title="Spacing & Layout System"
          subtitle="4dp grid system demonstration"
          style={{ marginBottom: Spacing.LG }}
        >
          <View style={styles.spacingDemo}>
            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Spacing Scale
            </Text>
            {[
              { label: 'XS (4dp)', size: Spacing.XS },
              { label: 'SM (8dp)', size: Spacing.SM },
              { label: 'MD (16dp)', size: Spacing.MD },
              { label: 'LG (24dp)', size: Spacing.LG },
              { label: 'XL (32dp)', size: Spacing.XL },
            ].map((spacing) => (
              <View key={spacing.label} style={styles.spacingItem}>
                <Text style={[styles.spacingLabel, { color: theme.OnSurface }]}>
                  {spacing.label}
                </Text>
                <View 
                  style={[
                    styles.spacingBar,
                    { 
                      width: spacing.size * 2,
                      backgroundColor: theme.primary
                    }
                  ]} 
                />
              </View>
            ))}

            <Text style={[styles.demoSectionTitle, { color: theme.OnSurface }]}>
              Border Radius
            </Text>
            <View style={styles.borderRadiusRow}>
              {[
                { label: 'XS', radius: BorderRadius.XS },
                { label: 'SM', radius: BorderRadius.SM },
                { label: 'MD', radius: BorderRadius.MD },
                { label: 'LG', radius: BorderRadius.LG },
                { label: 'XL', radius: BorderRadius.XL },
              ].map((border) => (
                <View key={border.label} style={styles.borderRadiusItem}>
                  <View 
                    style={[
                      styles.borderRadiusBox,
                      {
                        borderRadius: border.radius,
                        backgroundColor: theme.primaryContainer
                      }
                    ]}
                  />
                  <Text style={[styles.borderRadiusLabel, { color: theme.OnSurface }]}>
                    {border.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </DashboardCard>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.OnSurfaceVariant }]}>
            ✅ Phase 1 Design System Complete
          </Text>
          <Text style={[styles.footerSubtext, { color: theme.OnSurfaceVariant }]}>
            Ready for Phase 2: Authentication UI
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.MD,
  },
  header: {
    marginBottom: Spacing.LG,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.headlineMedium.fontSize,
    fontFamily: Typography.headlineMedium.fontFamily,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  subtitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    marginBottom: Spacing.SM,
  },
  demoSectionTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    marginTop: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  colorSection: {
    marginBottom: Spacing.MD,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.SM,
  },
  colorItem: {
    alignItems: 'center',
    marginRight: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.XS,
  },
  colorLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
  },
  typographyDemo: {
    // Typography demo styles
  },
  buttonDemo: {
    // Button demo styles
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  buttonColumn: {
    marginBottom: Spacing.SM,
  },
  demoButton: {
    flex: 0.48,
  },
  demoButtonFull: {
    marginBottom: Spacing.SM,
  },
  textFieldDemo: {
    // Text field demo styles
  },
  demoTextField: {
    marginBottom: Spacing.MD,
  },
  badgeDemo: {
    // Badge demo styles
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.MD,
    gap: Spacing.SM,
  },
  progressDemo: {
    // Progress demo styles
  },
  demoProgress: {
    marginBottom: Spacing.MD,
  },
  circularProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.MD,
  },
  statsDemo: {
    // Stats demo styles
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  statCard: {
    flex: 0.48,
  },
  spacingDemo: {
    // Spacing demo styles
  },
  spacingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  spacingLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    width: 80,
  },
  spacingBar: {
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.SM,
  },
  borderRadiusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.MD,
  },
  borderRadiusItem: {
    alignItems: 'center',
  },
  borderRadiusBox: {
    width: 40,
    height: 40,
    marginBottom: Spacing.XS,
  },
  borderRadiusLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.XL,
    marginBottom: Spacing.LG,
  },
  footerText: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  footerSubtext: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    textAlign: 'center',
  },
});

export default DesignSystemDemo;