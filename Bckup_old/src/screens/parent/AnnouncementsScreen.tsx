/**
 * AnnouncementsScreen
 * Display all school announcements with filtering and search
 *
 * Features:
 * - Real-time announcements from Supabase
 * - Filter by category (5 types: Academic, Events, Urgent, General, Holiday)
 * - Filter by importance (All, Important Only)
 * - Search by title/message
 * - Show active/expired status
 * - Priority-based color coding
 * - Pull to refresh
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { FilterDropdowns } from '../../components/common/FilterDropdowns';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<ParentStackParamList, 'Announcements'>;

type CategoryType = 'all' | 'Academic' | 'Events' | 'Urgent' | 'General' | 'Holiday';
type ImportanceFilter = 'all' | 'important';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Announcement {
  id: string;
  title: string;
  message: string;
  category: Exclude<CategoryType, 'all'>;
  priority: Priority;
  is_important: boolean;
  published_by: string | null;
  published_at: string;
  expires_at: string | null;
  action_url: string | null;
  attachment_url: string | null;
  created_at: string;
}

const AnnouncementsScreen: React.FC<Props> = () => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [importanceFilter, setImportanceFilter] = useState<ImportanceFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Track screen view
  useEffect(() => {
    trackScreenView('Announcements', { from: 'Dashboard' });
  }, []);

  // Fetch announcements
  const {
    data: announcements = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      console.log('🔍 [Announcements] Fetching announcements...');
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('❌ [Announcements] Error:', error);
        throw error;
      }

      console.log('✅ [Announcements] Loaded', data?.length || 0, 'announcements');
      return data as Announcement[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (announcements change infrequently)
  });

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    let filtered = announcements;

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }

    // Filter by importance
    if (importanceFilter === 'important') {
      filtered = filtered.filter(a => a.is_important);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.title.toLowerCase().includes(query) ||
          a.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [announcements, categoryFilter, importanceFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = announcements.length;
    const important = announcements.filter(a => a.is_important).length;
    const active = announcements.filter(
      a => !a.expires_at || new Date(a.expires_at) > new Date()
    ).length;
    const expired = total - active;

    return { total, important, active, expired };
  }, [announcements]);

  // Get priority color
  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'urgent':
        return Colors.error;
      case 'high':
        return Colors.warning;
      case 'medium':
        return Colors.primary;
      case 'low':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: Exclude<CategoryType, 'all'>): string => {
    switch (category) {
      case 'Academic':
        return '📚';
      case 'Events':
        return '🎉';
      case 'Urgent':
        return '🚨';
      case 'General':
        return '📢';
      case 'Holiday':
        return '🎊';
      default:
        return '📢';
    }
  };

  // Format time ago
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Check if announcement is active
  const isActive = (announcement: Announcement): boolean => {
    if (!announcement.expires_at) return true;
    return new Date(announcement.expires_at) > new Date();
  };

  // Handle announcement tap
  const handleAnnouncementTap = (announcement: Announcement) => {
    trackAction('tap_announcement', 'Announcements', {
      category: announcement.category,
      priority: announcement.priority,
      is_important: announcement.is_important,
    });

    // TODO: Navigate to announcement detail or open action_url if present
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load announcements' : null}
      empty={!isLoading && announcements.length === 0}
      emptyBody="No announcements yet. You'll see important updates and news from the school here."
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Header & Stats Card */}
        <Card variant="elevated">
          <CardContent>
            <Row spaceBetween centerV style={{ marginBottom: Spacing.sm }}>
              <T variant="title" weight="bold">
                School Announcements
              </T>
              {stats.important > 0 && (
                <Badge variant="error" label={`${stats.important} important`} />
              )}
            </Row>

            {/* Stats Summary */}
            <Row spaceBetween style={{ marginTop: Spacing.md }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.primary }}>
                  {stats.total}
                </T>
                <T variant="caption" color="textSecondary">Total</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.error }}>
                  {stats.important}
                </T>
                <T variant="caption" color="textSecondary">Important</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.success }}>
                  {stats.active}
                </T>
                <T variant="caption" color="textSecondary">Active</T>
              </View>

              {stats.expired > 0 && (
                <View style={styles.statBox}>
                  <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.textSecondary }}>
                    {stats.expired}
                  </T>
                  <T variant="caption" color="textSecondary">Expired</T>
                </View>
              )}
            </Row>
          </CardContent>
        </Card>

        {/* Search Input */}
        <Card variant="outlined">
          <CardContent>
            <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
              Search announcements
            </T>
            <View style={styles.searchContainer}>
              <T variant="body">🔍</T>
              <TextInput
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  trackAction('search_announcements', 'Announcements', { query: text });
                }}
                placeholder="Search by title or content..."
                style={styles.searchInput}
                placeholderTextColor={Colors.textTertiary}
              />
              {searchQuery && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <T variant="body">✖️</T>
                </Pressable>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Filters Card */}
        <Card variant="outlined">
          <CardContent>
            <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
              Filters
            </T>
            <FilterDropdowns
          filters={[
              {
                label: 'Category',
                value: categoryFilter,
                options: [
                { value: 'all', label: 'All' },
                { value: 'Academic', label: '📚 Academic' },
                { value: 'Events', label: '🎉 Events' },
                { value: 'Urgent', label: '⚠️ Urgent' },
                { value: 'General', label: '📢 General' },
                { value: 'Holiday', label: '🏖️ Holiday' },
                ],
                onChange: (value) => {
                  trackAction('filter_category', 'Announcements', { category: value });
                  setCategoryFilter(value as CategoryFilter);
                },
              },
              {
                label: 'Importance',
                value: importanceFilter,
                options: [
                { value: 'all', label: 'All' },
                { value: 'important', label: 'Important Only' },
                ],
                onChange: (value) => {
                  trackAction('filter_importance', 'Announcements', { importance: value });
                  setImportanceFilter(value as ImportanceFilter);
                },
              }
          ]}
          activeFilters={[
              categoryFilter !== 'all' && {
                label: categoryFilter,
                variant: 'info' as const
              },
              importanceFilter !== 'all' && {
                label: importanceFilter === 'important' ? 'Important' : '',
                variant: 'error' as const
              },
          ].filter(Boolean) as any}
          onClearAll={() => {
              setCategoryFilter('all');
              setImportanceFilter('all');
              trackAction('clear_filters', 'Announcements');
          }}
        />
          </CardContent>
        </Card>

        {/* Announcements List */}
        <Col gap="sm">
          {filteredAnnouncements.map(announcement => {
            const active = isActive(announcement);
            const cardStyle = announcement.is_important
              ? styles.importantCard
              : !active
              ? styles.expiredCard
              : {};
            return (
              <Card
                key={announcement.id}
                variant="elevated"
                onPress={() => handleAnnouncementTap(announcement)}
                style={cardStyle}
              >
                  <CardContent>
                    {/* Header Row */}
                    <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                      <Row centerV style={{ gap: Spacing.xs }}>
                        <T variant="body">{getCategoryIcon(announcement.category)}</T>
                        <T variant="caption" color="textSecondary">
                          {announcement.category}
                        </T>
                      </Row>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                        <View
                          style={[
                            styles.priorityIndicator,
                            { backgroundColor: getPriorityColor(announcement.priority) },
                          ]}
                        />
                        <T variant="caption" color="textSecondary">
                          {getTimeAgo(announcement.published_at)}
                        </T>
                      </View>
                    </Row>

                    {/* Title */}
                    <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
                      {announcement.title}
                    </T>

                    {/* Message */}
                    <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
                      {announcement.message}
                    </T>

                    {/* Footer Row */}
                    <Row spaceBetween centerV style={{ marginTop: Spacing.sm }}>
                      <Row centerV style={{ gap: Spacing.xs }}>
                        {announcement.is_important && (
                          <Badge variant="error" label="⭐ Important" />
                        )}
                        {!active && (
                          <Badge variant="default" label="Expired" />
                        )}
                      </Row>

                      {announcement.published_by && (
                        <T variant="caption" color="textSecondary">
                          By {announcement.published_by}
                        </T>
                      )}
                    </Row>
                  </CardContent>
              </Card>
            );
          })}
        </Col>

        {/* Empty State for Filters */}
        {filteredAnnouncements.length === 0 && announcements.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
                  No announcements match your filters
                </T>
                <Button
                  variant="outline"
                  onPress={() => {
                    setCategoryFilter('all');
                    setImportanceFilter('all');
                    setSearchQuery('');
                  }}
                  style={{ marginTop: Spacing.md }}
                >
                  Clear Filters
                </Button>
              </View>
            </CardContent>
          </Card>
        )}
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  importantCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  expiredCard: {
    opacity: 0.6,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    padding: Spacing.xs,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  modalOptionSelected: {
    backgroundColor: Colors.primaryLight || Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});

export default AnnouncementsScreen;
