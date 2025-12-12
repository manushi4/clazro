# Data Contracts - Stable Query Interfaces

## Purpose

This folder contains **locked data contracts** that define stable interfaces between the frontend and backend. Once established, these contracts **should not have breaking changes** without proper versioning.

## Why Data Contracts?

1. **Stability**: Prevents accidental breaking changes
2. **Documentation**: Single source of truth for data shapes
3. **Type Safety**: TypeScript types + Zod validation
4. **Query Keys**: Standardized React Query keys for caching
5. **Stale Time**: Documented cache policies per resource
6. **Pagination**: Keyset cursor pagination for performance

## Contract Structure

Each contract file should include:

```typescript
// 1. TypeScript interfaces
export interface ResourceListItem { ... }
export interface ResourceFilters { ... }
export interface ResourceDetail { ... }

// 2. Zod schemas for runtime validation
export const ResourceSchema = z.object({ ... });

// 3. Query keys for React Query
export const resourceQueryKeys = {
  all: ['resource'] as const,
  list: (filters) => [...],
  detail: (id) => [...],
};

// 4. Stale time configuration
export const resourceStaleTime = {
  list: 30 * 1000,
  detail: 60 * 1000,
};

// 5. Placeholder data to prevent layout shift
export const resourcePlaceholder = { ... };
```

## Available Contracts

### Sprint 1 Contracts (✅ LOCKED - 2025-11-02)

- **`dashboardKpis.ts`** - Admin dashboard KPI metrics
- **`userManagement.ts`** - User list, filters, mutations (keyset pagination)
- **`supportTickets.ts`** - Support tickets with SLA tracking (keyset pagination)
- **`financialMetrics.ts`** - Financial reports, revenue trends, dues aging (keyset pagination)

### Sprint 2-3 Contracts (Coming Soon)

- Financial daily metrics
- Dunning ladder configuration
- Integration health
- Messaging center templates

## Keyset Pagination

All list contracts use **keyset pagination** (cursor-based) instead of OFFSET for better performance:

```typescript
interface ListFilters {
  limit: number;
  cursor?: string; // timestamp for ordering
  cursor_id?: string; // UUID for tie-breaking
}

interface ListResponse {
  items: T[];
  nextCursor: { cursor: string; cursor_id: string } | null;
  hasMore: boolean;
}
```

### Why Keyset?

- **Consistent results**: No duplicate/missing rows during pagination
- **Better performance**: Index-friendly queries (no table scans)
- **Scalable**: Performance doesn't degrade with large offsets

## Usage Example

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { userQueryKeys, UserListFilters } from '@/types/contracts/userManagement';

export function useUsers(filters: UserListFilters) {
  return useInfiniteQuery({
    queryKey: userQueryKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      // Call Supabase RPC with cursor
      const { data } = await supabase.rpc('get_users_keyset', {
        ...filters,
        p_cursor: pageParam?.cursor,
        p_cursor_id: pageParam?.cursor_id,
      });
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: userStaleTime.list,
  });
}
```

## Breaking Changes

If you **must** make a breaking change:

1. Create a new contract file with version suffix (e.g., `userManagementV2.ts`)
2. Keep the old contract for backward compatibility
3. Update hooks gradually
4. Deprecate old contract after migration

## Adding New Contracts

Before adding a contract:

1. Design the schema with the backend team
2. Add indexes for all filter fields
3. Create Supabase RPC function (for keyset pagination)
4. Write Zod schemas for validation
5. Document stale time policies
6. Add to this README

## Contract Checklist

When creating a new contract, ensure:

- [ ] TypeScript interfaces defined
- [ ] Zod schemas for validation
- [ ] Query keys exported
- [ ] Stale time documented
- [ ] Keyset pagination support (for lists)
- [ ] Placeholder data included
- [ ] Filters interface defined
- [ ] Mutation inputs defined (if applicable)
- [ ] Added to this README
