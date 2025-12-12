# 🚀 DELIVERY_MILESTONES.md  
### End-to-End Roadmap for Universal Widget, Config-Driven Platform

This document defines the **official delivery roadmap** for the universal widget architecture.

**Key Changes:**
- Widgets are universal (any widget, any screen)
- Tabs are dynamic (1-10 per customer)
- Screens are widget containers

---

# 📌 Milestone 0 — Planning & Architecture (Week 0-1)

**Goals:**
- Define universal widget architecture
- Finalize types and conceptual models
- Create project structure
- Complete all documentation

**Deliverables:**
- `ARCHITECTURE_OVERVIEW.md` ✅
- `WIDGET_SYSTEM_SPEC.md` ✅
- `DB_SCHEMA_REFERENCE.md` ✅
- `NAVIGATION_FAILSAFE_SPEC.md` ✅
- `FEATURE_TAXONOMY.md` ✅
- `IMPLEMENTATION_MASTER_GUIDE.md` ✅
- `DELIVERY_MILESTONES.md` ✅

**Completion Criteria:**
- All docs complete and aligned
- Clear architecture understanding
- No coding confusion

---

# 📌 Milestone 1 — Foundation Types & Defaults (Week 1-2)

**Goals:**
Build solid type foundations before any dynamic logic.

**Tasks:**
1. Create `src/types/` structure
2. Implement all TypeScript types:
   - WidgetProps, WidgetMetadata, WidgetDataPolicy
   - ScreenLayoutConfig, ScreenWidgetConfig
   - TabConfig, NavigationConfig
   - CustomerConfig, ThemeConfig
   - Permission types
3. Implement Zod schemas for validation
4. Implement default configs:
   - DEFAULT_SCREEN_LAYOUTS
   - FALLBACK_TABS
   - DEFAULT_THEME
   - SAFE_MODE_CONFIG

**Completion Criteria:**
- TypeScript compiles cleanly
- All types + defaults ready
- No hardcoded UI logic yet

---

# 📌 Milestone 2 — Database Schema & RLS (Week 2-3)

**Goals:**
Build the entire multi-tenant configuration backend.

**Tasks:**
- Create all tables:
  - `customers`
  - `user_profiles`
  - `customer_features`
  - `navigation_tabs`
  - `navigation_screens`
  - `widget_definitions`
  - `screen_definitions`
  - `screen_layouts` (THE CORE TABLE)
  - `customer_themes`
  - `roles`, `permissions`, `role_permissions`
  - `user_permissions`
  - `config_audit_log`
  - `config_change_events`
- Implement RLS policies
- Implement RPC functions:
  - `get_customer_config`
  - `get_navigation_tabs`
  - `get_screen_layout`
  - `get_user_permissions`
  - `emergency_disable_feature`
- Seed widget_definitions and screen_definitions

**Completion Criteria:**
- Supabase schema ready
- All RLS policies secure
- Seed data loaded for dev

---

# 📌 Milestone 3 — Widget Registry & Base Components (Week 3-4)

**Goals:**
Build the widget infrastructure.

**Tasks:**
- Create `widgetRegistry.ts` with all 60+ widgets
- Implement base widget components:
  - `WidgetContainer`
  - `WidgetErrorBoundary`
  - `WidgetSkeleton`
  - `WidgetOfflinePlaceholder`
- Implement widget validation
- Create widget categories structure

**Completion Criteria:**
- Widget registry complete
- Base components working
- Widget validation passing

---

# 📌 Milestone 4 — Config Services & Hooks (Week 4-5)

**Goals:**
Build the core config loading logic.

**Tasks:**
- Create config services:
  - `screenLayoutService`
  - `navigationService`
  - `featureService`
  - `permissionService`
  - `themeService`
- Create config hooks:
  - `useScreenLayout`
  - `useNavigationTabs`
  - `useFeatures`
  - `usePermissions`
  - `useCustomerTheme`
- Add fallback logic to defaults
- Add safe-mode behavior

**Completion Criteria:**
- All services unit-tested
- Fallback to defaults works
- Safe-mode activates on failure


---

# 📌 Milestone 5 — Dynamic Navigation (Week 5-6)

**Goals:**
Implement fully dynamic tab navigation (1-10 tabs).

**Tasks:**
- Implement `DynamicNavigator`
- Implement `DynamicTabBar`
- Implement tab resolution logic
- Add permission/feature gating for tabs
- Implement fallback to static navigation
- Support 1-10 tabs per customer

**Completion Criteria:**
- Tabs render from DB config
- 3-tab config shows 3 tabs
- 7-tab config shows 7 tabs
- Fallback works when config fails
- Permission-hidden tabs work

---

# 📌 Milestone 6 — Dynamic Screens (Week 6-8)

**Goals:**
Implement universal screen rendering from widget config.

**Tasks:**
- Implement `DynamicScreen` component
- Implement screen layout resolution
- Implement widget filtering:
  - By role
  - By permission
  - By feature
  - By visibility rules
- Implement widget ordering
- Add pull-to-refresh
- Add screen-level error handling

