import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTeacherDashboardQuery } from '../../../hooks/queries/teacher';
import { useAuthStore } from '../../../stores/authStore';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../error/errorReporting';

const WIDGET_ID = 'teacher.hero-card';

// Get greeting based on time of day
const getGreeting = (t: (key: string, options?: object) => string): string => {
  const hour = new Date().getHours();
  if (hour < 12) return t('widgets.teacherHero.greetings.morning', { defaultValue: 'Good Morning' });
  if (hour < 17) return t('widgets.teacherHero.greetings.afternoon', { defaultValue: 'Good Afternoon' });
  return t('widgets.teacherHero.greetings.evening', { defaultValue: 'Good Evening' });
};

export const TeacherHeroWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  branding,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const { user } = useAuthStore();
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  const { data, isLoading, error } = useTeacherDashboardQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options with defaults
  const showAvatar = config?.showAvatar !== false;
  const showQuickStats = config?.showQuickStats !== false;
  const showNotificationBadge = config?.showNotificationBadge !== false;
  const showScheduleButton = config?.showScheduleButton !== false;
  const avatarStyle = (config?.avatarStyle as string) || 'circle';
  const statsLayout = (config?.statsLayout as string) || 'horizontal';

  const greeting = getGreeting(t);
  const userName = user?.email?.split('@')[0] || t('widgets.teacherHero.defaultName', { defaultValue: 'Teacher' });
  const appName = branding?.appName || 'EduPlatform';

  const avatarBorderRadius = avatarStyle === 'circle' ? 28 : avatarStyle === 'rounded' ? 12 : 4;

  // Handle navigation actions
  const handleNotificationsPress = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'notifications' });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_notifications_tap`, level: 'info' });
    onNavigate?.('notifications-teacher');
  };

  const handleSchedulePress = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'schedule' });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_schedule_tap`, level: 'info' });
    onNavigate?.('teacher-schedule');
  };

  const handleProfilePress = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'profile' });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_profile_tap`, level: 'info' });
    onNavigate?.('profile-teacher');
  };

  const handleStatPress = (stat: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'stat_tap', stat });
    addBreadcrumb({ category: 'widget', message: `${WIDGET_ID}_stat_tap`, level: 'info', data: { stat } });

    switch (stat) {
      case 'classes':
        onNavigate?.('teacher-schedule');
        break;
      case 'grading':
        onNavigate?.('pending-grading');
        break;
      case 'attendance':
        onNavigate?.('class-attendance');
        break;
      case 'atrisk':
        onNavigate?.('at-risk-students');
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
              accessibilityLabel={t('widgets.teacherHero.avatarHint', { defaultValue: 'View profile' })}
              accessibilityRole="button"
            >
              <AppText style={[styles.avatarText, { color: colors.onPrimary }]}>
                {userName.substring(0, 2).toUpperCase()}
              </AppText>
            </TouchableOpacity>
          )}
          <View style={styles.textContainer}>
            <AppText style={[styles.greeting, { color: colors.onPrimaryContainer }]}>
              {greeting}
            </AppText>
            <AppText style={[styles.userName, { color: colors.onPrimaryContainer }]}>
              {userName}
            </AppText>
            <AppText style={[styles.subtitle, { color: colors.onPrimaryContainer }]}>
              {t('widgets.teacherHero.subtitle', {
                count: data?.classesToday || 0,
                defaultValue: `${data?.classesToday || 0} classes today`
              })}
            </AppText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {showNotificationBadge && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={handleNotificationsPress}
              accessibilityLabel={t('widgets.teacherHero.notificationsHint', { defaultValue: 'View notifications' })}
              accessibilityRole="button"
            >
              <Icon name="bell-outline" size={22} color={colors.onSurface} />
              {(data?.unreadMessages || 0) > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <AppText style={[styles.badgeText, { color: colors.onError }]}>
                    {data?.unreadMessages}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          )}
          {showScheduleButton && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={handleSchedulePress}
              accessibilityLabel={t('widgets.teacherHero.scheduleHint', { defaultValue: 'View schedule' })}
              accessibilityRole="button"
            >
              <Icon name="calendar-today" size={22} color={colors.onSurface} />
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
          {/* Classes Today */}
          <TouchableOpacity
            style={[styles.statItem, statsLayout === 'grid' && styles.statItemGrid]}
            onPress={() => handleStatPress('classes')}
            accessibilityLabel={t('widgets.teacherHero.classesStatHint', { count: data?.classesToday || 0 })}
            accessibilityRole="button"
          >
            <Icon name="book-open-variant" size={20} color={colors.primary} />
            <AppText style={[styles.statValue, { color: colors.onPrimaryContainer }]}>
              {data?.classesToday || 0}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>
              {t('widgets.teacherHero.stats.classes', { defaultValue: 'Classes' })}
            </AppText>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />

          {/* Pending Grading */}
          <TouchableOpacity
            style={[styles.statItem, statsLayout === 'grid' && styles.statItemGrid]}
            onPress={() => handleStatPress('grading')}
            accessibilityLabel={t('widgets.teacherHero.gradingStatHint', { count: data?.pendingGrading || 0 })}
            accessibilityRole="button"
          >
            <Icon
              name="clipboard-check-outline"
              size={20}
              color={(data?.pendingGrading || 0) > 10 ? colors.warning : colors.success}
            />
            <AppText style={[styles.statValue, { color: colors.onPrimaryContainer }]}>
              {data?.pendingGrading || 0}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>
              {t('widgets.teacherHero.stats.grading', { defaultValue: 'To Grade' })}
            </AppText>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />

          {/* Attendance Rate */}
          <TouchableOpacity
            style={[styles.statItem, statsLayout === 'grid' && styles.statItemGrid]}
            onPress={() => handleStatPress('attendance')}
            accessibilityLabel={t('widgets.teacherHero.attendanceStatHint', { rate: data?.attendanceRate || 0 })}
            accessibilityRole="button"
          >
            <Icon name="account-check" size={20} color={colors.success} />
            <AppText style={[styles.statValue, { color: colors.onPrimaryContainer }]}>
              {data?.attendanceRate?.toFixed(0) || 0}%
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>
              {t('widgets.teacherHero.stats.attendance', { defaultValue: 'Attendance' })}
            </AppText>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />

          {/* At-Risk Students */}
          <TouchableOpacity
            style={[styles.statItem, statsLayout === 'grid' && styles.statItemGrid]}
            onPress={() => handleStatPress('atrisk')}
            accessibilityLabel={t('widgets.teacherHero.atRiskStatHint', { count: data?.atRiskStudents || 0 })}
            accessibilityRole="button"
          >
            <Icon
              name="alert-circle"
              size={20}
              color={(data?.atRiskStudents || 0) > 0 ? colors.error : colors.outline}
            />
            <AppText style={[styles.statValue, { color: colors.onPrimaryContainer }]}>
              {data?.atRiskStudents || 0}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>
              {t('widgets.teacherHero.stats.atRisk', { defaultValue: 'At Risk' })}
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
    width: '25%',
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
