import { FeatureService } from "../../services/config/featureService";
import { useConfigStore } from "../../stores/configStore";
import { EXPECTED_FEATURE_VERSION, isVersionMismatch } from "../../services/config/versioning";
import { addBreadcrumb } from "../../error/sentry";

export function useFeatures() {
  const config = useConfigStore((state) => state.config);
  if (!config) return [];
  const features = FeatureService.getEnabledFeatures(config);
  features.forEach((f) => {
    if (isVersionMismatch(f.version, EXPECTED_FEATURE_VERSION)) {
      addBreadcrumb({
        category: "feature",
        message: "feature_version_mismatch",
        level: "warning",
        data: { featureId: f.featureId, expected: EXPECTED_FEATURE_VERSION, received: f.version },
      });
    }
  });
  return features;
}
