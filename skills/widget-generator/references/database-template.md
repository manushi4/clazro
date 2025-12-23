# Database Migration Template

## Table Schema Pattern

```sql
-- Migration: YYYYMMDD_create_{table_name}.sql
-- Purpose: {Brief description of what this table stores}

-- ============================================
-- 1. CREATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS {table_name} (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Multi-tenancy (REQUIRED for all tables)
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Ownership (if user-specific data)
  user_id UUID REFERENCES auth.users(id),

  -- Localized content columns (REQUIRED for user-facing text)
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,

  -- Domain-specific columns
  -- {Add your columns here}

  -- Status/type enums (use CHECK constraints)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

  -- Metadata timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================
-- Always index customer_id for multi-tenant queries
CREATE INDEX idx_{table_name}_customer ON {table_name}(customer_id);

-- Index user_id if querying by user
CREATE INDEX idx_{table_name}_user ON {table_name}(user_id);

-- Index frequently filtered columns
CREATE INDEX idx_{table_name}_status ON {table_name}(status);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (REQUIRED)
-- ============================================
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Policy: Users can read their own tenant's data
CREATE POLICY "{table_name}_select_tenant" ON {table_name}
  FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Policy: Role-based insert (admin only example)
CREATE POLICY "{table_name}_insert_admin" ON {table_name}
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.customer_id = {table_name}.customer_id
      AND ur.role = 'admin'
    )
  );

-- Policy: Users can update their own records
CREATE POLICY "{table_name}_update_own" ON {table_name}
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 5. CREATE UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER {table_name}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 6. SEED DATA (Demo Customer)
-- ============================================
INSERT INTO {table_name} (
  customer_id,
  user_id,
  title_en,
  title_hi,
  description_en,
  description_hi
) VALUES
  (
    '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',  -- Demo customer ID
    NULL,  -- or specific user ID
    'English Title',
    'हिंदी शीर्षक',
    'English description',
    'हिंदी विवरण'
  );
```

## RLS Policy Patterns

### Pattern 1: User Owns Record
```sql
CREATE POLICY "user_owns" ON {table_name}
  FOR ALL
  USING (user_id = auth.uid());
```

### Pattern 2: Role-Based Read Access
```sql
CREATE POLICY "role_read" ON {table_name}
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.customer_id = {table_name}.customer_id
      AND ur.role IN ('admin', 'teacher', 'parent')
    )
  );
```

### Pattern 3: Parent Sees Child's Data
```sql
CREATE POLICY "parent_child" ON {table_name}
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_children pc
      WHERE pc.parent_id = auth.uid()
      AND pc.child_id = {table_name}.student_id
    )
  );
```

### Pattern 4: Multi-Tenant Isolation
```sql
CREATE POLICY "tenant_isolation" ON {table_name}
  FOR ALL
  USING (
    customer_id IN (
      SELECT customer_id FROM user_roles WHERE user_id = auth.uid()
    )
  );
```

## Column Types Reference

| Data Type | SQL Type | Notes |
|-----------|----------|-------|
| ID | `UUID DEFAULT gen_random_uuid()` | Always use UUID |
| Text | `TEXT` | Prefer over VARCHAR |
| Localized Text | `title_en TEXT, title_hi TEXT` | Always pair _en and _hi |
| Boolean | `BOOLEAN DEFAULT false` | |
| Integer | `INTEGER` | |
| Decimal | `DECIMAL(10,2)` | For money |
| Date | `DATE` | Date only |
| Timestamp | `TIMESTAMPTZ` | Always use timezone-aware |
| JSON | `JSONB` | For flexible data |
| Enum | `TEXT CHECK (col IN ('a','b'))` | Use CHECK constraint |

## Localized Column Naming

For any user-facing text, create paired columns:

```sql
-- Single field
title_en TEXT NOT NULL,
title_hi TEXT,

-- Multiple fields
name_en TEXT NOT NULL,
name_hi TEXT,
description_en TEXT,
description_hi TEXT,
content_en TEXT,
content_hi TEXT,
```

**Rule:** `_en` is required, `_hi` is optional (app falls back to English).
