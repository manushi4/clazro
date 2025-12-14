/**
 * ParticipantList - Optimized participant management list component
 * Phase 11: Basic Participant Management
 * Uses FlatList for performance with many participants
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import CoachingButton from '../core/CoachingButton';
import { ParticipantCard, Participant } from './ParticipantCard';

interface ParticipantListProps {
  participants: Participant[];
  onToggleAudio: (id: string) => void;
  onToggleVideo: (id: string) => void;
  onToggleHandRaise: (id: string) => void;
  onRemoveParticipant?: (id: string) => void;
  isTeacherView?: boolean;
  maxHeight?: number;
  classStartTime?: Date;
  showAttendanceIndicators?: boolean;
}

type FilterType = 'all' | 'present' | 'hand-raised' | 'audio-on' | 'video-on';
type SortType = 'name' | 'join-time' | 'status';

const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  onToggleAudio,
  onToggleVideo,
  onToggleHandRaise,
  onRemoveParticipant,
  isTeacherView = true,
  maxHeight = 400,
  classStartTime,
  showAttendanceIndicators = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('name');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort participants
  const filteredAndSortedParticipants = useMemo(() => {
    let filtered = participants;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'present':
        filtered = filtered.filter(p => p.isPresent);
        break;
      case 'hand-raised':
        filtered = filtered.filter(p => p.handRaised);
        break;
      case 'audio-on':
        filtered = filtered.filter(p => p.audioEnabled);
        break;
      case 'video-on':
        filtered = filtered.filter(p => p.videoEnabled);
        break;
      // 'all' case - no additional filtering
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'join-time':
          return b.joinTime.getTime() - a.joinTime.getTime(); // Most recent first
        case 'status':
          // Sort by: hand raised > present > absent, then by name
          if (a.handRaised !== b.handRaised) return b.handRaised ? 1 : -1;
          if (a.isPresent !== b.isPresent) return b.isPresent ? 1 : -1;
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [participants, searchQuery, filterType, sortType]);

  const handleRemoveParticipant = (id: string) => {
    const participant = participants.find(p => p.id === id);
    if (!participant || !onRemoveParticipant) return;

    Alert.alert(
      'Remove Participant',
      `Are you sure you want to remove ${participant.name} from the class?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveParticipant(id),
        },
      ]
    );
  };

  const renderParticipant = ({ item }: { item: Participant }) => (
    <ParticipantCard
      participant={item}
      onToggleAudio={onToggleAudio}
      onToggleVideo={onToggleVideo}
      onToggleHandRaise={onToggleHandRaise}
      onRemove={isTeacherView ? handleRemoveParticipant : undefined}
      isTeacherView={isTeacherView}
      classStartTime={classStartTime}
      showAttendanceIndicator={showAttendanceIndicators}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          Participants ({filteredAndSortedParticipants.length})
        </Text>
        
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
          testID="toggle-filters"
        >
          <Text style={styles.filterIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersSection}>
          {/* Search Input */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search participants..."
            placeholderTextColor={LightTheme.OnSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />

          {/* Filter Buttons */}
          <View style={styles.filterButtons}>
            {[
              { key: 'all' as FilterType, label: 'All', icon: '👥' },
              { key: 'present' as FilterType, label: 'Present', icon: '✅' },
              { key: 'hand-raised' as FilterType, label: 'Hand Raised', icon: '✋' },
              { key: 'audio-on' as FilterType, label: 'Audio On', icon: '🎤' },
              { key: 'video-on' as FilterType, label: 'Video On', icon: '📹' },
            ].map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  filterType === filter.key && styles.activeFilterButton
                ]}
                onPress={() => setFilterType(filter.key)}
                testID={`filter-${filter.key}`}
              >
                <Text style={styles.filterButtonIcon}>{filter.icon}</Text>
                <Text style={[
                  styles.filterButtonText,
                  filterType === filter.key && styles.activeFilterButtonText
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort Options */}
          <View style={styles.sortSection}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <View style={styles.sortButtons}>
              {[
                { key: 'name' as SortType, label: 'Name' },
                { key: 'join-time' as SortType, label: 'Join Time' },
                { key: 'status' as SortType, label: 'Status' },
              ].map(sort => (
                <TouchableOpacity
                  key={sort.key}
                  style={[
                    styles.sortButton,
                    sortType === sort.key && styles.activeSortButton
                  ]}
                  onPress={() => setSortType(sort.key)}
                  testID={`sort-${sort.key}`}
                >
                  <Text style={[
                    styles.sortButtonText,
                    sortType === sort.key && styles.activeSortButtonText
                  ]}>
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No participants found' : 'No participants yet'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery 
          ? `No participants match "${searchQuery}"`
          : 'Participants will appear here when they join the class'
        }
      </Text>
      {searchQuery && (
        <CoachingButton
          title="Clear Search"
          variant="text"
          size="small"
          onPress={() => setSearchQuery('')}
          style={styles.clearButton}
        />
      )}
    </View>
  );

  const renderListFooter = () => (
    <View style={styles.listFooter}>
      <Text style={styles.footerText}>
        {filteredAndSortedParticipants.length === participants.length
          ? `All ${participants.length} participants shown`
          : `${filteredAndSortedParticipants.length} of ${participants.length} participants shown`
        }
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { maxHeight }]} testID="participant-list">
      {renderHeader()}
      
      {filteredAndSortedParticipants.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredAndSortedParticipants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={renderListFooter}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 120, // Approximate height of ParticipantCard
            offset: 120 * index,
            index,
          })}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    paddingHorizontal: Spacing.MD,
    paddingTop: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.MD,
  },
  title: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  filterToggle: {
    padding: Spacing.SM,
    borderRadius: BorderRadius.SM,
    backgroundColor: LightTheme.SurfaceVariant,
  },
  filterIcon: {
    fontSize: 16,
  },
  filtersSection: {
    paddingBottom: Spacing.MD,
  },
  searchInput: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
    marginBottom: Spacing.MD,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    backgroundColor: LightTheme.Surface,
  },
  activeFilterButton: {
    backgroundColor: LightTheme.primaryContainer,
    borderColor: LightTheme.Primary,
  },
  filterButtonIcon: {
    fontSize: 12,
    marginRight: Spacing.XS,
  },
  filterButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
  },
  activeFilterButtonText: {
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '500',
  },
  sortSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  sortLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.SM,
    flex: 1,
  },
  sortButton: {
    flex: 1,
    paddingVertical: Spacing.XS,
    paddingHorizontal: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    alignItems: 'center',
  },
  activeSortButton: {
    backgroundColor: LightTheme.secondaryContainer,
    borderColor: LightTheme.Secondary,
  },
  sortButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
  },
  activeSortButtonText: {
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.MD,
  },
  listFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.MD,
  },
  footerText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.XXL,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.MD,
  },
  emptyTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    lineHeight: Typography.bodyMedium.lineHeight,
    marginBottom: Spacing.LG,
  },
  clearButton: {
    minWidth: 120,
  },
});

export default ParticipantList;