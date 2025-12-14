/**
 * Settings Screen (MD3)
 * App settings and preferences with i18n and dark mode support
 */

import React from 'react';
import { Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, T, Card, CardContent, ListItemMD3 as ListItem } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<ParentStackParamList, 'Settings'>;

const SettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme, theme } = useTheme();
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [emailAlerts, setEmailAlerts] = React.useState(true);

  // Use theme colors instead of static Colors
  const colors = {
    primary: theme.Primary,
    textSecondary: theme.OnSurfaceVariant,
    error: theme.Error,
  };

  React.useEffect(() => {
    console.log('⚙️ [SettingsScreen] Mounted');
    console.log('🌐 [SettingsScreen] Current language:', i18n.language);
    console.log('🎨 [SettingsScreen] isDark:', isDark);
    console.log('🎨 [SettingsScreen] Theme colors:', theme.Primary, theme.Surface, theme.OnSurface);
    trackAction('view_settings', 'Settings');
  }, [isDark]);

  // Get current language display name
  const getCurrentLanguage = () => {
    const langName = i18n.language === 'hi' ? t('language.hindi') : t('language.english');
    console.log('🌐 [SettingsScreen] getCurrentLanguage:', i18n.language, '->', langName);
    return langName;
  };

  // Handle external link opening
  const handleOpenLink = (url: string, label: string) => {
    trackAction('open_external_link', 'Settings', { link: label });
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  // Handle change password
  const handleChangePassword = () => {
    trackAction('change_password', 'Settings');
    Alert.alert(
      'Change Password',
      'To change your password:\n\n1. Contact school administration\n2. Email: admin@school.com\n3. Phone: +91-1800-123-4567\n\n(Self-service password reset coming soon)',
      [{ text: 'OK' }]
    );
  };

  // Handle logout
  const handleLogout = () => {
    trackAction('logout', 'Settings');
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
              console.log('🚪 [SettingsScreen] Logging out...');

              // Clear navigation state to return to role selection
              await AsyncStorage.removeItem('NAVIGATION_STATE');

              // Perform logout
              await logout();

              console.log('✅ [SettingsScreen] Logged out successfully');

              // The app will automatically show role selection screen
              // because selectedRole will reset when AuthContext user becomes null
            } catch (error) {
              console.error('❌ [SettingsScreen] Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <BaseScreen scrollable loading={false} error={null} empty={false}>
      <Col sx={{ p: 'md' }}>
        {/* Header */}
        <Col sx={{ mb: 'lg' }}>
          <T variant="headline" weight="bold">{t('settings.title')}</T>
          <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
            {t('settings.subtitle')}
          </T>
        </Col>

        {/* Account Section */}
        <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
          {t('settings.account')}
        </T>
        <Card variant="elevated" style={{ marginBottom: Spacing.lg }}>
          <Col>
            <ListItem
              title={t('settings.profile')}
              subtitle={t('settings.profileSubtitle')}
              leading={<T variant="headline">👤</T>}
              trailing={<T variant="body" color="textSecondary">›</T>}
              onPress={() => {
                trackAction('view_profile', 'Settings');
                safeNavigate('Profile');
              }}
            />
            <ListItem
              title={t('settings.changePassword')}
              subtitle={t('settings.changePasswordSubtitle')}
              leading={<T variant="headline">🔒</T>}
              trailing={<T variant="body" color="textSecondary">›</T>}
              onPress={handleChangePassword}
            />
            <ListItem
              title={t('settings.language')}
              subtitle={getCurrentLanguage()}
              leading={<T variant="headline">🌐</T>}
              trailing={<T variant="body" color="textSecondary">›</T>}
              onPress={() => {
                console.log('🌐 [SettingsScreen] Language pressed, navigating to LanguageSelection');
                trackAction('change_language', 'Settings');
                safeNavigate('LanguageSelection');
              }}
            />
          </Col>
        </Card>

        {/* Notifications Section */}
        <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
          {t('settings.notifications')}
        </T>
        <Card variant="elevated" style={{ marginBottom: Spacing.lg }}>
          <Col>
            <ListItem
              title={t('settings.pushNotifications')}
              subtitle={t('settings.pushNotificationsSubtitle')}
              leading={<T variant="headline">🔔</T>}
              trailing={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(value) => {
                    setNotificationsEnabled(value);
                    trackAction('toggle_notifications', 'Settings', { enabled: value });
                  }}
                  color={colors.primary}
                />
              }
            />
            <ListItem
              title={t('settings.emailAlerts')}
              subtitle={t('settings.emailAlertsSubtitle')}
              leading={<T variant="headline">📧</T>}
              trailing={
                <Switch
                  value={emailAlerts}
                  onValueChange={(value) => {
                    setEmailAlerts(value);
                    trackAction('toggle_email_alerts', 'Settings', { enabled: value });
                  }}
                  color={colors.primary}
                />
              }
            />
          </Col>
        </Card>

        {/* Appearance Section */}
        <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
          {t('settings.appearance')}
        </T>
        <Card variant="elevated" style={{ marginBottom: Spacing.lg }}>
          <Col>
            <ListItem
              title={t('settings.darkMode')}
              subtitle={t('settings.darkModeSubtitle')}
              leading={<T variant="headline">{isDark ? '🌙' : '☀️'}</T>}
              trailing={
                <Switch
                  value={isDark}
                  onValueChange={async () => {
                    console.log('🎨 [SettingsScreen] Dark mode toggle pressed, current isDark:', isDark);
                    await toggleTheme();
                    console.log('✅ [SettingsScreen] Dark mode toggled');
                    trackAction('toggle_dark_mode', 'Settings', { enabled: !isDark });
                  }}
                  color={colors.primary}
                />
              }
            />
          </Col>
        </Card>

        {/* About Section */}
        <T variant="title" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
          {t('settings.about')}
        </T>
        <Card variant="elevated" style={{ marginBottom: Spacing.lg }}>
          <Col>
            <ListItem
              title={t('settings.helpSupport')}
              subtitle={t('settings.helpSupportSubtitle')}
              leading={<T variant="headline">❓</T>}
              trailing={<T variant="body" color="textSecondary">›</T>}
              onPress={() => {
                trackAction('view_help', 'Settings');
                safeNavigate('HelpFeedback');
              }}
            />
            <ListItem
              title={t('settings.privacyPolicy')}
              subtitle={t('settings.privacyPolicySubtitle')}
              leading={<T variant="headline">🔐</T>}
              trailing={<T variant="body" color="textSecondary">›</T>}
              onPress={() => {
                trackAction('view_legal_privacy', 'Settings');
                // @ts-expect-error - Student routes not in ParentStackParamList
                safeNavigate('LegalScreen');
              }}
            />
            <ListItem
              title={t('settings.termsOfService')}
              subtitle={t('settings.termsOfServiceSubtitle')}
              leading={<T variant="headline">📄</T>}
              trailing={<T variant="body" color="textSecondary">›</T>}
              onPress={() => {
                trackAction('view_legal_terms', 'Settings');
                // @ts-expect-error - Student routes not in ParentStackParamList
                safeNavigate('LegalScreen');
              }}
            />
            <ListItem
              title={t('settings.appVersion')}
              subtitle="1.0.0 (Build 1)"
              leading={<T variant="headline">ℹ️</T>}
            />
          </Col>
        </Card>

        {/* Logout Button */}
        <Card variant="outlined" onPress={handleLogout} style={{ borderColor: colors.error }}>
          <CardContent>
            <T variant="body" align="center" color="error" weight="semiBold">
              {t('settings.logout')}
            </T>
          </CardContent>
        </Card>
      </Col>
    </BaseScreen>
  );
};

export default SettingsScreen;
