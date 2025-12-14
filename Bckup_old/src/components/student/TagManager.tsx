import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface ManagedTag {
  id: string;
  name: string;
  category: 'concept' | 'difficulty' | 'skill' | 'topic' | 'keyword' | 'custom';
  color: string;
  confidence: number;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  description?: string;
}

export interface TagFilter {
  category?: string;
  searchQuery?: string;
  showInactive?: boolean;
  sortBy: 'name' | 'usage' | 'recent' | 'confidence';
  sortOrder: 'asc' | 'desc';
}

interface TagManagerProps {
  tags: ManagedTag[];
  selectedTags: string[];
  onTagsUpdate: (tags: ManagedTag[]) => void;
  onSelectedTagsChange: (tagIds: string[]) => void;
  maxSelectable?: number;
  allowCustomTags?: boolean;
  showUsageStats?: boolean;
}

const DEFAULT_CATEGORIES = [
  { value: 'concept', label: 'Concept', color: '#2196F3' },
  { value: 'difficulty', label: 'Difficulty', color: '#FF9800' },
  { value: 'skill', label: 'Skill', color: '#9C27B0' },
  { value: 'topic', label: 'Topic', color: '#4CAF50' },
  { value: 'keyword', label: 'Keyword', color: '#607D8B' },
  { value: 'custom', label: 'Custom', color: '#795548' },
];