**Completion Criteria:**
- Screens render widgets from config
- Same widget works on multiple screens
- Widget filtering works correctly
- Error boundaries contain failures

---

# 📌 Milestone 7 — Widget Implementation (Week 8-12)

**Goals:**
Implement all 60+ widgets.

**Tasks by Category:**

### Schedule Widgets (Week 8)
- `schedule.today`
- `schedule.weekly`
- `schedule.upcoming-class`
- `schedule.live-now`

### Study Widgets (Week 8-9)
- `library.recent`
- `library.favorites`
- `library.subjects`
- `library.continue`
- `content.featured`

### Assessment Widgets (Week 9)
- `assignments.pending`
- `assignments.submitted`
- `assignments.to-grade`
- `tests.upcoming`
- `tests.results`
- `tests.analytics`

### Doubts Widgets (Week 9-10)
- `doubts.inbox`
- `doubts.quick-ask`
- `doubts.answered`
- `doubts.to-answer`

### Progress Widgets (Week 10)
- `progress.snapshot`
- `progress.subject-wise`
- `progress.streak`
- `progress.goals`
- `progress.weak-areas`

### Social Widgets (Week 10-11)
- `peers.groups`
- `peers.leaderboard`
- `peers.suggestions`
- `feed.class`
- `feed.announcements`

### AI Widgets (Week 11)
- `ai.tutor-chat`
- `ai.recommendations`
- `ai.summary`
- `ai.practice`

### Profile & Utility Widgets (Week 11-12)
- `profile.summary`
- `profile.stats`
- `notifications.recent`
- `actions.quick`
- `hero.greeting`

### Teacher Widgets (Week 12)
- `analytics.class-performance`
- `analytics.attendance`
- `class.roster`
- `class.live-controls`

### Parent Widgets (Week 12)
- `child.progress`
- `child.schedule`
- `child.attendance`
- `child.selector`

### Admin Widgets (Week 12)
- `admin.stats`
- `admin.users`
- `admin.config`
- `admin.alerts`

**Completion Criteria:**
- All 60+ widgets implemented
- Each widget handles loading/error/empty states
- Each widget respects size variants
- All widgets have unit tests

---

# 📌 Milestone 8 — Permission Engine (Week 12-13)

**Goals:**
Implement full RBAC with overrides.

**Tasks:**
- Implement permission resolution
- Implement `PermissionGate` component
- Implement `FeatureGate` component
- Add permission checks to:
  - Tabs
  - Screens
  - Widgets
  - Actions
- Implement user-level overrides
- Implement customer-level role overrides

**Completion Criteria:**
- Permissions enforced everywhere
- Override precedence correct
- Fail-closed on errors

---

# 📌 Milestone 9 — Theme & Branding System (Week 13-14)

**Goals:**
Support per-customer theming AND white-labeling.

**Tasks:**

### Theme (Visual)
- Implement theme loading from DB
- Implement theme merging with defaults
- Apply theme tokens across UI
- Support color override
- Validate color contrast
- Support dark/light mode

### Branding (White-Label) - NEW
- Create `customer_branding` table
- Implement `brandingService`
- Implement `useCustomerBranding` hook
- Support logo overrides (main, small, dark)
- Support feature naming (AI Tutor name, etc.)
- Support text overrides (JSON)
- Integrate with i18n (branding > i18n priority)
- Support contact info (email, phone, WhatsApp)
- Support legal links (terms, privacy)

**Completion Criteria:**
- Theme changes reflect immediately
- All components use theme tokens
- Branding overrides work on ALL screens (dynamic + fixed)
- Text overrides take priority over i18n
- Logos display correctly

---

# 📌 Milestone 10 — Platform Studio Web App (Week 14-20)

**Goals:**
Build the complete Platform Studio web application with drag-and-drop, live preview, and real-time sync.

**See:** `PLATFORM_STUDIO_TECHNICAL_SPEC.md` for full technical details.

## Phase 10.1 — Foundation (Week 14-15)

**Tasks:**
- Set up Next.js 14 project
- Configure Supabase client
- Implement authentication
- Create customer selection UI
- Set up database tables:
  - `draft_configs`
  - `published_configs`
  - `config_versions`
  - `publish_jobs`
  - `publish_logs`
  - `studio_logs`
  - `config_templates`

**Completion Criteria:**
- Studio app running
- Auth working
- Customer selection working

## Phase 10.2 — Drag & Drop Builder (Week 15-17)

**Tasks:**
- Implement Widget Palette (60+ widgets)
- Implement Canvas with drag-and-drop (dnd-kit)
- Implement Properties Panel
- Implement Tab Builder (1-10 tabs)
- Implement Screen Builder
- Implement auto-save to drafts
- Add undo/redo support

**Completion Criteria:**
- Can drag widgets onto screens
- Can reorder widgets
- Can configure widget properties
- Can add/remove/reorder tabs
- Changes auto-save to draft

## Phase 10.3 — Live Mobile Preview (Week 17-18)

