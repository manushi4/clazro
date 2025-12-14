import { HeroCardWidget } from "../components/widgets/dashboard/HeroCardWidget";
import { TodayScheduleWidget } from "../components/widgets/dashboard/TodayScheduleWidget";
import { QuickActionsWidget } from "../components/widgets/dashboard/QuickActionsWidget";
import { AssignmentsTestsWidget } from "../components/widgets/dashboard/AssignmentsTestsWidget";
import { DoubtsInboxWidget } from "../components/widgets/dashboard/DoubtsInboxWidget";
import { ProgressSnapshotWidget } from "../components/widgets/dashboard/ProgressSnapshotWidget";
import { RecommendationsWidget } from "../components/widgets/dashboard/RecommendationsWidget";
import { ClassFeedWidget } from "../components/widgets/dashboard/ClassFeedWidget";
import { PeersGroupsWidget } from "../components/widgets/dashboard/PeersGroupsWidget";
import { ProfileCardWidget } from "../components/widgets/profile/ProfileCardWidget";
import { ProfileQuickLinksWidget } from "../components/widgets/profile/ProfileQuickLinksWidget";
import { ProfileStatsWidget } from "../components/widgets/profile/ProfileStatsWidget";
import { ProfileAchievementsWidget } from "../components/widgets/profile/ProfileAchievementsWidget";
import { ProfileActivityWidget } from "../components/widgets/profile/ProfileActivityWidget";
import { SubjectProgressWidget } from "../components/widgets/progress/SubjectProgressWidget";
import { StudyStreakWidget } from "../components/widgets/progress/StudyStreakWidget";
import { LearningGoalsWidget } from "../components/widgets/progress/LearningGoalsWidget";
import { StatsGridWidget } from "../components/widgets/stats/StatsGridWidget";
import { ActiveQuestsWidget } from "../components/widgets/gamification/ActiveQuestsWidget";
import { PeersLeaderboardWidget } from "../components/widgets/social/PeersLeaderboardWidget";
import { ContinueLearningWidget } from "../components/widgets/study/ContinueLearningWidget";
import { WeakAreasWidget } from "../components/widgets/progress/WeakAreasWidget";
import { AnalyticsSnapshotWidget } from "../components/widgets/analytics/AnalyticsSnapshotWidget";
import type { WidgetComponent, WidgetId, WidgetMetadata } from "../types/widget.types";

type WidgetRegistryEntry = {
  component: WidgetComponent;
  metadata: WidgetMetadata;
};

