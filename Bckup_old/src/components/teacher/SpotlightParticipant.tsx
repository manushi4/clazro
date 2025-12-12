/**
 * SpotlightParticipant - Individual participant spotlight component
 * Phase 14: Participant Spotlight System
 * Displays individual participants in spotlight mode with enhanced controls
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LightTheme, SemanticColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import StatusBadge from '../core/StatusBadge';
import { AttendanceStatusDot } from './AttendanceIndicator';
import { Participant } from './ParticipantCard';

const { width } = Dimensions.get('window');

export interface SpotlightData {
  id: string;
  participant: Participant;
  type: 'presentation' | 'question' | 'achievement' | 'assistance' | 'manual';
  priority: 'high' | 'medium' | 'low';
  duration: number; // in seconds
  remainingTime: number; // in seconds
  reason: string;
  isActive: boolean;
  queuePosition?: number;
}

interface SpotlightParticipantProps {
  participant: Participant;
  spotlightData: SpotlightData;
  isTeacherView?: boolean;
  onSpotlightEnd?: (participantId: string) => void;
  onExtendSpotlight?: (participantId: string, additionalTime: number) => void;
  onMuteParticipant?: (participantId: string) => void;
  onUnmuteParticipant?: (participantId: string) => void;
  onRemoveFromSpotlight?: (participantId: string) => void;
  classStartTime?: Date;
  size?: 'small' | 'medium' | 'large';
  showControls?: boolean;
  showTimer?: boolean;
}

const SpotlightParticipant: React.FC<SpotlightParticipantProps> = ({
  participant,
  spotlightData,
  isTeacherView = false,
  onSpotlightEnd,
  onExtendSpotlight,
  onMuteParticipant,
  onUnmuteParticipant,
  onRemoveFromSpotlight,
  classStartTime,
  size = 'medium',
  showControls = true,
  showTimer = true,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [spotlightDuration, setSpotlightDuration] = useState(0);
  const [glowAnimation] = useState(new Animated.Value(0));

  // Calculate time remaining and total duration
  useEffect(() => {
    const updateTimer = () => {
      const elapsed = spotlightData.duration - spotlightData.remainingTime;
      setSpotlightDuration(elapsed);
      setTimeRemaining(spotlightData.remainingTime);
      
      // Auto-end spotlight when time expires
      if (spotlightData.remainingTime === 0 && onSpotlightEnd) {
        onSpotlightEnd(participant.id);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [spotlightData.duration, spotlightData.remainingTime, participant.id, onSpotlightEnd]);

  // Glow animation for spotlight effect
  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start(() => animate());
    };

    if (spotlightData.isActive) {
      animate();
    }

    return () => glowAnimation.stopAnimation();
  }, [spotlightData.isActive, glowAnimation]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          containerWidth: width * 0.3,
          containerHeight: width * 0.4,
          avatarSize: 40,
          fontSize: Typography.bodySmall.fontSize,
        };
      case 'large':
        return {
          containerWidth: width * 0.8,
          containerHeight: width * 1.0,
          avatarSize: 80,
          fontSize: Typography.titleMedium.fontSize,
        };
      default: // medium
        return {
          containerWidth: width * 0.45,
          containerHeight: width * 0.6,
          avatarSize: 60,
          fontSize: Typography.bodyMedium.fontSize,
        };
    }
  };

  const getSpotlightColor = () => {
    switch (spotlightData.priority) {
      case 'high':
        return '#FF6B6B'; // Red
      case 'medium':
        return '#FFB347'; // Orange
      case 'low':
        return '#98D8C8'; // Mint
      default:
        return LightTheme.Primary;
    }
  };

  const getSpotlightTypeIcon = () => {
    switch (spotlightData.type) {
      case 'presentation':
        return '🎤';
      case 'question':
        return '❓';
      case 'achievement':
        return '🏆';
      case 'assistance':
        return '🆘';
      case 'manual':
        return '⭐';
      default:
        return '👁️';
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAvatar = () => {
    const sizeConfig = getSizeConfig();
    
    return (
      <View style={[
        styles.avatarContainer,
        { 
          width: sizeConfig.avatarSize,
          height: sizeConfig.avatarSize,
          borderRadius: sizeConfig.avatarSize / 2,
        }
      ]}>
        {participant.avatar ? (
          <Text style={[
            styles.avatarEmoji,
            { fontSize: sizeConfig.avatarSize * 0.6 }
          ]}>
            {participant.avatar}
          </Text>
        ) : (
          <View style={[
            styles.avatarInitials,
            {
              width: sizeConfig.avatarSize,
              height: sizeConfig.avatarSize,
              borderRadius: sizeConfig.avatarSize / 2,
            }
          ]}>
            <Text style={[
              styles.avatarInitialsText,
              { fontSize: sizeConfig.avatarSize * 0.3 }
            ]}>
              {participant.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Spotlight indicator */}
        <View style={styles.spotlightIndicator}>
          <Text style={styles.spotlightIcon}>
            {getSpotlightTypeIcon()}
          </Text>
        </View>
        
        {/* Attendance status */}
        <View style={styles.attendanceIndicator}>
          <AttendanceStatusDot
            status={participant.attendanceStatus || 'present'}
            size={8}
          />
        </View>
      </View>
    );
  };

  const renderSpotlightInfo = () => (
    <View style={styles.spotlightInfo}>
      <View style={styles.spotlightHeader}>
        <StatusBadge
          text={`${spotlightData.type.charAt(0).toUpperCase()}${spotlightData.type.slice(1)}`}
          type="primary"
          size="small"
        />
        
        {spotlightData.priority === 'high' && (
          <StatusBadge
            text="Priority"
            type="error"
            size="small"
          />
        )}
      </View>
      
      {spotlightData.reason && (
        <Text style={styles.spotlightReason} numberOfLines={2}>
          {spotlightData.reason}
        </Text>
      )}
    </View>
  );

  const renderTimer = () => {
    if (!showTimer) return null;
    
    return (
      <View style={styles.timerContainer}>
        <View style={styles.timerInfo}>
          <Text style={styles.timerLabel}>Spotlight Time</Text>
          <Text style={styles.timerValue}>
            {formatTime(spotlightDuration)}
          </Text>
          
          {timeRemaining !== null && (
            <Text style={[
              styles.remainingTime,
              timeRemaining < 30 && styles.warningTime
            ]}>
              {formatTime(timeRemaining)} remaining
            </Text>
          )}
        </View>
        
        {spotlightData.duration > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (spotlightDuration / spotlightData.duration) * 100)}%`,
                    backgroundColor: timeRemaining && timeRemaining < 30 
                      ? SemanticColors.Warning 
                      : SemanticColors.Success,
                  }
                ]}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderControls = () => {
    if (!showControls || !isTeacherView) return null;
    
    return (
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              participant.audioEnabled ? styles.audioOnButton : styles.audioOffButton
            ]}
            onPress={() => participant.audioEnabled 
              ? onMuteParticipant?.(participant.id)
              : onUnmuteParticipant?.(participant.id)
            }
            testID={`spotlight-audio-${participant.id}`}
          >
            <Text style={styles.controlIcon}>
              {participant.audioEnabled ? '🎤' : '🔇'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.extendButton]}
            onPress={() => onExtendSpotlight?.(participant.id, 60)}
            testID={`extend-spotlight-${participant.id}`}
          >
            <Text style={styles.controlIcon}>⏰</Text>
            <Text style={styles.controlText}>+1m</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.endButton]}
            onPress={() => onSpotlightEnd?.(participant.id)}
            testID={`end-spotlight-${participant.id}`}
          >
            <Text style={styles.controlIcon}>⏹️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.removeButton]}
            onPress={() => onRemoveFromSpotlight?.(participant.id)}
            testID={`remove-spotlight-${participant.id}`}
          >
            <Text style={styles.controlIcon}>❌</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const sizeConfig = getSizeConfig();
  const spotlightColor = getSpotlightColor();
  
  const animatedGlow = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: sizeConfig.containerWidth,
          height: sizeConfig.containerHeight,
          borderColor: spotlightColor,
          shadowColor: spotlightColor,
          elevation: animatedGlow,
          shadowRadius: animatedGlow,
        },
        spotlightData.isActive && styles.activeSpotlight,
      ]}
      testID={`spotlight-participant-${participant.id}`}
    >
      {/* Queue position indicator */}
      {spotlightData.queuePosition && !spotlightData.isActive && (
        <View style={styles.queuePositionBadge}>
          <Text style={styles.queuePositionText}>
            #{spotlightData.queuePosition}
          </Text>
        </View>
      )}
      
      <View style={styles.content}>
        {renderAvatar()}
        
        <View style={styles.participantInfo}>
          <Text style={[
            styles.participantName,
            { fontSize: sizeConfig.fontSize }
          ]} numberOfLines={1}>
            {participant.name}
          </Text>
          
          {participant.role === 'teacher' && (
            <StatusBadge
              text="Teacher"
              type="success"
              size="small"
            />
          )}
        </View>
        
        {renderSpotlightInfo()}
        {renderTimer()}
      </View>
      
      {renderControls()}
      
      {/* Active spotlight indicator */}
      {spotlightData.isActive && (
        <View style={styles.activeIndicator}>
          <Text style={styles.activeIndicatorText}>LIVE</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.LG,
    borderWidth: 3,
    padding: Spacing.MD,
    margin: Spacing.SM,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    position: 'relative',
  },
  activeSpotlight: {
    borderWidth: 4,
    elevation: 8,
    shadowOpacity: 0.4,
  },
  queuePositionBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: LightTheme.Secondary,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  queuePositionText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSecondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.MD,
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  avatarInitials: {
    backgroundColor: LightTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontWeight: '600',
    color: LightTheme.OnPrimaryContainer,
  },
  spotlightIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: LightTheme.Primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: LightTheme.Surface,
  },
  spotlightIcon: {
    fontSize: 16,
  },
  attendanceIndicator: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    backgroundColor: LightTheme.Surface,
    borderRadius: 12,
    padding: 4,
  },
  participantInfo: {
    alignItems: 'center',
    marginBottom: Spacing.SM,
    gap: Spacing.XS,
  },
  participantName: {
    fontWeight: '600',
    color: LightTheme.OnSurface,
    textAlign: 'center',
  },
  spotlightInfo: {
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  spotlightHeader: {
    flexDirection: 'row',
    gap: Spacing.XS,
    marginBottom: Spacing.XS,
  },
  spotlightReason: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    lineHeight: Typography.bodySmall.lineHeight,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.MD,
    width: '100%',
  },
  timerInfo: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  timerValue: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
    fontFamily: 'monospace',
  },
  remainingTime: {
    fontSize: Typography.bodySmall.fontSize - 1,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
  },
  warningTime: {
    color: SemanticColors.Warning,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    marginTop: Spacing.SM,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  controlsContainer: {
    width: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.XS,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.XS,
    paddingHorizontal: Spacing.XS,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    backgroundColor: LightTheme.Surface,
    minHeight: 36,
    justifyContent: 'center',
  },
  audioOnButton: {
    backgroundColor: SemanticColors.Success + '20',
    borderColor: SemanticColors.Success,
  },
  audioOffButton: {
    backgroundColor: SemanticColors.Error + '20',
    borderColor: SemanticColors.Error,
  },
  extendButton: {
    backgroundColor: LightTheme.secondaryContainer,
    borderColor: LightTheme.Secondary,
  },
  endButton: {
    backgroundColor: SemanticColors.Warning + '20',
    borderColor: SemanticColors.Warning,
  },
  removeButton: {
    backgroundColor: SemanticColors.Error + '20',
    borderColor: SemanticColors.Error,
  },
  controlIcon: {
    fontSize: 14,
  },
  controlText: {
    fontSize: Typography.bodySmall.fontSize - 1,
    color: LightTheme.OnSurface,
    marginTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF0000',
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
  },
  activeIndicatorText: {
    fontSize: Typography.bodySmall.fontSize - 2,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

export default SpotlightParticipant;