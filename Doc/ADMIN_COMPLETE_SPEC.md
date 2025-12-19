# 🔧 ADMIN APP - COMPLETE SPECIFICATION

> **Version:** 1.0.0
> **Date:** December 2024
> **Scope:** Admin Role Only
> **Purpose:** Single source of truth for implementing the admin mobile/web app
> **Reference:** Based on STUDENT_COMPLETE_SPEC.md, TEACHER_COMPLETE_SPEC.md, PARENT_COMPLETE_SPEC.md structure
> **Status:** Initial Draft

---

## 📋 TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Naming Conventions](#2-naming-conventions)
3. [Platform Studio Integration](#3-platform-studio-integration)
4. [White-Label & Branding](#4-white-label--branding)
5. [Role & Permissions](#5-role--permissions)
6. [Navigation Structure](#6-navigation-structure)
7. [Screens Specification](#7-screens-specification)
8. [Widgets Specification](#8-widgets-specification)
9. [Widget Properties Schema](#9-widget-properties-schema)
10. [API Endpoints](#10-api-endpoints)
11. [Database Schema](#11-database-schema)
12. [Services & Hooks](#12-services--hooks)
13. [Implementation Checklist](#13-implementation-checklist)
14. [Cross-Cutting Concerns](#14-cross-cutting-concerns)

---

## 1. OVERVIEW

### 1.1 Scope

This specification covers the **Admin** role:
- **25 Dynamic Screens** (widget-based, configurable via Platform Studio)
- **12 Fixed Screens** (essential functionality, not configurable)
- **55 Widgets** (0 built, 55 to build)
- Complete navigation structure
- Full Platform Studio compatibility
- White-label/branding support
- All API endpoints and database tables
- **AI-Powered Analytics** (Phase 85-88 enhancements)
- **Real-Time Monitoring** (system health, performance)
- **Enterprise Intelligence** (business insights, forecasting)
- **Compliance & Audit** (security, regulatory compliance)

### 1.2 Current Implementation Status

| Component | Total | Built | Remaining |
|-----------|-------|-------|-----------|
| Screens | 37 | 0 | 37 |
| Widgets | 55 | 0 | 55 |
| Query Hooks | 25 | 0 | 25 |
| Mutation Hooks | 18 | 0 | 18 |
| DB Tables | 20 | 5 | 15 |
| Permissions | 45 | 8 | 37 |

**Reference Components (from Bckup_old):**
- `AdminDashboardScreen.tsx` - Main dashboard with system health, alerts, activities
- `UserManagementScreenV3.tsx` - User CRUD with filtering, sorting, bulk actions
- `FinancialReportsScreenV2.tsx` - Revenue, expenses, transactions, reports
- `SystemSettingsScreenV2.tsx` - General, security, notifications, features, integrations
- `ContentManagementScreenV2.tsx` - Content library management
- `OrganizationManagementScreenV3.tsx` - Organization structure management
- `AdvancedAnalyticsScreenV2.tsx` - Advanced analytics and insights
- `RealTimeMonitoringDashboardV2.tsx` - Real-time system monitoring
- `SecurityComplianceScreen.tsx` - Security and compliance management
- `AIAgentEcosystem.tsx` - AI agent management and configuration

### 1.3 Admin Role Purpose

Admins need to:
- **Manage Users** - Create, edit, suspend, delete users across all roles
- **Monitor System** - Real-time health, performance, uptime monitoring
- **Financial Oversight** - Revenue tracking, expense management, reports
- **Content Management** - Manage courses, resources, curriculum
- **Organization Structure** - Manage classes, batches, departments
- **Security & Compliance** - Audit logs, access control, compliance
- **Analytics & Insights** - Business intelligence, forecasting, KPIs
- **System Configuration** - Settings, integrations, feature toggles
- **Support Operations** - Help desk, ticket management, escalations
- **AI Management** - Configure AI features, monitor usage, budgets

### 1.4 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN APP ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Platform Studio ──publish──> Supabase DB ──realtime──> Mobile  │
│       │                           │                       │     │
│       ▼                           ▼                       ▼     │
│  Config Editor              screen_layouts          DynamicScreen│
│  Theme Editor               navigation_tabs         Widgets     │
│  Branding Editor            customer_themes         Theme       │
│  Screen Builder             customer_branding       Branding    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   ADMIN-SPECIFIC DATA                       ││
│  │  users | audit_logs | financial_records | system_settings   ││
│  │  organizations | content_library | support_tickets          ││
│  │  ai_usage_logs | compliance_records | kpi_metrics           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5 Key Principles

| Principle | Description |
|-----------|-------------|
| **Full Control** | Complete access to all system features and data |
| **Real-Time Monitoring** | Live dashboards for system health and performance |
| **Audit Trail** | Every action logged for compliance and security |
| **Multi-Tenant** | Support for multiple organizations/customers |
| **AI-Enhanced** | Smart analytics, predictions, anomaly detection |
| **Config-Driven** | All UI comes from Supabase config |
| **White-Label Ready** | Every screen supports customer branding |
| **Theme-Aware** | All components use `useAppTheme()` |
| **Role-Based Access** | Granular permissions for admin sub-roles |

---

## 2. NAMING CONVENTIONS

### 2.1 Widget IDs

Admin widgets use the `admin.*` naming pattern:

| Pattern | Usage | Example |
|---------|-------|---------|
| `admin.*` | Admin-specific widgets | `admin.stats-grid`, `admin.system-health` |
| `users.*` | User management widgets | `users.list`, `users.stats` |
| `finance.*` | Financial widgets | `finance.revenue`, `finance.transactions` |
| `analytics.*` | Analytics widgets | `analytics.kpi`, `analytics.trends` |
| `system.*` | System management widgets | `system.health`, `system.alerts` |

**Registry Widget IDs (Platform Studio):**
```typescript
// Dashboard widgets
"admin.hero-card"           // Admin greeting & quick stats
"admin.stats-grid"          // Key metrics overview
"admin.system-health"       // System health banner
"admin.alerts"              // Critical alerts
"admin.recent-activity"     // Recent system activities
"admin.quick-actions"       // Admin action buttons

// User management widgets
"users.overview-stats"      // User statistics
"users.list"                // User list with filters
"users.pending-approvals"   // Pending user approvals
"users.role-distribution"   // Users by role chart

// Financial widgets
"finance.revenue-summary"   // Revenue overview
"finance.expense-summary"   // Expense overview
"finance.transactions"      // Recent transactions
"finance.pending-payments"  // Pending payments
"finance.collection-rate"   // Collection rate chart

// Analytics widgets
"analytics.kpi-grid"        // KPI metrics
"analytics.trends"          // Trend charts
"analytics.predictions"     // AI predictions
"analytics.comparisons"     // Period comparisons
```

**Component File Names (React Native):**
```
AdminHeroWidget.tsx         → exports as AdminHeroWidget
AdminStatsWidget.tsx        → exports as AdminStatsWidget
SystemHealthWidget.tsx      → exports as SystemHealthWidget
UserListWidget.tsx          → exports as UserListWidget
RevenueWidget.tsx           → exports as RevenueWidget
```

### 2.2 Screen IDs

| Pattern | Example | Description |
|---------|---------|-------------|
| `admin-home` | Admin dashboard | Role-specific home |
| `users-*` | `users-management`, `users-detail` | User management screens |
| `finance-*` | `finance-reports`, `finance-settings` | Financial screens |
| `system-*` | `system-settings`, `system-monitoring` | System screens |
| `analytics-*` | `analytics-dashboard`, `analytics-kpi` | Analytics screens |
| `content-*` | `content-management`, `content-detail` | Content screens |
| `org-*` | `org-management`, `org-structure` | Organization screens |

### 2.3 Hook Names

| Type | Pattern | Example |
|------|---------|---------|
| Query | `use<Entity>Query` | `useAdminDashboardQuery`, `useUsersQuery` |
| Mutation | `use<Action>` | `useCreateUser`, `useUpdateSettings` |

### 2.4 File Structure

```
src/
├── screens/admin/
│   ├── index.ts                    # Barrel export
│   ├── AdminDashboardScreen.tsx    # PascalCase
│   ├── UserManagementScreen.tsx
│   ├── FinancialReportsScreen.tsx
│   └── SystemSettingsScreen.tsx
├── components/widgets/admin/
│   ├── index.ts
│   ├── AdminHeroWidget.tsx         # PascalCase + Widget suffix
│   ├── SystemHealthWidget.tsx
│   └── UserListWidget.tsx
├── hooks/queries/admin/
│   ├── index.ts
│   ├── useAdminDashboardQuery.ts   # camelCase + Query suffix
│   └── useUsersQuery.ts
└── hooks/mutations/admin/
    ├── index.ts
    ├── useCreateUser.ts            # camelCase (action name)
    └── useUpdateSettings.ts
```

---

## 3. PLATFORM STUDIO INTEGRATION

### 3.1 Admin Screen Registry

**TO ADD (All screens are new):**
```typescript
// platform-studio/src/config/screenRegistry.ts
export const ADMIN_SCREENS = {
  // FULL CUSTOMIZATION (12 screens)
  'admin-home': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'users-management': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'finance-dashboard': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'analytics-dashboard': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'content-management': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'org-management': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'system-monitoring': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'support-center': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'ai-management': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'compliance-audit': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'operations-hub': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },
  'strategic-planning': { type: 'dynamic', customization: 'full', allowed_roles: ['admin', 'super_admin'] },

  // MEDIUM CUSTOMIZATION (13 screens)
  'users-detail': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'users-create': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'finance-reports': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'finance-settings': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'system-settings': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'content-detail': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'org-detail': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'analytics-kpi': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'security-settings': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'notifications-admin': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'profile-admin': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'audit-logs': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
  'integrations': { type: 'dynamic', customization: 'medium', allowed_roles: ['admin', 'super_admin'] },
};
```

### 3.2 What Can Be Customized

| Category | Customizable Via | Examples |
|----------|------------------|----------|
| **Screen Layout** | Screen Builder | Add/remove/reorder widgets |
| **Widget Config** | Widget Properties Panel | Max items, chart types, refresh intervals |
| **Navigation** | Navigation Editor | Tab order, icons, labels |
| **Theme** | Theme Editor | Colors, fonts, border radius |
| **Branding** | Branding Editor | Logo, app name, feature names |

---

## 4. WHITE-LABEL & BRANDING

### 4.1 Admin-Specific Branding Fields

```typescript
type AdminBrandingExtensions = {
  // Feature Naming for Admins
  usersSectionName: string;         // "Users" → "Members"
  financeSectionName: string;       // "Finance" → "Accounts"
  analyticsSectionName: string;     // "Analytics" → "Insights"
  contentSectionName: string;       // "Content" → "Resources"
  supportSectionName: string;       // "Support" → "Help Desk"

  // Admin-specific text
  adminWelcomeMessage?: string;
  adminSupportEmail?: string;
  adminHelplineNumber?: string;
  companyName?: string;
  companyLogo?: string;
};
```

### 4.2 Branding Requirements Per Screen

| Screen | Branding Used | Theme Used |
|--------|---------------|------------|
| **All Screens** | `appName`, `logoUrl` via BrandedHeader | All colors via `useAppTheme()` |
| **Dashboard** | `adminWelcomeMessage`, `companyName` | Primary, surface, text colors |
| **Users** | `usersSectionName` | All colors |
| **Finance** | `financeSectionName` | All colors |
| **Analytics** | `analyticsSectionName` | All colors |
| **Content** | `contentSectionName` | All colors |
| **Support** | `supportSectionName` | All colors |

---

## 5. ROLE & PERMISSIONS

### 5.1 Admin Role Definition

```typescript
type AdminRole = {
  role: "admin";
  hierarchy_level: 4;  // Highest level (below super_admin)
  description: "Administrator with full system access";
};

type SuperAdminRole = {
  role: "super_admin";
  hierarchy_level: 5;  // Absolute highest
  description: "Super administrator with unrestricted access";
};
```

### 5.2 Base Permissions (Admin)

| Permission Code | Description | Category |
|-----------------|-------------|----------|
| `view_dashboard` | View admin dashboard | view |
| `view_system_health` | View system health metrics | view |
| `view_users` | View all users | view |
| `create_user` | Create new users | action |
| `edit_user` | Edit user details | action |
| `delete_user` | Delete/suspend users | action |
| `manage_roles` | Assign/modify user roles | action |
| `view_finances` | View financial data | view |
| `manage_finances` | Manage financial settings | action |
| `export_financial_reports` | Export financial reports | action |
| `view_analytics` | View analytics dashboards | view |
| `export_analytics` | Export analytics data | action |
| `view_content` | View content library | view |
| `manage_content` | Create/edit/delete content | action |
| `view_organizations` | View organization structure | view |
| `manage_organizations` | Manage organizations | action |
| `view_settings` | View system settings | view |
| `manage_settings` | Modify system settings | action |
| `view_audit_logs` | View audit logs | view |
| `manage_security` | Manage security settings | action |
| `view_support_tickets` | View support tickets | view |
| `manage_support_tickets` | Handle support tickets | action |
| `view_ai_config` | View AI configuration | view |
| `manage_ai_config` | Manage AI settings | action |
| `view_integrations` | View integrations | view |
| `manage_integrations` | Manage integrations | action |
| `impersonate_user` | Impersonate other users | action |
| `manage_backups` | Manage system backups | action |
| `manage_maintenance` | Toggle maintenance mode | action |
| `view_compliance` | View compliance reports | view |
| `manage_compliance` | Manage compliance settings | action |
| `bulk_operations` | Perform bulk operations | action |
| `api_access` | Access admin APIs | action |
| `webhook_management` | Manage webhooks | action |
| `feature_flags` | Manage feature flags | action |
| `view_kpis` | View KPI metrics | view |
| `manage_kpis` | Configure KPI targets | action |
| `view_predictions` | View AI predictions | view |
| `manage_notifications` | Manage system notifications | action |
| `view_real_time_monitoring` | View real-time monitoring | view |
| `manage_alerts` | Configure alert rules | action |
| `view_operations` | View operations data | view |
| `manage_operations` | Manage operations | action |
| `strategic_planning` | Access strategic planning | action |
| `super_admin_access` | Full unrestricted access | super |

### 5.3 Feature Dependencies

| Feature ID | Required For | Default |
|------------|--------------|---------|
| `admin.dashboard` | Admin dashboard | enabled |
| `admin.users` | User management | enabled |
| `admin.finances` | Financial management | enabled |
| `admin.analytics` | Analytics dashboards | enabled |
| `admin.content` | Content management | enabled |
| `admin.organizations` | Organization management | enabled |
| `admin.settings` | System settings | enabled |
| `admin.security` | Security management | enabled |
| `admin.audit` | Audit logging | enabled |
| `admin.support` | Support center | enabled |
| `admin.ai_management` | AI configuration | disabled |
| `admin.real_time_monitoring` | Real-time monitoring | disabled |
| `admin.compliance` | Compliance management | disabled |
| `admin.strategic_planning` | Strategic planning | disabled |
| `admin.operations` | Operations management | disabled |
| `admin.integrations` | Third-party integrations | enabled |
| `admin.backups` | Backup management | enabled |
| `admin.maintenance` | Maintenance mode | enabled |

---

## 6. NAVIGATION STRUCTURE

### 6.1 Tab Configuration

Admins have 6 tabs. Configuration in `navigation_tabs`:

| Tab ID | Label | Icon | Root Screen | Order | Badge |
|--------|-------|------|-------------|-------|-------|
| `home` | Home | `home` | `admin-home` | 1 | dot |
| `users` | Users | `account-group` | `users-management` | 2 | count |
| `finance` | Finance | `currency-usd` | `finance-dashboard` | 3 | none |
| `analytics` | Analytics | `chart-line` | `analytics-dashboard` | 4 | none |
| `system` | System | `cog` | `system-settings` | 5 | dot |
| `profile` | Me | `account` | `profile-admin` | 6 | none |

### 6.2 Screen-to-Tab Mapping

```
home tab:
  ├── admin-home (root)
  ├── notifications-admin
  ├── system-monitoring
  ├── alerts-detail
  └── quick-actions

users tab:
  ├── users-management (root)
  ├── users-detail
  ├── users-create
  ├── users-bulk-import
  ├── roles-management
  └── permissions-management

finance tab:
  ├── finance-dashboard (root)
  ├── finance-reports
  ├── finance-transactions
  ├── finance-settings
  ├── payment-settings
  └── fee-structure

analytics tab:
  ├── analytics-dashboard (root)
  ├── analytics-kpi
  ├── analytics-trends
  ├── analytics-predictions
  ├── analytics-comparisons
  └── export-reports

system tab:
  ├── system-settings (root)
  ├── security-settings
  ├── integrations
  ├── content-management
  ├── org-management
  ├── audit-logs
  ├── compliance-audit
  ├── ai-management
  ├── support-center
  ├── operations-hub
  └── strategic-planning

profile tab:
  ├── profile-admin (root)
  ├── edit-profile
  ├── activity-log
  └── help-support
```

---

## 7. SCREENS SPECIFICATION

### 7.1 Dynamic Screens - Full Customization (12 Screens)

| Screen ID | Name | Type | Default Widgets | Customization |
|-----------|------|------|-----------------|---------------|
| `admin-home` | Admin Dashboard | dashboard | hero-card, system-health, stats-grid, alerts, recent-activity, quick-actions | 🟢 Full |
| `users-management` | User Management | hub | user-stats, user-list, pending-approvals, role-distribution, bulk-actions | 🟢 Full |
| `finance-dashboard` | Finance Dashboard | dashboard | revenue-summary, expense-summary, transactions, pending-payments, collection-rate, charts | 🟢 Full |
| `analytics-dashboard` | Analytics Dashboard | dashboard | kpi-grid, trends, predictions, comparisons, engagement-metrics | 🟢 Full |
| `content-management` | Content Management | hub | content-stats, content-list, categories, upload-queue, ai-suggestions | 🟢 Full |
| `org-management` | Organization Management | hub | org-tree, class-list, batch-list, department-list, quick-create | 🟢 Full |
| `system-monitoring` | System Monitoring | dashboard | health-banner, server-stats, api-metrics, error-rates, uptime-chart | 🟢 Full |
| `support-center` | Support Center | hub | ticket-stats, ticket-list, escalations, response-times, satisfaction | 🟢 Full |
| `ai-management` | AI Management | dashboard | ai-usage, model-stats, budget-tracker, feature-toggles, audit-log | 🟢 Full |
| `compliance-audit` | Compliance & Audit | dashboard | compliance-score, audit-summary, violations, remediation, reports | 🟢 Full |
| `operations-hub` | Operations Hub | dashboard | operations-stats, task-queue, automation-rules, schedules, alerts | 🟢 Full |
| `strategic-planning` | Strategic Planning | dashboard | goals-tracker, roadmap, forecasts, initiatives, milestones | 🟢 Full |

### 7.2 Dynamic Screens - Medium Customization (13 Screens)

| Screen ID | Name | Type | Configurable Sections | Customization |
|-----------|------|------|----------------------|---------------|
| `users-detail` | User Detail | detail | profile_card, activity_log, permissions, linked_entities | 🟡 Medium |
| `users-create` | Create User | form | basic_info, role_selection, permissions, notifications | 🟡 Medium |
| `finance-reports` | Financial Reports | list | period_selector, report_types, export_options | 🟡 Medium |
| `finance-settings` | Finance Settings | form | payment_gateways, fee_structure, tax_settings | 🟡 Medium |
| `system-settings` | System Settings | form | general, security, notifications, features, integrations, maintenance | 🟡 Medium |
| `content-detail` | Content Detail | detail | content_info, usage_stats, versions, permissions | 🟡 Medium |
| `org-detail` | Organization Detail | detail | org_info, members, classes, settings | 🟡 Medium |
| `analytics-kpi` | KPI Dashboard | dashboard | kpi_cards, targets, trends, alerts | 🟡 Medium |
| `security-settings` | Security Settings | form | auth_settings, password_policy, ip_whitelist, 2fa | 🟡 Medium |
| `notifications-admin` | Notifications | list | category_filters, notification_list, settings | 🟡 Medium |
| `profile-admin` | Admin Profile | hub | profile_card, activity, preferences, security | 🟡 Medium |
| `audit-logs` | Audit Logs | list | filters, log_list, export, search | 🟡 Medium |
| `integrations` | Integrations | hub | active_integrations, available, settings, logs | 🟡 Medium |

### 7.3 Fixed Screens (12 Screens)

| Screen ID | Name | Purpose | Reason Fixed |
|-----------|------|---------|--------------|
| `login-admin` | Admin Login | Authentication | Security-critical auth flow |
| `2fa-setup` | 2FA Setup | Two-factor auth | Security-critical |
| `password-reset` | Password Reset | Password recovery | Security-critical |
| `user-impersonation` | User Impersonation | View as user | Complex session management |
| `bulk-import` | Bulk Import | CSV/Excel import | Complex file processing |
| `bulk-export` | Bulk Export | Data export | Complex file generation |
| `backup-restore` | Backup & Restore | System backup | Critical system operation |
| `maintenance-mode` | Maintenance Mode | System maintenance | Critical system operation |
| `database-admin` | Database Admin | DB operations | Technical admin only |
| `api-explorer` | API Explorer | API testing | Developer tool |
| `webhook-tester` | Webhook Tester | Webhook testing | Developer tool |
| `legal-admin` | Legal Admin | Legal docs management | Legal requirement |

### 7.4 Detail/Child Screens (Not Directly Configurable)

| Parent Screen | Child Screens |
|---------------|---------------|
| Admin Dashboard | `alert-detail`, `activity-detail`, `kpi-detail` |
| User Management | `user-edit`, `role-detail`, `permission-detail`, `user-activity` |
| Finance Dashboard | `transaction-detail`, `payment-detail`, `invoice-detail`, `report-detail` |
| Analytics Dashboard | `metric-detail`, `trend-detail`, `prediction-detail` |
| Content Management | `content-edit`, `category-detail`, `version-history` |
| Organization Management | `class-detail`, `batch-detail`, `department-detail` |
| System Monitoring | `server-detail`, `error-detail`, `api-detail` |
| Support Center | `ticket-detail`, `escalation-detail`, `feedback-detail` |
| AI Management | `model-detail`, `usage-detail`, `budget-detail` |
| Compliance & Audit | `violation-detail`, `audit-detail`, `remediation-detail` |

---

## 8. WIDGETS SPECIFICATION

### 8.1 Widget Props (All Admin Widgets)

```typescript
type AdminWidgetProps = {
  // Identity
  customerId: string;
  userId: string;
  role: 'admin' | 'super_admin';

  // Admin-specific
  adminId: string;
  permissions: string[];          // Admin's permissions
  accessLevel: 'admin' | 'super_admin';

  // Configuration
  config: WidgetRuntimeConfig;
  branding?: CustomerBranding;
  theme?: ThemeConfig;
  size?: WidgetSize;

  // Navigation
  onNavigate: (route: string, params?: Record<string, unknown>) => void;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
};
```

### 8.2 Dashboard Widgets (Tier 1 - High Priority)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `admin.hero-card` | Admin Hero | profile | Greeting, quick stats, notifications |
| `admin.system-health` | System Health | system | Health banner with uptime, load, status |
| `admin.stats-grid` | Stats Grid | stats | Users, revenue, active sessions, alerts |
| `admin.alerts` | Critical Alerts | alerts | System alerts requiring attention |
| `admin.recent-activity` | Recent Activity | activity | Recent system activities |
| `admin.quick-actions` | Quick Actions | actions | Create user, view reports, settings |

### 8.3 User Management Widgets (Tier 1)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `users.overview-stats` | User Stats | stats | Total users, active, pending, by role |
| `users.list` | User List | list | Filterable, sortable user list |
| `users.pending-approvals` | Pending Approvals | list | Users awaiting approval |
| `users.role-distribution` | Role Distribution | chart | Users by role pie chart |
| `users.recent-registrations` | Recent Registrations | list | Newly registered users |
| `users.bulk-actions` | Bulk Actions | actions | Bulk user operations |

### 8.4 Financial Widgets (Tier 1)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `finance.revenue-summary` | Revenue Summary | stats | Total revenue, growth, breakdown |
| `finance.expense-summary` | Expense Summary | stats | Total expenses, categories |
| `finance.net-profit` | Net Profit | stats | Profit calculation |
| `finance.transactions` | Recent Transactions | list | Recent financial transactions |
| `finance.pending-payments` | Pending Payments | list | Outstanding payments |
| `finance.collection-rate` | Collection Rate | chart | Payment collection metrics |
| `finance.monthly-chart` | Monthly Chart | chart | Revenue vs expenses chart |
| `finance.category-breakdown` | Category Breakdown | chart | Revenue by category |

### 8.5 Analytics Widgets (Tier 2)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `analytics.kpi-grid` | KPI Grid | stats | Key performance indicators |
| `analytics.trends` | Trend Charts | chart | Historical trend analysis |
| `analytics.predictions` | AI Predictions | ai | Predictive analytics |
| `analytics.comparisons` | Period Comparisons | chart | Compare periods |
| `analytics.engagement` | Engagement Metrics | stats | User engagement stats |
| `analytics.growth` | Growth Metrics | stats | Growth indicators |

### 8.6 System Monitoring Widgets (Tier 2)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `system.health-banner` | Health Banner | system | Overall system health |
| `system.server-stats` | Server Stats | stats | CPU, memory, disk usage |
| `system.api-metrics` | API Metrics | stats | API response times, errors |
| `system.error-rates` | Error Rates | chart | Error rate trends |
| `system.uptime-chart` | Uptime Chart | chart | System uptime history |
| `system.active-users` | Active Users | stats | Real-time active users |

### 8.7 Content Management Widgets (Tier 2)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `content.stats` | Content Stats | stats | Total content, by type |
| `content.list` | Content List | list | Filterable content list |
| `content.categories` | Categories | list | Content categories |
| `content.upload-queue` | Upload Queue | list | Pending uploads |
| `content.ai-suggestions` | AI Suggestions | ai | AI content recommendations |

### 8.8 Organization Widgets (Tier 2)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `org.tree` | Organization Tree | tree | Hierarchical org view |
| `org.class-list` | Class List | list | All classes |
| `org.batch-list` | Batch List | list | All batches |
| `org.department-list` | Department List | list | All departments |
| `org.quick-create` | Quick Create | actions | Create class/batch/dept |

### 8.9 Support Center Widgets (Tier 3)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `support.ticket-stats` | Ticket Stats | stats | Open, resolved, pending |
| `support.ticket-list` | Ticket List | list | Support tickets |
| `support.escalations` | Escalations | list | Escalated tickets |
| `support.response-times` | Response Times | stats | Average response metrics |
| `support.satisfaction` | Satisfaction | chart | Customer satisfaction |

### 8.10 AI Management Widgets (Tier 3)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `ai.usage-stats` | AI Usage Stats | stats | API calls, tokens, costs |
| `ai.model-stats` | Model Stats | stats | Model performance |
| `ai.budget-tracker` | Budget Tracker | stats | AI budget usage |
| `ai.feature-toggles` | Feature Toggles | actions | Enable/disable AI features |
| `ai.audit-log` | AI Audit Log | list | AI usage audit trail |

### 8.11 Compliance & Audit Widgets (Tier 3)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `compliance.score` | Compliance Score | stats | Overall compliance score |
| `compliance.audit-summary` | Audit Summary | stats | Audit findings summary |
| `compliance.violations` | Violations | list | Compliance violations |
| `compliance.remediation` | Remediation | list | Remediation tasks |
| `compliance.reports` | Reports | list | Compliance reports |

### 8.12 Operations Widgets (Tier 3)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `ops.stats` | Operations Stats | stats | Operations overview |
| `ops.task-queue` | Task Queue | list | Pending tasks |
| `ops.automation-rules` | Automation Rules | list | Active automations |
| `ops.schedules` | Schedules | list | Scheduled tasks |
| `ops.alerts` | Operations Alerts | list | Operational alerts |

---

## 9. WIDGET PROPERTIES SCHEMA

### 9.1 Admin Hero Card (`admin.hero-card`)

```typescript
type AdminHeroConfig = {
  // Display
  greetingStyle: "simple" | "detailed" | "minimal";  // default: "detailed"
  showAvatar: boolean;                                // default: true
  showQuickStats: boolean;                           // default: true
  showSystemStatus: boolean;                         // default: true

  // Stats to show
  statsToShow: ("users" | "revenue" | "alerts" | "tickets")[];

  // Actions
  showNotificationBell: boolean;                     // default: true
  showSettingsIcon: boolean;                         // default: true
  showSearchIcon: boolean;                           // default: true
};
```

### 9.2 System Health (`admin.system-health`)

```typescript
type SystemHealthConfig = {
  // Display
  showUptime: boolean;                // default: true
  showActiveUsers: boolean;           // default: true
  showServerLoad: boolean;            // default: true
  showApiStatus: boolean;             // default: true

  // Thresholds
  warningThreshold: number;           // default: 70 (%)
  criticalThreshold: number;          // default: 90 (%)

  // Refresh
  autoRefresh: boolean;               // default: true
  refreshInterval: number;            // default: 30 (seconds)

  // Actions
  showDetailsLink: boolean;           // default: true
  showMaintenanceToggle: boolean;     // default: false
};
```

### 9.3 Stats Grid (`admin.stats-grid`)

```typescript
type AdminStatsGridConfig = {
  // Stats to show (toggles)
  showTotalUsers: boolean;            // default: true
  showActiveUsers: boolean;           // default: true
  showTotalRevenue: boolean;          // default: true
  showPendingPayments: boolean;       // default: true
  showOpenTickets: boolean;           // default: false
  showSystemAlerts: boolean;          // default: true

  // Layout
  columns: 2 | 3 | 4;                 // default: 2
  showIcons: boolean;                 // default: true
  showTrend: boolean;                 // default: true
  showSparkline: boolean;             // default: false

  // Actions
  enableTap: boolean;                 // default: true
};
```

### 9.4 User List (`users.list`)

```typescript
type UserListConfig = {
  // Display
  maxItems: number;                   // default: 10, range: 5-50
  showAvatar: boolean;                // default: true
  showRole: boolean;                  // default: true
  showStatus: boolean;                // default: true
  showLastActive: boolean;            // default: true
  showEmail: boolean;                 // default: false

  // Filtering
  defaultRoleFilter: "all" | "student" | "teacher" | "parent" | "admin";
  defaultStatusFilter: "all" | "active" | "inactive" | "pending" | "suspended";
  showSearchBar: boolean;             // default: true
  showFilters: boolean;               // default: true

  // Sorting
  defaultSortBy: "name" | "date" | "role" | "status";
  defaultSortOrder: "asc" | "desc";

  // Actions
  enableTap: boolean;                 // default: true
  showBulkSelect: boolean;            // default: true
  showQuickActions: boolean;          // default: true
};
```

### 9.5 Revenue Summary (`finance.revenue-summary`)

```typescript
type RevenueSummaryConfig = {
  // Display
  showTotalRevenue: boolean;          // default: true
  showGrowthPercentage: boolean;      // default: true
  showBreakdown: boolean;             // default: true
  showComparison: boolean;            // default: true

  // Period
  defaultPeriod: "today" | "week" | "month" | "quarter" | "year";
  showPeriodSelector: boolean;        // default: true

  // Format
  currencyFormat: "symbol" | "code" | "name";  // default: "symbol"
  abbreviateNumbers: boolean;         // default: true

  // Actions
  showViewDetails: boolean;           // default: true
  showExport: boolean;                // default: false
};
```

### 9.6 Transactions List (`finance.transactions`)

```typescript
type TransactionsConfig = {
  // Display
  maxItems: number;                   // default: 5, range: 3-20
  showType: boolean;                  // default: true
  showCategory: boolean;              // default: true
  showStatus: boolean;                // default: true
  showDate: boolean;                  // default: true
  showReference: boolean;             // default: false

  // Filtering
  typeFilter: "all" | "income" | "expense";
  statusFilter: "all" | "completed" | "pending" | "failed";

  // Actions
  enableTap: boolean;                 // default: true
  showViewAll: boolean;               // default: true
};
```

### 9.7 KPI Grid (`analytics.kpi-grid`)

```typescript
type KPIGridConfig = {
  // Display
  maxKPIs: number;                    // default: 6, range: 4-12
  showTarget: boolean;                // default: true
  showProgress: boolean;              // default: true
  showTrend: boolean;                 // default: true
  showSparkline: boolean;             // default: false

  // Layout
  columns: 2 | 3 | 4;                 // default: 3
  cardStyle: "compact" | "standard" | "detailed";

  // KPIs to show
  kpiIds: string[];                   // Configurable KPI selection

  // Actions
  enableTap: boolean;                 // default: true
  showConfigureButton: boolean;       // default: false
};
```

### 9.8 Alerts Widget (`admin.alerts`)

```typescript
type AlertsConfig = {
  // Display
  maxItems: number;                   // default: 5
  showSeverity: boolean;              // default: true
  showTime: boolean;                  // default: true
  showSource: boolean;                // default: true

  // Filtering
  severityFilter: "all" | "critical" | "warning" | "info";
  showAcknowledged: boolean;          // default: false

  // Actions
  enableTap: boolean;                 // default: true
  showAcknowledge: boolean;           // default: true
  showViewAll: boolean;               // default: true
  showDismiss: boolean;               // default: false
};
```

---

## 10. API ENDPOINTS

### 10.1 Dashboard APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_admin_dashboard` | All dashboard data | `{admin_id}` | AdminDashboardData |
| `get_system_health` | System health metrics | `{}` | SystemHealth |
| `get_admin_stats` | Quick statistics | `{admin_id}` | AdminStats |
| `get_alerts` | System alerts | `{severity?, limit?}` | Alert[] |
| `get_recent_activity` | Recent activities | `{limit?}` | Activity[] |
| `acknowledge_alert` | Acknowledge alert | `{alert_id}` | void |

### 10.2 User Management APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_users` | List users | `{filters?, pagination?}` | User[] |
| `get_user_detail` | User details | `{user_id}` | UserDetail |
| `create_user` | Create user | `{user_data}` | User |
| `update_user` | Update user | `{user_id, data}` | User |
| `delete_user` | Delete user | `{user_id}` | void |
| `suspend_user` | Suspend user | `{user_id, reason}` | User |
| `activate_user` | Activate user | `{user_id}` | User |
| `bulk_create_users` | Bulk create | `{users[]}` | User[] |
| `bulk_update_users` | Bulk update | `{user_ids[], data}` | User[] |
| `get_user_stats` | User statistics | `{}` | UserStats |
| `get_pending_approvals` | Pending users | `{limit?}` | User[] |
| `approve_user` | Approve user | `{user_id}` | User |
| `reject_user` | Reject user | `{user_id, reason}` | void |

### 10.3 Financial APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_financial_summary` | Financial overview | `{period}` | FinancialSummary |
| `get_transactions` | List transactions | `{filters?, pagination?}` | Transaction[] |
| `get_transaction_detail` | Transaction details | `{transaction_id}` | TransactionDetail |
| `get_revenue_breakdown` | Revenue by category | `{period}` | RevenueBreakdown |
| `get_expense_breakdown` | Expense by category | `{period}` | ExpenseBreakdown |
| `get_pending_payments` | Pending payments | `{limit?}` | Payment[] |
| `get_collection_rate` | Collection metrics | `{period}` | CollectionRate |
| `export_financial_report` | Export report | `{type, period, format}` | ReportFile |
| `get_monthly_data` | Monthly comparison | `{months}` | MonthlyData[] |
