import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

export type ActivityType = 'assignment' | 'test' | 'attendance' | 'grade' | 'announcement' | 'material' | 'doubt';

export type ClassActivity = {
  id: string;
  customer_id: string;
  class_id: string;
  class_name: string;
  activity_type: ActivityType;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  actor_name?: string;
  related_id?: string;
  related_type?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

// Demo data for development/fallback
const DEMO_ACTIVITIES: ClassActivity[] = [
  {
    id: '1',
    customer_id: 'demo',
    class_id: 'demo-1',
    class_name: 'Class 10-A',
    activity_type: 'assignment',
    title_en: 'New Assignment Created',
    title_hi: 'नया असाइनमेंट बनाया',
    description_en: 'Chapter 5 - Quadratic Equations Practice',
    description_hi: 'अध्याय 5 - द्विघात समीकरण अभ्यास',
    actor_name: 'You',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    customer_id: 'demo',
    class_id: 'demo-2',
    class_name: 'Class 10-B',
    activity_type: 'attendance',
    title_en: 'Attendance Marked',
    title_hi: 'उपस्थिति दर्ज की गई',
    description_en: '28 of 30 students present',
    description_hi: '30 में से 28 छात्र उपस्थित',
    actor_name: 'You',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    customer_id: 'demo',
    class_id: 'demo-1',
    class_name: 'Class 10-A',
    activity_type: 'grade',
    title_en: 'Grades Posted',
    title_hi: 'ग्रेड पोस्ट किए गए',
    description_en: 'Unit Test 3 results published',
    description_hi: 'यूनिट टेस्ट 3 परिणाम प्रकाशित',
    actor_name: 'You',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    customer_id: 'demo',
    class_id: 'demo-3',
    class_name: 'Class 9-A',
    activity_type: 'announcement',
    title_en: 'Announcement Made',
    title_hi: 'घोषणा की गई',
    description_en: 'Class rescheduled to Room 105 tomorrow',
    description_hi: 'कल कक्षा कमरा 105 में होगी',
    actor_name: 'You',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    customer_id: 'demo',
    class_id: 'demo-2',
    class_name: 'Class 10-B',
    activity_type: 'test',
    title_en: 'Test Scheduled',
    title_hi: 'परीक्षा निर्धारित',
    description_en: 'Weekly Quiz on Trigonometry - Friday',
    description_hi: 'त्रिकोणमिति पर साप्ताहिक प्रश्नोत्तरी - शुक्रवार',
    actor_name: 'You',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    customer_id: 'demo',
    class_id: 'demo-4',
    class_name: 'Class 9-B',
    activity_type: 'material',
    title_en: 'Study Material Shared',
    title_hi: 'अध्ययन सामग्री साझा की',
    description_en: 'PDF notes for Chapter 6 uploaded',
    description_hi: 'अध्याय 6 के लिए PDF नोट्स अपलोड किए',
    actor_name: 'You',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    customer_id: 'demo',
    class_id: 'demo-1',
    class_name: 'Class 10-A',
    activity_type: 'doubt',
    title_en: 'Doubt Answered',
    title_hi: 'प्रश्न का उत्तर दिया',
    description_en: 'Answered 5 student doubts on integration',
    description_hi: '5 छात्रों के समाकलन संबंधी प्रश्नों का उत्तर दिया',
    actor_name: 'You',
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];

export function useClassRecentActivityQuery(options?: {
  classId?: string;
  activityType?: ActivityType;
  limit?: number;
}) {
  const customerId = useCustomerId();
  const { classId, activityType, limit = 10 } = options || {};

  return useQuery({
    queryKey: ['class-recent-activity', customerId, { classId, activityType, limit }],
    queryFn: async (): Promise<ClassActivity[]> => {
      // Filter demo data based on options
      let filtered = [...DEMO_ACTIVITIES];

      if (classId) {
        filtered = filtered.filter(a => a.class_id === classId);
      }

      if (activityType) {
        filtered = filtered.filter(a => a.activity_type === activityType);
      }

      // Sort by created_at descending
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply limit
      return filtered.slice(0, limit);
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Helper function to get relative time
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Activity type metadata
export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { icon: string; color: string; labelEn: string; labelHi: string }> = {
  assignment: { icon: 'clipboard-edit', color: '#2196F3', labelEn: 'Assignment', labelHi: 'असाइनमेंट' },
  test: { icon: 'file-document-edit', color: '#9C27B0', labelEn: 'Test', labelHi: 'परीक्षा' },
  attendance: { icon: 'calendar-check', color: '#4CAF50', labelEn: 'Attendance', labelHi: 'उपस्थिति' },
  grade: { icon: 'star-circle', color: '#FF9800', labelEn: 'Grade', labelHi: 'ग्रेड' },
  announcement: { icon: 'bullhorn', color: '#F44336', labelEn: 'Announcement', labelHi: 'घोषणा' },
  material: { icon: 'book-open-variant', color: '#00BCD4', labelEn: 'Material', labelHi: 'सामग्री' },
  doubt: { icon: 'help-circle', color: '#607D8B', labelEn: 'Doubt', labelHi: 'प्रश्न' },
};
