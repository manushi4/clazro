import { DynamicScreen } from "./DynamicScreen";
import { SettingsScreen, LanguageSelectionScreen } from "../screens/settings";
import { EditProfileScreen, HelpFeedbackScreen } from "../screens/profile";
import { GlobalAnalyticsScreen, SubjectAnalyticsScreen, GamifiedHubScreen } from "../screens/progress";

export type RouteDefinition = {
  screenId: string;
  component: React.ComponentType<any>;
};

const registry: Record<string, RouteDefinition> = {
  // Dynamic screens (widget-based)
  "home.dashboard": { screenId: "home.dashboard", component: DynamicScreen },
  "student-home": { screenId: "student-home", component: DynamicScreen },
  "parent-home": { screenId: "parent-home", component: DynamicScreen },
  "teacher-home": { screenId: "teacher-home", component: DynamicScreen },
  "study.library": { screenId: "study.library", component: DynamicScreen },
  "study-hub": { screenId: "study-hub", component: DynamicScreen },
  "ask.doubts": { screenId: "ask.doubts", component: DynamicScreen },
  "doubts-home": { screenId: "doubts-home", component: DynamicScreen },
  "progress.analytics": { screenId: "progress.analytics", component: DynamicScreen },
  "progress-home": { screenId: "progress-home", component: DynamicScreen },
  "admin.panel": { screenId: "admin.panel", component: DynamicScreen },
  
  // Profile screen (widget-based)
  "profile.home": { screenId: "profile.home", component: DynamicScreen },
  "profile-home": { screenId: "profile-home", component: DynamicScreen },
  
  // Parent screens (widget-based)
  "child-progress-screen": { screenId: "child-progress-screen", component: DynamicScreen },
  "schedule-screen": { screenId: "schedule-screen", component: DynamicScreen },
  "children-overview": { screenId: "children-overview", component: DynamicScreen },
  "child-detail": { screenId: "child-detail", component: DynamicScreen },
  
  // Fixed screens (not widget-based)
  // Settings screen - multiple aliases for compatibility
  "settings": { screenId: "settings", component: SettingsScreen },
  "Settings": { screenId: "Settings", component: SettingsScreen },
  "LanguageSelection": { screenId: "LanguageSelection", component: LanguageSelectionScreen },
  "language-selection": { screenId: "language-selection", component: LanguageSelectionScreen },
  
  // Profile screens
  "edit-profile": { screenId: "edit-profile", component: EditProfileScreen },
  "EditProfile": { screenId: "EditProfile", component: EditProfileScreen },
  "help-feedback": { screenId: "help-feedback", component: HelpFeedbackScreen },
  "HelpFeedback": { screenId: "HelpFeedback", component: HelpFeedbackScreen },
  
  // Progress screens (fixed)
  "global-analytics": { screenId: "global-analytics", component: GlobalAnalyticsScreen },
  "GlobalAnalytics": { screenId: "GlobalAnalytics", component: GlobalAnalyticsScreen },
  "subject-analytics": { screenId: "subject-analytics", component: SubjectAnalyticsScreen },
  "SubjectAnalytics": { screenId: "SubjectAnalytics", component: SubjectAnalyticsScreen },
  "gamified-hub": { screenId: "gamified-hub", component: GamifiedHubScreen },
  "GamifiedHub": { screenId: "GamifiedHub", component: GamifiedHubScreen },
};

export function resolveScreen(screenId: string) {
  return registry[screenId] ?? registry["home.dashboard"];
}

export function getRouteRegistry() {
  return registry;
}
