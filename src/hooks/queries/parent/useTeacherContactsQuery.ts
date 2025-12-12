import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type TeacherContact = {
  id: string;
  teacher_user_id: string;
  name_en: string;
  name_hi: string | null;
  subject_en: string;
  subject_hi: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_class_teacher: boolean;
  is_available: boolean;
  availability_status: 'available' | 'busy' | 'away';
  office_hours: string | null;
};

export type TeacherContactsData = {
  teachers: TeacherContact[];
  class_teacher: TeacherContact | null;
  available_count: number;
  total_count: number;
};

export function useTeacherContactsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['teacher-contacts', customerId],
    queryFn: async (): Promise<TeacherContactsData> => {
      const supabase = getSupabaseClient();

      if (__DEV__) {
        console.log('[useTeacherContactsQuery] customerId:', customerId);
      }

      const { data, error } = await supabase
        .from('teacher_contacts')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_class_teacher', { ascending: false })
        .order('name_en', { ascending: true });

      if (error) {
        if (__DEV__) console.log('[useTeacherContactsQuery] error:', error);
        throw error;
      }

      const teachers: TeacherContact[] = (data || []).map(item => ({
        id: item.id,
        teacher_user_id: item.teacher_user_id,
        name_en: item.name_en,
        name_hi: item.name_hi,
        subject_en: item.subject_en,
        subject_hi: item.subject_hi,
        email: item.email,
        phone: item.phone,
        avatar_url: item.avatar_url,
        is_class_teacher: item.is_class_teacher,
        is_available: item.is_available,
        availability_status: item.availability_status || 'available',
        office_hours: item.office_hours,
      }));

      const classTeacher = teachers.find(t => t.is_class_teacher) || null;
      const availableCount = teachers.filter(t => t.is_available).length;

      return {
        teachers,
        class_teacher: classTeacher,
        available_count: availableCount,
        total_count: teachers.length,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
