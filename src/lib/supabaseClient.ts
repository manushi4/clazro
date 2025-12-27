import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<any> | null = null;

// Default Supabase credentials (Platform Studio project)
const DEFAULT_SUPABASE_URL = "https://qwgpqdpfxjkygyouwgdr.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Z3BxZHBmeGpreWd5b3V3Z2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTY0MjEsImV4cCI6MjA4MDc3MjQyMX0._TkyrxuTE_mQ8JUdxg42vdQNW4xh20M-jk5wOe42jJw";

// Demo customer ID for development
export const DEMO_CUSTOMER_ID = process.env.EXPO_PUBLIC_DEMO_CUSTOMER_ID || "2b1195ab-1a06-4c94-8e5f-c7c318e7fc46";

export function getSupabaseClient(): SupabaseClient<any> {
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  client = createClient(url, anonKey, {
    db: { schema: "public" },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }) as unknown as SupabaseClient<any>;

  return client;
}

// Named export for backwards compatibility with admin hooks
export const supabase = getSupabaseClient();
