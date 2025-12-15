/**
 * Upcoming Events Query Hook
 * Fetches upcoming school/academic events
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useNetworkStatus } from '../../offline/networkStore';
import { getLocalizedField } from '../../utils/getLocalizedField';
import i18n from '../../i18n';

export type UpcomingEvent = {
  id: string;
  title: string;
  description: string;
  event_type: 'exam' | 'holiday' | 'sports' | 'cultural' | 'meeting' | 'deadline' | 'general';
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_all_day: boolean;
  is_important: boolean;
  icon: string;
  color: string;
  days_until: number;
};

export type UpcomingEventsData = {
  events: UpcomingEvent[];
  totalCount: number;
  importantCount: number;
  thisWeekCount: number;
};

export function useUpcomingEventsQuery(maxEvents: number = 5) {
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();
  const lang = i18n.language;

  return useQuery({
    queryKey: ['upcoming-events', customerId, maxEvents, lang],
    queryFn: async (): Promise<UpcomingEventsData> => {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('upcoming_events')
        .select('*')
        .eq('customer_id', customerId)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(maxEvents);

      if (error) {
        console.warn('Upcoming events query failed:', error);
        throw error;
      }

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      // Calculate days until each event
      const events: UpcomingEvent[] = (data || []).map(item => {
        const eventDate = new Date(item.event_date);
        eventDate.setHours(0, 0, 0, 0);
        const diffTime = eventDate.getTime() - todayDate.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: item.id,
          title: getLocalizedField(item, 'title', lang),
          description: getLocalizedField(item, 'description', lang),
          event_type: item.event_type,
          event_date: item.event_date,
          start_time: item.start_time,
          end_time: item.end_time,
          location: getLocalizedField(item, 'location', lang),
          is_all_day: item.is_all_day,
          is_important: item.is_important,
          icon: item.icon || 'calendar',
          color: item.color || '#6366F1',
          days_until: daysUntil,
        };
      });

      // Calculate counts
      const importantCount = events.filter(e => e.is_important).length;
      const thisWeekCount = events.filter(e => e.days_until <= 7).length;

      return {
        events,
        totalCount: events.length,
        importantCount,
        thisWeekCount,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: isOnline ? 2 : 0,
  });
}
