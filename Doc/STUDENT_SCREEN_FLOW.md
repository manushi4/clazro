# Student App - Complete Screen Development Plan

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Screens | 64 |
| Built | 19 |
| To Build | 45 |
| Demo-Ready Priority (P1) | 12 screens |
| Core Features (P2) | 18 screens |
| Enhanced Features (P3) | 15 screens |

---

## 🎯 DEMO-READY PRIORITY ORDER

### PRIORITY 1: DEMO ESSENTIALS (Build First)
*These screens create a complete, impressive demo flow*

| Order | Screen | Type | Tab | Status | Demo Value |
|-------|--------|------|-----|--------|------------|
| 1 | test-detail | Fixed | study | ✅ Built | Show test info before attempt |
| 2 | test-attempt | Fixed | study | ✅ Built | Live test-taking experience |
| 3 | test-result | Fixed | study | ✅ Built | Score display after submit |
| 4 | test-review | Fixed | study | ✅ Built | Review answers with explanations |
| 5 | ai-tutor | Fixed | ask | ❌ To Build | AI chat - WOW factor |
| 6 | notifications | Dynamic | home | ❌ To Build | Real-time engagement |
| 7 | settings | Dynamic | profile | ❌ To Build | App customization |
| 8 | test-center | Dynamic | study | ❌ To Build | All tests hub |

### PRIORITY 2: CORE LEARNING FEATURES
*Essential for a functional learning app*

| Order | Screen | Type | Tab | Status | Purpose |
|-------|--------|------|-----|--------|---------|
| 9 | library | Dynamic | study | ❌ To Build | Content browsing |
| 10 | resource-viewer | Fixed | study | ❌ To Build | PDF/Video viewer |
| 11 | course-roadmap | Fixed | study | ❌ To Build | Learning path |
| 12 | chapter-detail | Fixed | study | ❌ To Build | Chapter content |
| 13 | downloads | Fixed | study | ❌ To Build | Offline content |
| 14 | task-hub | Dynamic | study | ❌ To Build | Task management |
| 15 | doubts-explore | Fixed | ask | ❌ To Build | Browse community doubts |
| 16 | leaderboard | Dynamic | progress | ❌ To Build | Competition |
| 17 | quests | Dynamic | progress | ❌ To Build | Gamification hub |
| 18 | quest-detail | Fixed | progress | ❌ To Build | Quest progress |

### PRIORITY 3: ENGAGEMENT & SOCIAL
*Enhances retention and engagement*

| Order | Screen | Type | Tab | Status | Purpose |
|-------|--------|------|-----|--------|---------|
| 19 | rewards-shop | Dynamic | progress | ❌ To Build | Redeem XP |
| 20 | reward-detail | Fixed | progress | ❌ To Build | Reward info |
| 21 | redemption-history | Fixed | progress | ❌ To Build | Past redemptions |
| 22 | streak-detail | Fixed | progress | ❌ To Build | Streak stats |
| 23 | weak-topic-detail | Fixed | progress | ❌ To Build | Improvement focus |
| 24 | peer-network | Dynamic | profile | ❌ To Build | Social hub |
| 25 | peer-detail | Fixed | profile | ❌ To Build | Peer profile |
| 26 | peer-chat | Fixed | profile | ❌ To Build | Messaging |
| 27 | study-group-detail | Fixed | profile | ❌ To Build | Group info |
| 28 | peer-matches | Fixed | profile | ❌ To Build | Find study partners |

### PRIORITY 4: AI & INSIGHTS
*Advanced AI-powered features*

| Order | Screen | Type | Tab | Status | Purpose |
|-------|--------|------|-----|--------|---------|
| 29 | ai-insights-home | Dynamic | - | ❌ To Build | AI recommendations hub |
| 30 | insight-detail | Fixed | - | ❌ To Build | Detailed insight |
| 31 | prediction-detail | Fixed | - | ❌ To Build | Performance prediction |
| 32 | recommendation-detail | Fixed | - | ❌ To Build | Study recommendation |

### PRIORITY 5: AUTOMATION & VOICE
*Nice-to-have features*

| Order | Screen | Type | Tab | Status | Purpose |
|-------|--------|------|-----|--------|---------|
| 33 | automations-settings | Fixed | - | ❌ To Build | Reminder settings |
| 34 | reminder-detail | Fixed | - | ❌ To Build | Reminder info |
| 35 | voice-practice | Fixed | study | ❌ To Build | Voice learning |
| 36 | voice-session | Fixed | study | ❌ To Build | Active voice session |

### PRIORITY 6: AUTH & ONBOARDING
*Required for production release*

