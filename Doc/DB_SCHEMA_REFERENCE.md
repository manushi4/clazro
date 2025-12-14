# 📘 DB_SCHEMA_REFERENCE.md

### Complete Database Schema for Universal Widget, Multi-Tenant, Config-Driven Architecture

This document provides a **human-readable reference** of all tables, fields, and relationships needed for the **universal widget system** with config-driven, multi-tenant platform.

**Key Change:** Widgets are universal - they can be placed on ANY screen, ANY tab, ANY position. There are no fixed layouts.

---

# 🚀 Quick Reference: Creating Localized Content Tables

When creating a new widget that needs dynamic content, follow this pattern:

```sql
-- 1. Create table with localized columns (_en, _hi)
CREATE TABLE my_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  
  -- Localized text fields (always have _en and _hi)
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  
  -- Non-localized fields
  icon TEXT DEFAULT 'star',
  color TEXT DEFAULT '#6366F1',
  order_index INTEGER DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(customer_id, some_unique_field)
);

-- 2. Create index for performance
CREATE INDEX idx_my_content_customer ON my_content(customer_id);

-- 3. Insert sample data with both languages
INSERT INTO my_content (customer_id, title_en, title_hi, icon, color) VALUES
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'English Title', 'हिंदी शीर्षक', 'star', '#6366F1');
```

**Naming Convention:**
- `title_en`, `title_hi` - Short titles
- `description_en`, `description_hi` - Longer descriptions
- `instructions_en`, `instructions_hi` - Instructions/help text
- `label_en`, `label_hi` - Button/action labels

**Helper Function (already exists):**
```sql
SELECT get_localized(title_en, title_hi, 'hi') as title FROM my_content;
```

---

# 📦 1. Multi-Tenant Base Tables

## **1.1 `customers`**

Represents a school/coaching/client.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Unique customer ID |
| `name` | text | Display name |
| `slug` | text, unique | Used for login domain/URL |
| `status` | text | active / suspended / pending |
| `subscription_tier` | text | free / basic / premium / enterprise |
| `metadata` | jsonb | Flexible customer data |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

---

## **1.2 `user_profiles`**

Extends Supabase auth users with tenant + role info.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Matches auth.users.id |
| `customer_id` | uuid (FK → customers.id) | Tenant owner |
| `role` | text | student / teacher / parent / admin |
| `full_name` | text | — |
| `email` | text | — |
| `avatar_url` | text | — |
| `class` | text | (optional for student) |
| `section` | text | (optional) |
| `language` | text | Preferred language |
| `created_at` | timestamptz | — |

---

# 📦 2. Feature Configuration Tables

## **2.1 `customer_features`**

Which features are enabled for a given customer.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `feature_id` | text | From featureRegistry |
| `enabled` | boolean | true/false |
| `config` | jsonb | Feature-specific config |
| `emergency_disabled` | boolean | Kill switch |
| `updated_at` | timestamptz | — |

**Unique:** `(customer_id, feature_id)`


---

# 📦 3. Dynamic Tab Configuration

## **3.1 `navigation_tabs`**

Defines visible tabs per customer + role. **Supports 1-10 tabs.**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `role` | text | student / teacher / parent / admin |
| `tab_id` | text | e.g. "home", "study", "ask" |
| `label` | text | Visible label |
| `label_key` | text | i18n key (optional) |
| `icon` | text | Icon name |
| `order_index` | int | 1-10, sorting order |
| `enabled` | boolean | — |
| `root_screen_id` | text | Initial screen for this tab |
| `badge_type` | text | none / dot / count |
| `badge_source` | text | Query key for badge count |
| `requires_online` | boolean | Tab disabled when offline |
| `created_at` | timestamptz | — |

**Unique:** `(customer_id, role, tab_id)`

**Example - 3 Tabs:**
```sql
INSERT INTO navigation_tabs VALUES
  ('home', 'student', 'Home', 'home', 1, true, 'student-home'),
  ('learn', 'student', 'Learn', 'school', 2, true, 'study-hub'),
  ('profile', 'student', 'Me', 'person', 3, true, 'profile-home');
```

