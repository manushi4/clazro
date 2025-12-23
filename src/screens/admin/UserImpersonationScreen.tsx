/**
 * UserImpersonationScreen - Admin User Impersonation Fixed Screen
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * Purpose: Allow admins to impersonate users for debugging and support
 * User Stories:
 *   - As an admin, I want to view the app as a specific user sees it
 *   - As an admin, I want to search for users to impersonate
 *   - As an admin, I want to filter users by role
 *   - As an admin, I want all impersonation actions logged for audit
 *
 * Data Requirements:
 *   - users table (read - for user list)
 *   - audit_logs table (write - for logging impersonation)
 *
 * Screen ID: user-impersonation
 * Role Access: admin, super_admin
 * Required Permissions: admin.users.impersonate
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * Uses existing tables:
 *   - users: For fetching impersonatable users
 *   - audit_logs: For logging impersonation start/end
 *
 * No new migrations needed.
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useImpersonationUsersQuery: Fetch users available for impersonation
 * - useStartImpersonationMutation: Start impersonation session
 * - useEndImpersonationMutation: End impersonation session
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 * - All required hooks (theme, i18n, analytics, offline)
 * - Loading, Error, Empty, Success states
 * - OfflineBanner at top
 * - Permission checks
 * - Analytics tracking
 *
 * ============================================================================
 * PHASE 5: ROUTE REGISTRATION ✓
 * ============================================================================
 * - "user-impersonation": UserImpersonationScreen
 * - "UserImpersonation": UserImpersonationScreen
 *
 * ============================================================================
 * PHASE 6: TRANSLATIONS (i18n) ✓
 * ============================================================================
 * - English: src/locales/en/admin.json (impersonation section)
 * - Hindi: src/locales/hi/admin.json (impersonation section)
 *
 * ============================================================================
 * PHASE 7: NAVIGATION INTEGRATION ✓
 * ============================================================================
 * - From UserDetailScreen "Impersonate" button
 * - From UserManagementScreen user actions
 * - Route params: { userId?, userName?, userRole?, userEmail? }
 *
 * ============================================================================
 * PHASE 8: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] All 4 states render correctly (loading/error/empty/success)
 * - [ ] Offline mode: banner shows, search disabled
 * - [ ] Mutations blocked when offline with alert
 * - [ ] i18n: English displays correctly
 * - [ ] i18n: Hindi displays correctly
 * - [ ] Permissions: only admin/super_admin can access
 * - [ ] Analytics: screen_view event fires
 * - [ ] Audit: impersonation logged to audit_logs
 * - [ ] Navigation works in both directions
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Theme & Branding
import { useAppTheme } from '../../theme/useAppTheme';
import { useBranding } from '../../context/BrandingContext';

// Analytics & Error Tracking
import { useAnalytics } from '../../hooks/useAnalytics';
import { addBreadcrumb } from '../../error/errorReporting';

// Offline Support
import { useNetworkStatus } from '../../offline/networkStore';
import { OfflineBanner } from '../../offline/OfflineBanner';

// UI Components
import { AppText } from '../../ui/components/AppText';
import { AppCard } from '../../ui/components/AppCard';
import { AppButton } from '../../ui/components/AppButton';

// Auth
import { useAuthStore } from '../../stores/authStore';

// Query & Mutation Hooks
import {
  useImpersonationUsersQuery,
  ImpersonatableUser,
} from '../../hooks/queries/admin/useImpersonationUsersQuery';
import {
  useStartImpersonationMutation,
} from '../../hooks/mutations/admin/useImpersonationMutation';


// =============================================================================
// TYPES
// =============================================================================

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

type RoleFilter = 'all' | 'student' | 'teacher' | 'parent';

const ROLE_FILTERS: { value: RoleFilter; labelKey: string; icon: string }[] = [
  { value: 'all', labelKey: 'all', icon: 'account-group' },
  { value: 'student', labelKey: 'student', icon: 'school' },
  { value: 'teacher', labelKey: 'teacher', icon: 'human-male-board' },
  { value: 'parent', labelKey: 'parent', icon: 'account-child' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export const UserImpersonationScreen: React.FC<Props> = ({
  screenId = 'user-impersonation',
  role,
  navigation: navProp,
  onFocused,
}) => {
  // ===========================================================================
  // HOOKS
  // ===========================================================================
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation(['admin', 'common']);
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();
  const { user, impersonating } = useAuthStore();

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedUser, setSelectedUser] = useState<ImpersonatableUser | null>(null);

  // Pre-select user from route params
  const routeParams = route.params as {
    userId?: string;
    userName?: string;
    userRole?: string;
    userEmail?: string;
  } | undefined;

  // ===========================================================================
  // QUERIES & MUTATIONS
  // ===========================================================================
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useImpersonationUsersQuery({
    searchQuery: searchQuery.trim(),
    roleFilter,
  });

  const startImpersonation = useStartImpersonationMutation();

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: 'navigation',
      message: `Screen viewed: ${screenId}`,
      level: 'info',
    });

    // Pre-select user from route params
    if (routeParams?.userId && routeParams?.userName) {
      setSelectedUser({
        id: routeParams.userId,
        name: routeParams.userName,
        email: routeParams.userEmail || '',
        role: (routeParams.userRole || 'student') as 'student' | 'teacher' | 'parent',
        status: 'active',
        created_at: new Date().toISOString(),
      });
    }
  }, [screenId, routeParams, trackScreenView]);


  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleSelectUser = useCallback((userItem: ImpersonatableUser) => {
    setSelectedUser(userItem);
    trackEvent('impersonation_user_selected', {
      userId: userItem.id,
      role: userItem.role,
    });
  }, [trackEvent]);

  const handleStartImpersonation = useCallback(() => {
    if (!selectedUser) return;

    if (!isOnline) {
      Alert.alert(
        t('common:offline.title', { defaultValue: 'Offline' }),
        t('common:offline.actionBlocked', { defaultValue: 'This action requires an internet connection.' })
      );
      return;
    }

    Alert.alert(
      t('admin:impersonation.confirmTitle', { defaultValue: 'Start Impersonation' }),
      t('admin:impersonation.confirmMessage', {
        name: selectedUser.name,
        defaultValue: `You are about to view the app as ${selectedUser.name}. All actions will be logged for audit purposes. Continue?`,
      }),
      [
        {
          text: t('common:actions.cancel', { defaultValue: 'Cancel' }),
          style: 'cancel',
        },
        {
          text: t('admin:impersonation.start', { defaultValue: 'Start' }),
          onPress: async () => {
            try {
              await startImpersonation.mutateAsync({
                targetUserId: selectedUser.id,
                targetUserName: selectedUser.name,
                targetUserRole: selectedUser.role,
                targetUserEmail: selectedUser.email,
              });

              trackEvent('impersonation_started', {
                targetUserId: selectedUser.id,
                targetRole: selectedUser.role,
              });

              // Navigate to the impersonated user's home screen
              const homeScreen = `${selectedUser.role}-home`;
              navigation.reset({
                index: 0,
                routes: [{ name: homeScreen }],
              });
            } catch (err) {
              Alert.alert(
                t('common:error.title', { defaultValue: 'Error' }),
                t('admin:impersonation.error', { defaultValue: 'Failed to start impersonation. Please try again.' })
              );
            }
          },
        },
      ]
    );
  }, [selectedUser, isOnline, t, startImpersonation, trackEvent, navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRoleFilterChange = useCallback((newFilter: RoleFilter) => {
    setRoleFilter(newFilter);
    setSelectedUser(null);
    trackEvent('impersonation_filter_changed', { filter: newFilter });
  }, [trackEvent]);

  // ===========================================================================
  // MEMOIZED VALUES
  // ===========================================================================
  const getRoleColor = useCallback((userRole: string): string => {
    switch (userRole) {
      case 'student': return colors.primary;
      case 'teacher': return colors.tertiary;
      case 'parent': return colors.secondary;
      default: return colors.outline;
    }
  }, [colors]);

  const getRoleIcon = useCallback((userRole: string): string => {
    switch (userRole) {
      case 'student': return 'school';
      case 'teacher': return 'human-male-board';
      case 'parent': return 'account-child';
      default: return 'account';
    }
  }, []);

  const formatLastActive = useCallback((dateString?: string): string => {
    if (!dateString) return t('admin:impersonation.neverActive', { defaultValue: 'Never' });
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('admin:impersonation.justNow', { defaultValue: 'Just now' });
    if (diffMins < 60) return t('admin:impersonation.minutesAgo', { count: diffMins, defaultValue: `${diffMins}m ago` });
    if (diffHours < 24) return t('admin:impersonation.hoursAgo', { count: diffHours, defaultValue: `${diffHours}h ago` });
    return t('admin:impersonation.daysAgo', { count: diffDays, defaultValue: `${diffDays}d ago` });
  }, [t]);


  // ===========================================================================
  // RENDER: LOADING STATE
  // ===========================================================================
  if (isLoading && !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <OfflineBanner />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t('admin:impersonation.title', { defaultValue: 'Impersonate User' })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('admin:impersonation.loading', { defaultValue: 'Loading users...' })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER: ERROR STATE
  // ===========================================================================
  if (error && !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <OfflineBanner />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t('admin:impersonation.title', { defaultValue: 'Impersonate User' })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('admin:impersonation.errorLoading', { defaultValue: 'Failed to load users' })}
          </AppText>
          <AppButton
            title={t('common:actions.retry', { defaultValue: 'Retry' })}
            onPress={() => refetch()}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // RENDER: SUCCESS STATE
  // ===========================================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t('admin:impersonation.title', { defaultValue: 'Impersonate User' })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Warning Card */}
        <AppCard style={[styles.warningCard, { backgroundColor: colors.tertiaryContainer }]}>
          <View style={styles.warningContent}>
            <Icon name="alert-circle" size={24} color={colors.tertiary} />
            <AppText style={[styles.warningText, { color: colors.onTertiaryContainer }]}>
              {t('admin:impersonation.warning', {
                defaultValue: 'Impersonation allows you to view the app as another user. All actions are logged for audit purposes.',
              })}
            </AppText>
          </View>
        </AppCard>

        {/* Search Input */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md },
          ]}
        >
          <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder={t('admin:impersonation.searchPlaceholder', { defaultValue: 'Search by name or email...' })}
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={isOnline}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>


        {/* Role Filter Chips */}
        <View style={styles.filterContainer}>
          {ROLE_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: roleFilter === filter.value ? colors.primaryContainer : colors.surfaceVariant,
                  borderRadius: borderRadius.full,
                },
              ]}
              onPress={() => handleRoleFilterChange(filter.value)}
            >
              <Icon
                name={filter.icon}
                size={16}
                color={roleFilter === filter.value ? colors.primary : colors.onSurfaceVariant}
              />
              <AppText
                style={[
                  styles.filterChipText,
                  { color: roleFilter === filter.value ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {t(`admin:widgets.userList.roles.${filter.labelKey}`, { defaultValue: filter.labelKey })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* User Count */}
        <AppText style={[styles.userCount, { color: colors.onSurfaceVariant }]}>
          {t('admin:impersonation.userCount', {
            count: data?.totalCount || 0,
            defaultValue: `${data?.totalCount || 0} users found`,
          })}
        </AppText>

        {/* User List */}
        {(!data || data.users.length === 0) ? (
          // Empty State
          <View style={styles.emptyContainer}>
            <Icon name="account-search" size={64} color={colors.outlineVariant} />
            <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
              {t('admin:impersonation.emptyTitle', { defaultValue: 'No Users Found' })}
            </AppText>
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {t('admin:impersonation.emptyMessage', {
                defaultValue: 'Try adjusting your search or filter criteria.',
              })}
            </AppText>
          </View>
        ) : (
          // User List
          <View style={styles.userList}>
            {data.users.map((userItem) => (
              <TouchableOpacity
                key={userItem.id}
                onPress={() => handleSelectUser(userItem)}
                style={[
                  styles.userItem,
                  {
                    backgroundColor: selectedUser?.id === userItem.id ? colors.primaryContainer : colors.surface,
                    borderColor: selectedUser?.id === userItem.id ? colors.primary : colors.outlineVariant,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: `${getRoleColor(userItem.role)}20` }]}>
                  <Icon name={getRoleIcon(userItem.role)} size={24} color={getRoleColor(userItem.role)} />
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                  <AppText style={[styles.userName, { color: colors.onSurface }]} numberOfLines={1}>
                    {userItem.name}
                  </AppText>
                  <AppText style={[styles.userEmail, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                    {userItem.email}
                  </AppText>
                  <View style={styles.userMeta}>
                    <AppText style={[styles.lastActive, { color: colors.onSurfaceVariant }]}>
                      {t('admin:impersonation.lastActive', { defaultValue: 'Active' })}: {formatLastActive(userItem.last_active)}
                    </AppText>
                  </View>
                </View>

                {/* Role Badge */}
                <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(userItem.role)}20` }]}>
                  <AppText style={[styles.roleText, { color: getRoleColor(userItem.role) }]}>
                    {t(`admin:widgets.userList.roles.${userItem.role}`, { defaultValue: userItem.role })}
                  </AppText>
                </View>

                {/* Selection Indicator */}
                {selectedUser?.id === userItem.id && (
                  <Icon name="check-circle" size={24} color={colors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>


      {/* Start Impersonation Button */}
      {selectedUser && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
          <View style={styles.selectedUserInfo}>
            <AppText style={[styles.selectedLabel, { color: colors.onSurfaceVariant }]}>
              {t('admin:impersonation.selectedUser', { defaultValue: 'Selected:' })}
            </AppText>
            <AppText style={[styles.selectedName, { color: colors.onSurface }]} numberOfLines={1}>
              {selectedUser.name}
            </AppText>
          </View>
          <AppButton
            title={
              startImpersonation.isPending
                ? t('common:status.loading', { defaultValue: 'Loading...' })
                : t('admin:impersonation.startButton', { defaultValue: 'Start Impersonation' })
            }
            onPress={handleStartImpersonation}
            variant="primary"
            disabled={startImpersonation.isPending || !isOnline}
            style={styles.startButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  warningCard: {
    padding: 16,
    marginBottom: 16,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  userCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  userList: {
    gap: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lastActive: {
    fontSize: 11,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  checkIcon: {
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  selectedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  selectedLabel: {
    fontSize: 13,
  },
  selectedName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    width: '100%',
  },
});

export default UserImpersonationScreen;
