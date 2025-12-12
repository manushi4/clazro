/**
 * MediaLibrary - Comprehensive File Management Component
 * Phase 21: Media Integration System
 * Provides file organization, search, filtering, and management capabilities
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Share,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { MediaFile } from './MediaUploader';
import FilePreview from './FilePreview';

export interface MediaLibraryProps {
  files: MediaFile[];
  onFileSelect?: (file: MediaFile) => void;
  onFileDelete?: (fileId: string) => void;
  onFileRename?: (fileId: string, newName: string) => void;
  onFileShare?: (file: MediaFile) => void;
  onFilesRefresh?: () => Promise<void>;
  enableMultiSelect?: boolean;
  enableBulkActions?: boolean;
  enableFilePreview?: boolean;
  sortOptions?: string[];
  filterOptions?: string[];
  viewMode?: 'grid' | 'list';
}

interface FileFilter {
  type?: string;
  dateRange?: { start: Date; end: Date };
  sizeRange?: { min: number; max: number };
  uploadStatus?: MediaFile['uploadStatus'];
}

type SortOption = 'name' | 'date' | 'size' | 'type';
type ViewMode = 'grid' | 'list';

const FILE_TYPE_CATEGORIES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  videos: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
  audio: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg'],
  code: ['text/plain', 'application/json', 'text/html', 'text/css'],
};

const FILE_ICONS = {
  'application/pdf': 'picture_as_pdf',
  'application/msword': 'description',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'description',
  'video/mp4': 'video_file',
  'video/mov': 'video_file',
  'video/avi': 'video_file',
  'audio/mp3': 'audio_file',
  'audio/wav': 'audio_file',
  'audio/aac': 'audio_file',
  'text/plain': 'text_snippet',
  'application/json': 'data_object',
  default: 'insert_drive_file',
};

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  files,
  onFileSelect,
  onFileDelete,
  onFileRename,
  onFileShare,
  onFilesRefresh,
  enableMultiSelect = true,
  enableBulkActions = true,
  enableFilePreview = true,
  sortOptions = ['name', 'date', 'size', 'type'],
  filterOptions = ['all', 'images', 'documents', 'videos', 'audio'],
  viewMode: initialViewMode = 'grid',
}) => {
  const { theme } = useTheme();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentSort, setCurrentSort] = useState<SortOption>('date');
  const [currentFilter, setCurrentFilter] = useState<FileFilter>({});
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<MediaFile | null>(null);
  const [selectedFileForRename, setSelectedFileForRename] = useState<MediaFile | null>(null);
  const [renameText, setRenameText] = useState('');

  // Filter and search files
  const filteredFiles = useMemo(() => {
    let result = files;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(file =>
        file.name.toLowerCase().includes(query) ||
        file.type.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (currentFilter.type && currentFilter.type !== 'all') {
      const typeCategory = FILE_TYPE_CATEGORIES[currentFilter.type as keyof typeof FILE_TYPE_CATEGORIES];
      if (typeCategory) {
        result = result.filter(file => typeCategory.includes(file.type));
      }
    }

    // Apply size filter
    if (currentFilter.sizeRange) {
      result = result.filter(file =>
        file.size >= currentFilter.sizeRange!.min && file.size <= currentFilter.sizeRange!.max
      );
    }

    // Apply upload status filter
    if (currentFilter.uploadStatus) {
      result = result.filter(file => file.uploadStatus === currentFilter.uploadStatus);
    }

    // Apply date filter
    if (currentFilter.dateRange) {
      result = result.filter(file => {
        const fileDate = new Date(file.id.split('_')[1] ? parseInt(file.id.split('_')[1]) : Date.now());
        return fileDate >= currentFilter.dateRange!.start && fileDate <= currentFilter.dateRange!.end;
      });
    }

    return result;
  }, [files, searchQuery, currentFilter]);

  // Sort files
  const sortedFiles = useMemo(() => {
    const sorted = [...filteredFiles];
    
    switch (currentSort) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date':
        sorted.sort((a, b) => {
          const aTime = parseInt(a.id.split('_')[1]) || 0;
          const bTime = parseInt(b.id.split('_')[1]) || 0;
          return bTime - aTime; // Newest first
        });
        break;
      case 'size':
        sorted.sort((a, b) => b.size - a.size); // Largest first
        break;
      case 'type':
        sorted.sort((a, b) => a.type.localeCompare(b.type));
        break;
      default:
        break;
    }

    return sorted;
  }, [filteredFiles, currentSort]);

  // Calculate library statistics
  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const typeStats = Object.keys(FILE_TYPE_CATEGORIES).reduce((acc, category) => {
      const categoryTypes = FILE_TYPE_CATEGORIES[category as keyof typeof FILE_TYPE_CATEGORIES];
      const count = files.filter(file => categoryTypes.includes(file.type)).length;
      acc[category] = count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFiles: files.length,
      totalSize,
      typeStats,
      completedUploads: files.filter(f => f.uploadStatus === 'completed').length,
      failedUploads: files.filter(f => f.uploadStatus === 'error').length,
    };
  }, [files]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    return FILE_ICONS[mimeType as keyof typeof FILE_ICONS] || FILE_ICONS.default;
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: MediaFile) => {
    if (enableMultiSelect) {
      setSelectedFiles(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(file.id)) {
          newSelection.delete(file.id);
        } else {
          newSelection.add(file.id);
        }
        return newSelection;
      });
    }
    onFileSelect?.(file);
  }, [enableMultiSelect, onFileSelect]);

  // Handle file long press (context menu)
  const handleFileLongPress = useCallback((file: MediaFile) => {
    Alert.alert(
      file.name,
      'Choose an action',
      [
        { text: 'Select', onPress: () => handleFileSelect(file) },
        enableFilePreview && { text: 'Preview', onPress: () => setSelectedFileForPreview(file) },
        { text: 'Rename', onPress: () => {
          setSelectedFileForRename(file);
          setRenameText(file.name);
        }},
        { text: 'Share', onPress: () => handleFileShare(file) },
        { text: 'Delete', style: 'destructive', onPress: () => handleFileDelete(file.id) },
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any
    );
  }, [handleFileSelect, enableFilePreview]);

  // Handle file share
  const handleFileShare = useCallback(async (file: MediaFile) => {
    try {
      await Share.share({
        url: file.uri,
        title: file.name,
        message: `Sharing ${file.name}`,
      });
      onFileShare?.(file);
    } catch (error) {
      Alert.alert('Share Error', 'Failed to share file');
    }
  }, [onFileShare]);

  // Handle file delete
  const handleFileDelete = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onFileDelete?.(fileId)
        },
      ]
    );
  }, [files, onFileDelete]);

  // Handle file rename
  const handleFileRename = useCallback(() => {
    if (selectedFileForRename && renameText.trim()) {
      onFileRename?.(selectedFileForRename.id, renameText.trim());
      setSelectedFileForRename(null);
      setRenameText('');
    }
  }, [selectedFileForRename, renameText, onFileRename]);

  // Handle bulk actions
  const handleBulkDelete = useCallback(() => {
    Alert.alert(
      'Delete Files',
      `Delete ${selectedFiles.size} selected files?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedFiles.forEach(fileId => onFileDelete?.(fileId));
            setSelectedFiles(new Set());
          },
        },
      ]
    );
  }, [selectedFiles, onFileDelete]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (onFilesRefresh) {
      setRefreshing(true);
      try {
        await onFilesRefresh();
      } catch (error) {
        Alert.alert('Refresh Error', 'Failed to refresh files');
      } finally {
        setRefreshing(false);
      }
    }
  }, [onFilesRefresh]);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },

    header: {
      backgroundColor: theme.SurfaceVariant,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.OutlineVariant,
    },

    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
      marginBottom: 12,
    },

    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },

    searchIcon: {
      color: theme.OnSurfaceVariant,
      marginRight: 8,
    },

    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.OnBackground,
    },

    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    controlsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    controlsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    controlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      gap: 4,
    },

    activeControlButton: {
      backgroundColor: theme.primaryContainer,
    },

    controlButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.OnBackground,
    },

    activeControlButtonText: {
      color: theme.OnPrimaryContainer,
    },

    stats: {
      backgroundColor: theme.background,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.OutlineVariant,
    },

    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },

    statsLabel: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
    },

    statsValue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnBackground,
    },

    content: {
      flex: 1,
      maxHeight: 400,
    },

    // Grid View Styles
    gridContainer: {
      padding: 8,
    },

    gridItem: {
      flex: 1,
      margin: 4,
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: theme.Outline,
      alignItems: 'center',
      maxWidth: '48%',
    },

    gridItemSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryContainer + '20',
    },

    gridIcon: {
      color: theme.OnBackground,
      marginBottom: 8,
    },

    gridFileName: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.OnBackground,
      textAlign: 'center',
      marginBottom: 4,
    },

    gridFileSize: {
      fontSize: 10,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },

    // List View Styles
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.OutlineVariant,
    },

    listItemSelected: {
      backgroundColor: theme.primaryContainer + '20',
    },

    listSelection: {
      marginRight: 12,
    },

    listIcon: {
      color: theme.OnBackground,
      marginRight: 12,
    },

    listFileInfo: {
      flex: 1,
    },

    listFileName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnBackground,
      marginBottom: 2,
    },

    listFileDetails: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
    },

    listActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    actionButton: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: theme.SurfaceVariant,
    },

    actionIcon: {
      color: theme.OnSurfaceVariant,
    },

    // Bulk Actions
    bulkActions: {
      backgroundColor: theme.primaryContainer,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    bulkActionsText: {
      fontSize: 14,
      color: theme.OnPrimaryContainer,
      fontWeight: '500',
    },

    bulkActionsButtons: {
      flexDirection: 'row',
      gap: 8,
    },

    bulkActionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.primary,
    },

    bulkActionButtonText: {
      fontSize: 12,
      color: theme.OnPrimary,
      fontWeight: '600',
    },

    // Empty State
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },

    emptyIcon: {
      color: theme.OnSurfaceVariant,
      marginBottom: 12,
    },

    emptyText: {
      fontSize: 16,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      marginBottom: 4,
    },

    emptySubtext: {
      fontSize: 13,
      color: theme.Outline,
      textAlign: 'center',
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContainer: {
      backgroundColor: theme.Surface,
      borderRadius: 16,
      padding: 20,
      maxWidth: '80%',
      width: 300,
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 16,
      textAlign: 'center',
    },

    modalInput: {
      borderWidth: 1,
      borderColor: theme.Outline,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: theme.OnSurface,
      marginBottom: 16,
    },

    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },

    modalButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },

    cancelButton: {
      backgroundColor: theme.SurfaceVariant,
    },

    confirmButton: {
      backgroundColor: theme.primary,
    },

    modalButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },

    cancelButtonText: {
      color: theme.OnSurfaceVariant,
    },

    confirmButtonText: {
      color: theme.OnPrimary,
    },
  });

  const styles = getStyles(theme);

  const renderGridItem = ({ item }: { item: MediaFile }) => {
    const isSelected = selectedFiles.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.gridItem,
          isSelected && styles.gridItemSelected,
        ]}
        onPress={() => handleFileSelect(item)}
        onLongPress={() => handleFileLongPress(item)}
      >
        <Icon
          name={getFileIcon(item.type)}
          size={32}
          style={styles.gridIcon}
        />
        <Text
          style={styles.gridFileName}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text style={styles.gridFileSize}>
          {formatFileSize(item.size)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: MediaFile }) => {
    const isSelected = selectedFiles.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.listItem,
          isSelected && styles.listItemSelected,
        ]}
        onPress={() => handleFileSelect(item)}
        onLongPress={() => handleFileLongPress(item)}
      >
        {enableMultiSelect && (
          <TouchableOpacity
            style={styles.listSelection}
            onPress={() => handleFileSelect(item)}
          >
            <Icon
              name={isSelected ? 'check-box' : 'check-box-outline-blank'}
              size={20}
              color={isSelected ? theme.primary : theme.OnSurfaceVariant}
            />
          </TouchableOpacity>
        )}

        <Icon
          name={getFileIcon(item.type)}
          size={24}
          style={styles.listIcon}
        />

        <View style={styles.listFileInfo}>
          <Text style={styles.listFileName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.listFileDetails}>
            {formatFileSize(item.size)} • {item.type.split('/')[1]?.toUpperCase()} • {item.uploadStatus}
          </Text>
        </View>

        <View style={styles.listActions}>
          {enableFilePreview && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setSelectedFileForPreview(item)}
              accessibilityLabel="Preview file"
            >
              <Icon name="visibility" size={16} style={styles.actionIcon} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleFileShare(item)}
            accessibilityLabel="Share file"
          >
            <Icon name="share" size={16} style={styles.actionIcon} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Media Library</Text>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search files..."
              placeholderTextColor={theme.OnSurfaceVariant}
            />
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <View style={styles.controlsLeft}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  viewMode === 'grid' && styles.activeControlButton,
                ]}
                onPress={() => setViewMode('grid')}
              >
                <Icon
                  name="grid-view"
                  size={16}
                  color={viewMode === 'grid' ? theme.OnPrimaryContainer : theme.OnBackground}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlButton,
                  viewMode === 'list' && styles.activeControlButton,
                ]}
                onPress={() => setViewMode('list')}
              >
                <Icon
                  name="list"
                  size={16}
                  color={viewMode === 'list' ? theme.OnPrimaryContainer : theme.OnBackground}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.controlsRight}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowSortModal(true)}
              >
                <Icon name="sort" size={16} color={theme.OnBackground} />
                <Text style={styles.controlButtonText}>Sort</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowFilterModal(true)}
              >
                <Icon name="filter-list" size={16} color={theme.OnBackground} />
                <Text style={styles.controlButtonText}>Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Files</Text>
            <Text style={styles.statsValue}>{stats.totalFiles}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Size</Text>
            <Text style={styles.statsValue}>{formatFileSize(stats.totalSize)}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Completed</Text>
            <Text style={styles.statsValue}>{stats.completedUploads}</Text>
          </View>
        </View>

        {/* Bulk Actions */}
        {enableBulkActions && selectedFiles.size > 0 && (
          <View style={styles.bulkActions}>
            <Text style={styles.bulkActionsText}>
              {selectedFiles.size} selected
            </Text>
            <View style={styles.bulkActionsButtons}>
              <TouchableOpacity
                style={styles.bulkActionButton}
                onPress={handleBulkDelete}
              >
                <Text style={styles.bulkActionButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bulkActionButton}
                onPress={() => setSelectedFiles(new Set())}
              >
                <Text style={styles.bulkActionButtonText}>Deselect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {sortedFiles.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="folder-open" size={48} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No files found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Upload some files to get started'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedFiles}
              keyExtractor={(item) => item.id}
              renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
              numColumns={viewMode === 'grid' ? 2 : 1}
              key={viewMode}
              contentContainerStyle={viewMode === 'grid' ? styles.gridContainer : undefined}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[theme.primary]}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      {/* File Preview Modal */}
      {selectedFileForPreview && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedFileForPreview(null)}
        >
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <FilePreview
              file={selectedFileForPreview}
              showControls={true}
              enableFullscreen={true}
              onClose={() => setSelectedFileForPreview(null)}
            />
          </View>
        </Modal>
      )}

      {/* Rename Modal */}
      {selectedFileForRename && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedFileForRename(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Rename File</Text>
              <TextInput
                style={styles.modalInput}
                value={renameText}
                onChangeText={setRenameText}
                placeholder="Enter new name..."
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setSelectedFileForRename(null)}
                >
                  <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleFileRename}
                >
                  <Text style={[styles.modalButtonText, styles.confirmButtonText]}>
                    Rename
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

export default MediaLibrary;