| Order | Screen | Type | Tab | Status | Purpose |
|-------|--------|------|-----|--------|---------|
| 37 | splash | Fixed | - | ❌ To Build | App loading |
| 38 | login | Fixed | - | ❌ To Build | Authentication |
| 39 | signup | Fixed | - | ❌ To Build | Registration |
| 40 | onboarding | Fixed | - | ❌ To Build | First-time setup |
| 41 | legal | Fixed | - | ❌ To Build | Terms & Privacy |

---

## 📱 TAB 1: HOME (order_index: 1)

### Root: student-home (Dynamic) ✅ BUILT
**Purpose:** Dashboard with personalized overview of student's day

**Widgets Available:**
- HeroCard - Welcome message, streak, quick stats
- TodaySchedule - Today's classes
- QuickActions - Fast navigation buttons
- AssignmentsTests - Pending work
- DoubtsInbox - Recent doubts
- ProgressSnapshot - Learning progress
- ContinueLearning - Resume content
- LiveClass - Active/upcoming live sessions
- NotificationsPreview - Recent alerts

### Sub-screens

#### notifications (Dynamic) ❌ TO BUILD - P1
**Purpose:** All notifications hub with filtering

**Features:**
- Filter tabs: All | Classes | Tests | Doubts | System
- Mark all as read
- Notification grouping by date
- Swipe to dismiss
- Pull to refresh
- Badge count sync

**Widgets:** NotificationsList, NotificationFilters

**Navigation:** HeroCardWidget bell icon → notifications

---

#### notification-detail (Fixed) ✅ BUILT
**Purpose:** View full notification with actions

**Features:**
- Full notification content
- Related action buttons
- Mark as read/unread
- Delete option
- Deep link to related screen

---

#### schedule-screen (Dynamic) ✅ BUILT
**Purpose:** Full calendar view of classes and events

**Widgets:** WeekCalendar, DaySchedule, UpcomingEvents

---

#### class-detail (Fixed) ✅ BUILT
**Purpose:** Class information and join options

**Features:**
- Class title, subject, teacher
- Date/time with countdown
- Join button (if live)
- Class materials/resources
- Attendance status
- Recording link (if available)

---

#### live-class (Fixed) ✅ BUILT
**Purpose:** Live class video interface

**Features:**
- Video player (Jitsi/Zoom integration)
- Chat panel
- Raise hand
- Participants list
- Screen share view
- Leave class button

---

## 📚 TAB 2: STUDY (order_index: 2)

### Root: study-hub (Dynamic) ✅ BUILT
**Purpose:** Central hub for all learning content

**Widgets Available:**
- ContinueLearning - Resume where left off
- SubjectProgress - Subject-wise completion
- NotesSummary - Recent notes
- RecentViewed - History
- Downloads - Offline content
- VoicePractice - Speaking practice
- AssignmentsTests - Pending work

### Sub-screens

#### assignments-home (Dynamic) ✅ BUILT
**Purpose:** All assignments with filters

**Widgets:** AssignmentsList, AssignmentFilters, AssignmentStats

---

#### assignment-detail (Fixed) ✅ BUILT
**Purpose:** View and submit assignment

**Features:**
- Assignment title, description
- Due date with countdown
- Max score, rubric
- File attachments
- Submission form (text/file upload)
- Previous submissions
- Teacher feedback
- Grade display

---

#### test-center (Dynamic) ❌ TO BUILD - P1
**Purpose:** All tests hub with categories

**Features:**
- Filter: Upcoming | Completed | Practice
- Test type badges (Quiz/Unit/Final/Mock)
- Online vs Offline indicator
- Score display for completed
- Search tests
- Subject filter

**Widgets:** TestsList, TestFilters, TestStats, UpcomingTests

**Navigation:** AssignmentsTestsWidget "View All (Tests)" → test-center

---

#### test-detail (Fixed) ✅ BUILT
**Purpose:** Test information before attempting

**Features:**
- Test title, subject, type
- Duration, total questions, max score
- Instructions/rules
- Syllabus covered
- Previous attempts (if allowed)
- Start Test button (online)
- Scheduled date/time
- Attempt status indicator

**Navigation:** test-center tap → test-detail

---

#### test-attempt (Fixed) ✅ BUILT
**Purpose:** Live test-taking interface

**Features:**
- Timer countdown (prominent)
- Question navigation panel
- Question display (MCQ/subjective)
- Option selection with highlight
- Mark for review
- Clear response
- Previous/Next navigation
- Question status indicators (answered/unanswered/marked)
- Auto-save every 30 seconds
- Submit confirmation modal
- Warning on time running out
- Prevent back navigation

**Navigation:** test-detail "Start Test" → test-attempt

---

#### test-result (Fixed) ✅ BUILT
**Purpose:** Score display after submission

**Features:**
- Score/Total with percentage
- Pass/Fail indicator
- Time taken
- Correct/Incorrect/Unanswered breakdown
- Rank (if applicable)
- Review Answers button
- Retake button (if allowed)
- Share score option

