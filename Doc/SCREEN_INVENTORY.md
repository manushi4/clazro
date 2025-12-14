# 🗂️ SCREEN_INVENTORY.md
### Complete Screen Registry for Universal Widget Architecture

This document defines all screens in the platform.

**Key Principle:** Most screens are now **widget containers** (DynamicScreen). They render widgets from `screen_layouts` config. Only detail/action screens have fixed layouts.

---

## 1. 🎯 Screen Types

| Type | Description | Widget-Based? |
|------|-------------|---------------|
| Dashboard | Role-specific home screen | ✅ Yes |
| Hub | Feature entry point | ✅ Yes |
| List | Collection view | ✅ Partial |
| Detail | Single item view | ❌ No |
| Action | Form/submission screen | ❌ No |
| Settings | Configuration screen | ❌ No |

---

## 2. 📱 Widget-Based Screens (DynamicScreen)

These screens render widgets from `screen_layouts` config.

### 2.1 Dashboard Screens

| Screen ID | Name | Roles | Default Widgets |
|-----------|------|-------|-----------------|
| `student-home` | Student Dashboard | student | hero.greeting, schedule.today, actions.quick, assignments.pending, doubts.inbox, progress.snapshot |
| `teacher-home` | Teacher Dashboard | teacher | hero.greeting, schedule.today, analytics.class-performance, doubts.to-answer, assignments.to-grade |
| `parent-home` | Parent Dashboard | parent | child.selector, child.progress, child.schedule, child.attendance |
| `admin-home` | Admin Dashboard | admin | admin.stats, admin.users, admin.alerts, admin.config |

### 2.2 Hub Screens

| Screen ID | Name | Roles | Default Widgets |
|-----------|------|-------|-----------------|
| `study-hub` | Study Hub | student | library.recent, library.favorites, library.subjects, assignments.pending, tests.upcoming |
| `schedule-screen` | Schedule | all | schedule.today, schedule.weekly |
| `doubts-home` | Doubts Hub | student, teacher | doubts.inbox, doubts.quick-ask, doubts.explore |
| `progress-home` | Progress Hub | student | progress.snapshot, progress.subject-wise, progress.streak, progress.goals |
| `peers-home` | Peers Hub | student | peers.groups, peers.leaderboard, peers.suggestions |
| `profile-home` | Profile Hub | all | profile.summary, profile.stats, notifications.recent |
| `tests-home` | Tests Hub | student | tests.upcoming, tests.results, tests.practice |
| `assignments-home` | Assignments Hub | student | assignments.pending, assignments.submitted, assignments.overdue |

### 2.3 Teacher Hub Screens

| Screen ID | Name | Roles | Default Widgets |
|-----------|------|-------|-----------------|
| `teacher-classes` | Classes Hub | teacher | class.roster, analytics.attendance, schedule.today |
| `teacher-content` | Content Hub | teacher | content.upload, content.manage |
| `teacher-analytics` | Analytics Hub | teacher | analytics.class-performance, analytics.student-progress |

### 2.4 Parent Hub Screens

| Screen ID | Name | Roles | Default Widgets |
|-----------|------|-------|-----------------|
| `parent-progress` | Child Progress | parent | child.progress, child.attendance |
| `parent-communication` | Communication | parent | parent.messages, feed.announcements |

---

## 3. 📄 Detail Screens (Fixed Layout)

These screens have fixed layouts (not widget-based).

### 3.1 Study Detail Screens

| Screen ID | Name | Roles | Purpose |
|-----------|------|-------|---------|
| `resource-viewer` | Resource Viewer | student, teacher | View PDF/video |
| `chapter-detail` | Chapter Detail | student | Chapter content |
| `subject-detail` | Subject Detail | student | Subject overview |
| `playlist-detail` | Playlist Detail | student | Playlist content |

### 3.2 Assessment Detail Screens

