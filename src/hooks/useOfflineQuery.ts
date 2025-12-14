import {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNetworkStatus } from "../offline/networkStore";
import { getFeatureFreshness } from "./config/useFeatureFreshness";

type OfflineQueryOptions<TQueryFnData, TError, TData> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, QueryKey>,
  "queryKey" | "queryFn"
> & {
  featureId?: string;
};

export function useOfflineQuery<TQueryFnData, TError = Error, TData = TQueryFnData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: OfflineQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const cached = queryClient.getQueryData<TData>(queryKey);
  const freshness = options?.featureId ? getFeatureFreshness(options.featureId) : undefined;

  const enabled = (options?.enabled ?? true) && (isOnline || Boolean(cached));

  return useQuery<TQueryFnData, TError, TData, QueryKey>({
    queryKey,
    queryFn,
    ...options,
    enabled,
    retry: isOnline ? options?.retry ?? freshness?.retry ?? 2 : 0,
    staleTime: options?.staleTime ?? freshness?.staleTime ?? 60 * 60 * 1000,
    gcTime: options?.gcTime ?? 24 * 60 * 60 * 1000,
  });
}
