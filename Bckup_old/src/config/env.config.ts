/**
 * Environment Configuration
 * Replace @env imports - no package installation needed
 *
 * IMPORTANT: Update these values with your actual Supabase credentials
 * Get them from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
 */

// Supabase Configuration
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qrwroibhzgywaiecbcoa.supabase.co';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyd3JvaWJoemd5d2FpZWNiY29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MjkwNTksImV4cCI6MjA3MjAwNTA1OX0.YwFEMqbGMraRS5xeZVqEZsqeBTYNqn0AtbL1rzjvghM';

// App Configuration
export const APP_NAME = 'Manushi Coaching';
export const NODE_ENV = 'development';

// API Configuration
export const API_TIMEOUT = 30000;
export const API_RETRY_COUNT = 3;

// Razorpay Configuration (Optional)
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_HERE';

// Feature Flags
export const ENABLE_AI_INSIGHTS = true;
export const ENABLE_REAL_TIME_UPDATES = true;
export const ENABLE_PUSH_NOTIFICATIONS = true;

// Logging
export const LOG_LEVEL = 'debug';
export const ENABLE_ERROR_REPORTING = true;
