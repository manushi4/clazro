export const EXPECTED_CONFIG_VERSION = "1.0.0";
export const EXPECTED_WIDGET_VERSION = "1.0.0";
export const EXPECTED_FEATURE_VERSION = "1.0.0";

export function isVersionMismatch(current?: string | number | null, expected?: string) {
  if (!current || !expected) return false;
  return String(current) !== String(expected);
}
