"use client";

import { useState } from "react";
import { ScreenWidgetConfig, WidgetMetadata } from "@/types";
import { Palette, Sliders, Layout, Database } from "lucide-react";

type Props = {
  widget: ScreenWidgetConfig;
  metadata: WidgetMetadata;
  onUpdate: (updates: Partial<ScreenWidgetConfig>) => void;
};

// Widgets that support layout style (list-based widgets)
const LAYOUT_STYLE_WIDGETS = [
  "schedule.today",
  "doubts.inbox",
  "assignments.pending",
  "progress.snapshot",
  "progress.subject-wise",
  "actions.quick",
  "profile.quickLinks",
  "profile.card",
  "profile.stats",
  "profile.achievements",
  "profile.activity",
  // Parent widgets
  "parent.children-overview",
  "parent.attendance-summary",
  "parent.fee-alerts",
  "parent.notifications-preview",
  "parent.ai-insights-preview",
  "parent.quick-actions",
  "parent.child-progress",
  "parent.child-stats",
  "parent.weak-areas",
  "parent.performance-chart",
  "parent.assignments-pending",
  "parent.subject-progress",
  "parent.report-card-preview",
  "parent.messages-inbox",
  "parent.announcements",
  "parent.teacher-contacts",
  "parent.fee-summary",
  "parent.pending-fees",
  "parent.payment-history",
  "parent.ai-predictions",
  "parent.ai-recommendations",
  "parent.ai-alerts",
  "parent.comparison-analytics",
  // Student notifications
  "notifications.preview",
  // Assessment widgets
  "tasks.overview",
  // Study widgets
  "downloads.summary",
  // Social widgets
  "connections.list",
  "suggestions.peers",
  // AI widgets
  "ai.learning-insights",
  "ai.performance-predictions",
  "ai.weak-topic-alerts",
  "ai.study-recommendations",
  // Automation widgets
  "automation.reminders",
  "automation.streak-protection",
  // Rewards widgets
  "rewards.shop-preview",
  "rewards.xp-balance",
  // Community widgets
  "community.feed",
  "study.groups",
  "peer.matches",
  // Admin widgets
  "users.recent-registrations",
  "finance.revenue-summary",
  "finance.expense-summary",
  "admin.profile-activity",
  // Media widgets
  "media.banner",
  "media.banner-1",
  "media.banner-2",
  "media.banner-3",
  "media.hero",
  "media.promo",
  "media.ad",
];

// Widget-specific layout options
const WIDGET_LAYOUT_OPTIONS: Record<string, string[]> = {
  "profile.quickLinks": ["list", "grid"],
  "profile.card": ["horizontal", "vertical"],
  "profile.stats": ["grid", "list", "cards"],
  "profile.achievements": ["grid", "list", "cards"],
  "profile.activity": ["timeline", "list", "cards"],
  // Parent widgets
  "parent.children-overview": ["cards", "list", "grid"],
  "parent.attendance-summary": ["cards", "list", "compact"],
  "parent.fee-alerts": ["list", "cards", "compact"],
  "parent.notifications-preview": ["list", "cards", "compact"],
  "parent.ai-insights-preview": ["list", "cards", "compact"],
  "parent.quick-actions": ["grid", "list"],
  "parent.child-progress": ["list", "cards", "compact"],
  "parent.child-stats": ["grid", "list", "cards"],
  "parent.weak-areas": ["list", "cards", "compact"],
  "parent.performance-chart": ["stacked", "tabs", "compact"],
  "parent.assignments-pending": ["list", "cards", "compact"],
  "parent.subject-progress": ["list", "cards", "compact"],
  "parent.report-card-preview": ["list", "cards", "compact"],
  "parent.messages-inbox": ["list", "cards", "compact"],
  "parent.announcements": ["list", "cards", "compact"],
  "parent.teacher-contacts": ["list", "cards", "compact"],
  "parent.fee-summary": ["list", "cards", "compact"],
  "parent.pending-fees": ["list", "cards", "compact"],
  "parent.payment-history": ["list", "cards", "compact"],
  "parent.ai-predictions": ["list", "cards", "compact"],
  "parent.ai-recommendations": ["list", "cards", "compact"],
  // Student notifications
  "notifications.preview": ["list", "cards", "compact"],
  // Assessment widgets
  "tasks.overview": ["list", "cards", "compact"],
  // Study widgets
  "downloads.summary": ["list", "cards", "compact"],
  // Social widgets
  "connections.list": ["list", "cards", "compact"],
  "suggestions.peers": ["list", "cards", "compact"],
  // AI widgets
  "ai.learning-insights": ["list", "cards"],
  "ai.performance-predictions": ["list", "cards"],
  "ai.weak-topic-alerts": ["list", "cards"],
  "ai.study-recommendations": ["list", "cards"],
  // Automation widgets
  "automation.reminders": ["list", "cards"],
  "automation.streak-protection": ["card", "compact"],
  // Rewards widgets
  "rewards.shop-preview": ["cards", "list"],
  "rewards.xp-balance": ["card", "compact"],
  // Community widgets
  "community.feed": ["list", "cards"],
  "study.groups": ["list", "cards"],
  "peer.matches": ["list", "cards"],
  "parent.ai-alerts": ["list", "cards", "compact"],
  "parent.comparison-analytics": ["list", "cards", "compact"],
  // Admin widgets
  "users.recent-registrations": ["list", "cards"],
  "finance.revenue-summary": ["standard", "compact"],
  "finance.expense-summary": ["standard", "compact"],
  "admin.profile-activity": ["timeline", "list", "cards"],
  // Media widgets
  "media.banner": ["single", "carousel", "grid"],
  "media.banner-1": ["single", "carousel", "grid"],
  "media.banner-2": ["single", "carousel", "grid"],
  "media.banner-3": ["single", "carousel", "grid"],
  "media.hero": ["single", "carousel"],
  "media.promo": ["carousel", "grid"],
  "media.ad": ["single", "compact"],
  // Default for other widgets
  default: ["list", "cards", "grid", "timeline"],
};

