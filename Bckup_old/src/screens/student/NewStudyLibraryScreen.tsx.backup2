/**
 * NewStudyLibraryScreen - EXACT match to HTML reference
 * Purpose: Digital resource browser with search, filters, and AI assistant
 * Design: Material Design top bar, search, AI card, filter chips, 2-column resource grid
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
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import HamburgerMenu from './HamburgerMenu';
import ResourceViewerScreen from './ResourceViewerScreen';

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  type: 'PDF' | 'VIDEO' | 'DOC' | 'QUIZ';
  file_size: string;
  tags: string[];
  rating: number;
  views: string;
  isBookmarked: boolean;
  iconColor: string;
  iconBgColor: string;
  icon: string;
  tagColor: string;
}

type FilterType = string;

export default function NewStudyLibraryScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewerResource, setViewerResource] = useState<any>(null);

  useEffect(() => {
    trackScreenView('NewStudyLibraryScreen');
  }, []);

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
        const typeConfig = getTypeConfig(displayType);

        // Format views count
        const formatViews = (count: number) => {
          if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
          return count.toString();
        };

        return {
          id: m.id,
          title: m.title || 'Untitled',
          subject: m.subject_code || 'General',
          type: displayType as 'PDF' | 'VIDEO' | 'DOC' | 'QUIZ',
          file_size: m.file_size || '1.2 MB',
          tags: m.tags || [m.subject_code || 'General'],
          rating: parseFloat(m.rating) || 4.5,
          views: formatViews(m.views_count || 0),
          isBookmarked: bookmarkedIds.has(m.id),
          ...typeConfig,
        } as StudyMaterial;
      });
    },
    enabled: !!user?.id,
  });

  // Fetch student profile data for HamburgerMenu
  const { data: studentData } = useQuery({
    queryKey: ['student-profile-menu', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('students')
        .select('name, grade, section, student_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching student profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const getTypeConfig = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return {
          icon: '📄',
          iconColor: '#EF4444',
          iconBgColor: '#FEE2E2',
          tagColor: '#10B981',
        };
      case 'VIDEO':
        return {
          icon: '📺',
          iconColor: '#3B82F6',
          iconBgColor: '#DBEAFE',
          tagColor: '#F59E0B',
        };
      case 'DOC':
        return {
          icon: '📝',
          iconColor: '#6366F1',
          iconBgColor: '#E0E7FF',
          tagColor: '#8B5CF6',
        };
      case 'QUIZ':
        return {
          icon: '❓',
          iconColor: '#10B981',
          iconBgColor: '#D1FAE5',
          tagColor: '#14B8A6',
        };
      default:
        return {
          icon: '📄',
          iconColor: '#EF4444',
          iconBgColor: '#FEE2E2',
          tagColor: '#10B981',
        };
    }
  };

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
        // Assuming new materials don't have this logic in DB yet
        return true; // Keep all for now
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
        m.subject.toLowerCase().includes(query) ||
        m.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [materials, selectedFilter, searchQuery]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<T key={`full-${i}`} variant="caption" style={styles.starFilled}>⭐</T>);
    }

    if (hasHalfStar) {
      stars.push(<T key="half" variant="caption" style={styles.starHalf}>⭐</T>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<T key={`empty-${i}`} variant="caption" style={styles.starEmpty}>☆</T>);
    }

    return stars;
  };

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

    return [...baseFilters, ...uniqueSubjects];
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

      {/* Hamburger Menu */}
      <HamburgerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        currentRoute="NewStudyLibraryScreen"
        studentData={studentData || undefined}
      />

      {/* Top Bar - Material Design Standard */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            trackAction('open_menu', 'NewStudyLibraryScreen');
            setMenuVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <T variant="h2" style={styles.icon}>☰</T>
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

        {/* AI Assistant Card (Floating) */}
        <View style={styles.aiContainer}>
          <View style={styles.aiCard}>
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
                setSelectedFilter(filter);
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

        {/* Resource Cards Grid */}
        <View style={styles.resourceGrid}>
          {displayMaterials.map((material) => (
            <TouchableOpacity
              key={material.id}
              style={styles.resourceCard}
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
                    `Type: ${material.type}\nSubject: ${material.subject}\nSize: ${material.file_size}\nRating: ${material.rating}⭐\nViews: ${material.views}\n\n${fullMaterial.description || 'No description available'}\n\nFile not yet uploaded to this resource.`,
                    [
                      { text: 'OK', style: 'cancel' }
                    ]
                  );
                }
              }}
              activeOpacity={0.7}
            >
              {/* Icon Section */}
              <View style={[styles.resourceIconContainer, { backgroundColor: material.iconBgColor }]}>
                <T style={{ ...styles.resourceIcon, color: material.iconColor }}>
                  {material.icon}
                </T>
              </View>

              {/* Content Section */}
              <View style={styles.resourceContent}>
                {/* Title and Bookmark */}
                <View style={styles.resourceTitleRow}>
                  <T variant="caption" weight="bold" style={styles.resourceTitle} numberOfLines={2}>
                    {material.title}
                  </T>
                  <TouchableOpacity
                    onPress={() => toggleBookmark(material.id)}
                    style={styles.bookmarkButton}
                  >
                    <T variant="body" style={styles.bookmarkIcon}>
                      {material.isBookmarked ? '🔖' : '🔗'}
                    </T>
                  </TouchableOpacity>
                </View>

                {/* Type Badge and File Size */}
                <View style={styles.resourceMeta}>
                  <View style={[styles.typeBadge, { backgroundColor: material.iconColor }]}>
                    <T variant="caption" weight="bold" style={styles.typeBadgeText}>
                      {material.type}
                    </T>
                  </View>
                  <T variant="caption" style={styles.fileSize}>{material.file_size}</T>
                </View>

                {/* Subject Tags */}
                <View style={styles.tagsRow}>
                  {material.tags.slice(0, 2).map((tag, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tag,
                        {
                          backgroundColor:
                            material.tagColor === '#10B981' ? '#D1FAE5' :
                            material.tagColor === '#F59E0B' ? '#FEF3C7' :
                            material.tagColor === '#8B5CF6' ? '#EDE9FE' :
                            '#CCFBF1',
                        },
                      ]}
                    >
                      <T variant="caption" style={{ ...styles.tagText, color: material.tagColor }}>
                        {tag}
                      </T>
                    </View>
                  ))}
                </View>

                {/* Rating and Views */}
                <View style={styles.ratingRow}>
                  <View style={styles.starsContainer}>
                    {renderStars(material.rating)}
                  </View>
                  <T variant="caption" style={styles.views}>{material.views}</T>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
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
  // Resource Cards Grid
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 16,

  },
  resourceCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  resourceIconContainer: {
    height: 96,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceIcon: {
    fontSize: 48,
  },
  resourceContent: {

  },
  resourceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resourceTitle: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
    marginRight: 4,
  },
  bookmarkButton: {
    padding: 2,
  },
  bookmarkIcon: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  fileSize: {
    fontSize: 12,
    color: '#888888',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',

  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  tagText: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starFilled: {
    fontSize: 16,
    color: '#FFD700',
  },
  starHalf: {
    fontSize: 16,
    color: '#FFD700',
  },
  starEmpty: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  views: {
    fontSize: 12,
    color: '#888888',
  },
});