**Example - 7 Tabs:**
```sql
INSERT INTO navigation_tabs VALUES
  ('home', 'student', 'Home', 'home', 1, true, 'student-home'),
  ('schedule', 'student', 'Schedule', 'calendar', 2, true, 'schedule-screen'),
  ('study', 'student', 'Study', 'library', 3, true, 'study-hub'),
  ('ask', 'student', 'Ask', 'help', 4, true, 'doubts-home'),
  ('progress', 'student', 'Progress', 'trending-up', 5, true, 'progress-home'),
  ('social', 'student', 'Peers', 'people', 6, true, 'peers-home'),
  ('profile', 'student', 'Me', 'person', 7, true, 'profile-home');
```

---

## **3.2 `navigation_screens`**

Maps screens to tabs. Defines which screens are accessible from each tab.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `role` | text | — |
| `tab_id` | text | Parent tab |
| `screen_id` | text | Screen identifier |
| `enabled` | boolean | — |
| `order_index` | int | For navigation stack order |

**Unique:** `(customer_id, role, tab_id, screen_id)`

---

# 📦 4. Universal Screen & Widget Tables

**Key Change:** Widgets are NOT dashboard-only. Any widget can be placed on any screen.

## **4.1 `widget_definitions`**

Global widget metadata (reference table, not per-customer).

| Column | Type | Notes |
|--------|------|-------|
| `widget_id` | text (PK) | e.g. "schedule.today" |
| `name` | text | Human name |
| `description` | text | UI purpose |
| `category` | text | schedule/study/assessment/doubts/progress/social/ai/profile |
| `allowed_roles` | text[] | ["student", "teacher", "parent", "admin"] |
| `allowed_screen_types` | text[] | ["dashboard", "hub", "list", "any"] |
| `supported_sizes` | text[] | ["compact", "standard", "expanded"] |
| `default_size` | text | Default size |
| `default_props` | jsonb | Default widget configuration |
| `required_feature_id` | text | Feature dependency |
| `required_permissions` | text[] | Permission codes needed |
| `refreshable` | boolean | Can be refreshed |
| `offline_capable` | boolean | Works offline |
| `created_at` | timestamptz | — |

---

## **4.2 `screen_definitions`**

Defines available screens (reference table).

| Column | Type | Notes |
|--------|------|-------|
| `screen_id` | text (PK) | e.g. "student-home", "study-hub" |
| `name` | text | Human name |
| `screen_type` | text | dashboard / hub / list / detail / custom |
| `allowed_roles` | text[] | Which roles can access |
| `default_layout` | text | vertical / grid / masonry |
| `scrollable` | boolean | — |
| `pull_to_refresh` | boolean | — |
| `header_visible` | boolean | — |
| `created_at` | timestamptz | — |

---

## **4.3 `screen_layouts`**

**THE CORE TABLE** - Defines which widgets appear on which screen, per customer + role.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `role` | text | student / teacher / parent / admin |
| `screen_id` | text | Which screen |
| `widget_id` | text | Which widget |
| `position` | int | Order on screen (1, 2, 3...) |
| `size` | text | compact / standard / expanded |
| `enabled` | boolean | — |
| `grid_column` | int | For grid layouts (1-12) |
| `grid_row` | int | Row span |
| `custom_props` | jsonb | Instance-specific config |
| `visibility_rules` | jsonb | Conditional visibility |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Unique:** `(customer_id, role, screen_id, widget_id)`

**Example - Student Home Screen:**
```sql
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, size, enabled) VALUES
  ('cust-123', 'student', 'student-home', 'hero.greeting', 1, 'standard', true),
  ('cust-123', 'student', 'student-home', 'schedule.today', 2, 'compact', true),
  ('cust-123', 'student', 'student-home', 'actions.quick', 3, 'standard', true),
  ('cust-123', 'student', 'student-home', 'assignments.pending', 4, 'compact', true),
  ('cust-123', 'student', 'student-home', 'doubts.inbox', 5, 'compact', true),
  ('cust-123', 'student', 'student-home', 'progress.snapshot', 6, 'standard', true);
```

