/**
 * NewStudyLibraryScreen - Pure Minimal Design
 * Purpose: Digital resource browser with search, filters, and AI assistant
 * Design: Clean, minimal cards with typography hierarchy - Apple/Notion-style
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { T, Button } from '../../ui';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ResourceViewerScreen from './ResourceViewerScreen';
import AddToPlaylistModal from './AddToPlaylistModal';
import PlaylistsView from './PlaylistsView';

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  type: 'PDF' | 'VIDEO' | 'DOC' | 'QUIZ';
  downloads: string;
  uploadedAt: string;
  duration?: string; // For videos
  description?: string; // Brief description
  isBookmarked: boolean;
  icon: string;
}

type FilterType = string;

export default function NewStudyLibraryScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewerResource, setViewerResource] = useState<any>(null);
  const [showView, setShowView] = useState<'materials' | 'playlists'>('materials');
  const [aiPopupVisible, setAiPopupVisible] = useState(true);
  const [addToPlaylistModal, setAddToPlaylistModal] = useState<{
    visible: boolean;
    materialId: string | null;
    materialTitle: string;
  }>({
    visible: false,
    materialId: null,
    materialTitle: '',
  });

  useEffect(() => {
    trackScreenView('NewStudyLibraryScreen');
  }, []);

  // Helper: Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  // Helper: Format downloads count
  const formatDownloads = (count: number): string => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  // Fetch study materials
  const { data: materials, isLoading, refetch } = useQuery({
    queryKey: ['study-materials', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user bookmarks
      const { data: bookmarks } = await supabase
        .from('user_bookmarks')
        .select('material_id')
        .eq('user_id', user.id);

      const bookmarkedIds = new Set(bookmarks?.map(b => b.material_id) || []);

      return (data || []).map((m) => {
        // Convert DB type to display format
        const displayType = (m.type || 'pdf').toUpperCase() === 'PRESENTATION' ? 'DOC' :
                           (m.type || 'pdf').toUpperCase();

        // Get icon for type
        const getIcon = (type: string) => {
          switch (type) {
            case 'PDF': return '📄';
            case 'VIDEO': return '📺';
            case 'DOC': return '📝';
            case 'QUIZ': return '❓';
            default: return '📄';
          }
        };

        // Use views_count as downloads
        const downloads = formatDownloads(m.views_count || 0);

        // Truncate description to 60 chars
        const desc = m.description || 'Study material for ' + (m.subject_code || 'general topics');
        const shortDesc = desc.length > 60 ? desc.substring(0, 60) + '...' : desc;

        return {
          id: m.id,
          title: m.title || 'Untitled',
          subject: m.subject_code || 'General',
          type: displayType as 'PDF' | 'VIDEO' | 'DOC' | 'QUIZ',
          downloads: downloads,
          uploadedAt: formatTimeAgo(m.created_at),
          duration: m.duration || undefined, // For videos
          description: shortDesc,
          isBookmarked: bookmarkedIds.has(m.id),
          icon: getIcon(displayType),
        } as StudyMaterial;
      });
    },
    enabled: !!user?.id,
  });

  const toggleBookmark = async (materialId: string) => {
    if (!user?.id) return;

    const material = materials?.find(m => m.id === materialId);
    if (!material) return;

    try {
      if (material.isBookmarked) {
        await supabase
          .from('user_bookmarks')
          .delete()
          .match({ user_id: user.id, material_id: materialId });
      } else {
        await supabase
          .from('user_bookmarks')
          .insert({ user_id: user.id, material_id: materialId });
      }

      trackAction('toggle_bookmark', 'NewStudyLibraryScreen', { materialId });
      refetch();
    } catch (error) {
      console.error('Failed to update bookmark:', error);
    }
  };

  // Apply filters and search
  const displayMaterials = useMemo(() => {
    let filtered = materials || [];

    // Apply filter
    if (selectedFilter === 'Favorites') {
      filtered = filtered.filter(m => m.isBookmarked);
    } else if (selectedFilter === 'New') {
      // Show materials from last 7 days
      filtered = filtered.filter(m => {
        return m.uploadedAt.includes('d ago') || m.uploadedAt === 'Today';
      });
    } else if (selectedFilter !== 'All') {
      // Filter by subject
      filtered = filtered.filter(m => m.subject === selectedFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.subject.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [materials, selectedFilter, searchQuery]);

  // Generate dynamic filters from materials data
  const filters = useMemo(() => {
    const baseFilters: FilterType[] = ['All', 'Favorites', 'New'];

    if (!materials || materials.length === 0) {
      return baseFilters;
    }

    // Extract unique subjects from materials
    const uniqueSubjects = Array.from(
      new Set(materials.map(m => m.subject).filter(Boolean))
    ).sort();

    return [...baseFilters, ...uniqueSubjects, 'Playlists'];
  }, [materials]);

  // If viewing a resource, show the viewer
  if (viewerResource) {
    return (
      <ResourceViewerScreen
        route={{ params: { resource: viewerResource } } as any}
        navigation={{
          ...navigation,
          goBack: () => setViewerResource(null)
        } as any}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7F8" />

      {/* Top Bar - Material Design Standard */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            trackAction('back', 'NewStudyLibraryScreen');
            navigation.goBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T variant="h2" style={styles.icon}>←</T>
        </TouchableOpacity>
        <T variant="title" weight="bold" style={styles.topBarTitle}>Study Library</T>
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
              trackAction('refresh_study_library', 'NewStudyLibraryScreen');
              refetch();
            }}
          />
        }
      >
        {/* Search Bar Section with Blue Gradient */}
        <View style={styles.searchSection}>
          <View style={styles.searchCard}>
            <T variant="h3" style={styles.searchIcon}>🔍</T>
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes, videos, articles..."
              placeholderTextColor="#888888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Course Roadmap CTA */}
        <TouchableOpacity
          style={styles.roadmapCard}
          onPress={() => {
            trackAction('open_course_roadmap', 'NewStudyLibraryScreen');
            navigation.navigate('CourseRoadmapScreen');
          }}
          accessibilityRole="button"
          accessibilityLabel="Open course roadmap"
        >
          <View style={{ flex: 1 }}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Course roadmap
            </T>
            <T variant="caption" color="textSecondary">
              See your syllabus by subject and track chapters.
            </T>
          </View>
          <Button variant="primary" onPress={() => navigation.navigate('CourseRoadmapScreen')}>
            View
          </Button>
        </TouchableOpacity>

        {/* Temporary: Notes & Highlights entry point */}
        <TouchableOpacity
          style={styles.roadmapCard}
          onPress={() => {
            trackAction('open_notes_highlights', 'NewStudyLibraryScreen');
            navigation.navigate('NotesAndHighlightsScreen');
          }}
          accessibilityRole="button"
          accessibilityLabel="Open notes and highlights"
        >
          <View style={{ flex: 1 }}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Notes & highlights
            </T>
            <T variant="caption" color="textSecondary">
              Access saved notes, highlights, and doubt snippets.
            </T>
          </View>
          <Button variant="primary" onPress={() => navigation.navigate('NotesAndHighlightsScreen')}>
            Open
          </Button>
        </TouchableOpacity>

        {/* Assignments CTA */}
        <TouchableOpacity
          style={styles.roadmapCard}
          onPress={() => {
            trackAction('open_assignments_home', 'NewStudyLibraryScreen');
            navigation.navigate('AssignmentsHomeScreen');
          }}
          accessibilityRole="button"
          accessibilityLabel="Open assignments"
        >
          <View style={{ flex: 1 }}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Assignments
            </T>
            <T variant="caption" color="textSecondary">
              View all homework, quizzes, and projects with filters.
            </T>
          </View>
          <Button variant="primary" onPress={() => navigation.navigate('AssignmentsHomeScreen')}>
            Open
          </Button>
        </TouchableOpacity>

        {/* Downloads Manager CTA */}
        <TouchableOpacity
          style={styles.roadmapCard}
          onPress={() => {
            trackAction('open_downloads_manager', 'NewStudyLibraryScreen');
            navigation.navigate('DownloadsManagerScreen');
          }}
          accessibilityRole="button"
          accessibilityLabel="Open downloads manager"
        >
          <View style={{ flex: 1 }}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Downloads
            </T>
            <T variant="caption" color="textSecondary">
              Manage offline content and storage.
            </T>
          </View>
          <Button variant="primary" onPress={() => navigation.navigate('DownloadsManagerScreen')}>
            Open
          </Button>
        </TouchableOpacity>

        {/* Task Hub CTA */}
        <TouchableOpacity
          style={styles.roadmapCard}
          onPress={() => {
            trackAction('open_task_hub', 'NewStudyLibraryScreen');
            navigation.navigate('TaskHubScreen');
          }}
          accessibilityRole="button"
          accessibilityLabel="Open task hub"
        >
          <View style={{ flex: 1 }}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Task Hub
            </T>
            <T variant="caption" color="textSecondary">
              All your assignments, tests and AI tasks in one place.
            </T>
          </View>
          <Button variant="primary" onPress={() => navigation.navigate('TaskHubScreen')}>
            Open
          </Button>
        </TouchableOpacity>

        {/* Guided Study Session CTA */}
        <TouchableOpacity
          style={styles.roadmapCard}
          onPress={() => {
            trackAction('start_study_session', 'NewStudyLibraryScreen');
            navigation.navigate('GuidedStudySessionScreen', {
              topic: 'Algebra – Linear equations',
              mode: 'focus',
              duration: 25,
              fromPlan: 'Algebra this week'
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Start guided study session"
        >
          <View style={{ flex: 1 }}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Guided Study Session
            </T>
            <T variant="caption" color="textSecondary">
              Start a focused 25-minute study session with timer.
            </T>
          </View>
          <Button variant="primary" onPress={() => navigation.navigate('GuidedStudySessionScreen', {
            topic: 'Algebra – Linear equations',
            mode: 'focus',
            duration: 25
          })}>
            Start
          </Button>
        </TouchableOpacity>

        {/* Global Analytics CTA */}
        <TouchableOpacity
          style={styles.roadmapCard}
          onPress={() => {
            trackAction('view_analytics', 'NewStudyLibraryScreen');
            navigation.navigate('GlobalAnalyticsScreen');
          }}
          accessibilityRole="button"
          accessibilityLabel="View overall analytics"
        >
          <View style={{ flex: 1 }}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Overall Analytics
            </T>
            <T variant="caption" color="textSecondary">
              Track your progress across all subjects and habits.
            </T>
          </View>
          <Button variant="primary" onPress={() => navigation.navigate('GlobalAnalyticsScreen')}>
            View
          </Button>
        </TouchableOpacity>

        {/* Leaderboard CTA */}
        <TouchableOpacity
          style={styles.roadmapCard}
          onPress={() => {
            trackAction('view_leaderboard', 'NewStudyLibraryScreen');
            navigation.navigate('LeaderboardScreen');
          }}
          accessibilityRole="button"
          accessibilityLabel="View leaderboard"
        >
          <View style={{ flex: 1 }}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Leaderboard
            </T>
            <T variant="caption" color="textSecondary">
              See your ranking by XP in class, school, and globally.
            </T>
          </View>
          <Button variant="primary" onPress={() => navigation.navigate('LeaderboardScreen')}>
            View
          </Button>
        </TouchableOpacity>

        {/* Quests CTA */}
        <TouchableOpacity
          style={styles.roadmapCard}
          onPress={() => {
            trackAction('view_quests', 'NewStudyLibraryScreen');
            navigation.navigate('QuestsScreen');
          }}
          accessibilityRole="button"
          accessibilityLabel="View quests"
        >
          <View style={{ flex: 1 }}>
            <T variant="subtitle" weight="bold" style={{ marginBottom: Spacing.xs }}>
              Quests
            </T>
            <T variant="caption" color="textSecondary">
              Complete daily and weekly challenges to earn XP.
            </T>
          </View>
          <Button variant="primary" onPress={() => navigation.navigate('QuestsScreen')}>
            View
          </Button>
        </TouchableOpacity>

        {/* AI Assistant Card (Floating) - Dismissible */}
        {aiPopupVisible && (
          <View style={styles.aiContainer}>
            <View style={styles.aiCard}>
              <TouchableOpacity
                style={styles.aiCloseButton}
                onPress={() => setAiPopupVisible(false)}
                accessibilityLabel="Close AI assistant"
              >
                <T variant="body" style={styles.aiCloseIcon}>×</T>
              </TouchableOpacity>
              <View style={styles.aiCardContent}>
                <View style={styles.aiCardLeft}>
                  <T variant="caption" style={styles.aiLabel}>AI Study Assistant</T>
                  <T variant="body" weight="bold" style={styles.aiTitle}>
                    Need help understanding a concept?
                  </T>
                  <TouchableOpacity
                    style={styles.askAiButton}
                    onPress={() => {
                      trackAction('open_ai_assistant', 'NewStudyLibraryScreen');
                    }}
                  >
                    <T variant="caption" weight="bold" style={styles.askAiButtonText}>Ask AI</T>
                  </TouchableOpacity>
                </View>
                <View style={styles.aiCardRight}>
                  <T variant="display" style={styles.aiIcon}>🤖</T>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
              onPress={() => {
                if (filter === 'Playlists') {
                  setShowView('playlists');
                  setSelectedFilter('All');
                } else {
                  setShowView('materials');
                  setSelectedFilter(filter);
                }
                trackAction('select_filter', 'NewStudyLibraryScreen', { filter });
              }}
            >
              <T
                variant="caption"
                weight="medium"
                style={selectedFilter === filter ? styles.filterChipTextActive : styles.filterChipTextInactive}
              >
                {filter}
              </T>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Resources Header */}
        <View style={styles.resourcesHeader}>
          <T variant="body" weight="bold" style={styles.resourcesCount}>
            {displayMaterials.length} Resources
          </T>
          <View style={styles.viewToggle}>
            <TouchableOpacity onPress={() => setViewMode('grid')}>
              <T variant="h3" style={viewMode === 'grid' ? styles.viewIconActive : styles.viewIconInactive}>
                ⊞
              </T>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setViewMode('list')}>
              <T variant="h3" style={viewMode === 'list' ? styles.viewIconActive : styles.viewIconInactive}>
                ☰
              </T>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resource Cards Grid - PURE MINIMAL DESIGN */}
        {showView === 'materials' && (
        <View style={styles.resourceGrid}>
          {displayMaterials.map((material) => (
            <TouchableOpacity
              key={material.id}
              style={[
                styles.resourceCard,
                viewMode === 'list' ? styles.resourceCardList : styles.resourceCardGrid
              ]}
              onPress={async () => {
                trackAction('open_resource', 'NewStudyLibraryScreen', {
                  materialId: material.id,
                  type: material.type
                });

                // Fetch full material details with file_url
                const { data: fullMaterial, error } = await supabase
                  .from('study_materials')
                  .select('*')
                  .eq('id', material.id)
                  .single();

                if (error || !fullMaterial) {
                  Alert.alert('Error', 'Failed to load resource details');
                  return;
                }

                const hasFileUrl = fullMaterial.file_url && fullMaterial.file_url.trim() !== '';

                if (hasFileUrl) {
                  // Show resource viewer as modal
                  setViewerResource({
                    id: material.id,
                    title: material.title,
                    type: material.type,
                    fileUrl: fullMaterial.file_url,
                    subject: material.subject,
                  });
                } else {
                  // Show info dialog if no file URL
                  Alert.alert(
                    material.title,
                    `Type: ${material.type}\nSubject: ${material.subject}\nUploaded: ${material.uploadedAt}\nDownloads: ${material.downloads}\n\n${fullMaterial.description || 'No description available'}\n\nFile not yet uploaded to this resource.`,
                    [
                      { text: 'OK', style: 'cancel' }
                    ]
                  );
                }
              }}
              activeOpacity={0.7}
            >
              {/* CARD CONTENT */}
              <View style={styles.cardContent}>
                {/* Title */}
                <T variant="body" weight="bold" style={styles.cardTitle} numberOfLines={2}>
                  {material.title}
                </T>

                {/* Subject */}
                <T variant="caption" style={styles.cardSubject} numberOfLines={1}>
                  {material.subject}
                </T>

                {/* Description */}
                <T variant="caption" style={styles.cardDescription} numberOfLines={1}>
                  {material.description || 'Revision worksheet'}
                </T>

                {/* Tag Pill */}
                <View style={styles.tagContainer}>
                  <View style={styles.tagPill}>
                    <T variant="caption" style={styles.tagText}>
                      Tag: {material.subject}
                    </T>
                  </View>
                </View>

                {/* Thin Divider */}
                <View style={styles.thinDivider} />

                {/* Metadata */}
                <T variant="caption" style={styles.metadata}>
                  {material.type} • {material.uploadedAt} • {material.downloads} downloads
                </T>

                {/* Action Buttons Row */}
                <View style={styles.actionsRow}>
                  {/* Add to Library */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setAddToPlaylistModal({
                        visible: true,
                        materialId: material.id,
                        materialTitle: material.title
                      });
                      trackAction('open_add_to_playlist', 'NewStudyLibraryScreen', { materialId: material.id });
                    }}
                    style={styles.textButton}
                    accessibilityLabel="Add to library"
                  >
                    <T variant="caption" style={styles.textButtonLabel}>+ Add to Library</T>
                  </TouchableOpacity>

                  {/* Favorite */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleBookmark(material.id);
                    }}
                    style={styles.textButton}
                    accessibilityLabel="Toggle favorite"
                  >
                    <T variant="caption" style={[styles.textButtonLabel, material.isBookmarked && styles.textButtonActive]}>
                      {material.isBookmarked ? '★' : '☆'} Fav
                    </T>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        )}

        {/* Playlists View */}
        {showView === 'playlists' && (
          <PlaylistsView />
        )}
      </ScrollView>

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        visible={addToPlaylistModal.visible}
        materialId={addToPlaylistModal.materialId}
        materialTitle={addToPlaylistModal.materialTitle}
        onClose={() => setAddToPlaylistModal({ visible: false, materialId: null, materialTitle: '' })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  scrollView: {
    flex: 1,
  },
  // Top Bar - Material Design Standard
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: '#F6F7F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    color: '#333333',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  // Search Section with Blue Gradient
  searchSection: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
  roadmapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  // AI Assistant Card (Floating)
  aiContainer: {
    paddingHorizontal: 16,
    marginTop: -40,
    marginBottom: 16,
  },
  aiCard: {
    backgroundColor: '#EAF2FD',
    borderRadius: 12,
    padding: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  aiCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 10,
  },
  aiCloseIcon: {
    fontSize: 24,
    color: '#6B7280',
    lineHeight: 24,
  },
  roadmapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  aiCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiCardLeft: {
    flex: 2,
  },
  aiLabel: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  aiTitle: {
    fontSize: 16,
    color: '#333333',
  },
  askAiButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 9,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  askAiButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  aiCardRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIcon: {
    fontSize: 60,
    opacity: 0.3,
    color: '#4A90E2',
  },
  // Filter Chips
  filtersScroll: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#4A90E2',
  },
  filterChipTextActive: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  filterChipTextInactive: {
    fontSize: 14,
    color: '#333333',
  },
  // Resources Header
  resourcesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  resourcesCount: {
    fontSize: 18,
    color: '#333333',
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewIconActive: {
    fontSize: 24,
    color: '#4A90E2',
  },
  viewIconInactive: {
    fontSize: 24,
    color: '#CCCCCC',
  },
  // PURE MINIMAL CARD STYLES
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  resourceCardGrid: {
    width: '48%',
    marginHorizontal: 0,
  },
  resourceCardList: {
    width: '96%',
    alignSelf: 'center',
    marginHorizontal: 0,
    marginVertical: 4,
  },
  cardContent: {
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubject: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  tagContainer: {
    marginBottom: 8,
  },
  tagPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 11,
    color: '#6B7280',
  },
  thinDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  metadata: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  textButtonLabel: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '500',
  },
  textButtonActive: {
    color: '#F59E0B',
  },

});
