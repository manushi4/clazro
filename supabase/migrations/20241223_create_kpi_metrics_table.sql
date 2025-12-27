-- ============================================================================
-- Migration: Create KPI Metrics Table
-- Date: 2024-12-23
-- Purpose: Store key performance indicators for admin analytics dashboard
-- Sprint: 7 - Analytics Dashboard (KPIGridWidget)
-- ============================================================================

-- Create the kpi_metrics table
CREATE TABLE IF NOT EXISTS kpi_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Metric identification
  metric_key TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',

  -- Localized labels
  label_en TEXT NOT NULL,
  label_hi TEXT,

  -- Values
  value NUMERIC NOT NULL DEFAULT 0,
  previous_value NUMERIC,

  -- Display configuration
  unit TEXT,
  format_type TEXT NOT NULL DEFAULT 'number' CHECK (format_type IN ('number', 'currency', 'percentage', 'duration')),
  icon TEXT,
  color TEXT,
  trend TEXT CHECK (trend IN ('up', 'down', 'neutral')),

  -- Access control
  allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['admin'],

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_calculated_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint per customer and metric
  UNIQUE(customer_id, metric_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_customer ON kpi_metrics(customer_id);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_category ON kpi_metrics(category);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_status ON kpi_metrics(status);

-- Enable Row Level Security
ALTER TABLE kpi_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant isolation based on user_profiles
-- CRITICAL: Use user_profiles table (not user_roles) with ::text cast for auth.uid()
CREATE POLICY "kpi_metrics_tenant_isolation" ON kpi_metrics
  FOR ALL USING (
    customer_id IN (
      SELECT customer_id
      FROM user_profiles
      WHERE user_id = auth.uid()::text
    )
  );

-- Trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_kpi_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_kpi_metrics_updated_at ON kpi_metrics;
CREATE TRIGGER trigger_kpi_metrics_updated_at
  BEFORE UPDATE ON kpi_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_kpi_metrics_updated_at();
