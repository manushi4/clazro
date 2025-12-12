/**
 * VideoSpotlight - Video-focused spotlight component for presentations
 * Phase 14: Participant Spotlight System  
 * Displays participants in a video-centric spotlight with enhanced video controls
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LightTheme, SemanticColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import StatusBadge from '../core/StatusBadge';
import { Participant } from './ParticipantCard';
import { SpotlightData } from './SpotlightParticipant';

const { width, height } = Dimensions.get('window');

interface VideoSpotlightProps {
  participant: Participant;
  spotlightData: SpotlightData;
  isTeacherView?: boolean;
  onToggleVideo?: (participantId: string) => void;
  onToggleAudio?: (participantId: string) => void;
  onToggleFullscreen?: (participantId: string) => void;
  onEndSpotlight?: (participantId: string) => void;
  onRecordSpotlight?: (participantId: string) => void;
  onTakeScreenshot?: (participantId: string) => void;
  showControls?: boolean;
  isFullscreen?: boolean;
  videoUrl?: string; // Mock video URL for demo
}

const VideoSpotlight: React.FC<VideoSpotlightProps> = ({
  participant,
  spotlightData,
  isTeacherView = false,
  onToggleVideo,
  onToggleAudio,
  onToggleFullscreen,
  onEndSpotlight,
  onRecordSpotlight,
  onTakeScreenshot,
  showControls = true,
  isFullscreen = false,
  videoUrl,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Auto-hide video controls
  useEffect(() => {
    if (showVideoControls) {
      const timeout = setTimeout(() => {
        setShowVideoControls(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [showVideoControls]);

  const getVideoContainerSize = () => {
    if (isFullscreen) {
      return {
        width: width,
        height: height * 0.7,
      };
    }
    return {
      width: width * 0.9,
      height: width * 0.6, // 3:2 aspect ratio
    };
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingDuration(0);
      onRecordSpotlight?.(participant.id);
    } else {
      setIsRecording(true);
      onRecordSpotlight?.(participant.id);
    }
  };

  const getQualityColor = () => {
    switch (videoQuality) {
      case 'high':
        return SemanticColors.Success;
      case 'medium':
        return SemanticColors.Warning;
      case 'low':
        return SemanticColors.Error;
      default:
        return LightTheme.OnSurfaceVariant;
    }
  };

  const renderVideoPlaceholder = () => (
    <View style={styles.videoPlaceholder}>
      {participant.videoEnabled ? (
        <>
          <View style={styles.mockVideoContent}>
            <Text style={styles.videoPlaceholderEmoji}>
              {participant.avatar || '👤'}
            </Text>
            <Text style={styles.videoPlaceholderText}>
              {participant.name}'s Video
            </Text>
            <Text style={styles.videoQualityText}>
              📹 {videoQuality.toUpperCase()} Quality
            </Text>
          </View>
          
          {/* Video quality indicator */}
          <View style={[
            styles.qualityIndicator,
            { backgroundColor: getQualityColor() }
          ]}>
            <Text style={styles.qualityText}>
              {videoQuality.toUpperCase()}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.noVideoContent}>
          <Text style={styles.noVideoIcon}>📷</Text>
          <Text style={styles.noVideoText}>Video Off</Text>
          <Text style={styles.noVideoSubtext}>
            {participant.name} has turned off their camera
          </Text>
        </View>
      )}
    </View>
  );

  const renderParticipantOverlay = () => (
    <View style={styles.participantOverlay}>
      <View style={styles.participantInfo}>
        <Text style={styles.participantName} numberOfLines={1}>
          {participant.name}
        </Text>
        
        <View style={styles.participantBadges}>
          {participant.role === 'teacher' && (
            <StatusBadge
              text="Teacher"
              type="success"
              size="small"
            />
          )}
          
          <StatusBadge
            text={spotlightData.type}
            type="primary"
            size="small"
          />
        </View>
      </View>
      
      <View style={styles.statusIndicators}>
        {/* Audio indicator */}
        <View style={[
          styles.statusIcon,
          participant.audioEnabled ? styles.audioOn : styles.audioOff
        ]}>
          <Text style={styles.statusIconText}>
            {participant.audioEnabled ? '🎤' : '🔇'}
          </Text>
        </View>
        
        {/* Video indicator */}
        <View style={[
          styles.statusIcon,
          participant.videoEnabled ? styles.videoOn : styles.videoOff
        ]}>
          <Text style={styles.statusIconText}>
            {participant.videoEnabled ? '📹' : '📷'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRecordingIndicator = () => {
    if (!isRecording) return null;
    
    return (
      <View style={styles.recordingIndicator}>
        <View style={styles.recordingDot} />
        <Text style={styles.recordingText}>REC</Text>
        <Text style={styles.recordingTime}>
          {formatRecordingTime(recordingDuration)}
        </Text>
      </View>
    );
  };

  const renderVideoControls = () => {
    if (!showControls || !isTeacherView || !showVideoControls) return null;
    
    return (
      <View style={styles.videoControlsContainer}>
        <View style={styles.videoControlsRow}>
          {/* Audio control */}
          <TouchableOpacity
            style={[
              styles.videoControlButton,
              participant.audioEnabled ? styles.controlActive : styles.controlInactive
            ]}
            onPress={() => onToggleAudio?.(participant.id)}
            testID={`video-audio-${participant.id}`}
          >
            <Text style={styles.videoControlIcon}>
              {participant.audioEnabled ? '🎤' : '🔇'}
            </Text>
          </TouchableOpacity>
          
          {/* Video control */}
          <TouchableOpacity
            style={[
              styles.videoControlButton,
              participant.videoEnabled ? styles.controlActive : styles.controlInactive
            ]}
            onPress={() => onToggleVideo?.(participant.id)}
            testID={`video-camera-${participant.id}`}
          >
            <Text style={styles.videoControlIcon}>
              {participant.videoEnabled ? '📹' : '📷'}
            </Text>
          </TouchableOpacity>
          
          {/* Quality control */}
          <TouchableOpacity
            style={styles.videoControlButton}
            onPress={() => {
              const qualities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
              const currentIndex = qualities.indexOf(videoQuality);
              const nextIndex = (currentIndex + 1) % qualities.length;
              setVideoQuality(qualities[nextIndex]);
            }}
            testID={`video-quality-${participant.id}`}
          >
            <Text style={styles.videoControlIcon}>⚙️</Text>
            <Text style={styles.controlLabel}>{videoQuality.toUpperCase()}</Text>
          </TouchableOpacity>
          
          {/* Recording control */}
          <TouchableOpacity
            style={[
              styles.videoControlButton,
              isRecording ? styles.controlActive : styles.controlInactive
            ]}
            onPress={handleRecordingToggle}
            testID={`video-record-${participant.id}`}
          >
            <Text style={styles.videoControlIcon}>
              {isRecording ? '⏹️' : '🔴'}
            </Text>
            <Text style={styles.controlLabel}>
              {isRecording ? 'STOP' : 'REC'}
            </Text>
          </TouchableOpacity>
          
          {/* Screenshot control */}
          <TouchableOpacity
            style={styles.videoControlButton}
            onPress={() => onTakeScreenshot?.(participant.id)}
            testID={`video-screenshot-${participant.id}`}
          >
            <Text style={styles.videoControlIcon}>📸</Text>
          </TouchableOpacity>
          
          {/* Fullscreen control */}
          <TouchableOpacity
            style={styles.videoControlButton}
            onPress={() => onToggleFullscreen?.(participant.id)}
            testID={`video-fullscreen-${participant.id}`}
          >
            <Text style={styles.videoControlIcon}>
              {isFullscreen ? '🗗' : '⛶'}
            </Text>
          </TouchableOpacity>
          
          {/* End spotlight control */}
          <TouchableOpacity
            style={[styles.videoControlButton, styles.endSpotlightButton]}
            onPress={() => onEndSpotlight?.(participant.id)}
            testID={`video-end-${participant.id}`}
          >
            <Text style={styles.videoControlIcon}>⏹️</Text>
            <Text style={styles.controlLabel}>END</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const containerSize = getVideoContainerSize();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: containerSize.width,
          height: containerSize.height,
        },
        isFullscreen && styles.fullscreenContainer
      ]}
      onPress={() => setShowVideoControls(true)}
      activeOpacity={0.9}
      testID={`video-spotlight-${participant.id}`}
    >
      <View style={styles.videoContainer}>
        {renderVideoPlaceholder()}
        {renderParticipantOverlay()}
        {renderRecordingIndicator()}
      </View>
      
      {renderVideoControls()}
      
      {/* Spotlight glow effect */}
      {spotlightData.isActive && (
        <View style={styles.spotlightGlow} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderRadius: BorderRadius.LG,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fullscreenContainer: {
    borderRadius: 0,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mockVideoContent: {
    alignItems: 'center',
  },
  videoPlaceholderEmoji: {
    fontSize: 60,
    marginBottom: Spacing.MD,
  },
  videoPlaceholderText: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.SM,
  },
  videoQualityText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#CCCCCC',
  },
  noVideoContent: {
    alignItems: 'center',
    opacity: 0.7,
  },
  noVideoIcon: {
    fontSize: 48,
    marginBottom: Spacing.MD,
  },
  noVideoText: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.SM,
  },
  noVideoSubtext: {
    fontSize: Typography.bodyMedium.fontSize,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  qualityIndicator: {
    position: 'absolute',
    top: Spacing.SM,
    right: Spacing.SM,
    borderRadius: BorderRadius.XS,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
  },
  qualityText: {
    fontSize: Typography.bodySmall.fontSize - 2,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  participantOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: Spacing.MD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.XS,
  },
  participantBadges: {
    flexDirection: 'row',
    gap: Spacing.XS,
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioOn: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  audioOff: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  videoOn: {
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
  },
  videoOff: {
    backgroundColor: 'rgba(158, 158, 158, 0.8)',
  },
  statusIconText: {
    fontSize: 16,
  },
  recordingIndicator: {
    position: 'absolute',
    top: Spacing.SM,
    left: Spacing.SM,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: Spacing.XS,
  },
  recordingText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: Spacing.SM,
  },
  recordingTime: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: 'monospace',
    color: '#FFFFFF',
  },
  videoControlsContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: Spacing.MD,
    transform: [{ translateY: -25 }],
  },
  videoControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.MD,
    paddingHorizontal: Spacing.MD,
  },
  videoControlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.SM,
    minWidth: 50,
    minHeight: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderColor: 'rgba(76, 175, 80, 1)',
  },
  controlInactive: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderColor: 'rgba(244, 67, 54, 1)',
  },
  endSpotlightButton: {
    backgroundColor: 'rgba(255, 87, 34, 0.8)',
    borderColor: 'rgba(255, 87, 34, 1)',
  },
  videoControlIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  controlLabel: {
    fontSize: Typography.bodySmall.fontSize - 2,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spotlightGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.LG + 4,
    borderWidth: 4,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 12,
  },
});

export default VideoSpotlight;