const registry: Record<WidgetId, WidgetRegistryEntry> = {
  // New short IDs (used in database)
  "hero.greeting": {
    component: HeroCardWidget,
    metadata: buildMetadata("hero.greeting", "dashboard:widgets.heroCard.title", "dashboard:widgets.heroCard.subtitle", "home.dashboard"),
  },
  "schedule.today": {
    component: TodayScheduleWidget,
    metadata: buildMetadata("schedule.today", "dashboard:widgets.todaySchedule.title", "dashboard:widgets.todaySchedule.subtitle", "home.dashboard"),
  },
  "actions.quick": {
    component: QuickActionsWidget,
    metadata: buildMetadata("actions.quick", "dashboard:widgets.quickActions.title", "dashboard:widgets.quickActions.subtitle", "home.dashboard"),
  },
  "assignments.pending": {
    component: AssignmentsTestsWidget,
    metadata: buildMetadata("assignments.pending", "dashboard:widgets.assignmentsTests.title", "dashboard:widgets.assignmentsTests.subtitle", "study.assignments"),
  },
  "doubts.inbox": {
    component: DoubtsInboxWidget,
    metadata: buildMetadata("doubts.inbox", "dashboard:widgets.doubtsInbox.title", "dashboard:widgets.doubtsInbox.subtitle", "ask.doubts"),
  },
  "progress.snapshot": {
    component: ProgressSnapshotWidget,
    metadata: buildMetadata("progress.snapshot", "dashboard:widgets.progressSnapshot.title", "dashboard:widgets.progressSnapshot.subtitle", "progress.analytics"),
  },
  "progress.subject-wise": {
    component: SubjectProgressWidget,
    metadata: {
      id: "progress.subject-wise",
      titleKey: "dashboard:widgets.subjectProgress.title",
      descriptionKey: "dashboard:widgets.subjectProgress.subtitle",
      featureId: "progress.analytics",
      roles: ["student", "parent"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 5 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        layoutStyle: "list",
        maxSubjects: 5,
        showChapters: true,
        showStats: true,
        showProgressBar: true,
        showPercentage: true,
        showLastActivity: false,
        sortBy: "progress",
        enableTap: true,
        showViewAll: true,
      },
      requiredPermissions: [],
    },
  },
  "progress.streak": {
    component: StudyStreakWidget,
    metadata: {
      id: "progress.streak",
      titleKey: "dashboard:widgets.studyStreak.title",
      descriptionKey: "dashboard:widgets.studyStreak.subtitle",
      featureId: "progress.analytics",
      roles: ["student", "parent"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 5 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        showCurrentStreak: true,
        showLongestStreak: true,
        showWeeklyGoal: true,
        showAchievements: true,
        showRecentActivity: false,
        maxAchievements: 2,
        enableTap: true,
        showMotivation: true,
      },
      requiredPermissions: [],
    },
  },
  "progress.goals": {
    component: LearningGoalsWidget,
    metadata: {
      id: "progress.goals",
      titleKey: "dashboard:widgets.learningGoals.title",
      descriptionKey: "dashboard:widgets.learningGoals.subtitle",
      featureId: "progress.analytics",
      roles: ["student"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 5 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        maxGoals: 4,
        showProgress: true,
        showDeadline: true,
        showPriority: true,
        showAddButton: true,
        compactMode: false,
        enableTap: true,
      },
    },
  },
  "progress.weak-areas": {
    component: WeakAreasWidget,
    metadata: {
      id: "progress.weak-areas",
      titleKey: "dashboard:widgets.weakAreas.title",
      descriptionKey: "dashboard:widgets.weakAreas.subtitle",
      featureId: "progress.analytics",
      roles: ["student", "parent"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 5 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        maxTopics: 4,
        showScore: true,
        showPracticeButton: true,
        showDifficulty: true,
        showSubject: true,
        showChapter: false,
        sortBy: "score",
        compactMode: false,
        enableTap: true,
      },
      requiredPermissions: [],
    },
  },
  "stats.grid": {
    component: StatsGridWidget,
    metadata: {
      id: "stats.grid",
      titleKey: "dashboard:widgets.statsGrid.title",
      descriptionKey: "dashboard:widgets.statsGrid.subtitle",
      featureId: "progress.analytics",
      roles: ["student", "parent"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 5 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        columns: 2,
        showXP: true,
        showStreak: true,
        showBadges: true,
        showStudyTime: true,
        showTests: true,
        showAssignments: true,
        showTrends: true,
        compactMode: false,
        enableTap: true,
      },
      requiredPermissions: [],
    },
  },
  "analytics.snapshot": {
    component: AnalyticsSnapshotWidget,
    metadata: {
      id: "analytics.snapshot",
      titleKey: "dashboard:widgets.analyticsSnapshot.title",
      descriptionKey: "dashboard:widgets.analyticsSnapshot.subtitle",
      featureId: "progress.analytics",
      roles: ["student", "parent"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 3,
        staleTimeMs: 5 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        showThisWeek: true,
        showSubjects: true,
        showStreak: true,
        showTrends: true,
        showRecommendations: true,
        maxSubjects: 3,
        compactMode: false,
        enableTap: true,
      },
      requiredPermissions: [],
    },
  },
  "quests.active": {
    component: ActiveQuestsWidget,
    metadata: {
      id: "quests.active",
      titleKey: "dashboard:widgets.activeQuests.title",
      descriptionKey: "dashboard:widgets.activeQuests.subtitle",
      featureId: "gamification",
      roles: ["student"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 2 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        maxQuests: 3,
        showDaily: true,
        showWeekly: true,
        showProgress: true,
        showXPReward: true,
        showSummary: true,
        compactMode: false,
        enableTap: true,
      },
      requiredPermissions: [],
    },
  },
  "ai.recommendations": {
    component: RecommendationsWidget,
    metadata: buildMetadata("ai.recommendations", "dashboard:widgets.recommendations.title", "dashboard:widgets.recommendations.subtitle", "ai.tutor", ["ai.tutor.use"]),
  },
  "peers.leaderboard": {
    component: PeersLeaderboardWidget,
    metadata: {
      id: "peers.leaderboard",
      titleKey: "dashboard:widgets.peersLeaderboard.title",
      descriptionKey: "dashboard:widgets.peersLeaderboard.subtitle",
      featureId: "peers.network",
      roles: ["student"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 2,
        staleTimeMs: 5 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        scope: "school",
        maxEntries: 5,
        showMyRank: true,
        showPercentile: true,
        showScope: true,
        showXP: true,
        showStreak: true,
        compactMode: false,
        enableTap: true,
      },
    },
  },
  "continue.learning": {
    component: ContinueLearningWidget,
    metadata: {
      id: "continue.learning",
      titleKey: "dashboard:widgets.continueLearning.title",
      descriptionKey: "dashboard:widgets.continueLearning.subtitle",
      featureId: "home.dashboard",
      roles: ["student"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 2 * 60 * 1000,
        prefetchOnDashboardLoad: true,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        maxItems: 4,
        showProgress: true,
        showTimeAgo: true,
        showType: true,
        layoutStyle: "horizontal",
        enableTap: true,
        compactMode: false,
      },
      requiredPermissions: [],
    },
  },
  "feed.class": {
    component: ClassFeedWidget,
    metadata: buildMetadata("feed.class", "dashboard:widgets.classFeed.title", "dashboard:widgets.classFeed.subtitle", "home.dashboard"),
  },
  "peers.groups": {
    component: PeersGroupsWidget,
    metadata: buildMetadata("peers.groups", "dashboard:widgets.peersGroups.title", "dashboard:widgets.peersGroups.subtitle", "peers.network"),
  },
  // Profile widgets
  "profile.card": {
    component: ProfileCardWidget,
    metadata: {
      id: "profile.card",
      titleKey: "profile:widgets.profileCard.title",
      descriptionKey: "profile:widgets.profileCard.subtitle",
      featureId: "profile",
      roles: ["student", "teacher", "parent", "admin"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 5 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        showAvatar: true,
        showClass: true,
        showSchool: true,
        showStats: true,
        showEditButton: true,
        avatarSize: "medium",
        layoutStyle: "horizontal",
      },
      requiredPermissions: [],
    },
  },

  "profile.quickLinks": {
    component: ProfileQuickLinksWidget,
    metadata: {
      id: "profile.quickLinks",
      titleKey: "profile:widgets.quickLinks.title",
      descriptionKey: "profile:widgets.quickLinks.subtitle",
      featureId: "profile",
      roles: ["student", "teacher", "parent", "admin"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 0,
        staleTimeMs: 0,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: false,
      },
      defaultConfig: {
        showEditProfile: true,
        showSettings: true,
        showNotifications: true,
        showHelp: true,
        showAbout: true,
        showLogout: true,
        layoutStyle: "list",
        showIcons: true,
        showDividers: true,
      },
      requiredPermissions: [],
    },
  },
  "profile.stats": {
    component: ProfileStatsWidget,
    metadata: {
      id: "profile.stats",
      titleKey: "profile:widgets.profileStats.title",
      descriptionKey: "profile:widgets.profileStats.subtitle",
      featureId: "profile",
      roles: ["student", "teacher"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 5 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        layoutStyle: "grid",
        showXP: true,
        showStreak: true,
        showBadges: true,
        showStudyTime: true,
        showAssessments: true,
        showProgress: true,
        showTrends: true,
        compactMode: false,
      },
      requiredPermissions: [],
    },
  },
  "profile.achievements": {
    component: ProfileAchievementsWidget,
    metadata: {
      id: "profile.achievements",
      titleKey: "profile:widgets.achievements.title",
      descriptionKey: "profile:widgets.achievements.subtitle",
      featureId: "gamification",
      roles: ["student"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 5 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        layoutStyle: "grid",
        maxItems: 6,
        showProgress: true,
        showPoints: true,
        showRarity: true,
        showLocked: true,
        showSummary: true,
        filterCategory: "all",
      },
      requiredPermissions: [],
    },
  },
  "profile.activity": {
    component: ProfileActivityWidget,
    metadata: {
      id: "profile.activity",
      titleKey: "profile:widgets.activity.title",
      descriptionKey: "profile:widgets.activity.subtitle",
      featureId: "profile",
      roles: ["student", "teacher"],
      requiresOnline: false,
      deprecated: false,
      version: "1.0.0",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 2 * 60 * 1000,
        prefetchOnDashboardLoad: false,
        allowBackgroundRefresh: true,
      },
      defaultConfig: {
        layoutStyle: "timeline",
        maxItems: 10,
        showTodayStats: true,
        showPoints: true,
        showTime: true,
        showGroupHeaders: true,
        compactMode: false,
      },
      requiredPermissions: [],
    },
  },
  // Legacy long IDs (for backward compatibility)
  "home.dashboard.heroCard": {
    component: HeroCardWidget,
    metadata: buildMetadata("home.dashboard.heroCard", "dashboard:widgets.heroCard.title", "dashboard:widgets.heroCard.subtitle", "home.dashboard"),
  },
  "home.dashboard.todaySchedule": {
    component: TodayScheduleWidget,
    metadata: buildMetadata("home.dashboard.todaySchedule", "dashboard:widgets.todaySchedule.title", "dashboard:widgets.todaySchedule.subtitle", "home.dashboard"),
  },
  "home.dashboard.quickActions": {
    component: QuickActionsWidget,
    metadata: buildMetadata("home.dashboard.quickActions", "dashboard:widgets.quickActions.title", "dashboard:widgets.quickActions.subtitle", "home.dashboard"),
  },
  "home.dashboard.assignmentsTests": {
    component: AssignmentsTestsWidget,
    metadata: buildMetadata("home.dashboard.assignmentsTests", "dashboard:widgets.assignmentsTests.title", "dashboard:widgets.assignmentsTests.subtitle", "study.assignments"),
  },
  "home.dashboard.doubtsInbox": {
    component: DoubtsInboxWidget,
    metadata: buildMetadata("home.dashboard.doubtsInbox", "dashboard:widgets.doubtsInbox.title", "dashboard:widgets.doubtsInbox.subtitle", "ask.doubts"),
  },
  "home.dashboard.progressSnapshot": {
    component: ProgressSnapshotWidget,
    metadata: buildMetadata("home.dashboard.progressSnapshot", "dashboard:widgets.progressSnapshot.title", "dashboard:widgets.progressSnapshot.subtitle", "progress.analytics"),
  },
  "home.dashboard.recommendations": {
    component: RecommendationsWidget,
    metadata: buildMetadata("home.dashboard.recommendations", "dashboard:widgets.recommendations.title", "dashboard:widgets.recommendations.subtitle", "ai.tutor", ["ai.tutor.use"]),
  },
  "home.dashboard.classFeed": {
    component: ClassFeedWidget,
    metadata: buildMetadata("home.dashboard.classFeed", "dashboard:widgets.classFeed.title", "dashboard:widgets.classFeed.subtitle", "home.dashboard"),
  },
  "home.dashboard.peersGroups": {
    component: PeersGroupsWidget,
    metadata: buildMetadata("home.dashboard.peersGroups", "dashboard:widgets.peersGroups.title", "dashboard:widgets.peersGroups.subtitle", "peers.network"),
  },
};

export function getWidgetRegistry() {
  return registry;
}

export function getWidgetEntry(widgetId: WidgetId): WidgetRegistryEntry | undefined {
  return registry[widgetId];
}

function buildMetadata(
  id: WidgetId,
  titleKey: string,
  descriptionKey: string,
  featureId: string,
  requiredPermissions: string[] = []
): WidgetMetadata {
  return {
    id,
    titleKey,
    descriptionKey,
    featureId,
    roles: ["student", "teacher", "parent", "admin"], // Allow all roles by default
    requiresOnline: false, // Don't require online by default
    deprecated: false,
    version: "1.0.0",
    dataPolicy: {
      maxQueries: 2,
      staleTimeMs: 5 * 60 * 1000,
      prefetchOnDashboardLoad: true,
      allowBackgroundRefresh: true,
    },
    defaultConfig: {},
    requiredPermissions: [], // Don't require permissions by default
  };
}
