import { supabase } from '../database/supabase';
import { realtimeConnection } from './RealtimeConnectionManager';
import { logger } from '../utils/logger';

export interface LiveSession {
  id: string;
  session_name: string;
  description?: string;
  class_id?: string;
  subject_id?: string;
  teacher_id: string;
  chat_room_id?: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  actual_start_at?: string;
  actual_end_at?: string;
  status: 'scheduled' | 'starting' | 'live' | 'paused' | 'ended' | 'cancelled';
  recording_enabled: boolean;
  recording_url?: string;
  whiteboard_enabled: boolean;
  screen_sharing_enabled: boolean;
  breakout_rooms_enabled: boolean;
  max_participants: number;
  requires_approval: boolean;
  waiting_room_enabled: boolean;
  session_data: any;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  participant_count?: number;
  current_participants?: SessionParticipant[];
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  total_duration?: string;
  can_share_screen: boolean;
  can_use_whiteboard: boolean;
  can_speak: boolean;
  can_chat: boolean;
  attendance_status: 'present' | 'late' | 'absent' | 'excused';
  connection_quality: 'excellent' | 'good' | 'fair' | 'poor';
  device_info: any;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
}

export interface SessionFilters {
  status?: string;
  teacher_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface CreateSessionOptions {
  session_name: string;
  description?: string;
  class_id?: string;
  subject_id?: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  recording_enabled?: boolean;
  whiteboard_enabled?: boolean;
  screen_sharing_enabled?: boolean;
  breakout_rooms_enabled?: boolean;
  max_participants?: number;
  requires_approval?: boolean;
  waiting_room_enabled?: boolean;
  session_data?: any;
}

export interface JoinSessionOptions {
  device_info?: any;
  connection_quality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface UpdateSessionOptions {
  session_name?: string;
  description?: string;
  status?: 'scheduled' | 'starting' | 'live' | 'paused' | 'ended' | 'cancelled';
  recording_enabled?: boolean;
  whiteboard_enabled?: boolean;
  screen_sharing_enabled?: boolean;
  session_data?: any;
}

export interface AttendanceRecord {
  user_id: string;
  user_name: string;
  user_role: string;
  joined_at: string;
  left_at?: string;
  total_duration?: string;
  attendance_status: string;
  connection_quality: string;
}

class LiveClassService {
  private sessionSubscriptions: Map<string, string> = new Map();
  private participantSubscriptions: Map<string, string> = new Map();
  private currentSession: LiveSession | null = null;

  /**
   * Get live sessions
   */
  public async getSessions(filters: SessionFilters = {}): Promise<LiveSession[]> {
    try {
      let query = supabase
        .from('live_sessions')
        .select(`
          *,
          teacher:auth.users!live_sessions_teacher_id_fkey(
            id,
            raw_user_meta_data
          )
        `);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.teacher_id) {
        query = query.eq('teacher_id', filters.teacher_id);
      }

      if (filters.date_from) {
        query = query.gte('scheduled_start_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('scheduled_start_at', filters.date_to);
      }

      query = query
        .limit(filters.limit || 50)
        .offset(filters.offset || 0)
        .order('scheduled_start_at', { ascending: false });

      const { data: sessions, error } = await query;

      if (error) throw error;

      // Get participant counts for each session
      const sessionsWithParticipants = await Promise.all(
        sessions.map(async (session) => {
          const participantCount = await this.getParticipantCount(session.id);
          return {
            ...session,
            teacher: session.teacher ? {
              id: session.teacher.id,
              full_name: session.teacher.raw_user_meta_data?.full_name,
              avatar_url: session.teacher.raw_user_meta_data?.avatar_url,
            } : undefined,
            participant_count: participantCount,
          };
        })
      );

      return sessionsWithParticipants;
    } catch (error) {
      logger.error('Failed to get sessions:', error);
      throw error;
    }
  }

