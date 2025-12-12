import type { FeatureDefinition, FeatureId } from "../types/feature.types";

const registry: FeatureDefinition[] = [
  {
    id: "home.dashboard",
    name: "Student Home Dashboard",
    roles: ["student"],
    defaultEnabled: true,
    primaryTab: "HomeTab",
    primaryScreens: ["NewStudentDashboard"],
  },
  {
    id: "study.library",
    name: "Study Library",
    roles: ["student", "teacher"],
    defaultEnabled: true,
    primaryTab: "StudyTab",
    primaryScreens: ["StudyHomeScreen", "NewStudyLibraryScreen"],
  },
  {
    id: "study.assignments",
    name: "Assignments",
    roles: ["student", "teacher"],
    defaultEnabled: true,
    primaryTab: "StudyTab",
    primaryScreens: ["AssignmentsHomeScreen", "NewAssignmentDetailScreen"],
  },
  {
    id: "study.tests",
    name: "Tests & Practice",
    roles: ["student", "teacher"],
    defaultEnabled: true,
    primaryTab: "StudyTab",
    primaryScreens: ["TestCenterScreen", "TestAttemptScreen", "TestReviewScreen"],
  },
  {
    id: "study.notes",
    name: "Notes & Highlights",
    roles: ["student"],
    defaultEnabled: true,
    primaryTab: "StudyTab",
    primaryScreens: ["NotesAndHighlightsScreen", "NoteDetailScreen"],
  },
  {
    id: "ask.doubts",
    name: "Doubts",
    roles: ["student", "teacher"],
    defaultEnabled: true,
    primaryTab: "AskTab",
    primaryScreens: ["DoubtsHomeScreen", "NewDoubtSubmission", "DoubtDetailScreen"],
  },
  {
    id: "ai.tutor",
    name: "AI Tutor",
    roles: ["student"],
    defaultEnabled: true,
    primaryTab: "AskTab",
    primaryScreens: ["NewAITutorChat"],
    requiredPermissions: ["ai.tutor.use"],
  },
  {
    id: "progress.analytics",
    name: "Progress & Analytics",
    roles: ["student", "teacher", "parent"],
    defaultEnabled: true,
    primaryTab: "ProgressTab",
    primaryScreens: ["NewProgressDetailScreen", "GlobalAnalyticsScreen"],
  },
  {
    id: "progress.gamification",
    name: "Gamification Hub",
    roles: ["student"],
    defaultEnabled: true,
    primaryTab: "ProgressTab",
    primaryScreens: ["NewGamifiedLearningHub", "QuestsScreen"],
  },
  {
    id: "peers.network",
    name: "Peer Learning Network",
    roles: ["student"],
    defaultEnabled: true,
    primaryTab: "ProfileTab",
    primaryScreens: ["NewPeerLearningNetwork", "PeerDetail", "StudyGroupDetailScreen"],
  },
  {
    id: "teacher.dashboard",
    name: "Teacher Dashboard",
    roles: ["teacher"],
    defaultEnabled: true,
  },
  {
    id: "teacher.liveClass",
    name: "Live & Virtual Classroom",
    roles: ["teacher"],
    defaultEnabled: true,
    primaryScreens: ["NewEnhancedLiveClass", "NewInteractiveClassroom"],
  },
  {
    id: "parent.dashboard",
    name: "Parent Dashboard",
    roles: ["parent"],
    defaultEnabled: true,
  },
  {
    id: "admin.dashboard",
    name: "Admin Dashboard",
    roles: ["admin"],
    defaultEnabled: true,
  },
  {
    id: "app.settings",
    name: "Settings",
    roles: ["student", "teacher", "parent", "admin"],
    defaultEnabled: true,
    primaryTab: "ProfileTab",
    primaryScreens: ["SettingsScreen"],
  },
  {
    id: "app.help",
    name: "Help & Support",
    roles: ["student", "teacher", "parent", "admin"],
    defaultEnabled: true,
  },
  {
    id: "app.legal",
    name: "Legal",
    roles: ["student", "teacher", "parent", "admin"],
    defaultEnabled: true,
  },
];

const registryMap: Record<FeatureId, FeatureDefinition> = registry.reduce(
  (acc, feature) => {
    acc[feature.id] = feature;
    return acc;
  },
  {} as Record<FeatureId, FeatureDefinition>
);

export function getFeatureRegistry(): FeatureDefinition[] {
  return registry;
}

export function getFeatureDefinition(featureId: FeatureId): FeatureDefinition | undefined {
  return registryMap[featureId];
}

export function isFeatureKnown(featureId: FeatureId): boolean {
  return Boolean(registryMap[featureId]);
}
