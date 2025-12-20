import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAdminDashboardQuery } from '../../../hooks/queries/admin';
import { useAuthStore } from '../../../stores/authStore';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../error/errorReporting';

const WIDGET_ID = 'admin.hero-card';

// Get greeting based on time of day
const getGreeting = (t: (key: string, options?: object) => string): string => {
  const hour = new Date().getHours();
  if (hour < 12) return t('widgets.adminHero.greetings.morning', { defaultValue: 'Good Morning' });
  if (hour < 17) return t('widgets.adminHero.greetings.afternoon', { defaultValue: 'Good Afternoon' });
  return t('widgets.adminHero.greetings.evening', { defaultValue: 'Good Evening' });
};

// Format currency
const formatCurrency = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};

export const AdminHeroWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  branding,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuthStore();
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  const { data, isLoading, error } = useAdminDashboardQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options with defaults
  const showAvatar = config?.showAvatar !== false;
  const showQuickStats = config?.showQuickStats !== false;
  const showNotificationBadge = config?.showNotificationBadge !== false;
  const showSettingsButton = config?.showSettingsButton !== false;
  const avatarStyle = (config?.avatarStyle as string) || 'circle';
  const statsLayout = (config?.statsLayout as string) || 'horizontal';

  const greeting = getGreeting(t);
  const userName = user?.email?.split('@')[0] || t('widgets.adminHero.defaultName', { defaultValue: 'Admin' });
  const appName = branding?.appName || 'EduPlatform';

  const avatarBorderRadius = avatarStyle === 'circle' ? 28 : avatarStyle === 'rounded' ? 12 : 4;

  // Handle navigation actions
  const handleNotificationsPress = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'notifications' });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_notifications_tap`, level: 'info' });
    onNavigate?.('notifications-admin');
  };

  const handleSettingsPress = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'settings' });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_settings_tap`, level: 'info' });
    onNavigate?.('system-settings');
  };

  const handleProfilePress = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'profile' });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_profile_tap`, level: 'info' });
    onNavigate?.('profile-admin');
  };

  const handleStatPress = (stat: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'stat_tap', stat });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_stat_tap`, level: 'info', data: { stat } });
    
    switch (stat) {
      case 'users':
        onNavigate?.('users-management');
        break;
      case 'revenue':
        onNavigate?.('finance-dashboard');
        break;
      case 'alerts':
        onNavigate?.('system-monitoring');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.primaryContainer }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.large }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {showAvatar && (
            <TouchableOpacity
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.primary,
                  borderRadius: avatarBorderRadius,
                },
              ]}
              onPress={handleProfilePress}
              accessibilityLabel={t('widgets.adminHero.avatarHint', { defaultValue: 'View profile' })}
              accessibilityRole="button"
            >
              <AppText style={[styles.avatarText, { color: colors.onPrimary }]}>
                {userName.substring(0, 2).toUpperCase()}
              </AppText>
            </TouchableOpacity>
          )}
          <View style={styles.textContainer}>
            <AppText style={[styles.greeting, { color: colors.onPrimaryContainer }]}>
              {greeting} 👋
            </AppText>
            <AppText style={[styles.userName, { color: colors.onPrimaryContainer }]}>
              {userName}
            </AppText>
            <AppText style={[styles.subtitle, { color: colors.onPrimaryContainer }]}>
              {t('widgets.adminHero.subtitle', { appName, defaultValue: `${appName} Dashboard` })}
            </AppText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {showNotificationBadge && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={handleNotificationsPress}
              accessibilityLabel={t('widgets.adminHero.notificationsHint', { defaultValue: 'View notifications' })}
              accessibilityRole="button"
            >
              <Icon name="bell-outline" size={22} color={colors.onSurface} />
              {(data?.alertCount || 0) > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <AppText style={[styles.badgeText, { color: colors.onError }]}>
                    {data?.alertCount}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          )}
          {showSettingsButton && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={handleSettingsPress}
              accessibilityLabel={t('widgets.adminHero.settingsHint', { defaultValue: 'Open settings' })}
              accessibilityRole="button"
            >
              <Icon name="cog-outline" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Stats */}
      {showQuickStats && size !== 'compact' && (
        <View
          style={[
            styles.statsRow,
            { backgroundColor: `${colors.surface}80` },
            statsLayout === 'grid' && styles.statsGrid,
          ]}
        >
          {/* Total Users */}
          <TouchableOpacity
            style={[styles.statItem, statsLayout === 'grid' && styles.statItemGrid]}
            onPress={() => handleStatPress('users')}
            accessibilityLabel={t('widgets.adminHero.usersStatHint', { count: data?.totalUsers || 0 })}
            accessibilityRole="button"
          >
            <Icon name="account-group" size={20} color={colors.primary} />
            <AppText style={[styles.statValue, { color: colors.onPrimaryContainer }]}>
              {data?.totalUsers?.toLocaleString() || '0'}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>
              {t('widgets.adminHero.stats.users', { defaultValue: 'Users' })}
            </AppText>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />

          {/* Revenue */}
          <TouchableOpacity
            style={[styles.statItem, statsLayout === 'grid' && styles.statItemGrid]}
            onPress={() => handleStatPress('revenue')}
            accessibilityLabel={t('widgets.adminHero.revenueStatHint', { amount: formatCurrency(data?.revenue || 0) })}
            accessibilityRole="button"
          >
            <Icon name="currency-inr" size={20} color={colors.success} />
            <AppText style={[styles.statValue, { color: colors.onPrimaryContainer }]}>
              {formatCurrency(data?.revenue || 0)}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>
              {t('widgets.adminHero.stats.revenue', { defaultValue: 'Revenue' })}
            </AppText>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />

          {/* Alerts */}
          <TouchableOpacity
            style={[styles.statItem, statsLayout === 'grid' && styles.statItemGrid]}
            onPress={() => handleStatPress('alerts')}
            accessibilityLabel={t('widgets.adminHero.alertsStatHint', { count: data?.alertCount || 0 })}
            accessibilityRole="button"
          >
            <Icon
              name="alert-circle"
              size={20}
              color={(data?.alertCount || 0) > 0 ? colors.error : colors.outline}
            />
            <AppText style={[styles.statValue, { color: colors.onPrimaryContainer }]}>
              {data?.alertCount || 0}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>
              {t('widgets.adminHero.stats.alerts', { defaultValue: 'Alerts' })}
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statsGrid: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statItemGrid: {
    flex: 0,
    width: '33%',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 32,
    opacity: 0.3,
  },
});