  /**
   * Get a specific session
   */
  public async getSession(sessionId: string): Promise<LiveSession> {
    try {
      const { data: session, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          teacher:auth.users!live_sessions_teacher_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      const [participantCount, currentParticipants] = await Promise.all([
        this.getParticipantCount(sessionId),
        this.getCurrentParticipants(sessionId),
      ]);

      return {
        ...session,
        teacher: session.teacher ? {
          id: session.teacher.id,
          full_name: session.teacher.raw_user_meta_data?.full_name,
          avatar_url: session.teacher.raw_user_meta_data?.avatar_url,
        } : undefined,
        participant_count: participantCount,
        current_participants: currentParticipants,
      };
    } catch (error) {
      logger.error('Failed to get session:', error);
      throw error;
    }
  }

  /**
   * Create a new live session
   */
  public async createSession(options: CreateSessionOptions): Promise<LiveSession> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user is a teacher or admin
      const userRole = user.user_metadata?.role;
      if (!['teacher', 'admin'].includes(userRole)) {
        throw new Error('Only teachers and admins can create sessions');
      }

      const sessionData = {
        session_name: options.session_name,
        description: options.description,
        class_id: options.class_id,
        subject_id: options.subject_id,
        teacher_id: user.id,
        scheduled_start_at: options.scheduled_start_at,
        scheduled_end_at: options.scheduled_end_at,
        recording_enabled: options.recording_enabled || false,
        whiteboard_enabled: options.whiteboard_enabled || true,
        screen_sharing_enabled: options.screen_sharing_enabled || true,
        breakout_rooms_enabled: options.breakout_rooms_enabled || false,
        max_participants: options.max_participants || 100,
        requires_approval: options.requires_approval || false,
        waiting_room_enabled: options.waiting_room_enabled || false,
        session_data: options.session_data || {},
        status: 'scheduled',
      };

      const { data: session, error } = await supabase
        .from('live_sessions')
        .insert(sessionData)
        .select(`
          *,
          teacher:auth.users!live_sessions_teacher_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .single();

      if (error) throw error;

      // Create associated chat room for the session
      await this.createSessionChatRoom(session.id, session.session_name);

      return {
        ...session,
        teacher: session.teacher ? {
          id: session.teacher.id,
          full_name: session.teacher.raw_user_meta_data?.full_name,
          avatar_url: session.teacher.raw_user_meta_data?.avatar_url,
        } : undefined,
        participant_count: 0,
      };
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Update a live session
   */
  public async updateSession(
    sessionId: string,
    options: UpdateSessionOptions
  ): Promise<LiveSession> {
    try {
      const updateData: any = {};

      if (options.session_name) updateData.session_name = options.session_name;
      if (options.description) updateData.description = options.description;
      if (options.status) updateData.status = options.status;
      if (options.recording_enabled !== undefined) updateData.recording_enabled = options.recording_enabled;
      if (options.whiteboard_enabled !== undefined) updateData.whiteboard_enabled = options.whiteboard_enabled;
      if (options.screen_sharing_enabled !== undefined) updateData.screen_sharing_enabled = options.screen_sharing_enabled;
      if (options.session_data) updateData.session_data = options.session_data;

      // Handle status-specific updates
      if (options.status === 'live' && !updateData.actual_start_at) {
        updateData.actual_start_at = new Date().toISOString();
      } else if (options.status === 'ended' && !updateData.actual_end_at) {
        updateData.actual_end_at = new Date().toISOString();
      }

      const { data: session, error } = await supabase
        .from('live_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select(`
          *,
          teacher:auth.users!live_sessions_teacher_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...session,
        teacher: session.teacher ? {
          id: session.teacher.id,
          full_name: session.teacher.raw_user_meta_data?.full_name,
          avatar_url: session.teacher.raw_user_meta_data?.avatar_url,
        } : undefined,
      };
    } catch (error) {
      logger.error('Failed to update session:', error);
      throw error;
    }
  }

  /**
   * Start a live session
   */
  public async startSession(sessionId: string): Promise<void> {
    try {
      await this.updateSession(sessionId, {
        status: 'live',
      });

      logger.info(`Session ${sessionId} started`);
    } catch (error) {
      logger.error('Failed to start session:', error);
      throw error;
    }
  }

  /**
   * End a live session
   */
  public async endSession(sessionId: string): Promise<void> {
    try {
      // Update all active participants to mark them as left
      await supabase
        .from('live_session_participants')
        .update({
          left_at: new Date().toISOString(),
          attendance_status: 'present',
        })
        .eq('session_id', sessionId)
        .is('left_at', null);

      // Update session status
      await this.updateSession(sessionId, {
        status: 'ended',
      });

      logger.info(`Session ${sessionId} ended`);
    } catch (error) {
      logger.error('Failed to end session:', error);
      throw error;
    }
  }

