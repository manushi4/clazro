Complete Architecture & Functional Overview of the Multi-Tenant Configuration Studio
0. Purpose

Platform Studio is the central configuration console for your entire multi-tenant coaching app ecosystem.

It allows:

Your internal team

Selected coaching technical staff

Authorized operations heads

to configure every aspect of a school/coaching client's experience without writing code or shipping new app builds.

Platform Studio directly controls:

Themes

Branding

Navigation

Dashboard layout

Features

Permissions

RBAC

Widget composition

Text copy overrides

Admin audit logs

Config versioning

Multi-language support

Platform Studio is not the school’s admin/HR/attendance system.
It is the system-level control panel for customizing your mobile app per tenant.

1. Philosophy of Platform Studio

Platform Studio is built on three principles:

1. Everything is Config

No code deployments needed for:

Changing app theme

Rebranding per client

Showing/hiding screens

Changing home dashboard widgets

Changing navigation

Enabling/disabling features

Adjusting permissions

Config lives in Supabase DB.

The mobile app renders from this config dynamically.

2. Tenant Isolation

Each school/coaching (“tenant”) has its own:

Navigation

Features

Dashboard layout

Themes

Branding

Text copy

Roles & permissions

No tenant can see the configuration of another.

3. Safe Mode First

If config is:

broken

incomplete

conflicting

… app falls back to a safe static layout, preventing crashes.

Platform Studio itself enforces validation rules to prevent invalid configurations.

2. Users & Roles in Platform Studio
Platform-level roles:
1. Platform Admin (Superadmin)

Internal to your company

Full access to all tenants

Can create/modify/delete tenant configurations

2. Tenant Admin (Coaching Owner / Tech Lead)

Has access only to their own customer config

Can adjust:

Theme colors

Logos

Dashboard widgets

Navigation tabs

Text overrides

Feature flags

Restricted from:

Dangerous permissions

Editing other tenants

Server-side schemas

3. Read-Only Admin

Can view all configs

Cannot edit anything

3. Platform Studio Modules

Platform Studio contains these high-level modules:

1. Customers
2. Theme Packs
3. Branding
4. Navigation
5. Screens
6. Dashboard Layout (Widgets)
7. Feature Flags
8. RBAC Permissions
9. Text Overrides (i18n)
10. Config Audit Log
11. Versioning & Rollback
12. Environment Settings (dev/stage/prod)
13. Studio User Management


These are accessible through a sidebar-based UI.

4. Data Flow Overview
            ┌──────────────────────────┐
            │      Platform Studio      │
            │ (Web or RN Admin Surface) │
            └──────────────┬───────────┘
                           │
                           ▼
              Supabase Config Tables
       ┌──────────────────────────────────────┐
       │ customers                            │
       │ customer_themes                      │
       │ customer_branding                    │
       │ customer_features                    │
       │ navigation_tabs                      │
       │ navigation_screens                   │
       │ dashboard_layouts                    │
       │ roles / permissions / role_permissions │
       │ config_audit_log                     │
       └──────────────────────────────────────┘
                           │
                           ▼
         Mobile App (Student / Teacher / Parent)
       ┌──────────────────────────────────────┐
       │ fetch CustomerConfig (RPC)           │
       │ validate via Zod                     │
       │ fallback to SAFE_MODE_CONFIG if bad  │
       │ render UI from:                      │
       │  - ThemeConfig                       │
       │  - NavigationConfig                  │
       │  - BrandingConfig                    │
       │  - LayoutConfig                      │
       │  - FeatureFlags                      │
       │  - PermissionMap                     │
       └──────────────────────────────────────┘

5. CustomerConfig — The Heart of Platform Studio

The mobile app loads one consolidated config:

export interface CustomerConfig {
  themeConfig: ThemeConfig;
  brandingConfig: BrandingConfig;
  navigationConfig: NavigationConfig;
  dashboardLayoutConfig: DashboardLayoutConfig;
  featureFlags: Record<string, boolean>;
  permissionMap: PermissionMap;
}


Platform Studio writes into these individual components.

6. Platform Studio Sections in Detail
6.1 Customers Module

Purpose: Manage onboarding & identification of tenants.

Features:

Create new customer

Assign slug (unique)

Mark as active/inactive

Contact info

Notes

Environment (dev/stage/prod)

Used to select which customer you’re editing.

6.2 Theme Packs Module

Allows admin to:

Select from preset theme packs:

Material3

Flat Minimal

Glass

Override:

Primary/secondary colors

Background & surface colors

Card and button radius

Typography pairing (fonts)

Elevation density

Motion settings

Theme preview frame shows:

Card appearance

Button appearance

Chip appearance

Typography scale

Supabase table: customer_themes.theme_config_json

6.3 Branding Module (White-Label)

**Full white-label customization per customer.**

### App Identity
- App name ("SchoolX Learning")
- App tagline
- Favicon (for web/PWA)

### Logo Uploads
- Main logo (light mode)
- Main logo (dark mode)
- Small/icon logo
- Splash screen image
- Login hero image

### Feature Naming
- AI Tutor name → "Ask Guru", "Study Buddy"
- Doubt section name → "Get Help", "Ask Questions"
- Assignment name → "Homework", "Task"
- Test name → "Quiz", "Assessment"
- Live class name → "Online Session", "Virtual Room"

