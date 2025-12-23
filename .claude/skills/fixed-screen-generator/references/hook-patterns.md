# Hook Patterns Reference

Complete templates for React Query hooks used in fixed screens.

---

## Table of Contents

1. [Query Hook - Single Entity](#query-hook---single-entity)
2. [Query Hook - List with Filters](#query-hook---list-with-filters)
3. [Query Hook - Aggregated Stats](#query-hook---aggregated-stats)
4. [Mutation Hook - Create](#mutation-hook---create)
5. [Mutation Hook - Update](#mutation-hook---update)
6. [Mutation Hook - Delete](#mutation-hook---delete)
7. [Mutation Hook - Bulk Actions](#mutation-hook---bulk-actions)
8. [Combined Hook Pattern](#combined-hook-pattern)
9. [Optimistic Updates](#optimistic-updates)
10. [Error Handling Patterns](#error-handling-patterns)

---

## Query Hook - Single Entity

Use for detail screens that fetch one record by ID.

```typescript
// src/hooks/queries/admin/use<Entity>DetailQuery.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

// Type definition matching database schema
export type <Entity>DetailType = {
  id: string;
  customer_id: string;
  user_id: string;

  // Localized fields
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;

  // Domain fields
  status: "active" | "inactive" | "deleted";
  amount?: number;
  date?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Relations (if joined)
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
};

export function use<Entity>DetailQuery(entityId: string | undefined) {
  const customerId = useCustomerId();

  return useQuery({
    // Unique key for caching
    queryKey: ["<entity>-detail", customerId, entityId],

    queryFn: async (): Promise<<Entity>DetailType> => {
      if (!entityId) throw new Error("Entity ID required");

      const { data, error } = await supabase
        .from("<table_name>")
        .select(`
          *,
          user:user_profiles!user_id (
            id,
            full_name,
            email
          )
        `)
        .eq("customer_id", customerId)
        .eq("id", entityId)
        .single();

      if (error) {
        console.error("[use<Entity>DetailQuery] Error:", error);
        throw error;
      }

      return data as <Entity>DetailType;
    },

    // Cache configuration
    staleTime: 2 * 60 * 1000,     // 2 minutes
    gcTime: 10 * 60 * 1000,       // 10 minutes (garbage collection)

    // Only fetch when we have required params
    enabled: !!customerId && !!entityId,

    // Retry configuration
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

---

## Query Hook - List with Filters

Use for list screens with pagination, sorting, and filtering.

```typescript
// src/hooks/queries/admin/use<Entity>ListQuery.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type <Entity>ListItemType = {
  id: string;
  title_en: string;
  title_hi?: string;
  status: string;
  amount?: number;
  created_at: string;
};

export type <Entity>ListFilters = {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "created_at" | "title_en" | "amount";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type <Entity>ListResponse = {
  data: <Entity>ListItemType[];
  count: number;
  page: number;
  totalPages: number;
};

export function use<Entity>ListQuery(filters: <Entity>ListFilters = {}) {
  const customerId = useCustomerId();

  const {
    status,
    search,
    dateFrom,
    dateTo,
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 20,
  } = filters;

  return useQuery({
    queryKey: ["<entity>-list", customerId, filters],

    queryFn: async (): Promise<<Entity>ListResponse> => {
      // Build query
      let query = supabase
        .from("<table_name>")
        .select("*", { count: "exact" })
        .eq("customer_id", customerId)
        .neq("status", "deleted");

      // Apply filters
      if (status) {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(`title_en.ilike.%${search}%,title_hi.ilike.%${search}%`);
      }

      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }

      if (dateTo) {
        query = query.lte("created_at", dateTo);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("[use<Entity>ListQuery] Error:", error);
        throw error;
      }

      return {
        data: data as <Entity>ListItemType[],
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },

    staleTime: 1 * 60 * 1000,  // 1 minute for lists
    enabled: !!customerId,
    keepPreviousData: true,    // Smooth pagination
  });
}
```

---

## Query Hook - Aggregated Stats

Use for dashboard widgets showing counts and summaries.

```typescript
// src/hooks/queries/admin/use<Entity>StatsQuery.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type <Entity>StatsType = {
  total: number;
  active: number;
  inactive: number;
  totalAmount: number;
  averageAmount: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
};

export function use<Entity>StatsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["<entity>-stats", customerId],

    queryFn: async (): Promise<<Entity>StatsType> => {
      // Get current month boundaries
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Parallel queries for better performance
      const [totalResult, activeResult, amountResult, thisMonthResult, lastMonthResult] =
        await Promise.all([
          // Total count
          supabase
            .from("<table_name>")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", customerId)
            .neq("status", "deleted"),

          // Active count
          supabase
            .from("<table_name>")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", customerId)
            .eq("status", "active"),

          // Sum and average
          supabase
            .from("<table_name>")
            .select("amount")
            .eq("customer_id", customerId)
            .neq("status", "deleted"),

          // This month count
          supabase
            .from("<table_name>")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", customerId)
            .gte("created_at", thisMonthStart),

          // Last month count
          supabase
            .from("<table_name>")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", customerId)
            .gte("created_at", lastMonthStart)
            .lte("created_at", lastMonthEnd),
        ]);

      // Calculate aggregates
      const amounts = amountResult.data?.map(r => r.amount || 0) || [];
      const totalAmount = amounts.reduce((sum, a) => sum + a, 0);
      const averageAmount = amounts.length > 0 ? totalAmount / amounts.length : 0;

      const thisMonth = thisMonthResult.count || 0;
      const lastMonth = lastMonthResult.count || 0;
      const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        inactive: (totalResult.count || 0) - (activeResult.count || 0),
        totalAmount,
        averageAmount,
        thisMonth,
        lastMonth,
        growth,
      };
    },

    staleTime: 5 * 60 * 1000,  // 5 minutes for stats
    enabled: !!customerId,
  });
}
```

---

## Mutation Hook - Create

```typescript
// src/hooks/mutations/admin/useCreate<Entity>.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";
import { useAuthStore } from "../../../stores/authStore";

export type Create<Entity>Input = {
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  amount?: number;
  status?: string;
};

export function useCreate<Entity>() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: async (input: Create<Entity>Input) => {
      const { data, error } = await supabase
        .from("<table_name>")
        .insert({
          ...input,
          customer_id: customerId,
          user_id: userId,
          status: input.status || "active",
        })
        .select()
        .single();

      if (error) {
        console.error("[useCreate<Entity>] Error:", error);
        throw error;
      }

      return data;
    },

    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["<entity>-list"] });
      queryClient.invalidateQueries({ queryKey: ["<entity>-stats"] });
    },

    onError: (error) => {
      console.error("[useCreate<Entity>] Mutation failed:", error);
    },
  });
}
```

---

## Mutation Hook - Update

```typescript
// src/hooks/mutations/admin/useUpdate<Entity>.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type Update<Entity>Input = {
  id: string;
  title_en?: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  amount?: number;
  status?: string;
};

