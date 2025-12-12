/**
 * Supabase REST API Configuration
 * Simple approach without complex client dependencies
 * Manushi Coaching Platform Backend
 */

// Supabase configuration
const SUPABASE_URL = 'https://qrwroibhzgywaiecbcoa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyd3JvaWJoemd5d2FpZWNiY29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MjkwNTksImV4cCI6MjA3MjAwNTA1OX0.YwFEMqbGMraRS5xeZVqEZsqeBTYNqn0AtbL1rzjvghM';

// API endpoints
export const SUPABASE_API = {
  BASE_URL: `${SUPABASE_URL}/rest/v1`,
  AUTH_URL: `${SUPABASE_URL}/auth/v1`,
  STORAGE_URL: `${SUPABASE_URL}/storage/v1`,
};

// Default headers for Supabase REST API
const getHeaders = (authToken?: string | null) => ({
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${authToken || SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
});

// Simple API client using fetch
export class SupabaseRestClient {
  private authToken: string | null = null;

  // Set authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Generic GET request
  async get(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${SUPABASE_API.BASE_URL}${endpoint}`);
    if (params) {
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, params[key])
      );
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(this.authToken),
    });

    if (!response.ok) {
      throw new Error(`GET ${endpoint}: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Generic POST request
  async post(endpoint: string, data: any) {
    const response = await fetch(`${SUPABASE_API.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(this.authToken),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`POST ${endpoint}: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Generic PUT request
  async put(endpoint: string, data: any) {
    const response = await fetch(`${SUPABASE_API.BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(this.authToken),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`PUT ${endpoint}: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Generic DELETE request
  async delete(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${SUPABASE_API.BASE_URL}${endpoint}`);
    if (params) {
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, params[key])
      );
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: getHeaders(this.authToken),
    });

    if (!response.ok) {
      throw new Error(`DELETE ${endpoint}: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Test connection
  async testConnection() {
    try {
      const response = await fetch(SUPABASE_URL, {
        method: 'HEAD',
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Authentication methods
  auth = {
    // Sign up with email and password
    signUp: async (email: string, password: string, userData?: any) => {
      const response = await fetch(`${SUPABASE_API.AUTH_URL}/signup`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          data: userData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sign up failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },

    // Sign in with email and password
    signIn: async (email: string, password: string) => {
      const response = await fetch(`${SUPABASE_API.AUTH_URL}/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sign in failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },

    // Sign out
    signOut: async () => {
      const response = await fetch(`${SUPABASE_API.AUTH_URL}/logout`, {
        method: 'POST',
        headers: getHeaders(this.authToken),
      });

      if (!response.ok) {
        throw new Error(`Sign out failed: ${response.status} ${response.statusText}`);
      }

      this.setAuthToken(null);
      return { success: true };
    },
  };
}

// Create and export a singleton instance
export const supabaseRest = new SupabaseRestClient();

// Helper function to test connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const connected = await supabaseRest.testConnection();
    console.log(connected ? '✅ Supabase REST API connected' : '❌ Supabase connection failed');
    return connected;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return false;
  }
};