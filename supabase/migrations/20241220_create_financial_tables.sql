-- Migration: 20241220_create_financial_tables.sql
-- Purpose: Create financial_transactions table for finance widgets
-- Tables: financial_transactions (revenue, expenses tracking)

-- =============================================================================
-- 1. CREATE financial_transactions TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS financial_transactions (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Customer/tenant
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Transaction type
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  
  -- Category (fees, subscription, salary, utilities, etc.)
  category TEXT NOT NULL,
  
  -- Amount
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Localized description
  description_en TEXT,
  description_hi TEXT,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  
  -- Reference info
  reference_number TEXT,
  reference_type TEXT, -- invoice, receipt, payment_gateway, manual
  
  -- Related entities
  user_id UUID REFERENCES auth.users(id),
  invoice_id UUID,
  
  -- Payment method
  payment_method TEXT, -- cash, card, upi, bank_transfer, cheque
  payment_gateway TEXT, -- razorpay, stripe, paytm, etc.
  gateway_transaction_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  -- Timestamps
  transaction_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_financial_transactions_customer ON financial_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user ON financial_transactions(user_id);

-- =============================================================================
-- 2. RLS CONFIGURATION
-- =============================================================================

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. CREATE RLS POLICIES
-- =============================================================================

-- Admins can read all transactions for their customer
CREATE POLICY "financial_transactions_select_admin" ON financial_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.user_id = auth.uid()::text
      AND p.customer_id = financial_transactions.customer_id
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Admins can insert transactions
CREATE POLICY "financial_transactions_insert_admin" ON financial_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.user_id = auth.uid()::text
      AND p.customer_id = financial_transactions.customer_id
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update transactions
CREATE POLICY "financial_transactions_update_admin" ON financial_transactions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.user_id = auth.uid()::text
      AND p.customer_id = financial_transactions.customer_id
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Any authenticated user can view transactions for their customer
CREATE POLICY "financial_transactions_select_own" ON financial_transactions
  FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles 
      WHERE user_id = auth.uid()::text
    )
  );

-- =============================================================================
-- 4. CREATE TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_financial_transactions_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_transactions_updated_at();

-- =============================================================================
-- 5. INSERT SAMPLE DATA
-- =============================================================================

-- Note: Replace 'your-customer-id' with actual customer UUID when running
-- INSERT INTO financial_transactions (customer_id, type, category, amount, description_en, description_hi, status, payment_method) VALUES
--   ('your-customer-id', 'income', 'fees', 15000.00, 'Tuition Fee - January', 'ट्यूशन फीस - जनवरी', 'completed', 'upi'),
--   ('your-customer-id', 'income', 'fees', 12000.00, 'Tuition Fee - January', 'ट्यूशन फीस - जनवरी', 'completed', 'card'),
--   ('your-customer-id', 'income', 'subscription', 5000.00, 'Premium Subscription', 'प्रीमियम सदस्यता', 'completed', 'upi'),
--   ('your-customer-id', 'expense', 'salary', 50000.00, 'Teacher Salary', 'शिक्षक वेतन', 'completed', 'bank_transfer'),
--   ('your-customer-id', 'expense', 'utilities', 8000.00, 'Electricity Bill', 'बिजली बिल', 'completed', 'bank_transfer'),
--   ('your-customer-id', 'income', 'fees', 18000.00, 'Exam Fee', 'परीक्षा शुल्क', 'pending', 'upi');

-- =============================================================================
-- 6. COMMENTS
-- =============================================================================

COMMENT ON TABLE financial_transactions IS 'Financial transactions for revenue and expense tracking';
COMMENT ON COLUMN financial_transactions.type IS 'income or expense';
COMMENT ON COLUMN financial_transactions.category IS 'fees, subscription, salary, utilities, materials, etc.';
COMMENT ON COLUMN financial_transactions.status IS 'completed, pending, failed, refunded';