export default function TagManager({
  tags,
  selectedTags,
  onTagsUpdate,
  onSelectedTagsChange,
  maxSelectable = 10,
  allowCustomTags = true,
  showUsageStats = true,
}: TagManagerProps) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<TagFilter>({
    sortBy: 'usage',
    sortOrder: 'desc',
    showInactive: false,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<ManagedTag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('custom');
  const [newTagDescription, setNewTagDescription] = useState('');

  const filteredAndSortedTags = useCallback(() => {
    let filtered = tags.filter(tag => {
      if (!filter.showInactive && !tag.isActive) return false;
      if (filter.category && tag.category !== filter.category) return false;
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        return tag.name.toLowerCase().includes(query) ||
               tag.description?.toLowerCase().includes(query);
      }
      return true;
    });

    return filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (filter.sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'usage':
          compareValue = b.usageCount - a.usageCount;
          break;
        case 'recent':
          compareValue = (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0);
          break;
        case 'confidence':
          compareValue = b.confidence - a.confidence;
          break;
      }
      
      return filter.sortOrder === 'desc' ? compareValue : -compareValue;
    });
  }, [tags, filter]);

  const handleTagSelect = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onSelectedTagsChange(selectedTags.filter(id => id !== tagId));
    } else if (selectedTags.length < maxSelectable) {
      onSelectedTagsChange([...selectedTags, tagId]);
      // Update usage count
      const updatedTags = tags.map(tag => 
        tag.id === tagId 
          ? { ...tag, usageCount: tag.usageCount + 1, lastUsed: new Date() }
          : tag
      );
      onTagsUpdate(updatedTags);
    } else {
      Alert.alert('Maximum Tags', `You can select up to ${maxSelectable} tags.`);
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      Alert.alert('error', 'Tag name is required.');
      return;
    }

    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === newTagName.trim().toLowerCase()
    );
    
    if (existingTag) {
      Alert.alert('error', 'A tag with this name already exists.');
      return;
    }

    const categoryColor = DEFAULT_CATEGORIES.find(cat => 
      cat.value === newTagCategory
    )?.color || theme.primary;

    const newTag: ManagedTag = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      category: newTagCategory as ManagedTag['category'],
      color: categoryColor,
      confidence: 1.0,
      usageCount: 0,
      isActive: true,
      createdAt: new Date(),
      description: newTagDescription.trim() || undefined,
    };

    onTagsUpdate([...tags, newTag]);
    setNewTagName('');
    setNewTagCategory('custom');
    setNewTagDescription('');
    setModalVisible(false);
  };

  const handleEditTag = (tag: ManagedTag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagCategory(tag.category);
    setNewTagDescription(tag.description || '');
    setModalVisible(true);
  };

  const handleUpdateTag = () => {
    if (!editingTag || !newTagName.trim()) return;

    const updatedTags = tags.map(tag => 
      tag.id === editingTag.id
        ? {
            ...tag,
            name: newTagName.trim(),
            category: newTagCategory as ManagedTag['category'],
            description: newTagDescription.trim() || undefined,
          }
        : tag
    );

    onTagsUpdate(updatedTags);
    setEditingTag(null);
    setNewTagName('');
    setNewTagCategory('custom');
    setNewTagDescription('');
    setModalVisible(false);
  };

  const handleToggleTagStatus = (tagId: string) => {
    const updatedTags = tags.map(tag => 
      tag.id === tagId ? { ...tag, isActive: !tag.isActive } : tag
    );
    onTagsUpdate(updatedTags);
  };

  const handleDeleteTag = (tagId: string) => {
    Alert.alert(
      'Delete Tag',
      'Are you sure you want to delete this tag? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onTagsUpdate(tags.filter(tag => tag.id !== tagId));
            onSelectedTagsChange(selectedTags.filter(id => id !== tagId));
          },
        },
      ]
    );
  };

  const getCategoryInfo = (category: string) => {
    return DEFAULT_CATEGORIES.find(cat => cat.value === category) || 
           { value: 'custom', label: 'Custom', color: theme.primary };
  };

  const renderTagItem = ({ item: tag }: { item: ManagedTag }) => {
    const isSelected = selectedTags.includes(tag.id);
    const categoryInfo = getCategoryInfo(tag.category);
    
    return (
      <View style={[styles.tagItem, { backgroundColor: theme.Surface }]}>
        <TouchableOpacity
          style={styles.tagContent}
          onPress={() => handleTagSelect(tag.id)}
          accessibilityRole="button"
          accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} tag ${tag.name}`}
        >
          <View style={styles.tagInfo}>
            <View style={styles.tagHeader}>
              <Text
                style={[
                  styles.tagName,
                  {
                    color: isSelected ? categoryInfo.color : theme.OnSurface,
                    fontWeight: isSelected ? 'bold' : '500',
                  }
                ]}
              >
                {tag.name}
              </Text>
              <View style={styles.tagBadges}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryInfo.color }
                  ]}
                >
                  <Text style={[styles.categoryText, { color: theme.OnPrimary }]}>
                    {categoryInfo.label}
                  </Text>
                </View>
                {!tag.isActive && (
                  <View style={[styles.inactiveBadge, { backgroundColor: theme.errorContainer }]}>
                    <Text style={[styles.inactiveText, { color: theme.OnErrorContainer }]}>
                      Inactive
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {tag.description && (
              <Text style={[styles.tagDescription, { color: theme.OnSurfaceVariant }]}>
                {tag.description}
              </Text>
            )}
            
            {showUsageStats && (
              <View style={styles.tagStats}>
                <Text style={[styles.statText, { color: theme.OnSurfaceVariant }]}>
                  Used {tag.usageCount} times
                </Text>
                {tag.lastUsed && (
                  <Text style={[styles.statText, { color: theme.OnSurfaceVariant }]}>
                    • Last used {tag.lastUsed.toLocaleDateString()}
                  </Text>
                )}
                <Text style={[styles.statText, { color: theme.OnSurfaceVariant }]}>
                  • {Math.round(tag.confidence * 100)}% confidence
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <View style={styles.tagActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditTag(tag)}
            accessibilityRole="button"
            accessibilityLabel={`Edit tag ${tag.name}`}
          >
            <Text style={[styles.actionText, { color: theme.primary }]}>Edit</Text>
          </TouchableOpacity>
          
          <Switch
            value={tag.isActive}
            onValueChange={() => handleToggleTagStatus(tag.id)}
            thumbColor={tag.isActive ? theme.primary : theme.Outline}
            trackColor={{
              false: theme.SurfaceVariant,
              true: theme.primaryContainer,
            }}
          />
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteTag(tag.id)}
            accessibilityRole="button"
            accessibilityLabel={`Delete tag ${tag.name}`}
          >
            <Text style={[styles.actionText, { color: theme.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFilterControls = () => (
    <View style={[styles.filterContainer, { backgroundColor: theme.Surface }]}>
      <View style={styles.filterRow}>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: theme.SurfaceVariant, color: theme.OnSurface }
          ]}
          placeholder="Search tags..."
          placeholderTextColor={theme.OnSurfaceVariant}
          value={filter.searchQuery || ''}
          onChangeText={(text) => setFilter(prev => ({ ...prev, searchQuery: text }))}
        />
        
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.primaryContainer }]}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Add new tag"
        >
          <Text style={[styles.filterButtonText, { color: theme.OnPrimaryContainer }]}>
            + Add Tag
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        <TouchableOpacity
          style={[
            styles.categoryFilterButton,
            {
              backgroundColor: !filter.category ? theme.primary : theme.Surface,
            }
          ]}
          onPress={() => setFilter(prev => ({ ...prev, category: undefined }))}
        >
          <Text
            style={[
              styles.categoryFilterText,
              {
                color: !filter.category ? theme.OnPrimary : theme.OnSurface,
              }
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        {DEFAULT_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryFilterButton,
              {
                backgroundColor: filter.category === category.value 
                  ? category.color 
                  : theme.Surface,
              }
            ]}
            onPress={() => setFilter(prev => ({ 
              ...prev, 
              category: prev.category === category.value ? undefined : category.value 
            }))}
          >
            <Text
              style={[
                styles.categoryFilterText,
                {
                  color: filter.category === category.value 
                    ? theme.OnPrimary 
                    : theme.OnSurface,
                }
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.sortContainer}>
        <Text style={[styles.sortLabel, { color: theme.OnSurfaceVariant }]}>
          Sort by:
        </Text>
        {['usage', 'name', 'recent', 'confidence'].map(sortType => (
          <TouchableOpacity
            key={sortType}
            style={[
              styles.sortButton,
              {
                backgroundColor: filter.sortBy === sortType 
                  ? theme.primary 
                  : theme.Surface,
              }
            ]}
            onPress={() => setFilter(prev => ({ 
              ...prev, 
              sortBy: sortType as TagFilter['sortBy'],
              sortOrder: prev.sortBy === sortType && prev.sortOrder === 'desc' ? 'asc' : 'desc'
            }))}
          >
            <Text
              style={[
                styles.sortButtonText,
                {
                  color: filter.sortBy === sortType 
                    ? theme.OnPrimary 
                    : theme.OnSurface,
                }
              ]}
            >
              {sortType.charAt(0).toUpperCase() + sortType.slice(1)}
              {filter.sortBy === sortType && (filter.sortOrder === 'desc' ? ' ↓' : ' ↑')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.OnSurface }]}>
          Tag Manager
        </Text>
        <Text style={[styles.subtitle, { color: theme.OnSurfaceVariant }]}>
          {selectedTags.length} of {maxSelectable} tags selected
        </Text>
      </View>

      {renderFilterControls()}

      <FlatList
        data={filteredAndSortedTags()}
        renderItem={renderTagItem}
        keyExtractor={(item) => item.id}
        style={styles.tagList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.OnSurfaceVariant }]}>
              No tags found matching your criteria
            </Text>
          </View>
        }
      />

      {/* Create/Edit Tag Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </Text>
            
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: theme.Surface, color: theme.OnSurface }
              ]}
              placeholder="Tag name"
              placeholderTextColor={theme.OnSurfaceVariant}
              value={newTagName}
              onChangeText={setNewTagName}
            />
            
            <View style={styles.categorySelector}>
              <Text style={[styles.inputLabel, { color: theme.OnSurfaceVariant }]}>
                Category:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {DEFAULT_CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categorySelectorButton,
                      {
                        backgroundColor: newTagCategory === category.value 
                          ? category.color 
                          : theme.Surface,
                      }
                    ]}
                    onPress={() => setNewTagCategory(category.value)}
                  >
                    <Text
                      style={[
                        styles.categorySelectorText,
                        {
                          color: newTagCategory === category.value 
                            ? theme.OnPrimary 
                            : theme.OnSurface,
                        }
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <TextInput
              style={[
                styles.modalInput,
                styles.descriptionInput,
                { backgroundColor: theme.Surface, color: theme.OnSurface }
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.OnSurfaceVariant}
              value={newTagDescription}
              onChangeText={setNewTagDescription}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.Surface }]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingTag(null);
                  setNewTagName('');
                  setNewTagCategory('custom');
                  setNewTagDescription('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.OnSurface }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={editingTag ? handleUpdateTag : handleCreateTag}
              >
                <Text style={[styles.modalButtonText, { color: theme.OnPrimary }]}>
                  {editingTag ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  filterContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryFilter: {
    marginBottom: 12,
  },
  categoryFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagList: {
    flex: 1,
  },
  tagItem: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tagContent: {
    flex: 1,
  },
  tagInfo: {
    flex: 1,
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagName: {
    fontSize: 16,
    flex: 1,
  },
  tagBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tagDescription: {
    fontSize: 14,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  tagStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statText: {
    fontSize: 12,
    marginRight: 8,
  },
  tagActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 16,
    marginBottom: 12,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  categorySelectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  categorySelectorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});