  /**
   * Join a live session
   */
  public async joinSession(
    sessionId: string,
    options: JoinSessionOptions = {}
  ): Promise<SessionParticipant> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if session exists and is joinable
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!['scheduled', 'starting', 'live'].includes(session.status)) {
        throw new Error('Session is not available for joining');
      }

      // Check if user is already a participant
      const existingParticipant = await this.getParticipant(sessionId, user.id);
      if (existingParticipant && !existingParticipant.left_at) {
        return existingParticipant;
      }

      const participantData = {
        session_id: sessionId,
        user_id: user.id,
        joined_at: new Date().toISOString(),
        can_share_screen: user.user_metadata?.role === 'teacher',
        can_use_whiteboard: ['teacher', 'admin'].includes(user.user_metadata?.role),
        can_speak: true,
        can_chat: true,
        attendance_status: 'present',
        connection_quality: options.connection_quality || 'good',
        device_info: options.device_info || {},
      };

      const { data: participant, error } = await supabase
        .from('live_session_participants')
        .upsert(participantData)
        .select(`
          *,
          user:auth.users!live_session_participants_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .single();

      if (error) throw error;

      this.currentSession = session;

      return {
        ...participant,
        user: participant.user ? {
          id: participant.user.id,
          full_name: participant.user.raw_user_meta_data?.full_name,
          avatar_url: participant.user.raw_user_meta_data?.avatar_url,
          role: participant.user.raw_user_meta_data?.role,
        } : undefined,
      };
    } catch (error) {
      logger.error('Failed to join session:', error);
      throw error;
    }
  }

  /**
   * Leave a live session
   */
  public async leaveSession(sessionId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate total duration
      const { data: participant } = await supabase
        .from('live_session_participants')
        .select('joined_at')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (participant) {
        const joinedAt = new Date(participant.joined_at);
        const leftAt = new Date();
        const duration = leftAt.getTime() - joinedAt.getTime();
        
        await supabase
          .from('live_session_participants')
          .update({
            left_at: leftAt.toISOString(),
            total_duration: `${Math.floor(duration / 1000)} seconds`,
          })
          .eq('session_id', sessionId)
          .eq('user_id', user.id);
      }

      this.currentSession = null;
      logger.info(`Left session ${sessionId}`);
    } catch (error) {
      logger.error('Failed to leave session:', error);
      throw error;
    }
  }

  /**
   * Update participant permissions
   */
  public async updateParticipantPermissions(
    sessionId: string,
    userId: string,
    permissions: {
      can_share_screen?: boolean;
      can_use_whiteboard?: boolean;
      can_speak?: boolean;
      can_chat?: boolean;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('live_session_participants')
        .update(permissions)
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to update participant permissions:', error);
      throw error;
    }
  }

  /**
   * Get session participants
   */
  public async getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    try {
      const { data: participants, error } = await supabase
        .from('live_session_participants')
        .select(`
          *,
          user:auth.users!live_session_participants_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('session_id', sessionId);

      if (error) throw error;

      return participants.map((p) => ({
        ...p,
        user: p.user ? {
          id: p.user.id,
          full_name: p.user.raw_user_meta_data?.full_name,
          avatar_url: p.user.raw_user_meta_data?.avatar_url,
          role: p.user.raw_user_meta_data?.role,
        } : undefined,
      }));
    } catch (error) {
      logger.error('Failed to get session participants:', error);
      throw error;
    }
  }

  /**
   * Get current active participants
   */
  public async getCurrentParticipants(sessionId: string): Promise<SessionParticipant[]> {
    try {
      const { data: participants, error } = await supabase
        .from('live_session_participants')
        .select(`
          *,
          user:auth.users!live_session_participants_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('session_id', sessionId)
        .is('left_at', null);

      if (error) throw error;

      return participants.map((p) => ({
        ...p,
        user: p.user ? {
          id: p.user.id,
          full_name: p.user.raw_user_meta_data?.full_name,
          avatar_url: p.user.raw_user_meta_data?.avatar_url,
          role: p.user.raw_user_meta_data?.role,
        } : undefined,
      }));
    } catch (error) {
      logger.error('Failed to get current participants:', error);
      return [];
    }
  }

  /**
   * Get session attendance report
   */
  public async getAttendanceReport(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      const { data: participants, error } = await supabase
        .from('live_session_participants')
        .select(`
          user_id,
          joined_at,
          left_at,
          total_duration,
          attendance_status,
          connection_quality,
          user:auth.users!live_session_participants_user_id_fkey(
            raw_user_meta_data
          )
        `)
        .eq('session_id', sessionId);

      if (error) throw error;

      return participants.map((p) => ({
        user_id: p.user_id,
        user_name: p.user?.raw_user_meta_data?.full_name || 'Unknown',
        user_role: p.user?.raw_user_meta_data?.role || 'student',
        joined_at: p.joined_at,
        left_at: p.left_at,
        total_duration: p.total_duration,
        attendance_status: p.attendance_status,
        connection_quality: p.connection_quality,
      }));
    } catch (error) {
      logger.error('Failed to get attendance report:', error);
      throw error;
    }
  }

  /**
   * Subscribe to session updates
   */
  public subscribeToSession(
    sessionId: string,
    onSessionUpdate: (session: LiveSession) => void,
    onParticipantUpdate: (participant: SessionParticipant, action: 'join' | 'leave' | 'update') => void
  ): string {
    // Subscribe to session updates
    const sessionSubscriptionId = realtimeConnection.subscribe(
      'live_sessions',
      `id=eq.${sessionId}`,
      (payload) => {
        const { eventType, new: newRecord } = payload;
        if (eventType === 'UPDATE' && newRecord) {
          this.getSession(sessionId).then(onSessionUpdate);
        }
      }
    );

    // Subscribe to participant updates
    const participantSubscriptionId = realtimeConnection.subscribe(
      'live_session_participants',
      `session_id=eq.${sessionId}`,
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
          case 'INSERT':
            if (newRecord) {
              this.getParticipant(sessionId, newRecord.user_id).then((participant) => {
                if (participant) {
                  onParticipantUpdate(participant, 'join');
                }
              });
            }
            break;
          case 'UPDATE':
            if (newRecord) {
              this.getParticipant(sessionId, newRecord.user_id).then((participant) => {
                if (participant) {
                  const action = newRecord.left_at && !oldRecord?.left_at ? 'leave' : 'update';
                  onParticipantUpdate(participant, action);
                }
              });
            }
            break;
        }
      }
    );

    this.sessionSubscriptions.set(sessionId, sessionSubscriptionId);
    this.participantSubscriptions.set(sessionId, participantSubscriptionId);

    return sessionSubscriptionId;
  }

  /**
   * Unsubscribe from session updates
   */
  public unsubscribeFromSession(sessionId: string): void {
    const sessionSubscriptionId = this.sessionSubscriptions.get(sessionId);
    const participantSubscriptionId = this.participantSubscriptions.get(sessionId);

    if (sessionSubscriptionId) {
      realtimeConnection.unsubscribe(sessionSubscriptionId);
      this.sessionSubscriptions.delete(sessionId);
    }

    if (participantSubscriptionId) {
      realtimeConnection.unsubscribe(participantSubscriptionId);
      this.participantSubscriptions.delete(sessionId);
    }
  }

  /**
   * Get current session
   */
  public getCurrentSession(): LiveSession | null {
    return this.currentSession;
  }

  // Private helper methods

  private async getParticipantCount(sessionId: string): Promise<number> {
    try {
      const { count } = await supabase
        .from('live_session_participants')
        .select('id', { count: 'exact' })
        .eq('session_id', sessionId)
        .is('left_at', null);

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getParticipant(sessionId: string, userId: string): Promise<SessionParticipant | null> {
    try {
      const { data: participant, error } = await supabase
        .from('live_session_participants')
        .select(`
          *,
          user:auth.users!live_session_participants_user_id_fkey(
            id,
            raw_user_meta_data
          )
        `)
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error) return null;

      return {
        ...participant,
        user: participant.user ? {
          id: participant.user.id,
          full_name: participant.user.raw_user_meta_data?.full_name,
          avatar_url: participant.user.raw_user_meta_data?.avatar_url,
          role: participant.user.raw_user_meta_data?.role,
        } : undefined,
      };
    } catch (error) {
      return null;
    }
  }

  private async createSessionChatRoom(sessionId: string, sessionName: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: `${sessionName} - Live Chat`,
          description: `Chat room for live session: ${sessionName}`,
          type: 'class',
          created_by: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update session with chat room ID
      await supabase
        .from('live_sessions')
        .update({ chat_room_id: room.id })
        .eq('id', sessionId);
    } catch (error) {
      logger.error('Failed to create session chat room:', error);
    }
  }
}

// Export singleton instance
export const liveClassService = new LiveClassService();
export default LiveClassService;