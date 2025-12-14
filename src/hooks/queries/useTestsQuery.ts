/**
 * Tests Query Hook
 * Fetches tests with localized content from Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../../hooks/config/useCustomerId';
import type { Subject } from './useSubjectsQuery';

export type Test = {
  id: string;
  customer_id: string;
  subject_id: string | null;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  test_type: 'quiz' | 'unit_test' | 'mock' | 'final' | 'practice';
  duration_minutes: number;
  max_score: number;
  scheduled_at: string | null;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  subject?: Subject;
};

async function fetchUpcomingTests(customerId: string, limit: number = 5): Promise<Test[]> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('tests')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('customer_id', customerId)
    .in('status', ['upcoming', 'live'])
    .gte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function fetchAllTests(customerId: string): Promise<Test[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tests')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('customer_id', customerId)
    .order('scheduled_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useUpcomingTestsQuery(limit: number = 5) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['tests', 'upcoming', customerId, limit],
    queryFn: () => fetchUpcomingTests(customerId, limit),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

export function useTestsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['tests', customerId],
    queryFn: () => fetchAllTests(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}
