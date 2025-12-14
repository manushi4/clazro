/**
 * InformationHubScreen - Phase 36.2: Information Hub and Resources
 * Centralized information management for school policies, academic calendar,
 * educational resources, news, and emergency protocols
 * Manushi Coaching Platform
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  Linking,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Appbar,
  Portal,
  Snackbar,
} from 'react-native-paper';

// TODO: Import hooks when backend services are ready
const useSchoolPolicies = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useSchoolAnnouncements = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useImportantDates = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useEducationalResources = () => ({ data: [], isLoading: false, refetch: async () => {} });
const useEmergencyProtocols = () => ({ data: [], isLoading: false, refetch: async () => {} });

// Import theme and styling
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

// Type definitions for Information Hub System
interface SchoolPolicy {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'conduct' | 'safety' | 'attendance' | 'general';
  content: string;
  lastUpdated: string;
  version: string;
  isImportant: boolean;
  documentUrl?: string;
  acknowledgmentRequired: boolean;
  isAcknowledged: boolean;
}

interface ImportantDate {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  type: 'exam' | 'holiday' | 'event' | 'deadline' | 'meeting' | 'registration';
  isRecurring: boolean;
  reminderSet: boolean;
  affectedGrades: string[];
  location?: string;
  contactPerson?: string;
  contactEmail?: string;
}

interface EducationalResource {
  id: string;
  title: string;
  description: string;
  category: 'study-guides' | 'online-courses' | 'books' | 'videos' | 'apps' | 'tools';
  grade: string;
  subject: string;
  resourceType: 'link' | 'download' | 'subscription' | 'free';
  url?: string;
  cost?: number;
  rating: number;
  reviewCount: number;
  providedBy: string;
  lastUpdated: string;
  isFeatured: boolean;
  tags: string[];
}

interface NewsAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'academic' | 'sports' | 'events' | 'urgent' | 'achievement';
  author: string;
  publishedDate: string;
  expiryDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  attachments?: NewsAttachment[];
  targetAudience: string[];
  isPinned: boolean;
  allowComments: boolean;
}

interface NewsAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

interface EmergencyProtocol {
  id: string;
  title: string;
  description: string;
  type: 'fire' | 'medical' | 'security' | 'weather' | 'lockdown' | 'evacuation';
  priority: 'critical' | 'high' | 'medium';
  procedures: string[];
  emergencyContacts: EmergencyContact[];
  assembly_points?: string[];
  lastReviewed: string;
  isActive: boolean;
}

interface EmergencyContact {
  name: string;
  role: string;
  phoneNumber: string;
  email?: string;
  availability: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  isHelpful?: boolean;
  viewCount: number;
  lastUpdated: string;
}

interface InformationHubScreenProps {
  parentId: string;
  onNavigate: (screen: string) => void;
}

const InformationHubScreen: React.FC<InformationHubScreenProps> = ({
  parentId,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'policies' | 'calendar' | 'resources' | 'news' | 'emergency'>('news');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch real data using hooks
  const {
    data: policiesData = [],
    isLoading: policiesLoading,
    error: policiesError,
    refetch: refetchPolicies,
  } = useSchoolPolicies(selectedCategory !== 'all' ? selectedCategory : undefined);

  const {
    data: newsData = [],
    isLoading: newsLoading,
    error: newsError,
    refetch: refetchNews,
  } = useSchoolAnnouncements();

  const {
    data: datesData = [],
    isLoading: datesLoading,
    error: datesError,
    refetch: refetchDates,
  } = useImportantDates();

  const {
    data: resourcesData = [],
    isLoading: resourcesLoading,
    error: resourcesError,
    refetch: refetchResources,
  } = useEducationalResources();

  const {
    data: protocolsData = [],
    isLoading: protocolsLoading,
    error: protocolsError,
    refetch: refetchProtocols,
  } = useEmergencyProtocols();

  // Combined loading state
  const isLoading = policiesLoading || newsLoading || datesLoading || resourcesLoading || protocolsLoading;

  // Transform policies data
  const policies: SchoolPolicy[] = React.useMemo(() => {
    return policiesData.map((policy: any) => ({
      id: policy.id,
      title: policy.title,
      description: policy.description,
      category: policy.category,
      content: policy.content,
      lastUpdated: policy.last_updated,
      version: policy.version,
      isImportant: policy.is_important,
      documentUrl: policy.document_url,
      acknowledgmentRequired: policy.acknowledgment_required,
      isAcknowledged: false, // TODO: Track user acknowledgments
    }));
  }, [policiesData]);

  // Transform news/announcements data
  const news: NewsAnnouncement[] = React.useMemo(() => {
    return newsData.map((announcement: any) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      author: announcement.author,
      publishedDate: announcement.published_date,
      expiryDate: announcement.expiry_date,
      priority: announcement.priority,
      isRead: false, // TODO: Track user read status
      targetAudience: announcement.target_audience || [],
      isPinned: announcement.is_pinned,
      allowComments: announcement.allow_comments,
    }));
  }, [newsData]);

  // Transform important dates data
  const importantDates: ImportantDate[] = React.useMemo(() => {
    return datesData.map((date: any) => ({
      id: date.id,
      title: date.title,
      description: date.description,
      date: date.event_date,
      endDate: date.end_date,
      type: date.event_type,
      isRecurring: date.is_recurring,
      reminderSet: false, // TODO: Track user reminders
      affectedGrades: date.affected_grades || [],
      location: date.location,
      contactPerson: date.contact_person,
      contactEmail: date.contact_email,
    }));
  }, [datesData]);

  // Transform educational resources data
  const resources: EducationalResource[] = React.useMemo(() => {
    return resourcesData.map((resource: any) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      category: resource.category,
      grade: resource.grade,
      subject: resource.subject,
      resourceType: resource.resource_type,
      url: resource.url,
      cost: resource.cost,
      rating: resource.rating,
      reviewCount: resource.review_count,
      providedBy: resource.provided_by,
      lastUpdated: resource.last_updated,
      isFeatured: resource.is_featured,
      tags: resource.tags || [],
    }));
  }, [resourcesData]);

  // Transform emergency protocols data
  const emergencyProtocols: EmergencyProtocol[] = React.useMemo(() => {
    return protocolsData.map((protocol: any) => {
      // Parse JSONB fields safely
      let procedures: string[] = [];
      let emergencyContacts: EmergencyContact[] = [];

      try {
        // Handle procedures - can be array or JSON string
        if (Array.isArray(protocol.procedures)) {
          procedures = protocol.procedures;
        } else if (typeof protocol.procedures === 'string') {
          procedures = JSON.parse(protocol.procedures);
        }
      } catch (error) {
        console.error('Error parsing procedures:', error);
        procedures = [];
      }

      try {
        // Handle emergency_contacts - can be array or JSON string
        if (Array.isArray(protocol.emergency_contacts)) {
          emergencyContacts = protocol.emergency_contacts;
        } else if (typeof protocol.emergency_contacts === 'string') {
          emergencyContacts = JSON.parse(protocol.emergency_contacts);
        }
      } catch (error) {
        console.error('Error parsing emergency contacts:', error);
        emergencyContacts = [];
      }

      return {
        id: protocol.id,
        title: protocol.title,
        description: protocol.description,
        type: protocol.protocol_type,
        priority: protocol.priority,
        procedures,
        emergencyContacts,
        assembly_points: protocol.assembly_points || [],
        lastReviewed: protocol.last_reviewed,
        isActive: protocol.is_active,
      };
    });
  }, [protocolsData]);

  // Pull-to-refresh handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Use allSettled to allow partial success
      const results = await Promise.allSettled([
        refetchPolicies(),
        refetchNews(),
        refetchDates(),
        refetchResources(),
        refetchProtocols(),
      ]);

      // Check for failures
      const failed = results.filter(r => r.status === 'rejected');
      const succeeded = results.filter(r => r.status === 'fulfilled');

      if (failed.length === 0) {
        setSnackbarMessage('Data refreshed successfully');
        setSnackbarVisible(true);
      } else if (succeeded.length > 0) {
        setSnackbarMessage(`Partially refreshed (${failed.length} section(s) failed)`);
        setSnackbarVisible(true);
        console.warn('Some refetches failed:', failed);
      } else {
        throw new Error('All refetches failed');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      setSnackbarMessage('Failed to refresh data. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setRefreshing(false);
    }
  }, [refetchPolicies, refetchNews, refetchDates, refetchResources, refetchProtocols]);

  const handleResourceOpen = (resource: EducationalResource) => {
    if (resource.url) {
      Alert.alert(
        'Open Resource',
        `Open "${resource.title}" in browser?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => Linking.openURL(resource.url!) },
        ]
      );
    } else {
      Alert.alert('Resource', 'Resource link not available');
    }
  };

  const handlePolicyAcknowledgment = (policy: SchoolPolicy) => {
    if (policy.acknowledgmentRequired && !policy.isAcknowledged) {
      Alert.alert(
        'Acknowledge Policy',
        'Do you acknowledge that you have read and understood this policy?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Acknowledge', 
            onPress: () => Alert.alert('success', 'Policy acknowledged successfully!') 
          },
        ]
      );
    }
  };

  const handleEmergencyCall = (contact: EmergencyContact) => {
    Alert.alert(
      'Emergency Call',
      `Call ${contact.name} at ${contact.phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${contact.phoneNumber}`) },
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

  const renderPolicyItem = ({ item }: { item: SchoolPolicy }) => (
    <TouchableOpacity
      style={[styles.policyCard, item.isImportant && styles.importantPolicy]}
      onPress={() => {
        setSelectedItem(item);
        setShowDetailModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.policyHeader}>
        <View style={styles.policyInfo}>
          <Text style={styles.policyTitle}>{item.title}</Text>
          <Text style={styles.policyCategory}>{item.category.toUpperCase()}</Text>
        </View>
        <View style={styles.policyMeta}>
          {item.isImportant && <Text style={styles.importantBadge}>❗</Text>}
          {item.acknowledgmentRequired && !item.isAcknowledged && (
            <Text style={styles.acknowledgmentBadge}>❓</Text>
          )}
          {item.isAcknowledged && <Text style={styles.acknowledgedBadge}>✅</Text>}
        </View>
      </View>

      <Text style={styles.policyDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.policyFooter}>
        <Text style={styles.policyVersion}>v{item.version}</Text>
        <Text style={styles.policyDate}>
          Updated: {new Date(item.lastUpdated).toLocaleDateString()}
        </Text>
      </View>

      {item.acknowledgmentRequired && !item.isAcknowledged && (
        <TouchableOpacity
          style={styles.acknowledgeButton}
          onPress={() => handlePolicyAcknowledgment(item)}
        >
          <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderDateItem = ({ item }: { item: ImportantDate }) => (
    <View style={styles.dateCard}>
      <View style={styles.dateHeader}>
        <View style={styles.dateInfo}>
          <Text style={styles.dateTitle}>{item.title}</Text>
          <Text style={styles.dateType}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateDay}>
            {new Date(item.date).getDate()}
          </Text>
          <Text style={styles.dateMonth}>
            {new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}
          </Text>
        </View>
      </View>

      <Text style={styles.dateDescription}>{item.description}</Text>

      <View style={styles.dateDetails}>
        <View style={styles.dateDetailItem}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>
            {new Date(item.date).toLocaleDateString()}
            {item.endDate && ` - ${new Date(item.endDate).toLocaleDateString()}`}
          </Text>
        </View>
        {item.location && (
          <View style={styles.dateDetailItem}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}
        <View style={styles.dateDetailItem}>
          <Text style={styles.detailIcon}>🎓</Text>
          <Text style={styles.detailText}>{item.affectedGrades.join(', ')}</Text>
        </View>
        {item.contactPerson && (
          <View style={styles.dateDetailItem}>
            <Text style={styles.detailIcon}>👤</Text>
            <Text style={styles.detailText}>{item.contactPerson}</Text>
          </View>
        )}
      </View>

      {!item.reminderSet && (
        <TouchableOpacity style={styles.reminderButton}>
          <Text style={styles.reminderButtonText}>Set Reminder</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderResourceItem = ({ item }: { item: EducationalResource }) => (
    <View style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceInfo}>
          <Text style={styles.resourceTitle}>{item.title}</Text>
          <Text style={styles.resourceCategory}>{item.category.replace('-', ' ').toUpperCase()}</Text>
        </View>
        <View style={styles.resourceRating}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
          <Text style={styles.reviewText}>({item.reviewCount})</Text>
        </View>
      </View>

      <Text style={styles.resourceDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.resourceMeta}>
        <View style={styles.resourceTags}>
          <View style={styles.gradeTag}>
            <Text style={styles.gradeTagText}>{item.grade}</Text>
          </View>
          <View style={styles.subjectTag}>
            <Text style={styles.subjectTagText}>{item.subject}</Text>
          </View>
          {item.isFeatured && (
            <View style={styles.featuredTag}>
              <Text style={styles.featuredTagText}>FEATURED</Text>
            </View>
          )}
        </View>
        <View style={styles.resourceProvider}>
          <Text style={styles.providerText}>by {item.providedBy}</Text>
          {item.cost && (
            <Text style={styles.costText}>₹{item.cost}</Text>
          )}
        </View>
      </View>

      <View style={styles.resourceTags}>
        {item.tags.map((tag, index) => (
          <View key={index} style={styles.resourceTag}>
            <Text style={styles.resourceTagText}>#{tag}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.resourceButton}
        onPress={() => handleResourceOpen(item)}
      >
        <Text style={styles.resourceButtonText}>
          {item.resourceType === 'free' ? 'Access Free' : 
           item.resourceType === 'download' ? 'Download' : 
           item.resourceType === 'subscription' ? 'Subscribe' : 'View'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderNewsItem = ({ item }: { item: NewsAnnouncement }) => (
    <TouchableOpacity
      style={[styles.newsCard, !item.isRead && styles.unreadNews, item.isPinned && styles.pinnedNews]}
      onPress={() => {
        setSelectedItem(item);
        setShowDetailModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.newsHeader}>
        <View style={styles.newsInfo}>
          <Text style={styles.newsTitle}>{item.title}</Text>
          <Text style={styles.newsAuthor}>by {item.author}</Text>
        </View>
        <View style={styles.newsMeta}>
          {item.isPinned && <Text style={styles.pinnedIcon}>📌</Text>}
          <View style={[styles.priorityBadge, styles[`priority${item.priority}`]]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.newsContent} numberOfLines={3}>
        {item.content}
      </Text>

      <View style={styles.newsFooter}>
        <Text style={styles.newsCategory}>{item.category.toUpperCase()}</Text>
        <Text style={styles.newsDate}>
          {new Date(item.publishedDate).toLocaleDateString()}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const renderEmergencyItem = ({ item }: { item: EmergencyProtocol }) => (
    <TouchableOpacity
      style={styles.emergencyCard}
      onPress={() => {
        setSelectedItem(item);
        setShowDetailModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.emergencyHeader}>
        <View style={styles.emergencyInfo}>
          <Text style={styles.emergencyTitle}>{item.title}</Text>
          <Text style={styles.emergencyType}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={[styles.priorityBadge, styles[`priority${item.priority}`]]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.emergencyDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.emergencyContacts}>
        <Text style={styles.contactsTitle}>Emergency Contacts:</Text>
        {item.emergencyContacts.slice(0, 2).map((contact, index) => (
          <TouchableOpacity
            key={index}
            style={styles.emergencyContactItem}
            onPress={() => handleEmergencyCall(contact)}
          >
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'policies':
        return (
          <FlatList
            data={policies}
            renderItem={renderPolicyItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            windowSize={10}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={100}
          />
        );

      case 'calendar':
        return (
          <FlatList
            data={importantDates}
            renderItem={renderDateItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
            windowSize={10}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={100}
          />
        );

      case 'news':
        return (
          <FlatList
            data={news}
            renderItem={renderNewsItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            windowSize={10}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={100}
          />
        );

      case 'emergency':
        return (
          <FlatList
            data={emergencyProtocols}
            renderItem={renderEmergencyItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            windowSize={10}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={100}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.Background }]}>
      <StatusBar backgroundColor={theme.Surface} barStyle="dark-content" />

      {/* Header */}
      <Appbar.Header elevated style={{ backgroundColor: theme.Surface }}>
        <Appbar.BackAction onPress={() => onNavigate('back')} />
        <Appbar.Content
          title="Information Hub"
          subtitle="Centralized resources and school information"
        />
        <Appbar.Action icon="bell" onPress={() => {}} />
      </Appbar.Header>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search information..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={LightTheme.OnSurfaceVariant}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTabButton('news', 'News', '📰')}
          {renderTabButton('policies', 'Policies', '📋')}
          {renderTabButton('calendar', 'Calendar', '📅')}
          {renderTabButton('resources', 'Resources', '📚')}
          {renderTabButton('emergency', 'Emergency', '🚨')}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedItem.title || selectedItem.name}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setShowDetailModal(false)}
                    style={styles.modalClose}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalDescription}>
                    {selectedItem.description || selectedItem.content}
                  </Text>

                  {selectedItem.procedures && (
                    <View style={styles.proceduresContainer}>
                      <Text style={styles.proceduresTitle}>Procedures:</Text>
                      {selectedItem.procedures.map((procedure: string, index: number) => (
                        <Text key={index} style={styles.procedureItem}>
                          {index + 1}. {procedure}
                        </Text>
                      ))}
                    </View>
                  )}

                  {selectedItem.emergencyContacts && (
                    <View style={styles.contactsContainer}>
                      <Text style={styles.contactsTitle}>Emergency Contacts:</Text>
                      {selectedItem.emergencyContacts.map((contact: EmergencyContact, index: number) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.modalContactItem}
                          onPress={() => handleEmergencyCall(contact)}
                        >
                          <Text style={styles.modalContactName}>{contact.name}</Text>
                          <Text style={styles.modalContactRole}>{contact.role}</Text>
                          <Text style={styles.modalContactPhone}>{contact.phoneNumber}</Text>
                          <Text style={styles.modalContactAvailability}>{contact.availability}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Snackbar for notifications */}
      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={{ backgroundColor: theme.Surface }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
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

  // Search Styles
  searchContainer: {
    backgroundColor: '#FFFFFF',
    margin: Spacing.MD,
    borderRadius: BorderRadius.LG,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.MD,
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurface,
  },
  searchIcon: {
    fontSize: 18,
    color: LightTheme.OnSurfaceVariant,
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
    minWidth: 90,
  },
  tabButtonActive: {
    backgroundColor: '#EDE9FE',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: Spacing.XS,
  },
  tabText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
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

  // Policy Styles
  policyCard: {
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
  importantPolicy: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  policyInfo: {
    flex: 1,
  },
  policyTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  policyCategory: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  policyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importantBadge: {
    fontSize: 16,
    marginLeft: Spacing.SM,
  },
  acknowledgmentBadge: {
    fontSize: 16,
    marginLeft: Spacing.SM,
  },
  acknowledgedBadge: {
    fontSize: 16,
    marginLeft: Spacing.SM,
  },
  policyDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  policyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  policyVersion: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  policyDate: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  acknowledgeButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  acknowledgeButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Date Styles
  dateCard: {
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
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  dateInfo: {
    flex: 1,
  },
  dateTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  dateType: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  dateDisplay: {
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    minWidth: 60,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  dateMonth: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: '#7C3AED',
  },
  dateDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  dateDetails: {
    marginBottom: Spacing.MD,
  },
  dateDetailItem: {
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
  reminderButton: {
    borderWidth: 1,
    borderColor: '#7C3AED',
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  reminderButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: '#7C3AED',
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
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  resourceCategory: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
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
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  resourceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gradeTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  gradeTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSurface,
  },
  subjectTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  subjectTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSurface,
  },
  featuredTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  featuredTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  resourceProvider: {
    alignItems: 'flex-end',
  },
  providerText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  costText: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: '#7C3AED',
  },
  resourceTag: {
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  resourceTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  resourceButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    marginTop: Spacing.SM,
  },
  resourceButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // News Styles
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginVertical: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    position: 'relative',
  },
  unreadNews: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  pinnedNews: {
    backgroundColor: '#FFFBF0',
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  newsInfo: {
    flex: 1,
  },
  newsTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  newsAuthor: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedIcon: {
    fontSize: 16,
    marginRight: Spacing.SM,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  prioritylow: {
    backgroundColor: '#D1FAE5',
  },
  prioritymedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityhigh: {
    backgroundColor: '#FED7AA',
  },
  priorityurgent: {
    backgroundColor: '#FEE2E2',
  },
  prioritycritical: {
    backgroundColor: '#FEE2E2',
  },
  priorityText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  newsContent: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsCategory: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    backgroundColor: '#EDE9FE',
    color: '#7C3AED',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  newsDate: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  unreadIndicator: {
    position: 'absolute',
    top: Spacing.MD,
    right: Spacing.MD,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },

  // Emergency Styles
  emergencyCard: {
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
    borderLeftColor: '#EF4444',
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  emergencyType: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  emergencyDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  emergencyContacts: {
    backgroundColor: '#FEF2F2',
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
  },
  contactsTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  emergencyContactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  contactName: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  contactPhone: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: '#7C3AED',
    fontWeight: '600',
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
  modalDescription: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.LG,
  },
  proceduresContainer: {
    backgroundColor: LightTheme.SurfaceVariant,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
  },
  proceduresTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  procedureItem: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  contactsContainer: {
    backgroundColor: '#FEF2F2',
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
  },
  modalContactItem: {
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  modalContactName: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  modalContactRole: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  modalContactPhone: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: '#7C3AED',
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  modalContactAvailability: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
});

export default InformationHubScreen;