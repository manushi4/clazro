// Deprecated: service-role client must not be used in the app. Admin writes go through the Edge Function.
export function getAdminSupabaseClient() {
  console.warn("getAdminSupabaseClient is deprecated. Use the admin-config Edge Function instead.");
  return null;
}