**Navigation:** test-attempt submit → test-result

---

#### test-review (Fixed) ✅ BUILT
**Purpose:** Review answers with explanations

**Features:**
- Question-by-question review
- Your answer vs correct answer
- Explanation for each question
- Color coding (green=correct, red=wrong)
- Filter: All | Correct | Incorrect | Skipped
- Question navigation
- Report question option

**Navigation:** test-result "Review" → test-review

---

#### library (Dynamic) ❌ TO BUILD - P2
**Purpose:** Browse all learning content

**Features:**
- Subject tabs/filter
- Content type filter (Video/PDF/Notes/Quiz)
- Search with autocomplete
- Recently added section
- Bookmarked content
- Download for offline

**Widgets:** ContentGrid, ContentFilters, SearchBar, BookmarksList

**Navigation:** NotesSummaryWidget "View All" → library

---

#### resource-viewer (Fixed) ❌ TO BUILD - P2
**Purpose:** View PDF, video, or document

**Features:**
- PDF viewer with zoom/scroll
- Video player with controls
- Progress tracking (auto-save position)
- Bookmark current position
- Add notes/highlights
- Download option
- Share option
- Related content suggestions
- Mark as complete

**Navigation:** ContinueLearningWidget tap → resource-viewer

---

#### course-roadmap (Fixed) ❌ TO BUILD - P2
**Purpose:** Subject learning path visualization

**Features:**
- Chapter list with progress bars
- Locked/unlocked chapters
- Prerequisites shown
- Estimated time per chapter
- Completion percentage
- Current position indicator
- Jump to chapter

**Navigation:** SubjectProgressWidget tap subject → course-roadmap

---

#### chapter-detail (Fixed) ❌ TO BUILD - P2
**Purpose:** Chapter content and resources

**Features:**
- Chapter overview
- Learning objectives
- Content list (videos, notes, quizzes)
- Progress bar
- Start/Continue button
- Related practice questions
- Chapter quiz
- Mark complete

**Navigation:** course-roadmap tap chapter → chapter-detail

---

#### downloads (Fixed) ❌ TO BUILD - P2
**Purpose:** Manage offline content

**Features:**
- Downloaded content list
- Storage used indicator
- Delete individual/all
- Download queue
- Auto-download settings
- Content expiry info

**Navigation:** DownloadsSummaryWidget "View All" → downloads

---

#### task-hub (Dynamic) ❌ TO BUILD - P2
**Purpose:** All tasks and to-dos

**Features:**
- Task list with due dates
- Priority indicators
- Category filters
- Mark complete
- Add custom task
- Recurring tasks

**Widgets:** TasksList, TaskFilters, TaskCalendar

**Navigation:** TasksOverviewWidget "View All" → task-hub

---

#### voice-practice (Fixed) ❌ TO BUILD - P5
**Purpose:** Voice-based learning setup

**Features:**
- Language selection
- Topic selection
- Difficulty level
- Practice mode (conversation/pronunciation/reading)
- Microphone test
- Start session button

**Navigation:** VoicePracticeSummaryWidget "Start" → voice-practice

---

#### voice-session (Fixed) ❌ TO BUILD - P5
**Purpose:** Active voice practice session

**Features:**
- AI conversation interface
- Speech-to-text display
- Pronunciation feedback
- Score/accuracy meter
- Pause/resume
- End session
- Session summary

**Navigation:** voice-practice "Start Session" → voice-session

---

## 💬 TAB 3: ASK/DOUBTS (order_index: 3)

### Root: doubts-home (Dynamic) ✅ BUILT
**Purpose:** Doubt resolution hub with AI assistance

**Widgets Available:**
- DoubtsInbox - My doubts list
- AIRecommendations - AI-suggested content
- AITools - AI features access
- AITutorChat - Quick AI chat

### Sub-screens

#### doubt-detail (Fixed) ✅ BUILT
**Purpose:** View doubt with responses

**Features:**
- Question with attachments
- Subject/topic tags
- Status (pending/answered/resolved)
- Teacher/AI responses
- Follow-up questions
- Mark as resolved
- Rate response
- Similar doubts

---

#### doubt-submit (Fixed) ✅ BUILT
**Purpose:** Submit new doubt

**Features:**
- Subject/topic selector
- Question text input
- Image/file attachment
- Voice input option
- AI suggestion while typing
- Priority selection
- Submit button

---

#### ai-tutor (Fixed) ❌ TO BUILD - P1 ⭐ HIGH DEMO VALUE
**Purpose:** AI-powered tutoring chat

