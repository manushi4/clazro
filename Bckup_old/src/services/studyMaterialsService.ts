/**
 * Study Materials Service
 * Handles all CRUD operations for study materials
 */

import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type StudyMaterial = Database['public']['Tables']['study_materials']['Row'];
type StudyMaterialInsert = Database['public']['Tables']['study_materials']['Insert'];
type StudyMaterialUpdate = Database['public']['Tables']['study_materials']['Update'];

export interface StudyMaterialFilters {
  subject?: string;
  type?: string;
  searchQuery?: string;
  tags?: string[];
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Fetch all published study materials with optional filters
 */
export const getStudyMaterials = async (
  filters?: StudyMaterialFilters
): Promise<ServiceResponse<StudyMaterial[]>> => {
  try {
    let query = supabase
      .from('study_materials')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // Apply subject filter
    if (filters?.subject && filters.subject !== 'All Subjects') {
      query = query.eq('subject_code', filters.subject);
    }

    // Apply type filter
    if (filters?.type) {
      query = query.eq('type', filters.type.toLowerCase());
    }

    // Apply search query
    if (filters?.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,author.ilike.%${filters.searchQuery}%`
      );
    }

    // Apply tag filters
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching study materials:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data || [],
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Exception in getStudyMaterials:', errorMessage);
    return {
      data: null,
      error: errorMessage,
      success: false,
    };
  }
};

/**
 * Fetch a single study material by ID
 */
export const getStudyMaterialById = async (
  id: string
): Promise<ServiceResponse<StudyMaterial>> => {
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    // Increment view count
    await incrementViewCount(id);

    return {
      data,
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      data: null,
      error: errorMessage,
      success: false,
    };
  }
};

/**
 * Increment view count for a study material
 */
export const incrementViewCount = async (id: string): Promise<ServiceResponse<void>> => {
  try {
    const { error } = await supabase.rpc('increment_views', { material_id: id });

    // If RPC doesn't exist, fallback to manual update
    if (error) {
      const { data: currentMaterial } = await supabase
        .from('study_materials')
        .select('views_count')
        .eq('id', id)
        .single();

      if (currentMaterial) {
        await supabase
          .from('study_materials')
          .update({ views_count: (currentMaterial.views_count || 0) + 1 })
          .eq('id', id);
      }
    }

    return {
      data: null,
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      data: null,
      error: errorMessage,
      success: false,
    };
  }
};

/**
 * Increment download count for a study material
 */
export const incrementDownloadCount = async (id: string): Promise<ServiceResponse<void>> => {
  try {
    const { data: currentMaterial } = await supabase
      .from('study_materials')
      .select('downloads_count')
      .eq('id', id)
      .single();

    if (currentMaterial) {
      await supabase
        .from('study_materials')
        .update({ downloads_count: (currentMaterial.downloads_count || 0) + 1 })
        .eq('id', id);
    }

    return {
      data: null,
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      data: null,
      error: errorMessage,
      success: false,
    };
  }
};

/**
 * Get study materials by subject code
 */
export const getStudyMaterialsBySubject = async (
  subjectCode: string
): Promise<ServiceResponse<StudyMaterial[]>> => {
  return getStudyMaterials({ subject: subjectCode });
};

/**
 * Search study materials
 */
export const searchStudyMaterials = async (
  query: string
): Promise<ServiceResponse<StudyMaterial[]>> => {
  return getStudyMaterials({ searchQuery: query });
};

/**
 * Get recently added study materials
 */
export const getRecentStudyMaterials = async (
  limit: number = 10
): Promise<ServiceResponse<StudyMaterial[]>> => {
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data || [],
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      data: null,
      error: errorMessage,
      success: false,
    };
  }
};

/**
 * Get popular study materials (by downloads)
 */
export const getPopularStudyMaterials = async (
  limit: number = 10
): Promise<ServiceResponse<StudyMaterial[]>> => {
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .select('*')
      .eq('is_published', true)
      .order('downloads_count', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data || [],
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      data: null,
      error: errorMessage,
      success: false,
    };
  }
};

/**
 * Get top-rated study materials
 */
export const getTopRatedStudyMaterials = async (
  limit: number = 10
): Promise<ServiceResponse<StudyMaterial[]>> => {
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .select('*')
      .eq('is_published', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data || [],
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      data: null,
      error: errorMessage,
      success: false,
    };
  }
};
