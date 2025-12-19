/**
 * Study Groups Query Hook
 * Fetches study groups for study.groups widget
 */
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoUser } from '../useDemoUser';

export type GroupType = 'study' | 'project' | 'exam_prep' | 'homework' | 'discussion' | 'tutoring';
export type GroupStatus = 'active' | 'inactive' | 'archived';
export type MemberRole = 'owner' | 'admin' | 'member';

export interface StudyGroup {
  id: string;
  customerId: string;
  // Group info
  nameEn: string;
  nameHi: string | null;
  descriptionEn: string | null;
  descriptionHi: string | null;
  groupType: GroupType;
  subjectId: string | null;
  subjectNameEn: string | null;
  subjectNameHi: string | null;
  // Visual
  iconName: string;
  colorKey: string;
  coverImageUrl: string | null;
  // Members
  memberCount: number;
  maxMembers: number;
  // Status
  status: GroupStatus;
  isPrivate: boolean;
  // Activity
  lastActivityAt: string;
  nextMeetingAt: string | null;
  // User's membership
  userRole: MemberRole | null;
  joinedAt: string | null;
  // Timestamps
  createdAt: string;
}

export interface StudyGroupsData {
  groups: StudyGroup[];
  myGroups: StudyGroup[];
  suggestedGroups: StudyGroup[];
  totalCount: number;
  hasMore: boolean;
}

export function useStudyGroupsQuery(limit: number = 10) {
  const customerId = useCustomerId();
  const { userId } = useDemoUser();

  return useQuery<StudyGroupsData>({
    queryKey: ['study-groups', customerId, userId, limit],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      
      // Fetch groups with member info
      const { data: groupsData, error: groupsError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .order('last_activity_at', { ascending: false })
        .limit(limit);

      if (groupsError) throw groupsError;

      // Fetch user's memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('study_group_members')
        .select('group_id, role, joined_at')
        .eq('user_id', userId);

      if (membershipsError) throw membershipsError;

      // Create membership lookup
      const membershipMap = new Map(
        (membershipsData || []).map(m => [m.group_id, { role: m.role, joinedAt: m.joined_at }])
      );

      const groups: StudyGroup[] = (groupsData || []).map(group => {
        const membership = membershipMap.get(group.id);
        return {
          id: group.id,
          customerId: group.customer_id,
          nameEn: group.name_en,
          nameHi: group.name_hi,
          descriptionEn: group.description_en,
          descriptionHi: group.description_hi,
          groupType: group.group_type,
          subjectId: group.subject_id,
          subjectNameEn: group.subject_name_en,
          subjectNameHi: group.subject_name_hi,
          iconName: group.icon_name || 'account-group',
          colorKey: group.color_key || 'primary',
          coverImageUrl: group.cover_image_url,
          memberCount: group.member_count || 0,
          maxMembers: group.max_members || 50,
          status: group.status,
          isPrivate: group.is_private,
          lastActivityAt: group.last_activity_at,
          nextMeetingAt: group.next_meeting_at,
          userRole: membership?.role || null,
          joinedAt: membership?.joinedAt || null,
          createdAt: group.created_at,
        };
      });

      const myGroups = groups.filter(g => g.userRole !== null);
      const suggestedGroups = groups.filter(g => g.userRole === null && !g.isPrivate);

      return {
        groups,
        myGroups,
        suggestedGroups,
        totalCount: groups.length,
        hasMore: groups.length >= limit,
      };
    },
    enabled: !!customerId && !!userId,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}