**Features:**
- Chat interface with AI
- Message history
- Voice input option
- Image upload for math problems
- LaTeX rendering for equations
- Code syntax highlighting
- Suggested follow-up questions
- Save conversation
- Share explanation
- Rate AI response
- Switch subject context
- Clear chat option

**Navigation:** AIToolsWidget tap → ai-tutor, QuickActionsWidget → ai-tutor

---

#### doubts-explore (Fixed) ❌ TO BUILD - P2
**Purpose:** Browse community doubts

**Features:**
- Subject filter
- Popular doubts
- Recent doubts
- Search doubts
- Upvote helpful answers
- Save for later
- Ask similar question

**Navigation:** DoubtsInboxWidget "Explore" → doubts-explore

---

## 📊 TAB 4: PROGRESS (order_index: 4)

### Root: progress-home (Dynamic) ✅ BUILT
**Purpose:** Learning analytics and gamification

**Widgets Available:**
- ProgressSnapshot - Overall progress
- SubjectWise - Per-subject stats
- Streak - Daily streak
- StatsGrid - Key metrics
- QuestsActive - Current quests
- PeersLeaderboard - Rankings
- Goals - Learning goals
- WeakAreas - Improvement areas
- AnalyticsSnapshot - Detailed stats
- StreakTracker - Streak calendar

### Sub-screens

#### subject-analytics (Fixed) ✅ BUILT
**Purpose:** Detailed subject performance

**Features:**
- Subject progress chart
- Chapter-wise breakdown
- Time spent analytics
- Test scores trend
- Weak topics list
- Improvement suggestions
- Compare with class average

---

#### global-analytics (Fixed) ✅ BUILT
**Purpose:** Overall learning analytics

**Features:**
- Total time spent
- Completion rates
- Score trends
- Activity heatmap
- Subject comparison
- Weekly/monthly reports
- Export data option

---

#### gamified-hub (Fixed) ✅ BUILT
**Purpose:** Gamification center

**Features:**
- XP balance
- Level progress
- Badges earned
- Achievements list
- Daily challenges
- Streak info
- Rewards preview

---

#### streak-detail (Fixed) ❌ TO BUILD - P3
**Purpose:** Streak statistics and calendar

**Features:**
- Current streak count
- Longest streak record
- Calendar view with activity
- Streak freeze info
- Daily goal settings
- Streak milestones
- Share streak

**Navigation:** StreakTrackerWidget "View Full" → streak-detail

---

#### leaderboard (Dynamic) ❌ TO BUILD - P2
**Purpose:** Competition rankings

**Features:**
- Global/Class/Friends tabs
- Weekly/Monthly/All-time filters
- Your rank highlight
- Top performers
- XP earned display
- Profile tap to view
- Challenge friend option

**Widgets:** LeaderboardList, LeaderboardFilters, TopThree

**Navigation:** PeersLeaderboardWidget "View Full" → leaderboard

---

#### quests (Dynamic) ❌ TO BUILD - P2
**Purpose:** All quests and challenges

**Features:**
- Active quests
- Completed quests
- Available quests
- Quest categories
- Rewards preview
- Time remaining
- Difficulty indicator

**Widgets:** QuestsList, QuestFilters, FeaturedQuest

**Navigation:** ActiveQuestsWidget "View All" → quests

---

#### quest-detail (Fixed) ❌ TO BUILD - P2
**Purpose:** Quest information and progress

**Features:**
- Quest title, description
- Progress bar
- Tasks checklist
- Rewards (XP, badges)
- Time remaining
- Start/Continue button
- Share quest

**Navigation:** ActiveQuestsWidget tap quest → quest-detail

---

#### rewards-shop (Dynamic) ❌ TO BUILD - P3
**Purpose:** Redeem XP for rewards

**Features:**
- Reward categories
- XP balance display
- Reward cards with cost
- Filter by category
- Sort by price/popularity
- Wishlist
- Redemption history link

**Widgets:** RewardGrid, RewardFilters, FeaturedRewards

**Navigation:** RewardShopPreviewWidget "Browse All" → rewards-shop

---

#### reward-detail (Fixed) ❌ TO BUILD - P3
**Purpose:** Reward information

**Features:**
- Reward image/preview
- Description
- XP cost
- Availability
- Terms & conditions
- Redeem button
- Add to wishlist

**Navigation:** RewardShopPreviewWidget tap reward → reward-detail

---

#### redemption-history (Fixed) ❌ TO BUILD - P3
**Purpose:** Past redemptions

**Features:**
- Redemption list
- Status (pending/delivered)
- Date redeemed
- XP spent
- Redemption code (if digital)
- Support contact

**Navigation:** XpBalanceWidget "View History" → redemption-history

---

#### weak-topic-detail (Fixed) ❌ TO BUILD - P3
**Purpose:** Focus on weak areas

