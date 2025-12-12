/**
 * Classes/Schedule Query Hook
 * Fetches classes with localized content from Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../../hooks/config/useCustomerId';
import type { Subject } from './useSubjectsQuery';

export type ClassItem = {
  id: string;
  customer_id: string;
  subject_id: string | null;
  teacher_id: string | null;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  class_type: 'lecture' | 'lab' | 'tutorial' | 'live' | 'exam';
  room: string | null;
  start_time: string;
  end_time: string;
  is_live: boolean;
  meeting_url: string | null;
  subject?: Subject;
};

async function fetchTodayClasses(customerId: string): Promise<ClassItem[]> {
  const supabase = getSupabaseClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('customer_id', customerId)
    .gte('start_time', today.toISOString())
    .lt('start_time', tomorrow.toISOString())
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchUpcomingClasses(customerId: string, limit: number = 5): Promise<ClassItem[]> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('customer_id', customerId)
    .gte('start_time', now)
    .order('start_time', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export function useTodayClassesQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['classes', 'today', customerId],
    queryFn: () => fetchTodayClasses(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

export function useUpcomingClassesQuery(limit: number = 5) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['classes', 'upcoming', customerId, limit],
    queryFn: () => fetchUpcomingClasses(customerId, limit),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}
