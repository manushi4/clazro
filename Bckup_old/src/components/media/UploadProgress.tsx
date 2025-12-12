/**
 * Upload Progress Component
 * Visual progress tracking for file uploads
 * Phase 73: File Upload & Media Management
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LightTheme, SemanticColors, PrimaryColors } from '../../theme/colors';
import { UploadProgress as UploadProgressType } from '../../services/storage/StorageService';

export interface UploadProgressProps {
  progress: UploadProgressType;
  style?: any;
  showDetails?: boolean;
  compact?: boolean;
  color?: string;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  style,
  showDetails = true,
  compact = false,
  color,
}) => {
  const progressColor = color || getProgressColor(progress.status);
  const progressWidth = new Animated.Value(progress.percentage);

  React.useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress.percentage,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress.percentage, progressWidth]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) {
      return `${Math.round(bytesPerSecond)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
  };

  const getStatusText = (status: UploadProgressType['status']): string => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <View style={styles.compactProgressTrack}>
          <Animated.View
            style={[
              styles.compactProgressFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
        <Text style={styles.compactPercentage}>
          {Math.round(progress.percentage)}%
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
        
        <Text style={styles.percentage}>
          {Math.round(progress.percentage)}%
        </Text>
      </View>

      {/* Progress Details */}
      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.statusText}>
              {getStatusText(progress.status)}
            </Text>
            
            <Text style={styles.sizeText}>
              {formatBytes(progress.bytesUploaded)} / {formatBytes(progress.totalBytes)}
            </Text>
          </View>

          {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>
                Time remaining: {formatTime(progress.estimatedTimeRemaining)}
              </Text>
              
              {progress.uploadSpeed && progress.uploadSpeed > 0 && (
                <Text style={styles.detailText}>
                  {formatSpeed(progress.uploadSpeed)}
                </Text>
              )}
            </View>
          )}

          {progress.error && (
            <Text style={styles.errorText} numberOfLines={2}>
              {progress.error}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const getProgressColor = (status: UploadProgressType['status']): string => {
  switch (status) {
    case 'uploading':
    case 'processing':
      return PrimaryColors.primary500;
    case 'completed':
      return SemanticColors.Success;
    case 'failed':
      return SemanticColors.Error;
    case 'cancelled':
      return LightTheme.OnSurfaceVariant;
    default:
      return LightTheme.OnSurfaceVariant;
  }
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },
  compactProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 1,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    minWidth: 32,
    textAlign: 'right',
  },
  compactPercentage: {
    fontSize: 10,
    fontWeight: '500',
    color: LightTheme.OnSurfaceVariant,
    minWidth: 28,
    textAlign: 'right',
  },
  details: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: LightTheme.OnSurface,
  },
  sizeText: {
    fontSize: 11,
    color: LightTheme.OnSurfaceVariant,
  },
  detailText: {
    fontSize: 10,
    color: LightTheme.OnSurfaceVariant,
  },
  errorText: {
    fontSize: 10,
    color: SemanticColors.Error,
    marginTop: 2,
  },
});

export default UploadProgress;
export { UploadProgress };