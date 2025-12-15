/**
 * Week Calendar Query Hook
 * Fetches classes/events for a week view calendar
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';
import { getLocalizedField } from '../../utils/getLocalizedField';
import i18n from '../../i18n';

export type CalendarEvent = {
  id: string;
  title: string;
  subject_name: string;
  subject_color: string;
  class_type: 'lecture' | 'lab' | 'live' | 'assignment' | 'test';
  start_time: string;
  end_time: string;
  room?: string;
  is_live: boolean;
  meeting_url?: string;
};

export type DayEvents = {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: CalendarEvent[];
  eventCount: number;
};

export type WeekCalendarData = {
  days: DayEvents[];
  weekStart: string;
  weekEnd: string;
  totalEvents: number;
};

// Get start of week (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get day name
function getDayName(date: Date, lang: string): string {
  const days = lang === 'hi' 
    ? ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

export function useWeekCalendarQuery(weekOffset: number = 0) {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();
  const lang = i18n.language;

  return useQuery({
    queryKey: ['week-calendar', customerId, userId, weekOffset, lang],
    queryFn: async (): Promise<WeekCalendarData> => {
      const supabase = getSupabaseClient();
      
      // Calculate week range
      const today = new Date();
      const weekStart = getWeekStart(today);
      weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          subjects:subject_id(title_en, title_hi, color, icon)
        `)
        .eq('customer_id', customerId)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.warn('Week calendar query failed:', error);
        throw error;
      }

      // Group events by day
      const eventsByDay: Record<string, CalendarEvent[]> = {};
      
      (data || []).forEach(item => {
        const eventDate = formatDate(new Date(item.start_time));
        if (!eventsByDay[eventDate]) {
          eventsByDay[eventDate] = [];
        }
        eventsByDay[eventDate].push({
          id: item.id,
          title: getLocalizedField(item, 'title', lang),
          subject_name: getLocalizedField(item.subjects, 'title', lang),
          subject_color: item.subjects?.color || '#6366F1',
          class_type: item.class_type || 'lecture',
          start_time: item.start_time,
          end_time: item.end_time,
          room: item.room,
          is_live: item.is_live || false,
          meeting_url: item.meeting_url,
        });
      });

      // Build days array
      const days: DayEvents[] = [];
      const todayStr = formatDate(today);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = formatDate(date);
        
        days.push({
          date: dateStr,
          dayName: getDayName(date, lang),
          dayNumber: date.getDate(),
          isToday: dateStr === todayStr,
          events: eventsByDay[dateStr] || [],
          eventCount: (eventsByDay[dateStr] || []).length,
        });
      }

      return {
        days,
        weekStart: formatDate(weekStart),
        weekEnd: formatDate(weekEnd),
        totalEvents: data?.length || 0,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: isOnline ? 2 : 0,
  });
}
