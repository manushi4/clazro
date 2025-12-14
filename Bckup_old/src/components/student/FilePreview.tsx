/**
 * FilePreview - Multi-format File Preview Component
 * Phase 21: Media Integration System
 * Provides preview capabilities for various file formats with full-screen support
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { MediaFile } from './MediaUploader';

export interface FilePreviewProps {
  file: MediaFile;
  style?: any;
  showControls?: boolean;
  enableFullscreen?: boolean;
  onClose?: () => void;
  onError?: (error: string) => void;
  maxPreviewSize?: number;
}

interface PreviewState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  isFullscreen: boolean;
  scale: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PREVIEW_TYPES = {
  IMAGE: 'image',
  PDF: 'pdf',
  VIDEO: 'video',
  AUDIO: 'audio',
  TEXT: 'text',
  DOCUMENT: 'document',
  UNSUPPORTED: 'unsupported',
};

const IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const VIDEO_FORMATS = ['video/mp4', 'video/mov', 'video/avi', 'video/webm'];
const AUDIO_FORMATS = ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg'];
const TEXT_FORMATS = ['text/plain', 'text/html', 'application/json', 'text/csv'];
const PDF_FORMATS = ['application/pdf'];
const DOCUMENT_FORMATS = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  style,
  showControls = true,
  enableFullscreen = true,
  onClose,
  onError,
  maxPreviewSize = 300,
}) => {
  const { theme } = useTheme();
  
  const [state, setState] = useState<PreviewState>({
    isLoading: false,
    hasError: false,
    errorMessage: '',
    isFullscreen: false,
    scale: 1,
  });

  // Determine preview type based on MIME type
  const previewType = useMemo(() => {
    const mimeType = file.mimeType || file.type;
    
    if (IMAGE_FORMATS.includes(mimeType)) return PREVIEW_TYPES.IMAGE;
    if (VIDEO_FORMATS.includes(mimeType)) return PREVIEW_TYPES.VIDEO;
    if (AUDIO_FORMATS.includes(mimeType)) return PREVIEW_TYPES.AUDIO;
    if (PDF_FORMATS.includes(mimeType)) return PREVIEW_TYPES.PDF;
    if (TEXT_FORMATS.includes(mimeType)) return PREVIEW_TYPES.TEXT;
    if (DOCUMENT_FORMATS.includes(mimeType)) return PREVIEW_TYPES.DOCUMENT;
    
    return PREVIEW_TYPES.UNSUPPORTED;
  }, [file.mimeType, file.type]);

  // Handle image load error
  const handleImageError = useCallback((error: any) => {
    setState(prev => ({
      ...prev,
      hasError: true,
      errorMessage: 'Failed to load image',
      isLoading: false,
    }));
    onError?.('Failed to load image');
  }, [onError]);

  // Handle image load start
  const handleImageLoadStart = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, hasError: false }));
  }, []);

  // Handle image load end
  const handleImageLoadEnd = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!enableFullscreen) return;
    setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, [enableFullscreen]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setState(prev => ({ ...prev, scale: Math.min(prev.scale + 0.25, 3) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setState(prev => ({ ...prev, scale: Math.max(prev.scale - 0.25, 0.5) }));
  }, []);

  const handleResetZoom = useCallback(() => {
    setState(prev => ({ ...prev, scale: 1 }));
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (type: string): string => {
    switch (previewType) {
      case PREVIEW_TYPES.IMAGE: return 'image';
      case PREVIEW_TYPES.VIDEO: return 'video_file';
      case PREVIEW_TYPES.AUDIO: return 'audio_file';
      case PREVIEW_TYPES.PDF: return 'picture_as_pdf';
      case PREVIEW_TYPES.TEXT: return 'text_snippet';
      case PREVIEW_TYPES.DOCUMENT: return 'description';
      default: return 'insert_drive_file';
    }
  };

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
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.OutlineVariant,
      backgroundColor: theme.SurfaceVariant,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    fileInfo: {
      flex: 1,
    },

    fileName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
      marginBottom: 2,
    },

    fileDetails: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
      opacity: 0.8,
    },

    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    controlButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: theme.background,
    },

    controlIcon: {
      color: theme.OnSurfaceVariant,
    },

    previewContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
      minHeight: maxPreviewSize,
    },

    imageContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    image: {
      borderRadius: 8,
    },

    webViewContainer: {
      height: maxPreviewSize,
      width: '100%',
    },

    webView: {
      backgroundColor: 'transparent',
    },

    unsupportedContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      minHeight: maxPreviewSize,
    },

    unsupportedIcon: {
      color: theme.OnSurfaceVariant,
      marginBottom: 12,
      opacity: 0.6,
    },

    unsupportedText: {
      fontSize: 14,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      marginBottom: 4,
    },

    unsupportedSubtext: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      opacity: 0.7,
    },

    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background + 'CC',
    },

    loadingText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      marginTop: 8,
    },

    errorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      minHeight: maxPreviewSize,
    },

    errorIcon: {
      color: theme.error,
      marginBottom: 8,
    },

    errorText: {
      fontSize: 14,
      color: theme.error,
      textAlign: 'center',
      marginBottom: 4,
    },

    errorSubtext: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },

    retryButton: {
      backgroundColor: theme.errorContainer,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 12,
    },

    retryButtonText: {
      color: theme.OnErrorContainer,
      fontSize: 12,
      fontWeight: '600',
    },

    // Fullscreen styles
    fullscreenModal: {
      flex: 1,
      backgroundColor: 'black',
    },

    fullscreenContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    fullscreenHeader: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingVertical: 12,
    },

    fullscreenTitle: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      marginLeft: 12,
    },

    fullscreenControls: {
      flexDirection: 'row',
      gap: 12,
    },

    fullscreenButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },

    fullscreenIcon: {
      color: 'white',
    },

    fullscreenImage: {
      maxWidth: screenWidth,
      maxHeight: screenHeight - 100,
    },

    zoomInfo: {
      position: 'absolute',
      bottom: 100,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },

    zoomText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
  });

  const styles = getStyles(theme);

  // Render different preview types
  const renderPreview = () => {
    if (state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={32} style={styles.errorIcon} />
          <Text style={styles.errorText}>Preview Error</Text>
          <Text style={styles.errorSubtext}>{state.errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setState(prev => ({ ...prev, hasError: false, errorMessage: '' }))}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (previewType) {
      case PREVIEW_TYPES.IMAGE:
        return (
          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={toggleFullscreen} disabled={!enableFullscreen}>
              <Image
                source={{ uri: file.uri }}
                style={[
                  styles.image,
                  {
                    width: maxPreviewSize,
                    height: maxPreviewSize,
                    transform: [{ scale: state.scale }],
                  }
                ]}
                resizeMode="contain"
                onLoadStart={handleImageLoadStart}
                onLoadEnd={handleImageLoadEnd}
                onError={handleImageError}
              />
            </TouchableOpacity>
          </View>
        );

      case PREVIEW_TYPES.PDF:
        return (
          <View style={styles.webViewContainer}>
            <WebView
              source={{ uri: file.uri }}
              style={styles.webView}
              onError={() => handleImageError(null)}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={styles.loadingText}>Loading PDF...</Text>
                </View>
              )}
            />
          </View>
        );

      case PREVIEW_TYPES.TEXT:
        return (
          <View style={styles.webViewContainer}>
            <WebView
              source={{ uri: file.uri }}
              style={styles.webView}
              onError={() => handleImageError(null)}
              startInLoadingState
            />
          </View>
        );

      case PREVIEW_TYPES.VIDEO:
      case PREVIEW_TYPES.AUDIO:
      case PREVIEW_TYPES.DOCUMENT:
        return (
          <View style={styles.unsupportedContainer}>
            <Icon
              name={getFileIcon(previewType)}
              size={48}
              style={styles.unsupportedIcon}
            />
            <Text style={styles.unsupportedText}>
              {previewType === PREVIEW_TYPES.VIDEO && 'Video Preview'}
              {previewType === PREVIEW_TYPES.AUDIO && 'Audio File'}
              {previewType === PREVIEW_TYPES.DOCUMENT && 'Document File'}
            </Text>
            <Text style={styles.unsupportedSubtext}>
              Tap to download and view in external app
            </Text>
          </View>
        );

      default:
        return (
          <View style={styles.unsupportedContainer}>
            <Icon name="help-outline" size={48} style={styles.unsupportedIcon} />
            <Text style={styles.unsupportedText}>Unsupported Format</Text>
            <Text style={styles.unsupportedSubtext}>
              Cannot preview this file type
            </Text>
          </View>
        );
    }
  };

  // Render fullscreen modal
  const renderFullscreen = () => {
    if (!state.isFullscreen || previewType !== PREVIEW_TYPES.IMAGE) return null;

    return (
      <Modal
        visible={state.isFullscreen}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={toggleFullscreen}
      >
        <View style={styles.fullscreenModal}>
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity onPress={toggleFullscreen} style={styles.fullscreenButton}>
              <Icon name="close" size={24} style={styles.fullscreenIcon} />
            </TouchableOpacity>
            
            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              {file.name}
            </Text>

            <View style={styles.fullscreenControls}>
              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={handleZoomOut}
                disabled={state.scale <= 0.5}
              >
                <Icon name="zoom-out" size={20} style={styles.fullscreenIcon} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={handleResetZoom}
              >
                <Icon name="center-focus-strong" size={20} style={styles.fullscreenIcon} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={handleZoomIn}
                disabled={state.scale >= 3}
              >
                <Icon name="zoom-in" size={20} style={styles.fullscreenIcon} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.fullscreenContainer}
            contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
            maximumZoomScale={3}
            minimumZoomScale={0.5}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={{ uri: file.uri }}
              style={[
                styles.fullscreenImage,
                { transform: [{ scale: state.scale }] }
              ]}
              resizeMode="contain"
            />
          </ScrollView>

          {state.scale !== 1 && (
            <View style={styles.zoomInfo}>
              <Text style={styles.zoomText}>
                {Math.round(state.scale * 100)}%
              </Text>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  return (
    <>
      <View style={[styles.container, style]}>
        {showControls && (
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileDetails}>
                  {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase()}
                </Text>
              </View>

              <View style={styles.controls}>
                {previewType === PREVIEW_TYPES.IMAGE && enableFullscreen && (
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={toggleFullscreen}
                    accessibilityLabel="View fullscreen"
                  >
                    <Icon name="fullscreen" size={18} style={styles.controlIcon} />
                  </TouchableOpacity>
                )}

                {previewType === PREVIEW_TYPES.IMAGE && state.scale !== 1 && (
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleResetZoom}
                    accessibilityLabel="Reset zoom"
                  >
                    <Icon name="center-focus-strong" size={18} style={styles.controlIcon} />
                  </TouchableOpacity>
                )}

                {onClose && (
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={onClose}
                    accessibilityLabel="Close preview"
                  >
                    <Icon name="close" size={18} style={styles.controlIcon} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.previewContainer}>
          {renderPreview()}

          {state.isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={styles.loadingText}>Loading preview...</Text>
            </View>
          )}
        </View>
      </View>

      {renderFullscreen()}
    </>
  );
};

export default FilePreview;