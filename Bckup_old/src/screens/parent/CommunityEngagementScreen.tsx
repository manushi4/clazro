/**
 * CommunityEngagementScreen - Phase 35.2: Community Engagement Features
 * Parent community platform for networking, events, resource sharing, and volunteer opportunities
 * Includes discussion forums, event coordination, and community involvement features
 * Manushi Coaching Platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';

// Import theme and styling
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

// TODO: Import hooks when backend services are ready
// import { ... } from '../../hooks/api/useParentAPI';
const useCommunityEvents = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useCommunityDiscussions = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useCommunityResources = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useVolunteerOpportunities = () => ({ data: [], isLoading: false, refetch: async () => {} });

const { width } = Dimensions.get('window');

// Type definitions for Community Engagement System
interface CommunityMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  joinDate: string;
  childrenGrades: string[];
  interests: string[];
  volunteerHours: number;
  reputation: number;
  isActive: boolean;
  lastSeen: string;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  organizer: CommunityMember;
  date: string;
  time: string;
  location: string;
  type: 'meeting' | 'fundraiser' | 'social' | 'educational' | 'volunteer';
  maxParticipants?: number;
  currentParticipants: number;
  registrationRequired: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  tags: string[];
  volunteersNeeded: number;
  isRegistered: boolean;
}

interface DiscussionPost {
  id: string;
  author: CommunityMember;
  title: string;
  content: string;
  category: 'general' | 'academic' | 'events' | 'resources' | 'support';
  grade?: string;
  subject?: string;
  timestamp: string;
  likes: number;
  replies: number;
  isLiked: boolean;
  isPinned: boolean;
  tags: string[];
  attachments?: PostAttachment[];
}

interface PostAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  sharedBy: CommunityMember;
  category: 'study-materials' | 'tutoring' | 'activities' | 'recommendations' | 'services';
  grade?: string;
  subject?: string;
  resourceType: 'document' | 'link' | 'contact' | 'service';
  rating: number;
  reviewCount: number;
  dateShared: string;
  downloads: number;
  url?: string;
  contactInfo?: string;
}

interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  organizer: CommunityMember;
  requiredVolunteers: number;
  currentVolunteers: number;
  skillsNeeded: string[];
  timeCommitment: string;
  startDate: string;
  endDate: string;
  location: string;
  type: 'one-time' | 'ongoing' | 'seasonal';
  urgencyLevel: 'low' | 'medium' | 'high';
  isVolunteered: boolean;
}

interface CommunityEngagementScreenProps {
  parentId: string;
  onNavigate: (screen: string) => void;
}

const CommunityEngagementScreen: React.FC<CommunityEngagementScreenProps> = ({
  parentId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'discussions' | 'resources' | 'volunteers'>('events');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'event' | 'post' | 'resource'>('event');

  // Fetch real data using hooks
  const {
    data: eventsData = [],
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useCommunityEvents();

  const {
    data: discussionsData = [],
    isLoading: discussionsLoading,
    error: discussionsError,
    refetch: refetchDiscussions,
  } = useCommunityDiscussions(selectedCategory);

  const {
    data: resourcesData = [],
    isLoading: resourcesLoading,
    error: resourcesError,
    refetch: refetchResources,
  } = useCommunityResources(selectedCategory);

  const {
    data: volunteersData = [],
    isLoading: volunteersLoading,
    error: volunteersError,
    refetch: refetchVolunteers,
  } = useVolunteerOpportunities();

  // Combined loading state
  const isLoading = eventsLoading || discussionsLoading || resourcesLoading || volunteersLoading;

  // Transform data to match component interfaces
  const events: CommunityEvent[] = React.useMemo(() => {
    return eventsData.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      organizer: {
        id: event.organizer?.id || '',
        firstName: event.organizer?.full_name?.split(' ')?.[0] || 'Organizer',
        lastName: event.organizer?.full_name?.split(' ')?.slice(1)?.join(' ') || '',
        email: event.organizer?.email || '',
        profileImage: undefined,
        joinDate: '',
        childrenGrades: [],
        interests: [],
        volunteerHours: 0,
        reputation: 0,
        isActive: true,
        lastSeen: '',
      },
      date: event.event_date,
      time: event.event_time,
      location: event.location,
      type: event.event_type,
      maxParticipants: event.max_participants,
      currentParticipants: event.current_participants || 0,
      registrationRequired: event.registration_required,
      status: event.status,
      tags: event.tags || [],
      volunteersNeeded: event.volunteers_needed || 0,
      isRegistered: false, // TODO: Track user registrations
    }));
  }, [eventsData]);

  const discussions: DiscussionPost[] = React.useMemo(() => {
    return discussionsData.map((post: any) => ({
      id: post.id,
      author: {
        id: post.author?.id || '',
        firstName: post.author?.full_name?.split(' ')?.[0] || 'Author',
        lastName: post.author?.full_name?.split(' ')?.slice(1)?.join(' ') || '',
        email: post.author?.email || '',
        profileImage: undefined,
        joinDate: '',
        childrenGrades: [],
        interests: [],
        volunteerHours: 0,
        reputation: 0,
        isActive: true,
        lastSeen: '',
      },
      title: post.title,
      content: post.content,
      category: post.category,
      grade: post.grade,
      subject: post.subject,
      timestamp: post.created_at,
      likes: post.likes_count || 0,
      replies: post.replies_count || 0,
      isLiked: false, // TODO: Track user likes
      isPinned: post.is_pinned || false,
      tags: post.tags || [],
      attachments: undefined,
    }));
  }, [discussionsData]);

  const resources: Resource[] = React.useMemo(() => {
    return resourcesData.map((resource: any) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      sharedBy: {
        id: resource.sharedBy?.id || '',
        firstName: resource.sharedBy?.full_name?.split(' ')?.[0] || 'Member',
        lastName: resource.sharedBy?.full_name?.split(' ')?.slice(1)?.join(' ') || '',
        email: resource.sharedBy?.email || '',
        profileImage: undefined,
        joinDate: '',
        childrenGrades: [],
        interests: [],
        volunteerHours: 0,
        reputation: 0,
        isActive: true,
        lastSeen: '',
      },
      category: resource.category,
      grade: resource.grade,
      subject: resource.subject,
      resourceType: resource.resource_type,
      rating: resource.rating || 0,
      reviewCount: resource.review_count || 0,
      dateShared: resource.created_at?.split('T')?.[0] || '',
      downloads: resource.downloads || 0,
      url: resource.resource_url,
      contactInfo: resource.contact_info,
    }));
  }, [resourcesData]);

  const volunteers: VolunteerOpportunity[] = React.useMemo(() => {
    return volunteersData.map((volunteer: any) => ({
      id: volunteer.id,
      title: volunteer.title,
      description: volunteer.description,
      organizer: {
        id: volunteer.organizer?.id || '',
        firstName: volunteer.organizer?.full_name?.split(' ')?.[0] || 'Organizer',
        lastName: volunteer.organizer?.full_name?.split(' ')?.slice(1)?.join(' ') || '',
        email: volunteer.organizer?.email || '',
        profileImage: undefined,
        joinDate: '',
        childrenGrades: [],
        interests: [],
        volunteerHours: 0,
        reputation: 0,
        isActive: true,
        lastSeen: '',
      },
      requiredVolunteers: volunteer.required_volunteers,
      currentVolunteers: volunteer.current_volunteers || 0,
      skillsNeeded: volunteer.skills_needed || [],
      timeCommitment: volunteer.time_commitment,
      startDate: volunteer.start_date,
      endDate: volunteer.end_date,
      location: volunteer.location,
      type: volunteer.opportunity_type,
      urgencyLevel: volunteer.urgency_level,
      isVolunteered: false, // TODO: Track user volunteering
    }));
  }, [volunteersData]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Use allSettled to allow partial success
      const results = await Promise.allSettled([
        refetchEvents(),
        refetchDiscussions(),
        refetchResources(),
        refetchVolunteers(),
      ]);

      // Check for failures
      const failed = results.filter(r => r.status === 'rejected');
      const succeeded = results.filter(r => r.status === 'fulfilled');

      if (failed.length === 0) {
        console.log('✅ Data refreshed successfully');
      } else if (succeeded.length > 0) {
        console.warn(`⚠️ Partially refreshed (${failed.length} section(s) failed)`, failed);
      } else {
        throw new Error('All refetches failed');
      }
    } catch (error) {
      console.error('❌ Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchEvents, refetchDiscussions, refetchResources, refetchVolunteers]);

  const handleEventRegistration = (event: CommunityEvent) => {
    Alert.alert(
      event.isRegistered ? 'Cancel Registration' : 'Register for Event',
      `${event.isRegistered ? 'Cancel your registration for' : 'Register for'} "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: event.isRegistered ? 'Unregister' : 'Register', 
          onPress: () => {
            Alert.alert(
              'success',
              `${event.isRegistered ? 'Registration cancelled' : 'Successfully registered'} for ${event.title}!`
            );
          }
        },
      ]
    );
  };

  const handleVolunteerSignup = (opportunity: VolunteerOpportunity) => {
    Alert.alert(
      opportunity.isVolunteered ? 'Cancel Volunteer Commitment' : 'Sign Up as Volunteer',
      `${opportunity.isVolunteered ? 'Cancel your volunteer commitment for' : 'Sign up to volunteer for'} "${opportunity.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: opportunity.isVolunteered ? 'Cancel Commitment' : 'Sign Up', 
          onPress: () => {
            Alert.alert(
              'success',
              `${opportunity.isVolunteered ? 'Volunteer commitment cancelled' : 'Successfully signed up as volunteer'} for ${opportunity.title}!`
            );
          }
        },
      ]
    );
  };

  const renderTabButton = (tab: typeof activeTab, title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }: { item: CommunityEvent }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventOrganizer}>
            By {item.organizer.firstName} {item.organizer.lastName}
          </Text>
        </View>
        <View style={[styles.eventTypeTag, styles[`type${item.type}`]]}>
          <Text style={styles.eventTypeText}>{item.type.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.eventDescription}>{item.description}</Text>

      <View style={styles.eventDetails}>
        <View style={styles.eventDetailItem}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>
            {new Date(item.date).toLocaleDateString()} at {item.time}
          </Text>
        </View>
        <View style={styles.eventDetailItem}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.eventDetailItem}>
          <Text style={styles.detailIcon}>👥</Text>
          <Text style={styles.detailText}>
            {item.currentParticipants} participants
            {item.maxParticipants && ` (${item.maxParticipants} max)`}
          </Text>
        </View>
        {item.volunteersNeeded > 0 && (
          <View style={styles.eventDetailItem}>
            <Text style={styles.detailIcon}>🙋‍♀️</Text>
            <Text style={styles.detailText}>
              {item.volunteersNeeded} volunteers needed
            </Text>
          </View>
        )}
      </View>

      <View style={styles.eventTags}>
        {item.tags.map((tag, index) => (
          <View key={index} style={styles.eventTag}>
            <Text style={styles.eventTagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.eventActions}>
        <TouchableOpacity 
          style={[styles.eventButton, item.isRegistered ? styles.registeredButton : styles.registerButton]}
          onPress={() => handleEventRegistration(item)}
        >
          <Text style={[styles.eventButtonText, item.isRegistered && styles.registeredButtonText]}>
            {item.isRegistered ? 'Registered ✓' : 'Register'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDiscussionItem = ({ item }: { item: DiscussionPost }) => (
    <TouchableOpacity style={[styles.discussionCard, item.isPinned && styles.pinnedDiscussion]} activeOpacity={0.7}>
      <View style={styles.discussionHeader}>
        <View style={styles.discussionAuthor}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorAvatarText}>
              {item.author.firstName.charAt(0)}{item.author.lastName.charAt(0)}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {item.author.firstName} {item.author.lastName}
            </Text>
            <Text style={styles.discussionTime}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {item.isPinned && <Text style={styles.pinIcon}>📌</Text>}
      </View>

      <Text style={styles.discussionTitle}>{item.title}</Text>
      <Text style={styles.discussionContent} numberOfLines={3}>{item.content}</Text>

      <View style={styles.discussionMeta}>
        <Text style={styles.categoryTag}>{item.category.toUpperCase()}</Text>
        {item.grade && <Text style={styles.gradeTag}>{item.grade}</Text>}
        {item.subject && <Text style={styles.subjectTag}>{item.subject}</Text>}
      </View>

      <View style={styles.discussionTags}>
        {item.tags.map((tag, index) => (
          <View key={index} style={styles.discussionTag}>
            <Text style={styles.discussionTagText}>#{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.discussionActions}>
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionIcon}>{item.isLiked ? '❤️' : '🤍'}</Text>
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{item.replies}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderResourceItem = ({ item }: { item: Resource }) => (
    <View style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <Text style={styles.resourceTitle}>{item.title}</Text>
        <View style={styles.resourceRating}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
          <Text style={styles.reviewText}>({item.reviewCount})</Text>
        </View>
      </View>

      <Text style={styles.resourceDescription}>{item.description}</Text>

      <View style={styles.resourceMeta}>
        <Text style={styles.resourceSharedBy}>
          Shared by {item.sharedBy.firstName} {item.sharedBy.lastName}
        </Text>
        <Text style={styles.resourceDate}>
          {new Date(item.dateShared).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.resourceDetails}>
        <View style={styles.resourceTag}>
          <Text style={styles.resourceTagText}>{item.category.replace('-', ' ').toUpperCase()}</Text>
        </View>
        {item.grade && (
          <View style={styles.resourceTag}>
            <Text style={styles.resourceTagText}>{item.grade}</Text>
          </View>
        )}
        {item.subject && (
          <View style={styles.resourceTag}>
            <Text style={styles.resourceTagText}>{item.subject}</Text>
          </View>
        )}
      </View>

      <View style={styles.resourceStats}>
        <Text style={styles.resourceStat}>📥 {item.downloads} downloads</Text>
        <Text style={styles.resourceStat}>{item.resourceType.toUpperCase()}</Text>
      </View>

      <View style={styles.resourceActions}>
        <TouchableOpacity style={styles.accessButton}>
          <Text style={styles.accessButtonText}>
            {item.resourceType === 'link' ? 'Visit Link' : 'Download'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reviewButton}>
          <Text style={styles.reviewButtonText}>Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVolunteerItem = ({ item }: { item: VolunteerOpportunity }) => (
    <View style={[styles.volunteerCard, styles[`urgency${item.urgencyLevel}`]]}>
      <View style={styles.volunteerHeader}>
        <View style={styles.volunteerInfo}>
          <Text style={styles.volunteerTitle}>{item.title}</Text>
          <Text style={styles.volunteerOrganizer}>
            By {item.organizer.firstName} {item.organizer.lastName}
          </Text>
        </View>
        <View style={styles.urgencyBadge}>
          <Text style={styles.urgencyText}>{item.urgencyLevel.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.volunteerDescription}>{item.description}</Text>

      <View style={styles.volunteerDetails}>
        <View style={styles.volunteerDetailItem}>
          <Text style={styles.detailIcon}>👥</Text>
          <Text style={styles.detailText}>
            {item.currentVolunteers}/{item.requiredVolunteers} volunteers
          </Text>
        </View>
        <View style={styles.volunteerDetailItem}>
          <Text style={styles.detailIcon}>⏰</Text>
          <Text style={styles.detailText}>{item.timeCommitment}</Text>
        </View>
        <View style={styles.volunteerDetailItem}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.volunteerDetailItem}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>
            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.skillsNeeded}>
        <Text style={styles.skillsTitle}>Skills Needed:</Text>
        <View style={styles.skillsList}>
          {item.skillsNeeded.map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillTagText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.volunteerButton, item.isVolunteered ? styles.volunteeredButton : styles.signupButton]}
        onPress={() => handleVolunteerSignup(item)}
      >
        <Text style={[styles.volunteerButtonText, item.isVolunteered && styles.volunteeredButtonText]}>
          {item.isVolunteered ? 'Volunteering ✓' : 'Sign Up to Volunteer'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return (
          <FlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>No Events Scheduled</Text>
                <Text style={styles.emptySubtitle}>
                  Be the first to organize a community event!
                </Text>
              </View>
            }
            windowSize={10}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={100}
          />
        );

      case 'discussions':
        return (
          <FlatList
            data={discussions}
            renderItem={renderDiscussionItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>No Discussions Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start a discussion to connect with other parents
                </Text>
              </View>
            }
            windowSize={10}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={100}
          />
        );

      case 'resources':
        return (
          <FlatList
            data={resources}
            renderItem={renderResourceItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyTitle}>No Resources Shared</Text>
                <Text style={styles.emptySubtitle}>
                  Share helpful resources with the community
                </Text>
              </View>
            }
            windowSize={10}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={100}
          />
        );

      case 'volunteers':
        return (
          <FlatList
            data={volunteers}
            renderItem={renderVolunteerItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🙋‍♀️</Text>
                <Text style={styles.emptyTitle}>No Volunteer Opportunities</Text>
                <Text style={styles.emptySubtitle}>
                  Create opportunities for community involvement
                </Text>
              </View>
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate('back')}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Hub</Text>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.headerActionIcon}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTabButton('events', 'Events', '🎉')}
          {renderTabButton('discussions', 'Discussions', '💭')}
          {renderTabButton('resources', 'Resources', '📚')}
          {renderTabButton('volunteers', 'Volunteers', '🙋‍♀️')}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New</Text>
              <TouchableOpacity 
                onPress={() => setShowCreateModal(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.createOption}
              onPress={() => {
                setShowCreateModal(false);
                setCreateType('event');
                Alert.alert(
                  'Create Community Event',
                  'Choose the type of event you\'d like to organize:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'PTA Meeting', 
                      onPress: () => Alert.alert('Event Created!', 'Your PTA meeting has been scheduled. Members will be notified via email and app notifications.')
                    },
                    { 
                      text: 'Fundraiser', 
                      onPress: () => Alert.alert('Fundraiser Created!', 'Your fundraising event has been created. Parents can now register and volunteer to help.')
                    },
                    { 
                      text: 'Social Event', 
                      onPress: () => Alert.alert('Social Event Created!', 'Your community social event has been created. Families can now RSVP and join the fun!')
                    },
                    { 
                      text: 'Educational Workshop', 
                      onPress: () => Alert.alert('Workshop Created!', 'Your educational workshop has been scheduled. Registration is now open for interested parents.')
                    },
                  ]
                );
              }}
            >
              <Text style={styles.createOptionIcon}>🎉</Text>
              <View style={styles.createOptionContent}>
                <Text style={styles.createOptionTitle}>Create Event</Text>
                <Text style={styles.createOptionDescription}>
                  Organize a community event or meeting
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.createOption}
              onPress={() => {
                setShowCreateModal(false);
                setCreateType('post');
                Alert.alert(
                  'Start Discussion',
                  'What would you like to discuss with the community?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Ask for Advice', 
                      onPress: () => Alert.alert('Discussion Started!', 'Your question has been posted to the community forum. Other parents will be notified and can share their advice.')
                    },
                    { 
                      text: 'Share Experience', 
                      onPress: () => Alert.alert('Experience Shared!', 'Thank you for sharing your experience! This will help other parents in similar situations.')
                    },
                    { 
                      text: 'Organize Carpool', 
                      onPress: () => Alert.alert('Carpool Request Posted!', 'Your carpool request is now live. Parents in your area will be notified about this opportunity.')
                    },
                    { 
                      text: 'General Discussion', 
                      onPress: () => Alert.alert('Discussion Created!', 'Your discussion topic has been posted. Community members can now participate and share their thoughts.')
                    },
                  ]
                );
              }}
            >
              <Text style={styles.createOptionIcon}>💭</Text>
              <View style={styles.createOptionContent}>
                <Text style={styles.createOptionTitle}>Start Discussion</Text>
                <Text style={styles.createOptionDescription}>
                  Ask questions or share experiences
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.createOption}
              onPress={() => {
                setShowCreateModal(false);
                setCreateType('resource');
                Alert.alert(
                  'Share Resource',
                  'What type of resource would you like to share?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Study Materials', 
                      onPress: () => Alert.alert('Resource Shared!', 'Your study materials have been added to the community library. Other parents can now access and benefit from your contribution.')
                    },
                    { 
                      text: 'Tutoring Services', 
                      onPress: () => Alert.alert('Tutoring Info Added!', 'Your tutoring recommendation has been shared. Parents looking for tutoring help will be able to find this valuable information.')
                    },
                    { 
                      text: 'Educational Apps', 
                      onPress: () => Alert.alert('App Recommendation Posted!', 'Thank you for sharing this educational app! Other families can now discover and benefit from your recommendation.')
                    },
                    { 
                      text: 'Local Services', 
                      onPress: () => Alert.alert('Service Recommendation Added!', 'Your local service recommendation has been posted. This will help other families find trusted local providers.')
                    },
                    { 
                      text: 'Activity Ideas', 
                      onPress: () => Alert.alert('Activity Ideas Shared!', 'Your creative activity ideas have been added to the community resources. Families can now try these engaging activities!')
                    },
                  ]
                );
              }}
            >
              <Text style={styles.createOptionIcon}>📚</Text>
              <View style={styles.createOptionContent}>
                <Text style={styles.createOptionTitle}>Share Resource</Text>
                <Text style={styles.createOptionDescription}>
                  Share helpful resources with parents
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.createOption}
              onPress={() => {
                setShowCreateModal(false);
                Alert.alert(
                  'Create Volunteer Opportunity',
                  'What kind of volunteer help do you need?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Event Setup', 
                      onPress: () => Alert.alert('Volunteer Opportunity Created!', 'Your event setup volunteer request is now live. Parents interested in helping will receive notifications and can sign up.')
                    },
                    { 
                      text: 'Classroom Help', 
                      onPress: () => Alert.alert('Classroom Volunteer Request Posted!', 'Your classroom assistance request has been created. Teachers and parents will be notified about this opportunity to help.')
                    },
                    { 
                      text: 'Field Trip Chaperone', 
                      onPress: () => Alert.alert('Chaperone Request Created!', 'Your field trip chaperone request is now active. Parents can volunteer to help supervise and ensure a safe, fun experience.')
                    },
                    { 
                      text: 'Library Assistant', 
                      onPress: () => Alert.alert('Library Volunteer Opportunity Posted!', 'Your library assistance request has been created. Parents who love reading can now volunteer to help with library activities.')
                    },
                    { 
                      text: 'Sports Coach Helper', 
                      onPress: () => Alert.alert('Sports Volunteer Request Active!', 'Your sports coaching assistance request is now live. Parents with sports experience can volunteer to help train young athletes.')
                    },
                  ]
                );
              }}
            >
              <Text style={styles.createOptionIcon}>🙋‍♀️</Text>
              <View style={styles.createOptionContent}>
                <Text style={styles.createOptionTitle}>Volunteer Opportunity</Text>
                <Text style={styles.createOptionDescription}>
                  Create opportunities for community help
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFE',
  },

  // Header Styles
  header: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.LG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  headerActionIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },

  // Tab Styles
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  tabButton: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    marginHorizontal: Spacing.XS,
    borderRadius: BorderRadius.LG,
    alignItems: 'center',
    minWidth: 100,
  },
  tabButtonActive: {
    backgroundColor: '#EDE9FE',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: Spacing.XS,
  },
  tabText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  tabTextActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },

  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: Spacing.MD,
  },

  // Event Styles
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  eventOrganizer: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  eventTypeTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  typemeeting: {
    backgroundColor: '#DBEAFE',
  },
  typefundraiser: {
    backgroundColor: '#FEF3C7',
  },
  typesocial: {
    backgroundColor: '#D1FAE5',
  },
  typeeducational: {
    backgroundColor: '#EDE9FE',
  },
  typevolunteer: {
    backgroundColor: '#FCE7F3',
  },
  eventTypeText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  eventDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  eventDetails: {
    marginBottom: Spacing.MD,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: Spacing.SM,
    width: 20,
  },
  detailText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
  },
  eventTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.MD,
  },
  eventTag: {
    backgroundColor: LightTheme.SecondaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  eventTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSecondaryContainer,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventButton: {
    flex: 1,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginRight: Spacing.SM,
  },
  registerButton: {
    backgroundColor: '#7C3AED',
  },
  registeredButton: {
    backgroundColor: '#D1FAE5',
  },
  eventButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registeredButtonText: {
    color: LightTheme.OnSurface,
  },
  shareButton: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurface,
  },

  // Discussion Styles
  discussionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  pinnedDiscussion: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  discussionAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LightTheme.SecondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.MD,
  },
  authorAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  discussionTime: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  pinIcon: {
    fontSize: 16,
  },
  discussionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  discussionContent: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  discussionMeta: {
    flexDirection: 'row',
    marginBottom: Spacing.MD,
  },
  categoryTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: '#7C3AED',
    marginRight: Spacing.SM,
  },
  gradeTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginRight: Spacing.SM,
  },
  subjectTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  discussionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.MD,
  },
  discussionTag: {
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  discussionTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  discussionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: Spacing.XS,
  },
  actionText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },

  // Resource Styles
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  resourceTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    flex: 1,
    marginRight: Spacing.SM,
  },
  resourceRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    marginRight: Spacing.XS,
  },
  reviewText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  resourceDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  resourceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  resourceSharedBy: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  resourceDate: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  resourceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.MD,
  },
  resourceTag: {
    backgroundColor: LightTheme.SecondaryContainer,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  resourceTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSecondaryContainer,
  },
  resourceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.MD,
  },
  resourceStat: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  resourceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accessButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginRight: Spacing.SM,
  },
  accessButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewButton: {
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurface,
  },

  // Volunteer Styles
  volunteerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderLeftWidth: 4,
  },
  urgencylow: {
    borderLeftColor: '#10B981',
  },
  urgencymedium: {
    borderLeftColor: '#F59E0B',
  },
  urgencyhigh: {
    borderLeftColor: '#EF4444',
  },
  volunteerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  volunteerOrganizer: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    backgroundColor: '#FEF3C7',
  },
  urgencyText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  volunteerDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  volunteerDetails: {
    marginBottom: Spacing.MD,
  },
  volunteerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  skillsNeeded: {
    marginBottom: Spacing.MD,
  },
  skillsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  skillTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: '#7C3AED',
  },
  volunteerButton: {
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  signupButton: {
    backgroundColor: '#7C3AED',
  },
  volunteeredButton: {
    backgroundColor: '#D1FAE5',
  },
  volunteerButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  volunteeredButtonText: {
    color: LightTheme.OnSurface,
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.XXL,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.LG,
  },
  emptyTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: Spacing.XL,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    width: width - Spacing.XL * 2,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  modalTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  modalClose: {
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LightTheme.OnSurfaceVariant,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  createOptionIcon: {
    fontSize: 32,
    marginRight: Spacing.MD,
  },
  createOptionContent: {
    flex: 1,
  },
  createOptionTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  createOptionDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
});

export default CommunityEngagementScreen;