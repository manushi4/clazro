/**
 * ParticipantCard - Individual participant management component
 * Phase 11: Basic Participant Management
 * Shows student status and provides basic audio/video controls
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import StatusBadge from '../core/StatusBadge';
import { AttendanceIndicator, AttendanceStatusDot, AttendanceStatus } from './AttendanceIndicator';

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isPresent: boolean;
  joinTime: Date;
  leaveTime?: Date;
  audioEnabled: boolean;
  videoEnabled: boolean;
  handRaised: boolean;
  connectionStatus: 'excellent' | 'good' | 'poor' | 'disconnected';
  role: 'student' | 'teacher' | 'observer';
  attendanceStatus?: AttendanceStatus;
}

interface ParticipantCardProps {
  participant: Participant;
  onToggleAudio: (id: string) => void;
  onToggleVideo: (id: string) => void;
  onToggleHandRaise: (id: string) => void;
  onRemove?: (id: string) => void;
  isTeacherView?: boolean;
  classStartTime?: Date;
  showAttendanceIndicator?: boolean;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  onToggleAudio,
  onToggleVideo,
  onToggleHandRaise,
  onRemove,
  isTeacherView = true,
  classStartTime,
  showAttendanceIndicator = true,
}) => {
  const getConnectionColor = (): string => {
    switch (participant.connectionStatus) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'poor':
        return '#FF9800';
      case 'disconnected':
        return '#F44336';
      default:
        return LightTheme.OnSurfaceVariant;
    }
  };

  const getConnectionIcon = (): string => {
    switch (participant.connectionStatus) {
      case 'excellent':
        return '📶';
      case 'good':
        return '📶';
      case 'poor':
        return '📵';
      case 'disconnected':
        return '❌';
      default:
        return '❓';
    }
  };

  const getJoinTimeText = (): string => {
    const now = new Date();
    const diffMs = now.getTime() - participant.joinTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just joined';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  const getAttendanceStatus = (): AttendanceStatus => {
    if (participant.attendanceStatus) {
      return participant.attendanceStatus;
    }
    
    // Calculate attendance status from participant data
    if (!participant.isPresent) {
      return 'absent';
    }
    
    if (participant.leaveTime) {
      return 'left-early';
    }
    
    if (classStartTime) {
      const lateMinutes = (participant.joinTime.getTime() - classStartTime.getTime()) / (1000 * 60);
      if (lateMinutes > 5) { // 5 minutes grace period
        return 'late';
      }
    }
    
    return 'present';
  };

  const renderAvatar = () => {
    const avatarContent = participant.avatar ? (
      <Text style={styles.avatarEmoji}>{participant.avatar}</Text>
    ) : (
      <View style={styles.avatarInitials}>
        <Text style={styles.avatarInitialsText}>
          {participant.name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2)}
        </Text>
      </View>
    );

    return (
      <View style={styles.avatarContainer}>
        {avatarContent}
        {showAttendanceIndicator && (
          <View style={styles.attendanceDotContainer}>
            <AttendanceStatusDot
              status={getAttendanceStatus()}
              size={10}
            />
          </View>
        )}
      </View>
    );
  };

  const renderControlButton = (
    icon: string,
    isEnabled: boolean,
    onPress: () => void,
    testId: string,
    accessibilityLabel: string
  ) => (
    <TouchableOpacity
      style={[
        styles.controlButton,
        isEnabled ? styles.enabledControl : styles.disabledControl
      ]}
      onPress={onPress}
      disabled={!isTeacherView}
      testID={testId}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isEnabled }}
    >
      <Text style={[
        styles.controlIcon,
        { opacity: isEnabled ? 1 : 0.5 }
      ]}>
        {icon}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View 
      style={[
        styles.container,
        participant.handRaised && styles.handRaisedContainer,
        !participant.isPresent && styles.absentContainer
      ]}
      testID={`participant-card-${participant.id}`}
    >
      <View style={styles.header}>
        <View style={styles.participantInfo}>
          {renderAvatar()}
          
          <View style={styles.nameSection}>
            <Text style={styles.participantName} numberOfLines={1}>
              {participant.name}
            </Text>
            
            <View style={styles.statusRow}>
              <View style={styles.connectionIndicator}>
                <Text style={styles.connectionIcon}>
                  {getConnectionIcon()}
                </Text>
                <Text 
                  style={[
                    styles.connectionText,
                    { color: getConnectionColor() }
                  ]}
                >
                  {participant.connectionStatus}
                </Text>
              </View>
              
              <Text style={styles.joinTime}>
                {getJoinTimeText()}
              </Text>
            </View>
            
            <View style={styles.badgeRow}>
              {participant.role === 'teacher' && (
                <StatusBadge
                  text="Teacher"
                  type="success"
                />
              )}
              
              {participant.handRaised && (
                <StatusBadge
                  text="Hand Raised"
                  type="warning"
                />
              )}
              
              {showAttendanceIndicator && (
                <View style={styles.attendanceIndicatorContainer}>
                  <AttendanceIndicator
                    status={getAttendanceStatus()}
                    joinTime={participant.joinTime}
                    leaveTime={participant.leaveTime}
                    classStartTime={classStartTime}
                    size="small"
                    showLabel={true}
                    showTime={false}
                  />
                </View>
              )}
              
              {!participant.isPresent && !showAttendanceIndicator && (
                <StatusBadge
                  text="Absent"
                  type="error"
                />
              )}
            </View>
          </View>
        </View>

        {participant.handRaised && (
          <View style={styles.handRaiseIndicator}>
            <Text style={styles.handRaiseIcon}>✋</Text>
          </View>
        )}
      </View>

      {/* Audio/Video Controls */}
      {participant.isPresent && (
        <View style={styles.controlsSection}>
          <View style={styles.controlsRow}>
            {renderControlButton(
              participant.audioEnabled ? '🎤' : '🔇',
              participant.audioEnabled,
              () => onToggleAudio(participant.id),
              `toggle-audio-${participant.id}`,
              `${participant.audioEnabled ? 'Mute' : 'Unmute'} ${participant.name}'s audio`
            )}
            
            {renderControlButton(
              participant.videoEnabled ? '📹' : '📷',
              participant.videoEnabled,
              () => onToggleVideo(participant.id),
              `toggle-video-${participant.id}`,
              `${participant.videoEnabled ? 'Disable' : 'Enable'} ${participant.name}'s video`
            )}
            
            {renderControlButton(
              '✋',
              participant.handRaised,
              () => onToggleHandRaise(participant.id),
              `toggle-hand-${participant.id}`,
              `${participant.handRaised ? 'Lower' : 'Raise'} ${participant.name}'s hand`
            )}

            {isTeacherView && onRemove && (
              <TouchableOpacity
                style={[styles.controlButton, styles.removeControl]}
                onPress={() => onRemove(participant.id)}
                testID={`remove-${participant.id}`}
                accessibilityLabel={`Remove ${participant.name} from class`}
              >
                <Text style={styles.controlIcon}>🚫</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isTeacherView && (
            <View style={styles.teacherActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // TODO: Phase 13 - Open private chat
                }}
                testID={`message-${participant.id}`}
              >
                <Text style={styles.actionButtonText}>💬 Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // TODO: Phase 14 - Spotlight participant
                }}
                testID={`spotlight-${participant.id}`}
              >
                <Text style={styles.actionButtonText}>⭐ Spotlight</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  handRaisedContainer: {
    borderColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
    elevation: 4,
  },
  absentContainer: {
    opacity: 0.6,
    borderColor: LightTheme.OnSurfaceVariant,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.MD,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LightTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceDotContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: LightTheme.Surface,
    borderRadius: 8,
    padding: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  avatarInitialsText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnPrimaryContainer,
  },
  nameSection: {
    flex: 1,
  },
  participantName: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.XS,
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIcon: {
    fontSize: 12,
    marginRight: Spacing.XS,
  },
  connectionText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  joinTime: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.XS,
  },
  attendanceIndicatorContainer: {
    alignItems: 'flex-start',
  },
  handRaiseIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  handRaiseIcon: {
    fontSize: 24,
  },
  controlsSection: {
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
    paddingTop: Spacing.SM,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.SM,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  enabledControl: {
    backgroundColor: LightTheme.primaryContainer,
    borderColor: LightTheme.Primary,
  },
  disabledControl: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderColor: LightTheme.OutlineVariant,
  },
  removeControl: {
    backgroundColor: LightTheme.errorContainer,
    borderColor: LightTheme.Error,
  },
  controlIcon: {
    fontSize: 16,
  },
  teacherActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: LightTheme.SurfaceVariant,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
});

export default ParticipantCard;