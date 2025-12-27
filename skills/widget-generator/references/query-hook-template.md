# Query Hook Template

## Standard Query Hook

Location: `src/hooks/queries/{role}/use{EntityName}Query.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

// ============================================
// 1. TYPE DEFINITIONS
// ============================================
export type {EntityName} = {
  id: string;
  customer_id: string;
  // Localized fields
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  // Domain fields
  status: 'active' | 'inactive' | 'archived';
  // Timestamps
  created_at: string;
  updated_at: string;
};

// ============================================
// 2. QUERY HOOK
// ============================================
export function use{EntityName}Query(options?: {
  limit?: number;
  status?: string;
  enabled?: boolean;
}) {
  const customerId = useCustomerId();
  const { limit = 10, status, enabled = true } = options || {};

  return useQuery({
    // Query key includes all variables that affect the result
    queryKey: ['{entity-name}', customerId, { limit, status }],

    // Query function
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('{table_name}')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      // Apply optional filters
      if (status) {
        query = query.eq('status', status);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as {EntityName}[];
    },

    // Query options
    enabled: !!customerId && enabled,
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 30,    // 30 minutes cache
  });
}

// ============================================
// 3. SINGLE ITEM QUERY (if needed)
// ============================================
export function use{EntityName}ByIdQuery(id: string | undefined) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['{entity-name}', 'detail', id],

    queryFn: async () => {
      if (!id) return null;

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('{table_name}')
        .select('*')
        .eq('id', id)
        .eq('customer_id', customerId)
        .single();

      if (error) throw error;
      return data as {EntityName};
    },

    enabled: !!id && !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}
```

## Export from Index

Add to `src/hooks/queries/{role}/index.ts`:

```typescript
export * from './use{EntityName}Query';
```

## Query Options Reference

| Option | Default | Purpose |
|--------|---------|---------|
| `staleTime` | 5 min | How long data is considered fresh |
| `gcTime` | 30 min | How long to keep in cache after unmount |
| `enabled` | true | Conditional fetching |
| `refetchOnWindowFocus` | true | Refetch when window gains focus |
| `refetchOnReconnect` | true | Refetch when network reconnects |
| `retry` | 3 | Number of retry attempts |

## Offline-First Pattern

```typescript
import { useNetworkStatus } from '../../../offline/networkStore';

export function use{EntityName}Query() {
  const { isOnline } = useNetworkStatus();
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['{entity-name}', customerId],
    queryFn: fetchData,

    // Offline-first options
    staleTime: 1000 * 60 * 60,           // 1 hour when offline-friendly
    gcTime: 1000 * 60 * 60 * 24,         // 24 hour cache
    networkMode: 'offlineFirst',          // Use cache when offline
    retry: isOnline ? 3 : 0,              // No retries when offline

    enabled: !!customerId,
  });
}
```

## Query with User Context

```typescript
import { useAuth } from '../../../context/AuthContext';

export function use{EntityName}Query() {
  const customerId = useCustomerId();
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['{entity-name}', customerId, user?.id, role],

    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('{table_name}')
        .select('*')
        .eq('customer_id', customerId);

      // Role-specific filtering
      if (role === 'student') {
        query = query.eq('student_id', user?.id);
      } else if (role === 'parent') {
        // Parent sees children's data - handled by RLS
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    enabled: !!customerId && !!user?.id,
  });
}
```

## Aggregation Query Pattern

```typescript
export function use{EntityName}StatsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['{entity-name}-stats', customerId],

    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Use RPC for complex aggregations
      const { data, error } = await supabase
        .rpc('get_{entity}_stats', { p_customer_id: customerId });

      if (error) throw error;
      return data;
    },

    staleTime: 1000 * 60 * 10,  // 10 minutes for stats
    enabled: !!customerId,
  });
}
```

## Query Key Conventions

```typescript
// List queries
['{entity-name}', customerId]
['{entity-name}', customerId, { limit, status, filter }]

// Detail queries
['{entity-name}', 'detail', id]

// Stats/aggregation queries
['{entity-name}-stats', customerId]

// User-specific queries
['{entity-name}', customerId, userId]

// Role-specific queries
['{entity-name}', customerId, role]
```
