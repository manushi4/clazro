/**
 * Reminders Query Hook
 * Fetches reminders for the automation.reminders widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';
import { useNetworkStatus } from '../../offline/networkStore';

export type ReminderType = 'study' | 'assignment' | 'test' | 'revision' | 'break' | 'goal' | 'custom';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export type Reminder = {
  id: string;
  reminderType: ReminderType;
  titleEn: string;
  titleHi: string | null;
  descriptionEn: string | null;
  descriptionHi: string | null;
  icon: string;
  color: string;
  priority: number;
  scheduledAt: string;
  repeatType: RepeatType | null;
  repeatDays: number[] | null;
  actionRoute: string | null;
  actionLabelEn: string | null;
  actionLabelHi: string | null;
  isCompleted: boolean;
  isDismissed: boolean;
  isSnoozed: boolean;
  snoozedUntil: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type RemindersData = {
  reminders: Reminder[];
  totalCount: number;
  upcomingCount: number;
  overdueCount: number;
  byType: Record<ReminderType, number>;
};


const MOCK_DATA: RemindersData = {
  reminders: [
    { id: '1', reminderType: 'study', titleEn: 'Daily Math Practice', titleHi: 'दैनिक गणित अभ्यास', descriptionEn: 'Complete 30 minutes of practice', descriptionHi: '30 मिनट अभ्यास पूरा करें', icon: 'calculator', color: 'primary', priority: 1, scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), repeatType: 'daily', repeatDays: null, actionRoute: 'study/math', actionLabelEn: 'Start', actionLabelHi: 'शुरू करें', isCompleted: false, isDismissed: false, isSnoozed: false, snoozedUntil: null, completedAt: null, createdAt: new Date().toISOString() },
    { id: '2', reminderType: 'assignment', titleEn: 'Physics Assignment Due', titleHi: 'भौतिकी असाइनमेंट देय', descriptionEn: 'Submit by tomorrow', descriptionHi: 'कल तक जमा करें', icon: 'clipboard-text', color: 'warning', priority: 1, scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), repeatType: 'none', repeatDays: null, actionRoute: 'assignments', actionLabelEn: 'View', actionLabelHi: 'देखें', isCompleted: false, isDismissed: false, isSnoozed: false, snoozedUntil: null, completedAt: null, createdAt: new Date().toISOString() },
  ],
  totalCount: 5,
  upcomingCount: 4,
  overdueCount: 1,
  byType: { study: 2, assignment: 1, test: 1, revision: 1, break: 0, goal: 0, custom: 0 },
};

export function useRemindersQuery() {
  const { userId } = useDemoUser();
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['reminders', customerId, userId],
    queryFn: async (): Promise<RemindersData> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .eq('is_completed', false)
        .order('priority', { ascending: true })
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.warn('Reminders query failed, using mock data:', error);
        return MOCK_DATA;
      }

      if (!data || data.length === 0) {
        return MOCK_DATA;
      }

      const now = new Date();
      const reminders: Reminder[] = data.map((item: any) => ({
        id: item.id,
        reminderType: item.reminder_type,
        titleEn: item.title_en,
        titleHi: item.title_hi,
        descriptionEn: item.description_en,
        descriptionHi: item.description_hi,
        icon: item.icon || 'bell',
        color: item.color || 'primary',
        priority: item.priority || 3,
        scheduledAt: item.scheduled_at,
        repeatType: item.repeat_type,
        repeatDays: item.repeat_days,
        actionRoute: item.action_route,
        actionLabelEn: item.action_label_en,
        actionLabelHi: item.action_label_hi,
        isCompleted: item.is_completed || false,
        isDismissed: item.is_dismissed || false,
        isSnoozed: item.is_snoozed || false,
        snoozedUntil: item.snoozed_until,
        completedAt: item.completed_at,
        createdAt: item.created_at,
      }));

      const byType: Record<ReminderType, number> = {
        study: 0, assignment: 0, test: 0, revision: 0, break: 0, goal: 0, custom: 0
      };
      let upcomingCount = 0;
      let overdueCount = 0;

      reminders.forEach(r => {
        byType[r.reminderType]++;
        const scheduledDate = new Date(r.scheduledAt);
        if (scheduledDate > now) {
          upcomingCount++;
        } else {
          overdueCount++;
        }
      });

      return {
        reminders,
        totalCount: reminders.length,
        upcomingCount,
        overdueCount,
        byType,
      };
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    retry: isOnline ? 2 : 0,
  });
}
