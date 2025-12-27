import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

export type TeacherQuickAction = {
  id: string;
  action_key: string;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  icon: string;
  color: string;
  route?: string;
  route_params?: Record<string, any>;
  enabled: boolean;
  order_index: number;
};

// Static quick actions for teachers
const TEACHER_QUICK_ACTIONS: TeacherQuickAction[] = [
  {
    id: '1',
    action_key: 'mark_attendance',
    title_en: 'Mark Attendance',
    title_hi: 'उपस्थिति दर्ज करें',
    description_en: 'Take attendance for your class',
    description_hi: 'अपनी कक्षा की उपस्थिति लें',
    icon: 'calendar-check',
    color: '#4CAF50',
    route: 'AttendanceMarkScreen',
    enabled: true,
    order_index: 1,
  },
  {
    id: '2',
    action_key: 'create_assignment',
    title_en: 'Create Assignment',
    title_hi: 'असाइनमेंट बनाएं',
    description_en: 'Create a new assignment',
    description_hi: 'नया असाइनमेंट बनाएं',
    icon: 'clipboard-plus',
    color: '#2196F3',
    route: 'AssignmentCreate',
    enabled: true,
    order_index: 2,
  },
  {
    id: '3',
    action_key: 'grade_submissions',
    title_en: 'Grade Work',
    title_hi: 'ग्रेड दें',
    description_en: 'Review and grade submissions',
    description_hi: 'सबमिशन की समीक्षा और ग्रेड करें',
    icon: 'clipboard-check',
    color: '#FF9800',
    route: 'GradingQueue',
    enabled: true,
    order_index: 3,
  },
  {
    id: '4',
    action_key: 'schedule_class',
    title_en: 'Schedule Class',
    title_hi: 'कक्षा शेड्यूल करें',
    description_en: 'Schedule a live or offline class',
    description_hi: 'लाइव या ऑफलाइन कक्षा शेड्यूल करें',
    icon: 'calendar-plus',
    color: '#9C27B0',
    route: 'ScheduleClass',
    enabled: true,
    order_index: 4,
  },
  {
    id: '5',
    action_key: 'send_announcement',
    title_en: 'Announcement',
    title_hi: 'घोषणा',
    description_en: 'Send announcement to students',
    description_hi: 'छात्रों को घोषणा भेजें',
    icon: 'bullhorn',
    color: '#E91E63',
    route: 'CreateAnnouncement',
    enabled: true,
    order_index: 5,
  },
  {
    id: '6',
    action_key: 'view_doubts',
    title_en: 'Answer Doubts',
    title_hi: 'प्रश्न उत्तर',
    description_en: 'View and answer student doubts',
    description_hi: 'छात्रों के प्रश्न देखें और उत्तर दें',
    icon: 'comment-question',
    color: '#00BCD4',
    route: 'DoubtsQueue',
    enabled: true,
    order_index: 6,
  },
  {
    id: '7',
    action_key: 'create_test',
    title_en: 'Create Test',
    title_hi: 'परीक्षा बनाएं',
    description_en: 'Create a new test or quiz',
    description_hi: 'नई परीक्षा या प्रश्नोत्तरी बनाएं',
    icon: 'file-document-edit',
    color: '#795548',
    route: 'CreateTest',
    enabled: true,
    order_index: 7,
  },
  {
    id: '8',
    action_key: 'upload_material',
    title_en: 'Upload Material',
    title_hi: 'सामग्री अपलोड',
    description_en: 'Upload study materials',
    description_hi: 'अध्ययन सामग्री अपलोड करें',
    icon: 'cloud-upload',
    color: '#607D8B',
    route: 'UploadMaterial',
    enabled: true,
    order_index: 8,
  },
];

export function useTeacherQuickActionsQuery(options?: { limit?: number }) {
  const customerId = useCustomerId();
  const limit = options?.limit || 8;

  return useQuery({
    queryKey: ['teacher-quick-actions', customerId, { limit }],
    queryFn: async () => {
      // Return static actions filtered by enabled and sorted by order
      const actions = TEACHER_QUICK_ACTIONS
        .filter(a => a.enabled)
        .sort((a, b) => a.order_index - b.order_index)
        .slice(0, limit);

      return actions as TeacherQuickAction[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 30, // 30 minutes - actions don't change often
  });
}
