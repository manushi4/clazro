/**
 * File Preview Component
 * Generates previews for different file types
 * Phase 73: File Upload & Media Management
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme, PrimaryColors, SemanticColors } from '../../theme/colors';
import { cdnService, ImageTransformOptions } from '../../services/storage/CDNService';

const { width: screenWidth } = Dimensions.get('window');

export interface FilePreviewProps {
  file: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  };
  size?: number;
  style?: any;
  onPress?: () => void;
  showFileName?: boolean;
  showFileSize?: boolean;
  borderRadius?: number;
  transforms?: ImageTransformOptions;
  fallbackIcon?: string;
  bucket?: string;
  path?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  size = 80,
  style,
  onPress,
  showFileName = false,
  showFileSize = false,
  borderRadius = 8,
  transforms = {},
  fallbackIcon,
  bucket,
  path,
}) => {
  const getFileIcon = (mimeType: string, fileName: string): string => {
    // Custom fallback icon
    if (fallbackIcon) return fallbackIcon;

    // Check by MIME type first
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'videocam';
    if (mimeType.startsWith('audio/')) return 'audiotrack';
    
    // Check by file extension
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'pdf':
        return 'picture-as-pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'xls':
      case 'xlsx':
        return 'grid-on';
      case 'ppt':
      case 'pptx':
        return 'slideshow';
      case 'txt':
        return 'text-snippet';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive';
      case 'mp3':
      case 'wav':
      case 'aac':
      case 'flac':
        return 'audiotrack';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'videocam';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      default:
        return 'insert-drive-file';
    }
  };

  const getIconColor = (mimeType: string, fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'pdf':
        return '#FF5722';
      case 'doc':
      case 'docx':
        return '#2196F3';
      case 'xls':
      case 'xlsx':
        return '#4CAF50';
      case 'ppt':
      case 'pptx':
        return '#FF9800';
      case 'zip':
      case 'rar':
      case '7z':
        return '#795548';
      default:
        if (mimeType.startsWith('image/')) return '#E91E63';
        if (mimeType.startsWith('video/')) return '#9C27B0';
        if (mimeType.startsWith('audio/')) return '#FF5722';
        return PrimaryColors.primary500;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isImageType = (mimeType: string): boolean => {
    return mimeType.startsWith('image/') && !mimeType.includes('svg');
  };

  const renderImagePreview = () => {
    let imageUri = file.uri;
    
    // Use CDN service for optimized image if bucket and path are provided
    if (bucket && path) {
      const imageTransforms: ImageTransformOptions = {
        width: size * 2, // 2x for better quality
        height: size * 2,
        resize: 'crop',
        gravity: 'auto',
        format: 'webp',
        quality: 80,
        ...transforms,
      };
      imageUri = cdnService.getImageUrl(bucket, path, imageTransforms);
    }

    return (
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.imagePreview,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
        resizeMode="cover"
        onError={() => {
          // Fallback to file icon if image fails to load
        }}
      />
    );
  };

  const renderIconPreview = () => {
    const iconName = getFileIcon(file.type, file.name);
    const iconColor = getIconColor(file.type, file.name);

    return (
      <View
        style={[
          styles.iconPreview,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
      >
        <Icon
          name={iconName}
          size={size * 0.5}
          color={iconColor}
        />
        
        {/* File extension badge */}
        <View style={styles.extensionBadge}>
          <Text style={styles.extensionText}>
            {file.name.split('.').pop()?.toUpperCase() || '?'}
          </Text>
        </View>
      </View>
    );
  };

  const renderVideoPreview = () => {
    return (
      <View
        style={[
          styles.videoPreview,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
      >
        {/* Video thumbnail would go here if available */}
        <View style={styles.videoOverlay}>
          <Icon
            name="play-circle-filled"
            size={size * 0.3}
            color="rgba(255, 255, 255, 0.9)"
          />
        </View>
        
        <View style={styles.videoTypeIndicator}>
          <Icon
            name="videocam"
            size={16}
            color="white"
          />
        </View>
      </View>
    );
  };

  const renderPreview = () => {
    if (isImageType(file.type)) {
      return renderImagePreview();
    } else if (file.type.startsWith('video/')) {
      return renderVideoPreview();
    } else {
      return renderIconPreview();
    }
  };

  const containerStyle = [
    styles.container,
    {
      width: showFileName || showFileSize ? Math.max(size, 120) : size,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7}>
        {renderPreview()}
        
        {(showFileName || showFileSize) && (
          <View style={styles.fileInfo}>
            {showFileName && (
              <Text
                style={[
                  styles.fileName,
                  { maxWidth: Math.max(size, 120) - 8 },
                ]}
                numberOfLines={2}
              >
                {file.name}
              </Text>
            )}
            
            {showFileSize && file.size && (
              <Text style={styles.fileSize}>
                {formatFileSize(file.size)}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      {renderPreview()}
      
      {(showFileName || showFileSize) && (
        <View style={styles.fileInfo}>
          {showFileName && (
            <Text
              style={[
                styles.fileName,
                { maxWidth: Math.max(size, 120) - 8 },
              ]}
              numberOfLines={2}
            >
              {file.name}
            </Text>
          )}
          
          {showFileSize && file.size && (
            <Text style={styles.fileSize}>
              {formatFileSize(file.size)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imagePreview: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderWidth: 1,
    borderColor: LightTheme.OutlineVariant,
  },
  iconPreview: {
    backgroundColor: LightTheme.Surface,
    borderWidth: 1,
    borderColor: LightTheme.OutlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  videoPreview: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: LightTheme.OutlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    zIndex: 2,
  },
  videoTypeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extensionBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: LightTheme.Primary,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  extensionText: {
    fontSize: 8,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
  fileInfo: {
    marginTop: 4,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  fileName: {
    fontSize: 11,
    fontWeight: '500',
    color: LightTheme.OnSurface,
    textAlign: 'center',
    lineHeight: 14,
  },
  fileSize: {
    fontSize: 9,
    color: LightTheme.OnSurfaceVariant,
    marginTop: 1,
    textAlign: 'center',
  },
});

export default FilePreview;
export { FilePreview };