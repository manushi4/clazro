export type FreshnessRule = {
  staleTime: number;
  retry: number;
};

const DEFAULT_RULE: FreshnessRule = { staleTime: 60 * 60 * 1000, retry: 1 };
const STRONG_RULE: FreshnessRule = { staleTime: 5 * 60 * 1000, retry: 2 };
const EVENTUAL_RULE: FreshnessRule = { staleTime: 30 * 60 * 1000, retry: 1 };
const LOCAL_FIRST_RULE: FreshnessRule = { staleTime: 2 * 60 * 60 * 1000, retry: 0 };

export function getFeatureFreshness(featureId: string): FreshnessRule {
  switch (featureId) {
    case "study.tests":
    case "study.assignments":
      return STRONG_RULE;
    case "study.library":
    case "home.dashboard":
    case "progress.analytics":
      return EVENTUAL_RULE;
    case "study.notes":
      return LOCAL_FIRST_RULE;
    default:
      return DEFAULT_RULE;
  }
}