export function useUpdate<Entity>() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Update<Entity>Input) => {
      const { data, error } = await supabase
        .from("<table_name>")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("customer_id", customerId)
        .select()
        .single();

      if (error) {
        console.error("[useUpdate<Entity>] Error:", error);
        throw error;
      }

      return data;
    },

    onSuccess: (data) => {
      // Update specific item in cache
      queryClient.setQueryData(
        ["<entity>-detail", customerId, data.id],
        data
      );
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ["<entity>-list"] });
    },
  });
}
```

---

## Mutation Hook - Delete

```typescript
// src/hooks/mutations/admin/useDelete<Entity>.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export function useDelete<Entity>() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (entityId: string) => {
      // Soft delete by setting status
      const { error } = await supabase
        .from("<table_name>")
        .update({
          status: "deleted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", entityId)
        .eq("customer_id", customerId);

      if (error) {
        console.error("[useDelete<Entity>] Error:", error);
        throw error;
      }

      return entityId;
    },

    onSuccess: (entityId) => {
      // Remove from detail cache
      queryClient.removeQueries({
        queryKey: ["<entity>-detail", customerId, entityId]
      });
      // Refresh list
      queryClient.invalidateQueries({ queryKey: ["<entity>-list"] });
      queryClient.invalidateQueries({ queryKey: ["<entity>-stats"] });
    },
  });
}
```

---

## Mutation Hook - Bulk Actions

```typescript
// src/hooks/mutations/admin/useBulk<Entity>Actions.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type BulkActionType = "activate" | "deactivate" | "delete";

