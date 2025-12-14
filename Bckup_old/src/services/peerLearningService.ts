/**
 * Peer Learning Network Service
 * Handles peer connections, study groups, collaborative projects, and study buddy matching
 *
 * NOTE: Integrated with Supabase. Database tables:
 * - peer_profiles (student profiles with subjects, strengths, study preferences)
 * - study_groups (groups with members, sessions, discussions)
 * - study_group_memberships (student memberships in groups)
 * - collaborative_projects (team projects with skills, progress, status)
 * - project_team_members (team members for projects)
 * - study_buddies (buddy matches with compatibility scores)
 * - buddy_preferences (study preferences for matching)
 * - peer_connections (connections between students)
 *
 * Run migrations in C:\PC\old\supabase\migrations\ to create the tables.
 */

import { supabase } from '../lib/supabase';

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ==================== INTERFACES ====================

export interface PeerProfile {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  subjects: string[];
  strengths: string[];
  studyPreferences: string[];
  rating: number;
  totalSessions: number;
  isOnline: boolean;
  lastActive: string;
  mutualConnections: number;
  location: string;
  languages: string[];
  achievements: string[];
}

export interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  nextSession: Date;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  creator: string;
  isPrivate: boolean;
  joinRequests: number;
  activeDiscussions: number;
}

export interface CollaborativeProject {
  id: string;
  title: string;
  subject: string;
  description: string;
  teamSize: number;
  maxTeamSize: number;
  skillsNeeded: string[];
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  deadline: Date;
  progress: number;
  coordinator: string;
  status: 'recruiting' | 'in-progress' | 'review' | 'completed';
}

export interface StudyBuddy {
  id: string;
  name: string;
  avatar: string;
  compatibility: number;
  sharedSubjects: string[];
  studyHours: string;
  timezone: string;
  studyStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  responseTime: string;
  sessionCount: number;
  lastInteraction: string;
}

// ==================== SERVICE FUNCTIONS ====================

// Helper function to format last active time
function formatLastActive(lastActive: string | null): string {
  if (!lastActive) return 'Never';

  const now = new Date();
  const last = new Date(lastActive);
  const diffMs = now.getTime() - last.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return last.toLocaleDateString();
}

/**
 * Get peer profiles with optional filters
 */
