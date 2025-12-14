# 📚 Feature Taxonomy  
### Modular, Config-Driven Features with IDs

This document lists **all features** of the multi-role platform, with their:

- `featureId` (unique global identifier)
- Feature name
- Primary role(s)
- Associated widgets
- Description / purpose

**Key Principle:** Features are independent modules. Each feature has associated widgets that can be placed on ANY screen.

---

# 🎯 Feature → Widget Relationship

```
Feature = Logical capability (e.g., "Doubts")
Widgets = UI components for that feature (e.g., "doubts.inbox", "doubts.quick-ask")
```

A feature can have multiple widgets. Widgets can be placed on any screen.

---

# 🟦 Student Features

## 1. `home.dashboard`
- **Name:** Student Home Dashboard  
- **Roles:** student  
- **Widgets:**
  - `hero.greeting` — Welcome card with stats
  - `actions.quick` — Quick action buttons
  - `notifications.recent` — Recent notifications
  - `feed.announcements` — Announcements
- **Description:** Main entry point for students

---

## 2. `schedule.classes`
- **Name:** Class Schedule  
- **Roles:** student, teacher, parent  
- **Widgets:**
  - `schedule.today` — Today's classes
  - `schedule.weekly` — Weekly calendar
  - `schedule.upcoming-class` — Next class card
  - `schedule.live-now` — Currently live classes
- **Description:** View and manage class schedules

---

## 3. `study.library`
- **Name:** Study Library  
- **Roles:** student, teacher  
- **Widgets:**
  - `library.recent` — Recently accessed
  - `library.favorites` — Favorites
  - `library.subjects` — Subject grid
  - `library.continue` — Continue learning
  - `content.featured` — Featured content
- **Description:** Browse subjects, chapters, resources

---

## 4. `study.assignments`
- **Name:** Assignments  
- **Roles:** student, teacher  
- **Widgets:**
  - `assignments.pending` — Pending assignments
  - `assignments.submitted` — Submitted assignments
  - `assignments.overdue` — Overdue assignments
  - `assignments.to-grade` — To grade (teacher)
- **Description:** Assignment management and submission

---

## 5. `study.tests`
- **Name:** Tests & Practice  
- **Roles:** student, teacher  
- **Widgets:**
  - `tests.upcoming` — Upcoming tests
  - `tests.results` — Recent results
  - `tests.analytics` — Test analytics
  - `tests.practice` — Practice tests
- **Description:** Test-taking, results, analytics

---

## 6. `study.notes`
- **Name:** Notes & Highlights  
- **Roles:** student  
- **Widgets:**
  - `notes.recent` — Recent notes
  - `notes.bookmarks` — Bookmarked content
  - `notes.highlights` — Highlights
- **Description:** Personal notes and highlights

---

## 7. `ask.doubts`
- **Name:** Doubts / Ask  
- **Roles:** student, teacher  
- **Widgets:**
  - `doubts.inbox` — Doubts inbox
  - `doubts.quick-ask` — Quick ask form
  - `doubts.answered` — Recently answered
  - `doubts.to-answer` — To answer (teacher)
  - `doubts.explore` — Explore doubts
- **Description:** Ask and answer doubts

---

## 8. `ai.tutor`
- **Name:** AI Tutor  
- **Roles:** student  
- **Widgets:**
  - `ai.tutor-chat` — AI chat interface
  - `ai.recommendations` — AI recommendations
  - `ai.summary` — AI-generated summaries
  - `ai.practice` — AI practice problems
- **Description:** AI-powered personalized learning

---

## 9. `progress.analytics`
- **Name:** Progress & Analytics  
- **Roles:** student, teacher, parent  
- **Widgets:**
  - `progress.snapshot` — Progress overview
  - `progress.subject-wise` — Subject analytics
  - `progress.weak-areas` — Weak areas
  - `progress.goals` — Learning goals
  - `progress.trends` — Performance trends
- **Description:** Track performance and growth


---

## 10. `progress.gamification`
- **Name:** Gamification Hub  
- **Roles:** student  
- **Widgets:**
  - `progress.streak` — Streak & XP
  - `progress.badges` — Badges earned
  - `progress.quests` — Active quests
  - `peers.leaderboard` — Leaderboard
- **Description:** XP, streaks, quests, achievements

---

## 11. `peers.network`
- **Name:** Peer Learning Network  
- **Roles:** student  
- **Widgets:**
  - `peers.groups` — Study groups
  - `peers.suggestions` — Peer suggestions
  - `peers.leaderboard` — Leaderboard
  - `feed.class` — Class activity feed
- **Description:** Peer collaboration and social learning

---

# 🟩 Teacher Features

## 12. `teacher.dashboard`
- **Name:** Teacher Dashboard  
- **Roles:** teacher  
- **Widgets:**
  - `hero.greeting` — Welcome card
  - `schedule.today` — Today's classes
  - `analytics.class-performance` — Class performance
  - `doubts.to-answer` — Doubts to answer
  - `assignments.to-grade` — Assignments to grade
- **Description:** Teacher home with class overview

---

