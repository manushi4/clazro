/**
 * Subjects Query Hook
 * Fetches subjects with localized content from Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../../hooks/config/useCustomerId';

export type Subject = {
  id: string;
  customer_id: string;
  code: string;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  icon: string;
  color: string;
  order_index: number;
  enabled: boolean;
};

async function fetchSubjects(customerId: string): Promise<Subject[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('customer_id', customerId)
    .eq('enabled', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function useSubjectsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['subjects', customerId],
    queryFn: () => fetchSubjects(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour cache
  });
}