export const getPeerProfiles = async (
  studentId: string,
  filters?: {
    subject?: string;
    grade?: string;
    isOnline?: boolean;
  }
): Promise<ServiceResponse<PeerProfile[]>> => {
  try {
    let query = supabase
      .from('peer_profiles')
      .select(`
        id,
        student_id,
        name,
        avatar,
        grade,
        subjects,
        strengths,
        study_preferences,
        rating,
        total_sessions,
        is_online,
        last_active,
        location,
        languages,
        achievements
      `);

    // Apply filters
    if (filters?.subject) {
      query = query.contains('subjects', [filters.subject]);
    }
    if (filters?.grade) {
      query = query.eq('grade', filters.grade);
    }
    if (filters?.isOnline !== undefined) {
      query = query.eq('is_online', filters.isOnline);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    // Calculate mutual connections for each peer
    const peerProfiles: PeerProfile[] = await Promise.all(
      (data || []).map(async (profile) => {
        // Get mutual connections count
        const { data: mutualData } = await supabase
          .from('connection_mutual_friends')
          .select('mutual_count')
          .eq('user1_id', studentId)
          .eq('user2_id', profile.student_id)
          .single();

        return {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar || '👤',
          grade: profile.grade,
          subjects: profile.subjects || [],
          strengths: profile.strengths || [],
          studyPreferences: profile.study_preferences || [],
          rating: Number(profile.rating) || 0,
          totalSessions: profile.total_sessions || 0,
          isOnline: profile.is_online || false,
          lastActive: formatLastActive(profile.last_active),
          mutualConnections: mutualData?.mutual_count || 0,
          location: profile.location || '',
          languages: profile.languages || [],
          achievements: profile.achievements || [],
        };
      })
    );

    return { data: peerProfiles, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get study groups with optional filters
 */
export const getStudyGroups = async (
  studentId: string,
  filters?: {
    subject?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }
): Promise<ServiceResponse<StudyGroup[]>> => {
  try {
    let query = supabase
      .from('study_groups')
      .select(`
        id,
        name,
        subject,
        description,
        member_count,
        max_members,
        next_session,
        difficulty,
        tags,
        creator_name,
        is_private,
        join_requests,
        active_discussions
      `);

    // Apply filters
    if (filters?.subject) {
      query = query.eq('subject', filters.subject);
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const studyGroups: StudyGroup[] = (data || []).map((group) => ({
      id: group.id,
      name: group.name,
      subject: group.subject,
      description: group.description || '',
      memberCount: group.member_count || 0,
      maxMembers: group.max_members || 30,
      nextSession: group.next_session ? new Date(group.next_session) : new Date(),
      difficulty: group.difficulty as 'beginner' | 'intermediate' | 'advanced',
      tags: group.tags || [],
      creator: group.creator_name,
      isPrivate: group.is_private || false,
      joinRequests: group.join_requests || 0,
      activeDiscussions: group.active_discussions || 0,
    }));

    return { data: studyGroups, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get collaborative projects with optional filters
 */
export const getCollaborativeProjects = async (
  studentId: string,
  filters?: {
    subject?: string;
    status?: 'recruiting' | 'in-progress' | 'review' | 'completed';
  }
): Promise<ServiceResponse<CollaborativeProject[]>> => {
  try {
    let query = supabase
      .from('collaborative_projects')
      .select(`
        id,
        title,
        subject,
        description,
        team_size,
        max_team_size,
        skills_needed,
        duration,
        difficulty,
        deadline,
        progress,
        coordinator_name,
        status
      `);

    // Apply filters
    if (filters?.subject) {
      query = query.eq('subject', filters.subject);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const projects: CollaborativeProject[] = (data || []).map((project) => ({
      id: project.id,
      title: project.title,
      subject: project.subject,
      description: project.description || '',
      teamSize: project.team_size || 0,
      maxTeamSize: project.max_team_size || 5,
      skillsNeeded: project.skills_needed || [],
      duration: project.duration,
      difficulty: project.difficulty as 'beginner' | 'intermediate' | 'advanced',
      deadline: project.deadline ? new Date(project.deadline) : new Date(),
      progress: project.progress || 0,
      coordinator: project.coordinator_name,
      status: project.status as 'recruiting' | 'in-progress' | 'review' | 'completed',
    }));

    return { data: projects, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get matched study buddies
 */
export const getStudyBuddies = async (
  studentId: string
): Promise<ServiceResponse<StudyBuddy[]>> => {
  try {
    const { data, error } = await supabase
      .from('study_buddies')
      .select(`
        id,
        student1_id,
        student2_id,
        student1_name,
        student2_name,
        student1_avatar,
        student2_avatar,
        compatibility_score,
        shared_subjects,
        session_count,
        last_interaction,
        status
      `)
      .or(`student1_id.eq.${studentId},student2_id.eq.${studentId}`)
      .eq('status', 'active');

    if (error) throw new Error(error.message);

    // Get buddy preferences for study style and hours
    const buddies: StudyBuddy[] = await Promise.all(
      (data || []).map(async (buddy) => {
        const buddyId = buddy.student1_id === studentId ? buddy.student2_id : buddy.student1_id;
        const buddyName = buddy.student1_id === studentId ? buddy.student2_name : buddy.student1_name;
        const buddyAvatar = buddy.student1_id === studentId ? buddy.student1_avatar : buddy.student2_avatar;

        // Get buddy preferences
        const { data: prefs } = await supabase
          .from('buddy_preferences')
          .select('study_hours, timezone, study_style')
          .eq('student_id', buddyId)
          .single();

        return {
          id: buddy.id,
          name: buddyName,
          avatar: buddyAvatar || '👤',
          compatibility: buddy.compatibility_score || 0,
          sharedSubjects: buddy.shared_subjects || [],
          studyHours: prefs?.study_hours || 'Not specified',
          timezone: prefs?.timezone || 'IST',
          studyStyle: prefs?.study_style || 'mixed',
          responseTime: '< 10 mins', // This could be calculated from interaction history
          sessionCount: buddy.session_count || 0,
          lastInteraction: formatLastActive(buddy.last_interaction),
        };
      })
    );

    return { data: buddies, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Join a study group
 */
export const joinStudyGroup = async (
  groupId: string,
  studentId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    // Check if already a member
    const { data: existing } = await supabase
      .from('study_group_memberships')
      .select('id')
      .eq('group_id', groupId)
      .eq('student_id', studentId)
      .single();

    if (existing) {
      return { data: false, error: 'Already a member of this group', success: false };
    }

    // Insert new membership
    const { error } = await supabase
      .from('study_group_memberships')
      .insert({
        group_id: groupId,
        student_id: studentId,
        role: 'member',
        is_active: true,
      });

    if (error) throw new Error(error.message);

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Join a collaborative project
 */
export const joinProject = async (
  projectId: string,
  studentId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    // Get student name
    const { data: profile } = await supabase
      .from('peer_profiles')
      .select('name')
      .eq('student_id', studentId)
      .single();

    if (!profile) {
      return { data: false, error: 'Profile not found', success: false };
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('project_team_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('student_id', studentId)
      .single();

    if (existing) {
      return { data: false, error: 'Already a member of this project', success: false };
    }

    // Insert new team member
    const { error } = await supabase
      .from('project_team_members')
      .insert({
        project_id: projectId,
        student_id: studentId,
        student_name: profile.name,
        role: 'member',
        is_active: true,
      });

    if (error) throw new Error(error.message);

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Connect with a peer
 */
export const connectWithPeer = async (
  peerId: string,
  studentId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    // Check if connection already exists
    const { data: existing } = await supabase
      .from('peer_connections')
      .select('id, status')
      .or(`and(requester_id.eq.${studentId},addressee_id.eq.${peerId}),and(requester_id.eq.${peerId},addressee_id.eq.${studentId})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') {
        return { data: false, error: 'Already connected with this peer', success: false };
      } else if (existing.status === 'pending') {
        return { data: false, error: 'Connection request already pending', success: false };
      }
    }

    // Insert new connection request
    const { error } = await supabase
      .from('peer_connections')
      .insert({
        requester_id: studentId,
        addressee_id: peerId,
        status: 'pending',
        connection_type: 'friend',
      });

    if (error) throw new Error(error.message);

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Create a new study group
 */
export const createStudyGroup = async (
  groupData: {
    name: string;
    subject: string;
    description: string;
    maxMembers: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    isPrivate: boolean;
    nextSession: Date;
    creatorId: string;
    creatorName: string;
  }
): Promise<ServiceResponse<string>> => {
  try {
    const { data, error } = await supabase
      .from('study_groups')
      .insert({
        name: groupData.name,
        subject: groupData.subject,
        description: groupData.description,
        max_members: groupData.maxMembers,
        difficulty: groupData.difficulty,
        tags: groupData.tags,
        is_private: groupData.isPrivate,
        next_session: groupData.nextSession.toISOString(),
        creator_id: groupData.creatorId,
        creator_name: groupData.creatorName,
        member_count: 1, // Creator is the first member
        join_requests: 0,
        active_discussions: 0,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    if (!data?.id) {
      throw new Error('Failed to create study group');
    }

    // Automatically add creator as a member
    await supabase
      .from('study_group_memberships')
      .insert({
        group_id: data.id,
        student_id: groupData.creatorId,
        role: 'admin',
        is_active: true,
      });

    return { data: data.id, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Create a new collaborative project
 */
export const createProject = async (
  projectData: {
    title: string;
    subject: string;
    description: string;
    maxTeamSize: number;
    skillsNeeded: string[];
    duration: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    deadline: Date;
    coordinatorId: string;
    coordinatorName: string;
  }
): Promise<ServiceResponse<string>> => {
  try {
    const { data, error } = await supabase
      .from('collaborative_projects')
      .insert({
        title: projectData.title,
        subject: projectData.subject,
        description: projectData.description,
        max_team_size: projectData.maxTeamSize,
        skills_needed: projectData.skillsNeeded,
        duration: projectData.duration,
        difficulty: projectData.difficulty,
        deadline: projectData.deadline.toISOString(),
        coordinator_id: projectData.coordinatorId,
        coordinator_name: projectData.coordinatorName,
        team_size: 1, // Coordinator is the first member
        progress: 0,
        status: 'recruiting',
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    if (!data?.id) {
      throw new Error('Failed to create project');
    }

    // Automatically add coordinator as a team member
    await supabase
      .from('project_team_members')
      .insert({
        project_id: data.id,
        student_id: projectData.coordinatorId,
        student_name: projectData.coordinatorName,
        role: 'coordinator',
        is_active: true,
      });

    return { data: data.id, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get comprehensive peer learning network data
 */
export const getPeerLearningData = async (
  studentId: string
): Promise<ServiceResponse<{
  peers: PeerProfile[];
  studyGroups: StudyGroup[];
  collaborativeProjects: CollaborativeProject[];
  studyBuddies: StudyBuddy[];
}>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));

    const [peersResult, groupsResult, projectsResult, buddiesResult] = await Promise.all([
      getPeerProfiles(studentId),
      getStudyGroups(studentId),
      getCollaborativeProjects(studentId),
      getStudyBuddies(studentId),
    ]);

    if (!peersResult.success || !groupsResult.success || !projectsResult.success || !buddiesResult.success) {
      return {
        data: null,
        error: 'Failed to load some peer learning data',
        success: false,
      };
    }

    return {
      data: {
        peers: peersResult.data!,
        studyGroups: groupsResult.data!,
        collaborativeProjects: projectsResult.data!,
        studyBuddies: buddiesResult.data!,
      },
      error: null,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};