**Example - Same Widget on Different Screens:**
```sql
-- schedule.today on Home screen
INSERT INTO screen_layouts VALUES ('cust-123', 'student', 'student-home', 'schedule.today', 2, 'compact', true);

-- schedule.today on Schedule screen (expanded)
INSERT INTO screen_layouts VALUES ('cust-123', 'student', 'schedule-screen', 'schedule.today', 1, 'expanded', true);

-- schedule.today on Teacher Dashboard
INSERT INTO screen_layouts VALUES ('cust-123', 'teacher', 'teacher-home', 'schedule.today', 2, 'standard', true);
```


---

# 📦 5. Theme & Branding Tables

## **5.1 `customer_branding`**

**NEW TABLE** - Stores all white-label/personalization data per customer.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| **App Identity** | | |
| `app_name` | text | "SchoolX Learning" |
| `app_tagline` | text | "Learn Smarter" |
| **Logos & Assets** | | |
| `logo_url` | text | Main logo |
| `logo_small_url` | text | Small/icon logo |
| `logo_dark_url` | text | Logo for dark mode |
| `splash_image_url` | text | Splash screen |
| `login_hero_url` | text | Login screen image |
| `favicon_url` | text | For web/PWA |
| **Feature Naming** | | |
| `ai_tutor_name` | text | "Ask Guru" / "Study Buddy" |
| `doubt_section_name` | text | "Ask Doubts" / "Get Help" |
| `assignment_name` | text | "Homework" / "Assignment" |
| `test_name` | text | "Quiz" / "Test" / "Assessment" |
| `live_class_name` | text | "Live Class" / "Online Session" |
| **Contact Info** | | |
| `support_email` | text | support@school.com |
| `support_phone` | text | +91-XXXXXXXXXX |
| `whatsapp_number` | text | WhatsApp support |
| `help_center_url` | text | Help docs URL |
| **Legal Links** | | |
| `terms_url` | text | Terms of Service |
| `privacy_url` | text | Privacy Policy |
| `refund_url` | text | Refund Policy |
| **Text Overrides (Flexible)** | | |
| `text_overrides` | jsonb | Any custom text overrides |
| **Timestamps** | | |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Unique:** `(customer_id)`

**Example text_overrides JSON:**
```json
{
  "welcome_title": "Welcome to ABC Academy",
  "welcome_subtitle": "Start your learning journey",
  "tab_home": "Dashboard",
  "tab_study": "Courses",
  "submit_button": "Send",
  "empty_doubts": "No questions yet!"
}
```

---

## **5.2 `customer_themes`**

