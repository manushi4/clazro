import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { getLocalizedField } from '../../utils/getLocalizedField';
import i18n from '../../i18n';

export type TeacherDetail = {
  id: string;
  teacher_user_id: string;
  name: string;
  subject: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_class_teacher: boolean;
  is_available: boolean;
  availability_status: string | null;
  office_hours: string | null;
  created_at: string;
};

export function useTeacherDetailQuery(teacherId: string) {
  const customerId = useCustomerId();
  const lang = i18n.language;

  return useQuery({
    queryKey: ['teacher-detail', customerId, teacherId, lang],
    queryFn: async (): Promise<TeacherDetail | null> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useTeacherDetailQuery] Fetching:', teacherId);
      }

      const { data, error } = await supabase
        .from('teacher_contacts')
        .select('*')
        .eq('customer_id', customerId)
        .eq('id', teacherId)
        .single();

      if (error) {
        if (__DEV__) console.log('[useTeacherDetailQuery] error:', error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        teacher_user_id: data.teacher_user_id,
        name: getLocalizedField(data, 'name', lang) || data.name_en,
        subject: getLocalizedField(data, 'subject', lang) || data.subject_en,
        email: data.email,
        phone: data.phone,
        avatar_url: data.avatar_url,
        is_class_teacher: data.is_class_teacher ?? false,
        is_available: data.is_available ?? true,
        availability_status: data.availability_status || 'available',
        office_hours: data.office_hours,
        created_at: data.created_at,
      };
    },
    enabled: !!customerId && !!teacherId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
