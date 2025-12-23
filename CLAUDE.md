# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

- Never use emojis in code, comments, commit messages, or documentation
- When using skills (widget-generator, fixed-screen-generator, dynamic-screen-generator):
  - Never skip any phase - execute all phases in order
  - Always use Supabase MCP tools for database operations (never create migration files manually)

## Project Overview

Multi-tenant educational platform with React Native mobile app and Next.js web dashboard (Platform Studio). Config-driven architecture where everything is a widget and layouts are defined in the database.

**Key Tenets:**
- Everything is a widget (no fixed layouts)
- Everything is config (tabs, screens, features, themes from database)
- Multi-tenant by design (row-level isolation via `customer_id`)

## Commands

### Mobile App (Root)
```bash
npm run android          # Run on Android
npm run android:build    # Build Android APK
npm run start            # Start Metro bundler
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run typecheck        # TypeScript validation
npm run validate         # TypeScript + Lint combined
npm run test             # Jest testing
```

### Web Dashboard (platform-studio/)
```bash
npm run dev              # Next.js dev server on :3001
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # TypeScript validation
```

## Architecture

```
Mobile App (React Native 0.80)     Platform Studio (Next.js 14)
         │                                    │
         └────────────── Supabase ────────────┘
                    (PostgreSQL + Realtime)
```

### Mobile App Structure (`src/`)
- `screens/` - Role-based screens (admin/, student/, teacher/, parent/)
- `components/widgets/` - 60+ reusable widgets by category
- `hooks/queries/` & `hooks/mutations/` - React Query hooks by role
- `stores/` - Zustand stores (auth, theme, config, navigation)
- `config/` - Feature and widget registries
- `services/` - Business logic (config, ai, downloads)
- `offline/` - Offline-first mutation queue and sync

### Platform Studio Structure (`platform-studio/src/`)
- `app/studio/` - Builder pages (screens, navigation, themes)
- `components/builder/` - Drag-drop screen builder
- `config/` - Screen and widget registries for web

### Database Tables (Supabase)
- `navigation_tabs`, `tab_screens`, `screen_layouts` - Dynamic UI config
- `customer_features` - Feature toggles per tenant
- `customer_themes` - Theme customization
- `user_profiles` - User data with `customer_id` for RLS

## Development Skills

Three custom skills are available for generating code:

| Skill | Command | Purpose |
|-------|---------|---------|
| `widget-generator` | `/widget-generator` | Create new widgets (7 phases) |
| `fixed-screen-generator` | `/fixed-screen-generator` | Create custom screens with forms/details (8 phases) |
| `dynamic-screen-generator` | `/dynamic-screen-generator` | Create widget-based dashboard screens (5 phases) |

## Critical Patterns

### Supabase MCP Tools (Always Use)
```
DDL (CREATE, ALTER): mcp__supabase__apply_migration
DML (SELECT, INSERT): mcp__supabase__execute_sql
```
Never create migration files manually.

### RLS Policy Pattern
```sql
CREATE POLICY "table_tenant_isolation" ON table_name
  FOR ALL USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles
      WHERE user_id = auth.uid()::text
    )
  );
```
Always use `user_profiles` (not `user_roles`). Cast `auth.uid()` to `::text`.

### Widget Component Requirements
- All 4 states: Loading, Error, Empty, Success
- Theme colors via `useAppTheme()` (no hardcoded colors)
- Static text via `t()` (i18next)
- Database content via `getLocalizedField(item, 'field')`
- Translations in both English and Hindi

### Screen Types
- **Dynamic screens**: Widget-based, use `DynamicScreen` component, configured in database
- **Fixed screens**: Custom components in `src/screens/`, for complex forms/wizards

## Key Identifiers

- Demo customer ID: `2b1195ab-1a06-4c94-8e5f-c7c318e7fc46`
- Widget ID format: `category.name` (e.g., `parent.feesSummary`, `analytics.kpiGrid`)
- Screen ID format: `role-purpose` (e.g., `admin-home`, `student-dashboard`)

## Documentation

Comprehensive guides in `Doc/` folder:
- `SCREEN_DEVELOPMENT_GUIDE.md` - Screen creation workflow
- `WIDGET_DEVELOPMENT_GUIDE.md` - Widget creation workflow
- `ARCHITECTURE_OVERVIEW.md` - System design
- `PLATFORM_STUDIO_TECHNICAL_SPEC.md` - Web dashboard specs
