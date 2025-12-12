/**
 * NewPeerLearningNetwork - EXACT match to HTML reference
 * Purpose: Connect with peers for collaborative learning
 * Design: Material Design top bar, gradient header, search, peer cards, study groups
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

interface Peer {
  id: string;
  name: string;
  grade: string;
  percentage: number;
  subjects: string[];
  avatar_url?: string;
}

interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  members: number;
  maxMembers: number;
  lastActive: string;
  isActive: boolean;
}

interface SuggestedPeer {
  id: string;
  name: string;
  grade: string;
  matchPercentage: number;
  sharedClasses: number;
  avatar_url?: string;
}

export default function NewPeerLearningNetwork() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'peers' | 'groups'>('peers');

  useEffect(() => {
    trackScreenView('NewPeerLearningNetwork');
  }, []);

  // Fetch connections (peers from same class)
  const { data: connections, isLoading, refetch } = useQuery({
    queryKey: ['peer-connections', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      const { data: studentData } = await supabase
        .from('students')
        .select('class_id, grade')
        .eq('id', user.id)
        .single();

      if (!studentData) return [];

      // Fetch peers from same class with their grade and avatar
      const { data: peers, error: peersError } = await supabase
        .from('students')
        .select('id, name, email, grade, avatar_url')
        .eq('class_id', studentData.class_id)
        .neq('id', user.id)
        .limit(5);

      if (peersError) {
        console.error('Error fetching peers:', peersError);
        return [];
      }

      // For each peer, fetch their subjects from class_enrollments
      const peersWithDetails = await Promise.all(
        (peers || []).map(async (peer) => {
          // Fetch peer's enrolled courses/subjects
          const { data: enrollments } = await supabase
            .from('class_enrollments')
            .select(`
              classes (
                name
              )
            `)
            .eq('student_id', peer.id)
            .limit(3);

          // Calculate match percentage based on shared classes
          const { data: sharedClasses } = await supabase
            .from('class_enrollments')
            .select('class_id')
            .eq('student_id', peer.id)
            .in(
              'class_id',
              (await supabase
                .from('class_enrollments')
                .select('class_id')
                .eq('student_id', user.id)
                .then(res => res.data?.map(e => e.class_id) || []))
            );

          const subjects = enrollments?.map((e: any) => e.classes?.name).filter(Boolean) || [];
          const matchPercentage = sharedClasses?.length
            ? Math.min(95, 70 + (sharedClasses.length * 8))
            : 75;

          return {
            id: peer.id,
            name: peer.name || 'Unknown Student',
            grade: peer.grade ? `Grade ${peer.grade}` : `Grade ${studentData.grade || 11}`,
            percentage: matchPercentage,
            subjects: subjects.slice(0, 2),
            avatar_url: peer.avatar_url || undefined,
          };
        })
      );

      return peersWithDetails as Peer[];
    },
    enabled: !!user?.id,
  });

  // Fetch study groups
  const { data: studyGroups } = useQuery({
    queryKey: ['study-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          id,
          name,
          subject,
          max_members,
          last_active_at
        `)
        .order('last_active_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching study groups:', error);
        return [];
      }

      // Helper function to format time ago
      const formatTimeAgo = (timestamp: string) => {
        const now = new Date().getTime();
        const activityTime = new Date(timestamp).getTime();
        const diffMinutes = Math.floor((now - activityTime) / (1000 * 60));

        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
      };

      // Helper function to check if active (within 15 minutes)
      const isWithinMinutes = (timestamp: string, minutes: number) => {
        const now = new Date().getTime();
        const activityTime = new Date(timestamp).getTime();
        const diffMinutes = Math.floor((now - activityTime) / (1000 * 60));
        return diffMinutes <= minutes;
      };

      // Fetch member counts for each group
      const groupsWithDetails = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            id: group.id,
            name: group.name,
            subject: group.subject,
            members: count || 0,
            maxMembers: group.max_members,
            lastActive: formatTimeAgo(group.last_active_at),
            isActive: isWithinMinutes(group.last_active_at, 15),
          };
        })
      );

      return groupsWithDetails as StudyGroup[];
    },
    enabled: !!user?.id,
  });

  // Fetch suggested peers using RPC function
  const { data: suggestedPeers } = useQuery({
    queryKey: ['suggested-peers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .rpc('get_suggested_peers', { p_student_id: user.id })
        .limit(5);

      if (error) {
        console.error('Error fetching suggested peers:', error);
        return [];
      }

      return (data || []).map((peer: any) => ({
        id: peer.id,
        name: peer.name,
        grade: peer.grade ? `Grade ${peer.grade}` : 'Grade 11',
        matchPercentage: peer.match_percentage || 85,
        sharedClasses: peer.shared_classes || 0,
        avatar_url: peer.avatar_url || undefined,
      })) as SuggestedPeer[];
    },
    enabled: !!user?.id,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Bar - Material Design Standard */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            trackAction('back', 'NewPeerLearningNetwork');
            navigation.goBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T variant="h2" style={styles.icon}>←</T>
        </TouchableOpacity>
        <T variant="title" weight="bold" style={styles.topBarTitle}>Study Network</T>
        <TouchableOpacity
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <T variant="h2" style={styles.icon}>⋮</T>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              trackAction('refresh_peer_network', 'NewPeerLearningNetwork');
              refetch();
            }}
          />
        }
      >
        {/* Gradient Header */}
        <View style={styles.gradientHeader}>
          <T style={styles.headerTitle}>Connect & Collaborate</T>
          <T variant="body" style={styles.headerSubtitle}>
            Find study partners and groups for your courses.
          </T>
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'peers' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('peers');
                trackAction('switch_to_peers_tab', 'NewPeerLearningNetwork');
              }}
            >
              <T variant="body" weight="bold" style={activeTab === 'peers' ? styles.tabTextActive : styles.tabTextInactive}>
                Find Peers
              </T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'groups' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('groups');
                trackAction('switch_to_groups_tab', 'NewPeerLearningNetwork');
              }}
            >
              <T variant="body" weight="bold" style={activeTab === 'groups' ? styles.tabTextActive : styles.tabTextInactive}>
                Groups
              </T>
            </TouchableOpacity>
          </View>
        </View>

        {/* Floating Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchCard}>
            <T variant="h3" style={styles.searchIcon}>🔍</T>
            <TextInput
              style={styles.searchInput}
              placeholder="Search students or groups..."
              placeholderTextColor="#888888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.content}>
          {/* My Connections Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <T variant="body" weight="bold" style={styles.sectionTitle}>My Connections</T>
              <TouchableOpacity onPress={() => trackAction('view_all_connections', 'NewPeerLearningNetwork')}>
                <T variant="caption" weight="bold" style={styles.seeAllLink}>See All</T>
              </TouchableOpacity>
            </View>

            {/* Horizontal Scroll - Peer Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {(connections || []).map((peer) => (
                <View key={peer.id} style={styles.peerCard}>
                  {/* Profile Header */}
                  <View style={styles.peerCardHeader}>
                    {peer.avatar_url ? (
                      <Image source={{ uri: peer.avatar_url }} style={styles.peerAvatar} />
                    ) : (
                      <View style={styles.peerAvatarPlaceholder}>
                        <T variant="h2">👤</T>
                      </View>
                    )}
                    <View style={styles.peerInfo}>
                      <T variant="body" weight="bold" style={styles.peerName}>{peer.name}</T>
                      <T variant="caption" style={styles.peerGrade}>{peer.grade}</T>
                    </View>
                    <View style={styles.percentageBadge}>
                      <T variant="caption" style={styles.starIcon}>⭐</T>
                      <T variant="caption" weight="bold" style={styles.percentageText}>
                        {peer.percentage}%
                      </T>
                    </View>
                  </View>

                  {/* Subject Tags */}
                  <View style={styles.subjectTags}>
                    {peer.subjects.map((subject, idx) => (
                      <View key={idx} style={styles.subjectTag}>
                        <T variant="caption" style={styles.subjectTagText}>{subject}</T>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.peerCardActions}>
                    <TouchableOpacity
                      style={styles.messageButton}
                      onPress={() => {
                        trackAction('message_peer', 'NewPeerLearningNetwork', { peerId: peer.id });
                      }}
                    >
                      <T variant="caption" weight="bold" style={styles.messageButtonText}>Message</T>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.viewProfileButton}
                      onPress={() => {
                        trackAction('view_peer_profile', 'NewPeerLearningNetwork', { peerId: peer.id });
                        // @ts-expect-error - PeerDetail is in CollaborationStack, navigation types need update
                        safeNavigate('PeerDetail', { peerId: peer.id, peerName: peer.name });
                      }}
                    >
                      <T variant="caption" weight="bold" style={styles.viewProfileButtonText}>View Profile</T>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Study Groups Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <T variant="body" weight="bold" style={styles.sectionTitle}>Study Groups</T>
              <TouchableOpacity onPress={() => trackAction('view_all_groups', 'NewPeerLearningNetwork')}>
                <T variant="caption" weight="bold" style={styles.seeAllLink}>See All</T>
              </TouchableOpacity>
            </View>

            <View style={styles.groupsList}>
              {(studyGroups || []).map((group) => (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupCardHeader}>
                    <View style={styles.groupCardLeft}>
                      <T variant="body" weight="bold" style={styles.groupName}>{group.name}</T>
                      <T variant="caption" style={styles.groupSubject}>{group.subject}</T>
                    </View>
                    {group.isActive && (
                      <View style={styles.activeBadge}>
                        <View style={styles.activeDot} />
                        <T variant="caption" weight="bold" style={styles.activeBadgeText}>Active</T>
                      </View>
                    )}
                  </View>

                  <View style={styles.groupCardFooter}>
                    <View style={styles.groupStats}>
                      <T variant="caption" style={styles.groupIcon}>👥</T>
                      <T variant="caption" style={styles.groupStatsText}>
                        {group.members}/{group.maxMembers} members
                      </T>
                    </View>
                    <T variant="caption" style={styles.lastActiveText}>
                      Last active: {group.lastActive}
                    </T>
                  </View>

                  <TouchableOpacity
                    style={styles.openGroupButton}
                    onPress={() => {
                      trackAction('open_group', 'NewPeerLearningNetwork', { groupId: group.id });
                    }}
                  >
                    <T variant="caption" weight="bold" style={styles.openGroupButtonText}>Open Group</T>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Suggested for You Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <T variant="body" weight="bold" style={styles.sectionTitle}>Suggested for You</T>
            </View>

            {/* Horizontal Scroll - Suggested Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {/* Suggested Peer Card */}
              {(suggestedPeers || []).map((peer) => (
                <View key={peer.id} style={styles.suggestedPeerCard}>
                  <View style={styles.suggestedPeerHeader}>
                    {peer.avatar_url ? (
                      <Image source={{ uri: peer.avatar_url }} style={styles.suggestedPeerAvatar} />
                    ) : (
                      <View style={styles.suggestedPeerAvatarPlaceholder}>
                        <T variant="h2">👤</T>
                      </View>
                    )}
                    <View style={styles.suggestedPeerInfo}>
                      <T variant="body" weight="bold" style={styles.suggestedPeerName}>{peer.name}</T>
                      <T variant="caption" style={styles.suggestedPeerGrade}>{peer.grade}</T>
                      <View style={styles.matchBadge}>
                        <T variant="caption" style={styles.starIcon}>⭐</T>
                        <T variant="caption" weight="bold" style={styles.matchBadgeText}>
                          {peer.matchPercentage}% Match
                        </T>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => {
                        trackAction('add_suggested_peer', 'NewPeerLearningNetwork', { peerId: peer.id });
                      }}
                    >
                      <T variant="body" style={styles.addButtonIcon}>+</T>
                    </TouchableOpacity>
                  </View>
                  <T variant="caption" style={styles.suggestedPeerHint}>
                    You both share {peer.sharedClasses} classes together.
                  </T>
                </View>
              ))}

              {/* Suggested Group Card */}
              <View style={styles.suggestedGroupCard}>
                <View style={styles.suggestedGroupHeader}>
                  <View style={styles.suggestedGroupIcon}>
                    <T variant="h2" style={styles.suggestedGroupIconText}>🧬</T>
                  </View>
                  <View style={styles.suggestedGroupInfo}>
                    <T variant="body" weight="bold" style={styles.suggestedGroupName}>Biology Buffs</T>
                    <T variant="caption" style={styles.suggestedGroupSubject}>Intro to Biology</T>
                  </View>
                </View>
                <T variant="caption" style={styles.suggestedGroupHint}>
                  New group with students from your class.
                </T>
                <TouchableOpacity
                  style={styles.joinGroupButton}
                  onPress={() => {
                    trackAction('join_suggested_group', 'NewPeerLearningNetwork', { groupId: 'biology-buffs' });
                  }}
                >
                  <T variant="caption" weight="bold" style={styles.joinGroupButtonText}>Join Group</T>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  // Top App Bar - Material Design Standard
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  icon: {
    fontSize: 24,
    color: '#333333',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  // Gradient Header
  gradientHeader: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 56,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabTextActive: {
    fontSize: 14,
    color: '#4A90E2',
  },
  tabTextInactive: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  // Floating Search Bar
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -32,
    marginBottom: 24,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  searchIcon: {
    fontSize: 20,
    color: '#888888',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  content: {
    paddingBottom: 32,
  },
  // Section Layout
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#333333',
  },
  seeAllLink: {
    fontSize: 14,
    color: '#4A90E2',
  },
  // Horizontal Scroll
  horizontalScrollContent: {
    paddingHorizontal: 16,
  },
  // Peer Card (Horizontal Scroll)
  peerCard: {
    width: 256,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  peerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  peerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  peerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  peerInfo: {
    flex: 1,
  },
  peerName: {
    fontSize: 16,
    color: '#333333',
  },
  peerGrade: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  percentageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
  },
  starIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  percentageText: {
    fontSize: 12,
    color: '#F5A623',
  },
  subjectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  subjectTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    marginBottom: 8,
  },
  subjectTagText: {
    fontSize: 12,
    color: '#888888',
  },
  peerCardActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  messageButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  viewProfileButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileButtonText: {
    fontSize: 14,
    color: '#333333',
  },
  // Study Groups Section
  groupsList: {
    paddingHorizontal: 16,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupCardLeft: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    color: '#333333',
  },
  groupSubject: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(80, 227, 194, 0.2)',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#50E3C2',
    marginRight: 6,
  },
  activeBadgeText: {
    fontSize: 12,
    color: '#50E3C2',
  },
  groupCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  groupStatsText: {
    fontSize: 14,
    color: '#888888',
  },
  lastActiveText: {
    fontSize: 14,
    color: '#888888',
  },
  openGroupButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openGroupButtonText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  // Suggested for You Section
  suggestedPeerCard: {
    width: 288,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.5)',
    padding: 16,
    marginRight: 16,
  },
  suggestedPeerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestedPeerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  suggestedPeerAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  suggestedPeerInfo: {
    flex: 1,
  },
  suggestedPeerName: {
    fontSize: 16,
    color: '#333333',
  },
  suggestedPeerGrade: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 16,
  },
  matchBadgeText: {
    fontSize: 12,
    color: '#F5A623',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  suggestedPeerHint: {
    fontSize: 14,
    color: 'rgba(74, 144, 226, 0.8)',
  },
  // Suggested Group Card
  suggestedGroupCard: {
    width: 288,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  suggestedGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestedGroupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(80, 227, 194, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  suggestedGroupIconText: {
    fontSize: 30,
    color: '#50E3C2',
  },
  suggestedGroupInfo: {
    flex: 1,
  },
  suggestedGroupName: {
    fontSize: 16,
    color: '#333333',
  },
  suggestedGroupSubject: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  suggestedGroupHint: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },
  joinGroupButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinGroupButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