Stores theme/visual overrides for each customer. Supports both light and dark mode colors.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| **Light Mode Colors** | | |
| `primary_color` | text | Hex color |
| `secondary_color` | text | Hex color |
| `accent_color` | text | Hex color (tertiary) |
| `background_color` | text | Hex color |
| `surface_color` | text | Hex color |
| `text_color` | text | Hex color |
| `text_secondary_color` | text | Hex color for secondary text |
| **Dark Mode Colors** | | |
| `dark_primary_color` | text | Dark mode primary (default: same as primary) |
| `dark_secondary_color` | text | Dark mode secondary |
| `dark_accent_color` | text | Dark mode accent |
| `dark_background_color` | text | Dark mode background (default: #121212) |
| `dark_surface_color` | text | Dark mode surface (default: #1E1E1E) |
| `dark_text_color` | text | Dark mode text (default: #FFFFFF) |
| `dark_text_secondary_color` | text | Dark mode secondary text |
| **Status Colors** | | |
| `error_color` | text | Hex color |
| `success_color` | text | Hex color |
| `warning_color` | text | Hex color |
| **Typography** | | |
| `font_family` | text | Inter / System Default / Roboto / Poppins / Open Sans |
| `font_scale` | decimal(3,2) | 0.8 to 1.5, default 1.0 |
| **Border Radius** | | |
| `border_radius_small` | int | Default 4 |
| `border_radius_medium` | int | Default 8 |
| `border_radius_large` | int | Default 16 |
| `roundness` | int | Legacy - maps to border_radius_medium |
| **Elevation** | | |
| `card_elevation` | text | none / low / medium / high |
| `button_elevation` | text | none / low / medium / high |
| **Component Styles** | | |
| `button_style` | text | filled / outlined / tonal / text |
| `card_style` | text | elevated / outlined / flat |
| `input_style` | text | outlined / filled |
| `chip_style` | text | filled / outlined |
| **Theme Preset** | | |
| `theme_preset` | text | Preset name (see presets below) |
| **Other** | | |
| `logo_url` | text | Main logo |
| `logo_small_url` | text | Small/icon logo |
| `favicon_url` | text | — |
| `default_language` | text | en / hi / etc |
| `status` | text | active / draft |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Unique:** `(customer_id)`

### Dark Mode Implementation

The app supports 3 theme modes:
- **System**: Follows device dark/light mode setting
- **Light**: Always light mode
- **Dark**: Always dark mode

User preference is stored locally in `themeStore` (Zustand + AsyncStorage).

**Color Resolution Logic:**
```typescript
// In useAppTheme.ts
const isDark = effectiveMode === 'dark';

// For dark mode, use dark_* colors if available, else fallback to light colors
const primaryColor = isDark 
  ? (customerTheme.dark_primary_color || customerTheme.primary_color)
  : customerTheme.primary_color;
```

### Component Style Options

| Component | Options | Default | Description |
|-----------|---------|---------|-------------|
| `button_style` | filled, outlined, tonal, text | filled | Primary button appearance |
| `card_style` | elevated, outlined, flat | elevated | Card/container appearance |
| `input_style` | outlined, filled | outlined | Text input appearance |
| `chip_style` | filled, outlined | filled | Chip/tag appearance |

### Built-in Theme Presets

| Preset Name | Description | Primary | Style |
|-------------|-------------|---------|-------|
| `modern_blue` | Clean modern look | #2563EB | Elevated cards, filled buttons |
| `classic_gray` | Professional minimal | #475569 | Outlined cards, outlined buttons |
| `vibrant` | Bold and colorful | #7C3AED | Elevated cards, filled buttons |
| `minimal` | Ultra clean | #64748B | Flat cards, text buttons |
| `dark_pro` | Dark mode optimized | #3B82F6 | Elevated cards, tonal buttons |
| `soft_pastel` | Light and gentle | #EC4899 | Flat cards, filled buttons |
| `corporate` | Business professional | #0F172A | Outlined cards, filled buttons |
| `custom` | User's own settings | — | User defined |

**Example - Apply Modern Blue Preset:**
```sql
UPDATE customer_themes SET
  theme_preset = 'modern_blue',
  primary_color = '#2563EB',
  secondary_color = '#60A5FA',
  background_color = '#F8FAFC',
  surface_color = '#FFFFFF',
  button_style = 'filled',
  card_style = 'elevated',
  input_style = 'outlined',
  chip_style = 'filled',
  border_radius_medium = 8,
  card_elevation = 'low'
WHERE customer_id = 'cust-123';
```

---

# 📦 6. Permissions Tables (RBAC + Overrides)

## **6.1 `roles`**

| Column | Type | Notes |
|--------|------|-------|
| `role` | text (PK) | student / teacher / parent / admin |
| `description` | text | — |
| `hierarchy_level` | int | 1=student, 2=parent, 3=teacher, 4=admin |

---

## **6.2 `permissions`**

| Column | Type | Notes |
|--------|------|-------|
| `permission_code` | text (PK) | e.g. "view_dashboard" |
| `name` | text | Human name |
| `description` | text | — |
| `category` | text | view / action / premium |

---

## **6.3 `role_permissions`**

Base permissions assigned to each role.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `role` | text (FK) | — |
| `permission_code` | text (FK) | — |

**Unique:** `(role, permission_code)`

---

## **6.4 `customer_role_permissions`**

Customer-level overrides for role permissions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `role` | text | — |
| `permission_code` | text | — |
| `granted` | boolean | true = grant, false = revoke |
| `updated_at` | timestamptz | — |

**Unique:** `(customer_id, role, permission_code)`

---

## **6.5 `user_permissions`**

Per-user permission overrides.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `user_id` | uuid (FK) | — |
| `permission_code` | text | — |
| `granted` | boolean | true = grant, false = revoke |
| `reason` | text | Why override was applied |
| `granted_by` | uuid | Admin who granted |
| `expires_at` | timestamptz | Optional expiry |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Unique:** `(user_id, permission_code)`

---

# 📦 7. Audit & Safety Tables

## **7.1 `config_audit_log`**

Tracks all config changes.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid | — |
| `user_id` | uuid | Who made change |
| `table_name` | text | Which table changed |
| `record_id` | text | Which record |
| `config_type` | text | feature / navigation / screen_layout / theme |
| `change_type` | text | INSERT / UPDATE / DELETE |
| `before` | jsonb | Previous value |
| `after` | jsonb | New value |
| `reason` | text | Optional note |
| `timestamp` | timestamptz | — |

---

## **7.2 `config_change_events`**

Used for realtime invalidation inside the app.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid | — |
| `event_type` | text | config_published / config_rolled_back / feature_changed / navigation_changed / layout_changed / theme_changed |
| `version` | int | Config version number |
| `changed_at` | timestamptz | — |

App subscribes to this for live config updates.

---

# 📦 8. Platform Studio Tables

## **8.1 `draft_configs`**

Stores draft configurations being edited in Platform Studio (not live).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `config_type` | text | navigation / screen_layout / theme / branding |
| `config_data` | jsonb | Draft configuration data |
| `last_edited_by` | uuid | User who last edited |
| `last_edited_at` | timestamptz | — |

**Unique:** `(customer_id, config_type)`

---

## **8.2 `published_configs`**

Stores published configurations (what mobile apps see).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `config_type` | text | navigation / screen_layout / theme / branding |
| `config_data` | jsonb | Published configuration data |
| `version` | int | Version number |
| `published_by` | uuid | User who published |
| `published_at` | timestamptz | — |

**Unique:** `(customer_id, config_type)`

---

## **8.3 `config_versions`**

Version history for rollback support.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `version` | int | Version number |
| `config_snapshot` | jsonb | Full config at this version |
| `created_by` | uuid | User who created |
| `created_at` | timestamptz | — |

**Unique:** `(customer_id, version)`

---

## **8.4 `publish_jobs`**

Tracks publish/rollback operations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text (PK) | Job ID (e.g., pub_abc123) |
| `customer_id` | uuid (FK) | — |
| `initiated_by` | uuid | User who initiated |
| `status` | text | validating / publishing / published / failed / rolling_back / rolled_back |
| `started_at` | timestamptz | — |
| `completed_at` | timestamptz | — |
| `error` | text | Error message if failed |
| `changes_summary` | jsonb | Summary of changes |
| `version` | int | Target version |
| `previous_version` | int | Previous version (for rollback) |

---

## **8.5 `publish_logs`**

Detailed event log for each publish job.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `job_id` | text (FK) | References publish_jobs.id |
| `event` | text | Event name |
| `timestamp` | timestamptz | — |
| `data` | jsonb | Event data |

---

## **8.6 `studio_logs`**

General logging for Platform Studio.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text (PK) | — |
| `timestamp` | timestamptz | — |
| `level` | text | DEBUG / INFO / WARN / ERROR |
| `category` | text | PUBLISH / VALIDATE / CONFIG / REALTIME / DB / MOBILE |
| `message` | text | Log message |
| `data` | jsonb | Additional data |
| `customer_id` | uuid | — |
| `user_id` | uuid | — |
| `session_id` | text | Browser session |

---

## **8.7 `config_templates`**

Pre-built and custom configuration templates.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text (PK) | Template ID |
| `name` | text | Display name |
| `description` | text | — |
| `category` | text | minimal / standard / full / role-specific |
| `target_roles` | text[] | Which roles this template is for |
| `preview_image_url` | text | Preview image |
| `template_data` | jsonb | Full template configuration |
| `is_system` | boolean | System template vs custom |
| `created_by` | uuid | — |
| `created_at` | timestamptz | — |

---

# 📦 8.5. Localized Content Tables

These tables store actual content data with multi-language support. Content is stored with language-specific columns (e.g., `title_en`, `title_hi`) for efficient querying.

## **8.1 `subjects`**

Subject/course definitions with localized names.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `code` | text | Subject code (e.g., "MATH", "PHY") |
| `title_en` | text | English title |
| `title_hi` | text | Hindi title |
| `description_en` | text | English description |
| `description_hi` | text | Hindi description |
| `icon` | text | Icon name |
| `color` | text | Subject color (hex) |
| `order_index` | int | Display order |
| `enabled` | boolean | — |
| `created_at` | timestamptz | — |

**Unique:** `(customer_id, code)`

---

## **8.2 `classes`**

Class/schedule entries with localized content.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `subject_id` | uuid (FK → subjects.id) | — |
| `teacher_id` | uuid (FK → user_profiles.id) | — |
| `title_en` | text | English title |
| `title_hi` | text | Hindi title |
| `description_en` | text | English description |
| `description_hi` | text | Hindi description |
| `class_type` | text | lecture / lab / tutorial / live |
| `room` | text | Room/location |
| `start_time` | timestamptz | — |
| `end_time` | timestamptz | — |
| `is_live` | boolean | Live class flag |
| `meeting_url` | text | For live classes |
| `created_at` | timestamptz | — |

---

## **8.3 `assignments`**

Assignments with localized titles and instructions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `subject_id` | uuid (FK → subjects.id) | — |
| `teacher_id` | uuid (FK → user_profiles.id) | — |
| `title_en` | text | English title |
| `title_hi` | text | Hindi title |
| `instructions_en` | text | English instructions |
| `instructions_hi` | text | Hindi instructions |
| `assignment_type` | text | homework / project / practice |
| `due_date` | timestamptz | — |
| `max_score` | int | Maximum points |
| `attachments` | jsonb | File attachments |
| `status` | text | draft / published / closed |
| `created_at` | timestamptz | — |

---

## **8.4 `tests`**

Tests/quizzes with localized content.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `subject_id` | uuid (FK → subjects.id) | — |
| `title_en` | text | English title |
| `title_hi` | text | Hindi title |
| `description_en` | text | English description |
| `description_hi` | text | Hindi description |
| `test_type` | text | quiz / unit_test / mock / final |
| `duration_minutes` | int | Test duration |
| `max_score` | int | Maximum points |
| `scheduled_at` | timestamptz | — |
| `status` | text | upcoming / live / completed |
| `created_at` | timestamptz | — |

---

## **8.5 `doubts`**

Student doubts/questions with localized content.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `student_id` | uuid (FK → user_profiles.id) | — |
| `subject_id` | uuid (FK → subjects.id) | — |
| `question_text` | text | Question (in user's language) |
| `question_language` | text | en / hi |
| `status` | text | pending / answered / resolved |
| `priority` | text | low / medium / high |
| `attachments` | jsonb | Images/files |
| `created_at` | timestamptz | — |

---

## **8.6 `doubt_responses`**

Responses to doubts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `doubt_id` | uuid (FK → doubts.id) | — |
| `responder_id` | uuid (FK → user_profiles.id) | — |
| `response_text` | text | Response content |
| `response_language` | text | en / hi |
| `is_ai_response` | boolean | AI-generated flag |
| `created_at` | timestamptz | — |

---

## **8.7 `quick_actions`**

Configurable quick action buttons with localized labels.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | — |
| `customer_id` | uuid (FK) | — |
| `role` | text | student / teacher / parent |
| `action_id` | text | Unique action identifier |
| `label_en` | text | English label |
| `label_hi` | text | Hindi label |
| `icon` | text | Icon name |
| `color` | text | Action color |
| `route` | text | Navigation route |
| `order_index` | int | Display order |
| `enabled` | boolean | — |
| `requires_online` | boolean | — |
| `created_at` | timestamptz | — |

**Unique:** `(customer_id, role, action_id)`

---

## **8.8 Localization Helper Function**

```sql
-- Get localized field based on language
CREATE OR REPLACE FUNCTION get_localized(
  field_en text,
  field_hi text,
  lang text DEFAULT 'en'
) RETURNS text AS $$
BEGIN
  IF lang = 'hi' AND field_hi IS NOT NULL AND field_hi != '' THEN
    RETURN field_hi;
  END IF;
  RETURN COALESCE(field_en, '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Usage in queries:
-- SELECT get_localized(title_en, title_hi, 'hi') as title FROM subjects;
```

---

## **8.9 Sample Data with Localization**

```sql
-- Insert subjects with both languages
INSERT INTO subjects (customer_id, code, title_en, title_hi, icon, color) VALUES
  ('cust-123', 'MATH', 'Mathematics', 'गणित', 'calculator', '#6366F1'),
  ('cust-123', 'PHY', 'Physics', 'भौतिकी', 'atom', '#10B981'),
  ('cust-123', 'CHEM', 'Chemistry', 'रसायन विज्ञान', 'flask', '#F59E0B'),
  ('cust-123', 'ENG', 'English', 'अंग्रेज़ी', 'book', '#EC4899'),
  ('cust-123', 'BIO', 'Biology', 'जीव विज्ञान', 'leaf', '#22C55E');

-- Insert quick actions with both languages
INSERT INTO quick_actions (customer_id, role, action_id, label_en, label_hi, icon, color, route, order_index) VALUES
  ('cust-123', 'student', 'ask_doubt', 'Ask Doubt', 'प्रश्न पूछें', 'help-circle', '#6366F1', 'ask-doubt', 1),
  ('cust-123', 'student', 'view_schedule', 'Schedule', 'समय सारणी', 'calendar', '#10B981', 'schedule', 2),
  ('cust-123', 'student', 'study_material', 'Study', 'अध्ययन', 'book-open', '#F59E0B', 'study-hub', 3),
  ('cust-123', 'student', 'live_class', 'Live Class', 'लाइव क्लास', 'video', '#EF4444', 'live-classes', 4);
```

---

# 📦 9. RPC Functions

## **9.1 Config Loading Functions**

```sql
-- Get complete customer config (includes branding)
get_customer_config(customer_id, role) → CustomerConfig

-- Get enabled features
get_enabled_features(customer_id) → FeatureConfig[]

-- Get navigation tabs
get_navigation_tabs(customer_id, role) → TabConfig[]

-- Get screen layout (widgets for a screen)
get_screen_layout(customer_id, role, screen_id) → ScreenWidgetConfig[]

-- Get customer theme
get_customer_theme(customer_id) → ThemeConfig

-- Get customer branding (NEW)
get_customer_branding(customer_id) → BrandingConfig
```

## **9.2 Permission Functions**

```sql
-- Get all permissions for user (resolved)
get_user_permissions(user_id) → string[]

-- Check single permission
check_user_permission(user_id, permission_code) → boolean

-- Grant/revoke permission
grant_user_permission(target_user_id, permission_code, reason)
revoke_user_permission(target_user_id, permission_code, reason)
```

## **9.3 Safety Functions**

```sql
-- Emergency disable feature
emergency_disable_feature(customer_id, feature_id, reason)

-- Validate config before save
validate_customer_config(customer_id, config) → ValidationResult
```

---

# 🧩 Entity Relationship Summary

```
customers
  ├── user_profiles
  ├── customer_features
  ├── navigation_tabs
  ├── navigation_screens
  ├── screen_layouts          ← Universal widget placement
  ├── customer_branding       ← NEW: White-label/personalization
  ├── customer_themes
  ├── customer_role_permissions
  ├── config_audit_log
  └── config_change_events

widget_definitions (global)    ← Widget metadata
screen_definitions (global)    ← Screen metadata

roles
  └── role_permissions

user_profiles
  └── user_permissions (overrides)
```

---

# 🎯 Key Changes from Previous Schema

| Before | After |
|--------|-------|
| `dashboard_layouts` (dashboard only) | `screen_layouts` (any screen) |
| `dashboard_widgets` (fixed list) | `widget_definitions` (extensible) |
| Fixed 5 tabs | Dynamic 1-10 tabs via `navigation_tabs` |
| Widgets tied to dashboard | Widgets can appear anywhere |
| — | `screen_definitions` for screen metadata |

---

# ✅ Final Notes

- Screen IDs must match `screen_definitions`
- Widget IDs must match `widget_definitions` and `widgetRegistry.ts`
- Feature IDs must match `featureRegistry.ts`
- Permission codes must match `PERMISSIONS_RBAC_SPEC.md`
- This schema supports:
  - Multi-tenant
  - **Universal widgets** (any widget, any screen)
  - **Dynamic tabs** (1-10 per customer)
  - Dynamic navigation
  - Dynamic themes
  - RBAC + overrides
  - Live config reload

```
End of DB_SCHEMA_REFERENCE.md
```
