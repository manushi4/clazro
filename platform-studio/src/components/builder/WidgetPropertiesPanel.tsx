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
  "parent.ai-alerts": ["list", "cards", "compact"],
  "parent.comparison-analytics": ["list", "cards", "compact"],
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
