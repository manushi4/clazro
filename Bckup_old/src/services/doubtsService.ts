/**
 * Doubts Service
 * Handles all doubt/query-related operations with Supabase
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Doubt = Database['public']['Tables']['doubts']['Row'];
type DoubtInsert = Database['public']['Tables']['doubts']['Insert'];
type DoubtResponse = Database['public']['Tables']['doubt_responses']['Row'];
type DoubtResponseInsert = Database['public']['Tables']['doubt_responses']['Insert'];

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface DoubtWithResponses extends Doubt {
  responses?: DoubtResponse[];
}

/**
 * Create a new doubt
 */
export const createDoubt = async (
  doubtData: DoubtInsert
): Promise<ServiceResponse<Doubt>> => {
  try {
    const { data, error } = await supabase
      .from('doubts')
      .insert(doubtData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get all doubts for a student
 */
export const getStudentDoubts = async (
  studentId: string
): Promise<ServiceResponse<Doubt[]>> => {
  try {
    const { data, error } = await supabase
      .from('doubts')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get all doubts (for teachers)
 */
export const getAllDoubts = async (
  status?: 'open' | 'answered' | 'closed' | 'reopened',
  subjectCode?: string
): Promise<ServiceResponse<Doubt[]>> => {
  try {
    let query = supabase
      .from('doubts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (subjectCode) {
      query = query.eq('subject_code', subjectCode);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get a single doubt with responses
 */
export const getDoubtById = async (
  doubtId: string
): Promise<ServiceResponse<DoubtWithResponses>> => {
  try {
    // Get the doubt
    const { data: doubt, error: doubtError } = await supabase
      .from('doubts')
      .select('*')
      .eq('id', doubtId)
      .single();

    if (doubtError) {
      return { data: null, error: doubtError.message, success: false };
    }

    // Get responses
    const { data: responses } = await supabase
      .from('doubt_responses')
      .select('*')
      .eq('doubt_id', doubtId)
      .order('created_at', { ascending: true });

    // Increment views count
    await supabase
      .from('doubts')
      .update({ views_count: (doubt.views_count || 0) + 1 })
      .eq('id', doubtId);

    return {
      data: { ...doubt, responses: responses || [] },
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Add a response to a doubt
 */
export const addDoubtResponse = async (
  responseData: DoubtResponseInsert
): Promise<ServiceResponse<DoubtResponse>> => {
  try {
    const { data, error } = await supabase
      .from('doubt_responses')
      .insert(responseData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    // Update doubt status to 'answered'
    await supabase
      .from('doubts')
      .update({ status: 'answered' })
      .eq('id', responseData.doubt_id);

    return { data, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Mark response as best answer
 */
export const markBestAnswer = async (
  responseId: string,
  doubtId: string
): Promise<ServiceResponse<DoubtResponse>> => {
  try {
    // First, unmark all other responses for this doubt
    await supabase
      .from('doubt_responses')
      .update({ is_best_answer: false })
      .eq('doubt_id', doubtId);

    // Mark this response as best answer
    const { data, error } = await supabase
      .from('doubt_responses')
      .update({ is_best_answer: true })
      .eq('id', responseId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Update doubt status
 */
export const updateDoubtStatus = async (
  doubtId: string,
  status: 'open' | 'answered' | 'closed' | 'reopened'
): Promise<ServiceResponse<Doubt>> => {
  try {
    const { data, error } = await supabase
      .from('doubts')
      .update({ status })
      .eq('id', doubtId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Delete a doubt
 */
export const deleteDoubt = async (
  doubtId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('doubts')
      .delete()
      .eq('id', doubtId);

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};
