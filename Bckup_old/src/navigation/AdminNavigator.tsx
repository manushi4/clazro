/**
 * Admin Navigation
 * Bottom tab navigator with nested stacks - MATCHES ParentNavigator.tsx STRUCTURE
 * Uses TopAppBar header and Bottom Tab Navigator footer
 * ✅ MD3-Compliant Navigation with Real Supabase Data
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { useAdminRole } from '../hooks/useAdminRole';
import { hasPermission, ADMIN_PERMISSIONS } from '../utils/adminPermissions';
import ErrorBoundary from '../components/ErrorBoundary';
import { BottomNavMD3 } from '../theme/bottomNav.md3';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeNavigate } from '../utils/navigationService';
import { trackAction } from '../utils/navigationAnalytics';

// ✨ NEW: Global Navigation Components
import { TopAppBar } from '../components/navigation/TopAppBar';
import { NavigationDrawer } from '../components/navigation/NavigationDrawer';
import NotificationsListScreen from '../screens/common/NotificationsListScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import HelpFeedbackScreen from '../screens/common/HelpFeedbackScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import LanguageSelectionScreen from '../screens/common/LanguageSelectionScreen';
import AccessDeniedScreen from '../screens/common/AccessDeniedScreen';

// Admin Dashboard Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import Phase90AdminDashboard from '../screens/admin/Phase90AdminDashboard';
import AdminDashboard from '../screens/admin/AdminDashboard';

// Management Screens
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import UserManagementScreenV3 from '../screens/admin/UserManagementScreenV3'; // Modern UI version
import OrganizationManagementScreen from '../screens/admin/OrganizationManagementScreen';
import OrganizationManagementScreenV3 from '../screens/admin/OrganizationManagementScreenV3'; // Modern UI version
import OperationsManagementScreen from '../screens/admin/OperationsManagementScreen';

// Analytics & Monitoring Screens
import AdvancedAnalyticsScreen from '../screens/admin/AdvancedAnalyticsScreen';
import AdvancedAnalyticsScreenV2 from '../screens/admin/AdvancedAnalyticsScreenV2'; // Modern UI version
import RealTimeMonitoringDashboard from '../screens/admin/RealTimeMonitoringDashboard';
import RealTimeMonitoringDashboardV2 from '../screens/admin/RealTimeMonitoringDashboardV2'; // Modern UI version
import EnterpriseIntelligenceSuite from '../screens/admin/EnterpriseIntelligenceSuite';
import KPIDetailScreen from '../screens/admin/KPIDetailScreen';
import FinancialReportsScreen from '../screens/admin/FinancialReportsScreen';

// System Configuration Screens
import SystemSettingsScreen from '../screens/admin/SystemSettingsScreen';
import SystemSettingsScreenV2 from '../screens/admin/SystemSettingsScreenV2'; // Modern UI version
import BusinessConfigurationScreen from '../screens/admin/BusinessConfigurationScreen';
import SystemOptimizationScreen from '../screens/admin/SystemOptimizationScreen';
import PaymentSettingsScreen from '../screens/admin/PaymentSettingsScreen';
import ContentManagementScreen from '../screens/admin/ContentManagementScreen';
import ContentManagementScreenV2 from '../screens/admin/ContentManagementScreenV2'; // Modern UI version

// Security & Compliance Screens
import SecurityComplianceScreen from '../screens/admin/SecurityComplianceScreen';
import ComplianceAuditScreen from '../screens/admin/ComplianceAuditScreen';
import ComprehensiveAuditSystemScreen from '../screens/admin/ComprehensiveAuditSystemScreen';

// Quality & Testing Screens
import QualityAssuranceTestingScreen from '../screens/admin/QualityAssuranceTestingScreen';
import CrossRoleIntegrationTestingScreen from '../screens/admin/CrossRoleIntegrationTestingScreen';

// Support & Alerts
import SupportCenterScreen from '../screens/admin/SupportCenterScreen';
import AlertDetailScreen from '../screens/admin/AlertDetailScreen';

// Advanced Features
import AIAgentEcosystem from '../screens/admin/AIAgentEcosystem';
import PlatformScalabilityDashboard from '../screens/admin/PlatformScalabilityDashboard';
import StrategicPlanningScreen from '../screens/admin/StrategicPlanningScreen';

// Deployment & Launch
import ProductionDeploymentLaunchScreen from '../screens/admin/ProductionDeploymentLaunchScreen';
import MobileOptimizationPWAScreen from '../screens/admin/MobileOptimizationPWAScreen';
import UIUXEnhancementPolishScreen from '../screens/admin/UIUXEnhancementPolishScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Error Fallback Component
const ErrorFallback = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.errorContainer, { backgroundColor: theme.Background }]}>
      <Icon name="error-outline" size={64} color={theme.Error} />
      <Text style={[styles.errorTitle, { color: theme.OnSurface }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorMessage, { color: theme.OnSurfaceVariant }]}>
        We're sorry for the inconvenience. Please try again or contact support if the problem persists.
      </Text>
      <TouchableOpacity
        style={[styles.errorButton, { backgroundColor: theme.Primary }]}
        onPress={() => {
          console.log('Error fallback - Try Again pressed');
        }}
      >
        <Text style={[styles.errorButtonText, { color: theme.OnPrimary }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Dashboard Stack (Main Admin Dashboard)
function DashboardStack() {
  const { user, logout } = useAuth();

  // ✨ NEW: Drawer state (MD3 modal drawer)
  const [drawerVisible, setDrawerVisible] = React.useState(false);

  // ✨ Navigation ref to pass to drawer
  const navigationRef = React.useRef<any>(null);

  // Get admin alerts count for notifications badge
  const { alerts } = useAdminDashboard();
  const alertsCount = alerts?.length || 0;

  // Get profile info for drawer
  const userProfile = {
    name: user?.email?.split('@')[0] || 'Administrator',
    email: user?.email || 'admin@example.com',
    initials: (user?.email?.split('@')[0] || 'AD').substring(0, 2).toUpperCase(),
  };

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          // ✨ MD3-Compliant TopAppBar: ☰ + Title + 🔔 + ⋯
          header: (props) => {
            // Store navigation ref for drawer
            navigationRef.current = props.navigation;

            return (
              <TopAppBar
                title={props.options.title || props.route.name}
                leadingType={props.back !== undefined ? 'back' : 'menu'}
                onLeadingPress={() => {
                  if (props.back !== undefined) {
                    props.navigation.goBack();
                  } else {
                    setDrawerVisible(true); // Open drawer on ☰ tap
                  }
                }}
                notificationCount={alertsCount}
                onNotificationPress={() => props.navigation.navigate('NotificationsList' as any)}
                overflowMenuItems={[
                  {
                    label: 'Profile',
                    icon: 'account',
                    onPress: () => {
                      trackAction('view_profile', 'TopAppBar');
                      safeNavigate('Profile' as any);
                    },
                  },
                  {
                    label: 'Settings',
                    icon: 'cog',
                    onPress: () => {
                      trackAction('view_settings', 'TopAppBar');
                      safeNavigate('SystemSettings' as any);
                    },
                  },
                  {
                    label: 'Help & Feedback',
                    icon: 'help-circle',
                    onPress: () => {
                      trackAction('view_help', 'TopAppBar');
                      safeNavigate('SupportCenter' as any);
                    },
                  },
                  {
                    label: 'Logout',
                    icon: 'logout',
                    destructive: true,
                    onPress: () => {
                      trackAction('logout_attempt', 'TopAppBar');
                      Alert.alert(
                        'Logout',
                        'Are you sure you want to logout?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Logout',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                console.log('🚪 [TopAppBar] Logging out...');

                                // Clear navigation state to return to role selection
                                await AsyncStorage.removeItem('NAVIGATION_STATE');

                                // Perform logout
                                await logout();

                                console.log('✅ [TopAppBar] Logged out successfully');

                                // The app will automatically show role selection screen
                                // because selectedRole will reset when AuthContext user becomes null
                              } catch (error) {
                                console.error('❌ [TopAppBar] Logout error:', error);
                                Alert.alert('Error', 'Failed to logout. Please try again.');
                              }
                            },
                          },
                        ]
                      );
                    },
                  },
                ]}
              />
            );
          },
        }}
      >
        {/* Main Admin Dashboard */}
        <Stack.Screen
          name="AdminDashboard"
          options={{ title: 'Admin Dashboard' }}
        >
          {(props: any) => (
            <ErrorBoundary fallback={<ErrorFallback />}>
              <AdminDashboardScreen {...props} />
            </ErrorBoundary>
          )}
        </Stack.Screen>

        {/* Legacy Dashboards */}
        <Stack.Screen
          name="Phase90Dashboard"
          component={Phase90AdminDashboard}
          options={{ title: 'Phase 90 (Legacy)' }}
        />
        <Stack.Screen
          name="LegacyAdminDashboard"
          component={AdminDashboard}
          options={{ title: 'Legacy Dashboard' }}
        />

        {/* KPI Detail Screen */}
        <Stack.Screen
          name="KPIDetail"
          options={{ title: 'KPI Details' }}
        >
          {(props: any) => (
            <ErrorBoundary fallback={<ErrorFallback />}>
              <KPIDetailScreen {...props} />
            </ErrorBoundary>
          )}
        </Stack.Screen>

        {/* Alert Detail Screen */}
        <Stack.Screen
          name="AlertDetail"
          options={{ title: 'Alert Details' }}
        >
          {(props: any) => (
            <ErrorBoundary fallback={<ErrorFallback />}>
              <AlertDetailScreen {...props} />
            </ErrorBoundary>
          )}
        </Stack.Screen>

        {/* ✨ NEW: Global Screens */}
        <Stack.Screen
          name="NotificationsList"
          options={{ title: 'Notifications' }}
        >
          {(props: any) => (
            <ErrorBoundary fallback={<ErrorFallback />}>
              <NotificationsListScreen {...props} />
            </ErrorBoundary>
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Profile"
          options={{ title: 'My Profile' }}
        >
          {(props: any) => (
            <ErrorBoundary fallback={<ErrorFallback />}>
              <ProfileScreen {...props} />
            </ErrorBoundary>
          )}
        </Stack.Screen>

        <Stack.Screen
          name="LanguageSelection"
          options={{ title: 'Language' }}
        >
          {(props: any) => (
            <ErrorBoundary fallback={<ErrorFallback />}>
              <LanguageSelectionScreen {...props} />
            </ErrorBoundary>
          )}
        </Stack.Screen>

        <Stack.Screen
          name="AccessDenied"
          options={{ title: 'Access Denied' }}
        >
          {(props: any) => (
            <ErrorBoundary fallback={<ErrorFallback />}>
              <AccessDeniedScreen {...props} />
            </ErrorBoundary>
          )}
        </Stack.Screen>
      </Stack.Navigator>

      {/* ✨ MD3 Modal Navigation Drawer - Exact Ship-Ready Spec */}
      <NavigationDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        userProfile={userProfile}
        navigation={navigationRef.current}
        currentRoute={navigationRef.current?.getCurrentRoute?.()?.name}
        onLogout={async () => {
          try {
            console.log('🚪 [NavigationDrawer] Logging out...');

            // Clear navigation state to return to role selection
            await AsyncStorage.removeItem('NAVIGATION_STATE');

            // Perform logout
            await logout();

            console.log('✅ [NavigationDrawer] Logged out successfully');

            // Close drawer
            setDrawerVisible(false);

            // The app will automatically show role selection screen
            // because selectedRole will reset when AuthContext user becomes null
          } catch (error) {
            console.error('❌ [NavigationDrawer] Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        }}
      />
    </>
  );
}

// Management Stack (Users, Organization, Operations)
function ManagementStack() {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Get admin ID from authenticated user
  const adminId = user?.id || 'admin-default-id';

  // Handle navigation from screens
  const handleNavigate = (screen: string) => {
    safeNavigate(screen as any);
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
      }}
    >
      <Stack.Screen
        name="UserManagement"
        options={{ title: 'User Management' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <UserManagementScreenV3 {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="OrganizationManagement"
        options={{ title: 'Organization' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <OrganizationManagementScreenV3 {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="OperationsManagement"
        options={{ title: 'Operations' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <OperationsManagementScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="ContentManagement"
        options={{ title: 'Announcements' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ContentManagementScreenV2 {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="PaymentSettings"
        options={{ title: 'Payment Settings' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <PaymentSettingsScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="SupportCenter"
        options={{ title: 'Support Center' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <SupportCenterScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Analytics Stack (Advanced Analytics, Reports, Monitoring)
function AnalyticsStack() {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Get admin ID from authenticated user
  const adminId = user?.id || 'admin-default-id';

  // Handle navigation from screens
  const handleNavigate = (screen: string) => {
    safeNavigate(screen as any);
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
      }}
    >
      <Stack.Screen
        name="AdvancedAnalytics"
        options={{ title: 'Advanced Analytics' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <AdvancedAnalyticsScreenV2 {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="RealTimeMonitoring"
        options={{ title: 'Real-time Monitoring' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <RealTimeMonitoringDashboardV2 {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="EnterpriseIntelligence"
        options={{ title: 'Enterprise Intelligence' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <EnterpriseIntelligenceSuite {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="FinancialReports"
        options={{ title: 'Financial Reports' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <FinancialReportsScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="PlatformScalability"
        options={{ title: 'Platform Scalability' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <PlatformScalabilityDashboard {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="StrategicPlanning"
        options={{ title: 'Strategic Planning' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <StrategicPlanningScreen {...props} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// System Stack (Settings, Security, Audit)
function SystemStack() {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Get admin ID from authenticated user
  const adminId = user?.id || 'admin-default-id';

  // Handle navigation from screens
  const handleNavigate = (screen: string) => {
    safeNavigate(screen as any);
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
      }}
    >
      <Stack.Screen
        name="SystemSettings"
        options={{ title: 'System Settings' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <SystemSettingsScreenV2 {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Settings"
        options={{ title: 'Settings' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <SettingsScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="HelpFeedback"
        options={{ title: 'Help & Feedback' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <HelpFeedbackScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="BusinessConfiguration"
        options={{ title: 'Business Config' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <BusinessConfigurationScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="SystemOptimization"
        options={{ title: 'System Optimization' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <SystemOptimizationScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="SecurityCompliance"
        options={{ title: 'Security & Compliance' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <SecurityComplianceScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="ComplianceAudit"
        options={{ title: 'Compliance Audit' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ComplianceAuditScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="ComprehensiveAudit"
        options={{ title: 'Comprehensive Audit' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ComprehensiveAuditSystemScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="QualityAssurance"
        options={{ title: 'Quality Assurance' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <QualityAssuranceTestingScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="CrossRoleIntegration"
        options={{ title: 'Integration Testing' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <CrossRoleIntegrationTestingScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="AIAgentEcosystem"
        options={{ title: 'AI Agent Ecosystem' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <AIAgentEcosystem {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="ProductionDeployment"
        options={{ title: 'Production Deployment' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ProductionDeploymentLaunchScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="MobileOptimization"
        options={{ title: 'Mobile Optimization' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <MobileOptimizationPWAScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="UIUXEnhancement"
        options={{ title: 'UI/UX Enhancement' }}
      >
        {(props: any) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <UIUXEnhancementPolishScreen {...props} adminId={adminId} onNavigate={handleNavigate} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Main Admin Tab Navigator - MD3 Canonical with RBAC Permissions
export default function AdminNavigator() {
  const insets = useSafeAreaInsets();
  const { role } = useAdminRole();

  // Calculate bottom padding with safe area (max of 16dp or safe area)
  const bottomPadding = Math.max(BottomNavMD3.insets.bottomMin, insets.bottom);

  // Tab permission mapping
  const canViewDashboard = true; // Dashboard visible to all admins
  const canViewManagement = hasPermission(role, ADMIN_PERMISSIONS.USER_MANAGEMENT);
  const canViewAnalytics = hasPermission(role, ADMIN_PERMISSIONS.ANALYTICS_VIEW);
  const canViewSystem = hasPermission(role, ADMIN_PERMISSIONS.SYSTEM_SETTINGS);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // ✅ MD3 EXACT COLORS
        tabBarActiveTintColor: BottomNavMD3.colors.active,      // #2563EB (primary)
        tabBarInactiveTintColor: BottomNavMD3.colors.inactive,  // #475569 (onSurfaceVariant)
        // ✅ MD3 CANONICAL BOTTOM NAV STYLING
        tabBarStyle: {
          backgroundColor: BottomNavMD3.colors.container,        // #FFFFFF (surface)
          borderTopWidth: 1,
          borderTopColor: BottomNavMD3.colors.dividerTop,        // #E2E8F0
          height: BottomNavMD3.height,                           // 80dp (MD3 canonical)
          paddingBottom: bottomPadding,                          // Safe area aware
          paddingTop: 8,
          paddingHorizontal: BottomNavMD3.insets.horizontal,    // 16dp
          elevation: BottomNavMD3.elevation.rest,                // 1dp (not 8)
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,                                   // Minimal shadow
          shadowRadius: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          minHeight: BottomNavMD3.item.minTarget,                // ≥48dp tap target
        },
        // ✅ MD3 LABEL TYPOGRAPHY: 13sp/18/500
        tabBarLabelStyle: {
          fontSize: BottomNavMD3.item.label.size,                // 13sp
          fontWeight: BottomNavMD3.item.label.weight,            // 500
          lineHeight: BottomNavMD3.item.label.lineHeight,        // 18sp
          fontFamily: 'System',
          marginTop: BottomNavMD3.item.gapIconLabel,             // 8dp gap
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
        // ✅ ACTIVE INDICATOR STYLING (simulated with background)
        tabBarActiveBackgroundColor: `${BottomNavMD3.colors.active}1F`, // Primary @ 12% (1F hex)
      }}
    >
      {/* Dashboard - visible to all admins */}
      {canViewDashboard && (
        <Tab.Screen
          name="Dashboard"
          component={DashboardStack}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarAccessibilityLabel: 'Dashboard tab',
            tabBarIcon: ({ color }) => (
              <Icon name="dashboard" size={BottomNavMD3.item.icon} color={color} />
            ),
          }}
        />
      )}

      {/* Management - requires USER_MANAGEMENT permission */}
      {canViewManagement && (
        <Tab.Screen
          name="Management"
          component={ManagementStack}
          options={{
            tabBarLabel: 'Management',
            tabBarAccessibilityLabel: 'Management tab',
            tabBarIcon: ({ color }) => (
              <Icon name="people" size={BottomNavMD3.item.icon} color={color} />
            ),
          }}
        />
      )}

      {/* Analytics - requires ANALYTICS_VIEW permission */}
      {canViewAnalytics && (
        <Tab.Screen
          name="Analytics"
          component={AnalyticsStack}
          options={{
            tabBarLabel: 'Analytics',
            tabBarAccessibilityLabel: 'Analytics tab',
            tabBarIcon: ({ color }) => (
              <Icon name="analytics" size={BottomNavMD3.item.icon} color={color} />
            ),
          }}
        />
      )}

      {/* System - requires SYSTEM_SETTINGS permission */}
      {canViewSystem && (
        <Tab.Screen
          name="System"
          component={SystemStack}
          options={{
            tabBarLabel: 'System',
            tabBarAccessibilityLabel: 'System tab',
            tabBarIcon: ({ color }) => (
              <Icon name="settings" size={BottomNavMD3.item.icon} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
