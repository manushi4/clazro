/**
 * Safe Query Wrapper
 *
 * Ensures queries NEVER return undefined data
 * Use this wrapper instead of useQuery directly for critical queries
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Safe query wrapper that ensures data is never undefined
 *
 * @param options - React Query options with required initialData
 * @returns Query result with guaranteed non-undefined data
 */
export function useSafeQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends ReadonlyArray<unknown> = ReadonlyArray<unknown>
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData: TData | (() => TData);
  }
): UseQueryResult<TData, TError> {
  const result = useQuery(options);

  // Double-check: if data is still undefined, use initialData
  if (result.data === undefined && options.initialData) {
    return {
      ...result,
      data: typeof options.initialData === 'function'
        ? (options.initialData as () => TData)()
        : options.initialData,
    };
  }

  return result;
}

/**
 * Safe array query - guarantees empty array as minimum
 */
export function useSafeArrayQuery<
  TQueryFnData extends any[] = any[],
  TError = unknown,
  TData extends any[] = TQueryFnData,
  TQueryKey extends ReadonlyArray<unknown> = ReadonlyArray<unknown>
>(
  options: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'initialData'>
): UseQueryResult<TData, TError> {
  const result = useQuery({
    ...options,
    placeholderData: [] as any,
  });

  // Ensure data is always an array
  return {
    ...result,
    data: (result.data ?? []) as TData,
  };
}

/**
 * Safe object query - guarantees null as minimum
 */
export function useSafeObjectQuery<
  TQueryFnData extends object | null = object | null,
  TError = unknown,
  TData extends object | null = TQueryFnData,
  TQueryKey extends ReadonlyArray<unknown> = ReadonlyArray<unknown>
>(
  options: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'initialData'>
): UseQueryResult<TData, TError> {
  const result = useQuery({
    ...options,
    placeholderData: null as any,
  });

  // Ensure data is never undefined (can be null)
  return {
    ...result,
    data: (result.data === undefined ? null : result.data) as TData,
  };
}
