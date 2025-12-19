/**
 * Today Schedule Query Hook
 * Fetches today's classes with localized content from Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../../hooks/config/useCustomerId';
import { getLocalizedField } from '../../utils/getLocalizedField';

export type ScheduleItem = {
  id: string;
  title: string;
  time: string;
  duration: string;
  location: string;
  type: 'class' | 'lab' | 'assignment' | 'test' | 'live';
  status: 'upcoming' | 'live' | 'due' | 'completed';
  subjectColor?: string;
};

// Fallback mock data when database is empty - using mock- prefix to identify mock items
const FALLBACK_SCHEDULE: ScheduleItem[] = [
  { id: "mock-1", title: "Mathematics", time: "9:00 AM", duration: "1h", location: "Room 101", type: "class", status: "upcoming" },
  { id: "mock-2", title: "Physics Lab", time: "11:00 AM", duration: "2h", location: "Lab 3", type: "lab", status: "upcoming" },
  { id: "mock-3", title: "English Essay Due", time: "2:00 PM", duration: "", location: "", type: "assignment", status: "due" },
  { id: "mock-4", title: "Live Chemistry Class", time: "4:00 PM", duration: "1h", location: "Online", type: "live", status: "live" },
];

async function fetchTodaySchedule(customerId: string): Promise<ScheduleItem[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      subject:subjects(title_en, title_hi, color)
    `)
    .eq('customer_id', customerId)
    .gte('start_time', today.toISOString())
    .lt('start_time', tomorrow.toISOString())
    .order('start_time', { ascending: true });

  if (error) throw error;
  
  if (!data || data.length === 0) {
    return FALLBACK_SCHEDULE;
  }

  return data.map((item: any) => {
    const startTime = new Date(item.start_time);
    const endTime = new Date(item.end_time);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = Math.round(durationMs / (1000 * 60 * 60));
    
    return {
      id: item.id,
      title: getLocalizedField(item, 'title') || getLocalizedField(item.subject, 'title'),
      time: startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      duration: durationHours > 0 ? `${durationHours}h` : '',
      location: item.room || (item.is_live ? 'Online' : ''),
      type: mapClassType(item.class_type, item.is_live),
      status: getClassStatus(item),
      subjectColor: item.subject?.color,
    };
  });
}

function mapClassType(classType: string, isLive: boolean): ScheduleItem['type'] {
  if (isLive) return 'live';
  switch (classType) {
    case 'lab': return 'lab';
    case 'exam': return 'test';
    default: return 'class';
  }
}

function getClassStatus(item: any): ScheduleItem['status'] {
  const now = new Date();
  const startTime = new Date(item.start_time);
  const endTime = new Date(item.end_time);
  
  if (now >= startTime && now <= endTime) return 'live';
  if (now > endTime) return 'completed';
  return 'upcoming';
}

export function useTodaySchedule(userId?: string | null) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['classes', 'today', customerId],
    queryFn: () => fetchTodaySchedule(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}
