/**
 * UploadProgress - File Upload Progress Tracking Component
 * Phase 21: Media Integration System
 * Provides real-time progress tracking for file uploads with detailed status information
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { MediaFile } from './MediaUploader';

export interface UploadTask {
  id: string;
  file: MediaFile;
  progress: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled';
  errorMessage?: string;
  startTime: number;
  endTime?: number;
  uploadedBytes: number;
  totalBytes: number;
}

export interface UploadProgressProps {
  uploads: UploadTask[];
  onRetryUpload?: (taskId: string) => void;
  onCancelUpload?: (taskId: string) => void;
  onPauseUpload?: (taskId: string) => void;
  onResumeUpload?: (taskId: string) => void;
  onClearCompleted?: () => void;
  onClearAll?: () => void;
  showCompletedTasks?: boolean;
  maxVisibleTasks?: number;
  enableBatchActions?: boolean;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  uploads,
  onRetryUpload,
  onCancelUpload,
  onPauseUpload,
  onResumeUpload,
  onClearCompleted,
  onClearAll,
  showCompletedTasks = true,
  maxVisibleTasks = 10,
  enableBatchActions = true,
}) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Filter and sort uploads
  const filteredUploads = useMemo(() => {
    let filtered = uploads;
    
    if (!showCompletedTasks) {
      filtered = uploads.filter(upload => upload.status !== 'completed');
    }

    // Sort by status priority, then by start time
    const statusPriority = {
      uploading: 0,
      pending: 1,
      paused: 2,
      error: 3,
      cancelled: 4,
      completed: 5,
    };

    filtered.sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return b.startTime - a.startTime;
    });

    if (!showAllTasks && maxVisibleTasks) {
      filtered = filtered.slice(0, maxVisibleTasks);
    }

    return filtered;
  }, [uploads, showCompletedTasks, showAllTasks, maxVisibleTasks]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const active = uploads.filter(u => u.status === 'uploading').length;
    const completed = uploads.filter(u => u.status === 'completed').length;
    const failed = uploads.filter(u => u.status === 'error').length;
    const pending = uploads.filter(u => u.status === 'pending').length;
    const paused = uploads.filter(u => u.status === 'paused').length;
    
    const totalBytes = uploads.reduce((sum, u) => sum + u.totalBytes, 0);
    const uploadedBytes = uploads.reduce((sum, u) => sum + u.uploadedBytes, 0);
    const overallProgress = totalBytes > 0 ? (uploadedBytes / totalBytes) * 100 : 0;

    return {
      active,
      completed,
      failed,
      pending,
      paused,
      total: uploads.length,
      overallProgress,
      totalSize: totalBytes,
      uploadedSize: uploadedBytes,
    };
  }, [uploads]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format upload speed
  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Get status icon and color
  const getStatusConfig = (status: UploadTask['status']) => {
    switch (status) {
      case 'pending':
        return { icon: 'schedule', color: theme.OnSurfaceVariant };
      case 'uploading':
        return { icon: 'cloud-upload', color: theme.primary };
      case 'paused':
        return { icon: 'pause-circle', color: theme.Outline };
      case 'completed':
        return { icon: 'check-circle', color: '#4CAF50' };
      case 'error':
        return { icon: 'error', color: theme.error };
      case 'cancelled':
        return { icon: 'cancel', color: theme.Outline };
      default:
        return { icon: 'help', color: theme.OnSurfaceVariant };
    }
  };

  // Handle task selection
  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(taskId)) {
        newSelection.delete(taskId);
      } else {
        newSelection.add(taskId);
      }
      return newSelection;
    });
  }, []);

  // Handle batch actions
  const handleBatchCancel = useCallback(() => {
    Alert.alert(
      'Cancel Selected Uploads',
      `Cancel ${selectedTasks.size} selected uploads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            selectedTasks.forEach(taskId => onCancelUpload?.(taskId));
            setSelectedTasks(new Set());
          },
        },
      ]
    );
  }, [selectedTasks, onCancelUpload]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },

    header: {
      marginBottom: 16,
    },

    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 8,
    },

    summary: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },

    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },

    summaryLabel: {
      fontSize: 13,
      color: theme.OnSurfaceVariant,
    },

    summaryValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.OnBackground,
    },

    overallProgressContainer: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.OutlineVariant,
    },

    overallProgressBar: {
      height: 6,
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },

    overallProgressFill: {
      height: '100%',
      backgroundColor: theme.primary,
    },

    overallProgressText: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },

    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.OutlineVariant,
    },

    controlsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
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
      backgroundColor: theme.SurfaceVariant,
      gap: 4,
    },

    clearButton: {
      backgroundColor: theme.errorContainer,
    },

    controlButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
    },

    clearButtonText: {
      color: theme.OnErrorContainer,
    },

    toggleButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.primaryContainer,
    },

    toggleButtonText: {
      fontSize: 11,
      color: theme.OnPrimaryContainer,
      fontWeight: '500',
    },

    tasksList: {
      gap: 8,
      maxHeight: 400,
    },

    taskItem: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    taskItemSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryContainer + '20',
    },

    taskHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },

    taskSelection: {
      marginRight: 8,
    },

    taskInfo: {
      flex: 1,
      marginRight: 8,
    },

    taskName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnBackground,
      marginBottom: 2,
    },

    taskDetails: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
    },

    taskStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    taskStatusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    taskProgress: {
      marginBottom: 8,
    },

    progressBar: {
      height: 4,
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 4,
    },

    progressFill: {
      height: '100%',
    },

    progressInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    progressText: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
    },

    taskActions: {
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

    retryButton: {
      backgroundColor: theme.primaryContainer,
    },

    retryIcon: {
      color: theme.OnPrimaryContainer,
    },

    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },

    emptyIcon: {
      color: theme.OnSurfaceVariant,
      marginBottom: 8,
    },

    emptyText: {
      fontSize: 14,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },

    batchActions: {
      backgroundColor: theme.primaryContainer,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    batchActionsText: {
      fontSize: 13,
      color: theme.OnPrimaryContainer,
      fontWeight: '500',
    },

    batchActionsButtons: {
      flexDirection: 'row',
      gap: 8,
    },

    batchActionButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.primary,
    },

    batchActionButtonText: {
      fontSize: 11,
      color: theme.OnPrimary,
      fontWeight: '600',
    },
  });

  const styles = getStyles(theme);

  const renderTaskItem = (task: UploadTask) => {
    const statusConfig = getStatusConfig(task.status);
    const isSelected = selectedTasks.has(task.id);

    return (
      <TouchableOpacity
        key={task.id}
        style={[
          styles.taskItem,
          isSelected && styles.taskItemSelected,
        ]}
        onPress={() => enableBatchActions && toggleTaskSelection(task.id)}
        onLongPress={() => enableBatchActions && toggleTaskSelection(task.id)}
      >
        <View style={styles.taskHeader}>
          {enableBatchActions && (
            <TouchableOpacity
              style={styles.taskSelection}
              onPress={() => toggleTaskSelection(task.id)}
            >
              <Icon
                name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={isSelected ? theme.primary : theme.OnSurfaceVariant}
              />
            </TouchableOpacity>
          )}

          <View style={styles.taskInfo}>
            <Text style={styles.taskName} numberOfLines={1}>
              {task.file.name}
            </Text>
            <Text style={styles.taskDetails}>
              {formatFileSize(task.file.size)} • {task.file.type.split('/')[1]?.toUpperCase()}
            </Text>
          </View>

          <View style={styles.taskStatus}>
            <Icon
              name={statusConfig.icon}
              size={16}
              color={statusConfig.color}
            />
            <Text
              style={[
                styles.taskStatusText,
                { color: statusConfig.color }
              ]}
            >
              {task.status}
            </Text>
          </View>
        </View>

        {task.status === 'uploading' && (
          <View style={styles.taskProgress}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${task.progress}%`,
                    backgroundColor: theme.primary,
                  }
                ]}
              />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {formatFileSize(task.uploadedBytes)} / {formatFileSize(task.totalBytes)}
              </Text>
              <Text style={styles.progressText}>
                {task.speed > 0 ? formatSpeed(task.speed) : 'Calculating...'}
              </Text>
              <Text style={styles.progressText}>
                {task.timeRemaining > 0 ? formatTimeRemaining(task.timeRemaining) : '--'}
              </Text>
            </View>
          </View>
        )}

        {task.status === 'error' && task.errorMessage && (
          <Text style={[styles.progressText, { color: theme.error, marginBottom: 8 }]}>
            Error: {task.errorMessage}
          </Text>
        )}

        <View style={styles.taskActions}>
          {task.status === 'uploading' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onPauseUpload?.(task.id)}
              accessibilityLabel="Pause upload"
            >
              <Icon name="pause" size={16} style={styles.actionIcon} />
            </TouchableOpacity>
          )}

          {task.status === 'paused' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.retryButton]}
              onPress={() => onResumeUpload?.(task.id)}
              accessibilityLabel="Resume upload"
            >
              <Icon name="play-arrow" size={16} style={styles.retryIcon} />
            </TouchableOpacity>
          )}

          {task.status === 'error' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.retryButton]}
              onPress={() => onRetryUpload?.(task.id)}
              accessibilityLabel="Retry upload"
            >
              <Icon name="refresh" size={16} style={styles.retryIcon} />
            </TouchableOpacity>
          )}

          {['pending', 'uploading', 'paused'].includes(task.status) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onCancelUpload?.(task.id)}
              accessibilityLabel="Cancel upload"
            >
              <Icon name="close" size={16} style={styles.actionIcon} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (filteredUploads.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="cloud-done" size={48} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            No uploads in progress
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Progress</Text>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Active</Text>
            <Text style={styles.summaryValue}>{summary.active}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Completed</Text>
            <Text style={styles.summaryValue}>{summary.completed}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Failed</Text>
            <Text style={styles.summaryValue}>{summary.failed}</Text>
          </View>

          <View style={styles.overallProgressContainer}>
            <View style={styles.overallProgressBar}>
              <Animated.View
                style={[
                  styles.overallProgressFill,
                  { width: `${summary.overallProgress}%` }
                ]}
              />
            </View>
            <Text style={styles.overallProgressText}>
              {formatFileSize(summary.uploadedSize)} / {formatFileSize(summary.totalSize)} ({Math.round(summary.overallProgress)}%)
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlsLeft}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowAllTasks(!showAllTasks)}
            >
              <Text style={styles.toggleButtonText}>
                {showAllTasks ? 'Show Less' : `Show All (${uploads.length})`}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controlsRight}>
            {summary.completed > 0 && (
              <TouchableOpacity
                style={[styles.controlButton, styles.clearButton]}
                onPress={onClearCompleted}
                accessibilityLabel="Clear completed"
              >
                <Icon name="clear-all" size={14} color={theme.OnErrorContainer} />
                <Text style={[styles.controlButtonText, styles.clearButtonText]}>
                  Clear Done
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Batch Actions */}
        {enableBatchActions && selectedTasks.size > 0 && (
          <View style={styles.batchActions}>
            <Text style={styles.batchActionsText}>
              {selectedTasks.size} selected
            </Text>
            <View style={styles.batchActionsButtons}>
              <TouchableOpacity
                style={styles.batchActionButton}
                onPress={handleBatchCancel}
              >
                <Text style={styles.batchActionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.batchActionButton}
                onPress={() => setSelectedTasks(new Set())}
              >
                <Text style={styles.batchActionButtonText}>Deselect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Tasks List */}
      <ScrollView
        style={styles.tasksList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
          />
        }
      >
        {filteredUploads.map(renderTaskItem)}
      </ScrollView>
    </View>
  );
};

export default UploadProgress;