**Features:**
- Topic name, subject
- Current mastery level
- Recommended resources
- Practice questions
- Improvement tips
- Progress tracking
- Set improvement goal

**Navigation:** WeakAreasWidget tap topic → weak-topic-detail

---

## 👤 TAB 5: PROFILE (order_index: 5)

### Root: profile-home (Dynamic) ✅ BUILT
**Purpose:** User profile and settings access

**Widgets Available:**
- ProfileCard - Avatar, name, class
- ProfileQuickLinks - Settings, help, etc.
- ProfileStats - Key stats
- ProfileAchievements - Badges
- ProfileActivity - Recent activity
- ConnectionsList - Friends
- StudyGroups - Groups

### Sub-screens

#### edit-profile (Fixed) ✅ BUILT
**Purpose:** Edit profile information

**Features:**
- Avatar upload/change
- Name edit
- Email (read-only)
- Phone number
- Date of birth
- Class/grade
- School name
- Bio/about
- Save changes

---

#### settings (Dynamic) ❌ TO BUILD - P1
**Purpose:** App settings and preferences

**Features:**
- Account settings
- Notification preferences
- Language selection
- Theme (light/dark/auto)
- Download settings
- Privacy settings
- Data usage
- Help & support
- About app
- Logout

**Widgets:** SettingsList, AccountInfo, AppInfo

**Navigation:** ProfileQuickLinksWidget "Settings" → settings

---

#### language-selection (Fixed) ✅ BUILT
**Purpose:** Change app language

**Features:**
- Language list
- Current selection
- Preview text
- Apply button

---

#### help-feedback (Fixed) ✅ BUILT
**Purpose:** Help center and feedback

**Features:**
- FAQ accordion
- Contact support
- Submit feedback
- Report bug
- Feature request
- App version info

---

#### peer-network (Dynamic) ❌ TO BUILD - P3
**Purpose:** Social connections hub

**Features:**
- Friends list
- Friend requests
- Suggested friends
- Search users
- Study groups
- Activity feed

**Widgets:** FriendsList, FriendRequests, SuggestedPeers, StudyGroups

**Navigation:** ConnectionsListWidget "View All" → peer-network

---

#### peer-detail (Fixed) ❌ TO BUILD - P3
**Purpose:** View peer profile

**Features:**
- Profile info
- Stats comparison
- Common subjects
- Mutual friends
- Add friend button
- Message button
- Block/report option

**Navigation:** ConnectionsListWidget tap peer → peer-detail

---

#### peer-chat (Fixed) ❌ TO BUILD - P3
**Purpose:** Direct messaging

**Features:**
- Chat interface
- Message history
- Send text/image
- Online status
- Typing indicator
- Read receipts
- Block user option

**Navigation:** ConnectionsListWidget "Message" → peer-chat

---

#### study-group-detail (Fixed) ❌ TO BUILD - P3
**Purpose:** Study group information

**Features:**
- Group name, description
- Member list
- Group chat
- Shared resources
- Group goals
- Leave group option
- Invite members

**Navigation:** StudyGroupsWidget tap group → study-group-detail

---

#### peer-matches (Fixed) ❌ TO BUILD - P3
**Purpose:** Find study partners

**Features:**
- AI-matched peers
- Common interests
- Study schedule match
- Subject overlap
- Connect button
- Filter preferences

**Navigation:** PeerMatchesWidget "Find More" → peer-matches

---

## 🤖 AI INSIGHTS SCREENS (Cross-tab)

#### ai-insights-home (Dynamic) ❌ TO BUILD - P4
**Purpose:** AI-powered learning insights hub

**Features:**
- Personalized recommendations
- Performance predictions
- Study plan suggestions
- Weak area alerts
- Optimal study times
- Content recommendations

**Widgets:** InsightsList, PredictionCards, RecommendationsList

**Navigation:** LearningInsightsWidget "View All" → ai-insights-home

---

#### insight-detail (Fixed) ❌ TO BUILD - P4
**Purpose:** Detailed AI insight

**Features:**
- Insight explanation
- Data visualization
- Action items
- Related resources
- Dismiss/save option

**Navigation:** LearningInsightsWidget tap → insight-detail

---

#### prediction-detail (Fixed) ❌ TO BUILD - P4
**Purpose:** Performance prediction details

**Features:**
- Predicted score/outcome
- Confidence level
- Contributing factors
- Improvement suggestions
- Historical accuracy

**Navigation:** PerformancePredictionsWidget tap → prediction-detail

---

#### recommendation-detail (Fixed) ❌ TO BUILD - P4
**Purpose:** Study recommendation details

**Features:**
- Recommendation reason
- Suggested content
- Expected benefit
- Time estimate
- Start now button

**Navigation:** StudyRecommendationsWidget tap → recommendation-detail

---

## ⚙️ AUTOMATION SCREENS

