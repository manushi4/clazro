/**
 * Quick Actions Query Hook
 * Fetches quick action buttons with localized labels from Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../../hooks/config/useCustomerId';

export type QuickAction = {
  id: string;
  customer_id: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  action_id: string;
  label_en: string;
  label_hi: string | null;
  icon: string;
  color: string;
  route: string;
  order_index: number;
  enabled: boolean;
  requires_online: boolean;
};

async function fetchQuickActions(customerId: string, role: string): Promise<QuickAction[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('quick_actions')
    .select('*')
    .eq('customer_id', customerId)
    .eq('role', role)
    .eq('enabled', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function useQuickActionsQuery(role: string = 'student') {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['quick-actions', customerId, role],
    queryFn: () => fetchQuickActions(customerId, role),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour cache
  });
}
