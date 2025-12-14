/**
 * Assignments Query Hook
 * Fetches assignments with localized content from Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import type { Subject } from './useSubjectsQuery';

export type Assignment = {
  id: string;
  customer_id: string;
  subject_id: string | null;
  teacher_id: string | null;
  title_en: string;
  title_hi: string | null;
  instructions_en: string | null;
  instructions_hi: string | null;
  assignment_type: 'homework' | 'project' | 'practice' | 'classwork';
  due_date: string | null;
  max_score: number;
  attachments: any[];
  status: 'draft' | 'published' | 'closed';
  subject?: Subject;
};

async function fetchPendingAssignments(customerId: string, limit: number = 5): Promise<Assignment[]> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('customer_id', customerId)
    .eq('status', 'published')
    .gte('due_date', now)
    .order('due_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function fetchAllAssignments(customerId: string): Promise<Assignment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('customer_id', customerId)
    .eq('status', 'published')
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function usePendingAssignmentsQuery(limit: number = 5) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['assignments', 'pending', customerId, limit],
    queryFn: () => fetchPendingAssignments(customerId, limit),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

export function useAssignmentsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['assignments', customerId],
    queryFn: () => fetchAllAssignments(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}
