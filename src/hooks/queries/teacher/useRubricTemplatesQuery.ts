import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type RubricTemplate = {
  id: string;
  customer_id: string;
  name_en: string;
  name_hi?: string;
  description_en?: string;
  description_hi?: string;
  icon: string;
  color: string;
  criteria_count: number;
  max_score: number;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

// Fallback templates when database is unavailable
const FALLBACK_TEMPLATES: RubricTemplate[] = [
  {
    id: 'essay',
    customer_id: '',
    name_en: 'Essay Writing',
    name_hi: 'निबंध लेखन',
    description_en: 'Content, Structure, Grammar, Style',
    description_hi: 'सामग्री, संरचना, व्याकरण, शैली',
    icon: 'file-document-edit-outline',
    color: '#2196F3',
    criteria_count: 4,
    max_score: 100,
    is_active: true,
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'presentation',
    customer_id: '',
    name_en: 'Presentation',
    name_hi: 'प्रस्तुति',
    description_en: 'Content, Delivery, Visuals, Q&A',
    description_hi: 'सामग्री, वितरण, दृश्य, प्रश्नोत्तर',
    icon: 'presentation',
    color: '#9C27B0',
    criteria_count: 4,
    max_score: 100,
    is_active: true,
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lab-report',
    customer_id: '',
    name_en: 'Lab Report',
    name_hi: 'प्रयोगशाला रिपोर्ट',
    description_en: 'Procedure, Data, Analysis, Conclusion',
    description_hi: 'प्रक्रिया, डेटा, विश्लेषण, निष्कर्ष',
    icon: 'flask-outline',
    color: '#4CAF50',
    criteria_count: 4,
    max_score: 100,
    is_active: true,
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'project',
    customer_id: '',
    name_en: 'Project Work',
    name_hi: 'प्रोजेक्ट कार्य',
    description_en: 'Planning, Execution, Innovation, Documentation',
    description_hi: 'योजना, निष्पादन, नवाचार, दस्तावेज़ीकरण',
    icon: 'folder-star-outline',
    color: '#FF9800',
    criteria_count: 4,
    max_score: 100,
    is_active: true,
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'homework',
    customer_id: '',
    name_en: 'Homework',
    name_hi: 'गृहकार्य',
    description_en: 'Accuracy, Completeness, Neatness',
    description_hi: 'सटीकता, पूर्णता, स्वच्छता',
    icon: 'book-open-outline',
    color: '#00BCD4',
    criteria_count: 3,
    max_score: 50,
    is_active: true,
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'participation',
    customer_id: '',
    name_en: 'Class Participation',
    name_hi: 'कक्षा भागीदारी',
    description_en: 'Engagement, Questions, Collaboration',
    description_hi: 'सहभागिता, प्रश्न, सहयोग',
    icon: 'account-group-outline',
    color: '#E91E63',
    criteria_count: 3,
    max_score: 25,
    is_active: true,
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function useRubricTemplatesQuery(options?: { limit?: number; activeOnly?: boolean }) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;
  const activeOnly = options?.activeOnly !== false;

  return useQuery({
    queryKey: ['rubric-templates', customerId, { limit, activeOnly }],
    queryFn: async () => {
      try {
        const supabase = getSupabaseClient();
        let query = supabase
          .from('rubric_templates')
          .select('*')
          .eq('customer_id', customerId)
          .order('is_system', { ascending: false })
          .order('name_en', { ascending: true })
          .limit(limit);

        if (activeOnly) {
          query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
          console.warn('Failed to fetch rubric templates, using fallback:', error);
          return FALLBACK_TEMPLATES.slice(0, limit);
        }

        // If no data in database, return fallback templates
        if (!data || data.length === 0) {
          return FALLBACK_TEMPLATES.slice(0, limit);
        }

        return data as RubricTemplate[];
      } catch (err) {
        console.warn('Error fetching rubric templates, using fallback:', err);
        return FALLBACK_TEMPLATES.slice(0, limit);
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