#### automations-settings (Fixed) ❌ TO BUILD - P5
**Purpose:** Manage automated reminders

**Features:**
- Reminder list
- Enable/disable toggles
- Add new reminder
- Edit reminder
- Delete reminder
- Smart reminder settings

**Navigation:** RemindersWidget "Manage" → automations-settings

---

#### reminder-detail (Fixed) ❌ TO BUILD - P5
**Purpose:** Reminder configuration

**Features:**
- Reminder title
- Trigger time/condition
- Repeat settings
- Notification type
- Enable/disable
- Delete option

**Navigation:** RemindersWidget tap → reminder-detail

---

## 🔐 AUTH & ONBOARDING SCREENS

#### splash (Fixed) ❌ TO BUILD - P6
**Purpose:** App loading screen

**Features:**
- App logo animation
- Loading indicator
- Version number
- Auto-navigate to login/home

---

#### login (Fixed) ❌ TO BUILD - P6
**Purpose:** User authentication

**Features:**
- Email/phone input
- Password input
- Show/hide password
- Remember me
- Forgot password link
- Login button
- Social login (Google)
- Sign up link
- Error messages

---

#### signup (Fixed) ❌ TO BUILD - P6
**Purpose:** New user registration

**Features:**
- Name input
- Email input
- Phone input
- Password input
- Confirm password
- Terms checkbox
- Sign up button
- Social signup
- Login link
- OTP verification

---

#### onboarding (Fixed) ❌ TO BUILD - P6
**Purpose:** First-time user setup

**Features:**
- Welcome slides
- Class/grade selection
- Subject selection
- Goal setting
- Notification permission
- Profile photo upload
- Skip option
- Complete setup

---

#### legal (Fixed) ❌ TO BUILD - P6
**Purpose:** Legal documents

**Features:**
- Terms of Service
- Privacy Policy
- Data Policy
- Cookie Policy
- Tab navigation
- Accept button (if required)

---

## 📋 DEVELOPMENT PHASES (Priority Order)

### PHASE 1: Demo-Ready Core ⭐ (4 screens, ~3 days)
*Complete test flow + AI tutor for impressive demo*

| # | Screen | Type | Effort | Status |
|---|--------|------|--------|--------|
| 1 | test-center | Dynamic | 0.5 day | ❌ |
| 2 | ai-tutor | Fixed | 1.5 days | ❌ |
| 3 | notifications | Dynamic | 0.5 day | ❌ |
| 4 | settings | Dynamic | 0.5 day | ❌ |

**Demo Flow After Phase 1:**
1. Home → See schedule, assignments, tests
2. Study → Browse tests → Take test → See result → Review answers
3. Ask → Chat with AI tutor
4. Progress → See analytics, gamification
5. Profile → Edit profile, change settings

---

### PHASE 2: Content & Learning (6 screens, ~4 days)
*Enable full content consumption*

| # | Screen | Type | Effort | Status |
|---|--------|------|--------|--------|
| 1 | library | Dynamic | 0.5 day | ❌ |
| 2 | resource-viewer | Fixed | 1 day | ❌ |
| 3 | course-roadmap | Fixed | 0.5 day | ❌ |
| 4 | chapter-detail | Fixed | 0.5 day | ❌ |
| 5 | downloads | Fixed | 0.5 day | ❌ |
| 6 | doubts-explore | Fixed | 0.5 day | ❌ |

---

### PHASE 3: Gamification (6 screens, ~3 days)
*Engagement and retention features*

| # | Screen | Type | Effort | Status |
|---|--------|------|--------|--------|
| 1 | leaderboard | Dynamic | 0.5 day | ❌ |
| 2 | quests | Dynamic | 0.5 day | ❌ |
| 3 | quest-detail | Fixed | 0.5 day | ❌ |
| 4 | task-hub | Dynamic | 0.5 day | ❌ |
| 5 | streak-detail | Fixed | 0.5 day | ❌ |
| 6 | weak-topic-detail | Fixed | 0.5 day | ❌ |

---

### PHASE 4: Rewards & Shop (3 screens, ~1.5 days)
*XP redemption system*

| # | Screen | Type | Effort | Status |
|---|--------|------|--------|--------|
| 1 | rewards-shop | Dynamic | 0.5 day | ❌ |
| 2 | reward-detail | Fixed | 0.5 day | ❌ |
| 3 | redemption-history | Fixed | 0.5 day | ❌ |

---

### PHASE 5: Social Features (5 screens, ~3 days)
*Peer network and collaboration*

| # | Screen | Type | Effort | Status |
|---|--------|------|--------|--------|
| 1 | peer-network | Dynamic | 0.5 day | ❌ |
| 2 | peer-detail | Fixed | 0.5 day | ❌ |
| 3 | peer-chat | Fixed | 1 day | ❌ |
| 4 | study-group-detail | Fixed | 0.5 day | ❌ |
| 5 | peer-matches | Fixed | 0.5 day | ❌ |

