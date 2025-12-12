/**
 * ChildrenListScreen - PHASE 2: Children Management
 * Complete list/grid view of all children with search, filter, and full details
 *
 * Features:
 * - Grid/List view toggle
 * - Search by name
 * - Filter by status (active/inactive)
 * - Real-time data from Supabase
 * - Pull to refresh
 * - Navigate to child details
 * - Quick stats per child
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { IconButton, Searchbar, Menu, Chip as PaperChip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardHeader, CardContent, Badge, EmptyState } from '../../ui';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';
import { FilterDropdowns } from '../../components/common/FilterDropdowns';
import { useAuth } from '../../context/AuthContext';
import type { ParentStackParamList } from '../../types/navigation';
import { safeNavigate } from '../../utils/navigationService';
import { trackAction } from '../../utils/navigationAnalytics';
import { getParentChildren } from '../../services/api/parentApi';

type Props = NativeStackScreenProps<ParentStackParamList, 'ChildrenList'>;

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'active' | 'inactive';

interface Child {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
  phone: string;
  status: string;
  batch_id: string;
  enrollment_date: string;
  relationship_type?: string;
  is_primary_contact?: boolean;
  // Additional fields from student table
  grade?: string;
  class_name?: string;
  attendance_rate?: number;
  overall_grade?: number;
}

const ChildrenListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { user } = useAuth();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [menuVisible, setMenuVisible] = useState(false);

  const parentId = (user?.id && typeof user.id === 'string' && user.id !== 'undefined')
    ? user.id
    : '11111111-1111-1111-1111-111111111111';

  console.log('👨‍👩‍👧 [ChildrenList] Loading children for parent:', parentId);

  // ============================================
  // Fetch children data from Supabase
  // ============================================
  const {
    data: childrenData = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['parentChildren', parentId],
    queryFn: () => getParentChildren(parentId),
    enabled: !!parentId,
  });

  // ============================================
  // Filter and search logic
  // ============================================
  const filteredChildren = useMemo(() => {
    let filtered = childrenData;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(child => child.status === filterStatus);
    }

    // Search by name or student ID
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(child =>
        child.full_name?.toLowerCase().includes(query) ||
        child.student_id?.toLowerCase().includes(query) ||
        child.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [childrenData, filterStatus, searchQuery]);

  // Analytics tracking
  React.useEffect(() => {
    console.log('✅ [ChildrenList] Screen mounted, children count:', childrenData.length);
    trackAction('view_children_list', 'ChildrenList', {
      count: childrenData.length,
      viewMode,
      filterStatus
    });
  }, [childrenData.length, viewMode, filterStatus]);

  // ============================================
  // Event Handlers
  // ============================================
  const handleViewChild = (child: Child) => {
    console.log('👀 [ChildrenList] Viewing child:', child.full_name);
    trackAction('view_child_detail', 'ChildrenList', { childId: child.id });
    safeNavigate('ChildDetail', { childId: child.id });
  };

  const handleRefresh = async () => {
    console.log('🔄 [ChildrenList] Refreshing children data...');
    await refetch();
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    trackAction('toggle_view_mode', 'ChildrenList', { mode: newMode });
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setMenuVisible(false);
    trackAction('filter_children', 'ChildrenList', { status });
  };

  // ============================================
  // Render Child Card (Grid View)
  // ============================================
  const renderChildCard = ({ item: child }: { item: Child }) => (
    <Pressable
      key={child.id}
      style={styles.gridItem}
      onPress={() => handleViewChild(child)}
      android_ripple={{ color: Colors.primary + '1F' }}
    >
      <Card variant="elevated">
        <CardHeader
          icon="account-circle"
          iconColor={child.status === 'active' ? Colors.primary : Colors.disabled}
          title={child.full_name || 'Student'}
          subtitle={child.student_id || 'No ID'}
          trailing={
            <Badge variant={child.status === 'active' ? 'success' : 'default'}>
              {child.status?.toUpperCase() || 'N/A'}
            </Badge>
          }
        />
        <CardContent>
          {/* Quick Stats */}
          <Col gap="xs">
            {child.grade && (
              <Row spaceBetween>
                <T variant="caption" color="textSecondary">Grade:</T>
                <T variant="caption" weight="medium">{child.grade}</T>
              </Row>
            )}
            {child.class_name && (
              <Row spaceBetween>
                <T variant="caption" color="textSecondary">Class:</T>
                <T variant="caption" weight="medium">{child.class_name}</T>
              </Row>
            )}
            {child.enrollment_date && (
              <Row spaceBetween>
                <T variant="caption" color="textSecondary">Enrolled:</T>
                <T variant="caption" weight="medium">
                  {new Date(child.enrollment_date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short'
                  })}
                </T>
              </Row>
            )}
          </Col>

          {/* View Details Button */}
          <Row gap="xs" centerV style={{ marginTop: Spacing.sm }}>
            <IconButton
              icon="chevron-right"
              size={20}
              iconColor={Colors.primary}
              style={{ margin: 0 }}
            />
            <T variant="caption" color="primary" weight="medium">
              View Details
            </T>
          </Row>
        </CardContent>
      </Card>
    </Pressable>
  );

  // ============================================
  // Render Child Row (List View)
  // ============================================
  const renderChildRow = ({ item: child }: { item: Child }) => (
    <Pressable
      key={child.id}
      onPress={() => handleViewChild(child)}
      android_ripple={{ color: Colors.primary + '1F' }}
    >
      <Card variant="elevated" style={styles.listItem}>
        <CardContent>
          <Row spaceBetween centerV>
            {/* Left: Icon + Info */}
            <Row gap="base" centerV flex={1}>
              <IconButton
                icon="account-circle"
                size={40}
                iconColor={child.status === 'active' ? Colors.primary : Colors.disabled}
                style={{ margin: 0 }}
              />
              <Col flex={1}>
                <T variant="body" weight="semiBold" numberOfLines={1}>
                  {child.full_name || 'Student'}
                </T>
                <T variant="caption" color="textSecondary" numberOfLines={1}>
                  {child.student_id || 'No ID'} • {child.grade || 'Grade N/A'}
                </T>
              </Col>
            </Row>

            {/* Right: Status + Arrow */}
            <Row gap="sm" centerV>
              <Badge variant={child.status === 'active' ? 'success' : 'default'}>
                {child.status?.toUpperCase() || 'N/A'}
              </Badge>
              <IconButton
                icon="chevron-right"
                size={20}
                iconColor={Colors.textSecondary}
                style={{ margin: 0 }}
              />
            </Row>
          </Row>
        </CardContent>
      </Card>
    </Pressable>
  );

  // ============================================
  // Empty State
  // ============================================
  const renderEmpty = () => (
    <EmptyState
      icon="account-multiple-outline"
      title={searchQuery ? 'No Children Found' : 'No Children'}
      body={
        searchQuery
          ? `No children match "${searchQuery}". Try a different search term.`
          : 'No children found in your account. Contact school admin to add children.'
      }
    />
  );

  return (
    <BaseScreen
      scrollable={false}
      loading={isLoading}
      error={error}
      empty={filteredChildren.length === 0 && !searchQuery}
    >
      <Col flex={1}>
        {/* Header with Search and Actions */}
        <Col sx={{ p: 'md', pb: 'sm' }}>
          {/* Search Bar */}
          <Searchbar
            placeholder="Search by name or student ID..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={Colors.primary}
          />

          {/* Actions Row */}
          <Row spaceBetween centerV style={{ marginTop: Spacing.sm }}>
            {/* Filter Chips */}
        {/* Filters */}
        <FilterDropdowns
          filters={[
            {
              label: 'Status',
              value: filterStatus,
              options: [
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
              onChange: (value) => {
                setFilterStatus(value as FilterStatus);
                trackAction('filter_status', 'ChildrenList', { status: value });
              },
            },
          ]}
          activeFilters={[
            filterStatus !== 'all' && { label: filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1), variant: 'info' as const },
          ].filter(Boolean) as any}
          onClearAll={() => {
            setFilterStatus('all');
            trackAction('clear_filters', 'ChildrenList');
          }}
        />

            {/* View Mode Toggle */}
            <IconButton
              icon={viewMode === 'grid' ? 'view-list' : 'view-grid'}
              size={24}
              iconColor={Colors.primary}
              onPress={toggleViewMode}
              style={{ margin: 0 }}
            />
          </Row>

          {/* Results Count */}
          <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
            {filteredChildren.length} {filteredChildren.length === 1 ? 'child' : 'children'} found
          </T>
        </Col>

        {/* Children List/Grid */}
        <FlatList
          data={filteredChildren}
          renderItem={viewMode === 'grid' ? renderChildCard : renderChildRow}
          keyExtractor={item => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={searchQuery || filterStatus !== 'all' ? renderEmpty : null}
        />
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    elevation: 0,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
  },
  filterChip: {
    height: 32,
  },
  filterChipText: {
    fontSize: 12,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  gridItem: {
    flex: 1,
    margin: Spacing.xs,
    maxWidth: '48%',
  },
  listItem: {
    marginBottom: Spacing.sm,
  },
});

export default ChildrenListScreen;
