import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';

import {useTheme} from '../../context/ThemeContext';
import {UserRole} from '../../types/database';

interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
}

const roleOptions: RoleOption[] = [
  {
    role: 'student',
    title: 'Student',
    description: 'Access classes, assignments, and track your progress',
    icon: 'school',
    color: '#4CAF50',
    features: ['Join Live Classes', 'Submit Assignments', 'Track Progress', 'Ask Doubts'],
  },
  {
    role: 'teacher',
    title: 'Teacher',
    description: 'Manage classes, create content, and monitor student progress',
    icon: 'person',
    color: '#2196F3',
    features: ['Create Classes', 'Manage Students', 'Grade Assignments', 'AI Assistance'],
  },
  {
    role: 'parent',
    title: 'Parent',
    description: 'Monitor your child\'s education and communicate with teachers',
    icon: 'family-restroom',
    color: '#FF9800',
    features: ['Child Progress', 'Fee Payments', 'Teacher Communication', 'Reports'],
  },
  {
    role: 'admin',
    title: 'Administrator',
    description: 'Manage the entire coaching platform and operations',
    icon: 'admin-panel-settings',
    color: '#9C27B0',
    features: ['User Management', 'System Analytics', 'Financial Reports', 'Settings'],
  },
];

const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {theme} = useTheme();

  const handleRoleSelection = (role: UserRole) => {
    navigation.navigate('Login', {selectedRole: role});
  };

  const renderRoleCard = (option: RoleOption, index: number) => (
    <Animated.View
      key={option.role}
      entering={FadeInUp.delay(index * 200)}
      style={[styles.roleCard, {backgroundColor: theme.Surface}]}>
      <TouchableOpacity
        style={styles.roleCardContent}
        onPress={() => handleRoleSelection(option.role)}
        activeOpacity={0.7}>
        {/* Role Icon */}
        <View style={[styles.iconContainer, {backgroundColor: option.color}]}>
          <Icon name={option.icon} size={32} color="#FFFFFF" />
        </View>

        {/* Role Info */}
        <View style={styles.roleInfo}>
          <Text style={[styles.roleTitle, {color: theme.OnSurface}]}>
            {option.title}
          </Text>
          <Text style={[styles.roleDescription, {color: theme.OnSurfaceVariant}]}>
            {option.description}
          </Text>
          
          {/* Features List */}
          <View style={styles.featuresList}>
            {option.features.map((feature, featureIndex) => (
              <View key={featureIndex} style={styles.featureItem}>
                <Icon name="check-circle" size={16} color={option.color} />
                <Text style={[styles.featureText, {color: theme.OnSurfaceVariant}]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Arrow Icon */}
        <Icon name="arrow-forward-ios" size={20} color={theme.OnSurfaceVariant} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ScrollView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* Header */}
      <Animated.View entering={FadeInDown} style={styles.header}>
        <View style={[styles.headerContainer, {backgroundColor: theme.primary}]}>
          <Text style={[styles.headerTitle, {color: theme.OnPrimary}]}>
            Choose Your Role
          </Text>
          <Text style={[styles.headerSubtitle, {color: theme.primaryContainer}]}>
            Select your role to access personalized features
          </Text>
        </View>
      </Animated.View>

      {/* Role Cards */}
      <View style={styles.rolesContainer}>
        {roleOptions.map((option, index) => renderRoleCard(option, index))}
      </View>

      {/* Footer */}
      <Animated.View entering={FadeIn.delay(800)} style={styles.footer}>
        <Text style={[styles.footerText, {color: theme.OnSurfaceVariant}]}>
          Coaching Manager - AI-Powered Learning Platform
        </Text>
        <Text style={[styles.versionText, {color: theme.Outline}]}>
          Version 1.0.0
        </Text>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  rolesContainer: {
    paddingHorizontal: 16,
  },
  roleCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  featureText: {
    fontSize: 12,
    marginLeft: 6,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default RoleSelectionScreen;