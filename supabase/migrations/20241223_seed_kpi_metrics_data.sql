-- ============================================================================
-- Migration: Seed KPI Metrics Sample Data
-- Date: 2024-12-23
-- Purpose: Insert sample KPI data for admin analytics dashboard
-- Sprint: 7 - Analytics Dashboard (KPIGridWidget)
-- ============================================================================

-- Insert sample KPI metrics for each customer
INSERT INTO kpi_metrics (customer_id, metric_key, category, label_en, label_hi, value, previous_value, unit, format_type, icon, color, trend, allowed_roles, status, last_calculated_at)
SELECT
  c.id,
  'total_students',
  'users',
  'Total Students',
  'कुल छात्र',
  2547,
  2389,
  NULL,
  'number',
  'school',
  'primary',
  'up',
  ARRAY['admin'],
  'active',
  now()
FROM customers c
ON CONFLICT (customer_id, metric_key) DO UPDATE SET
  value = EXCLUDED.value,
  previous_value = EXCLUDED.previous_value,
  updated_at = now();

INSERT INTO kpi_metrics (customer_id, metric_key, category, label_en, label_hi, value, previous_value, unit, format_type, icon, color, trend, allowed_roles, status, last_calculated_at)
SELECT
  c.id,
  'total_teachers',
  'users',
  'Total Teachers',
  'कुल शिक्षक',
  127,
  119,
  NULL,
  'number',
  'account-tie',
  'secondary',
  'up',
  ARRAY['admin'],
  'active',
  now()
FROM customers c
ON CONFLICT (customer_id, metric_key) DO UPDATE SET
  value = EXCLUDED.value,
  previous_value = EXCLUDED.previous_value,
  updated_at = now();

INSERT INTO kpi_metrics (customer_id, metric_key, category, label_en, label_hi, value, previous_value, unit, format_type, icon, color, trend, allowed_roles, status, last_calculated_at)
SELECT
  c.id,
  'total_parents',
  'users',
  'Total Parents',
  'कुल अभिभावक',
  4123,
  3890,
  NULL,
  'number',
  'account-group',
  'tertiary',
  'up',
  ARRAY['admin'],
  'active',
  now()
FROM customers c
ON CONFLICT (customer_id, metric_key) DO UPDATE SET
  value = EXCLUDED.value,
  previous_value = EXCLUDED.previous_value,
  updated_at = now();

INSERT INTO kpi_metrics (customer_id, metric_key, category, label_en, label_hi, value, previous_value, unit, format_type, icon, color, trend, allowed_roles, status, last_calculated_at)
SELECT
  c.id,
  'monthly_revenue',
  'finance',
  'Monthly Revenue',
  'मासिक राजस्व',
  1245000,
  1180000,
  'INR',
  'currency',
  'currency-inr',
  'success',
  'up',
  ARRAY['admin'],
  'active',
  now()
FROM customers c
ON CONFLICT (customer_id, metric_key) DO UPDATE SET
  value = EXCLUDED.value,
  previous_value = EXCLUDED.previous_value,
  updated_at = now();

INSERT INTO kpi_metrics (customer_id, metric_key, category, label_en, label_hi, value, previous_value, unit, format_type, icon, color, trend, allowed_roles, status, last_calculated_at)
SELECT
  c.id,
  'fee_collection_rate',
  'finance',
  'Fee Collection Rate',
  'शुल्क संग्रह दर',
  87.5,
  82.3,
  '%',
  'percentage',
  'percent',
  'success',
  'up',
  ARRAY['admin'],
  'active',
  now()
FROM customers c
ON CONFLICT (customer_id, metric_key) DO UPDATE SET
  value = EXCLUDED.value,
  previous_value = EXCLUDED.previous_value,
  updated_at = now();

INSERT INTO kpi_metrics (customer_id, metric_key, category, label_en, label_hi, value, previous_value, unit, format_type, icon, color, trend, allowed_roles, status, last_calculated_at)
SELECT
  c.id,
  'average_attendance',
  'engagement',
  'Average Attendance',
  'औसत उपस्थिति',
  92.4,
  91.8,
  '%',
  'percentage',
  'calendar-check',
  'primary',
  'up',
  ARRAY['admin'],
  'active',
  now()
FROM customers c
ON CONFLICT (customer_id, metric_key) DO UPDATE SET
  value = EXCLUDED.value,
  previous_value = EXCLUDED.previous_value,
  updated_at = now();

INSERT INTO kpi_metrics (customer_id, metric_key, category, label_en, label_hi, value, previous_value, unit, format_type, icon, color, trend, allowed_roles, status, last_calculated_at)
SELECT
  c.id,
  'active_sessions',
  'engagement',
  'Active Sessions',
  'सक्रिय सत्र',
  342,
  318,
  NULL,
  'number',
  'access-point',
  'warning',
  'up',
  ARRAY['admin'],
  'active',
  now()
FROM customers c
ON CONFLICT (customer_id, metric_key) DO UPDATE SET
  value = EXCLUDED.value,
  previous_value = EXCLUDED.previous_value,
  updated_at = now();

INSERT INTO kpi_metrics (customer_id, metric_key, category, label_en, label_hi, value, previous_value, unit, format_type, icon, color, trend, allowed_roles, status, last_calculated_at)
SELECT
  c.id,
  'content_views',
  'content',
  'Content Views',
  'सामग्री दृश्य',
  45678,
  42890,
  NULL,
  'number',
  'eye',
  'secondary',
  'up',
  ARRAY['admin'],
  'active',
  now()
FROM customers c
ON CONFLICT (customer_id, metric_key) DO UPDATE SET
  value = EXCLUDED.value,
  previous_value = EXCLUDED.previous_value,
  updated_at = now();

INSERT INTO kpi_metrics (customer_id, metric_key, category, label_en, label_hi, value, previous_value, unit, format_type, icon, color, trend, allowed_roles, status, last_calculated_at)
SELECT
  c.id,
  'avg_session_duration',
  'engagement',
  'Avg Session Duration',
  'औसत सत्र अवधि',
  28,
  25,
  'min',
  'duration',
  'clock-outline',
  'tertiary',
  'up',
  ARRAY['admin'],
  'active',
  now()
FROM customers c
ON CONFLICT (customer_id, metric_key) DO UPDATE SET
  value = EXCLUDED.value,
  previous_value = EXCLUDED.previous_value,
  updated_at = now();

INSERT INTO kpi_metrics (customer_id, metric_key, category, label_en, label_hi, value, previous_value, unit, format_type, icon, color, trend, allowed_roles, status, last_calculated_at)
SELECT
  c.id,
  'pending_fees',
  'finance',
  'Pending Fees',
  'लंबित शुल्क',
  178500,
  215000,
  'INR',
  'currency',
  'currency-inr',
  'error',
  'down',
  ARRAY['admin'],
  'active',
  now()
FROM customers c
ON CONFLICT (customer_id, metric_key) DO UPDATE SET
  value = EXCLUDED.value,
  previous_value = EXCLUDED.previous_value,
  updated_at = now();

-- ============================================================================
-- Verify insertion
-- ============================================================================
DO $$
DECLARE
  metric_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO metric_count FROM kpi_metrics WHERE status = 'active';

  IF metric_count >= 10 THEN
    RAISE NOTICE 'KPI Metrics seeded successfully: % active metrics', metric_count;
  ELSE
    RAISE WARNING 'Expected at least 10 metrics, got %', metric_count;
  END IF;
END $$;
