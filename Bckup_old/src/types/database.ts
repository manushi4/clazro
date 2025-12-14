/**
 * Database Type Definitions
 * Auto-generated from Supabase schema
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          full_name: string;
          avatar_url: string | null;
          role: 'admin' | 'teacher' | 'student' | 'parent';
          enrollment_number: string | null;
          grade: string | null;
          batch_id: string | null;
          subjects: string[] | null;
          specialization: string | null;
          children_ids: string[] | null;
          address: string | null;
          bio: string | null;
          preferences: any | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          color_code: string | null;
          icon_name: string | null;
          grade_levels: string[] | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>;
      };
      study_materials: {
        Row: {
          id: string;
          title: string;
          subject_id: string | null;
          subject_code: string | null;
          type: 'pdf' | 'video' | 'audio' | 'document' | 'presentation' | 'image';
          file_url: string | null;
          file_size: string | null;
          thumbnail_url: string | null;
          upload_date: string | null;
          author: string | null;
          description: string | null;
          tags: string[] | null;
          rating: number | null;
          downloads_count: number | null;
          views_count: number | null;
          is_published: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['study_materials']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['study_materials']['Insert']>;
      };
      batches: {
        Row: {
          id: string;
          name: string;
          grade_level: string;
          section: string | null;
          academic_year: string | null;
          start_date: string | null;
          end_date: string | null;
          max_students: number | null;
          current_enrollment: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['batches']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['batches']['Insert']>;
      };
      classes: {
        Row: {
          id: string;
          batch_id: string;
          subject: string;
          teacher_id: string;
          title: string;
          description: string | null;
          scheduled_at: string;
          duration_minutes: number | null;
          meeting_link: string | null;
          recording_url: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['classes']['Insert']>;
      };
      assignments: {
        Row: {
          id: string;
          teacher_id: string;
          class_id: string;
          subject: string;
          title: string;
          description: string | null;
          instructions: string | null;
          total_points: number | null;
          assigned_date: string | null;
          due_date: string;
          status: 'draft' | 'published' | 'archived';
          attachments: any[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['assignments']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'warning' | 'error' | 'success' | 'assignment' | 'class' | 'doubt' | 'announcement';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          is_read: boolean | null;
          action_url: string | null;
          data: any | null;
          created_at: string | null;
          read_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