| Screen ID | Name | Roles | Purpose |
|-----------|------|-------|---------|
| `assignment-detail` | Assignment Detail | student | View assignment |
| `assignment-submission` | Assignment Submission | student | Submit assignment |
| `test-detail` | Test Detail | student | Test info |
| `test-attempt` | Test Attempt | student | Take test |
| `test-review` | Test Review | student | Review answers |
| `test-result` | Test Result | student | View results |

### 3.3 Doubts Detail Screens

| Screen ID | Name | Roles | Purpose |
|-----------|------|-------|---------|
| `doubt-detail` | Doubt Detail | student, teacher | View doubt thread |
| `doubt-submission` | Doubt Submission | student | Submit doubt |
| `doubt-answer` | Answer Doubt | teacher | Answer doubt |

### 3.4 Schedule Detail Screens

| Screen ID | Name | Roles | Purpose |
|-----------|------|-------|---------|
| `class-detail` | Class Detail | all | Class info |
| `live-class` | Live Class | student, teacher | Join live class |
| `class-recording` | Class Recording | student | Watch recording |

### 3.5 Progress Detail Screens

| Screen ID | Name | Roles | Purpose |
|-----------|------|-------|---------|
| `subject-analytics` | Subject Analytics | student | Subject performance |
| `quest-detail` | Quest Detail | student | Quest info |
| `achievement-detail` | Achievement Detail | student | Badge info |

### 3.6 Social Detail Screens

| Screen ID | Name | Roles | Purpose |
|-----------|------|-------|---------|
| `peer-detail` | Peer Profile | student | View peer |
| `group-detail` | Group Detail | student | Study group |
| `group-chat` | Group Chat | student | Group messages |

### 3.7 Profile Detail Screens

| Screen ID | Name | Roles | Purpose |
|-----------|------|-------|---------|
| `edit-profile` | Edit Profile | all | Edit profile |
| `settings` | Settings | all | App settings |
| `notification-settings` | Notification Settings | all | Notification prefs |
| `help` | Help & Support | all | Help center |
| `legal` | Legal | all | Terms & privacy |


---

## 4. 🔧 Admin Screens (Fixed Layout)

| Screen ID | Name | Purpose |
|-----------|------|---------|
| `admin-customers` | Customer Management | Manage customers |
| `admin-customer-detail` | Customer Detail | Customer config |
| `admin-users` | User Management | Manage users |
| `admin-user-detail` | User Detail | User info |
| `admin-features` | Feature Toggles | Toggle features |
| `admin-navigation` | Navigation Builder | Build tabs |
| `admin-layouts` | Screen Layout Builder | Place widgets |
| `admin-themes` | Theme Editor | Edit themes |
| `admin-permissions` | Permission Management | Manage RBAC |
| `admin-audit` | Audit Logs | View changes |

---

## 5. 🧭 Screen → Tab Mapping

### 5.1 Student Tabs (Example: 5 Tabs)

| Tab ID | Root Screen | Accessible Screens |
|--------|-------------|-------------------|
| `home` | `student-home` | class-detail, live-class, notifications |
| `study` | `study-hub` | resource-viewer, chapter-detail, assignment-detail, test-attempt |
| `ask` | `doubts-home` | doubt-detail, doubt-submission, ai-tutor |
| `progress` | `progress-home` | subject-analytics, quest-detail |
| `profile` | `profile-home` | edit-profile, settings, peers-home |

### 5.2 Student Tabs (Example: 7 Tabs)

| Tab ID | Root Screen | Accessible Screens |
|--------|-------------|-------------------|
| `home` | `student-home` | class-detail, live-class |
| `schedule` | `schedule-screen` | class-detail |
| `study` | `study-hub` | resource-viewer, chapter-detail |
| `tests` | `tests-home` | test-detail, test-attempt, test-review |
| `ask` | `doubts-home` | doubt-detail, doubt-submission |
| `progress` | `progress-home` | subject-analytics |
| `profile` | `profile-home` | edit-profile, settings |

### 5.3 Teacher Tabs (Example: 5 Tabs)

