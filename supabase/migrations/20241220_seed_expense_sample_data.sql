-- Migration: 20241220_seed_expense_sample_data.sql
-- Purpose: Insert sample expense data for testing the expense summary widget
-- This inserts expense data for ALL existing customers

-- =============================================================================
-- INSERT SAMPLE EXPENSE TRANSACTIONS
-- =============================================================================

-- Salary expenses
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'salary',
  50000.00,
  'Teacher Salary - December',
  'शिक्षक वेतन - दिसंबर',
  'completed',
  'bank_transfer',
  NOW() - INTERVAL '5 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Teacher Salary - December'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'salary',
  35000.00,
  'Staff Salary - December',
  'स्टाफ वेतन - दिसंबर',
  'completed',
  'bank_transfer',
  NOW() - INTERVAL '5 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Staff Salary - December'
);

-- Utilities expenses
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'utilities',
  8500.00,
  'Electricity Bill - December',
  'बिजली बिल - दिसंबर',
  'completed',
  'bank_transfer',
  NOW() - INTERVAL '3 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Electricity Bill - December'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'utilities',
  2500.00,
  'Internet Bill - December',
  'इंटरनेट बिल - दिसंबर',
  'completed',
  'upi',
  NOW() - INTERVAL '2 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Internet Bill - December'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'utilities',
  1500.00,
  'Water Bill - December',
  'पानी बिल - दिसंबर',
  'completed',
  'cash',
  NOW() - INTERVAL '4 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Water Bill - December'
);

-- Materials expenses
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'materials',
  5000.00,
  'Stationery Purchase',
  'स्टेशनरी खरीद',
  'completed',
  'card',
  NOW() - INTERVAL '7 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Stationery Purchase'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'materials',
  12000.00,
  'Lab Equipment',
  'प्रयोगशाला उपकरण',
  'completed',
  'bank_transfer',
  NOW() - INTERVAL '10 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Lab Equipment'
);

-- Other expenses
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'other',
  3000.00,
  'Maintenance & Repairs',
  'रखरखाव और मरम्मत',
  'completed',
  'cash',
  NOW() - INTERVAL '6 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Maintenance & Repairs'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'other',
  2000.00,
  'Miscellaneous Expenses',
  'विविध खर्च',
  'completed',
  'cash',
  NOW() - INTERVAL '1 day'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Miscellaneous Expenses'
);

-- Pending expenses
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'utilities',
  4000.00,
  'Pending Phone Bill',
  'लंबित फोन बिल',
  'pending',
  'bank_transfer',
  NOW()
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Pending Phone Bill'
);

-- Historical expense data (last month)
INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'salary',
  80000.00,
  'Last Month Salaries',
  'पिछले महीने के वेतन',
  'completed',
  'bank_transfer',
  NOW() - INTERVAL '35 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Last Month Salaries'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'utilities',
  10000.00,
  'Last Month Utilities',
  'पिछले महीने की उपयोगिताएं',
  'completed',
  'bank_transfer',
  NOW() - INTERVAL '38 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Last Month Utilities'
);

INSERT INTO financial_transactions (
  customer_id, type, category, amount, description_en, description_hi, 
  status, payment_method, transaction_date
)
SELECT 
  c.id,
  'expense',
  'materials',
  8000.00,
  'Last Month Materials',
  'पिछले महीने की सामग्री',
  'completed',
  'card',
  NOW() - INTERVAL '40 days'
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM financial_transactions ft 
  WHERE ft.customer_id = c.id AND ft.description_en = 'Last Month Materials'
);

-- =============================================================================
-- SUMMARY OF EXPENSE SAMPLE DATA
-- =============================================================================
-- Current Period (this month):
--   Salary: 50000 + 35000 = 85,000
--   Utilities: 8500 + 2500 + 1500 = 12,500
--   Materials: 5000 + 12000 = 17,000
--   Other: 3000 + 2000 = 5,000
--   Total Expenses: 119,500
--   Pending: 4,000
--
-- Last Period (last month):
--   Salary: 80,000
--   Utilities: 10,000
--   Materials: 8,000
--   Total: 98,000
--
-- Growth: (119500 - 98000) / 98000 * 100 = ~22% increase in expenses
