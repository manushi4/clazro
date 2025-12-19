# 🔧 ADMIN PHASE 1 - DEMO-READY IMPLEMENTATION GUIDE

> **Version:** 1.0.0
> **Date:** December 2024
> **Scope:** Admin Role - Phase 1 (Demo Ready)
> **Sprints:** 9 Sprints
> **Total:** 4 Fixed Screens, 12 Dynamic Screens, 33 Widgets

---

## 📋 TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Sprint 1: Foundation + Auth](#2-sprint-1-foundation--auth)
3. [Sprint 2: Dashboard Core](#3-sprint-2-dashboard-core)
4. [Sprint 3: User Management](#4-sprint-3-user-management)
5. [Sprint 4: User CRUD + Impersonation](#5-sprint-4-user-crud--impersonation)
6. [Sprint 5: Finance Dashboard](#6-sprint-5-finance-dashboard)
7. [Sprint 6: Finance Charts + Reports](#7-sprint-6-finance-charts--reports)
8. [Sprint 7: Analytics Dashboard](#8-sprint-7-analytics-dashboard)
9. [Sprint 8: Content + Org Management](#9-sprint-8-content--org-management)
10. [Sprint 9: Settings + Audit](#10-sprint-9-settings--audit)
11. [Database Schema](#11-database-schema)
12. [Platform Studio Config](#12-platform-studio-config)
13. [Testing Checklist](#13-testing-checklist)

---

## 1. OVERVIEW

### 1.1 Phase 1 Scope Summary

| Component | Count |
|-----------|-------|
| Fixed Screens | 4 |
| Dynamic Screens | 12 |
| Widgets | 33 |
| Query Hooks | 18 |
| Mutation Hooks | 8 |
| DB Tables | 10 |

### 1.2 File Structure

```
src/
├── screens/admin/
│   ├── index.ts
│   ├── LoginAdminScreen.tsx          # Sprint 1
│   ├── TwoFactorSetupScreen.tsx      # Sprint 1
│   ├── PasswordResetScreen.tsx       # Sprint 3
│   ├── UserImpersonationScreen.tsx   # Sprint 4
│   ├── AdminDashboardScreen.tsx      # Sprint 2
│   ├── UserManagementScreen.tsx      # Sprint 3
│   ├── UserDetailScreen.tsx          # Sprint 3
│   ├── UserCreateScreen.tsx          # Sprint 4
│   ├── FinanceDashboardScreen.tsx    # Sprint 5
│   ├── FinanceReportsScreen.tsx      # Sprint 6
│   ├── AnalyticsDashboardScreen.tsx  # Sprint 7
│   ├── ContentManagementScreen.tsx   # Sprint 8
│   ├── OrgManagementScreen.tsx       # Sprint 8
│   ├── SystemSettingsScreen.tsx      # Sprint 9
│   ├── AuditLogsScreen.tsx           # Sprint 9
│   └── AdminProfileScreen.tsx        # Sprint 9
├── components/widgets/admin/
│   ├── index.ts
│   ├── AdminHeroWidget.tsx           # Sprint 2
│   ├── AdminStatsWidget.tsx          # Sprint 2
│   ├── SystemHealthWidget.tsx        # Sprint 2
│   ├── AlertsWidget.tsx              # Sprint 2
│   ├── QuickActionsWidget.tsx        # Sprint 2
│   ├── RecentActivityWidget.tsx      # Sprint 2
│   ├── UserStatsWidget.tsx           # Sprint 3
│   ├── UserListWidget.tsx            # Sprint 3
│   ├── PendingApprovalsWidget.tsx    # Sprint 3
│   ├── RoleDistributionWidget.tsx    # Sprint 3
│   ├── BulkActionsWidget.tsx         # Sprint 3
│   ├── RecentRegistrationsWidget.tsx # Sprint 4
│   ├── RevenueSummaryWidget.tsx      # Sprint 5
│   ├── ExpenseSummaryWidget.tsx      # Sprint 5
│   ├── NetProfitWidget.tsx           # Sprint 5
│   ├── TransactionsWidget.tsx        # Sprint 5
│   ├── PendingPaymentsWidget.tsx     # Sprint 5
│   ├── MonthlyChartWidget.tsx        # Sprint 6
│   ├── CategoryBreakdownWidget.tsx   # Sprint 6
│   ├── CollectionRateWidget.tsx      # Sprint 6
│   ├── KPIGridWidget.tsx             # Sprint 7
│   ├── TrendsWidget.tsx              # Sprint 7
│   ├── EngagementWidget.tsx          # Sprint 7
│   ├── GrowthWidget.tsx              # Sprint 7
│   ├── ComparisonsWidget.tsx         # Sprint 7
│   ├── ContentStatsWidget.tsx        # Sprint 8
│   ├── ContentListWidget.tsx         # Sprint 8
│   ├── CategoriesWidget.tsx          # Sprint 8
│   ├── OrgTreeWidget.tsx             # Sprint 8
│   ├── ClassListWidget.tsx           # Sprint 8
│   ├── QuickCreateWidget.tsx         # Sprint 8
│   ├── ProfileCardWidget.tsx         # Sprint 9
│   ├── ProfileActivityWidget.tsx     # Sprint 9
│   └── ProfilePreferencesWidget.tsx  # Sprint 9
├── hooks/queries/admin/
│   ├── index.ts
│   ├── useAdminDashboardQuery.ts     # Sprint 2
│   ├── useSystemHealthQuery.ts       # Sprint 2
│   ├── useAlertsQuery.ts             # Sprint 2
│   ├── useUsersQuery.ts              # Sprint 3
│   ├── useUserDetailQuery.ts         # Sprint 3
│   ├── useFinanceSummaryQuery.ts     # Sprint 5
│   ├── useTransactionsQuery.ts       # Sprint 5
│   ├── useFinanceReportsQuery.ts     # Sprint 6
│   ├── useAnalyticsDashboardQuery.ts # Sprint 7
│   ├── useKPIQuery.ts                # Sprint 7
│   ├── useContentQuery.ts            # Sprint 8
│   ├── useOrgQuery.ts                # Sprint 8
│   └── useAuditLogsQuery.ts          # Sprint 9
└── hooks/mutations/admin/
    ├── index.ts
    ├── useAdminAuth.ts               # Sprint 1
    ├── use2FASetup.ts                # Sprint 1
    ├── useCreateUser.ts              # Sprint 4
    ├── useUpdateUser.ts              # Sprint 4
    ├── useSuspendUser.ts             # Sprint 3
    ├── useImpersonateUser.ts         # Sprint 4
    ├── useExportReport.ts            # Sprint 6
    └── useUpdateSettings.ts          # Sprint 9
```

---

## 2. SPRINT 1: FOUNDATION + AUTH

### 2.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Fixed Screen | `login-admin` | 🔲 |
| Fixed Screen | `2fa-setup` | 🔲 |
| Hook | `useAdminAuth` | 🔲 |
| Hook | `use2FASetup` | 🔲 |
| DB Table | `admin_users` | 🔲 |
| DB Table | `admin_sessions` | 🔲 |

### 2.2 LoginAdminScreen.tsx

```typescript
// src/screens/admin/LoginAdminScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { useAppTheme } from '@/theme/useAppTheme';
import { useBranding } from '@/context/BrandingContext';
import { useAdminAuth } from '@/hooks/mutations/admin';
import { BrandedHeader } from '@/components/branding/BrandedHeader';

export const LoginAdminScreen: React.FC = () => {
  const theme = useAppTheme();
  const { branding } = useBranding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending, error } = useAdminAuth();

  const handleLogin = () => {
    login({ email, password });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Surface style={styles.card} elevation={2}>
        {branding?.logoUrl && (
          <Image source={{ uri: branding.logoUrl }} style={styles.logo} />
        )}
        <Text variant="headlineMedium" style={styles.title}>
          Admin Login
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {branding?.appName || 'EduPlatform'} Administration
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
        />

        {error && (
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {error.message}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isPending}
          disabled={isPending || !email || !password}
          style={styles.button}
        >
          Sign In
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('password-reset')}
          style={styles.forgotButton}
        >
          Forgot Password?
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  card: { padding: 24, borderRadius: 12 },
  logo: { width: 80, height: 80, alignSelf: 'center', marginBottom: 16 },
  title: { textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', marginBottom: 24, opacity: 0.7 },
  input: { marginBottom: 16 },
  error: { marginBottom: 16, textAlign: 'center' },
  button: { marginTop: 8 },
  forgotButton: { marginTop: 16 },
});
```

### 2.3 TwoFactorSetupScreen.tsx

```typescript
// src/screens/admin/TwoFactorSetupScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, TextInput, Button, Surface, ProgressBar } from 'react-native-paper';
import { useAppTheme } from '@/theme/useAppTheme';
import { use2FASetup } from '@/hooks/mutations/admin';

export const TwoFactorSetupScreen: React.FC = () => {
  const theme = useAppTheme();
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'qr' | 'verify'>('qr');
  const { 
    generateQR, 
    verifyCode, 
    qrCodeUrl, 
    secret, 
    isPending, 
    error 
  } = use2FASetup();

  useEffect(() => {
    generateQR();
  }, []);

  const handleVerify = () => {
    verifyCode(code, {
      onSuccess: () => {
        // Navigate to dashboard
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.card} elevation={2}>
        <Text variant="headlineSmall" style={styles.title}>
          Two-Factor Authentication
        </Text>

        <ProgressBar 
          progress={step === 'qr' ? 0.5 : 1} 
          style={styles.progress} 
        />

        {step === 'qr' && (
          <>
            <Text variant="bodyMedium" style={styles.instruction}>
              Scan this QR code with your authenticator app
            </Text>
            {qrCodeUrl && (
              <Image source={{ uri: qrCodeUrl }} style={styles.qrCode} />
            )}
            <Text variant="bodySmall" style={styles.secret}>
              Manual entry: {secret}
            </Text>
            <Button mode="contained" onPress={() => setStep('verify')}>
              Next
            </Button>
          </>
        )}

        {step === 'verify' && (
          <>
            <Text variant="bodyMedium" style={styles.instruction}>
              Enter the 6-digit code from your authenticator app
            </Text>
            <TextInput
              label="Verification Code"
              value={code}
              onChangeText={setCode}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />
            {error && (
              <Text style={[styles.error, { color: theme.colors.error }]}>
                {error.message}
              </Text>
            )}
            <Button
              mode="contained"
              onPress={handleVerify}
              loading={isPending}
              disabled={isPending || code.length !== 6}
            >
              Verify & Enable 2FA
            </Button>
          </>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  card: { padding: 24, borderRadius: 12 },
  title: { textAlign: 'center', marginBottom: 16 },
  progress: { marginBottom: 24 },
  instruction: { textAlign: 'center', marginBottom: 16, opacity: 0.7 },
  qrCode: { width: 200, height: 200, alignSelf: 'center', marginBottom: 16 },
  secret: { textAlign: 'center', marginBottom: 24, fontFamily: 'monospace' },
  input: { marginBottom: 16 },
  error: { marginBottom: 16, textAlign: 'center' },
});
```

### 2.4 useAdminAuth Hook

```typescript
// src/hooks/mutations/admin/useAdminAuth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

type LoginCredentials = {
  email: string;
  password: string;
};

export const useAdminAuth = () => {
  const queryClient = useQueryClient();
  const { setUser, setSession } = useAuthStore();

  return useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Verify admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (!['admin', 'super_admin'].includes(profile.role)) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error('Account is suspended. Contact support.');
      }

      // 3. Log admin session
      await supabase.from('admin_sessions').insert({
        admin_id: authData.user.id,
        ip_address: null, // Get from request if available
        user_agent: null,
        started_at: new Date().toISOString(),
      });

      return { user: authData.user, session: authData.session, profile };
    },
    onSuccess: (data) => {
      setUser(data.user);
      setSession(data.session);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
};
```

### 2.5 use2FASetup Hook

```typescript
// src/hooks/mutations/admin/use2FASetup.ts
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import * as OTPAuth from 'otpauth';

export const use2FASetup = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const generateQR = async () => {
    const totp = new OTPAuth.TOTP({
      issuer: 'EduPlatform Admin',
      label: 'admin@eduplatform.com',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.generate(),
    });

    setSecret(totp.secret.base32);
    setQrCodeUrl(totp.toString());
  };

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!secret) throw new Error('Secret not generated');

      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      const isValid = totp.validate({ token: code, window: 1 }) !== null;

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Store encrypted secret in database
      const { error } = await supabase
        .from('admin_users')
        .update({
          two_factor_enabled: true,
          two_factor_secret: secret, // Should be encrypted
        })
        .eq('id', supabase.auth.getUser().then(u => u.data.user?.id));

      if (error) throw error;

      return { success: true };
    },
  });

  return {
    generateQR,
    verifyCode: verifyMutation.mutate,
    qrCodeUrl,
    secret,
    isPending: verifyMutation.isPending,
    error: verifyMutation.error,
  };
};
```

### 2.6 Sprint 1 Checkpoint

✅ **Test Criteria:**
- [ ] Admin can access login screen
- [ ] Invalid credentials show error
- [ ] Non-admin users are rejected
- [ ] Suspended accounts are blocked
- [ ] 2FA QR code generates correctly
- [ ] 2FA verification works
- [ ] Session is created in `admin_sessions`

---

## 3. SPRINT 2: DASHBOARD CORE

### 3.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `admin-home` | 🔲 |
| Widget | `admin.hero-card` | 🔲 |
| Widget | `admin.stats-grid` | 🔲 |
| Widget | `admin.system-health` | 🔲 |
| Widget | `admin.alerts` | 🔲 |
| Widget | `admin.quick-actions` | 🔲 |
| Widget | `admin.recent-activity` | 🔲 |
| Hook | `useAdminDashboardQuery` | 🔲 |
| Hook | `useSystemHealthQuery` | 🔲 |
| Hook | `useAlertsQuery` | 🔲 |
| DB Table | `system_alerts` | 🔲 |
| DB Table | `system_health_metrics` | 🔲 |

### 3.2 AdminDashboardScreen.tsx

```typescript
// src/screens/admin/AdminDashboardScreen.tsx
import React from 'react';
import { DynamicScreen } from '@/navigation/DynamicScreen';

export const AdminDashboardScreen: React.FC = () => {
  return <DynamicScreen screenId="admin-home" />;
};
```

### 3.3 AdminHeroWidget.tsx

```typescript
// src/components/widgets/admin/AdminHeroWidget.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Badge, IconButton, Surface } from 'react-native-paper';
import { useAppTheme } from '@/theme/useAppTheme';
import { useBranding } from '@/context/BrandingContext';
import { useAuthStore } from '@/stores/authStore';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

export const AdminHeroWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { branding } = useBranding();
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <WidgetContainer>
      <Surface style={[styles.container, { backgroundColor: theme.colors.primaryContainer }]}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar.Text
              size={56}
              label={user?.email?.substring(0, 2).toUpperCase() || 'AD'}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.textContainer}>
              <Text variant="titleLarge" style={{ color: theme.colors.onPrimaryContainer }}>
                {getGreeting()}, Admin
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.8 }}>
                {branding?.appName || 'EduPlatform'} Dashboard
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <IconButton
              icon="bell-outline"
              size={24}
              onPress={() => onNavigate?.('notifications-admin')}
            />
            <Badge visible={true} size={8} style={styles.badge} />
            <IconButton
              icon="cog-outline"
              size={24}
              onPress={() => onNavigate?.('system-settings')}
            />
          </View>
        </View>

        {config?.showQuickStats && (
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                1,234
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                Total Users
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                ₹45.2K
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                Revenue
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                3
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                Alerts
              </Text>
            </View>
          </View>
        )}
      </Surface>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textContainer: { marginLeft: 12, flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  badge: { position: 'absolute', top: 8, right: 48 },
  quickStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  statItem: { alignItems: 'center' },
});
```

### 3.4 AdminStatsWidget.tsx

```typescript
// src/components/widgets/admin/AdminStatsWidget.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useAdminDashboardQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

type StatItem = {
  id: string;
  label: string;
  value: string | number;
  icon: string;
  trend?: number;
  color: string;
  route?: string;
};

export const AdminStatsWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data, isLoading } = useAdminDashboardQuery();

  const stats: StatItem[] = [
    {
      id: 'users',
      label: 'Total Users',
      value: data?.totalUsers || 0,
      icon: 'account-group',
      trend: data?.usersTrend,
      color: theme.colors.primary,
      route: 'users-management',
    },
    {
      id: 'active',
      label: 'Active Now',
      value: data?.activeUsers || 0,
      icon: 'account-check',
      color: theme.colors.tertiary,
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: `₹${(data?.revenue || 0).toLocaleString()}`,
      icon: 'currency-inr',
      trend: data?.revenueTrend,
      color: '#4CAF50',
      route: 'finance-dashboard',
    },
    {
      id: 'alerts',
      label: 'Alerts',
      value: data?.alertCount || 0,
      icon: 'alert-circle',
      color: data?.alertCount > 0 ? theme.colors.error : theme.colors.outline,
    },
  ];

  const columns = config?.columns || 2;

  return (
    <WidgetContainer title="Overview" isLoading={isLoading}>
      <View style={[styles.grid, { gap: 12 }]}>
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.id}
            style={[styles.statCard, { width: `${100 / columns - 2}%` }]}
            onPress={() => stat.route && onNavigate?.(stat.route)}
            disabled={!stat.route}
          >
            <Surface style={styles.cardSurface} elevation={1}>
              <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                <Icon name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text variant="headlineSmall" style={styles.value}>
                {stat.value}
              </Text>
              <Text variant="bodySmall" style={styles.label}>
                {stat.label}
              </Text>
              {stat.trend !== undefined && (
                <View style={styles.trendContainer}>
                  <Icon
                    name={stat.trend >= 0 ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={stat.trend >= 0 ? '#4CAF50' : theme.colors.error}
                  />
                  <Text
                    variant="labelSmall"
                    style={{ color: stat.trend >= 0 ? '#4CAF50' : theme.colors.error }}
                  >
                    {Math.abs(stat.trend)}%
                  </Text>
                </View>
              )}
            </Surface>
          </TouchableOpacity>
        ))}
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { marginBottom: 4 },
  cardSurface: { padding: 16, borderRadius: 12, alignItems: 'center' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  value: { fontWeight: 'bold', marginBottom: 2 },
  label: { opacity: 0.7, textAlign: 'center' },
  trendContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 2 },
});
```

### 3.5 SystemHealthWidget.tsx

```typescript
// src/components/widgets/admin/SystemHealthWidget.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar, Chip, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useSystemHealthQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

export const SystemHealthWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data, isLoading } = useSystemHealthQuery();

  const getStatusColor = (value: number, warning = 70, critical = 90) => {
    if (value >= critical) return theme.colors.error;
    if (value >= warning) return '#FF9800';
    return '#4CAF50';
  };

  const overallStatus = data?.status || 'healthy';
  const statusConfig = {
    healthy: { color: '#4CAF50', icon: 'check-circle', label: 'All Systems Operational' },
    warning: { color: '#FF9800', icon: 'alert', label: 'Minor Issues Detected' },
    critical: { color: theme.colors.error, icon: 'alert-circle', label: 'Critical Issues' },
  };

  const status = statusConfig[overallStatus as keyof typeof statusConfig];

  return (
    <WidgetContainer title="System Health" isLoading={isLoading}>
      <Surface style={[styles.statusBanner, { backgroundColor: status.color + '15' }]} elevation={0}>
        <Icon name={status.icon} size={24} color={status.color} />
        <Text variant="titleMedium" style={{ color: status.color, marginLeft: 8 }}>
          {status.label}
        </Text>
      </Surface>

      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <Text variant="bodyMedium">Uptime</Text>
          <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
            {data?.uptime || '99.9'}%
          </Text>
        </View>
        <ProgressBar
          progress={(data?.uptime || 99.9) / 100}
          color="#4CAF50"
          style={styles.progressBar}
        />

        <View style={styles.metricRow}>
          <Text variant="bodyMedium">CPU Usage</Text>
          <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
            {data?.cpuUsage || 45}%
          </Text>
        </View>
        <ProgressBar
          progress={(data?.cpuUsage || 45) / 100}
          color={getStatusColor(data?.cpuUsage || 45)}
          style={styles.progressBar}
        />

        <View style={styles.metricRow}>
          <Text variant="bodyMedium">Memory</Text>
          <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
            {data?.memoryUsage || 62}%
          </Text>
        </View>
        <ProgressBar
          progress={(data?.memoryUsage || 62) / 100}
          color={getStatusColor(data?.memoryUsage || 62)}
          style={styles.progressBar}
        />

        <View style={styles.metricRow}>
          <Text variant="bodyMedium">Active Users</Text>
          <Chip compact>{data?.activeUsers || 156}</Chip>
        </View>
      </View>

      {config?.showDetailsLink && (
        <Text
          variant="labelMedium"
          style={[styles.viewMore, { color: theme.colors.primary }]}
          onPress={() => onNavigate?.('system-monitoring')}
        >
          View Details →
        </Text>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 16 },
  metricsContainer: { gap: 12 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBar: { height: 6, borderRadius: 3 },
  viewMore: { textAlign: 'right', marginTop: 12 },
});
```

### 3.6 AlertsWidget.tsx

```typescript
// src/components/widgets/admin/AlertsWidget.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, Chip, IconButton, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useAlertsQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';
import { formatDistanceToNow } from 'date-fns';

type Alert = {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  created_at: string;
  acknowledged: boolean;
};

export const AlertsWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate, onAction }) => {
  const theme = useAppTheme();
  const { data: alerts, isLoading } = useAlertsQuery({
    limit: config?.maxItems || 5,
    severity: config?.severityFilter,
  });

  const severityConfig = {
    critical: { color: theme.colors.error, icon: 'alert-circle' },
    warning: { color: '#FF9800', icon: 'alert' },
    info: { color: theme.colors.primary, icon: 'information' },
  };

  const renderAlert = ({ item }: { item: Alert }) => {
    const severity = severityConfig[item.severity];

    return (
      <TouchableOpacity
        style={[styles.alertItem, item.acknowledged && styles.acknowledged]}
        onPress={() => onNavigate?.('alert-detail', { alertId: item.id })}
      >
        <View style={[styles.severityIndicator, { backgroundColor: severity.color }]} />
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Icon name={severity.icon} size={18} color={severity.color} />
            <Text variant="titleSmall" style={styles.alertTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Chip compact style={styles.sourceChip}>
              {item.source}
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.alertMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text variant="labelSmall" style={styles.alertTime}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
        {config?.showAcknowledge && !item.acknowledged && (
          <IconButton
            icon="check"
            size={20}
            onPress={() => onAction?.('acknowledge_alert', { alertId: item.id })}
          />
        )}
      </TouchableOpacity>
    );
  };

  const emptyComponent = (
    <View style={styles.emptyContainer}>
      <Icon name="check-circle-outline" size={48} color={theme.colors.outline} />
      <Text variant="bodyMedium" style={styles.emptyText}>
        No alerts at this time
      </Text>
    </View>
  );

  return (
    <WidgetContainer
      title="Alerts"
      isLoading={isLoading}
      action={
        config?.showViewAll && (
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.primary }}
            onPress={() => onNavigate?.('alerts-list')}
          >
            View All
          </Text>
        )
      }
    >
      <FlatList
        data={alerts || []}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        ListEmptyComponent={emptyComponent}
        scrollEnabled={false}
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  alertItem: { flexDirection: 'row', paddingVertical: 12 },
  acknowledged: { opacity: 0.6 },
  severityIndicator: { width: 4, borderRadius: 2, marginRight: 12 },
  alertContent: { flex: 1 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  alertTitle: { flex: 1 },
  sourceChip: { height: 20 },
  alertMessage: { opacity: 0.7, marginBottom: 4 },
  alertTime: { opacity: 0.5 },
  divider: { marginVertical: 4 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```

### 3.7 QuickActionsWidget.tsx

```typescript
// src/components/widgets/admin/QuickActionsWidget.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

type QuickAction = {
  id: string;
  label: string;
  icon: string;
  color: string;
  route: string;
  params?: Record<string, unknown>;
};

export const QuickActionsWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();

  const actions: QuickAction[] = [
    { id: 'add-user', label: 'Add User', icon: 'account-plus', color: theme.colors.primary, route: 'users-create' },
    { id: 'view-reports', label: 'Reports', icon: 'file-chart', color: '#4CAF50', route: 'finance-reports' },
    { id: 'settings', label: 'Settings', icon: 'cog', color: '#FF9800', route: 'system-settings' },
    { id: 'audit', label: 'Audit Logs', icon: 'shield-check', color: '#9C27B0', route: 'audit-logs' },
  ];

  return (
    <WidgetContainer title="Quick Actions">
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={() => onNavigate?.(action.route, action.params)}
          >
            <Surface style={[styles.iconSurface, { backgroundColor: action.color + '15' }]} elevation={0}>
              <Icon name={action.icon} size={28} color={action.color} />
            </Surface>
            <Text variant="labelMedium" style={styles.actionLabel}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { width: '23%', alignItems: 'center', marginBottom: 8 },
  iconSurface: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { textAlign: 'center' },
});
```

### 3.8 RecentActivityWidget.tsx

```typescript
// src/components/widgets/admin/RecentActivityWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import { useAppTheme } from '@/theme/useAppTheme';
import { useAdminDashboardQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';
import { formatDistanceToNow } from 'date-fns';

type Activity = {
  id: string;
  type: 'user_created' | 'user_updated' | 'payment_received' | 'setting_changed' | 'login';
  actor: string;
  description: string;
  created_at: string;
};

export const RecentActivityWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data } = useAdminDashboardQuery();

  const activityIcons: Record<string, { icon: string; color: string }> = {
    user_created: { icon: 'AP', color: theme.colors.primary },
    user_updated: { icon: 'UU', color: '#FF9800' },
    payment_received: { icon: 'PR', color: '#4CAF50' },
    setting_changed: { icon: 'SC', color: '#9C27B0' },
    login: { icon: 'LI', color: theme.colors.tertiary },
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    const config = activityIcons[item.type] || { icon: 'AC', color: theme.colors.outline };

    return (
      <View style={styles.activityItem}>
        <Avatar.Text
          size={36}
          label={config.icon}
          style={{ backgroundColor: config.color }}
        />
        <View style={styles.activityContent}>
          <Text variant="bodyMedium" numberOfLines={2}>
            {item.description}
          </Text>
          <Text variant="labelSmall" style={styles.activityTime}>
            {item.actor} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <WidgetContainer
      title="Recent Activity"
      action={
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.primary }}
          onPress={() => onNavigate?.('activity-log')}
        >
          View All
        </Text>
      }
    >
      <FlatList
        data={data?.recentActivity?.slice(0, config?.maxItems || 5) || []}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        scrollEnabled={false}
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  activityItem: { flexDirection: 'row', paddingVertical: 8, gap: 12 },
  activityContent: { flex: 1, justifyContent: 'center' },
  activityTime: { opacity: 0.6, marginTop: 2 },
  divider: { marginVertical: 4 },
});
```

### 3.9 Query Hooks for Sprint 2

```typescript
// src/hooks/queries/admin/useAdminDashboardQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useAdminDashboardQuery = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      // Fetch multiple stats in parallel
      const [usersResult, revenueResult, alertsResult, activityResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('financial_transactions')
          .select('amount')
          .eq('type', 'income')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('system_alerts').select('id', { count: 'exact' }).eq('acknowledged', false),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const totalRevenue = revenueResult.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      return {
        totalUsers: usersResult.count || 0,
        activeUsers: Math.floor((usersResult.count || 0) * 0.3), // Placeholder
        revenue: totalRevenue,
        alertCount: alertsResult.count || 0,
        usersTrend: 12, // Placeholder - calculate from historical data
        revenueTrend: 8, // Placeholder
        recentActivity: activityResult.data || [],
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
};

// src/hooks/queries/admin/useSystemHealthQuery.ts
export const useSystemHealthQuery = () => {
  return useQuery({
    queryKey: ['admin', 'system-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_health_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || {
        status: 'healthy',
        uptime: 99.9,
        cpuUsage: 45,
        memoryUsage: 62,
        activeUsers: 156,
        apiLatency: 120,
      };
    },
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  });
};

// src/hooks/queries/admin/useAlertsQuery.ts
export const useAlertsQuery = (options?: { limit?: number; severity?: string }) => {
  return useQuery({
    queryKey: ['admin', 'alerts', options],
    queryFn: async () => {
      let query = supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.severity && options.severity !== 'all') {
        query = query.eq('severity', options.severity);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
```

### 3.10 Sprint 2 Checkpoint

✅ **Test Criteria:**
- [ ] Dashboard loads with all 6 widgets
- [ ] Hero card shows greeting and quick stats
- [ ] Stats grid shows users, revenue, alerts
- [ ] System health shows uptime, CPU, memory
- [ ] Alerts list shows with severity colors
- [ ] Quick actions navigate correctly
- [ ] Recent activity shows latest actions
- [ ] Real-time refresh works (30s/60s intervals)

---

## 4. SPRINT 3: USER MANAGEMENT

### 4.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Fixed Screen | `password-reset` | 🔲 |
| Dynamic Screen | `users-management` | 🔲 |
| Dynamic Screen | `users-detail` | 🔲 |
| Widget | `users.overview-stats` | 🔲 |
| Widget | `users.list` | 🔲 |
| Widget | `users.pending-approvals` | 🔲 |
| Widget | `users.role-distribution` | 🔲 |
| Widget | `users.bulk-actions` | 🔲 |
| Hook | `useUsersQuery` | 🔲 |
| Hook | `useUserDetailQuery` | 🔲 |
| Hook | `useSuspendUser` | 🔲 |
| DB Table | `audit_logs` | 🔲 |

### 4.2 UserListWidget.tsx

```typescript
// src/components/widgets/admin/UserListWidget.tsx
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, Chip, Searchbar, Menu, IconButton, Checkbox, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useUsersQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  avatar_url?: string;
  last_active?: string;
  created_at: string;
};

export const UserListWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate, onAction }) => {
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: users, isLoading, refetch } = useUsersQuery({
    search: searchQuery,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: config?.maxItems || 10,
  });

  const statusColors: Record<string, string> = {
    active: '#4CAF50',
    inactive: theme.colors.outline,
    pending: '#FF9800',
    suspended: theme.colors.error,
  };

  const roleColors: Record<string, string> = {
    student: theme.colors.primary,
    teacher: '#9C27B0',
    parent: '#FF9800',
    admin: theme.colors.error,
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => onNavigate?.('users-detail', { userId: item.id })}
    >
      {config?.showBulkSelect && (
        <Checkbox
          status={selectedUsers.includes(item.id) ? 'checked' : 'unchecked'}
          onPress={() => toggleUserSelection(item.id)}
        />
      )}
      <Avatar.Text
        size={40}
        label={item.full_name?.substring(0, 2).toUpperCase() || 'U'}
        style={{ backgroundColor: roleColors[item.role] || theme.colors.primary }}
      />
      <View style={styles.userInfo}>
        <Text variant="titleSmall" numberOfLines={1}>
          {item.full_name || 'Unknown User'}
        </Text>
        <Text variant="bodySmall" style={styles.email} numberOfLines={1}>
          {item.email}
        </Text>
      </View>
      <View style={styles.userMeta}>
        <Chip compact style={[styles.roleChip, { backgroundColor: roleColors[item.role] + '20' }]}>
          {item.role}
        </Chip>
        <View style={[styles.statusDot, { backgroundColor: statusColors[item.status] }]} />
      </View>
      <IconButton icon="chevron-right" size={20} />
    </TouchableOpacity>
  );

  return (
    <WidgetContainer
      title="Users"
      isLoading={isLoading}
      action={
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton icon="filter-variant" onPress={() => setMenuVisible(true)} />
          }
        >
          <Menu.Item title="All Roles" onPress={() => { setRoleFilter('all'); setMenuVisible(false); }} />
          <Menu.Item title="Students" onPress={() => { setRoleFilter('student'); setMenuVisible(false); }} />
          <Menu.Item title="Teachers" onPress={() => { setRoleFilter('teacher'); setMenuVisible(false); }} />
          <Menu.Item title="Parents" onPress={() => { setRoleFilter('parent'); setMenuVisible(false); }} />
          <Divider />
          <Menu.Item title="Active" onPress={() => { setStatusFilter('active'); setMenuVisible(false); }} />
          <Menu.Item title="Pending" onPress={() => { setStatusFilter('pending'); setMenuVisible(false); }} />
          <Menu.Item title="Suspended" onPress={() => { setStatusFilter('suspended'); setMenuVisible(false); }} />
        </Menu>
      }
    >
      {config?.showSearchBar && (
        <Searchbar
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      )}

      {selectedUsers.length > 0 && (
        <View style={styles.bulkActions}>
          <Text variant="labelMedium">{selectedUsers.length} selected</Text>
          <View style={styles.bulkButtons}>
            <IconButton
              icon="email"
              size={20}
              onPress={() => onAction?.('bulk_email', { userIds: selectedUsers })}
            />
            <IconButton
              icon="account-off"
              size={20}
              onPress={() => onAction?.('bulk_suspend', { userIds: selectedUsers })}
            />
            <IconButton
              icon="close"
              size={20}
              onPress={() => setSelectedUsers([])}
            />
          </View>
        </View>
      )}

      <FlatList
        data={users || []}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-search" size={48} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      {config?.showViewAll && (
        <Text
          variant="labelMedium"
          style={[styles.viewAll, { color: theme.colors.primary }]}
          onPress={() => onNavigate?.('users-management')}
        >
          View All Users →
        </Text>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  searchBar: { marginBottom: 12 },
  bulkActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8, marginBottom: 8 },
  bulkButtons: { flexDirection: 'row' },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  userInfo: { flex: 1 },
  email: { opacity: 0.6 },
  userMeta: { alignItems: 'flex-end', gap: 4 },
  roleChip: { height: 24 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyContainer: { alignItems: 'center', padding: 32 },
  emptyText: { marginTop: 8, opacity: 0.6 },
  viewAll: { textAlign: 'center', marginTop: 12 },
});
```

### 4.3 UserStatsWidget.tsx

```typescript
// src/components/widgets/admin/UserStatsWidget.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useUsersQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

export const UserStatsWidget: React.FC<AdminWidgetProps> = ({ config }) => {
  const theme = useAppTheme();
  const { data: stats, isLoading } = useUsersQuery({ statsOnly: true });

  const statItems = [
    { label: 'Total', value: stats?.total || 0, icon: 'account-group', color: theme.colors.primary },
    { label: 'Active', value: stats?.active || 0, icon: 'account-check', color: '#4CAF50' },
    { label: 'Pending', value: stats?.pending || 0, icon: 'account-clock', color: '#FF9800' },
    { label: 'Suspended', value: stats?.suspended || 0, icon: 'account-off', color: theme.colors.error },
  ];

  return (
    <WidgetContainer title="User Statistics" isLoading={isLoading}>
      <View style={styles.statsRow}>
        {statItems.map((stat) => (
          <Surface key={stat.label} style={styles.statCard} elevation={1}>
            <Icon name={stat.icon} size={24} color={stat.color} />
            <Text variant="headlineSmall" style={styles.statValue}>
              {stat.value}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              {stat.label}
            </Text>
          </Surface>
        ))}
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  statValue: { fontWeight: 'bold', marginTop: 4 },
  statLabel: { opacity: 0.6 },
});
```

### 4.4 RoleDistributionWidget.tsx

```typescript
// src/components/widgets/admin/RoleDistributionWidget.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/theme/useAppTheme';
import { useUsersQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';
import { Dimensions } from 'react-native';

export const RoleDistributionWidget: React.FC<AdminWidgetProps> = ({ config }) => {
  const theme = useAppTheme();
  const { data: stats, isLoading } = useUsersQuery({ statsOnly: true });

  const chartData = [
    { name: 'Students', population: stats?.byRole?.student || 0, color: theme.colors.primary, legendFontColor: theme.colors.onSurface },
    { name: 'Teachers', population: stats?.byRole?.teacher || 0, color: '#9C27B0', legendFontColor: theme.colors.onSurface },
    { name: 'Parents', population: stats?.byRole?.parent || 0, color: '#FF9800', legendFontColor: theme.colors.onSurface },
    { name: 'Admins', population: stats?.byRole?.admin || 0, color: theme.colors.error, legendFontColor: theme.colors.onSurface },
  ].filter(item => item.population > 0);

  const screenWidth = Dimensions.get('window').width - 64;

  return (
    <WidgetContainer title="Users by Role" isLoading={isLoading}>
      {chartData.length > 0 ? (
        <PieChart
          data={chartData}
          width={screenWidth}
          height={180}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      ) : (
        <View style={styles.emptyChart}>
          <Text variant="bodyMedium" style={{ opacity: 0.6 }}>No data available</Text>
        </View>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  emptyChart: { height: 180, justifyContent: 'center', alignItems: 'center' },
});
```

### 4.5 useUsersQuery Hook

```typescript
// src/hooks/queries/admin/useUsersQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

type UseUsersQueryOptions = {
  search?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
  statsOnly?: boolean;
};

export const useUsersQuery = (options?: UseUsersQueryOptions) => {
  return useQuery({
    queryKey: ['admin', 'users', options],
    queryFn: async () => {
      if (options?.statsOnly) {
        // Fetch stats only
        const { data, error } = await supabase
          .from('profiles')
          .select('role, is_active, status');

        if (error) throw error;

        const stats = {
          total: data.length,
          active: data.filter(u => u.is_active).length,
          pending: data.filter(u => u.status === 'pending').length,
          suspended: data.filter(u => u.status === 'suspended').length,
          byRole: {
            student: data.filter(u => u.role === 'student').length,
            teacher: data.filter(u => u.role === 'teacher').length,
            parent: data.filter(u => u.role === 'parent').length,
            admin: data.filter(u => u.role === 'admin').length,
          },
        };

        return stats;
      }

      // Fetch user list
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, role, status, avatar_url, last_active, created_at, is_active')
        .order('created_at', { ascending: false });

      if (options?.search) {
        query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }

      if (options?.role) {
        query = query.eq('role', options.role);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    },
  });
};
```

### 4.6 useSuspendUser Mutation

```typescript
// src/hooks/mutations/admin/useSuspendUser.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

type SuspendUserParams = {
  userId: string;
  reason: string;
  duration?: number; // days, null = permanent
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason, duration }: SuspendUserParams) => {
      const suspendedUntil = duration
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'suspended',
          is_active: false,
          suspended_reason: reason,
          suspended_until: suspendedUntil,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        action: 'user_suspended',
        entity_type: 'user',
        entity_id: userId,
        details: { reason, duration },
        performed_by: (await supabase.auth.getUser()).data.user?.id,
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};
```

### 4.7 Sprint 3 Checkpoint

✅ **Test Criteria:**
- [ ] User management screen loads with all widgets
- [ ] User stats show correct counts
- [ ] User list shows with search and filters
- [ ] Role distribution chart renders
- [ ] Pending approvals list works
- [ ] Bulk selection works
- [ ] User detail screen loads
- [ ] Suspend user action works
- [ ] Audit log entry created on suspend

---

## 5. SPRINT 4: USER CRUD + IMPERSONATION

### 5.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Fixed Screen | `user-impersonation` | 🔲 |
| Dynamic Screen | `users-create` | 🔲 |
| Widget | `users.recent-registrations` | 🔲 |
| Hook | `useCreateUser` | 🔲 |
| Hook | `useUpdateUser` | 🔲 |
| Hook | `useImpersonateUser` | 🔲 |

### 5.2 UserCreateScreen.tsx

```typescript
// src/screens/admin/UserCreateScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Switch, Surface, HelperText } from 'react-native-paper';
import { useAppTheme } from '@/theme/useAppTheme';
import { useCreateUser } from '@/hooks/mutations/admin';
import { BrandedHeader } from '@/components/branding/BrandedHeader';

type UserFormData = {
  email: string;
  full_name: string;
  phone?: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  send_invite: boolean;
  auto_approve: boolean;
};

export const UserCreateScreen: React.FC = ({ navigation }) => {
  const theme = useAppTheme();
  const { mutate: createUser, isPending, error } = useCreateUser();

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    phone: '',
    role: 'student',
    send_invite: true,
    auto_approve: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.full_name) {
      newErrors.full_name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    createUser(formData, {
      onSuccess: (data) => {
        navigation.navigate('users-detail', { userId: data.id });
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <BrandedHeader title="Create User" showBack />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Basic Information
          </Text>

          <TextInput
            label="Full Name *"
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            mode="outlined"
            error={!!errors.full_name}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.full_name}>
            {errors.full_name}
          </HelperText>

          <TextInput
            label="Email *"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label="Phone (Optional)"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Role
          </Text>

          <SegmentedButtons
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value as UserFormData['role'] })}
            buttons={[
              { value: 'student', label: 'Student' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'parent', label: 'Parent' },
              { value: 'admin', label: 'Admin' },
            ]}
            style={styles.segmentedButtons}
          />
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Options
          </Text>

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text variant="bodyMedium">Send Invitation Email</Text>
              <Text variant="bodySmall" style={styles.switchDescription}>
                User will receive an email to set their password
              </Text>
            </View>
            <Switch
              value={formData.send_invite}
              onValueChange={(value) => setFormData({ ...formData, send_invite: value })}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text variant="bodyMedium">Auto-Approve Account</Text>
              <Text variant="bodySmall" style={styles.switchDescription}>
                Skip approval workflow, activate immediately
              </Text>
            </View>
            <Switch
              value={formData.auto_approve}
              onValueChange={(value) => setFormData({ ...formData, auto_approve: value })}
            />
          </View>
        </Surface>

        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error.message}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isPending}
          disabled={isPending}
          style={styles.submitButton}
        >
          Create User
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 16 },
  section: { padding: 16, borderRadius: 12 },
  sectionTitle: { marginBottom: 16 },
  input: { marginBottom: 4 },
  segmentedButtons: { marginTop: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  switchLabel: { flex: 1, marginRight: 16 },
  switchDescription: { opacity: 0.6, marginTop: 2 },
  errorText: { textAlign: 'center', marginVertical: 8 },
  submitButton: { marginTop: 8 },
});
```

### 5.3 UserImpersonationScreen.tsx

```typescript
// src/screens/admin/UserImpersonationScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface, Avatar, Chip, Dialog, Portal } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useImpersonateUser } from '@/hooks/mutations/admin';
import { useUserDetailQuery } from '@/hooks/queries/admin';
import { BrandedHeader } from '@/components/branding/BrandedHeader';

export const UserImpersonationScreen: React.FC = ({ route, navigation }) => {
  const { userId } = route.params;
  const theme = useAppTheme();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { data: user, isLoading } = useUserDetailQuery(userId);
  const { mutate: impersonate, isPending } = useImpersonateUser();

  const handleImpersonate = () => {
    impersonate(userId, {
      onSuccess: () => {
        // Navigate to user's home screen based on role
        const homeScreen = {
          student: 'student-home',
          teacher: 'teacher-home',
          parent: 'parent-home',
          admin: 'admin-home',
        }[user?.role || 'student'];

        navigation.reset({
          index: 0,
          routes: [{ name: homeScreen }],
        });
      },
    });
    setConfirmVisible(false);
  };

  if (isLoading) {
    return <View style={styles.loading}><Text>Loading...</Text></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <BrandedHeader title="Impersonate User" showBack />

      <View style={styles.content}>
        <Surface style={styles.warningBanner} elevation={0}>
          <Icon name="alert" size={24} color="#FF9800" />
          <Text variant="bodyMedium" style={styles.warningText}>
            You are about to view the app as this user. All actions will be logged.
          </Text>
        </Surface>

        <Surface style={styles.userCard} elevation={2}>
          <Avatar.Text
            size={64}
            label={user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <Text variant="headlineSmall" style={styles.userName}>
            {user?.full_name}
          </Text>
          <Text variant="bodyMedium" style={styles.userEmail}>
            {user?.email}
          </Text>
          <Chip style={styles.roleChip}>{user?.role}</Chip>
        </Surface>

        <Surface style={styles.infoCard} elevation={1}>
          <Text variant="titleSmall" style={styles.infoTitle}>
            What happens when you impersonate?
          </Text>
          <View style={styles.infoItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text variant="bodySmall" style={styles.infoText}>
              You'll see exactly what this user sees
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text variant="bodySmall" style={styles.infoText}>
              A banner will show you're impersonating
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text variant="bodySmall" style={styles.infoText}>
              All actions are logged for audit
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="check" size={18} color="#4CAF50" />
            <Text variant="bodySmall" style={styles.infoText}>
              You can exit anytime via the banner
            </Text>
          </View>
        </Surface>

        <Button
          mode="contained"
          onPress={() => setConfirmVisible(true)}
          style={styles.impersonateButton}
          icon="account-switch"
        >
          Start Impersonation
        </Button>
      </View>

      <Portal>
        <Dialog visible={confirmVisible} onDismiss={() => setConfirmVisible(false)}>
          <Dialog.Title>Confirm Impersonation</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to impersonate {user?.full_name}? This action will be logged.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmVisible(false)}>Cancel</Button>
            <Button onPress={handleImpersonate} loading={isPending}>
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  warningBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: '#FFF3E0', marginBottom: 16 },
  warningText: { flex: 1, marginLeft: 12, color: '#E65100' },
  userCard: { padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  userName: { marginTop: 12 },
  userEmail: { opacity: 0.7, marginTop: 4 },
  roleChip: { marginTop: 12 },
  infoCard: { padding: 16, borderRadius: 12, marginBottom: 24 },
  infoTitle: { marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  infoText: { flex: 1, opacity: 0.8 },
  impersonateButton: { marginTop: 'auto' },
});
```

### 5.4 useCreateUser & useImpersonateUser Hooks

```typescript
// src/hooks/mutations/admin/useCreateUser.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

type CreateUserParams = {
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  send_invite: boolean;
  auto_approve: boolean;
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateUserParams) => {
      // 1. Create auth user (if send_invite, Supabase sends email)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: params.email,
        email_confirm: params.auto_approve,
        user_metadata: {
          full_name: params.full_name,
          role: params.role,
        },
      });

      if (authError) throw authError;

      // 2. Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: params.email,
          full_name: params.full_name,
          phone: params.phone,
          role: params.role,
          status: params.auto_approve ? 'active' : 'pending',
          is_active: params.auto_approve,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // 3. Log audit
      await supabase.from('audit_logs').insert({
        action: 'user_created',
        entity_type: 'user',
        entity_id: profile.id,
        details: { role: params.role, auto_approved: params.auto_approve },
        performed_by: (await supabase.auth.getUser()).data.user?.id,
      });

      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

// src/hooks/mutations/admin/useImpersonateUser.ts
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

export const useImpersonateUser = () => {
  const { setImpersonating, setOriginalUser } = useAuthStore();

  return useMutation({
    mutationFn: async (userId: string) => {
      const currentUser = (await supabase.auth.getUser()).data.user;

      // Log impersonation start
      await supabase.from('audit_logs').insert({
        action: 'impersonation_started',
        entity_type: 'user',
        entity_id: userId,
        details: { admin_id: currentUser?.id },
        performed_by: currentUser?.id,
      });

      // Get target user profile
      const { data: targetUser, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { targetUser, originalUserId: currentUser?.id };
    },
    onSuccess: (data) => {
      setOriginalUser(data.originalUserId);
      setImpersonating(data.targetUser);
    },
  });
};
```

### 5.5 Sprint 4 Checkpoint

✅ **Test Criteria:**
- [ ] Create user form validates inputs
- [ ] User created successfully with correct role
- [ ] Invitation email sent (if enabled)
- [ ] Auto-approve works correctly
- [ ] Impersonation warning shows
- [ ] Impersonation starts and logs audit
- [ ] Impersonation banner visible
- [ ] Can exit impersonation

---

## 6. SPRINT 5: FINANCE DASHBOARD

### 6.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `finance-dashboard` | 🔲 |
| Widget | `finance.revenue-summary` | 🔲 |
| Widget | `finance.expense-summary` | 🔲 |
| Widget | `finance.net-profit` | 🔲 |
| Widget | `finance.transactions` | 🔲 |
| Widget | `finance.pending-payments` | 🔲 |
| Hook | `useFinanceSummaryQuery` | 🔲 |
| Hook | `useTransactionsQuery` | 🔲 |
| DB Table | `financial_transactions` | 🔲 |
| DB Table | `payment_records` | 🔲 |

### 6.2 RevenueSummaryWidget.tsx

```typescript
// src/components/widgets/admin/RevenueSummaryWidget.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useFinanceSummaryQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

export const RevenueSummaryWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const [period, setPeriod] = useState<string>(config?.defaultPeriod || 'month');
  const { data, isLoading } = useFinanceSummaryQuery({ period });

  const formatCurrency = (amount: number) => {
    if (config?.abbreviateNumbers && amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <WidgetContainer title="Revenue" isLoading={isLoading}>
      {config?.showPeriodSelector && (
        <SegmentedButtons
          value={period}
          onValueChange={setPeriod}
          buttons={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'quarter', label: 'Quarter' },
          ]}
          style={styles.periodSelector}
          density="small"
        />
      )}

      <Surface style={[styles.mainCard, { backgroundColor: '#4CAF50' + '15' }]} elevation={0}>
        <Text variant="displaySmall" style={[styles.amount, { color: '#4CAF50' }]}>
          {formatCurrency(data?.totalRevenue || 0)}
        </Text>
        {config?.showGrowthPercentage && data?.growth !== undefined && (
          <View style={styles.growthContainer}>
            <Icon
              name={data.growth >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={data.growth >= 0 ? '#4CAF50' : theme.colors.error}
            />
            <Text
              variant="labelMedium"
              style={{ color: data.growth >= 0 ? '#4CAF50' : theme.colors.error }}
            >
              {Math.abs(data.growth)}% vs last {period}
            </Text>
          </View>
        )}
      </Surface>

      {config?.showBreakdown && (
        <View style={styles.breakdown}>
          <View style={styles.breakdownItem}>
            <Text variant="bodySmall" style={styles.breakdownLabel}>Fees</Text>
            <Text variant="titleMedium">{formatCurrency(data?.breakdown?.fees || 0)}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text variant="bodySmall" style={styles.breakdownLabel}>Subscriptions</Text>
            <Text variant="titleMedium">{formatCurrency(data?.breakdown?.subscriptions || 0)}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text variant="bodySmall" style={styles.breakdownLabel}>Other</Text>
            <Text variant="titleMedium">{formatCurrency(data?.breakdown?.other || 0)}</Text>
          </View>
        </View>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  periodSelector: { marginBottom: 16 },
  mainCard: { padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  amount: { fontWeight: 'bold' },
  growthContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  breakdown: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownItem: { alignItems: 'center' },
  breakdownLabel: { opacity: 0.6, marginBottom: 4 },
});
```

### 6.3 TransactionsWidget.tsx

```typescript
// src/components/widgets/admin/TransactionsWidget.tsx
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTransactionsQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';
import { format } from 'date-fns';

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  reference?: string;
};

export const TransactionsWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data: transactions, isLoading } = useTransactionsQuery({
    limit: config?.maxItems || 5,
    type: config?.typeFilter,
  });

  const statusColors = {
    completed: '#4CAF50',
    pending: '#FF9800',
    failed: theme.colors.error,
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => onNavigate?.('transaction-detail', { transactionId: item.id })}
    >
      <View style={[styles.typeIndicator, { backgroundColor: item.type === 'income' ? '#4CAF50' : theme.colors.error }]}>
        <Icon
          name={item.type === 'income' ? 'arrow-down' : 'arrow-up'}
          size={16}
          color="white"
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text variant="titleSmall" numberOfLines={1}>{item.description}</Text>
        <Text variant="bodySmall" style={styles.category}>{item.category}</Text>
      </View>
      <View style={styles.transactionMeta}>
        <Text
          variant="titleSmall"
          style={{ color: item.type === 'income' ? '#4CAF50' : theme.colors.error }}
        >
          {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString()}
        </Text>
        <Chip
          compact
          style={[styles.statusChip, { backgroundColor: statusColors[item.status] + '20' }]}
          textStyle={{ color: statusColors[item.status], fontSize: 10 }}
        >
          {item.status}
        </Chip>
      </View>
    </TouchableOpacity>
  );

  return (
    <WidgetContainer
      title="Recent Transactions"
      isLoading={isLoading}
      action={
        config?.showViewAll && (
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.primary }}
            onPress={() => onNavigate?.('finance-transactions')}
          >
            View All
          </Text>
        )
      }
    >
      <FlatList
        data={transactions || []}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="cash-remove" size={48} color={theme.colors.outline} />
            <Text variant="bodyMedium" style={styles.emptyText}>No transactions</Text>
          </View>
        }
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  typeIndicator: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  transactionInfo: { flex: 1 },
  category: { opacity: 0.6, marginTop: 2 },
  transactionMeta: { alignItems: 'flex-end' },
  statusChip: { marginTop: 4, height: 20 },
  divider: { marginVertical: 4 },
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 8, opacity: 0.6 },
});
```

### 6.4 useFinanceSummaryQuery Hook

```typescript
// src/hooks/queries/admin/useFinanceSummaryQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { subDays, subMonths, subQuarters, startOfDay } from 'date-fns';

type FinanceQueryOptions = {
  period: 'week' | 'month' | 'quarter' | 'year';
};

export const useFinanceSummaryQuery = (options: FinanceQueryOptions) => {
  return useQuery({
    queryKey: ['admin', 'finance', 'summary', options.period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let previousStartDate: Date;

      switch (options.period) {
        case 'week':
          startDate = subDays(now, 7);
          previousStartDate = subDays(now, 14);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          previousStartDate = subMonths(now, 2);
          break;
        case 'quarter':
          startDate = subQuarters(now, 1);
          previousStartDate = subQuarters(now, 2);
          break;
        default:
          startDate = subMonths(now, 1);
          previousStartDate = subMonths(now, 2);
      }

      // Current period revenue
      const { data: currentData } = await supabase
        .from('financial_transactions')
        .select('amount, category')
        .eq('type', 'income')
        .gte('created_at', startDate.toISOString());

      // Previous period revenue (for growth calculation)
      const { data: previousData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const totalRevenue = currentData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const previousRevenue = previousData?.reduce((sum, t) => sum + t.amount, 0) || 0;

      const growth = previousRevenue > 0
        ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
        : 0;

      // Breakdown by category
      const breakdown = {
        fees: currentData?.filter(t => t.category === 'fees').reduce((sum, t) => sum + t.amount, 0) || 0,
        subscriptions: currentData?.filter(t => t.category === 'subscription').reduce((sum, t) => sum + t.amount, 0) || 0,
        other: currentData?.filter(t => !['fees', 'subscription'].includes(t.category)).reduce((sum, t) => sum + t.amount, 0) || 0,
      };

      return { totalRevenue, growth, breakdown };
    },
  });
};
```

### 6.5 Sprint 5 Checkpoint

✅ **Test Criteria:**
- [ ] Finance dashboard loads with all widgets
- [ ] Revenue summary shows correct totals
- [ ] Period selector changes data
- [ ] Growth percentage calculates correctly
- [ ] Expense summary works
- [ ] Net profit calculates (revenue - expenses)
- [ ] Transactions list shows with status
- [ ] Pending payments list works

---

## 7. SPRINT 6: FINANCE CHARTS + REPORTS

### 7.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `finance-reports` | 🔲 |
| Widget | `finance.monthly-chart` | 🔲 |
| Widget | `finance.category-breakdown` | 🔲 |
| Widget | `finance.collection-rate` | 🔲 |
| Hook | `useFinanceReportsQuery` | 🔲 |
| Hook | `useExportReport` | 🔲 |

### 7.2 MonthlyChartWidget.tsx

```typescript
// src/components/widgets/admin/MonthlyChartWidget.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/theme/useAppTheme';
import { useFinanceReportsQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

export const MonthlyChartWidget: React.FC<AdminWidgetProps> = ({ config }) => {
  const theme = useAppTheme();
  const { data, isLoading } = useFinanceReportsQuery({ type: 'monthly', months: 6 });

  const screenWidth = Dimensions.get('window').width - 48;

  const chartData = {
    labels: data?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: data?.revenue || [0, 0, 0, 0, 0, 0],
        color: () => '#4CAF50',
        strokeWidth: 2,
      },
      {
        data: data?.expenses || [0, 0, 0, 0, 0, 0],
        color: () => theme.colors.error,
        strokeWidth: 2,
      },
    ],
    legend: ['Revenue', 'Expenses'],
  };

  return (
    <WidgetContainer title="Monthly Trend" isLoading={isLoading}>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: () => theme.colors.onSurface,
          propsForDots: { r: '4' },
        }}
        bezier
        style={styles.chart}
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  chart: { borderRadius: 12, marginTop: 8 },
});
```

### 7.3 CategoryBreakdownWidget.tsx (Pie Chart)

```typescript
// src/components/widgets/admin/CategoryBreakdownWidget.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/theme/useAppTheme';
import { useFinanceReportsQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

export const CategoryBreakdownWidget: React.FC<AdminWidgetProps> = ({ config }) => {
  const theme = useAppTheme();
  const { data, isLoading } = useFinanceReportsQuery({ type: 'category' });

  const screenWidth = Dimensions.get('window').width - 48;

  const chartData = [
    { name: 'Tuition Fees', population: data?.categories?.tuition || 0, color: theme.colors.primary, legendFontColor: theme.colors.onSurface },
    { name: 'Exam Fees', population: data?.categories?.exam || 0, color: '#9C27B0', legendFontColor: theme.colors.onSurface },
    { name: 'Materials', population: data?.categories?.materials || 0, color: '#FF9800', legendFontColor: theme.colors.onSurface },
    { name: 'Other', population: data?.categories?.other || 0, color: '#4CAF50', legendFontColor: theme.colors.onSurface },
  ].filter(item => item.population > 0);

  return (
    <WidgetContainer title="Revenue by Category" isLoading={isLoading}>
      {chartData.length > 0 ? (
        <PieChart
          data={chartData}
          width={screenWidth}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      ) : (
        <View style={styles.emptyChart}>
          <Text variant="bodyMedium" style={{ opacity: 0.6 }}>No data available</Text>
        </View>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center' },
});
```

### 7.4 CollectionRateWidget.tsx

```typescript
// src/components/widgets/admin/CollectionRateWidget.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useFinanceReportsQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

export const CollectionRateWidget: React.FC<AdminWidgetProps> = ({ config }) => {
  const theme = useAppTheme();
  const { data, isLoading } = useFinanceReportsQuery({ type: 'collection' });

  const collectionRate = data?.collectionRate || 0;
  const getColor = (rate: number) => {
    if (rate >= 90) return '#4CAF50';
    if (rate >= 70) return '#FF9800';
    return theme.colors.error;
  };

  return (
    <WidgetContainer title="Collection Rate" isLoading={isLoading}>
      <Surface style={styles.rateCard} elevation={0}>
        <Text variant="displaySmall" style={[styles.rateValue, { color: getColor(collectionRate) }]}>
          {collectionRate}%
        </Text>
        <ProgressBar
          progress={collectionRate / 100}
          color={getColor(collectionRate)}
          style={styles.progressBar}
        />
      </Surface>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Icon name="check-circle" size={20} color="#4CAF50" />
          <Text variant="titleMedium">₹{(data?.collected || 0).toLocaleString()}</Text>
          <Text variant="bodySmall" style={styles.statLabel}>Collected</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="clock-outline" size={20} color="#FF9800" />
          <Text variant="titleMedium">₹{(data?.pending || 0).toLocaleString()}</Text>
          <Text variant="bodySmall" style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="alert-circle" size={20} color={theme.colors.error} />
          <Text variant="titleMedium">₹{(data?.overdue || 0).toLocaleString()}</Text>
          <Text variant="bodySmall" style={styles.statLabel}>Overdue</Text>
        </View>
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  rateCard: { alignItems: 'center', padding: 16, marginBottom: 16 },
  rateValue: { fontWeight: 'bold', marginBottom: 12 },
  progressBar: { width: '100%', height: 8, borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statLabel: { opacity: 0.6 },
});
```

### 7.5 useExportReport Mutation

```typescript
// src/hooks/mutations/admin/useExportReport.ts
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

type ExportParams = {
  type: 'revenue' | 'expenses' | 'transactions' | 'summary';
  period: { start: string; end: string };
  format: 'csv' | 'pdf' | 'excel';
};

export const useExportReport = () => {
  return useMutation({
    mutationFn: async (params: ExportParams) => {
      // Fetch data based on type
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('created_at', params.period.start)
        .lte('created_at', params.period.end)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generate CSV
      if (params.format === 'csv') {
        const headers = 'Date,Type,Category,Amount,Description,Status\n';
        const rows = data.map(t =>
          `${t.created_at},${t.type},${t.category},${t.amount},"${t.description}",${t.status}`
        ).join('\n');

        const csv = headers + rows;
        const fileName = `financial_report_${Date.now()}.csv`;
        const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

        await RNFS.writeFile(filePath, csv, 'utf8');

        await Share.open({
          url: `file://${filePath}`,
          type: 'text/csv',
          filename: fileName,
        });

        return { success: true, filePath };
      }

      throw new Error('Format not supported yet');
    },
  });
};
```

### 7.6 Sprint 6 Checkpoint

✅ **Test Criteria:**
- [ ] Finance reports screen loads
- [ ] Monthly chart shows revenue vs expenses
- [ ] Category breakdown pie chart renders
- [ ] Collection rate shows with progress bar
- [ ] Export to CSV works
- [ ] Share sheet opens with file

---

## 8. SPRINT 7: ANALYTICS DASHBOARD

### 8.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `analytics-dashboard` | 🔲 |
| Widget | `analytics.kpi-grid` | 🔲 |
| Widget | `analytics.trends` | 🔲 |
| Widget | `analytics.engagement` | 🔲 |
| Widget | `analytics.growth` | 🔲 |
| Widget | `analytics.comparisons` | 🔲 |
| Hook | `useAnalyticsDashboardQuery` | 🔲 |
| Hook | `useKPIQuery` | 🔲 |
| DB Table | `kpi_metrics` | 🔲 |

### 8.2 KPIGridWidget.tsx

```typescript
// src/components/widgets/admin/KPIGridWidget.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useKPIQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

type KPI = {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  icon: string;
};

export const KPIGridWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data: kpis, isLoading } = useKPIQuery();

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return '#4CAF50';
    if (percentage >= 70) return '#FF9800';
    return theme.colors.error;
  };

  const renderKPI = (kpi: KPI) => {
    const progress = Math.min(kpi.value / kpi.target, 1);
    const progressColor = getProgressColor(kpi.value, kpi.target);

    return (
      <TouchableOpacity
        key={kpi.id}
        style={styles.kpiCard}
        onPress={() => onNavigate?.('kpi-detail', { kpiId: kpi.id })}
      >
        <Surface style={styles.kpiSurface} elevation={1}>
          <View style={styles.kpiHeader}>
            <Icon name={kpi.icon} size={20} color={theme.colors.primary} />
            <View style={styles.trendBadge}>
              <Icon
                name={kpi.trend >= 0 ? 'trending-up' : 'trending-down'}
                size={12}
                color={kpi.trend >= 0 ? '#4CAF50' : theme.colors.error}
              />
              <Text variant="labelSmall" style={{ color: kpi.trend >= 0 ? '#4CAF50' : theme.colors.error }}>
                {Math.abs(kpi.trend)}%
              </Text>
            </View>
          </View>

          <Text variant="headlineSmall" style={styles.kpiValue}>
            {kpi.value.toLocaleString()}{kpi.unit}
          </Text>
          <Text variant="bodySmall" style={styles.kpiName} numberOfLines={1}>
            {kpi.name}
          </Text>

          {config?.showProgress && (
            <>
              <ProgressBar
                progress={progress}
                color={progressColor}
                style={styles.progressBar}
              />
              <Text variant="labelSmall" style={styles.targetText}>
                Target: {kpi.target.toLocaleString()}{kpi.unit}
              </Text>
            </>
          )}
        </Surface>
      </TouchableOpacity>
    );
  };

  const columns = config?.columns || 2;

  return (
    <WidgetContainer title="Key Performance Indicators" isLoading={isLoading}>
      <View style={[styles.grid, { gap: 12 }]}>
        {(kpis || []).slice(0, config?.maxKPIs || 6).map(renderKPI)}
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  kpiCard: { width: '48%', marginBottom: 4 },
  kpiSurface: { padding: 12, borderRadius: 12 },
  kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  kpiValue: { fontWeight: 'bold' },
  kpiName: { opacity: 0.7, marginTop: 2, marginBottom: 8 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 4 },
  targetText: { opacity: 0.5 },
});
```

### 8.3 TrendsWidget.tsx

```typescript
// src/components/widgets/admin/TrendsWidget.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/theme/useAppTheme';
import { useAnalyticsDashboardQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

export const TrendsWidget: React.FC<AdminWidgetProps> = ({ config }) => {
  const theme = useAppTheme();
  const [metric, setMetric] = useState<string>('users');
  const { data, isLoading } = useAnalyticsDashboardQuery({ metric });

  const screenWidth = Dimensions.get('window').width - 48;

  const chartData = {
    labels: data?.labels || ['W1', 'W2', 'W3', 'W4'],
    datasets: [{ data: data?.values || [0, 0, 0, 0] }],
  };

  return (
    <WidgetContainer title="Trends" isLoading={isLoading}>
      <SegmentedButtons
        value={metric}
        onValueChange={setMetric}
        buttons={[
          { value: 'users', label: 'Users' },
          { value: 'revenue', label: 'Revenue' },
          { value: 'engagement', label: 'Engagement' },
        ]}
        style={styles.segmentedButtons}
        density="small"
      />

      <LineChart
        data={chartData}
        width={screenWidth}
        height={180}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 0,
          color: () => theme.colors.primary,
          labelColor: () => theme.colors.onSurface,
          propsForDots: { r: '4', strokeWidth: '2', stroke: theme.colors.primary },
        }}
        bezier
        style={styles.chart}
      />
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  segmentedButtons: { marginBottom: 16 },
  chart: { borderRadius: 12 },
});
```

### 8.4 useKPIQuery Hook

```typescript
// src/hooks/queries/admin/useKPIQuery.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useKPIQuery = () => {
  return useQuery({
    queryKey: ['admin', 'kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_metrics')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      // Calculate trends (compare with previous period)
      return data.map(kpi => ({
        ...kpi,
        trend: Math.round((Math.random() - 0.3) * 20), // Placeholder - calculate from historical
      }));
    },
  });
};
```

### 8.5 Sprint 7 Checkpoint

✅ **Test Criteria:**
- [ ] Analytics dashboard loads
- [ ] KPI grid shows with progress bars
- [ ] Trends chart renders with metric selector
- [ ] Engagement metrics display
- [ ] Growth metrics display
- [ ] Period comparisons work

---

## 9. SPRINT 8: CONTENT + ORG MANAGEMENT

### 9.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `content-management` | 🔲 |
| Dynamic Screen | `org-management` | 🔲 |
| Widget | `content.stats` | 🔲 |
| Widget | `content.list` | 🔲 |
| Widget | `content.categories` | 🔲 |
| Widget | `org.tree` | 🔲 |
| Widget | `org.class-list` | 🔲 |
| Widget | `org.quick-create` | 🔲 |
| Hook | `useContentQuery` | 🔲 |
| Hook | `useOrgQuery` | 🔲 |
| DB Table | `content_library` | 🔲 |
| DB Table | `organizations` | 🔲 |

### 9.2 OrgTreeWidget.tsx

```typescript
// src/components/widgets/admin/OrgTreeWidget.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useOrgQuery } from '@/hooks/queries/admin';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { AdminWidgetProps } from '@/types/widget.types';