// Predefined accent colors
const ACCENT_COLORS = [
  { name: "Primary", value: "#6366F1" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
  { name: "Red", value: "#EF4444" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Purple", value: "#8B5CF6" },
];

// Complete widget configuration schemas
const WIDGET_CONFIGS: Record<string, WidgetConfigSchema> = {
  "hero.greeting": {
    sections: [
      {
        title: "Content",
        icon: "📝",
        fields: [
          { key: "greetingStyle", label: "Greeting Style", type: "select", options: ["friendly", "formal", "minimal", "emoji"], default: "friendly" },
          { key: "customGreeting", label: "Custom Greeting Text", type: "text", placeholder: "e.g., Welcome back" },
          { key: "showEmoji", label: "Show Emoji in Greeting", type: "boolean", default: true },
        ],
      },
      {
        title: "User Info",
        icon: "👤",
        fields: [
          { key: "showAvatar", label: "Show User Avatar", type: "boolean", default: true },
          { key: "avatarStyle", label: "Avatar Style", type: "select", options: ["circle", "rounded", "square"], default: "circle" },
          { key: "showUserName", label: "Show User Name", type: "boolean", default: true },
          { key: "showSubtitle", label: "Show Motivational Text", type: "boolean", default: true },
          { key: "customSubtitle", label: "Custom Subtitle", type: "text", placeholder: "Ready to learn?" },
        ],
      },
      {
        title: "Student Stats",
        icon: "📊",
        fields: [
          { key: "showStats", label: "Show Quick Stats", type: "boolean", default: true },
          { key: "statsLayout", label: "Stats Layout", type: "select", options: ["horizontal", "grid"], default: "horizontal" },
          { key: "showStreak", label: "Show Streak", type: "boolean", default: true },
          { key: "showStudyTime", label: "Show Study Time", type: "boolean", default: true },
          { key: "showScore", label: "Show Score", type: "boolean", default: true },
          { key: "showXP", label: "Show XP Points", type: "boolean", default: false },
        ],
      },
      {
        title: "Parent Stats",
        icon: "👨‍👩‍👧",
        fields: [
          { key: "showChildrenCount", label: "Show Children Count", type: "boolean", default: true },
          { key: "showPendingFees", label: "Show Pending Fees", type: "boolean", default: true },
          { key: "showUnreadMessages", label: "Show Unread Messages", type: "boolean", default: true },
        ],
      },
      {
        title: "Teacher Stats",
        icon: "👨‍🏫",
        fields: [
          { key: "showClassCount", label: "Show Class Count", type: "boolean", default: true },
          { key: "showStudentCount", label: "Show Student Count", type: "boolean", default: true },
          { key: "showPendingTasks", label: "Show Pending Tasks", type: "boolean", default: true },
        ],
      },
    ],
  },
  "schedule.today": {
    sections: [
      {
        title: "Display",
        icon: "📅",
        fields: [
          { key: "maxItems", label: "Max Items to Show", type: "number", min: 1, max: 10, default: 3 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "timeline", "cards"], default: "list" },
          { key: "showTimeIndicator", label: "Show Color Indicator", type: "boolean", default: true },
        ],
      },
      {
        title: "Item Details",
        icon: "📋",
        fields: [
          { key: "showIcon", label: "Show Type Icon", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "timeFormat", label: "Time Format", type: "select", options: ["12h", "24h"], default: "12h" },
          { key: "showDuration", label: "Show Duration", type: "boolean", default: false },
          { key: "showLocation", label: "Show Location", type: "boolean", default: false },
        ],
      },
      {
        title: "Badges & Status",
        icon: "🏷️",
        fields: [
          { key: "showBadges", label: "Show Status Badges", type: "boolean", default: true },
          { key: "showLiveIndicator", label: "Show Live Indicator", type: "boolean", default: true },
          { key: "highlightNext", label: "Highlight Next Item", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showViewAll", label: "Show View All Link", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap to Open", type: "boolean", default: true },
        ],
      },
    ],
  },
  "actions.quick": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "columns", label: "Number of Columns", type: "select", options: ["2", "3", "4"], default: "2" },
          { key: "style", label: "Button Style", type: "select", options: ["filled", "outlined", "minimal"], default: "filled" },
          { key: "iconPosition", label: "Icon Position", type: "select", options: ["top", "left"], default: "top" },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showStudy", label: "Show Study Action", type: "boolean", default: true },
          { key: "showAskDoubt", label: "Show Ask Doubt Action", type: "boolean", default: true },
          { key: "showTest", label: "Show Take Test Action", type: "boolean", default: true },
          { key: "showLiveClass", label: "Show Live Class Action", type: "boolean", default: true },
          { key: "showAssignments", label: "Show Assignments Action", type: "boolean", default: false },
          { key: "showNotes", label: "Show Notes Action", type: "boolean", default: false },
        ],
      },
      {
        title: "Appearance",
        icon: "🎨",
        fields: [
          { key: "showLabels", label: "Show Labels", type: "boolean", default: true },
          { key: "iconSize", label: "Icon Size", type: "select", options: ["small", "medium", "large"], default: "medium" },
          { key: "useCustomColors", label: "Use Custom Colors", type: "boolean", default: true },
        ],
      },
    ],
  },
  "progress.snapshot": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "grid"], default: "list" },
        ],
      },
      {
        title: "Overall Progress",
        icon: "🎯",
        fields: [
          { key: "showOverallCircle", label: "Show Overall Progress Circle", type: "boolean", default: true },
          { key: "circleStyle", label: "Circle Style", type: "select", options: ["ring", "pie", "gauge"], default: "ring" },
          { key: "showPercentage", label: "Show Percentage", type: "boolean", default: true },
        ],
      },
      {
        title: "Stats",
        icon: "📈",
        fields: [
          { key: "showChaptersCompleted", label: "Show Chapters Completed", type: "boolean", default: true },
          { key: "showHoursStudied", label: "Show Hours Studied", type: "boolean", default: true },
          { key: "showTestsPassed", label: "Show Tests Passed", type: "boolean", default: true },
          { key: "showAssignments", label: "Show Assignments Done", type: "boolean", default: false },
        ],
      },
      {
        title: "Subject Progress",
        icon: "📚",
        fields: [
          { key: "showSubjects", label: "Show Subject Progress", type: "boolean", default: true },
          { key: "maxSubjects", label: "Max Subjects to Show", type: "number", min: 1, max: 8, default: 4 },
          { key: "progressBarStyle", label: "Progress Bar Style", type: "select", options: ["bar", "circular", "steps"], default: "bar" },
          { key: "showSubjectPercentage", label: "Show Subject Percentage", type: "boolean", default: true },
        ],
      },
    ],
  },
  "progress.subject-wise": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "grid"], default: "list" },
          { key: "maxSubjects", label: "Max Subjects", type: "number", min: 1, max: 10, default: 5 },
          { key: "sortBy", label: "Sort By", type: "select", options: ["progress", "name", "recent"], default: "progress" },
        ],
      },
      {
        title: "Display",
        icon: "📊",
        fields: [
          { key: "showProgressBar", label: "Show Progress Bar", type: "boolean", default: true },
          { key: "showPercentage", label: "Show Percentage", type: "boolean", default: true },
          { key: "showStats", label: "Show Chapter Stats", type: "boolean", default: true },
          { key: "showChapters", label: "Show Chapters Detail", type: "boolean", default: true },
          { key: "showLastActivity", label: "Show Last Activity", type: "boolean", default: false },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
          { key: "showViewAll", label: "Show View All Button", type: "boolean", default: true },
        ],
      },
    ],
  },
  "doubts.inbox": {
    sections: [
      {
        title: "Display",
        icon: "💬",
        fields: [
          { key: "maxItems", label: "Max Items to Show", type: "number", min: 1, max: 10, default: 3 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "sortBy", label: "Sort By", type: "select", options: ["recent", "unread", "priority"], default: "recent" },
        ],
      },
      {
        title: "Item Details",
        icon: "📝",
        fields: [
          { key: "showSubject", label: "Show Subject Tag", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "showPreview", label: "Show Message Preview", type: "boolean", default: true },
          { key: "previewLength", label: "Preview Length", type: "number", min: 20, max: 100, default: 50 },
        ],
      },
      {
        title: "Status",
        icon: "🔔",
        fields: [
          { key: "showStatus", label: "Show Status Badge", type: "boolean", default: true },
          { key: "showUnreadCount", label: "Show Unread Count", type: "boolean", default: true },
          { key: "highlightUnread", label: "Highlight Unread", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showAskNew", label: "Show Ask New Button", type: "boolean", default: true },
          { key: "showViewAll", label: "Show View All Link", type: "boolean", default: true },
        ],
      },
    ],
  },
  "assignments.pending": {
    sections: [
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxItems", label: "Max Items to Show", type: "number", min: 1, max: 10, default: 3 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "timeline"], default: "list" },
          { key: "sortBy", label: "Sort By", type: "select", options: ["dueDate", "subject", "priority"], default: "dueDate" },
        ],
      },
      {
        title: "Item Details",
        icon: "📝",
        fields: [
          { key: "showSubject", label: "Show Subject", type: "boolean", default: true },
          { key: "showDueDate", label: "Show Due Date", type: "boolean", default: true },
          { key: "showDueTime", label: "Show Due Time", type: "boolean", default: false },
          { key: "showProgress", label: "Show Progress", type: "boolean", default: false },
          { key: "showPoints", label: "Show Points/Marks", type: "boolean", default: true },
        ],
      },
      {
        title: "Urgency Indicators",
        icon: "⚠️",
        fields: [
          { key: "showUrgencyBadge", label: "Show Urgency Badge", type: "boolean", default: true },
          { key: "highlightOverdue", label: "Highlight Overdue", type: "boolean", default: true },
          { key: "highlightDueToday", label: "Highlight Due Today", type: "boolean", default: true },
        ],
      },
      {
        title: "Grouping",
        icon: "📁",
        fields: [
          { key: "groupBySubject", label: "Group by Subject", type: "boolean", default: false },
          { key: "groupByDueDate", label: "Group by Due Date", type: "boolean", default: false },
        ],
      },
    ],
  },
  "profile.card": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["horizontal", "vertical"], default: "horizontal" },
          { key: "avatarSize", label: "Avatar Size", type: "select", options: ["small", "medium", "large"], default: "medium" },
        ],
      },
      {
        title: "Display",
        icon: "👤",
        fields: [
          { key: "showAvatar", label: "Show Avatar", type: "boolean", default: true },
          { key: "showClass", label: "Show Class Info", type: "boolean", default: true },
          { key: "showSchool", label: "Show School Name", type: "boolean", default: true },
          { key: "showStats", label: "Show Stats (XP, Streak, Badges)", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showEditButton", label: "Show Edit Button", type: "boolean", default: true },
        ],
      },
    ],
  },
  "profile.quickLinks": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "grid"], default: "list" },
        ],
      },
      {
        title: "Links",
        icon: "🔗",
        fields: [
          { key: "showEditProfile", label: "Show Edit Profile", type: "boolean", default: true },
          { key: "showSettings", label: "Show Settings", type: "boolean", default: true },
          { key: "showLogout", label: "Show Logout", type: "boolean", default: true },
        ],
      },
      {
        title: "Appearance",
        icon: "🎨",
        fields: [
          { key: "showIcons", label: "Show Icons", type: "boolean", default: true },
          { key: "showDividers", label: "Show Dividers", type: "boolean", default: true },
        ],
      },
    ],
  },
  "profile.stats": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["grid", "list", "cards"], default: "grid" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Gamification",
        icon: "🎮",
        fields: [
          { key: "showXP", label: "Show XP Points", type: "boolean", default: true },
          { key: "showStreak", label: "Show Streak", type: "boolean", default: true },
          { key: "showBadges", label: "Show Badges Count", type: "boolean", default: true },
        ],
      },
      {
        title: "Learning Progress",
        icon: "📚",
        fields: [
          { key: "showStudyTime", label: "Show Study Time", type: "boolean", default: true },
          { key: "showProgress", label: "Show Lessons Completed", type: "boolean", default: true },
        ],
      },
      {
        title: "Assessments",
        icon: "📝",
        fields: [
          { key: "showAssessments", label: "Show Pass Rate", type: "boolean", default: true },
        ],
      },
      {
        title: "Trends",
        icon: "📈",
        fields: [
          { key: "showTrends", label: "Show Trend Indicators", type: "boolean", default: true },
        ],
      },
    ],
  },
  "profile.achievements": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["grid", "list", "cards"], default: "grid" },
          { key: "maxItems", label: "Max Items", type: "number", min: 3, max: 12, default: 6 },
        ],
      },
      {
        title: "Display",
        icon: "🏆",
        fields: [
          { key: "showSummary", label: "Show Summary Stats", type: "boolean", default: true },
          { key: "showProgress", label: "Show Progress Bars", type: "boolean", default: true },
          { key: "showPoints", label: "Show Points", type: "boolean", default: true },
          { key: "showRarity", label: "Show Rarity Badge", type: "boolean", default: true },
          { key: "showLocked", label: "Show Locked Achievements", type: "boolean", default: true },
        ],
      },
      {
        title: "Filter",
        icon: "🔍",
        fields: [
          { key: "filterCategory", label: "Category Filter", type: "select", options: ["all", "learning", "streak", "social", "assessment", "milestone", "special"], default: "all" },
        ],
      },
    ],
  },
  "profile.activity": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["timeline", "list", "cards"], default: "timeline" },
          { key: "maxItems", label: "Max Items", type: "number", min: 5, max: 20, default: 10 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Display",
        icon: "📊",
        fields: [
          { key: "showTodayStats", label: "Show Today's Stats Banner", type: "boolean", default: true },
          { key: "showPoints", label: "Show XP Points", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "showGroupHeaders", label: "Group by Date", type: "boolean", default: true },
        ],
      },
    ],
  },
  "progress.streak": {
    sections: [
      {
        title: "Streak Display",
        icon: "🔥",
        fields: [
          { key: "showCurrentStreak", label: "Show Current Streak", type: "boolean", default: true },
          { key: "showLongestStreak", label: "Show Longest Streak", type: "boolean", default: true },
          { key: "showWeeklyGoal", label: "Show Weekly Goal Progress", type: "boolean", default: true },
        ],
      },
      {
        title: "Stats",
        icon: "📊",
        fields: [
          { key: "showTotalDays", label: "Show Total Study Days", type: "boolean", default: true },
          { key: "showTotalHours", label: "Show Total Study Hours", type: "boolean", default: true },
        ],
      },
      {
        title: "Achievements",
        icon: "🏆",
        fields: [
          { key: "showAchievements", label: "Show Recent Achievements", type: "boolean", default: true },
          { key: "maxAchievements", label: "Max Achievements", type: "number", min: 1, max: 6, default: 2 },
        ],
      },
      {
        title: "Activity",
        icon: "📅",
        fields: [
          { key: "showRecentActivity", label: "Show Recent Activity", type: "boolean", default: false },
          { key: "showMotivation", label: "Show Motivation Message", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "streak.tracker": {
    sections: [
      {
        title: "Streak Display",
        icon: "🔥",
        fields: [
          { key: "showCurrentStreak", label: "Show Current Streak", type: "boolean", default: true },
          { key: "showLongestStreak", label: "Show Longest Streak", type: "boolean", default: true },
          { key: "showWeeklyGoal", label: "Show Weekly Goal Progress", type: "boolean", default: true },
        ],
      },
      {
        title: "Stats",
        icon: "📊",
        fields: [
          { key: "showTotalDays", label: "Show Total Study Days", type: "boolean", default: true },
          { key: "showTotalHours", label: "Show Total Study Hours", type: "boolean", default: true },
        ],
      },
      {
        title: "Achievements",
        icon: "🏆",
        fields: [
          { key: "showAchievements", label: "Show Recent Achievements", type: "boolean", default: true },
          { key: "maxAchievements", label: "Max Achievements", type: "number", min: 1, max: 6, default: 2 },
        ],
      },
      {
        title: "Activity",
        icon: "📅",
        fields: [
          { key: "showRecentActivity", label: "Show Recent Activity", type: "boolean", default: false },
          { key: "showMotivation", label: "Show Motivation Message", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "stats.grid": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "columns", label: "Columns", type: "select", options: ["2", "3"], default: "2" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Stats to Show",
        icon: "📊",
        fields: [
          { key: "showXP", label: "Show XP Points", type: "boolean", default: true },
          { key: "showStreak", label: "Show Streak", type: "boolean", default: true },
          { key: "showBadges", label: "Show Badges", type: "boolean", default: true },
          { key: "showStudyTime", label: "Show Study Time", type: "boolean", default: true },
          { key: "showTests", label: "Show Tests Passed", type: "boolean", default: true },
          { key: "showAssignments", label: "Show Assignments", type: "boolean", default: true },
        ],
      },
      {
        title: "Display",
        icon: "🎨",
        fields: [
          { key: "showTrends", label: "Show Trend Indicators", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "ai.tools": {
    sections: [
      {
        title: "Display",
        icon: "🤖",
        fields: [
          { key: "maxTools", label: "Max Tools to Show", type: "number", min: 2, max: 10, default: 6 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["grid", "list", "cards"], default: "grid" },
          { key: "columns", label: "Grid Columns", type: "select", options: ["2", "3"], default: "2" },
        ],
      },
      {
        title: "Content",
        icon: "📝",
        fields: [
          { key: "showIcon", label: "Show Tool Icons", type: "boolean", default: true },
          { key: "showDescription", label: "Show Descriptions", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "notes.summary": {
    sections: [
      {
        title: "Display",
        icon: "📝",
        fields: [
          { key: "maxNotes", label: "Max Notes to Show", type: "number", min: 2, max: 10, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "grid", "cards"], default: "list" },
        ],
      },
      {
        title: "Content",
        icon: "📋",
        fields: [
          { key: "showPinned", label: "Show Pinned Notes First", type: "boolean", default: true },
          { key: "showWordCount", label: "Show Word Count", type: "boolean", default: true },
          { key: "showTags", label: "Show Tags", type: "boolean", default: true },
          { key: "showStats", label: "Show Stats Banner", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "recent.viewed": {
    sections: [
      {
        title: "Display",
        icon: "🕐",
        fields: [
          { key: "maxItems", label: "Max Items to Show", type: "number", min: 2, max: 10, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "grid", "cards"], default: "list" },
        ],
      },
      {
        title: "Content",
        icon: "📋",
        fields: [
          { key: "showProgress", label: "Show Progress Bar", type: "boolean", default: true },
          { key: "showIcon", label: "Show Content Icon", type: "boolean", default: true },
          { key: "showType", label: "Show Content Type", type: "boolean", default: true },
          { key: "showTimeAgo", label: "Show Time Ago", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "week.calendar": {
    sections: [
      {
        title: "Navigation",
        icon: "📅",
        fields: [
          { key: "showWeekNavigation", label: "Show Week Navigation", type: "boolean", default: true },
        ],
      },
      {
        title: "Day Display",
        icon: "📆",
        fields: [
          { key: "showEventCount", label: "Show Event Count", type: "boolean", default: true },
          { key: "compactMode", label: "Compact Mode (dots only)", type: "boolean", default: false },
        ],
      },
      {
        title: "Event Details",
        icon: "📋",
        fields: [
          { key: "showEventTime", label: "Show Event Time", type: "boolean", default: true },
          { key: "showSubjectColor", label: "Show Subject Color", type: "boolean", default: true },
          { key: "showLiveIndicator", label: "Show Live Indicator", type: "boolean", default: true },
          { key: "maxEventsPerDay", label: "Max Events Per Day", type: "number", min: 1, max: 5, default: 3 },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "upcoming.events": {
    sections: [
      {
        title: "Display",
        icon: "📅",
        fields: [
          { key: "maxItems", label: "Max Events to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
        ],
      },
      {
        title: "Event Details",
        icon: "📋",
        fields: [
          { key: "showDescription", label: "Show Description", type: "boolean", default: true },
          { key: "showLocation", label: "Show Location", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "showEventType", label: "Show Event Type Badge", type: "boolean", default: true },
          { key: "showImportantBadge", label: "Show Important Badge", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "notifications.preview": {
    sections: [
      {
        title: "Display",
        icon: "🔔",
        fields: [
          { key: "maxItems", label: "Max Notifications", type: "number", min: 1, max: 10, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
        ],
      },
      {
        title: "Content",
        icon: "📋",
        fields: [
          { key: "showBody", label: "Show Message Body", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "showCategory", label: "Show Category Badge", type: "boolean", default: false },
          { key: "showPriorityBadge", label: "Show Priority Badge", type: "boolean", default: true },
          { key: "showUnreadIndicator", label: "Show Unread Indicator", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "tasks.overview": {
    sections: [
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxItems", label: "Max Tasks to Show", type: "number", min: 1, max: 15, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
        ],
      },
      {
        title: "Stats Banner",
        icon: "📊",
        fields: [
          { key: "showCounts", label: "Show Stats Banner", type: "boolean", default: true },
          { key: "showOverdue", label: "Show Overdue Badge", type: "boolean", default: true },
        ],
      },
      {
        title: "Task Details",
        icon: "📝",
        fields: [
          { key: "showType", label: "Show Task Type Badge", type: "boolean", default: true },
          { key: "showDueDate", label: "Show Due Date", type: "boolean", default: true },
          { key: "showScore", label: "Show Max Score", type: "boolean", default: false },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "downloads.summary": {
    sections: [
      {
        title: "Display",
        icon: "📥",
        fields: [
          { key: "maxItems", label: "Max Downloads to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
        ],
      },
      {
        title: "Storage Info",
        icon: "💾",
        fields: [
          { key: "showStorage", label: "Show Storage Banner", type: "boolean", default: true },
          { key: "showRecent", label: "Show Recent Badge", type: "boolean", default: true },
          { key: "showTypeBreakdown", label: "Show Type Breakdown", type: "boolean", default: false },
        ],
      },
      {
        title: "Item Details",
        icon: "📝",
        fields: [
          { key: "showFileSize", label: "Show File Size", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "connections.list": {
    sections: [
      {
        title: "Display",
        icon: "👥",
        fields: [
          { key: "maxItems", label: "Max Connections to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Stats Banner",
        icon: "📊",
        fields: [
          { key: "showStats", label: "Show Stats Banner", type: "boolean", default: true },
          { key: "showOnlineStatus", label: "Show Online Status", type: "boolean", default: true },
        ],
      },
      {
        title: "Connection Details",
        icon: "📝",
        fields: [
          { key: "showXP", label: "Show XP Points", type: "boolean", default: true },
          { key: "showStreak", label: "Show Streak Days", type: "boolean", default: true },
          { key: "showMutualSubjects", label: "Show Mutual Subjects", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "suggestions.peers": {
    sections: [
      {
        title: "Display",
        icon: "🔍",
        fields: [
          { key: "maxItems", label: "Max Suggestions to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Match Info",
        icon: "🎯",
        fields: [
          { key: "showMatchScore", label: "Show Match Score", type: "boolean", default: true },
          { key: "showMatchReasons", label: "Show Match Reasons", type: "boolean", default: true },
          { key: "showOnlineStatus", label: "Show Online Status", type: "boolean", default: true },
        ],
      },
      {
        title: "Peer Details",
        icon: "📝",
        fields: [
          { key: "showMutualSubjects", label: "Show Mutual Subjects", type: "boolean", default: true },
          { key: "showMutualConnections", label: "Show Mutual Connections", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "ai.learning-insights": {
    sections: [
      {
        title: "Display",
        icon: "💡",
        fields: [
          { key: "maxItems", label: "Max Insights to Show", type: "number", min: 1, max: 10, default: 4 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards"], default: "list" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Filter",
        icon: "🔍",
        fields: [
          { key: "filterType", label: "Filter by Type", type: "select", options: ["all", "strength", "weakness", "recommendation", "trend", "achievement", "alert"], default: "all" },
        ],
      },
      {
        title: "Insight Details",
        icon: "📝",
        fields: [
          { key: "showDescription", label: "Show Description", type: "boolean", default: true },
          { key: "showMetric", label: "Show Metric Value", type: "boolean", default: true },
          { key: "showSubject", label: "Show Subject", type: "boolean", default: true },
          { key: "showAction", label: "Show Action Button", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "ai.performance-predictions": {
    sections: [
      {
        title: "Display",
        icon: "📈",
        fields: [
          { key: "maxItems", label: "Max Predictions to Show", type: "number", min: 1, max: 10, default: 4 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards"], default: "list" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Filter",
        icon: "🔍",
        fields: [
          { key: "filterType", label: "Filter by Type", type: "select", options: ["all", "exam_score", "subject_grade", "improvement", "risk", "milestone", "trend"], default: "all" },
        ],
      },
      {
        title: "Prediction Details",
        icon: "📝",
        fields: [
          { key: "showDescription", label: "Show Description", type: "boolean", default: true },
          { key: "showConfidence", label: "Show Confidence Score", type: "boolean", default: true },
          { key: "showSubject", label: "Show Subject", type: "boolean", default: true },
          { key: "showProgress", label: "Show Progress Bar", type: "boolean", default: true },
          { key: "showAction", label: "Show Action Button", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "ai.weak-topic-alerts": {
    sections: [
      {
        title: "Display",
        icon: "⚠️",
        fields: [
          { key: "maxItems", label: "Max Alerts to Show", type: "number", min: 1, max: 10, default: 4 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards"], default: "list" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Filter",
        icon: "🔍",
        fields: [
          { key: "filterType", label: "Filter by Type", type: "select", options: ["all", "declining", "critical", "stagnant", "opportunity", "urgent", "improvement"], default: "all" },
          { key: "filterSeverity", label: "Min Severity", type: "select", options: ["all", "3", "4", "5"], default: "all" },
        ],
      },
      {
        title: "Alert Details",
        icon: "📝",
        fields: [
          { key: "showDescription", label: "Show Description", type: "boolean", default: true },
          { key: "showScore", label: "Show Score Change", type: "boolean", default: true },
          { key: "showSubject", label: "Show Subject & Topic", type: "boolean", default: true },
          { key: "showSeverity", label: "Show Severity Badge", type: "boolean", default: true },
          { key: "showDaysSince", label: "Show Days Since Practice", type: "boolean", default: true },
          { key: "showAction", label: "Show Action Button", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "ai.study-recommendations": {
    sections: [
      {
        title: "Display",
        icon: "💡",
        fields: [
          { key: "maxItems", label: "Max Recommendations", type: "number", min: 1, max: 10, default: 4 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards"], default: "list" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Filter",
        icon: "🔍",
        fields: [
          { key: "filterType", label: "Filter by Type", type: "select", options: ["all", "content", "practice", "revision", "challenge", "remedial", "enrichment"], default: "all" },
          { key: "filterDifficulty", label: "Filter by Difficulty", type: "select", options: ["all", "easy", "medium", "hard"], default: "all" },
        ],
      },
      {
        title: "Recommendation Details",
        icon: "📝",
        fields: [
          { key: "showDescription", label: "Show Description", type: "boolean", default: true },
          { key: "showConfidence", label: "Show Confidence Score", type: "boolean", default: true },
          { key: "showSubject", label: "Show Subject & Topic", type: "boolean", default: true },
          { key: "showTime", label: "Show Estimated Time", type: "boolean", default: true },
          { key: "showDifficulty", label: "Show Difficulty Badge", type: "boolean", default: true },
          { key: "showReason", label: "Show Reason", type: "boolean", default: true },
          { key: "showAction", label: "Show Action Button", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "automation.reminders": {
    sections: [
      {
        title: "Display",
        icon: "🔔",
        fields: [
          { key: "maxItems", label: "Max Reminders", type: "number", min: 1, max: 10, default: 4 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards"], default: "list" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Filter",
        icon: "🔍",
        fields: [
          { key: "filterType", label: "Filter by Type", type: "select", options: ["all", "study", "assignment", "test", "revision", "break", "goal", "custom"], default: "all" },
          { key: "showOverdue", label: "Show Overdue Reminders", type: "boolean", default: true },
        ],
      },
      {
        title: "Reminder Details",
        icon: "📝",
        fields: [
          { key: "showDescription", label: "Show Description", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "showRepeat", label: "Show Repeat Info", type: "boolean", default: true },
          { key: "showPriority", label: "Show Priority Badge", type: "boolean", default: true },
          { key: "showAction", label: "Show Action Button", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "automation.streak-protection": {
    sections: [
      {
        title: "Display",
        icon: "🔥",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["card", "compact"], default: "card" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Streak Info",
        icon: "🛡️",
        fields: [
          { key: "showShields", label: "Show Protection Shields", type: "boolean", default: true },
          { key: "showWeekProgress", label: "Show Weekly Progress", type: "boolean", default: true },
          { key: "showMilestone", label: "Show Next Milestone", type: "boolean", default: true },
          { key: "showUrgencyBanner", label: "Show Urgency Banner", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showQuickAction", label: "Show Quick Action Button", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "rewards.shop-preview": {
    sections: [
      {
        title: "Display",
        icon: "🎁",
        fields: [
          { key: "maxItems", label: "Max Items", type: "number", min: 1, max: 10, default: 4 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["cards", "list"], default: "cards" },
          { key: "showFeaturedOnly", label: "Show Featured Only", type: "boolean", default: false },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Item Details",
        icon: "💰",
        fields: [
          { key: "showPrice", label: "Show Price", type: "boolean", default: true },
          { key: "showDiscount", label: "Show Discount Badge", type: "boolean", default: true },
          { key: "showRarity", label: "Show Rarity Badge", type: "boolean", default: true },
          { key: "showStock", label: "Show Stock Count", type: "boolean", default: true },
          { key: "showBadges", label: "Show Featured/New/Limited Badges", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "rewards.xp-balance": {
    sections: [
      {
        title: "Balance Display",
        icon: "💰",
        fields: [
          { key: "showCoins", label: "Show Coins Balance", type: "boolean", default: true },
          { key: "showXp", label: "Show XP Total", type: "boolean", default: true },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["card", "compact"], default: "card" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Level & Progress",
        icon: "⭐",
        fields: [
          { key: "showLevel", label: "Show Level Info", type: "boolean", default: true },
          { key: "showProgress", label: "Show Progress Bar", type: "boolean", default: true },
          { key: "showMultiplier", label: "Show Active Multiplier", type: "boolean", default: true },
        ],
      },
      {
        title: "Stats",
        icon: "📊",
        fields: [
          { key: "showEarnings", label: "Show Today/Week Earnings", type: "boolean", default: true },
          { key: "showRank", label: "Show Class Rank", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "community.feed": {
    sections: [
      {
        title: "Display",
        icon: "👥",
        fields: [
          { key: "maxItems", label: "Max Posts", type: "number", min: 1, max: 20, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards"], default: "list" },
          { key: "filterType", label: "Filter by Type", type: "select", options: ["all", "post", "achievement", "question", "announcement", "milestone", "challenge"], default: "all" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Post Details",
        icon: "📝",
        fields: [
          { key: "showAuthorInfo", label: "Show Author Info", type: "boolean", default: true },
          { key: "showEngagement", label: "Show Likes/Comments", type: "boolean", default: true },
          { key: "showPostType", label: "Show Post Type Badge", type: "boolean", default: true },
          { key: "showPinnedFirst", label: "Show Pinned First", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "study.groups": {
    sections: [
      {
        title: "Display",
        icon: "👥",
        fields: [
          { key: "maxItems", label: "Max Groups", type: "number", min: 1, max: 20, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards"], default: "list" },
          { key: "filterType", label: "Filter by Type", type: "select", options: ["all", "study", "project", "exam_prep", "homework", "discussion", "tutoring"], default: "all" },
          { key: "showMyGroupsOnly", label: "Show My Groups Only", type: "boolean", default: false },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Group Details",
        icon: "📋",
        fields: [
          { key: "showMemberCount", label: "Show Member Count", type: "boolean", default: true },
          { key: "showSubject", label: "Show Subject", type: "boolean", default: true },
          { key: "showNextMeeting", label: "Show Next Meeting", type: "boolean", default: true },
          { key: "showGroupType", label: "Show Group Type Badge", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "peer.matches": {
    sections: [
      {
        title: "Display",
        icon: "🔍",
        fields: [
          { key: "maxItems", label: "Max Matches", type: "number", min: 1, max: 20, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards"], default: "list" },
          { key: "filterType", label: "Filter by Type", type: "select", options: ["all", "study_buddy", "subject_expert", "goal_partner", "mentor", "mentee", "project_partner"], default: "all" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Match Details",
        icon: "📋",
        fields: [
          { key: "showMatchScore", label: "Show Match Score", type: "boolean", default: true },
          { key: "showCommonSubjects", label: "Show Common Subjects", type: "boolean", default: true },
          { key: "showPeerStats", label: "Show Peer Stats", type: "boolean", default: true },
          { key: "showOnlineStatus", label: "Show Online Status", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "analytics.snapshot": {
    sections: [
      {
        title: "This Week Overview",
        icon: "📊",
        fields: [
          { key: "showThisWeek", label: "Show This Week Section", type: "boolean", default: true },
          { key: "showTrends", label: "Show Trend Indicators", type: "boolean", default: true },
        ],
      },
      {
        title: "Subject Analytics",
        icon: "📚",
        fields: [
          { key: "showSubjects", label: "Show Subject Breakdown", type: "boolean", default: true },
          { key: "maxSubjects", label: "Max Subjects to Show", type: "number", min: 1, max: 6, default: 3 },
        ],
      },
      {
        title: "Streak & Focus",
        icon: "🔥",
        fields: [
          { key: "showStreak", label: "Show Streak & Focus", type: "boolean", default: true },
        ],
      },
      {
        title: "Recommendations",
        icon: "💡",
        fields: [
          { key: "showRecommendations", label: "Show Suggestions", type: "boolean", default: true },
        ],
      },
      {
        title: "Display",
        icon: "📐",
        fields: [
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "quests.active": {
    sections: [
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxQuests", label: "Max Quests to Show", type: "number", min: 1, max: 10, default: 3 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Quest Types",
        icon: "🎯",
        fields: [
          { key: "showDaily", label: "Show Daily Quests", type: "boolean", default: true },
          { key: "showWeekly", label: "Show Weekly Quests", type: "boolean", default: true },
        ],
      },
      {
        title: "Details",
        icon: "📊",
        fields: [
          { key: "showProgress", label: "Show Progress Bar", type: "boolean", default: true },
          { key: "showXPReward", label: "Show XP Reward", type: "boolean", default: true },
          { key: "showSummary", label: "Show Summary Banner", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "weak.topics": {
    sections: [
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxTopics", label: "Max Topics to Show", type: "number", min: 1, max: 10, default: 4 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Content",
        icon: "📊",
        fields: [
          { key: "showScore", label: "Show Mastery Score", type: "boolean", default: true },
          { key: "showDifficulty", label: "Show Difficulty Badge", type: "boolean", default: true },
          { key: "showSubject", label: "Show Subject Name", type: "boolean", default: true },
          { key: "showChapter", label: "Show Chapter Name", type: "boolean", default: false },
        ],
      },
      {
        title: "Sorting",
        icon: "🔄",
        fields: [
          { key: "sortBy", label: "Sort By", type: "select", options: ["score", "attempts", "recent"], default: "score" },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showPracticeButton", label: "Show Practice Button", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "peers.leaderboard": {
    sections: [
      {
        title: "Scope",
        icon: "🌍",
        fields: [
          { key: "scope", label: "Default Scope", type: "select", options: ["class", "school", "global"], default: "school" },
          { key: "showScope", label: "Show Scope Tabs", type: "boolean", default: true },
        ],
      },
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxEntries", label: "Max Entries to Show", type: "number", min: 3, max: 10, default: 5 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "My Rank",
        icon: "👤",
        fields: [
          { key: "showMyRank", label: "Show My Rank Card", type: "boolean", default: true },
          { key: "showPercentile", label: "Show Percentile", type: "boolean", default: true },
        ],
      },
      {
        title: "Stats",
        icon: "📊",
        fields: [
          { key: "showXP", label: "Show XP", type: "boolean", default: true },
          { key: "showStreak", label: "Show Streak", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "continue.learning": {
    sections: [
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxItems", label: "Max Items to Show", type: "number", min: 2, max: 6, default: 4 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["horizontal", "vertical"], default: "horizontal" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Content",
        icon: "📚",
        fields: [
          { key: "showProgress", label: "Show Progress Bar", type: "boolean", default: true },
          { key: "showTimeAgo", label: "Show Time Ago", type: "boolean", default: true },
          { key: "showType", label: "Show Item Type Badge", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "progress.weak-areas": {
    sections: [
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxTopics", label: "Max Topics to Show", type: "number", min: 1, max: 10, default: 4 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Topic Details",
        icon: "📊",
        fields: [
          { key: "showScore", label: "Show Mastery Score", type: "boolean", default: true },
          { key: "showDifficulty", label: "Show Difficulty Badge", type: "boolean", default: true },
          { key: "showSubject", label: "Show Subject Name", type: "boolean", default: true },
          { key: "showChapter", label: "Show Chapter Name", type: "boolean", default: false },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showPracticeButton", label: "Show Practice Button", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
      {
        title: "Sorting",
        icon: "🔄",
        fields: [
          { key: "sortBy", label: "Sort By", type: "select", options: ["score", "attempts", "recent"], default: "score" },
        ],
      },
    ],
  },
  // ============ PARENT WIDGETS ============
  "parent.children-overview": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["cards", "list", "grid"], default: "cards" },
        ],
      },
      {
        title: "Child Info",
        icon: "👤",
        fields: [
          { key: "showAvatar", label: "Show Avatar", type: "boolean", default: true },
          { key: "showClass", label: "Show Class/Section", type: "boolean", default: true },
          { key: "showAttendanceToday", label: "Show Today's Attendance", type: "boolean", default: true },
        ],
      },
      {
        title: "Quick Stats",
        icon: "📊",
        fields: [
          { key: "showQuickStats", label: "Show Quick Stats", type: "boolean", default: true },
          { key: "showAttendanceStat", label: "Show Attendance %", type: "boolean", default: true },
          { key: "showAssignmentsStat", label: "Show Pending Assignments", type: "boolean", default: true },
          { key: "showStreakStat", label: "Show Streak", type: "boolean", default: true },
          { key: "showTestsStat", label: "Show Upcoming Tests", type: "boolean", default: false },
          { key: "showXPStat", label: "Show XP", type: "boolean", default: false },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap to View Details", type: "boolean", default: true },
          { key: "showViewAll", label: "Show View All Button", type: "boolean", default: false },
        ],
      },
    ],
  },
  "parent.attendance-summary": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["cards", "list", "compact"], default: "cards" },
        ],
      },
      {
        title: "Today's Status",
        icon: "📅",
        fields: [
          { key: "showTodayStatus", label: "Show Today's Status Badge", type: "boolean", default: true },
          { key: "showCheckInTime", label: "Show Check-in Time", type: "boolean", default: false },
        ],
      },
      {
        title: "Weekly Summary",
        icon: "📊",
        fields: [
          { key: "showWeekSummary", label: "Show This Week Stats", type: "boolean", default: true },
          { key: "showRecentDays", label: "Show Recent Days Indicator", type: "boolean", default: false },
          { key: "maxRecentDays", label: "Days to Show", type: "number", min: 3, max: 7, default: 5 },
        ],
      },
      {
        title: "Monthly Stats",
        icon: "📈",
        fields: [
          { key: "showMonthStats", label: "Show This Month Stats", type: "boolean", default: true },
          { key: "showPercentage", label: "Show Attendance Percentage", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap to View Details", type: "boolean", default: true },
          { key: "showViewAll", label: "Show View All Button", type: "boolean", default: false },
        ],
      },
    ],
  },
  "parent.fee-alerts": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Items to Show", type: "number", min: 1, max: 10, default: 5 },
        ],
      },
      {
        title: "Display",
        icon: "💰",
        fields: [
          { key: "showTotalSummary", label: "Show Total Summary Banner", type: "boolean", default: true },
          { key: "showOverdueFirst", label: "Show Overdue First", type: "boolean", default: true },
          { key: "showAmount", label: "Show Amount", type: "boolean", default: true },
          { key: "showDueDate", label: "Show Due Date", type: "boolean", default: true },
          { key: "showFeeType", label: "Show Fee Type Icon", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showPayButton", label: "Show Pay Now Button", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap to View Details", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.notifications-preview": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Items to Show", type: "number", min: 1, max: 10, default: 5 },
        ],
      },
      {
        title: "Display",
        icon: "🔔",
        fields: [
          { key: "showUnreadBadge", label: "Show Unread Badge", type: "boolean", default: true },
          { key: "showUnreadFirst", label: "Show Unread First", type: "boolean", default: true },
          { key: "showCategory", label: "Show Category Badge", type: "boolean", default: true },
          { key: "showTime", label: "Show Time Ago", type: "boolean", default: true },
          { key: "showPriority", label: "Show Priority Indicator", type: "boolean", default: true },
          { key: "showPreview", label: "Show Message Preview", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap to View Details", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.ai-insights-preview": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Items to Show", type: "number", min: 1, max: 10, default: 4 },
        ],
      },
      {
        title: "Display",
        icon: "🧠",
        fields: [
          { key: "showHighPriorityFirst", label: "Show High Priority First", type: "boolean", default: true },
          { key: "showDescription", label: "Show Description", type: "boolean", default: true },
          { key: "showCategory", label: "Show Insight Type Badge", type: "boolean", default: true },
          { key: "showUnreadBadge", label: "Show Unread Indicator", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showActionButton", label: "Show Action Button", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap to View Details", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.quick-actions": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "columns", label: "Number of Columns", type: "select", options: ["2", "3"], default: "2" },
          { key: "style", label: "Button Style", type: "select", options: ["filled", "outlined", "minimal"], default: "filled" },
        ],
      },
      {
        title: "Display",
        icon: "⚡",
        fields: [
          { key: "maxActions", label: "Max Actions to Show", type: "number", min: 2, max: 8, default: 6 },
          { key: "showLabels", label: "Show Labels", type: "boolean", default: true },
          { key: "iconSize", label: "Icon Size", type: "select", options: ["small", "medium", "large"], default: "medium" },
        ],
      },
      {
        title: "Actions",
        icon: "🎯",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.child-progress": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxSubjects", label: "Max Subjects to Show", type: "number", min: 2, max: 8, default: 4 },
        ],
      },
      {
        title: "Summary",
        icon: "📊",
        fields: [
          { key: "showOverallProgress", label: "Show Overall Progress", type: "boolean", default: true },
          { key: "showHoursStudied", label: "Show Hours Studied", type: "boolean", default: true },
        ],
      },
      {
        title: "Subject Details",
        icon: "📚",
        fields: [
          { key: "showProgressBar", label: "Show Progress Bar", type: "boolean", default: true },
          { key: "showTestStats", label: "Show Test Stats", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap to View Details", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.child-stats": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["grid", "list", "cards"], default: "grid" },
          { key: "columns", label: "Columns (Grid)", type: "select", options: ["2", "3"], default: "2" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Stats to Show",
        icon: "📊",
        fields: [
          { key: "showXP", label: "Show XP Points", type: "boolean", default: true },
          { key: "showStreak", label: "Show Streak", type: "boolean", default: true },
          { key: "showBadges", label: "Show Badges", type: "boolean", default: true },
          { key: "showStudyTime", label: "Show Study Time", type: "boolean", default: true },
          { key: "showTests", label: "Show Tests Passed", type: "boolean", default: true },
          { key: "showAssignments", label: "Show Assignments", type: "boolean", default: true },
        ],
      },
      {
        title: "Display",
        icon: "🎨",
        fields: [
          { key: "showTrends", label: "Show Trend Indicators", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.weak-areas": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxTopics", label: "Max Topics to Show", type: "number", min: 1, max: 10, default: 4 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Topic Details",
        icon: "📊",
        fields: [
          { key: "showScore", label: "Show Mastery Score", type: "boolean", default: true },
          { key: "showDifficulty", label: "Show Difficulty Badge", type: "boolean", default: true },
          { key: "showSubject", label: "Show Subject Name", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showPracticeButton", label: "Show Practice Button", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.performance-chart": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["stacked", "tabs", "compact"], default: "stacked" },
          { key: "chartType", label: "Chart Type", type: "select", options: ["bar", "progress", "both"], default: "bar" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Score Summary",
        icon: "🎯",
        fields: [
          { key: "showAverageScore", label: "Show Average Score", type: "boolean", default: true },
          { key: "showBestScore", label: "Show Best Score", type: "boolean", default: true },
        ],
      },
      {
        title: "Subject Scores",
        icon: "📊",
        fields: [
          { key: "showSubjectScores", label: "Show Subject Scores", type: "boolean", default: true },
          { key: "maxSubjects", label: "Max Subjects to Show", type: "number", min: 1, max: 10, default: 5 },
        ],
      },
      {
        title: "Weekly Progress",
        icon: "📈",
        fields: [
          { key: "showWeeklyProgress", label: "Show Weekly XP Progress", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.assignments-pending": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Items to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Assignment Details",
        icon: "📋",
        fields: [
          { key: "showSubject", label: "Show Subject", type: "boolean", default: true },
          { key: "showDueDate", label: "Show Due Date", type: "boolean", default: true },
          { key: "showPoints", label: "Show Points/Marks", type: "boolean", default: true },
          { key: "showType", label: "Show Assignment Type", type: "boolean", default: true },
        ],
      },
      {
        title: "Alerts",
        icon: "⚠️",
        fields: [
          { key: "showOverdueBadge", label: "Show Overdue Badge", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.subject-progress": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxSubjects", label: "Max Subjects to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Summary",
        icon: "📊",
        fields: [
          { key: "showOverallProgress", label: "Show Overall Progress", type: "boolean", default: true },
          { key: "showStudyHours", label: "Show Study Hours", type: "boolean", default: true },
        ],
      },
      {
        title: "Subject Details",
        icon: "📚",
        fields: [
          { key: "showProgressBar", label: "Show Progress Bar", type: "boolean", default: true },
          { key: "showScore", label: "Show Score Percentage", type: "boolean", default: true },
          { key: "showChapters", label: "Show Chapters Stats", type: "boolean", default: true },
          { key: "showTests", label: "Show Test Stats", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.report-card-preview": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxSubjects", label: "Max Subjects to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Grade Summary",
        icon: "🎓",
        fields: [
          { key: "showOverallGrade", label: "Show Overall Grade", type: "boolean", default: true },
          { key: "showAverageScore", label: "Show Average Score", type: "boolean", default: true },
          { key: "showBestScore", label: "Show Best Score", type: "boolean", default: true },
          { key: "showPassRate", label: "Show Pass Rate", type: "boolean", default: true },
          { key: "showTerm", label: "Show Term Badge", type: "boolean", default: true },
        ],
      },
      {
        title: "Subject Grades",
        icon: "📚",
        fields: [
          { key: "showSubjectGrades", label: "Show Subject Grades", type: "boolean", default: true },
          { key: "showGradePoints", label: "Show Grade Points", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.messages-inbox": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Messages to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Display",
        icon: "📧",
        fields: [
          { key: "showUnreadBadge", label: "Show Unread Badge", type: "boolean", default: true },
          { key: "showUnreadFirst", label: "Show Unread First", type: "boolean", default: true },
          { key: "showCategory", label: "Show Category Badge", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "showPriority", label: "Show Priority Badge", type: "boolean", default: true },
          { key: "showPreview", label: "Show Message Preview", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.announcements": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Announcements to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Display",
        icon: "📢",
        fields: [
          { key: "showPinnedFirst", label: "Show Pinned First", type: "boolean", default: true },
          { key: "showPinnedBadge", label: "Show Pinned Badge", type: "boolean", default: true },
          { key: "showCategory", label: "Show Category Badge", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "showPriority", label: "Show Priority Badge", type: "boolean", default: true },
          { key: "showPreview", label: "Show Content Preview", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.teacher-contacts": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Teachers to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Display",
        icon: "👨‍🏫",
        fields: [
          { key: "showClassTeacherFirst", label: "Show Class Teacher First", type: "boolean", default: true },
          { key: "showAvailability", label: "Show Availability Status", type: "boolean", default: true },
          { key: "showSubject", label: "Show Subject", type: "boolean", default: true },
          { key: "showOfficeHours", label: "Show Office Hours", type: "boolean", default: false },
        ],
      },
      {
        title: "Contact Options",
        icon: "📞",
        fields: [
          { key: "showContactButtons", label: "Show Contact Buttons", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.fee-summary": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Fees to Show", type: "number", min: 1, max: 10, default: 5 },
        ],
      },
      {
        title: "Summary",
        icon: "💰",
        fields: [
          { key: "showTotalSummary", label: "Show Total Summary", type: "boolean", default: true },
          { key: "showOverdueFirst", label: "Show Overdue First", type: "boolean", default: true },
        ],
      },
      {
        title: "Fee Details",
        icon: "📋",
        fields: [
          { key: "showFeeType", label: "Show Fee Type Icon", type: "boolean", default: true },
          { key: "showAmount", label: "Show Amount", type: "boolean", default: true },
          { key: "showDueDate", label: "Show Due Date", type: "boolean", default: true },
          { key: "showProgressBar", label: "Show Progress Bar (Partial)", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showPayButton", label: "Show Pay Button", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.pending-fees": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Fees to Show", type: "number", min: 1, max: 10, default: 4 },
        ],
      },
      {
        title: "Display",
        icon: "💰",
        fields: [
          { key: "showOverdueCount", label: "Show Overdue Alert Banner", type: "boolean", default: true },
          { key: "showFeeType", label: "Show Fee Type Icon", type: "boolean", default: true },
          { key: "showAmount", label: "Show Amount", type: "boolean", default: true },
          { key: "showDueDate", label: "Show Due Date", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showPayButton", label: "Show Pay Button", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.payment-history": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Payments to Show", type: "number", min: 1, max: 10, default: 5 },
        ],
      },
      {
        title: "Summary",
        icon: "📊",
        fields: [
          { key: "showTotalSummary", label: "Show Total Summary Header", type: "boolean", default: true },
        ],
      },
      {
        title: "Payment Details",
        icon: "💳",
        fields: [
          { key: "showAmount", label: "Show Amount", type: "boolean", default: true },
          { key: "showPaymentMethod", label: "Show Payment Method", type: "boolean", default: true },
          { key: "showReceiptNumber", label: "Show Receipt Number", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.ai-predictions": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Predictions to Show", type: "number", min: 1, max: 10, default: 4 },
        ],
      },
      {
        title: "Display",
        icon: "🧠",
        fields: [
          { key: "showConfidence", label: "Show Confidence Score", type: "boolean", default: true },
          { key: "showRecommendation", label: "Show Recommendation", type: "boolean", default: true },
          { key: "showPriority", label: "Show Priority Badge", type: "boolean", default: true },
          { key: "showUnreadFirst", label: "Show Unread First", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.ai-recommendations": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Recommendations to Show", type: "number", min: 1, max: 10, default: 4 },
        ],
      },
      {
        title: "Display",
        icon: "💡",
        fields: [
          { key: "showDescription", label: "Show Description", type: "boolean", default: true },
          { key: "showActionButton", label: "Show Action Button", type: "boolean", default: true },
          { key: "showPriority", label: "Show Priority Badge", type: "boolean", default: true },
          { key: "showRelevance", label: "Show Relevance Score", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.ai-alerts": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Alerts to Show", type: "number", min: 1, max: 10, default: 4 },
        ],
      },
      {
        title: "Display",
        icon: "🚨",
        fields: [
          { key: "showDescription", label: "Show Description", type: "boolean", default: true },
          { key: "showActionRequired", label: "Show Action Required", type: "boolean", default: true },
          { key: "showSeverity", label: "Show Severity Badge", type: "boolean", default: true },
          { key: "showCriticalFirst", label: "Show Critical First", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "parent.comparison-analytics": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards", "compact"], default: "list" },
          { key: "maxItems", label: "Max Metrics to Show", type: "number", min: 1, max: 10, default: 5 },
          { key: "comparisonType", label: "Comparison Type", type: "select", options: ["class_average", "grade_level", "historical"], default: "class_average" },
        ],
      },
      {
        title: "Display",
        icon: "📊",
        fields: [
          { key: "showInsights", label: "Show Insights", type: "boolean", default: true },
          { key: "showTrend", label: "Show Trend Indicator", type: "boolean", default: true },
          { key: "showPercentile", label: "Show Percentile/Rank", type: "boolean", default: true },
          { key: "showComparisonBar", label: "Show Comparison Bar", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  // ============ ADMIN WIDGETS ============
  "admin.hero-card": {
    sections: [
      {
        title: "User Info",
        icon: "👤",
        fields: [
          { key: "showAvatar", label: "Show Avatar", type: "boolean", default: true },
          { key: "avatarStyle", label: "Avatar Style", type: "select", options: ["circle", "rounded", "square"], default: "circle" },
        ],
      },
      {
        title: "Quick Stats",
        icon: "📊",
        fields: [
          { key: "showQuickStats", label: "Show Quick Stats", type: "boolean", default: true },
          { key: "statsLayout", label: "Stats Layout", type: "select", options: ["horizontal", "grid"], default: "horizontal" },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showNotificationBadge", label: "Show Notification Badge", type: "boolean", default: true },
          { key: "showSettingsButton", label: "Show Settings Button", type: "boolean", default: true },
        ],
      },
    ],
  },
  "admin.stats-grid": {
    sections: [
      {
        title: "Stats Visibility",
        icon: "📊",
        fields: [
          { key: "showTotalUsers", label: "Show Total Users", type: "boolean", default: true },
          { key: "showActiveUsers", label: "Show Active Users", type: "boolean", default: true },
          { key: "showTotalRevenue", label: "Show Total Revenue", type: "boolean", default: true },
          { key: "showSystemAlerts", label: "Show System Alerts", type: "boolean", default: true },
        ],
      },
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "columns", label: "Columns", type: "select", options: ["2", "3", "4"], default: "2" },
          { key: "showIcons", label: "Show Icons", type: "boolean", default: true },
          { key: "showTrend", label: "Show Trend Indicators", type: "boolean", default: true },
        ],
      },
      {
        title: "Interaction",
        icon: "👆",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
        ],
      },
    ],
  },
  "admin.system-health": {
    sections: [
      {
        title: "Metrics Visibility",
        icon: "📊",
        fields: [
          { key: "showUptime", label: "Show Uptime", type: "boolean", default: true },
          { key: "showActiveUsers", label: "Show Active Users", type: "boolean", default: true },
          { key: "showServerLoad", label: "Show CPU Usage", type: "boolean", default: true },
          { key: "showApiStatus", label: "Show Memory Usage", type: "boolean", default: true },
        ],
      },
      {
        title: "Thresholds",
        icon: "⚠️",
        fields: [
          { key: "warningThreshold", label: "Warning Threshold (%)", type: "number", min: 50, max: 90, default: 70 },
          { key: "criticalThreshold", label: "Critical Threshold (%)", type: "number", min: 70, max: 100, default: 90 },
        ],
      },
      {
        title: "Refresh",
        icon: "🔄",
        fields: [
          { key: "autoRefresh", label: "Auto Refresh", type: "boolean", default: true },
          { key: "refreshInterval", label: "Refresh Interval (seconds)", type: "number", min: 10, max: 300, default: 30 },
        ],
      },
      {
        title: "Display",
        icon: "👁️",
        fields: [
          { key: "showDetailsLink", label: "Show Details Link", type: "boolean", default: true },
        ],
      },
    ],
  },
  "admin.alerts": {
    sections: [
      {
        title: "Display",
        icon: "🔔",
        fields: [
          { key: "maxItems", label: "Max Alerts to Show", type: "number", min: 1, max: 20, default: 5 },
          { key: "severityFilter", label: "Severity Filter", type: "select", options: ["all", "critical", "warning", "info"], default: "all" },
          { key: "showAcknowledged", label: "Show Acknowledged Alerts", type: "boolean", default: false },
        ],
      },
      {
        title: "Alert Details",
        icon: "📋",
        fields: [
          { key: "showSeverity", label: "Show Severity Badge", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "showSource", label: "Show Source", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap Navigation", type: "boolean", default: true },
          { key: "showAcknowledge", label: "Show Acknowledge Button", type: "boolean", default: true },
          { key: "showViewAll", label: "Show View All Link", type: "boolean", default: true },
          { key: "showDismiss", label: "Show Dismiss Button", type: "boolean", default: false },
        ],
      },
    ],
  },
  "admin.quick-actions": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "columns", label: "Number of Columns", type: "select", options: ["2", "3", "4"], default: "2" },
          { key: "style", label: "Button Style", type: "select", options: ["filled", "outlined", "minimal"], default: "filled" },
          { key: "iconSize", label: "Icon Size", type: "select", options: ["small", "medium", "large"], default: "medium" },
        ],
      },
      {
        title: "Display",
        icon: "👁️",
        fields: [
          { key: "showLabels", label: "Show Labels", type: "boolean", default: true },
          { key: "showIcons", label: "Show Icons", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions Visibility",
        icon: "⚡",
        fields: [
          { key: "showAddUser", label: "Show Add User", type: "boolean", default: true },
          { key: "showReports", label: "Show Reports", type: "boolean", default: true },
          { key: "showSettings", label: "Show Settings", type: "boolean", default: true },
          { key: "showAudit", label: "Show Audit Logs", type: "boolean", default: true },
        ],
      },
    ],
  },
  "admin.recent-activity": {
    sections: [
      {
        title: "Display",
        icon: "📊",
        fields: [
          { key: "maxItems", label: "Max Items", type: "number", min: 3, max: 15, default: 5 },
          { key: "showAvatar", label: "Show Avatar", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "showIcon", label: "Show Activity Icon", type: "boolean", default: true },
        ],
      },
      {
        title: "Filtering",
        icon: "🔍",
        fields: [
          { key: "typeFilter", label: "Activity Type", type: "select", options: ["all", "user_created", "user_updated", "payment_received", "setting_changed", "login", "content_created"], default: "all" },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap", type: "boolean", default: true },
          { key: "showViewAll", label: "Show View All", type: "boolean", default: true },
        ],
      },
    ],
  },
  // ============ ADMIN USER MANAGEMENT WIDGETS ============
  "users.pending-approvals": {
    sections: [
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxItems", label: "Max Items", type: "number", min: 3, max: 15, default: 5 },
          { key: "showOrganization", label: "Show Organization", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showQuickActions", label: "Show Quick Actions", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap to View", type: "boolean", default: true },
        ],
      },
    ],
  },
  "users.bulk-actions": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "columns", label: "Number of Columns", type: "select", options: ["2", "3"], default: "2" },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Display",
        icon: "👁️",
        fields: [
          { key: "showLabels", label: "Show Labels", type: "boolean", default: true },
          { key: "showCounts", label: "Show User Counts", type: "boolean", default: true },
        ],
      },
    ],
  },
  "users.recent-registrations": {
    sections: [
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxItems", label: "Max Items", type: "number", min: 3, max: 15, default: 5 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["list", "cards"], default: "list" },
        ],
      },
      {
        title: "User Info",
        icon: "👤",
        fields: [
          { key: "showAvatar", label: "Show Avatar", type: "boolean", default: true },
          { key: "showRole", label: "Show Role Badge", type: "boolean", default: true },
          { key: "showStatus", label: "Show Status", type: "boolean", default: true },
          { key: "showTime", label: "Show Registration Time", type: "boolean", default: true },
          { key: "showEmail", label: "Show Email", type: "boolean", default: false },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap to View", type: "boolean", default: true },
          { key: "showViewAll", label: "Show View All Link", type: "boolean", default: true },
        ],
      },
    ],
  },
  "finance.revenue-summary": {
    sections: [
      {
        title: "Revenue Display",
        icon: "💰",
        fields: [
          { key: "showTotalRevenue", label: "Show Total Revenue", type: "boolean", default: true },
          { key: "showGrowthPercentage", label: "Show Growth Percentage", type: "boolean", default: true },
          { key: "abbreviateNumbers", label: "Abbreviate Numbers (K/L/Cr)", type: "boolean", default: true },
        ],
      },
      {
        title: "Period Selection",
        icon: "📅",
        fields: [
          { key: "showPeriodSelector", label: "Show Period Selector", type: "boolean", default: true },
          { key: "defaultPeriod", label: "Default Period", type: "select", options: ["today", "week", "month", "quarter", "year"], default: "month" },
        ],
      },
      {
        title: "Breakdown",
        icon: "📊",
        fields: [
          { key: "showBreakdown", label: "Show Revenue Breakdown", type: "boolean", default: true },
          { key: "showComparison", label: "Show Comparison Stats", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showViewDetails", label: "Show View Details Link", type: "boolean", default: true },
        ],
      },
    ],
  },
  "finance.expense-summary": {
    sections: [
      {
        title: "Expense Display",
        icon: "💸",
        fields: [
          { key: "showTotalExpenses", label: "Show Total Expenses", type: "boolean", default: true },
          { key: "showGrowthPercentage", label: "Show Growth Percentage", type: "boolean", default: true },
          { key: "abbreviateNumbers", label: "Abbreviate Numbers (K/L/Cr)", type: "boolean", default: true },
        ],
      },
      {
        title: "Period Selection",
        icon: "📅",
        fields: [
          { key: "showPeriodSelector", label: "Show Period Selector", type: "boolean", default: true },
          { key: "defaultPeriod", label: "Default Period", type: "select", options: ["week", "month", "quarter", "year"], default: "month" },
        ],
      },
      {
        title: "Breakdown",
        icon: "📊",
        fields: [
          { key: "showBreakdown", label: "Show Category Breakdown", type: "boolean", default: true },
          { key: "showPendingExpenses", label: "Show Pending & Stats", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showViewDetails", label: "Show View Details Link", type: "boolean", default: true },
        ],
      },
    ],
  },
  "finance.collection-rate": {
    sections: [
      {
        title: "Collection Display",
        icon: "📊",
        fields: [
          { key: "showProgressBar", label: "Show Progress Bar", type: "boolean", default: true },
          { key: "showAmounts", label: "Show Amount Breakdown", type: "boolean", default: true },
          { key: "showTrendIndicator", label: "Show Status Indicator", type: "boolean", default: true },
          { key: "abbreviateNumbers", label: "Abbreviate Numbers (K/L/Cr)", type: "boolean", default: true },
        ],
      },
      {
        title: "Period Selection",
        icon: "📅",
        fields: [
          { key: "showPeriodSelector", label: "Show Period Selector", type: "boolean", default: true },
          { key: "defaultPeriod", label: "Default Period", type: "select", options: ["week", "month", "quarter", "year"], default: "month" },
        ],
      },
      {
        title: "Thresholds",
        icon: "🎯",
        fields: [
          { key: "thresholdGood", label: "Good Rate Threshold (%)", type: "number", min: 50, max: 100, default: 80 },
          { key: "thresholdWarning", label: "Warning Rate Threshold (%)", type: "number", min: 30, max: 90, default: 60 },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showViewDetails", label: "Show View Details Link", type: "boolean", default: true },
        ],
      },
    ],
  },
  "admin.student-fees-dashboard": {
    sections: [
      {
        title: "Display Options",
        icon: "📊",
        fields: [
          { key: "showCollectionRate", label: "Show Collection Rate Progress", type: "boolean", default: true },
          { key: "showTodayStats", label: "Show Today's Collection", type: "boolean", default: true },
          { key: "showOverdue", label: "Show Overdue Card", type: "boolean", default: true },
          { key: "cardStyle", label: "Card Style", type: "select", options: ["compact", "detailed"], default: "detailed" },
        ],
      },
      {
        title: "Overdue Settings",
        icon: "⚠️",
        fields: [
          { key: "overdueThresholdDays", label: "Overdue Threshold (Days)", type: "number", min: 7, max: 90, default: 30 },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableReminder", label: "Enable Send Reminder Button", type: "boolean", default: true },
        ],
      },
    ],
  },
  "admin.fee-collection-trend": {
    sections: [
      {
        title: "Chart Options",
        icon: "📊",
        fields: [
          { key: "chartType", label: "Chart Type", type: "select", options: ["bar", "line", "area"], default: "bar" },
          { key: "showExpected", label: "Show Expected Amount", type: "boolean", default: true },
          { key: "monthsToShow", label: "Default Months", type: "select", options: ["6", "12"], default: "6" },
        ],
      },
      {
        title: "Display Options",
        icon: "👁️",
        fields: [
          { key: "showGrowth", label: "Show Growth Indicator", type: "boolean", default: true },
          { key: "showYearTotal", label: "Show Year Total Section", type: "boolean", default: true },
        ],
      },
    ],
  },
  "admin.teacher-payroll": {
    sections: [
      {
        title: "Display Options",
        icon: "👁️",
        fields: [
          { key: "showProgress", label: "Show Progress Bar", type: "boolean", default: true },
          { key: "showNextDue", label: "Show Next Payment Due", type: "boolean", default: true },
          { key: "showProcessButton", label: "Show Process Salaries Button", type: "boolean", default: true },
        ],
      },
      {
        title: "Alerts",
        icon: "🔔",
        fields: [
          { key: "alertOnOverdue", label: "Show Overdue Alerts", type: "boolean", default: true },
          { key: "overdueDays", label: "Overdue Threshold (days)", type: "number", min: 1, max: 30, default: 7 },
        ],
      },
    ],
  },
  "admin.batch-performance": {
    sections: [
      {
        title: "Display Options",
        icon: "👁️",
        fields: [
          { key: "topN", label: "Number of Batches", type: "number", min: 3, max: 10, default: 5 },
          { key: "showTrend", label: "Show Trend Indicator", type: "boolean", default: true },
          { key: "showStudentCount", label: "Show Student Count", type: "boolean", default: true },
          { key: "showOverallAvg", label: "Show Overall Average", type: "boolean", default: true },
          { key: "showRankBadges", label: "Show Rank Badges", type: "boolean", default: true },
        ],
      },
      {
        title: "Performance Thresholds",
        icon: "🎯",
        fields: [
          { key: "colorCodePerformance", label: "Color Code Performance", type: "boolean", default: true },
          { key: "excellentThreshold", label: "Excellent Threshold (%)", type: "number", min: 70, max: 100, default: 85 },
          { key: "goodThreshold", label: "Good Threshold (%)", type: "number", min: 50, max: 90, default: 70 },
        ],
      },
    ],
  },
  "admin.attendance-overview": {
    sections: [
      {
        title: "Display Options",
        icon: "👁️",
        fields: [
          { key: "showTeacherAttendance", label: "Show Teacher Attendance", type: "boolean", default: true },
          { key: "showAbsentList", label: "Show Absent List", type: "boolean", default: true },
          { key: "absentListLimit", label: "Absent List Limit", type: "number", min: 3, max: 10, default: 5 },
          { key: "showWeeklyTrend", label: "Show Weekly Trend", type: "boolean", default: true },
          { key: "showAlerts", label: "Show Alerts", type: "boolean", default: true },
        ],
      },
      {
        title: "Thresholds",
        icon: "🎯",
        fields: [
          { key: "lowAttendanceThreshold", label: "Low Attendance Threshold (%)", type: "number", min: 50, max: 95, default: 80 },
        ],
      },
    ],
  },
  "admin.admission-stats": {
    sections: [
      {
        title: "Display Options",
        icon: "👁️",
        fields: [
          { key: "showConversionRate", label: "Show Conversion Rate", type: "boolean", default: true },
          { key: "showProgramBreakdown", label: "Show Program Breakdown", type: "boolean", default: true },
          { key: "showPendingFollowUp", label: "Show Pending Follow-ups", type: "boolean", default: true },
          { key: "showTrends", label: "Show Trend Indicators", type: "boolean", default: true },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showAddButton", label: "Show Add Inquiry Button", type: "boolean", default: true },
        ],
      },
    ],
  },
  "analytics.kpi-grid": {
    sections: [
      {
        title: "Grid Layout",
        icon: "📊",
        fields: [
          { key: "columns", label: "Grid Columns", type: "select", options: ["1", "2", "3"], default: "2" },
          { key: "limit", label: "Max Metrics", type: "number", min: 1, max: 12, default: 6 },
        ],
      },
      {
        title: "Filtering",
        icon: "🔍",
        fields: [
          { key: "category", label: "Category Filter", type: "text", placeholder: "e.g., finance, users" },
          { key: "role", label: "Role Filter", type: "select", options: ["admin", "teacher", "parent", "student"], default: "admin" },
        ],
      },
      {
        title: "Display Options",
        icon: "👁️",
        fields: [
          { key: "showIcon", label: "Show Icons", type: "boolean", default: true },
          { key: "showTrend", label: "Show Trend Indicators", type: "boolean", default: true },
          { key: "showGrowth", label: "Show Growth Percentage", type: "boolean", default: true },
        ],
      },
    ],
  },
  // ============ ADMIN CONTENT WIDGETS ============
  "content.stats": {
    sections: [
      {
        title: "Display",
        icon: "📊",
        fields: [
          { key: "showTypeBreakdown", label: "Show Type Breakdown", type: "boolean", default: true },
          { key: "showStatusBreakdown", label: "Show Status Breakdown", type: "boolean", default: true },
          { key: "abbreviateNumbers", label: "Abbreviate Numbers", type: "boolean", default: true },
          { key: "maxTypes", label: "Max Types to Show", type: "number", min: 2, max: 8, default: 4 },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showViewDetails", label: "Show View Details Link", type: "boolean", default: true },
        ],
      },
    ],
  },
  "content.list": {
    sections: [
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxItems", label: "Max Items", type: "number", min: 5, max: 20, default: 10 },
          { key: "showSearch", label: "Show Search", type: "boolean", default: true },
          { key: "showFilters", label: "Show Filters", type: "boolean", default: true },
          { key: "showTypeFilter", label: "Show Type Filter", type: "boolean", default: true },
          { key: "showStatusFilter", label: "Show Status Filter", type: "boolean", default: true },
        ],
      },
      {
        title: "Content Info",
        icon: "📄",
        fields: [
          { key: "showViews", label: "Show View Count", type: "boolean", default: true },
          { key: "showRating", label: "Show Rating", type: "boolean", default: true },
          { key: "showDuration", label: "Show Duration", type: "boolean", default: true },
          { key: "showCategory", label: "Show Category", type: "boolean", default: true },
        ],
      },
      {
        title: "Default Filters",
        icon: "🔍",
        fields: [
          { key: "defaultTypeFilter", label: "Default Type Filter", type: "select", options: ["all", "course", "lesson", "video", "quiz", "resource", "assessment", "document"], default: "all" },
          { key: "defaultStatusFilter", label: "Default Status Filter", type: "select", options: ["all", "published", "draft", "review", "archived"], default: "all" },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap to View", type: "boolean", default: true },
        ],
      },
    ],
  },
  "content.categories": {
    sections: [
      {
        title: "Display",
        icon: "📋",
        fields: [
          { key: "maxCategories", label: "Max Categories", type: "number", min: 4, max: 12, default: 8 },
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["grid", "list"], default: "grid" },
          { key: "columns", label: "Grid Columns", type: "number", min: 2, max: 4, default: 2 },
        ],
      },
      {
        title: "Category Info",
        icon: "📁",
        fields: [
          { key: "showCount", label: "Show Item Count", type: "boolean", default: true },
          { key: "showViews", label: "Show Total Views", type: "boolean", default: true },
          { key: "showRating", label: "Show Avg Rating", type: "boolean", default: true },
          { key: "showPublished", label: "Show Published Count", type: "boolean", default: false },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "showViewAll", label: "Show View All", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap to Filter", type: "boolean", default: true },
        ],
      },
    ],
  },
  // ============ ADMIN PROFILE WIDGETS ============
  "admin.profile-activity": {
    sections: [
      {
        title: "Layout",
        icon: "📐",
        fields: [
          { key: "layoutStyle", label: "Layout Style", type: "select", options: ["timeline", "list", "cards"], default: "timeline" },
          { key: "maxItems", label: "Max Items", type: "number", min: 5, max: 20, default: 10 },
          { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
        ],
      },
      {
        title: "Display",
        icon: "📊",
        fields: [
          { key: "showTodayStats", label: "Show Today's Stats Banner", type: "boolean", default: true },
          { key: "showTime", label: "Show Time", type: "boolean", default: true },
          { key: "showGroupHeaders", label: "Group by Date", type: "boolean", default: true },
          { key: "showIcon", label: "Show Activity Icons", type: "boolean", default: true },
          { key: "showDescription", label: "Show Description", type: "boolean", default: true },
          { key: "showIpAddress", label: "Show IP Address", type: "boolean", default: false },
        ],
      },
      {
        title: "Filtering",
        icon: "🔍",
        fields: [
          { key: "typeFilter", label: "Activity Type Filter", type: "select", options: ["all", "user_created", "user_updated", "user_suspended", "payment_received", "setting_changed", "login", "logout", "content_created", "content_updated", "alert_acknowledged", "report_generated", "bulk_action", "permission_changed"], default: "all" },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { key: "enableTap", label: "Enable Tap to View", type: "boolean", default: true },
          { key: "showViewAll", label: "Show View All Link", type: "boolean", default: true },
        ],
      },
    ],
  },
  // ============ MEDIA WIDGETS ============
  "media.banner": {
    sections: [
      {
        title: "Media Source",
        icon: "🖼️",
        fields: [
          { key: "mediaType", label: "Media Type", type: "select", options: ["image", "video", "youtube", "carousel", "lottie"], default: "image" },
          { key: "mediaUrl", label: "Media URL", type: "text", placeholder: "https://example.com/image.jpg" },
          { key: "bannerId", label: "Banner ID (from DB)", type: "text", placeholder: "Optional: fetch from database" },
          { key: "slot", label: "Slot Name (from DB)", type: "text", placeholder: "e.g., dashboard-top, promo-1" },
        ],
      },
      {
        title: "Content Overlay",
        icon: "📝",
        fields: [
          { key: "title", label: "Title", type: "text", placeholder: "Banner title" },
          { key: "subtitle", label: "Subtitle", type: "text", placeholder: "Banner subtitle" },
          { key: "ctaText", label: "CTA Button Text", type: "text", placeholder: "e.g., Learn More" },
          { key: "ctaAction", label: "CTA Action", type: "select", options: ["navigate", "link", "video"], default: "navigate" },
          { key: "ctaUrl", label: "CTA URL/Screen", type: "text", placeholder: "Screen name or URL" },
        ],
      },
      {
        title: "Display Options",
        icon: "🎨",
        fields: [
          { key: "aspectRatio", label: "Aspect Ratio", type: "select", options: ["16:9", "4:3", "1:1", "21:9", "9:16"], default: "16:9" },
          { key: "borderRadius", label: "Border Radius", type: "number", min: 0, max: 32, default: 12 },
          { key: "fullWidth", label: "Full Width (edge-to-edge)", type: "boolean", default: false },
          { key: "showOverlay", label: "Show Content Overlay", type: "boolean", default: true },
          { key: "overlayGradient", label: "Gradient Overlay", type: "boolean", default: true },
        ],
      },
      {
        title: "Video/Carousel Options",
        icon: "🎬",
        fields: [
          { key: "autoPlay", label: "Auto Play", type: "boolean", default: true },
          { key: "autoPlayInterval", label: "Auto Play Interval (ms)", type: "number", min: 2000, max: 15000, default: 5000 },
          { key: "loop", label: "Loop", type: "boolean", default: true },
          { key: "showPlayButton", label: "Show Play Button (video)", type: "boolean", default: true },
          { key: "showIndicators", label: "Show Carousel Indicators", type: "boolean", default: true },
          { key: "showControls", label: "Show Navigation Arrows", type: "boolean", default: true },
        ],
      },
      {
        title: "Interaction",
        icon: "👆",
        fields: [
          { key: "enableTap", label: "Enable Tap Action", type: "boolean", default: true },
        ],
      },
    ],
  },
  "media.banner-1": {
    sections: [
      {
        title: "Media Source",
        icon: "🖼️",
        fields: [
          { key: "mediaType", label: "Media Type", type: "select", options: ["image", "video", "youtube", "carousel"], default: "image" },
          { key: "mediaUrl", label: "Media URL", type: "text", placeholder: "https://example.com/image.jpg" },
          { key: "slot", label: "Slot Name", type: "text", placeholder: "e.g., banner-1-slot" },
        ],
      },
      {
        title: "Content",
        icon: "📝",
        fields: [
          { key: "title", label: "Title", type: "text", placeholder: "Banner title" },
          { key: "subtitle", label: "Subtitle", type: "text", placeholder: "Banner subtitle" },
          { key: "ctaText", label: "CTA Button", type: "text", placeholder: "e.g., Learn More" },
          { key: "ctaUrl", label: "CTA URL/Screen", type: "text", placeholder: "Screen name or URL" },
        ],
      },
      {
        title: "Display",
        icon: "🎨",
        fields: [
          { key: "aspectRatio", label: "Aspect Ratio", type: "select", options: ["16:9", "4:3", "1:1", "21:9"], default: "16:9" },
          { key: "borderRadius", label: "Border Radius", type: "number", min: 0, max: 32, default: 12 },
          { key: "showOverlay", label: "Show Overlay", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap", type: "boolean", default: true },
        ],
      },
    ],
  },
  "media.banner-2": {
    sections: [
      {
        title: "Media Source",
        icon: "🖼️",
        fields: [
          { key: "mediaType", label: "Media Type", type: "select", options: ["image", "video", "youtube", "carousel"], default: "image" },
          { key: "mediaUrl", label: "Media URL", type: "text", placeholder: "https://example.com/image.jpg" },
          { key: "slot", label: "Slot Name", type: "text", placeholder: "e.g., banner-2-slot" },
        ],
      },
      {
        title: "Content",
        icon: "📝",
        fields: [
          { key: "title", label: "Title", type: "text", placeholder: "Banner title" },
          { key: "subtitle", label: "Subtitle", type: "text", placeholder: "Banner subtitle" },
          { key: "ctaText", label: "CTA Button", type: "text", placeholder: "e.g., Learn More" },
          { key: "ctaUrl", label: "CTA URL/Screen", type: "text", placeholder: "Screen name or URL" },
        ],
      },
      {
        title: "Display",
        icon: "🎨",
        fields: [
          { key: "aspectRatio", label: "Aspect Ratio", type: "select", options: ["16:9", "4:3", "1:1", "21:9"], default: "16:9" },
          { key: "borderRadius", label: "Border Radius", type: "number", min: 0, max: 32, default: 12 },
          { key: "showOverlay", label: "Show Overlay", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap", type: "boolean", default: true },
        ],
      },
    ],
  },
  "media.banner-3": {
    sections: [
      {
        title: "Media Source",
        icon: "🖼️",
        fields: [
          { key: "mediaType", label: "Media Type", type: "select", options: ["image", "video", "youtube", "carousel"], default: "image" },
          { key: "mediaUrl", label: "Media URL", type: "text", placeholder: "https://example.com/image.jpg" },
          { key: "slot", label: "Slot Name", type: "text", placeholder: "e.g., banner-3-slot" },
        ],
      },
      {
        title: "Content",
        icon: "📝",
        fields: [
          { key: "title", label: "Title", type: "text", placeholder: "Banner title" },
          { key: "subtitle", label: "Subtitle", type: "text", placeholder: "Banner subtitle" },
          { key: "ctaText", label: "CTA Button", type: "text", placeholder: "e.g., Learn More" },
          { key: "ctaUrl", label: "CTA URL/Screen", type: "text", placeholder: "Screen name or URL" },
        ],
      },
      {
        title: "Display",
        icon: "🎨",
        fields: [
          { key: "aspectRatio", label: "Aspect Ratio", type: "select", options: ["16:9", "4:3", "1:1", "21:9"], default: "16:9" },
          { key: "borderRadius", label: "Border Radius", type: "number", min: 0, max: 32, default: 12 },
          { key: "showOverlay", label: "Show Overlay", type: "boolean", default: true },
          { key: "enableTap", label: "Enable Tap", type: "boolean", default: true },
        ],
      },
    ],
  },
  "media.hero": {
    sections: [
      {
        title: "Hero Content",
        icon: "🖼️",
        fields: [
          { key: "mediaUrl", label: "Hero Image URL", type: "text", placeholder: "https://example.com/hero.jpg" },
          { key: "slot", label: "Slot Name", type: "text", placeholder: "e.g., hero-main" },
        ],
      },
      {
        title: "Content",
        icon: "📝",
        fields: [
          { key: "title", label: "Hero Title", type: "text", placeholder: "Welcome!" },
          { key: "subtitle", label: "Hero Subtitle", type: "text", placeholder: "Start your journey" },
          { key: "ctaText", label: "CTA Button", type: "text", placeholder: "Get Started" },
          { key: "ctaUrl", label: "CTA Screen", type: "text", placeholder: "dashboard" },
        ],
      },
      {
        title: "Display",
        icon: "🎨",
        fields: [
          { key: "aspectRatio", label: "Aspect Ratio", type: "select", options: ["21:9", "16:9", "4:3"], default: "21:9" },
          { key: "fullWidth", label: "Full Width", type: "boolean", default: true },
          { key: "showOverlay", label: "Show Overlay", type: "boolean", default: true },
          { key: "overlayGradient", label: "Gradient", type: "boolean", default: true },
        ],
      },
    ],
  },
  "media.promo": {
    sections: [
      {
        title: "Carousel Source",
        icon: "🎠",
        fields: [
          { key: "bannerId", label: "Carousel ID (from DB)", type: "text", placeholder: "promo-carousel-1" },
          { key: "slot", label: "Slot Name", type: "text", placeholder: "e.g., promo-main" },
        ],
      },
      {
        title: "Carousel Options",
        icon: "🎬",
        fields: [
          { key: "autoPlay", label: "Auto Play", type: "boolean", default: true },
          { key: "autoPlayInterval", label: "Interval (ms)", type: "number", min: 2000, max: 10000, default: 4000 },
          { key: "loop", label: "Loop", type: "boolean", default: true },
          { key: "showIndicators", label: "Show Dots", type: "boolean", default: true },
          { key: "showControls", label: "Show Arrows", type: "boolean", default: true },
        ],
      },
      {
        title: "Display",
        icon: "🎨",
        fields: [
          { key: "aspectRatio", label: "Aspect Ratio", type: "select", options: ["16:9", "4:3", "1:1"], default: "16:9" },
          { key: "borderRadius", label: "Border Radius", type: "number", min: 0, max: 24, default: 12 },
          { key: "showOverlay", label: "Show Overlay", type: "boolean", default: true },
        ],
      },
    ],
  },
  "media.ad": {
    sections: [
      {
        title: "Ad Content",
        icon: "📢",
        fields: [
          { key: "mediaUrl", label: "Ad Image URL", type: "text", placeholder: "https://example.com/ad.jpg" },
          { key: "slot", label: "Ad Slot", type: "text", placeholder: "e.g., ad-footer" },
        ],
      },
      {
        title: "Content",
        icon: "📝",
        fields: [
          { key: "title", label: "Ad Title", type: "text", placeholder: "Special Offer!" },
          { key: "ctaText", label: "CTA Button", type: "text", placeholder: "Learn More" },
          { key: "ctaAction", label: "CTA Action", type: "select", options: ["link", "navigate"], default: "link" },
          { key: "ctaUrl", label: "CTA URL", type: "text", placeholder: "https://..." },
        ],
      },
      {
        title: "Display",
        icon: "🎨",
        fields: [
          { key: "aspectRatio", label: "Aspect Ratio", type: "select", options: ["4:3", "16:9", "1:1"], default: "4:3" },
          { key: "borderRadius", label: "Border Radius", type: "number", min: 0, max: 16, default: 8 },
          { key: "showOverlay", label: "Show Overlay", type: "boolean", default: true },
        ],
      },
    ],
  },
};

type FieldConfig = {
  key: string;
  label: string;
  type: "boolean" | "text" | "number" | "select" | "color";
  options?: string[];
  min?: number;
  max?: number;
  default?: any;
  placeholder?: string;
};

type SectionConfig = {
  title: string;
  icon: string;
  fields: FieldConfig[];
};

type WidgetConfigSchema = {
  sections: SectionConfig[];
};

export function WidgetPropertiesPanel({ widget, metadata, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<"layout" | "style" | "content" | "data">("content");

  const customProps = widget.custom_props || {};
  const widgetConfig = WIDGET_CONFIGS[widget.widget_id];

  const updateCustomProp = (key: string, value: any) => {
    onUpdate({
      custom_props: {
        ...customProps,
        [key]: value,
      },
    });
  };

  const renderField = (field: FieldConfig) => {
    const value = customProps[field.key] ?? field.default;

    switch (field.type) {
      case "boolean":
        return (
          <div key={field.key} className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700">{field.label}</span>
            <button
              onClick={() => updateCustomProp(field.key, !value)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                value ? "bg-primary-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  value ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        );

      case "text":
        return (
          <div key={field.key} className="py-2">
            <label className="block text-sm text-gray-700 mb-1">{field.label}</label>
            <input
              type="text"
              value={value || ""}
              onChange={(e) => updateCustomProp(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="py-2">
            <label className="block text-sm text-gray-700 mb-1">{field.label}</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={field.min || 1}
                max={field.max || 10}
                value={value || field.default || 3}
                onChange={(e) => updateCustomProp(field.key, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-700 w-8 text-center">
                {value || field.default || 3}
              </span>
            </div>
          </div>
        );

      case "select":
        return (
          <div key={field.key} className="py-2">
            <label className="block text-sm text-gray-700 mb-1">{field.label}</label>
            <select
              value={value || field.default || field.options?.[0]}
              onChange={(e) => updateCustomProp(field.key, e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">{metadata.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{metadata.description}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-xs">
        {[
          { id: "content", label: "Content", icon: Sliders },
          { id: "layout", label: "Layout", icon: Layout },
          { id: "style", label: "Style", icon: Palette },
          { id: "data", label: "Data", icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === "content" && widgetConfig && (
          <div className="space-y-4">
            {widgetConfig.sections.map((section, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <span className="text-xs font-medium text-gray-700">
                    {section.icon} {section.title}
                  </span>
                </div>
                <div className="px-3 py-1 divide-y divide-gray-100">
                  {section.fields.map(renderField)}
                </div>
              </div>
            ))}
            {!widgetConfig && (
              <div className="text-center py-8 text-gray-500">
                <Sliders size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No content options for this widget</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "layout" && (
          <div className="space-y-4">
            {/* Size */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-700">📐 Widget Size</span>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {(metadata.supportedSizes || ["compact", "standard", "expanded"]).map((size) => (
                    <button
                      key={size}
                      onClick={() => onUpdate({ size })}
                      className={`py-3 px-2 text-xs rounded-lg border transition-all ${
                        widget.size === size
                          ? "border-primary-600 bg-primary-50 text-primary-700 font-medium ring-2 ring-primary-200"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className={`rounded bg-gray-300 ${
                          size === "compact" ? "w-6 h-3" : size === "standard" ? "w-8 h-5" : "w-10 h-7"
                        }`} />
                        <span className="capitalize">{size}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center">
                  {widget.size === "compact" && "Minimal height, fewer details"}
                  {widget.size === "standard" && "Default size with balanced content"}
                  {widget.size === "expanded" && "Full height with all details"}
                </p>
              </div>
            </div>

            {/* Layout Style - only for list-based widgets */}
            {LAYOUT_STYLE_WIDGETS.includes(widget.widget_id) && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <span className="text-xs font-medium text-gray-700">🎨 Layout Style</span>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(WIDGET_LAYOUT_OPTIONS[widget.widget_id] || WIDGET_LAYOUT_OPTIONS.default).map((style) => (
                      <button
                        key={style}
                        onClick={() => updateCustomProp("layoutStyle", style)}
                        className={`py-3 px-2 text-xs rounded-lg border transition-all ${
                          (customProps.layoutStyle || "list") === style
                            ? "border-primary-600 bg-primary-50 text-primary-700 font-medium ring-2 ring-primary-200"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {style === "list" && (
                            <div className="flex flex-col gap-0.5">
                              <div className="w-8 h-1.5 bg-gray-400 rounded" />
                              <div className="w-8 h-1.5 bg-gray-400 rounded" />
                              <div className="w-8 h-1.5 bg-gray-400 rounded" />
                            </div>
                          )}
                          {style === "cards" && (
                            <div className="flex gap-0.5">
                              <div className="w-3 h-4 bg-gray-400 rounded" />
                              <div className="w-3 h-4 bg-gray-400 rounded" />
                            </div>
                          )}
                          {style === "grid" && (
                            <div className="grid grid-cols-2 gap-0.5">
                              <div className="w-3 h-2 bg-gray-400 rounded" />
                              <div className="w-3 h-2 bg-gray-400 rounded" />
                              <div className="w-3 h-2 bg-gray-400 rounded" />
                              <div className="w-3 h-2 bg-gray-400 rounded" />
                            </div>
                          )}
                          {style === "timeline" && (
                            <div className="flex items-center gap-0.5">
                              <div className="w-0.5 h-5 bg-gray-400 rounded" />
                              <div className="flex flex-col gap-0.5">
                                <div className="w-5 h-1.5 bg-gray-400 rounded" />
                                <div className="w-5 h-1.5 bg-gray-400 rounded" />
                              </div>
                            </div>
                          )}
                          {style === "horizontal" && (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 bg-gray-400 rounded-full" />
                              <div className="flex flex-col gap-0.5">
                                <div className="w-5 h-1.5 bg-gray-400 rounded" />
                                <div className="w-4 h-1 bg-gray-300 rounded" />
                              </div>
                            </div>
                          )}
                          {style === "vertical" && (
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="w-4 h-4 bg-gray-400 rounded-full" />
                              <div className="w-5 h-1.5 bg-gray-400 rounded" />
                              <div className="w-4 h-1 bg-gray-300 rounded" />
                            </div>
                          )}
                          <span className="capitalize">{style}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Columns (for grid/cards) */}
            {LAYOUT_STYLE_WIDGETS.includes(widget.widget_id) && (customProps.layoutStyle === "grid" || customProps.layoutStyle === "cards") && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <span className="text-xs font-medium text-gray-700">📊 Columns</span>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((cols) => (
                      <button
                        key={cols}
                        onClick={() => updateCustomProp("columns", cols.toString())}
                        className={`py-2 px-2 text-xs rounded-lg border transition-colors ${
                          (parseInt(customProps.columns as string) || 2) === cols
                            ? "border-primary-600 bg-primary-50 text-primary-700 font-medium"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {cols}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Position */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-700">📍 Position</span>
              </div>
              <div className="p-3">
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg flex items-center justify-between">
                  <span>Position #{widget.position} in layout</span>
                  <span className="text-[10px] text-gray-400">Drag to reorder</span>
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-700">👁️ Visibility</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enabled</span>
                  <button
                    onClick={() => onUpdate({ enabled: !widget.enabled })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      widget.enabled ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        widget.enabled ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Show Header</span>
                  <button
                    onClick={() => updateCustomProp("showHeader", !(customProps.showHeader ?? true))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      customProps.showHeader !== false ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        customProps.showHeader !== false ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "style" && (
          <div className="space-y-4">
            {/* Accent Color */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-700">🎨 Accent Color</span>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-4 gap-2">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updateCustomProp("accentColor", color.value)}
                      className={`aspect-square rounded-lg border-2 transition-all ${
                        customProps.accentColor === color.value
                          ? "border-gray-900 scale-105"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                  <button
                    onClick={() => updateCustomProp("accentColor", undefined)}
                    className={`aspect-square rounded-lg border-2 flex items-center justify-center text-[10px] text-gray-500 ${
                      !customProps.accentColor ? "border-gray-900" : "border-gray-200"
                    }`}
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            {/* Border Radius */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-700">⬜ Corner Radius</span>
              </div>
              <div className="p-3">
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={typeof customProps.borderRadius === 'number' ? customProps.borderRadius : 12}
                  onChange={(e) => updateCustomProp("borderRadius", parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>Square</span>
                  <span>{typeof customProps.borderRadius === 'number' ? customProps.borderRadius : 12}px</span>
                  <span>Round</span>
                </div>
              </div>
            </div>

            {/* Shadow */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-700">🌑 Shadow</span>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {["none", "small", "medium"].map((shadow) => (
                    <button
                      key={shadow}
                      onClick={() => updateCustomProp("shadow", shadow)}
                      className={`py-2 px-2 text-xs rounded-lg border transition-colors capitalize ${
                        (customProps.shadow || "small") === shadow
                          ? "border-primary-600 bg-primary-50 text-primary-700 font-medium"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {shadow}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-700">🔄 Data Source</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Auto Refresh</span>
                  <button
                    onClick={() => updateCustomProp("autoRefresh", !(customProps.autoRefresh ?? true))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      customProps.autoRefresh !== false ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        customProps.autoRefresh !== false ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
                <div className="py-2">
                  <label className="block text-sm text-gray-700 mb-1">Refresh Interval</label>
                  <select
                    value={typeof customProps.refreshInterval === 'string' ? customProps.refreshInterval : "5min"}
                    onChange={(e) => updateCustomProp("refreshInterval", e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="1min">Every 1 minute</option>
                    <option value="5min">Every 5 minutes</option>
                    <option value="15min">Every 15 minutes</option>
                    <option value="30min">Every 30 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-700">📡 Offline</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Cache Data</span>
                  <button
                    onClick={() => updateCustomProp("cacheEnabled", !(customProps.cacheEnabled ?? true))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      customProps.cacheEnabled !== false ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        customProps.cacheEnabled !== false ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Show When Offline</span>
                  <button
                    onClick={() => updateCustomProp("showOffline", !(customProps.showOffline ?? true))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      customProps.showOffline !== false ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        customProps.showOffline !== false ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
