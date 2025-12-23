# ALLEN COACHING - ADMIN DEMO IMPLEMENTATION PLAN

> **Purpose:** Complete implementation guide for admin dashboard widgets and screens for Allen Coaching Institute demo to high management.

> **Created:** December 2024

> **Status:** Planning Phase

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Gap Analysis](#gap-analysis)
4. [Coaching-Specific Widgets](#coaching-specific-widgets)
5. [Phase-wise Implementation](#phase-wise-implementation)
6. [Database Schema](#database-schema)
7. [E2E Testing Checklist](#e2e-testing-checklist)
8. [Demo Script](#demo-script)

---

## EXECUTIVE SUMMARY

### Current Coverage
- **Total Admin Widgets:** 46
- **Admin Screens:** 16
- **Demo Readiness:** 70%

### After Implementation
- **New Widgets:** 6 (coaching-specific)
- **New Screens:** 18 (9 Fixed + 9 Dynamic)
- **New Hooks:** 6
- **New Tables:** 5
- **Demo Readiness:** 95%

### Key Additions for Allen Demo
1. Student Fee Collection Dashboard
2. Teacher Payroll Management
3. Batch Performance Analytics
4. Attendance Overview
5. Admission Statistics
6. Fee Collection Trends

---

## CURRENT STATE ANALYSIS

### Existing Admin Widgets (46 Total)

#### Media Widgets (7)
| Widget | Status | Notes |
|--------|--------|-------|
| Media Banner | ✅ Ready | Display only |
| Media Banner Slot 1 | ✅ Ready | Display only |
| Media Banner Slot 2 | ✅ Ready | Display only |
| Media Banner Slot 3 | ✅ Ready | Display only |
| Hero Banner | ✅ Ready | Display only |
| Promo Carousel | ✅ Ready | Swipeable |
| Ad Banner | ✅ Ready | External links |

#### Profile Widgets (5)
| Widget | Status | Notes |
|--------|--------|-------|
| Profile Card | ✅ Ready | Needs alias |
| Quick Links | ✅ Ready | Various navigation |
| Admin Activity Log | ⚠️ Partial | Needs ActivityDetailScreen |
| Hero Greeting | ✅ Ready | Display only |
| Admin Hero Card | ⚠️ Partial | Needs NotificationsAdminScreen |

#### Notification Widgets (2)
| Widget | Status | Notes |
|--------|--------|-------|
| Recent Notifications | ⚠️ Partial | Needs NotificationsAdminScreen |
| System Alerts | ⚠️ Partial | Needs AlertDetailScreen, AlertsListScreen |

#### Action Widgets (5)
| Widget | Status | Notes |
|--------|--------|-------|
| Quick Actions | ✅ Ready | All navigations exist |
| Quick Actions (Alt) | ✅ Ready | Duplicate |
| Pending Approvals | ✅ Ready | UserDetail exists |
| Bulk Actions | ⚠️ Partial | Needs BulkImportScreen |
| Quick Create | ⚠️ Partial | Needs ClassCreateScreen, OrgDetailScreen |

#### Content Widgets (5)
| Widget | Status | Notes |
|--------|--------|-------|
| Content Statistics | ✅ Ready | ContentManagement exists |
| Content Library | ⚠️ Partial | Needs ContentDetailScreen |
| Content Categories | ✅ Ready | ContentManagement exists |
| Organization Tree | ⚠️ Partial | Needs OrgDetailScreen |
| Class List | ⚠️ Partial | Needs ClassManagementScreen |

#### Analytics Widgets (22)
| Widget | Status | Notes |
|--------|--------|-------|
| Admin Stats Grid | ⚠️ Partial | Needs SystemMonitoringScreen |
| System Health | ⚠️ Partial | Needs SystemMonitoringScreen |
| Admin Stats | ✅ Ready | Various exist |
| User Management | ✅ Ready | Screen exists |
| Config Status | ✅ Ready | SystemSettings exists |
| User Statistics | ✅ Ready | UsersManagement exists |
| User List | ✅ Ready | UserDetail exists |
| Role Distribution | ✅ Ready | UsersManagement exists |
| Recent Registrations | ✅ Ready | UserDetail exists |
| Revenue Summary | ✅ Ready | FinanceReports exists |
| Expense Summary | ✅ Ready | FinanceReports exists |
| Net Profit | ✅ Ready | FinanceReports exists |
| Recent Transactions | ⚠️ Partial | Needs TransactionDetailScreen |
| Pending Payments | ⚠️ Partial | Needs FinancePendingPaymentsScreen |
| Monthly Trend Chart | ✅ Ready | FinanceReports exists |
| Category Breakdown | ✅ Ready | FinanceReports exists |
| Collection Rate | ✅ Ready | FinanceReports exists |
| KPI Grid | ✅ Ready | AnalyticsDashboard exists |
| Trends | ✅ Ready | AnalyticsDashboard exists |
| Engagement | ✅ Ready | AnalyticsDashboard exists |
| Growth Metrics | ✅ Ready | AnalyticsDashboard exists |
| Period Comparisons | ✅ Ready | AnalyticsDashboard exists |

---

### Existing Admin Screens (16)

#### Authentication Screens (3) - Fixed
| Screen | File | Status |
|--------|------|--------|
| LoginAdminScreen | `src/screens/admin/LoginAdminScreen.tsx` | ✅ Complete |
| TwoFactorSetupScreen | `src/screens/admin/TwoFactorSetupScreen.tsx` | ✅ Complete |
| PasswordResetScreen | `src/screens/admin/PasswordResetScreen.tsx` | ✅ Complete |

#### Dashboard Screens (13) - Dynamic
| Screen | File | Status |
|--------|------|--------|
| AdminDashboardScreen | `src/screens/admin/AdminDashboardScreen.tsx` | ✅ Complete |
| UserManagementScreen | `src/screens/admin/UserManagementScreen.tsx` | ✅ Complete |
| UserDetailScreen | `src/screens/admin/UserDetailScreen.tsx` | ✅ Complete |
| UserCreateScreen | `src/screens/admin/UserCreateScreen.tsx` | ✅ Complete |
| UserImpersonationScreen | `src/screens/admin/UserImpersonationScreen.tsx` | ✅ Complete |
| FinanceDashboardScreen | `src/screens/admin/FinanceDashboardScreen.tsx` | ✅ Complete |
| FinanceReportsScreen | `src/screens/admin/FinanceReportsScreen.tsx` | ✅ Complete |
| AnalyticsDashboardScreen | `src/screens/admin/AnalyticsDashboardScreen.tsx` | ✅ Complete |
| ContentManagementScreen | `src/screens/admin/ContentManagementScreen.tsx` | ✅ Complete |
| OrgManagementScreen | `src/screens/admin/OrgManagementScreen.tsx` | ✅ Complete |
| SystemSettingsScreen | `src/screens/admin/SystemSettingsScreen.tsx` | ✅ Complete |
| AuditLogsScreen | `src/screens/admin/AuditLogsScreen.tsx` | ✅ Complete |
| AdminProfileScreen | `src/screens/admin/AdminProfileScreen.tsx` | ✅ Complete |

---

## GAP ANALYSIS

### Missing Route Aliases (5)
| Alias | Target Screen | Widget Using It |
|-------|---------------|-----------------|
| `profile-admin` | AdminProfileScreen | AdminHeroCard, ProfileCard |
| `admin-dashboard` | AdminDashboardScreen | Various |
| `admin-analytics` | AnalyticsDashboardScreen | Various |
| `admin-content` | ContentManagementScreen | Various |
| `admin-users` | UserManagementScreen | Various |

### Missing Screens for Current Widgets (14)

#### High Priority - Fixed Screens (5)
| Screen | Widgets Needing It |
|--------|-------------------|
| SystemMonitoringScreen | AdminStatsGrid, SystemHealth, AdminHeroCard |
| AlertDetailScreen | SystemAlerts |
| TransactionDetailScreen | RecentTransactions |
| ContentDetailScreen | ContentLibrary |
| OrgDetailScreen | OrganizationTree, QuickCreate |

#### High Priority - Dynamic Screens (6)
| Screen | Widgets Needing It |
|--------|-------------------|
| NotificationsAdminScreen | RecentNotifications, AdminHeroCard |
| AlertsListScreen | SystemAlerts |
| FinanceTransactionsScreen | RecentTransactions |
| FinancePendingPaymentsScreen | PendingPayments |
| ClassManagementScreen | ClassList |
| BulkImportScreen | BulkActions |

#### Medium Priority - Fixed Screens (2)
| Screen | Widgets Needing It |
|--------|-------------------|
| ClassCreateScreen | QuickCreate, ClassList |
| ActivityDetailScreen | AdminActivityLog, RecentActivity |

### Critical Missing for Coaching Demo (6 Widgets)
| Widget | Why Critical for Allen |
|--------|------------------------|
| Student Fees Dashboard | Fee collection is primary revenue |
| Fee Collection Trend | Financial planning visibility |
| Teacher Payroll | Faculty satisfaction tracking |
| Batch Performance | Core academic metric |
| Attendance Overview | Daily operations visibility |
| Admission Stats | Growth and conversion tracking |

---

## COACHING-SPECIFIC WIDGETS

### WIDGET 1: Student Fees Dashboard

#### Widget Details
| Property | Value |
|----------|-------|
| **ID** | `admin.student-fees-dashboard` |
| **Category** | `fees` |
| **File** | `src/components/widgets/admin/fees/StudentFeesDashboardWidget.tsx` |
| **Priority** | 🔴 Critical |

#### Functionality
- Total fee expected vs collected (current month/year)
- Collection rate percentage with trend indicator
- Pending amount with student count
- Overdue amount (>30 days) with defaulters count
- Today's collection amount
- Quick action: Send reminder to defaulters

#### UI Layout
```
┌─────────────────────────────────────────────┐
│ 💰 Fee Collection                   [View All]│
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ ₹45.2L   │  │ ₹12.8L   │  │ ₹3.2L    │  │
│  │ Collected │  │ Pending  │  │ Overdue  │  │
│  │ ↑ 12%    │  │ 234 studs │  │ 45 studs │  │
│  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────┤
│ Collection Rate: ████████░░ 78%             │
├─────────────────────────────────────────────┤
│ Today: ₹2.4L collected from 18 students     │
├─────────────────────────────────────────────┤
│ [📧 Send Reminder to Defaulters]            │
└─────────────────────────────────────────────┘
```

#### Configuration Options
```typescript
{
  showCollectionRate: boolean,    // default: true
  showTodayStats: boolean,        // default: true
  showOverdue: boolean,           // default: true
  overdueThresholdDays: number,   // default: 30
  enableReminder: boolean,        // default: true
  cardStyle: 'compact' | 'detailed', // default: 'detailed'
}
```

#### Hook
**File:** `src/hooks/queries/admin/useStudentFeesSummaryQuery.ts`

```typescript
type StudentFeesSummary = {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  collectionRate: number;
  pendingStudentCount: number;
  overdueStudentCount: number;
  todayCollection: number;
  todayStudentCount: number;
  trend: number; // vs last month percentage
  byProgram: Array<{ program: string; collected: number; pending: number }>;
};

export function useStudentFeesSummaryQuery(options?: {
  period?: 'month' | 'quarter' | 'year';
  programFilter?: string;
}) {
  // Implementation
}
```

#### Navigation Targets
| Action | Target Screen | Params |
|--------|---------------|--------|
| View All | `student-fees-list` | - |
| Pending tap | `student-fees-list` | `{ filter: 'pending' }` |
| Overdue tap | `student-fees-list` | `{ filter: 'overdue' }` |
| Student tap | `student-fee-detail` | `{ studentId }` |
| Send Reminder | `compose-message` | `{ mode: 'fee-reminder', filter: 'overdue' }` |

#### Screens Needed
| Screen | Type | File |
|--------|------|------|
| StudentFeesListScreen | Dynamic | `src/screens/admin/fees/StudentFeesListScreen.tsx` |
| StudentFeeDetailScreen | Fixed | `src/screens/admin/fees/StudentFeeDetailScreen.tsx` |

#### E2E Test Checklist
- [ ] Widget renders with loading state
- [ ] Collection stats display correctly
- [ ] Collection rate progress bar accurate
- [ ] Trend arrow shows correct direction
- [ ] Pending card tap → StudentFeesList (filtered pending)
- [ ] Overdue card tap → StudentFeesList (filtered overdue)
- [ ] View All → StudentFeesList (all)
- [ ] Today's collection updates correctly
- [ ] Send Reminder button → ComposeMessage with template
- [ ] Error state displays retry button
- [ ] Empty state shows appropriate message

---

### WIDGET 2: Fee Collection Trend

#### Widget Details
| Property | Value |
|----------|-------|
| **ID** | `admin.fee-collection-trend` |
| **Category** | `fees` |
| **File** | `src/components/widgets/admin/fees/FeeCollectionTrendWidget.tsx` |
| **Priority** | 🔴 Critical |

#### Functionality
- Monthly collection bar/line chart (last 6 months)
- Expected vs Actual comparison lines
- Month-over-month growth indicator
- Drill down to specific month details
- Period selector (This Year / Last Year / Custom)

#### UI Layout
```
┌─────────────────────────────────────────────┐
│ 📊 Collection Trend              [This Year]│
├─────────────────────────────────────────────┤
│     ━━ Expected    ━━ Actual                │
│                                             │
│  50L │      ╭─╮                             │
│  40L │    ╭─╯ ╰─╮  ╭─╮                      │
│  30L │  ╭─╯     ╰──╯ ╰─╮                    │
│  20L │╭─╯              ╰─╮                  │
│  10L ├─────────────────────                 │
│      Jul Aug Sep Oct Nov Dec                │
├─────────────────────────────────────────────┤
│ This Month: ₹45.2L (+12% vs last month)     │
├─────────────────────────────────────────────┤
│ Year Total: ₹4.2Cr (78% of target)          │
└─────────────────────────────────────────────┘
```

#### Configuration Options
```typescript
{
  chartType: 'line' | 'bar' | 'area',  // default: 'line'
  showExpected: boolean,                // default: true
  showGrowth: boolean,                  // default: true
  monthsToShow: 3 | 6 | 12,            // default: 6
  showYearTotal: boolean,               // default: true
}
```

#### Hook
**File:** `src/hooks/queries/admin/useFeeCollectionTrendQuery.ts`

```typescript
type FeeCollectionTrend = {
  monthlyData: Array<{
    month: string;
    year: number;
    expected: number;
    actual: number;
    collectionRate: number;
  }>;
  currentMonthGrowth: number;
  yearToDateTotal: number;
  yearTarget: number;
  yearProgress: number;
};

export function useFeeCollectionTrendQuery(options?: {
  months?: number;
  year?: number;
}) {
  // Implementation
}
```

#### Navigation Targets
| Action | Target Screen | Params |
|--------|---------------|--------|
| Month bar tap | `monthly-fee-report` | `{ month, year }` |
| View Report | `fee-reports` | - |
| Period change | - | Refetch with new period |

#### Screens Needed
| Screen | Type | File |
|--------|------|------|
| MonthlyFeeReportScreen | Fixed | `src/screens/admin/fees/MonthlyFeeReportScreen.tsx` |
| FeeReportsScreen | Dynamic | `src/screens/admin/fees/FeeReportsScreen.tsx` |

#### E2E Test Checklist
- [ ] Chart renders with 6 months data
- [ ] Expected line visible and accurate
- [ ] Actual line visible and accurate
- [ ] Month bar/point tap → MonthlyFeeReport
- [ ] Growth percentage calculated correctly
- [ ] Period selector changes data
- [ ] Year total displays correctly
- [ ] Legend toggles work
- [ ] Responsive on different sizes

---

### WIDGET 3: Teacher Payroll

#### Widget Details
| Property | Value |
|----------|-------|
| **ID** | `admin.teacher-payroll` |
| **Category** | `payroll` |
| **File** | `src/components/widgets/admin/payroll/TeacherPayrollWidget.tsx` |
| **Priority** | 🔴 Critical |

#### Functionality
- Total payroll amount (current month)
- Paid vs Pending breakdown with counts
- Teachers paid count / total count
- Upcoming payment due dates
- Quick action: Process pending salaries
- Alert for overdue payments

#### UI Layout
```
┌─────────────────────────────────────────────┐
│ 👨‍🏫 Teacher Payroll - December     [View All]│
├─────────────────────────────────────────────┤
│  Total Payroll: ₹18.5L                      │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ ✅ ₹12.2L    │  │ ⏳ ₹6.3L     │        │
│  │ Paid (42)    │  │ Pending (18) │        │
│  └──────────────┘  └──────────────┘        │
├─────────────────────────────────────────────┤
│ Progress: ████████████░░░░ 66% paid         │
├─────────────────────────────────────────────┤
│ 📅 Next Payment Due: 25 Dec (₹3.1L)        │
├─────────────────────────────────────────────┤
│ [💳 Process Pending Salaries]               │
└─────────────────────────────────────────────┘
```

#### Configuration Options
```typescript
{
  showProgress: boolean,          // default: true
  showNextDue: boolean,           // default: true
  showProcessButton: boolean,     // default: true
  alertOnOverdue: boolean,        // default: true
  overdueDays: number,            // default: 5
}
```

#### Hook
**File:** `src/hooks/queries/admin/useTeacherPayrollQuery.ts`

```typescript
type TeacherPayroll = {
  totalPayroll: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  totalTeachers: number;
  progressPercentage: number;
  nextPaymentDue: {
    date: string;
    amount: number;
    teacherCount: number;
  };
  overduePayments: Array<{
    teacherId: string;
    teacherName: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
  }>;
  pendingTeachers: Array<{
    id: string;
    name: string;
    amount: number;
    dueDate: string;
  }>;
};

export function useTeacherPayrollQuery(options?: {
  month?: string; // 'YYYY-MM'
}) {
  // Implementation
}
```

#### Navigation Targets
| Action | Target Screen | Params |
|--------|---------------|--------|
| View All | `teacher-payroll-list` | - |
| Paid tap | `teacher-payroll-list` | `{ filter: 'paid' }` |
| Pending tap | `teacher-payroll-list` | `{ filter: 'pending' }` |
| Teacher tap | `teacher-payroll-detail` | `{ teacherId, month }` |
| Process Salaries | `payroll-processing` | `{ month }` |
| Next Due tap | `teacher-payroll-list` | `{ filter: 'due-soon' }` |

#### Screens Needed
| Screen | Type | File |
|--------|------|------|
| TeacherPayrollListScreen | Dynamic | `src/screens/admin/payroll/TeacherPayrollListScreen.tsx` |
| TeacherPayrollDetailScreen | Fixed | `src/screens/admin/payroll/TeacherPayrollDetailScreen.tsx` |
| PayrollProcessingScreen | Fixed | `src/screens/admin/payroll/PayrollProcessingScreen.tsx` |

#### E2E Test Checklist
- [ ] Total payroll amount displays correctly
- [ ] Paid/Pending breakdown accurate
- [ ] Teacher counts match totals
- [ ] Progress bar reflects percentage
- [ ] Paid card tap → PayrollList (filtered paid)
- [ ] Pending card tap → PayrollList (filtered pending)
- [ ] Process Salaries → PayrollProcessing wizard
- [ ] Next payment due shows correctly
- [ ] Overdue alert appears when applicable
- [ ] View All → TeacherPayrollList

---

### WIDGET 4: Batch Performance

#### Widget Details
| Property | Value |
|----------|-------|
| **ID** | `admin.batch-performance` |
| **Category** | `academic` |
| **File** | `src/components/widgets/admin/academic/BatchPerformanceWidget.tsx` |
| **Priority** | 🔴 Critical |

#### Functionality
- Top 5 batches by average score
- Batch-wise pass percentage
- Student count per batch
- Comparison with previous term (trend)
- Color-coded performance indicators (green/yellow/red)
- Drill down to batch details

#### UI Layout
```
┌─────────────────────────────────────────────┐
│ 🏆 Batch Performance              [View All] │
├─────────────────────────────────────────────┤
│ 1. 🥇 JEE Advanced 2025-A                   │
│    ████████████████░░ 89% avg  │ 45 students│
│    ↑ 5% vs last term                        │
├─────────────────────────────────────────────┤
│ 2. 🥈 NEET 2025-B                           │
│    ███████████████░░░ 84% avg  │ 52 students│
│    ↑ 3% vs last term                        │
├─────────────────────────────────────────────┤
│ 3. 🥉 JEE Mains 2025-C                      │
│    ██████████████░░░░ 78% avg  │ 68 students│
│    ↓ 2% vs last term                        │
├─────────────────────────────────────────────┤
│ 4. Foundation XI-A    │ 76% avg │ 40 studs  │
│ 5. Foundation XI-B    │ 74% avg │ 38 studs  │
├─────────────────────────────────────────────┤
│ Overall Average: 80.2% (↑ 2.1% vs last term)│
└─────────────────────────────────────────────┘
```

#### Configuration Options
```typescript
{
  topN: number,                    // default: 5
  showTrend: boolean,              // default: true
  showStudentCount: boolean,       // default: true
  showOverallAvg: boolean,         // default: true
  showRankBadges: boolean,         // default: true
  colorCodePerformance: boolean,   // default: true
  performanceThresholds: {
    excellent: number,             // default: 85
    good: number,                  // default: 70
    poor: number,                  // default: 50
  }
}
```

#### Hook
**File:** `src/hooks/queries/admin/useBatchPerformanceQuery.ts`

```typescript
type BatchPerformance = {
  batches: Array<{
    id: string;
    name: string;
    program: string; // JEE, NEET, Foundation
    avgScore: number;
    passPercentage: number;
    studentCount: number;
    trend: number; // vs last term
    rank: number;
    testsCount: number;
    topScorer: {
      id: string;
      name: string;
      score: number;
    };
  }>;
  totalBatches: number;
  overallAvg: number;
  overallTrend: number;
};

export function useBatchPerformanceQuery(options?: {
  limit?: number;
  program?: string;
  term?: string;
}) {
  // Implementation
}
```

#### Navigation Targets
| Action | Target Screen | Params |
|--------|---------------|--------|
| View All | `batch-analytics` | - |
| Batch row tap | `batch-detail` | `{ batchId }` |
| Student count tap | `batch-students` | `{ batchId }` |
| Top scorer tap | `student-detail` | `{ studentId }` |
| Program filter | - | Refetch with filter |

#### Screens Needed
| Screen | Type | File |
|--------|------|------|
| BatchAnalyticsScreen | Dynamic | `src/screens/admin/academic/BatchAnalyticsScreen.tsx` |
| BatchDetailScreen | Fixed | `src/screens/admin/academic/BatchDetailScreen.tsx` |
| BatchStudentsScreen | Dynamic | `src/screens/admin/academic/BatchStudentsScreen.tsx` |

#### E2E Test Checklist
- [ ] Top 5 batches display correctly
- [ ] Batches sorted by average score
- [ ] Average scores accurate
- [ ] Progress bars reflect percentage
- [ ] Trend arrows show correct direction
- [ ] Rank badges display (🥇🥈🥉)
- [ ] Batch row tap → BatchDetail
- [ ] Student count tap → BatchStudents
- [ ] View All → BatchAnalytics
- [ ] Color coding works (green/yellow/red)
- [ ] Overall average calculated correctly

---

### WIDGET 5: Attendance Overview

#### Widget Details
| Property | Value |
|----------|-------|
| **ID** | `admin.attendance-overview` |
| **Category** | `academic` |
| **File** | `src/components/widgets/admin/academic/AttendanceOverviewWidget.tsx` |
| **Priority** | 🔴 Critical |

#### Functionality
- Today's student attendance percentage
- Today's teacher attendance percentage
- Absent count with names (top 5)
- Weekly trend mini-chart (sparkline)
- Low attendance alerts
- Quick action: Mark attendance / Send notification

#### UI Layout
```
┌─────────────────────────────────────────────┐
│ 📋 Today's Attendance             [Details] │
├─────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │    👨‍🎓 92%       │  │    👨‍🏫 98%       │  │
│  │   Students      │  │   Teachers      │  │
│  │  1840 / 2000    │  │   59 / 60       │  │
│  │  ↑ 2% vs avg    │  │  ↑ 1% vs avg    │  │
│  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────┤
│ ⚠️ Absent Today (160 students):             │
│ • Rahul Sharma (JEE-A) - Medical           │
│ • Priya Singh (NEET-B) - Not informed      │
│ • Amit Kumar (JEE-B) - Family emergency    │
│ • Sneha Patel (Found-A) - Sick             │
│ • +156 more...                    [View All]│
├─────────────────────────────────────────────┤
│ Weekly Trend: ▁▃▅▇█▇▅ (Avg: 91%)           │
├─────────────────────────────────────────────┤
│ 🔔 3 batches below 80% attendance           │
└─────────────────────────────────────────────┘
```

#### Configuration Options
```typescript
{
  showTeacherAttendance: boolean,  // default: true
  showAbsentList: boolean,         // default: true
  absentListLimit: number,         // default: 5
  showWeeklyTrend: boolean,        // default: true
  showAlerts: boolean,             // default: true
  lowAttendanceThreshold: number,  // default: 80
}
```

#### Hook
**File:** `src/hooks/queries/admin/useAttendanceOverviewQuery.ts`

```typescript
type AttendanceOverview = {
  date: string;
  studentAttendance: {
    present: number;
    absent: number;
    total: number;
    percentage: number;
    trend: number; // vs average
  };
  teacherAttendance: {
    present: number;
    absent: number;
    total: number;
    percentage: number;
    trend: number;
  };
  absentStudents: Array<{
    id: string;
    name: string;
    batch: string;
    reason: string | null;
  }>;
  absentTeachers: Array<{
    id: string;
    name: string;
    subject: string;
    reason: string | null;
  }>;
  weeklyTrend: Array<{
    date: string;
    percentage: number;
  }>;
  alerts: Array<{
    type: 'low_batch' | 'absent_teacher' | 'pattern';
    message: string;
    batchId?: string;
    count?: number;
  }>;
};

export function useAttendanceOverviewQuery(options?: {
  date?: string; // defaults to today
}) {
  // Implementation
}
```

#### Navigation Targets
| Action | Target Screen | Params |
|--------|---------------|--------|
| Details | `attendance-dashboard` | - |
| Students card tap | `attendance-dashboard` | `{ type: 'students' }` |
| Teachers card tap | `attendance-dashboard` | `{ type: 'teachers' }` |
| Absent student tap | `student-attendance-detail` | `{ studentId }` |
| View All absent | `absent-list` | `{ date: 'today' }` |
| Low batch alert tap | `batch-attendance` | `{ batchId }` |

#### Screens Needed
| Screen | Type | File |
|--------|------|------|
| AttendanceDashboardScreen | Dynamic | `src/screens/admin/academic/AttendanceDashboardScreen.tsx` |
| StudentAttendanceDetailScreen | Fixed | `src/screens/admin/academic/StudentAttendanceDetailScreen.tsx` |
| AbsentListScreen | Dynamic | `src/screens/admin/academic/AbsentListScreen.tsx` |
| BatchAttendanceScreen | Fixed | `src/screens/admin/academic/BatchAttendanceScreen.tsx` |

#### E2E Test Checklist
- [ ] Student percentage displays correctly
- [ ] Teacher percentage displays correctly
- [ ] Present/Total counts accurate
- [ ] Trend indicators show correctly
- [ ] Absent list shows top 5
- [ ] Absent student tap → StudentAttendanceDetail
- [ ] View All → AbsentList
- [ ] Details → AttendanceDashboard
- [ ] Weekly trend sparkline renders
- [ ] Low attendance alerts show
- [ ] Alert tap → relevant screen

---

### WIDGET 6: Admission Stats

#### Widget Details
| Property | Value |
|----------|-------|
| **ID** | `admin.admission-stats` |
| **Category** | `academic` |
| **File** | `src/components/widgets/admin/academic/AdmissionStatsWidget.tsx` |
| **Priority** | 🔴 Critical |

#### Functionality
- New admissions this month/year
- Inquiries vs Conversions funnel visualization
- Batch-wise/Program-wise admission breakdown
- Comparison with last year (YoY)
- Pending inquiries requiring follow-up
- Quick action: Add new inquiry

#### UI Layout
```
┌─────────────────────────────────────────────┐
│ 🎓 Admissions - December          [View All] │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   156    │  │   89     │  │   57%    │  │
│  │ Inquiries│  │ Admitted │  │ Conversion│  │
│  │ ↑ 23%   │  │ ↑ 18%   │  │ ↑ 5%     │  │
│  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────┤
│ By Program:                                 │
│ JEE      ████████████████ 45 (51%)         │
│ NEET     ████████████ 32 (36%)              │
│ Found.   ████ 12 (13%)                      │
├─────────────────────────────────────────────┤
│ ⏳ 23 inquiries pending follow-up   [View]  │
├─────────────────────────────────────────────┤
│ [➕ Add New Inquiry]                        │
└─────────────────────────────────────────────┘
```

#### Configuration Options
```typescript
{
  showConversionRate: boolean,     // default: true
  showProgramBreakdown: boolean,   // default: true
  showPendingFollowUp: boolean,    // default: true
  showAddButton: boolean,          // default: true
  showTrends: boolean,             // default: true
  programColors: Record<string, string>, // custom colors per program
}
```

#### Hook
**File:** `src/hooks/queries/admin/useAdmissionStatsQuery.ts`

```typescript
type AdmissionStats = {
  period: string; // 'December 2024'
  totalInquiries: number;
  totalAdmitted: number;
  conversionRate: number;
  inquiriesTrend: number; // vs same period last year
  admittedTrend: number;
  conversionTrend: number;
  byProgram: Array<{
    program: string;
    inquiries: number;
    admitted: number;
    percentage: number;
  }>;
  bySource: Array<{
    source: string; // walk-in, website, referral, ads
    count: number;
    percentage: number;
  }>;
  pendingFollowUps: number;
  recentAdmissions: Array<{
    id: string;
    studentName: string;
    program: string;
    admissionDate: string;
  }>;
  yearToDate: {
    inquiries: number;
    admitted: number;
    conversionRate: number;
  };
};

export function useAdmissionStatsQuery(options?: {
  period?: 'month' | 'quarter' | 'year';
  month?: string;
  year?: number;
}) {
  // Implementation
}
```

#### Navigation Targets
| Action | Target Screen | Params |
|--------|---------------|--------|
| View All | `admissions-dashboard` | - |
| Inquiries tap | `admissions-list` | `{ status: 'inquiry' }` |
| Admitted tap | `admissions-list` | `{ status: 'admitted' }` |
| Pending follow-up | `admissions-list` | `{ status: 'follow-up' }` |
| Program bar tap | `admissions-list` | `{ program }` |
| Add New Inquiry | `admission-create` | - |
| Recent admission tap | `admission-detail` | `{ admissionId }` |

#### Screens Needed
| Screen | Type | File |
|--------|------|------|
| AdmissionsDashboardScreen | Dynamic | `src/screens/admin/admissions/AdmissionsDashboardScreen.tsx` |
| AdmissionsListScreen | Dynamic | `src/screens/admin/admissions/AdmissionsListScreen.tsx` |
| AdmissionDetailScreen | Fixed | `src/screens/admin/admissions/AdmissionDetailScreen.tsx` |
| AdmissionCreateScreen | Fixed | `src/screens/admin/admissions/AdmissionCreateScreen.tsx` |

#### E2E Test Checklist
- [ ] Inquiry count displays correctly
- [ ] Admitted count displays correctly
- [ ] Conversion rate calculated correctly
- [ ] Trend arrows show correct direction
- [ ] Program breakdown bars render
- [ ] Program percentages accurate
- [ ] Inquiries tap → AdmissionsList (filtered)
- [ ] Admitted tap → AdmissionsList (filtered)
- [ ] Pending follow-up tap → AdmissionsList (filtered)
- [ ] Program bar tap → AdmissionsList (filtered by program)
- [ ] Add New Inquiry → AdmissionCreate
- [ ] View All → AdmissionsDashboard

---

## PHASE-WISE IMPLEMENTATION

### Overview

| Phase | Focus | Widgets | Screens | Est. Time |
|-------|-------|---------|---------|-----------|
| 0 | Route Aliases | 0 | 0 (5 aliases) | 30 min |
| 1 | Current Gaps | 0 | 14 | 1 day |
| 2 | Fees Module | 2 | 4 | 4-6 hrs |
| 3 | Payroll Module | 1 | 3 | 3-4 hrs |
| 4 | Academic Module | 2 | 7 | 6-8 hrs |
| 5 | Admissions Module | 1 | 4 | 4-5 hrs |

---

### PHASE 0: Route Aliases (30 min)

#### Task
Add route aliases to `src/navigation/routeRegistry.ts`

#### Changes
```typescript
// Add these aliases
"profile-admin": { screenId: "profile-admin", component: AdminProfileScreen },
"admin-dashboard": { screenId: "admin-dashboard", component: AdminDashboardScreen },
"admin-analytics": { screenId: "admin-analytics", component: AnalyticsDashboardScreen },
"admin-content": { screenId: "admin-content", component: ContentManagementScreen },
"admin-users": { screenId: "admin-users", component: UserManagementScreen },
```

#### E2E Checklist (Phase 0)
- [ ] profile-admin resolves to AdminProfileScreen
- [ ] admin-dashboard resolves to AdminDashboardScreen
- [ ] admin-analytics resolves to AnalyticsDashboardScreen
- [ ] admin-content resolves to ContentManagementScreen
- [ ] admin-users resolves to UserManagementScreen

#### Production Ready After Phase 0
- ✅ Media Widgets (7/7)
- ✅ Profile Card
- ✅ Quick Links
- ✅ Hero Greeting
- ✅ Quick Actions (all 5)
- ✅ Pending Approvals
- **Total: 15/46 widgets (33%)**

---

### PHASE 1: Current Widget Gaps (1 day)

#### Fixed Screens to Create (5)
| Screen | File | Widgets Unblocked |
|--------|------|-------------------|
| SystemMonitoringScreen | `admin/SystemMonitoringScreen.tsx` | AdminStatsGrid, SystemHealth |
| AlertDetailScreen | `admin/AlertDetailScreen.tsx` | SystemAlerts |
| TransactionDetailScreen | `admin/finance/TransactionDetailScreen.tsx` | RecentTransactions |
| ContentDetailScreen | `admin/content/ContentDetailScreen.tsx` | ContentLibrary |
| OrgDetailScreen | `admin/org/OrgDetailScreen.tsx` | OrganizationTree, QuickCreate |

#### Dynamic Screens to Create (6)
| Screen | File | Widgets Unblocked |
|--------|------|-------------------|
| NotificationsAdminScreen | `admin/NotificationsAdminScreen.tsx` | RecentNotifications, AdminHeroCard |
| AlertsListScreen | `admin/AlertsListScreen.tsx` | SystemAlerts |
| FinanceTransactionsScreen | `admin/finance/FinanceTransactionsScreen.tsx` | RecentTransactions |
| FinancePendingPaymentsScreen | `admin/finance/FinancePendingPaymentsScreen.tsx` | PendingPayments |
| ClassManagementScreen | `admin/org/ClassManagementScreen.tsx` | ClassList |
| BulkImportScreen | `admin/users/BulkImportScreen.tsx` | BulkActions |

#### Additional Fixed Screens (3)
| Screen | File | Widgets Unblocked |
|--------|------|-------------------|
| ClassCreateScreen | `admin/org/ClassCreateScreen.tsx` | QuickCreate, ClassList |
| ActivityDetailScreen | `admin/ActivityDetailScreen.tsx` | AdminActivityLog, RecentActivity |

#### E2E Checklist (Phase 1)
- [ ] SystemHealth tap → SystemMonitoring
- [ ] Alert tap → AlertDetail
- [ ] View All alerts → AlertsList
- [ ] Transaction tap → TransactionDetail
- [ ] View All transactions → FinanceTransactions
- [ ] Pending payment tap → works
- [ ] Content item tap → ContentDetail
- [ ] Org node tap → OrgDetail
- [ ] Class tap → ClassDetail (existing)
- [ ] View All classes → ClassManagement
- [ ] Add Class → ClassCreate
- [ ] Bulk Import → BulkImport wizard
- [ ] Notification tap → NotificationDetail
- [ ] View All notifications → NotificationsAdmin
- [ ] Activity tap → ActivityDetail

#### Production Ready After Phase 1
- ✅ All 46 existing widgets fully functional
- **Total: 46/46 widgets (100% of existing)**

---

### PHASE 2: Fees Module (4-6 hours)

#### Database Table
```sql
-- Run via Supabase MCP
CREATE TABLE IF NOT EXISTS student_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4', 'Annual'
  fee_type TEXT NOT NULL, -- 'tuition', 'exam', 'library', 'transport', 'hostel'
  fee_type_en TEXT NOT NULL,
  fee_type_hi TEXT,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_date TIMESTAMPTZ,
  payment_method TEXT, -- 'cash', 'upi', 'card', 'netbanking', 'cheque'
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_student_fees_customer ON student_fees(customer_id);
CREATE INDEX idx_student_fees_student ON student_fees(student_id);
CREATE INDEX idx_student_fees_status ON student_fees(status);
CREATE INDEX idx_student_fees_due_date ON student_fees(due_date);

-- RLS
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_fees_tenant_isolation" ON student_fees
  FOR ALL USING (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()::text)
  );
```

#### Hooks to Create
| Hook | File |
|------|------|
| useStudentFeesSummaryQuery | `src/hooks/queries/admin/useStudentFeesSummaryQuery.ts` |
| useFeeCollectionTrendQuery | `src/hooks/queries/admin/useFeeCollectionTrendQuery.ts` |
| useStudentFeesListQuery | `src/hooks/queries/admin/useStudentFeesListQuery.ts` |
| useStudentFeeDetailQuery | `src/hooks/queries/admin/useStudentFeeDetailQuery.ts` |

#### Widgets to Create
| Widget | File |
|--------|------|
| StudentFeesDashboardWidget | `src/components/widgets/admin/fees/StudentFeesDashboardWidget.tsx` |
| FeeCollectionTrendWidget | `src/components/widgets/admin/fees/FeeCollectionTrendWidget.tsx` |

#### Screens to Create
| Screen | Type | File |
|--------|------|------|
| StudentFeesListScreen | Dynamic | `src/screens/admin/fees/StudentFeesListScreen.tsx` |
| StudentFeeDetailScreen | Fixed | `src/screens/admin/fees/StudentFeeDetailScreen.tsx` |
| MonthlyFeeReportScreen | Fixed | `src/screens/admin/fees/MonthlyFeeReportScreen.tsx` |
| FeeReportsScreen | Dynamic | `src/screens/admin/fees/FeeReportsScreen.tsx` |

#### E2E Checklist (Phase 2)
- [ ] StudentFeesDashboard widget renders
- [ ] Collection stats accurate
- [ ] Collection rate progress bar works
- [ ] Pending tap → StudentFeesList (filtered)
- [ ] Overdue tap → StudentFeesList (filtered)
- [ ] Send Reminder works
- [ ] FeeCollectionTrend widget renders
- [ ] Chart shows 6 months
- [ ] Month tap → MonthlyFeeReport
- [ ] View Report → FeeReports

#### Production Ready After Phase 2
- ✅ Fee Collection Dashboard visible
- ✅ Fee trends visible
- **Can answer:** "How much fee is pending?"
- **Total: 48/52 widgets (92%)**

---

### PHASE 3: Payroll Module (3-4 hours)

#### Database Table
```sql
CREATE TABLE IF NOT EXISTS teacher_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES user_profiles(id),
  month TEXT NOT NULL, -- 'YYYY-MM' format
  base_salary DECIMAL(12,2) NOT NULL,
  allowances DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  bonuses DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL,
  payment_date DATE,
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, teacher_id, month)
);

-- Indexes
CREATE INDEX idx_teacher_payroll_customer ON teacher_payroll(customer_id);
CREATE INDEX idx_teacher_payroll_teacher ON teacher_payroll(teacher_id);
CREATE INDEX idx_teacher_payroll_month ON teacher_payroll(month);
CREATE INDEX idx_teacher_payroll_status ON teacher_payroll(status);

-- RLS
ALTER TABLE teacher_payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teacher_payroll_tenant_isolation" ON teacher_payroll
  FOR ALL USING (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()::text)
  );
```

#### Hooks to Create
| Hook | File |
|------|------|
| useTeacherPayrollQuery | `src/hooks/queries/admin/useTeacherPayrollQuery.ts` |
| useTeacherPayrollListQuery | `src/hooks/queries/admin/useTeacherPayrollListQuery.ts` |
| useTeacherPayrollDetailQuery | `src/hooks/queries/admin/useTeacherPayrollDetailQuery.ts` |
| useProcessPayrollMutation | `src/hooks/mutations/admin/useProcessPayrollMutation.ts` |

#### Widgets to Create
| Widget | File |
|--------|------|
| TeacherPayrollWidget | `src/components/widgets/admin/payroll/TeacherPayrollWidget.tsx` |

#### Screens to Create
| Screen | Type | File |
|--------|------|------|
| TeacherPayrollListScreen | Dynamic | `src/screens/admin/payroll/TeacherPayrollListScreen.tsx` |
| TeacherPayrollDetailScreen | Fixed | `src/screens/admin/payroll/TeacherPayrollDetailScreen.tsx` |
| PayrollProcessingScreen | Fixed | `src/screens/admin/payroll/PayrollProcessingScreen.tsx` |

#### E2E Checklist (Phase 3)
- [ ] TeacherPayroll widget renders
- [ ] Total payroll amount correct
- [ ] Paid/Pending breakdown accurate
- [ ] Progress bar reflects percentage
- [ ] Paid tap → PayrollList (filtered)
- [ ] Pending tap → PayrollList (filtered)
- [ ] Process Salaries → PayrollProcessing
- [ ] PayrollProcessing wizard works
- [ ] Individual payslip displays

#### Production Ready After Phase 3
- ✅ Teacher salary status visible
- **Can answer:** "Are teacher salaries paid?"
- **Total: 49/52 widgets (94%)**

---

### PHASE 4: Academic Module (6-8 hours)

#### Database Tables
```sql
-- Batch Performance (aggregated)
CREATE TABLE IF NOT EXISTS batch_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL,
  batch_name TEXT NOT NULL,
  program TEXT NOT NULL, -- 'JEE', 'NEET', 'Foundation'
  term TEXT NOT NULL,
  avg_score DECIMAL(5,2),
  pass_percentage DECIMAL(5,2),
  total_students INTEGER,
  tests_conducted INTEGER,
  top_scorer_id UUID REFERENCES user_profiles(id),
  top_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, batch_id, term)
);

-- Daily Attendance
CREATE TABLE IF NOT EXISTS daily_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'teacher')),
  batch_id UUID,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half-day', 'excused')),
  check_in_time TIME,
  check_out_time TIME,
  reason TEXT,
  marked_by UUID REFERENCES user_profiles(id),
  marked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, user_id, date)
);

-- Indexes
CREATE INDEX idx_batch_performance_customer ON batch_performance(customer_id);
CREATE INDEX idx_batch_performance_program ON batch_performance(program);
CREATE INDEX idx_daily_attendance_customer ON daily_attendance(customer_id);
CREATE INDEX idx_daily_attendance_date ON daily_attendance(date);
CREATE INDEX idx_daily_attendance_user_type ON daily_attendance(user_type);

-- RLS
ALTER TABLE batch_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batch_performance_tenant_isolation" ON batch_performance
  FOR ALL USING (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "daily_attendance_tenant_isolation" ON daily_attendance
  FOR ALL USING (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()::text)
  );
```

#### Hooks to Create
| Hook | File |
|------|------|
| useBatchPerformanceQuery | `src/hooks/queries/admin/useBatchPerformanceQuery.ts` |
| useBatchDetailQuery | `src/hooks/queries/admin/useBatchDetailQuery.ts` |
| useBatchStudentsQuery | `src/hooks/queries/admin/useBatchStudentsQuery.ts` |
| useAttendanceOverviewQuery | `src/hooks/queries/admin/useAttendanceOverviewQuery.ts` |
| useAbsentListQuery | `src/hooks/queries/admin/useAbsentListQuery.ts` |
| useStudentAttendanceQuery | `src/hooks/queries/admin/useStudentAttendanceQuery.ts` |

#### Widgets to Create
| Widget | File |
|--------|------|
| BatchPerformanceWidget | `src/components/widgets/admin/academic/BatchPerformanceWidget.tsx` |
| AttendanceOverviewWidget | `src/components/widgets/admin/academic/AttendanceOverviewWidget.tsx` |

#### Screens to Create
| Screen | Type | File |
|--------|------|------|
| BatchAnalyticsScreen | Dynamic | `src/screens/admin/academic/BatchAnalyticsScreen.tsx` |
| BatchDetailScreen | Fixed | `src/screens/admin/academic/BatchDetailScreen.tsx` |
| BatchStudentsScreen | Dynamic | `src/screens/admin/academic/BatchStudentsScreen.tsx` |
| AttendanceDashboardScreen | Dynamic | `src/screens/admin/academic/AttendanceDashboardScreen.tsx` |
| StudentAttendanceDetailScreen | Fixed | `src/screens/admin/academic/StudentAttendanceDetailScreen.tsx` |
| AbsentListScreen | Dynamic | `src/screens/admin/academic/AbsentListScreen.tsx` |
| BatchAttendanceScreen | Fixed | `src/screens/admin/academic/BatchAttendanceScreen.tsx` |

#### E2E Checklist (Phase 4)
- [ ] BatchPerformance widget renders
- [ ] Top 5 batches display correctly
- [ ] Scores and trends accurate
- [ ] Batch tap → BatchDetail
- [ ] View All → BatchAnalytics
- [ ] AttendanceOverview widget renders
- [ ] Student/Teacher percentages correct
- [ ] Absent list shows correctly
- [ ] Absent tap → StudentAttendanceDetail
- [ ] Weekly trend sparkline works
- [ ] Low attendance alerts show

#### Production Ready After Phase 4
- ✅ Batch performance visible
- ✅ Attendance dashboard visible
- **Can answer:** "Which batch is performing best?" & "Today's attendance?"
- **Total: 51/52 widgets (98%)**

---

### PHASE 5: Admissions Module (4-5 hours)

#### Database Table
```sql
CREATE TABLE IF NOT EXISTS admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  inquiry_date DATE NOT NULL,
  student_name TEXT NOT NULL,
  student_name_hi TEXT,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  email TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  program TEXT NOT NULL, -- 'JEE', 'NEET', 'Foundation'
  batch_preference TEXT,
  current_class TEXT,
  current_school TEXT,
  source TEXT DEFAULT 'walk-in' CHECK (source IN ('walk-in', 'website', 'referral', 'advertisement', 'social-media', 'other')),
  referral_name TEXT,
  status TEXT DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'follow-up', 'demo-scheduled', 'demo-done', 'negotiation', 'admitted', 'rejected', 'dropped')),
  status_reason TEXT,
  admission_date DATE,
  batch_assigned UUID,
  fee_quoted DECIMAL(12,2),
  fee_final DECIMAL(12,2),
  assigned_to UUID REFERENCES user_profiles(id),
  next_follow_up DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_admissions_customer ON admissions(customer_id);
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_admissions_program ON admissions(program);
CREATE INDEX idx_admissions_inquiry_date ON admissions(inquiry_date);
CREATE INDEX idx_admissions_follow_up ON admissions(next_follow_up);

-- RLS
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admissions_tenant_isolation" ON admissions
  FOR ALL USING (
    customer_id IN (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()::text)
  );
```

#### Hooks to Create
| Hook | File |
|------|------|
| useAdmissionStatsQuery | `src/hooks/queries/admin/useAdmissionStatsQuery.ts` |
| useAdmissionsListQuery | `src/hooks/queries/admin/useAdmissionsListQuery.ts` |
| useAdmissionDetailQuery | `src/hooks/queries/admin/useAdmissionDetailQuery.ts` |
| useCreateAdmissionMutation | `src/hooks/mutations/admin/useCreateAdmissionMutation.ts` |
| useUpdateAdmissionMutation | `src/hooks/mutations/admin/useUpdateAdmissionMutation.ts` |

#### Widgets to Create
| Widget | File |
|--------|------|
| AdmissionStatsWidget | `src/components/widgets/admin/academic/AdmissionStatsWidget.tsx` |

#### Screens to Create
| Screen | Type | File |
|--------|------|------|
| AdmissionsDashboardScreen | Dynamic | `src/screens/admin/admissions/AdmissionsDashboardScreen.tsx` |
| AdmissionsListScreen | Dynamic | `src/screens/admin/admissions/AdmissionsListScreen.tsx` |
| AdmissionDetailScreen | Fixed | `src/screens/admin/admissions/AdmissionDetailScreen.tsx` |
| AdmissionCreateScreen | Fixed | `src/screens/admin/admissions/AdmissionCreateScreen.tsx` |

#### E2E Checklist (Phase 5)
- [ ] AdmissionStats widget renders
- [ ] Inquiry/Admitted counts correct
- [ ] Conversion rate calculated correctly
- [ ] Program breakdown shows
- [ ] Pending follow-up count shows
- [ ] Inquiries tap → AdmissionsList (filtered)
- [ ] Admitted tap → AdmissionsList (filtered)
- [ ] Follow-up tap → AdmissionsList (filtered)
- [ ] Add New → AdmissionCreate
- [ ] Create form saves correctly
- [ ] Status updates work

#### Production Ready After Phase 5
- ✅ All coaching-specific widgets complete
- **Can answer:** "How many new admissions this month?"
- **Total: 52/52 widgets (100%)**

---

## DATABASE SCHEMA

### Summary of Tables

| Table | Purpose | Phase |
|-------|---------|-------|
| student_fees | Student fee records | Phase 2 |
| teacher_payroll | Teacher salary records | Phase 3 |
| batch_performance | Aggregated batch scores | Phase 4 |
| daily_attendance | Daily attendance records | Phase 4 |
| admissions | Inquiry and admission tracking | Phase 5 |

### Entity Relationship

```
customers (1) ─────┬───── (*) student_fees
                   ├───── (*) teacher_payroll
                   ├───── (*) batch_performance
                   ├───── (*) daily_attendance
                   └───── (*) admissions

user_profiles (1) ─┬───── (*) student_fees (as student)
                   ├───── (*) teacher_payroll (as teacher)
                   ├───── (*) daily_attendance (as user)
                   └───── (*) admissions (as assigned_to)

batches (1) ───────┬───── (*) batch_performance
                   └───── (*) daily_attendance
```

---

## E2E TESTING CHECKLIST

### Master Checklist by Module

#### Media Module (Phase 0)
- [ ] All 7 media widgets render
- [ ] Banner images load
- [ ] Carousel swipes
- [ ] External links work

#### Profile Module (Phase 0-1)
- [ ] Profile Card navigates
- [ ] Quick Links all work
- [ ] Activity Log shows items
- [ ] Hero shows name

#### Notifications Module (Phase 1)
- [ ] Recent Notifications displays
- [ ] Notification tap → detail
- [ ] System Alerts displays
- [ ] Alert tap → detail
- [ ] View All works

#### Actions Module (Phase 1)
- [ ] Quick Actions (5 buttons)
- [ ] Pending Approvals approve/reject
- [ ] Bulk Actions import
- [ ] Quick Create all options

#### Content Module (Phase 1)
- [ ] Content Statistics tap
- [ ] Content Library items
- [ ] Content Categories
- [ ] Org Tree navigation
- [ ] Class List navigation

#### Analytics Module (Phase 1)
- [ ] All 22 analytics widgets render
- [ ] User widgets navigate
- [ ] Finance widgets navigate
- [ ] System widgets navigate

#### Fees Module (Phase 2)
- [ ] Fee Dashboard stats accurate
- [ ] Collection rate displays
- [ ] Pending/Overdue navigation
- [ ] Fee Trend chart works
- [ ] Monthly drill-down works

#### Payroll Module (Phase 3)
- [ ] Payroll stats accurate
- [ ] Paid/Pending breakdown
- [ ] Process salaries flow
- [ ] Individual payslip view

#### Academic Module (Phase 4)
- [ ] Batch Performance ranking
- [ ] Batch drill-down works
- [ ] Attendance percentages
- [ ] Absent list works
- [ ] Weekly trend visible

#### Admissions Module (Phase 5)
- [ ] Inquiry count correct
- [ ] Conversion rate accurate
- [ ] Program breakdown
- [ ] Follow-up list
- [ ] Create admission form

---

## DEMO SCRIPT

### For Allen Coaching Management Demo

#### Opening (2 min)
1. Login as Admin
2. Show Admin Dashboard with all widgets
3. Highlight real-time data updates

#### User Management (3 min)
1. Show User Stats Grid
2. Navigate to User Management
3. Demo user creation flow
4. Show role distribution

#### Fee Collection (5 min) ⭐
1. Show Student Fees Dashboard
2. Point out collection rate
3. Show pending/overdue breakdown
4. Demo fee collection trend
5. Navigate to student fee detail
6. Show send reminder feature

#### Teacher Payroll (3 min) ⭐
1. Show Teacher Payroll widget
2. Point out paid vs pending
3. Demo process salaries flow
4. Show individual payslip

#### Batch Performance (4 min) ⭐
1. Show Batch Performance widget
2. Highlight top batches
3. Show trend indicators
4. Navigate to batch detail
5. Show student list in batch

#### Attendance (3 min) ⭐
1. Show Attendance Overview
2. Point out today's percentages
3. Show absent list
4. Demo weekly trend
5. Show low attendance alerts

#### Admissions (3 min) ⭐
1. Show Admission Stats
2. Point out conversion funnel
3. Show program breakdown
4. Demo add new inquiry
5. Show follow-up list

#### Analytics & Reports (2 min)
1. Show KPI Grid
2. Navigate to Analytics Dashboard
3. Show Finance Reports
4. Show Audit Logs

#### Closing (2 min)
1. Show System Health
2. Demo quick actions
3. Show profile and settings
4. Q&A

**Total Demo Time: ~25 minutes**

---

## APPENDIX

### File Structure After Implementation

```
src/
├── components/
│   └── widgets/
│       └── admin/
│           ├── fees/
│           │   ├── StudentFeesDashboardWidget.tsx
│           │   └── FeeCollectionTrendWidget.tsx
│           ├── payroll/
│           │   └── TeacherPayrollWidget.tsx
│           └── academic/
│               ├── BatchPerformanceWidget.tsx
│               ├── AttendanceOverviewWidget.tsx
│               └── AdmissionStatsWidget.tsx
├── screens/
│   └── admin/
│       ├── fees/
│       │   ├── StudentFeesListScreen.tsx
│       │   ├── StudentFeeDetailScreen.tsx
│       │   ├── MonthlyFeeReportScreen.tsx
│       │   └── FeeReportsScreen.tsx
│       ├── payroll/
│       │   ├── TeacherPayrollListScreen.tsx
│       │   ├── TeacherPayrollDetailScreen.tsx
│       │   └── PayrollProcessingScreen.tsx
│       ├── academic/
│       │   ├── BatchAnalyticsScreen.tsx
│       │   ├── BatchDetailScreen.tsx
│       │   ├── BatchStudentsScreen.tsx
│       │   ├── AttendanceDashboardScreen.tsx
│       │   ├── StudentAttendanceDetailScreen.tsx
│       │   ├── AbsentListScreen.tsx
│       │   └── BatchAttendanceScreen.tsx
│       └── admissions/
│           ├── AdmissionsDashboardScreen.tsx
│           ├── AdmissionsListScreen.tsx
│           ├── AdmissionDetailScreen.tsx
│           └── AdmissionCreateScreen.tsx
└── hooks/
    └── queries/
        └── admin/
            ├── useStudentFeesSummaryQuery.ts
            ├── useFeeCollectionTrendQuery.ts
            ├── useTeacherPayrollQuery.ts
            ├── useBatchPerformanceQuery.ts
            ├── useAttendanceOverviewQuery.ts
            └── useAdmissionStatsQuery.ts
```

### Translations Required

#### English (`src/locales/en/admin.json`)
```json
{
  "widgets": {
    "studentFees": {
      "title": "Fee Collection",
      "collected": "Collected",
      "pending": "Pending",
      "overdue": "Overdue",
      "collectionRate": "Collection Rate",
      "today": "Today",
      "sendReminder": "Send Reminder to Defaulters"
    },
    "feeCollectionTrend": {
      "title": "Collection Trend",
      "expected": "Expected",
      "actual": "Actual",
      "thisMonth": "This Month",
      "yearTotal": "Year Total"
    },
    "teacherPayroll": {
      "title": "Teacher Payroll",
      "totalPayroll": "Total Payroll",
      "paid": "Paid",
      "pending": "Pending",
      "nextDue": "Next Payment Due",
      "processSalaries": "Process Pending Salaries"
    },
    "batchPerformance": {
      "title": "Batch Performance",
      "avgScore": "avg",
      "students": "students",
      "vsLastTerm": "vs last term",
      "overallAverage": "Overall Average"
    },
    "attendanceOverview": {
      "title": "Today's Attendance",
      "students": "Students",
      "teachers": "Teachers",
      "absentToday": "Absent Today",
      "weeklyTrend": "Weekly Trend",
      "lowAttendanceAlert": "batches below 80% attendance"
    },
    "admissionStats": {
      "title": "Admissions",
      "inquiries": "Inquiries",
      "admitted": "Admitted",
      "conversion": "Conversion",
      "byProgram": "By Program",
      "pendingFollowUp": "inquiries pending follow-up",
      "addNewInquiry": "Add New Inquiry"
    }
  }
}
```

#### Hindi (`src/locales/hi/admin.json`)
```json
{
  "widgets": {
    "studentFees": {
      "title": "फीस संग्रह",
      "collected": "एकत्रित",
      "pending": "लंबित",
      "overdue": "अतिदेय",
      "collectionRate": "संग्रह दर",
      "today": "आज",
      "sendReminder": "डिफॉल्टर्स को रिमाइंडर भेजें"
    },
    "feeCollectionTrend": {
      "title": "संग्रह रुझान",
      "expected": "अपेक्षित",
      "actual": "वास्तविक",
      "thisMonth": "इस महीने",
      "yearTotal": "वर्ष कुल"
    },
    "teacherPayroll": {
      "title": "शिक्षक वेतन",
      "totalPayroll": "कुल वेतन",
      "paid": "भुगतान किया",
      "pending": "लंबित",
      "nextDue": "अगला भुगतान देय",
      "processSalaries": "लंबित वेतन प्रक्रिया"
    },
    "batchPerformance": {
      "title": "बैच प्रदर्शन",
      "avgScore": "औसत",
      "students": "छात्र",
      "vsLastTerm": "पिछले सत्र की तुलना में",
      "overallAverage": "समग्र औसत"
    },
    "attendanceOverview": {
      "title": "आज की उपस्थिति",
      "students": "छात्र",
      "teachers": "शिक्षक",
      "absentToday": "आज अनुपस्थित",
      "weeklyTrend": "साप्ताहिक रुझान",
      "lowAttendanceAlert": "बैच 80% से कम उपस्थिति"
    },
    "admissionStats": {
      "title": "प्रवेश",
      "inquiries": "पूछताछ",
      "admitted": "प्रवेशित",
      "conversion": "रूपांतरण",
      "byProgram": "कार्यक्रम द्वारा",
      "pendingFollowUp": "पूछताछ फॉलो-अप लंबित",
      "addNewInquiry": "नई पूछताछ जोड़ें"
    }
  }
}
```

---

## REVISION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial plan created |

---

**Document End**