### Text Overrides (Flexible)
- Welcome title/subtitle
- Tab labels
- Button text
- Empty state messages
- Any UI text via JSON overrides

### Contact Information
- Support email
- Support phone
- WhatsApp number
- Help center URL

### Legal Links
- Terms of Service URL
- Privacy Policy URL
- Refund Policy URL

**Supabase table:** `customer_branding`

**Note:** Branding applies to ALL screens (dynamic + fixed).

6.4 Navigation Module

Controls bottom tab bar:

Tab label

Icon

Order (drag & drop)

Enabled/disabled

Initial route

This determines the primary navigation for each role.

Supabase table: navigation_tabs

6.5 Screens Module

Controls screen visibility & placement:

List of all known screens (from routeRegistry)

Assign a screen to a tab

Enable/disable screen

Required features

Required permissions

Header visibility

Custom screen title (optional)

Supabase table: navigation_screens

6.6 Dashboard Layout (Widgets)

Configures home dashboard:

Add/remove widgets

Reorder widgets

Choose widget variant

Set widget instance props

Hide when empty

Preview dashboard cards

Supabase table: dashboard_layouts

6.7 Feature Flags Module

Control per-client feature toggles:

Enable/disable features

Feature categories:

AI

Gamification

Schedule

Assignments

Live Classes

Doubts

Library

Peer Network

Supabase table: customer_features

6.8 RBAC Permissions Module

Controls:

Which roles exist per tenant

Which permissions each role gets

Role inheritance

Custom roles per tenant (optional)

Tables:

roles

permissions

role_permissions

6.9 Text Overrides Module

Configurable per-language:

Welcome title

Welcome subtitle

Dashboard hero caption

Login subtitle

AI tutor name

Doubt module name

Stored in: customer_branding.branding_json.textOverrides

Used by i18n.

6.10 Config Audit Log

Tracks all changes:

Before/after diff (JSON)

Who made the change

Timestamp

Change type (theme, nav, layout, features)

Old version → New version

Supabase table: config_audit_log

6.11 Versioning & Rollback

Each config domain can:

Move to “Draft” mode

Be previewed on device

Be “Published” by admin

Versions can be rolled back

This prevents bad configs from breaking production.

6.12 Environment Settings

Allows:

Environment separation:

config_dev

config_stage

config_prod

Customer migration between environments

SLA rules for publishing changes

6.13 Studio User Management

Controls who can access Platform Studio.

Roles:

Platform Admin (full)

Tenant Admin (customer-bound)

Read-only admin

Backed by:

studio_users

studio_roles

7. Security Model

Platform Studio must follow these rules:

Strict RLS (Row Level Security)

Platform Admin can read/write all customers

Tenant Admins can only read/write their own

All writes must be:

Validated through Zod + server rules

Logged in config_change_events

Audited in config_audit_log

Additionally:

Asset uploads must be sanitized

No HTML/JS injection (JSON-only configs)

Audit every config mutation

8. Safe Mode Protection

If any config is corrupted:

App activates SAFE_MODE_CONFIG:

Minimal theme

Minimal nav (Home, Study, Profile)

Minimal widgets

Even if navigation, theme, branding, or layout break, app remains usable.

Platform Studio prevents broken configs through:

Zod validation

UI constraints

Protection from deleting required fields

Guardrails: cannot remove all tabs/screens

9. Technology Stack

Recommended:

Front-end

Next.js or React SPA

React Query

Material 3 or Shadcn UI

Component library shared baseline for visual consistency

Backend

Supabase

Row level security

Postgres stored procedures (RPC)

Service-role key for Studio (secure, not client key)

10. Deployment Strategy

Platform Studio is a separate deployment from mobile app

Feature development does not affect app builds

Studio changes propagate instantly to mobile app

Config versioning ensures safe rollouts

11. Long-Term Roadmap (Now Implemented!)

~~Drag-and-drop dashboard builder with visual preview~~ ✅ **IMPLEMENTED**

~~Multi-brand asset packs~~ ✅ **IMPLEMENTED**

~~Automated testing of configs before publish~~ ✅ **IMPLEMENTED**

Integration with AI to suggest UI layouts or themes (Future)

AI-based copywriting for brand text (Future)

---

## 📚 Related Documentation

For complete technical implementation details, see:

**[PLATFORM_STUDIO_TECHNICAL_SPEC.md](./PLATFORM_STUDIO_TECHNICAL_SPEC.md)** — Full technical specification including:
- Drag & Drop Builder implementation
- Template System
- Live Mobile Preview
- Real-Time Sync architecture
- Publish System with validation
- Debug Console with logging
- Database schema
- API contracts

12. DONE Criteria (Definition of Complete Platform Studio)

Platform Studio is fully complete when:

 All major config domains are editable

 Navigation, dashboard, themes, branding, features, permissions work end-to-end

 Safe mode prevents bad configs from breaking app

 Every config write generates an audit entry

 Rollback system restores previous versions flawlessly

 Supported for student, teacher, parent roles

 Tenant admins can safely customize without causing errors

 Platform admins have full global visibility