**Tasks:**
- Implement Device Frame component (iPhone/Android)
- Render actual widgets using React Native Web
- Connect to draft config (not published)
- Implement role switching (Student/Teacher/Parent)
- Implement device switching
- Implement dark/light mode toggle
- Add QR code for real device preview

**Completion Criteria:**
- Preview shows real widgets
- Preview updates as you edit
- Role/device switching works
- What you see = what users get

## Phase 10.4 — Publish System (Week 18-19)

**Tasks:**
- Implement validation service
- Implement publish workflow:
  - Validate → Publish → Track
- Implement version history
- Implement rollback functionality
- Implement changes diff view
- Add publish confirmation dialog

**Completion Criteria:**
- Validation catches errors before publish
- Publish creates version history
- Rollback restores previous version
- Full audit trail

## Phase 10.5 — Real-Time Sync (Week 19)

**Tasks:**
- Configure Supabase Realtime for `config_change_events`
- Implement mobile app subscription
- Implement cache invalidation on event
- Add "App Updated" toast on mobile
- Test sync latency (<2 seconds)

**Completion Criteria:**
- Publish triggers mobile refresh
- Mobile apps update within 2 seconds
- No manual refresh needed

## Phase 10.6 — Debug Console (Week 19-20)

**Tasks:**
- Implement logging service
- Implement Debug Console UI
- Add log filtering (level, category)
- Add log export
- Log all publish events
- Log mobile device connections
- Show real-time log stream

**Completion Criteria:**
- Full visibility into operations
- Can filter by level/category
- Can export logs
- Real-time log updates

## Phase 10.7 — Template System (Week 20)

**Tasks:**
- Create pre-built templates:
  - Minimal (3 tabs)
  - Standard (5 tabs)
  - Full (7 tabs)
  - Teacher Focus
  - Parent View
- Implement template application
- Implement custom template creation
- Add template preview

**Completion Criteria:**
- One-click template application
- Can create custom templates
- Templates include tabs, screens, widgets, theme

## Platform Studio Completion Criteria

- [ ] Drag & drop builder working
- [ ] Live preview shows real widgets
- [ ] Publish workflow with validation
- [ ] Real-time sync to mobile (<2s)
- [ ] Debug console with full logging
- [ ] Template system working
- [ ] Version history and rollback
- [ ] Full audit trail

---

# 📌 Milestone 11 — Testing & Hardening (Week 17-20)

**Goals:**
Ensure reliability, scale, and safety.

**Tasks:**
- Unit tests (>80% coverage)
- Integration tests
- Contract tests:
  - All widgetIds in DB exist in registry
  - All screenIds in DB exist in registry
  - All featureIds valid
- E2E tests (Detox)
- Load tests (k6)
- Chaos tests (failure simulation)
- Regression suite

**Completion Criteria:**
- System stable under load
- Dynamic config works correctly
- No crashes
- Backwards compatibility preserved
- Approved for production

---

# 🎯 Final Summary: Full Project Timeline

| Milestone | Duration | Output |
|-----------|----------|--------|
| M0 – Planning | 1 week | Docs + architecture |
| M1 – Types & Defaults | 1 week | Types + fallbacks |
| M2 – DB Schema | 1 week | Multi-tenant backend |
| M3 – Widget Registry | 1 week | 60+ widget definitions |
| M4 – Config Services | 1 week | Config loading layer |
| M5 – Dynamic Navigation | 1 week | 1-10 dynamic tabs |
| M6 – Dynamic Screens | 2 weeks | Universal screen rendering |
| M7 – Widget Implementation | 4 weeks | All 60+ widgets |
| M8 – Permission Engine | 1 week | Full RBAC |
| M9 – Theme & Branding | 1-2 weeks | Per-customer theming + white-label |
| **M10 – Platform Studio** | **6 weeks** | **Full web app with drag-drop, preview, publish** |
| M11 – Testing & Hardening | 3 weeks | Production-ready |

**Total: 24 weeks** (solo developer)
**Total: 12-14 weeks** (team of 2-3)

## Platform Studio Breakdown (M10)

| Phase | Duration | Output |
|-------|----------|--------|
| 10.1 Foundation | 1 week | Next.js + Auth + DB |
| 10.2 Drag & Drop | 2 weeks | Widget/Tab/Screen builders |
| 10.3 Live Preview | 1 week | Real mobile frame preview |
| 10.4 Publish System | 1 week | Validation + versioning |
| 10.5 Real-Time Sync | 0.5 week | Mobile instant updates |
| 10.6 Debug Console | 0.5 week | Full logging |
| 10.7 Templates | 1 week | Pre-built configs |

---

# 🏁 Success Metrics

| Metric | Target |
|--------|--------|
| Time to add customer | 10 minutes |
| Code changes per customer | 0 |
| Feature toggle time | <1 second |
| Screen load time | <2s (p95) |
| Widget count | 60+ |
| Tab flexibility | 1-10 tabs |
| Test coverage | >80% |

---

# ✅ You now have the complete roadmap.

Every future task should map to one of these milestones.

**Key Principle:** Universal widgets + dynamic tabs = infinite customization with zero code changes.

```
End of DELIVERY_MILESTONES.md
```
