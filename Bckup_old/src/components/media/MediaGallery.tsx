/**
 * Media Gallery Component
 * Grid view for media files with lazy loading and filtering
 * Phase 73: File Upload & Media Management
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme, PrimaryColors, SemanticColors } from '../../theme/colors';
import { storageService, FileMetadata, FileSearchFilters } from '../../services/storage/StorageService';
import { cdnService } from '../../services/storage/CDNService';
import FilePreview from './FilePreview';
import VideoPlayer from './VideoPlayer';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_SIZE = (screenWidth - 48) / 3; // 3 columns with margins

export interface MediaGalleryProps {
  bucket?: string;
  path?: string;
  fileTypes?: ('image' | 'video' | 'audio' | 'document')[];
  columns?: number;
  itemSize?: number;
  showSearch?: boolean;
  showFilter?: boolean;
  showUploadDate?: boolean;
  showFileSize?: boolean;
  enableSelection?: boolean;
  maxSelection?: number;
  onSelectionChange?: (selectedFiles: FileMetadata[]) => void;
  onFilePress?: (file: FileMetadata, index: number) => void;
  onFileLongPress?: (file: FileMetadata, index: number) => void;
  style?: any;
  emptyMessage?: string;
  refreshable?: boolean;
}

interface FilterOptions {
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  dateRange?: { from: Date; to: Date };
  sizeRange?: { min: number; max: number };
  fileTypes: string[];
  tags: string[];
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  bucket,
  path,
  fileTypes = ['image', 'video', 'audio', 'document'],
  columns = 3,
  itemSize = ITEM_SIZE,
  showSearch = true,
  showFilter = true,
  showUploadDate = false,
  showFileSize = false,
  enableSelection = false,
  maxSelection = 10,
  onSelectionChange,
  onFilePress,
  onFileLongPress,
  style,
  emptyMessage = 'No files found',
  refreshable = true,
}) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileMetadata[]>([]);
  const [currentFile, setCurrentFile] = useState<FileMetadata | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: 'date',
    sortOrder: 'desc',
    fileTypes: fileTypes.map(type => type),
    tags: [],
  });

  // Load files from storage
  const loadFiles = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const searchFilters: FileSearchFilters = {
        bucket,
        path,
        ...filterOptions.dateRange && {
          dateFrom: filterOptions.dateRange.from,
          dateTo: filterOptions.dateRange.to,
        },
        ...filterOptions.sizeRange && {
          sizeMin: filterOptions.sizeRange.min,
          sizeMax: filterOptions.sizeRange.max,
        },
      };

      const loadedFiles = await storageService.searchFiles(searchFilters);
      
      // Filter by file types
      const typeFilteredFiles = loadedFiles.filter(file => {
        const category = getFileCategory(file.mimeType);
        return fileTypes.includes(category as any);
      });

      setFiles(typeFilteredFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      Alert.alert('error', 'Failed to load files. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bucket, path, fileTypes, filterOptions]);

  // Get file category from MIME type
  const getFileCategory = useCallback((mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }, []);

  // Filter and sort files
  const processFiles = useCallback(() => {
    let processed = [...files];

    // Apply search query
    if (searchQuery.trim()) {
      processed = processed.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (file.tags && file.tags.some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    // Apply file type filter
    processed = processed.filter(file => {
      const category = getFileCategory(file.mimeType);
      return filterOptions.fileTypes.includes(category);
    });

    // Apply tag filter
    if (filterOptions.tags.length > 0) {
      processed = processed.filter(file =>
        file.tags && filterOptions.tags.some(tag => file.tags!.includes(tag))
      );
    }

    // Apply sorting
    processed.sort((a, b) => {
      let comparison = 0;

      switch (filterOptions.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.mimeType.localeCompare(b.mimeType);
          break;
      }

      return filterOptions.sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredFiles(processed);
  }, [files, searchQuery, filterOptions, getFileCategory]);

  // Load files on component mount and filter changes
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Process files when files or filters change
  useEffect(() => {
    processFiles();
  }, [processFiles]);

  // Handle file selection
  const handleFileSelection = useCallback((file: FileMetadata) => {
    if (!enableSelection) return;

    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      
      if (isSelected) {
        const updated = prev.filter(f => f.id !== file.id);
        onSelectionChange?.(updated);
        return updated;
      } else {
        if (prev.length >= maxSelection) {
          Alert.alert(
            'Selection Limit',
            `You can select a maximum of ${maxSelection} files.`
          );
          return prev;
        }
        
        const updated = [...prev, file];
        onSelectionChange?.(updated);
        return updated;
      }
    });
  }, [enableSelection, maxSelection, onSelectionChange]);

  // Handle file press
  const handleFilePress = useCallback((file: FileMetadata, index: number) => {
    if (enableSelection) {
      handleFileSelection(file);
    } else if (onFilePress) {
      onFilePress(file, index);
    } else {
      // Default behavior: show file viewer
      setCurrentFile(file);
      setCurrentFileIndex(index);
      setShowViewerModal(true);
    }
  }, [enableSelection, handleFileSelection, onFilePress]);

  // Handle file long press
  const handleFileLongPress = useCallback((file: FileMetadata, index: number) => {
    if (onFileLongPress) {
      onFileLongPress(file, index);
    } else if (!enableSelection) {
      // Show context menu
      Alert.alert(
        file.name,
        'What would you like to do with this file?',
        [
          { text: 'Share', onPress: () => shareFile(file) },
          { text: 'Download', onPress: () => downloadFile(file) },
          { text: 'Delete', onPress: () => deleteFile(file), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }, [onFileLongPress, enableSelection]);

  // File actions
  const shareFile = useCallback(async (file: FileMetadata) => {
    try {
      const { shareUrl } = await storageService.shareFile(file.id, 86400); // 24 hours
      Alert.alert('Share Link', shareUrl);
    } catch (error) {
      Alert.alert('error', 'Failed to generate share link.');
    }
  }, []);

  const downloadFile = useCallback(async (file: FileMetadata) => {
    try {
      const downloadUrl = await storageService.getFileUrl(file.bucket, file.path);
      // In a real implementation, you would initiate a download
      Alert.alert('Download', `Download started for ${file.name}`);
    } catch (error) {
      Alert.alert('error', 'Failed to download file.');
    }
  }, []);

  const deleteFile = useCallback(async (file: FileMetadata) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteFile(file.bucket, file.path);
              setFiles(prev => prev.filter(f => f.id !== file.id));
              Alert.alert('success', 'File deleted successfully.');
            } catch (error) {
              Alert.alert('error', 'Failed to delete file.');
            }
          },
        },
      ]
    );
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // Render file item
  const renderFileItem = useCallback(({ item, index }: { item: FileMetadata; index: number }) => {
    const isSelected = enableSelection && selectedFiles.some(f => f.id === item.id);
    const category = getFileCategory(item.mimeType);

    return (
      <TouchableOpacity
        style={[
          styles.fileItem,
          { width: itemSize, height: itemSize },
          isSelected && styles.selectedFileItem,
        ]}
        onPress={() => handleFilePress(item, index)}
        onLongPress={() => handleFileLongPress(item, index)}
        activeOpacity={0.7}
      >
        <FilePreview
          file={{
            uri: item.path,
            name: item.name,
            type: item.mimeType,
            size: item.size,
          }}
          bucket={item.bucket}
          path={item.path}
          size={itemSize - 16}
          showFileName={false}
          showFileSize={false}
          transforms={{
            width: itemSize * 2,
            height: itemSize * 2,
            resize: 'crop',
            gravity: 'auto',
            format: 'webp',
            quality: 80,
          }}
        />

        {/* File Info Overlay */}
        <View style={styles.fileInfoOverlay}>
          {showUploadDate && (
            <Text style={styles.fileDate}>
              {new Date(item.uploadedAt).toLocaleDateString()}
            </Text>
          )}
          
          {showFileSize && (
            <Text style={styles.fileSize}>
              {formatFileSize(item.size)}
            </Text>
          )}

          <Text style={styles.fileName} numberOfLines={2}>
            {item.originalName}
          </Text>
        </View>

        {/* Selection Indicator */}
        {enableSelection && (
          <View style={[
            styles.selectionIndicator,
            isSelected && styles.selectedIndicator,
          ]}>
            {isSelected && (
              <Icon name="check" size={16} color="white" />
            )}
          </View>
        )}

        {/* File Type Badge */}
        <View style={[styles.fileTypeBadge, { backgroundColor: getFileTypeColor(category) }]}>
          <Icon
            name={getFileTypeIcon(category)}
            size={12}
            color="white"
          />
        </View>
      </TouchableOpacity>
    );
  }, [
    enableSelection,
    selectedFiles,
    itemSize,
    getFileCategory,
    handleFilePress,
    handleFileLongPress,
    showUploadDate,
    showFileSize,
  ]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Get file type color
  const getFileTypeColor = useCallback((category: string): string => {
    switch (category) {
      case 'image': return '#E91E63';
      case 'video': return '#9C27B0';
      case 'audio': return '#FF5722';
      case 'document': return '#2196F3';
      default: return PrimaryColors.primary500;
    }
  }, []);

  // Get file type icon
  const getFileTypeIcon = useCallback((category: string): string => {
    switch (category) {
      case 'image': return 'image';
      case 'video': return 'videocam';
      case 'audio': return 'audiotrack';
      case 'document': return 'description';
      default: return 'insert-drive-file';
    }
  }, []);

  // Render file viewer modal
  const renderFileViewer = () => {
    if (!showViewerModal || !currentFile) return null;

    const category = getFileCategory(currentFile.mimeType);
    const fileUrl = cdnService.getImageUrl(
      currentFile.bucket,
      currentFile.path,
      { format: 'auto', quality: 90 }
    );

    return (
      <Modal
        visible={showViewerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewerModal(false)}
      >
        <View style={styles.viewerModalOverlay}>
          <View style={styles.viewerModalContent}>
            {/* Header */}
            <View style={styles.viewerHeader}>
              <TouchableOpacity
                style={styles.viewerCloseButton}
                onPress={() => setShowViewerModal(false)}
              >
                <Icon name="close" size={24} color="white" />
              </TouchableOpacity>
              
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {currentFile.originalName}
              </Text>
              
              <TouchableOpacity
                style={styles.viewerActionButton}
                onPress={() => shareFile(currentFile)}
              >
                <Icon name="share" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.viewerContent}>
              {category === 'image' && (
                <Image
                  source={{ uri: fileUrl }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              )}
              
              {category === 'video' && (
                <VideoPlayer
                  source={{
                    uri: fileUrl,
                    bucket: currentFile.bucket,
                    path: currentFile.path,
                  }}
                  title={currentFile.originalName}
                  enableFullscreen
                  enableQualitySelector
                  style={styles.viewerVideo}
                />
              )}
              
              {(category === 'audio' || category === 'document') && (
                <View style={styles.viewerPlaceholder}>
                  <Icon
                    name={getFileTypeIcon(category)}
                    size={64}
                    color={LightTheme.OnSurfaceVariant}
                  />
                  <Text style={styles.viewerPlaceholderText}>
                    {category === 'audio' ? 'Audio File' : 'Document'}
                  </Text>
                  <Text style={styles.viewerPlaceholderSubtext}>
                    {formatFileSize(currentFile.size)}
                  </Text>
                </View>
              )}
            </View>

            {/* Navigation */}
            {filteredFiles.length > 1 && (
              <View style={styles.viewerNavigation}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => {
                    const newIndex = Math.max(0, currentFileIndex - 1);
                    setCurrentFileIndex(newIndex);
                    setCurrentFile(filteredFiles[newIndex]);
                  }}
                  disabled={currentFileIndex === 0}
                >
                  <Icon
                    name="chevron-left"
                    size={24}
                    color={currentFileIndex === 0 ? LightTheme.OnSurfaceVariant : 'white'}
                  />
                </TouchableOpacity>
                
                <Text style={styles.navText}>
                  {currentFileIndex + 1} of {filteredFiles.length}
                </Text>
                
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => {
                    const newIndex = Math.min(filteredFiles.length - 1, currentFileIndex + 1);
                    setCurrentFileIndex(newIndex);
                    setCurrentFile(filteredFiles[newIndex]);
                  }}
                  disabled={currentFileIndex === filteredFiles.length - 1}
                >
                  <Icon
                    name="chevron-right"
                    size={24}
                    color={currentFileIndex === filteredFiles.length - 1 ? LightTheme.OnSurfaceVariant : 'white'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Calculate key extractor
  const keyExtractor = useCallback((item: FileMetadata) => item.id, []);

  // Calculate number of columns
  const numColumns = useMemo(() => columns, [columns]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <ActivityIndicator size="large" color={PrimaryColors.primary500} />
        <Text style={styles.loadingText}>Loading files...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Search and Filter Bar */}
      {(showSearch || showFilter || enableSelection) && (
        <View style={styles.toolbar}>
          {showSearch && (
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color={LightTheme.OnSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search files..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={LightTheme.OnSurfaceVariant}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="clear" size={20} color={LightTheme.OnSurfaceVariant} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.toolbarActions}>
            {showFilter && (
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => setShowFilterModal(true)}
              >
                <Icon name="filter-list" size={24} color={PrimaryColors.primary500} />
              </TouchableOpacity>
            )}

            {enableSelection && selectedFiles.length > 0 && (
              <View style={styles.selectionActions}>
                <Text style={styles.selectionCount}>
                  {selectedFiles.length} selected
                </Text>
                <TouchableOpacity
                  style={styles.toolbarButton}
                  onPress={clearSelection}
                >
                  <Icon name="clear" size={24} color={SemanticColors.Error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* File Grid */}
      <FlatList
        data={filteredFiles}
        renderItem={renderFileItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        contentContainerStyle={styles.fileGrid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          refreshable ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFiles(true)}
              colors={[PrimaryColors.primary500]}
            />
          ) : undefined
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="folder" size={64} color={LightTheme.OnSurfaceVariant} />
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        )}
      />

      {/* File Viewer Modal */}
      {renderFileViewer()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: LightTheme.OnSurfaceVariant,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightTheme.Surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: LightTheme.OnSurface,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarButton: {
    padding: 8,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: PrimaryColors.primary500,
  },
  fileGrid: {
    padding: 16,
    gap: 12,
  },
  fileItem: {
    backgroundColor: LightTheme.Surface,
    borderRadius: 8,
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedFileItem: {
    borderWidth: 3,
    borderColor: PrimaryColors.primary500,
  },
  fileInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  fileName: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  fileDate: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicator: {
    backgroundColor: PrimaryColors.primary500,
    borderColor: PrimaryColors.primary500,
  },
  fileTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  viewerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  viewerModalContent: {
    flex: 1,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50, // Account for status bar
    gap: 16,
  },
  viewerCloseButton: {
    padding: 8,
  },
  viewerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  viewerActionButton: {
    padding: 8,
  },
  viewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerVideo: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  viewerPlaceholder: {
    alignItems: 'center',
    gap: 16,
  },
  viewerPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  viewerPlaceholderSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  viewerNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  navButton: {
    padding: 8,
  },
  navText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
});

export default MediaGallery;
export { MediaGallery };