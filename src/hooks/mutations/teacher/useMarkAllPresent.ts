import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

type MarkAllPresentParams = {
  classId: string;
  className: string;
  studentIds?: string[];
  date?: string;
};

type MarkAllPresentResult = {
  success: boolean;
  markedCount: number;
  className: string;
};

// Demo student IDs for when real data isn't available
const DEMO_STUDENT_IDS = Array.from({ length: 35 }, (_, i) => `student-${i + 1}`);

export function useMarkAllPresent() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MarkAllPresentParams): Promise<MarkAllPresentResult> => {
      const supabase = getSupabaseClient();
      const date = params.date || new Date().toISOString().split('T')[0];
      const studentIds = params.studentIds || DEMO_STUDENT_IDS;

      // Delete existing records for this class/date
      await supabase
        .from('attendance_records')
        .delete()
        .eq('customer_id', customerId)
        .eq('class_id', params.classId)
        .eq('attendance_date', date);

      // Insert all as present
      const records = studentIds.map(studentId => ({
        customer_id: customerId,
        class_id: params.classId,
        attendance_date: date,
        student_user_id: studentId,
        status: 'present',
        check_in_time: new Date().toTimeString().slice(0, 8),
      }));

      const { data, error } = await supabase
        .from('attendance_records')
        .insert(records)
        .select();

      if (error) {
        console.error('[useMarkAllPresent] Error:', error);
        throw new Error(`Failed to mark attendance: ${error.message}`);
      }

      return {
        success: true,
        markedCount: data?.length || studentIds.length,
        className: params.className,
      };
    },
    onSuccess: () => {
      // Invalidate all attendance-related queries
      queryClient.invalidateQueries({ queryKey: ['pending-classes', customerId] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats', customerId] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['class-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
}