type OrgNode = {
  id: string;
  name: string;
  type: 'organization' | 'department' | 'class' | 'batch';
  children?: OrgNode[];
  count?: number;
};

export const OrgTreeWidget: React.FC<AdminWidgetProps> = ({ config, onNavigate }) => {
  const theme = useAppTheme();
  const { data: orgTree, isLoading } = useOrgQuery({ type: 'tree' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const typeIcons: Record<string, string> = {
    organization: 'domain',
    department: 'office-building',
    class: 'google-classroom',
    batch: 'account-group',
  };

  const renderNode = (node: OrgNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);

    return (
      <View key={node.id}>
        <TouchableOpacity
          style={[styles.nodeRow, { paddingLeft: 16 + level * 20 }]}
          onPress={() => onNavigate?.(`${node.type}-detail`, { id: node.id })}
        >
          {hasChildren && (
            <IconButton
              icon={isExpanded ? 'chevron-down' : 'chevron-right'}
              size={20}
              onPress={() => toggleExpand(node.id)}
              style={styles.expandButton}
            />
          )}
          {!hasChildren && <View style={styles.expandPlaceholder} />}

          <Icon name={typeIcons[node.type]} size={20} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.nodeName} numberOfLines={1}>
            {node.name}
          </Text>
          {node.count !== undefined && (
            <Text variant="labelSmall" style={styles.nodeCount}>
              ({node.count})
            </Text>
          )}
        </TouchableOpacity>

        {isExpanded && hasChildren && (
          <View>
            {node.children!.map(child => renderNode(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <WidgetContainer title="Organization Structure" isLoading={isLoading}>
      {orgTree?.map(node => renderNode(node))}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  nodeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  expandButton: { margin: 0 },
  expandPlaceholder: { width: 40 },
  nodeName: { flex: 1 },
  nodeCount: { opacity: 0.6 },
});
```

### 9.3 Sprint 8 Checkpoint

✅ **Test Criteria:**
- [ ] Content management screen loads
- [ ] Content stats show totals
- [ ] Content list with filters works
- [ ] Categories display
- [ ] Org management screen loads
- [ ] Org tree renders with expand/collapse
- [ ] Class list shows
- [ ] Quick create actions work

---

## 10. SPRINT 9: SETTINGS + AUDIT

### 10.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Dynamic Screen | `system-settings` | 🔲 |
| Dynamic Screen | `audit-logs` | 🔲 |
| Dynamic Screen | `profile-admin` | 🔲 |
| Widget | `profile.card` | 🔲 |
| Widget | `profile.activity` | 🔲 |
| Widget | `profile.preferences` | 🔲 |
| Hook | `useUpdateSettings` | 🔲 |
| Hook | `useAuditLogsQuery` | 🔲 |
| DB Table | `system_settings` | 🔲 |

### 10.2 AuditLogsScreen.tsx

```typescript
// src/screens/admin/AuditLogsScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Chip, Surface, Menu, IconButton, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useAuditLogsQuery } from '@/hooks/queries/admin';
import { BrandedHeader } from '@/components/branding/BrandedHeader';
import { format } from 'date-fns';

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  performed_by: string;
  performer_name?: string;
  ip_address?: string;
  created_at: string;
};

export const AuditLogsScreen: React.FC = () => {
  const theme = useAppTheme();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: logs, isLoading, fetchNextPage, hasNextPage } = useAuditLogsQuery({
    search,
    action: actionFilter,
  });

  const actionColors: Record<string, string> = {
    user_created: '#4CAF50',
    user_updated: '#FF9800',
    user_suspended: theme.colors.error,
    user_deleted: theme.colors.error,
    setting_changed: '#9C27B0',
    login: theme.colors.primary,
    impersonation_started: '#FF9800',
  };

  const renderLog = ({ item }: { item: AuditLog }) => (
    <Surface style={styles.logItem} elevation={1}>
      <View style={styles.logHeader}>
        <Chip
          compact
          style={[styles.actionChip, { backgroundColor: (actionColors[item.action] || theme.colors.outline) + '20' }]}
          textStyle={{ color: actionColors[item.action] || theme.colors.outline }}
        >
          {item.action.replace(/_/g, ' ')}
        </Chip>
        <Text variant="labelSmall" style={styles.timestamp}>
          {format(new Date(item.created_at), 'MMM d, HH:mm')}
        </Text>
      </View>

      <Text variant="bodyMedium" style={styles.logDescription}>
        {item.entity_type}: {item.entity_id}
      </Text>

      <View style={styles.logFooter}>
        <Icon name="account" size={14} color={theme.colors.outline} />
        <Text variant="labelSmall" style={styles.performer}>
          {item.performer_name || item.performed_by}
        </Text>
        {item.ip_address && (
          <>
            <Icon name="ip" size={14} color={theme.colors.outline} style={styles.ipIcon} />
            <Text variant="labelSmall" style={styles.performer}>
              {item.ip_address}
            </Text>
          </>
        )}
      </View>
    </Surface>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <BrandedHeader title="Audit Logs" showBack />

      <View style={styles.filters}>
        <Searchbar
          placeholder="Search logs..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton icon="filter-variant" onPress={() => setMenuVisible(true)} />
          }
        >
          <Menu.Item title="All Actions" onPress={() => { setActionFilter(null); setMenuVisible(false); }} />
          <Divider />
          <Menu.Item title="User Created" onPress={() => { setActionFilter('user_created'); setMenuVisible(false); }} />
          <Menu.Item title="User Updated" onPress={() => { setActionFilter('user_updated'); setMenuVisible(false); }} />
          <Menu.Item title="User Suspended" onPress={() => { setActionFilter('user_suspended'); setMenuVisible(false); }} />
          <Menu.Item title="Settings Changed" onPress={() => { setActionFilter('setting_changed'); setMenuVisible(false); }} />
          <Menu.Item title="Logins" onPress={() => { setActionFilter('login'); setMenuVisible(false); }} />
        </Menu>
      </View>

      <FlatList
        data={logs?.pages?.flatMap(p => p.data) || []}
        renderItem={renderLog}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { flexDirection: 'row', padding: 16, gap: 8 },
  searchBar: { flex: 1 },
  listContent: { padding: 16 },
  logItem: { padding: 12, borderRadius: 8 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  actionChip: { height: 24 },
  timestamp: { opacity: 0.6 },
  logDescription: { marginBottom: 8 },
  logFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  performer: { opacity: 0.6 },
  ipIcon: { marginLeft: 12 },
  separator: { height: 8 },
});
```

### 10.3 Sprint 9 Checkpoint

✅ **Test Criteria:**
- [ ] System settings screen loads
- [ ] Settings can be updated
- [ ] Audit logs screen loads
- [ ] Audit log filters work
- [ ] Search works
- [ ] Infinite scroll loads more
- [ ] Admin profile screen loads
- [ ] Profile can be edited
- [ ] Preferences save correctly

---

## 11. DATABASE SCHEMA

```sql
-- Sprint 1: Auth
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  ip_address INET,
  user_agent TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Sprint 2: Dashboard
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT CHECK (severity IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT,
  source TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT CHECK (status IN ('healthy', 'warning', 'critical')),
  uptime DECIMAL(5,2),
  cpu_usage INTEGER,
  memory_usage INTEGER,
  active_users INTEGER,
  api_latency INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 3: Users
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  performed_by UUID REFERENCES profiles(id),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 5: Finance
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('completed', 'pending', 'failed')),
  reference TEXT,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 7: Analytics
CREATE TABLE kpi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  target DECIMAL(12,2),
  unit TEXT DEFAULT '',
  icon TEXT DEFAULT 'chart-line',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 8: Content & Org
CREATE TABLE content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('course', 'lesson', 'resource', 'assessment')),
  category TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('organization', 'department', 'class', 'batch')),
  parent_id UUID REFERENCES organizations(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint 9: Settings
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, key)
);
```

---

## 12. PLATFORM STUDIO CONFIG

Add to `platform-studio/src/config/widgetRegistry.ts`:

```typescript
export const ADMIN_WIDGETS = {
  // Dashboard
  'admin.hero-card': { component: 'AdminHeroWidget', category: 'profile' },
  'admin.stats-grid': { component: 'AdminStatsWidget', category: 'stats' },
  'admin.system-health': { component: 'SystemHealthWidget', category: 'system' },
  'admin.alerts': { component: 'AlertsWidget', category: 'alerts' },
  'admin.quick-actions': { component: 'QuickActionsWidget', category: 'actions' },
  'admin.recent-activity': { component: 'RecentActivityWidget', category: 'activity' },

  // Users
  'users.overview-stats': { component: 'UserStatsWidget', category: 'stats' },
  'users.list': { component: 'UserListWidget', category: 'list' },
  'users.pending-approvals': { component: 'PendingApprovalsWidget', category: 'list' },
  'users.role-distribution': { component: 'RoleDistributionWidget', category: 'chart' },
  'users.bulk-actions': { component: 'BulkActionsWidget', category: 'actions' },
  'users.recent-registrations': { component: 'RecentRegistrationsWidget', category: 'list' },

  // Finance
  'finance.revenue-summary': { component: 'RevenueSummaryWidget', category: 'stats' },
  'finance.expense-summary': { component: 'ExpenseSummaryWidget', category: 'stats' },
  'finance.net-profit': { component: 'NetProfitWidget', category: 'stats' },
  'finance.transactions': { component: 'TransactionsWidget', category: 'list' },
  'finance.pending-payments': { component: 'PendingPaymentsWidget', category: 'list' },
  'finance.monthly-chart': { component: 'MonthlyChartWidget', category: 'chart' },
  'finance.category-breakdown': { component: 'CategoryBreakdownWidget', category: 'chart' },
  'finance.collection-rate': { component: 'CollectionRateWidget', category: 'stats' },

  // Analytics
  'analytics.kpi-grid': { component: 'KPIGridWidget', category: 'stats' },
  'analytics.trends': { component: 'TrendsWidget', category: 'chart' },
  'analytics.engagement': { component: 'EngagementWidget', category: 'stats' },
  'analytics.growth': { component: 'GrowthWidget', category: 'stats' },
  'analytics.comparisons': { component: 'ComparisonsWidget', category: 'chart' },

  // Content
  'content.stats': { component: 'ContentStatsWidget', category: 'stats' },
  'content.list': { component: 'ContentListWidget', category: 'list' },
  'content.categories': { component: 'CategoriesWidget', category: 'list' },

  // Organization
  'org.tree': { component: 'OrgTreeWidget', category: 'tree' },
  'org.class-list': { component: 'ClassListWidget', category: 'list' },
  'org.quick-create': { component: 'QuickCreateWidget', category: 'actions' },

  // Profile
  'profile.card': { component: 'ProfileCardWidget', category: 'profile' },
  'profile.activity': { component: 'ProfileActivityWidget', category: 'list' },
  'profile.preferences': { component: 'ProfilePreferencesWidget', category: 'form' },
};
```

---

## 13. TESTING CHECKLIST

### End-to-End Demo Flow

- [ ] **Auth Flow**: Login → 2FA → Dashboard
- [ ] **User Flow**: Dashboard → Users → Create → Detail → Suspend → Impersonate
- [ ] **Finance Flow**: Dashboard → Finance → Reports → Export
- [ ] **Analytics Flow**: Dashboard → Analytics → KPIs → Trends
- [ ] **Content Flow**: Dashboard → Content → List → Detail
- [ ] **Org Flow**: Dashboard → Org → Tree → Class Detail
- [ ] **Settings Flow**: Dashboard → Settings → Update → Audit Logs
- [ ] **Profile Flow**: Dashboard → Profile → Edit → Preferences

### Performance Targets

- [ ] Dashboard loads < 2s
- [ ] User list loads < 1s
- [ ] Charts render < 500ms
- [ ] Navigation transitions < 300ms

---

**Document Complete. Ready for Sprint 1 implementation.**




