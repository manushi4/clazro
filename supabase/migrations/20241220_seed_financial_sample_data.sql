-- Migration: 20241220_seed_financial_sample_data.sql
-- Purpose: Insert sample financial data for testing the revenue summary widget
-- This inserts data for ALL existing customers

-- =============================================================================
-- INSERT SAMPLE FINANCIAL TRANSACTIONS
-- =============================================================================

-- Insert sample income transactions (fees, subscriptions, other)
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'fees',
  15000.00,
  'Tuition Fee - Student A',
  'ट्यूशन फीस - छात्र A',
  'completed',
  'upi',
  NOW() - INTERVAL '2 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Tuition Fee - Student A'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'fees',
  12500.00,
  'Tuition Fee - Student B',
  'ट्यूशन फीस - छात्र B',
  'completed',
  'card',
  NOW() - INTERVAL '5 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Tuition Fee - Student B'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'fees',
  18000.00,
  'Tuition Fee - Student C',
  'ट्यूशन फीस - छात्र C',
  'completed',
  'bank_transfer',
  NOW() - INTERVAL '10 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Tuition Fee - Student C'
);

-- Subscription income
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'subscription',
  5000.00,
  'Premium Plan - Monthly',
  'प्रीमियम प्लान - मासिक',
  'completed',
  'upi',
  NOW() - INTERVAL '3 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Premium Plan - Monthly'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'subscription',
  8500.00,
  'Premium Plan - Quarterly',
  'प्रीमियम प्लान - त्रैमासिक',
  'completed',
  'card',
  NOW() - INTERVAL '15 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Premium Plan - Quarterly'
);

-- Other income
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'other',
  2500.00,
  'Late Fee Collection',
  'विलंब शुल्क संग्रह',
  'completed',
  'cash',
  NOW() - INTERVAL '1 day'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Late Fee Collection'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'other',
  3000.00,
  'Library Fine',
  'पुस्तकालय जुर्माना',
  'completed',
  'cash',
  NOW() - INTERVAL '7 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Library Fine'
);

-- Pending payments
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'fees',
  20000.00,
  'Pending Fee - Student D',
  'लंबित शुल्क - छात्र D',
  'pending',
  'upi',
  NOW() - INTERVAL '1 day'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Pending Fee - Student D'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'subscription',
  4500.00,
  'Pending Subscription Renewal',
  'लंबित सदस्यता नवीनीकरण',
  'pending',
  'card',
  NOW()
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Pending Subscription Renewal'
);

-- Historical data for comparison (last month)
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'fees',
  42000.00,
  'Last Month Fees Collection',
  'पिछले महीने की फीस संग्रह',
  'completed',
  'bank_transfer',
  NOW() - INTERVAL '35 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Last Month Fees Collection'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'income',
  'subscription',
  10000.00,
  'Last Month Subscriptions',
  'पिछले महीने की सदस्यता',
  'completed',
  'upi',
  NOW() - INTERVAL '40 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Last Month Subscriptions'
);

-- =============================================================================
-- SUMMARY OF SAMPLE DATA
-- =============================================================================
-- Current Period (this month):
--   Fees: 15000 + 12500 + 18000 = 45,500
--   Subscriptions: 5000 + 8500 = 13,500
--   Other: 2500 + 3000 = 5,500
--   Total Revenue: 64,500
--   Pending: 20000 + 4500 = 24,500
--
-- Last Period (last month):
--   Fees: 42,000
--   Subscriptions: 10,000
--   Total: 52,000
--
-- Growth: (64500 - 52000) / 52000 * 100 = ~24% growth
