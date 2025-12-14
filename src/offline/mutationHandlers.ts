/**
 * Mutation Handlers Registry
 * Per OFFLINE_SUPPORT_SPEC.md
 *
 * Registers handlers for different mutation types.
 * Each handler knows how to execute its mutation against Supabase.
 */

import { getSupabaseClient } from '../lib/supabaseClient';
import { registerMutationHandler } from './mutationQueue';

/**
 * Initialize all mutation handlers
 * Call this on app startup after Supabase is initialized
 */
export const initMutationHandlers = () => {
  const supabase = getSupabaseClient();

  // Submit assignment
  registerMutationHandler('submit_assignment', async payload => {
    const { assignmentId, studentId, answers, submittedAt } = payload as {
      assignmentId: string;
      studentId: string;
      answers: unknown;
      submittedAt: string;
    };

    const { error } = await supabase.from('assignment_submissions').insert({
      assignment_id: assignmentId,
      student_id: studentId,
      answers,
      submitted_at: submittedAt,
      status: 'submitted',
    });

    if (error) throw error;
  });

  // Create doubt
  registerMutationHandler('create_doubt', async payload => {
    const { studentId, subjectId, title, description, attachments } = payload as {
      studentId: string;
      subjectId: string;
      title: string;
      description: string;
      attachments?: string[];
    };

    const { error } = await supabase.from('doubts').insert({
      student_id: studentId,
      subject_id: subjectId,
      title,
      description,
      attachments,
      status: 'open',
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  });

  // Update note
  registerMutationHandler('update_note', async payload => {
    const { noteId, content, updatedAt } = payload as {
      noteId: string;
      content: string;
      updatedAt: string;
    };

    const { error } = await supabase
      .from('notes')
      .update({ content, updated_at: updatedAt })
      .eq('id', noteId);

    if (error) throw error;
  });

  // Create note
  registerMutationHandler('create_note', async payload => {
    const { studentId, resourceId, title, content } = payload as {
      studentId: string;
      resourceId: string;
      title: string;
      content: string;
    };

    const { error } = await supabase.from('notes').insert({
      student_id: studentId,
      resource_id: resourceId,
      title,
      content,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  });

  // Add highlight
  registerMutationHandler('add_highlight', async payload => {
    const { studentId, resourceId, text, position, color } = payload as {
      studentId: string;
      resourceId: string;
      text: string;
      position: unknown;
      color: string;
    };

    const { error } = await supabase.from('highlights').insert({
      student_id: studentId,
      resource_id: resourceId,
      text,
      position,
      color,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  });

  // Mark resource as completed
  registerMutationHandler('mark_resource_completed', async payload => {
    const { studentId, resourceId, completedAt } = payload as {
      studentId: string;
      resourceId: string;
      completedAt: string;
    };

    const { error } = await supabase.from('resource_progress').upsert({
      student_id: studentId,
      resource_id: resourceId,
      completed: true,
      completed_at: completedAt,
    });

    if (error) throw error;
  });

  // Update profile
  registerMutationHandler('update_profile', async payload => {
    const { userId, updates } = payload as {
      userId: string;
      updates: Record<string, unknown>;
    };

    const { error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;
  });

  // Generic insert mutation
  registerMutationHandler('generic_insert', async payload => {
    const { table, data } = payload as {
      table: string;
      data: Record<string, unknown>;
    };

    const { error } = await supabase.from(table).insert(data);
    if (error) throw error;
  });

  // Generic update mutation
  registerMutationHandler('generic_update', async payload => {
    const { table, id, data } = payload as {
      table: string;
      id: string;
      data: Record<string, unknown>;
    };

    const { error } = await supabase.from(table).update(data).eq('id', id);
    if (error) throw error;
  });

  if (__DEV__) {
    console.log('[MutationHandlers] Registered all mutation handlers');
  }
};

export default initMutationHandlers;