---

### PHASE 6: AI Insights (4 screens, ~2 days)
*Advanced AI features*

| # | Screen | Type | Effort | Status |
|---|--------|------|--------|--------|
| 1 | ai-insights-home | Dynamic | 0.5 day | ❌ |
| 2 | insight-detail | Fixed | 0.5 day | ❌ |
| 3 | prediction-detail | Fixed | 0.5 day | ❌ |
| 4 | recommendation-detail | Fixed | 0.5 day | ❌ |

---

### PHASE 7: Automation & Voice (4 screens, ~3 days)
*Nice-to-have features*

| # | Screen | Type | Effort | Status |
|---|--------|------|--------|--------|
| 1 | automations-settings | Fixed | 0.5 day | ❌ |
| 2 | reminder-detail | Fixed | 0.5 day | ❌ |
| 3 | voice-practice | Fixed | 1 day | ❌ |
| 4 | voice-session | Fixed | 1 day | ❌ |

---

### PHASE 8: Auth & Onboarding (5 screens, ~4 days)
*Production release requirements*

| # | Screen | Type | Effort | Status |
|---|--------|------|--------|--------|
| 1 | splash | Fixed | 0.5 day | ❌ |
| 2 | login | Fixed | 1 day | ❌ |
| 3 | signup | Fixed | 1 day | ❌ |
| 4 | onboarding | Fixed | 1 day | ❌ |
| 5 | legal | Fixed | 0.5 day | ❌ |

---

## ✅ BUILT SCREENS SUMMARY (19 total)

### Dynamic Screens (7)
| Screen | Tab | Widgets |
|--------|-----|---------|
| student-home | home | HeroCard, TodaySchedule, QuickActions, etc. |
| study-hub | study | ContinueLearning, SubjectProgress, etc. |
| doubts-home | ask | DoubtsInbox, AITools, AITutorChat |
| progress-home | progress | ProgressSnapshot, Streak, Leaderboard, etc. |
| profile-home | profile | ProfileCard, ProfileStats, etc. |
| assignments-home | study | AssignmentsList, AssignmentFilters |
| schedule-screen | home | WeekCalendar, DaySchedule |

### Fixed Screens (12)
| Screen | Purpose | Key Features |
|--------|---------|--------------|
| notification-detail | View notification | Full content, actions |
| class-detail | Class info | Join button, materials |
| live-class | Video class | Video player, chat |
| assignment-detail | Assignment view | Submit, feedback |
| test-detail | Test info | Instructions, start button |
| test-attempt | Take test | Timer, questions, submit |
| test-result | Score display | Score, pass/fail |
| test-review | Review answers | Correct/incorrect, explanations |
| doubt-detail | View doubt | Responses, follow-up |
| doubt-submit | Ask doubt | Form, attachments |
| subject-analytics | Subject stats | Charts, breakdown |
| global-analytics | Overall stats | Trends, reports |
| gamified-hub | Gamification | XP, badges, achievements |
| edit-profile | Edit profile | Form fields |
| language-selection | Language | Language list |
| help-feedback | Help | FAQ, contact |

---

## 🔗 NAVIGATION MAP

