import React from "react";
import { useFeatureEnabled } from "../../hooks/config/useFeatureEnabled";

type FeatureGateProps = {
  featureId: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export const FeatureGate: React.FC<FeatureGateProps> = ({ featureId, fallback = null, children }) => {
  const enabled = useFeatureEnabled(featureId);
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
};