export function useBulk<Entity>Actions() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async ({
      ids,
      action
    }: {
      ids: string[];
      action: BulkActionType;
    }) => {
      const statusMap: Record<BulkActionType, string> = {
        activate: "active",
        deactivate: "inactive",
        delete: "deleted",
      };

      const { error } = await supabase
        .from("<table_name>")
        .update({
          status: statusMap[action],
          updated_at: new Date().toISOString(),
        })
        .in("id", ids)
        .eq("customer_id", customerId);

      if (error) {
        console.error("[useBulk<Entity>Actions] Error:", error);
        throw error;
      }

      return { ids, action };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["<entity>-list"] });
      queryClient.invalidateQueries({ queryKey: ["<entity>-stats"] });
    },
  });
}
```

---

## Combined Hook Pattern

For screens that need both query and mutations together.

```typescript
// src/hooks/admin/use<Entity>Manager.ts
import { use<Entity>DetailQuery } from "../queries/admin/use<Entity>DetailQuery";
import { useUpdate<Entity> } from "../mutations/admin/useUpdate<Entity>";
import { useDelete<Entity> } from "../mutations/admin/useDelete<Entity>";

export function use<Entity>Manager(entityId: string | undefined) {
  const query = use<Entity>DetailQuery(entityId);
  const updateMutation = useUpdate<Entity>();
  const deleteMutation = useDelete<Entity>();

  return {
    // Query state
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Mutations
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    delete: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Combined state
    isMutating: updateMutation.isPending || deleteMutation.isPending,
  };
}
```

---

## Optimistic Updates

For better UX on updates.

```typescript
// src/hooks/mutations/admin/useOptimisticUpdate<Entity>.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export function useOptimisticUpdate<Entity>() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from("<table_name>")
        .update(updates)
        .eq("id", id)
        .eq("customer_id", customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Optimistic update
    onMutate: async ({ id, ...updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["<entity>-detail", customerId, id]
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(
        ["<entity>-detail", customerId, id]
      );

      // Optimistically update
      queryClient.setQueryData(
        ["<entity>-detail", customerId, id],
        (old: any) => ({ ...old, ...updates })
      );

      return { previousData };
    },

    // Rollback on error
    onError: (err, { id }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["<entity>-detail", customerId, id],
          context.previousData
        );
      }
    },

    // Refetch after success
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["<entity>-detail", customerId, id]
      });
    },
  });
}
```

---

## Error Handling Patterns

Standard error handling for hooks.

```typescript
// src/hooks/utils/useQueryWithErrorHandling.ts
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { addBreadcrumb } from "../../error/errorReporting";

export function useQueryWithErrorHandling<T>(
  options: UseQueryOptions<T, Error>
) {
  return useQuery({
    ...options,
    onError: (error) => {
      // Log to error tracking
      addBreadcrumb({
        category: "query",
        message: `Query failed: ${options.queryKey?.[0]}`,
        level: "error",
        data: { error: error.message },
      });

      // Call original onError if provided
      options.onError?.(error);
    },
  });
}

// Usage in hook
export function use<Entity>Query(id: string) {
  const customerId = useCustomerId();

  return useQueryWithErrorHandling({
    queryKey: ["<entity>", customerId, id],
    queryFn: async () => {
      // ... query logic
    },
  });
}
```

---

## Export Pattern

Always export from index files.

```typescript
// src/hooks/queries/admin/index.ts
export { use<Entity>DetailQuery } from "./use<Entity>DetailQuery";
export { use<Entity>ListQuery } from "./use<Entity>ListQuery";
export { use<Entity>StatsQuery } from "./use<Entity>StatsQuery";

// Re-export types
export type {
  <Entity>DetailType,
  <Entity>ListItemType,
  <Entity>ListFilters,
  <Entity>StatsType,
} from "./use<Entity>DetailQuery";
```

```typescript
// src/hooks/mutations/admin/index.ts
export { useCreate<Entity> } from "./useCreate<Entity>";
export { useUpdate<Entity> } from "./useUpdate<Entity>";
export { useDelete<Entity> } from "./useDelete<Entity>";
export { useBulk<Entity>Actions } from "./useBulk<Entity>Actions";
```

---

## Query Key Conventions

Consistent query keys for proper cache management.

```typescript
// Query Key Patterns
["<entity>-detail", customerId, entityId]     // Single item
["<entity>-list", customerId, filters]        // List with filters
["<entity>-stats", customerId]                // Aggregated stats
["<entity>-search", customerId, searchTerm]   // Search results

// Examples
["student-fee-detail", "customer-123", "fee-456"]
["teacher-payroll-list", "customer-123", { month: "2024-01" }]
["admission-stats", "customer-123"]
```

---

## Stale Time Guidelines

| Data Type | Stale Time | Reason |
|-----------|------------|--------|
| Stats/Aggregates | 5 minutes | Changes infrequently |
| Detail View | 2 minutes | May be edited |
| List View | 1 minute | Needs fresher data |
| Search Results | 30 seconds | Real-time feel |
| User Profile | 10 minutes | Rarely changes |