| Tab ID | Root Screen | Accessible Screens |
|--------|-------------|-------------------|
| `home` | `teacher-home` | class-detail |
| `classes` | `teacher-classes` | live-class, attendance |
| `content` | `teacher-content` | resource-upload |
| `doubts` | `doubts-home` | doubt-detail, doubt-answer |
| `profile` | `profile-home` | settings |

### 5.4 Parent Tabs (Example: 4 Tabs)

| Tab ID | Root Screen | Accessible Screens |
|--------|-------------|-------------------|
| `home` | `parent-home` | child-detail |
| `progress` | `parent-progress` | subject-analytics |
| `contact` | `parent-communication` | message-teacher |
| `settings` | `profile-home` | settings |

---

## 6. 📊 Screen Count Summary

| Category | Widget-Based | Fixed Layout | Total |
|----------|--------------|--------------|-------|
| Dashboard | 4 | 0 | 4 |
| Hub | 12 | 0 | 12 |
| Study Detail | 0 | 4 | 4 |
| Assessment Detail | 0 | 6 | 6 |
| Doubts Detail | 0 | 3 | 3 |
| Schedule Detail | 0 | 3 | 3 |
| Progress Detail | 0 | 3 | 3 |
| Social Detail | 0 | 3 | 3 |
| Profile Detail | 0 | 5 | 5 |
| Admin | 0 | 10 | 10 |
| **Total** | **16** | **37** | **53** |

---

## 7. 🧩 Widget-Based vs Fixed Layout

### When to Use Widget-Based (DynamicScreen)
- Home/dashboard screens
- Hub/entry point screens
- Screens that vary by customer
- Screens with multiple independent sections

### When to Use Fixed Layout
- Detail screens (single item focus)
- Action screens (forms, submissions)
- Screens with complex interactions
- Screens with specific navigation flows

### ⚠️ Important: Fixed Screens Still Use Branding

Fixed layout ≠ Fixed appearance. All screens use:

| Element | Source | Applies To |
|---------|--------|------------|
| Colors | `customer_themes` | All screens |
| Logos | `customer_branding` | All screens |
| Feature names | `customer_branding.*_name` | All screens |
| Text overrides | `customer_branding.text_overrides` | All screens |
| Button labels | `text_overrides` or i18n | All screens |

**Result: 100% white-label on both dynamic AND fixed screens.**

---

## 8. 📝 Screen Definition Example

### Widget-Based Screen

```typescript
// Defined in screen_definitions table
{
  screenId: "student-home",
  name: "Student Dashboard",
  screenType: "dashboard",
  allowedRoles: ["student"],
  defaultLayout: "vertical",
  scrollable: true,
  pullToRefresh: true,
  headerVisible: true
}

// Widgets defined in screen_layouts table
// (per customer, per role)
```

### Fixed Layout Screen

```typescript
// Defined in screenRegistry.ts
{
  screenId: "assignment-detail",
  component: AssignmentDetailScreen,
  // Fixed layout, not configurable
}
```

---

## 9. 🔐 Screen Permissions

| Screen | Required Permission |
|--------|---------------------|
| `student-home` | `view_dashboard` |
| `study-hub` | `view_study_library` |
| `doubts-home` | `view_doubts` |
| `progress-home` | `view_own_progress` |
| `test-attempt` | `attempt_test` |
| `doubt-submission` | `ask_doubt` |
| `assignment-submission` | `submit_assignment` |
| `teacher-home` | `view_dashboard`, `view_class_analytics` |
| `admin-home` | `view_admin_dashboard` |

---

## 10. 🏁 Summary

This screen inventory provides:

✅ **16 widget-based screens** — Configurable per customer  
✅ **37 fixed layout screens** — Detail/action screens  
✅ **53 total screens** — Complete coverage  
✅ **Clear separation** — Widget-based vs fixed  
✅ **Permission mapping** — Every screen has access control  

**Key Principle:** Widget-based screens are configurable. Fixed screens have specific purposes that don't vary by customer.

```
End of SCREEN_INVENTORY.md
```
