import { useFeatures } from "./useFeatures";

export function useFeatureEnabled(featureId: string): boolean {
  const features = useFeatures();
  return features.some((f) => f.featureId === featureId && f.enabled);
}
