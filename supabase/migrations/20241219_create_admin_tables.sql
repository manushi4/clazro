-- Migration: 20241219_create_admin_tables.sql
-- Purpose: Create admin_users and admin_sessions tables for Sprint 1 Admin Phase 1
-- Tables: admin_users (2FA settings), admin_sessions (session tracking)

-- =============================================================================
-- 1. CREATE admin_users TABLE
-- =============================================================================
-- Stores admin-specific settings including 2FA configuration

CREATE TABLE IF NOT EXISTS admin_users (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to auth.users
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 2FA Settings
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  two_factor_backup_codes TEXT[],
  two_factor_verified_at TIMESTAMPTZ,
  last_2fa_at TIMESTAMPTZ,
  
  -- Admin status
  is_super_admin BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Login tracking
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT admin_users_user_id_unique UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_2fa_enabled ON admin_users(two_factor_enabled);

-- =============================================================================
-- 2. CREATE admin_sessions TABLE
-- =============================================================================
-- Tracks admin login sessions for security and audit

CREATE TABLE IF NOT EXISTS admin_sessions (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to admin user
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session info
  session_token TEXT,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  
  -- Location (optional)
  country TEXT,
  city TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  
  -- Session status
  is_active BOOLEAN DEFAULT true,
  terminated_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_started_at ON admin_sessions(started_at DESC);

-- =============================================================================
-- 3. ENABLE RLS
-- =============================================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. CREATE RLS POLICIES
-- =============================================================================

-- admin_users policies
-- Users can read their own admin settings
CREATE POLICY "admin_users_select_own" ON admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own admin settings (2FA)
CREATE POLICY "admin_users_update_own" ON admin_users
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can insert their own admin record
CREATE POLICY "admin_users_insert_own" ON admin_users
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Super admins can read all admin users
CREATE POLICY "admin_users_select_super" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_super_admin = true
    )
  );

-- admin_sessions policies
-- Users can read their own sessions
CREATE POLICY "admin_sessions_select_own" ON admin_sessions
  FOR SELECT
  USING (admin_id = auth.uid());

-- Users can insert their own sessions
CREATE POLICY "admin_sessions_insert_own" ON admin_sessions
  FOR INSERT
  WITH CHECK (admin_id = auth.uid());

-- Users can update their own sessions (end session)
CREATE POLICY "admin_sessions_update_own" ON admin_sessions
  FOR UPDATE
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Super admins can view all sessions
CREATE POLICY "admin_sessions_select_super" ON admin_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_super_admin = true
    )
  );

-- =============================================================================
-- 5. CREATE TRIGGERS
-- =============================================================================

-- Update updated_at on admin_users
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Update last_activity_at on admin_sessions
CREATE OR REPLACE FUNCTION update_admin_sessions_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_sessions_activity
  BEFORE UPDATE ON admin_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_sessions_activity();

-- =============================================================================
-- 6. CREATE audit_logs TABLE (if not exists)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  performed_by UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs policies
CREATE POLICY "audit_logs_insert_authenticated" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- 7. COMMENTS
-- =============================================================================

COMMENT ON TABLE admin_users IS 'Admin-specific settings including 2FA configuration';
COMMENT ON TABLE admin_sessions IS 'Tracks admin login sessions for security audit';
COMMENT ON TABLE audit_logs IS 'Audit trail for admin actions';

COMMENT ON COLUMN admin_users.two_factor_secret IS 'TOTP secret (encrypted in production)';
COMMENT ON COLUMN admin_users.two_factor_backup_codes IS 'One-time backup codes for account recovery';
COMMENT ON COLUMN admin_sessions.terminated_reason IS 'logout, timeout, forced, security';
