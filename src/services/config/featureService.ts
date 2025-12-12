import { getFeatureRegistry, isFeatureKnown } from "../../config/featureRegistry";
import type { CustomerConfig } from "../../types/config.types";
import type { FeatureToggle } from "../../types/feature.types";

export const FeatureService = {
  getEnabledFeatures(config: CustomerConfig): FeatureToggle[] {
    const known = config.features.filter((f) => isFeatureKnown(f.featureId));
    const registry = getFeatureRegistry();

    // Ensure every registry feature has a toggle (use defaultEnabled if missing)
    const merged = registry.map<FeatureToggle>((feature) => {
      const override = known.find((f) => f.featureId === feature.id);
      if (override) return override;
      return { featureId: feature.id, enabled: feature.defaultEnabled, overridden: false };
    });

    return merged;
  },
};