```
HOME TAB
├── student-home (Dynamic) ✅
│   ├── notifications (Dynamic) ❌ P1
│   │   └── notification-detail (Fixed) ✅
│   ├── schedule-screen (Dynamic) ✅
│   │   └── class-detail (Fixed) ✅
│   │       └── live-class (Fixed) ✅
│   └── [widgets navigate to other tabs]

STUDY TAB
├── study-hub (Dynamic) ✅
│   ├── assignments-home (Dynamic) ✅
│   │   └── assignment-detail (Fixed) ✅
│   ├── test-center (Dynamic) ❌ P1
│   │   └── test-detail (Fixed) ✅
│   │       └── test-attempt (Fixed) ✅
│   │           └── test-result (Fixed) ✅
│   │               └── test-review (Fixed) ✅
│   ├── library (Dynamic) ❌ P2
│   │   └── resource-viewer (Fixed) ❌ P2
│   ├── course-roadmap (Fixed) ❌ P2
│   │   └── chapter-detail (Fixed) ❌ P2
│   ├── downloads (Fixed) ❌ P2
│   ├── task-hub (Dynamic) ❌ P3
│   └── voice-practice (Fixed) ❌ P5
│       └── voice-session (Fixed) ❌ P5

ASK TAB
├── doubts-home (Dynamic) ✅
│   ├── doubt-detail (Fixed) ✅
│   ├── doubt-submit (Fixed) ✅
│   ├── ai-tutor (Fixed) ❌ P1 ⭐
│   └── doubts-explore (Fixed) ❌ P2

PROGRESS TAB
├── progress-home (Dynamic) ✅
│   ├── subject-analytics (Fixed) ✅
│   ├── global-analytics (Fixed) ✅
│   ├── gamified-hub (Fixed) ✅
│   ├── streak-detail (Fixed) ❌ P3
│   ├── leaderboard (Dynamic) ❌ P3
│   ├── quests (Dynamic) ❌ P3
│   │   └── quest-detail (Fixed) ❌ P3
│   ├── rewards-shop (Dynamic) ❌ P4
│   │   └── reward-detail (Fixed) ❌ P4
│   ├── redemption-history (Fixed) ❌ P4
│   ├── weak-topic-detail (Fixed) ❌ P3
│   └── ai-insights-home (Dynamic) ❌ P6
│       ├── insight-detail (Fixed) ❌ P6
│       ├── prediction-detail (Fixed) ❌ P6
│       └── recommendation-detail (Fixed) ❌ P6

PROFILE TAB
├── profile-home (Dynamic) ✅
│   ├── edit-profile (Fixed) ✅
│   ├── settings (Dynamic) ❌ P1
│   │   ├── language-selection (Fixed) ✅
│   │   ├── help-feedback (Fixed) ✅
│   │   └── legal (Fixed) ❌ P8
│   ├── peer-network (Dynamic) ❌ P5
│   │   ├── peer-detail (Fixed) ❌ P5
│   │   ├── peer-chat (Fixed) ❌ P5
│   │   └── peer-matches (Fixed) ❌ P5
│   └── study-group-detail (Fixed) ❌ P5

AUTH (No Tab)
├── splash (Fixed) ❌ P8
├── login (Fixed) ❌ P8
├── signup (Fixed) ❌ P8
└── onboarding (Fixed) ❌ P8
```

---

## 📊 EFFORT SUMMARY

| Phase | Screens | Days | Cumulative |
|-------|---------|------|------------|
| Phase 1: Demo-Ready | 4 | 3 | 3 days |
| Phase 2: Content | 6 | 4 | 7 days |
| Phase 3: Gamification | 6 | 3 | 10 days |
| Phase 4: Rewards | 3 | 1.5 | 11.5 days |
| Phase 5: Social | 5 | 3 | 14.5 days |
| Phase 6: AI Insights | 4 | 2 | 16.5 days |
| Phase 7: Automation | 4 | 3 | 19.5 days |
| Phase 8: Auth | 5 | 4 | 23.5 days |
| **TOTAL** | **37** | **~24 days** | |

---

## 🎯 DEMO CHECKLIST

### Minimum Viable Demo (After Phase 1)
- [x] 5 tab navigation works
- [x] Home dashboard with widgets
- [x] View schedule and classes
- [x] Join live class
- [x] View assignments
- [x] Complete test flow (detail → attempt → result → review)
- [ ] AI tutor chat
- [ ] Notifications list
- [ ] Settings screen
- [x] Progress analytics
- [x] Gamification hub
- [x] Profile editing

### Full Demo (After Phase 3)
- [ ] Content library browsing
- [ ] Resource viewer (PDF/Video)
- [ ] Course roadmap
- [ ] Leaderboard
- [ ] Quests system
- [ ] Task management

---

## 🔧 PER-SCREEN DEVELOPMENT CHECKLIST

### Dynamic Screen Checklist
1. [ ] Add to `screen_layouts` table with widget config
2. [ ] Register in `routeRegistry.ts` → DynamicScreen
3. [ ] Add to `COMMON_SCREENS` in `DynamicTabNavigator.tsx`
4. [ ] Add translations (en/hi)
5. [ ] Test widget rendering
6. [ ] Test offline mode

### Fixed Screen Checklist
1. [ ] Create `src/screens/<category>/<Name>Screen.tsx`
2. [ ] Create query hook if needed
3. [ ] Export from `src/screens/<category>/index.ts`
4. [ ] Register in `routeRegistry.ts`
5. [ ] Add to `COMMON_SCREENS` in `DynamicTabNavigator.tsx`
6. [ ] Add translations (en/hi)
7. [ ] Test 4 states: loading, error, empty, success
8. [ ] Test offline mode
9. [ ] Test navigation (forward/back)

---

## 📝 NOTES

1. **Test Flow Complete**: test-detail → test-attempt → test-result → test-review all built
2. **Widget Integration**: AssignmentsTestsWidget now shows score and Review for all attempted tests
3. **Priority Focus**: Phase 1 screens give maximum demo value with minimum effort
4. **Auth Last**: Auth screens built last since demo uses hardcoded user
5. **Offline First**: All screens should handle offline gracefully