## 13. `teacher.liveClass`
- **Name:** Live & Virtual Classroom  
- **Roles:** teacher  
- **Widgets:**
  - `class.live-controls` — Live class controls
  - `class.roster` — Class roster
  - `analytics.attendance` — Attendance
  - `class.polls` — Live polls
- **Description:** Live class management tools

---

## 14. `teacher.content`
- **Name:** Content Management  
- **Roles:** teacher  
- **Widgets:**
  - `content.upload` — Upload resources
  - `content.manage` — Manage content
  - `content.analytics` — Content analytics
- **Description:** Upload and manage learning content

---

## 15. `teacher.analytics`
- **Name:** Class Analytics  
- **Roles:** teacher  
- **Widgets:**
  - `analytics.class-performance` — Class performance
  - `analytics.student-progress` — Student progress
  - `analytics.attendance` — Attendance trends
  - `analytics.test-results` — Test result analysis
- **Description:** Detailed class and student analytics

---

# 🟨 Parent Features

## 16. `parent.dashboard`
- **Name:** Parent Dashboard  
- **Roles:** parent  
- **Widgets:**
  - `child.selector` — Child selector
  - `child.progress` — Child progress
  - `child.schedule` — Child schedule
  - `child.attendance` — Attendance
  - `child.assignments` — Child assignments
- **Description:** Monitor child's learning

---

## 17. `parent.communication`
- **Name:** Parent Communication  
- **Roles:** parent  
- **Widgets:**
  - `parent.messages` — Messages with teachers
  - `feed.announcements` — School announcements
  - `parent.meetings` — Meeting scheduler
- **Description:** Communication with school/teachers

---

# 🟥 Admin Features

## 18. `admin.dashboard`
- **Name:** Admin Dashboard  
- **Roles:** admin  
- **Widgets:**
  - `admin.stats` — Platform statistics
  - `admin.users` — User overview
  - `admin.alerts` — System alerts
  - `admin.config` — Config status
- **Description:** Platform administration

---

## 19. `admin.users`
- **Name:** User Management  
- **Roles:** admin  
- **Widgets:**
  - `admin.user-list` — User list
  - `admin.user-stats` — User statistics
  - `admin.roles` — Role management
- **Description:** Manage users and roles

---

## 20. `admin.config`
- **Name:** Configuration Management  
- **Roles:** admin  
- **Widgets:**
  - `admin.features` — Feature toggles
  - `admin.navigation` — Navigation builder
  - `admin.themes` — Theme editor
  - `admin.layouts` — Screen layout editor
- **Description:** Platform configuration

---

# 🔧 Utility Features

## 21. `app.profile`
- **Name:** User Profile  
- **Roles:** all  
- **Widgets:**
  - `profile.summary` — Profile card
  - `profile.stats` — User stats
  - `profile.settings` — Settings shortcuts
- **Description:** User profile and settings

---

## 22. `app.notifications`
- **Name:** Notifications  
- **Roles:** all  
- **Widgets:**
  - `notifications.recent` — Recent notifications
  - `notifications.unread` — Unread count badge
- **Description:** Notification center

---

## 23. `app.help`
- **Name:** Help & Support  
- **Roles:** all  
- **Widgets:**
  - `help.faq` — FAQ widget
  - `help.contact` — Contact support
- **Description:** Help center and support

---

## 24. `app.settings`
- **Name:** App Settings  
- **Roles:** all  
- **Widgets:**
  - `settings.preferences` — User preferences
  - `settings.language` — Language selector
  - `settings.theme` — Theme toggle
- **Description:** App configuration

---

# 📊 Feature → Widget Summary

| Feature | Widget Count | Primary Widgets |
|---------|--------------|-----------------|
| home.dashboard | 4 | hero.greeting, actions.quick |
| schedule.classes | 4 | schedule.today, schedule.weekly |
| study.library | 5 | library.recent, library.subjects |
| study.assignments | 4 | assignments.pending, assignments.to-grade |
| study.tests | 4 | tests.upcoming, tests.results |
| study.notes | 3 | notes.recent, notes.bookmarks |
| ask.doubts | 5 | doubts.inbox, doubts.quick-ask |
| ai.tutor | 4 | ai.tutor-chat, ai.recommendations |
| progress.analytics | 5 | progress.snapshot, progress.subject-wise |
| progress.gamification | 4 | progress.streak, peers.leaderboard |
| peers.network | 4 | peers.groups, feed.class |
| teacher.dashboard | 5 | analytics.class-performance |
| teacher.liveClass | 4 | class.live-controls |
| parent.dashboard | 5 | child.progress, child.schedule |
| admin.dashboard | 4 | admin.stats, admin.alerts |

**Total: 24 features, 60+ widgets**

---

# ✔️ Why This Structure Matters

1. **Feature IDs** control what's enabled per customer
2. **Widget IDs** control what appears on each screen
3. **Decoupled:** Features can be enabled without showing all widgets
4. **Flexible:** Same widget can appear on multiple screens
5. **Scalable:** Add new widgets without changing features

**Key Principle:** Features define capabilities. Widgets are the UI building blocks. Config determines placement.

```
End of FEATURE_TAXONOMY.md
```
