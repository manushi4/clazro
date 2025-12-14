import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LiveSession, liveClassService } from '../../services/realtime/LiveClassService';
import { format, differenceInMinutes } from 'date-fns';

interface LiveClassIndicatorProps {
  session: LiveSession;
  onJoin?: (session: LiveSession) => void;
  onLeave?: (session: LiveSession) => void;
  onViewDetails?: (session: LiveSession) => void;
  compact?: boolean;
}

const LiveClassIndicator: React.FC<LiveClassIndicatorProps> = ({
  session,
  onJoin,
  onLeave,
  onViewDetails,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState<number>(0);
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if user is already a participant
    const participant = session.current_participants?.find(p => p.user_id === user?.id);
    setIsParticipant(!!participant);

    // Calculate time until start or duration since start
    const now = new Date().getTime();
    const startTime = new Date(session.scheduled_start_at).getTime();
    const endTime = new Date(session.scheduled_end_at).getTime();

    if (session.status === 'scheduled') {
      setTimeUntilStart(Math.max(0, startTime - now));
    } else if (session.status === 'live') {
      const actualStart = session.actual_start_at ? new Date(session.actual_start_at).getTime() : startTime;
      setSessionDuration(now - actualStart);
    }

    // Update time every minute
    const interval = setInterval(() => {
      const currentTime = new Date().getTime();
      
      if (session.status === 'scheduled') {
        setTimeUntilStart(Math.max(0, startTime - currentTime));
      } else if (session.status === 'live') {
        const actualStart = session.actual_start_at ? new Date(session.actual_start_at).getTime() : startTime;
        setSessionDuration(currentTime - actualStart);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [session, user?.id]);

  useEffect(() => {
    // Animate entry
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Pulse animation for live sessions
    if (session.status === 'live') {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    }

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [session.status]);

  const handleJoinClass = async () => {
    if (isJoining) return;

    try {
      setIsJoining(true);
      await liveClassService.joinSession(session.id);
      setIsParticipant(true);
      onJoin?.(session);
    } catch (error) {
      Alert.alert('error', 'Failed to join the class. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveClass = async () => {
    if (isLeaving) return;

    try {
      setIsLeaving(true);
      await liveClassService.leaveSession(session.id);
      setIsParticipant(false);
      onLeave?.(session);
    } catch (error) {
      Alert.alert('error', 'Failed to leave the class. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  const getStatusColor = () => {
    switch (session.status) {
      case 'live':
        return theme.error;
      case 'starting':
        return theme.warning;
      case 'scheduled':
        return theme.primary;
      case 'ended':
        return theme.SurfaceVariant;
      default:
        return theme.OnSurfaceVariant;
    }
  };

  const getStatusText = () => {
    switch (session.status) {
      case 'live':
        return 'LIVE';
      case 'starting':
        return 'Starting...';
      case 'scheduled':
        return 'Scheduled';
      case 'ended':
        return 'Ended';
      case 'cancelled':
        return 'Cancelled';
      default:
        return session.status.toUpperCase();
    }
  };

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatTimeUntilStart = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `Starts in ${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `Starts in ${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `Starts in ${minutes}m`;
    } else {
      return 'Starting now';
    }
  };

  const canJoin = () => {
    return ['scheduled', 'starting', 'live'].includes(session.status) && !isParticipant;
  };

  const canLeave = () => {
    return ['live', 'starting'].includes(session.status) && isParticipant;
  };

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          {
            backgroundColor: theme.Surface,
            borderLeftColor: getStatusColor(),
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.compactContent}
          onPress={() => onViewDetails?.(session)}
        >
          <Animated.View
            style={[
              styles.statusDot,
              {
                backgroundColor: getStatusColor(),
                transform: [{ scale: session.status === 'live' ? pulseAnim : 1 }],
              },
            ]}
          />
          <View style={styles.compactText}>
            <Text style={[styles.compactTitle, { color: theme.OnSurface }]} numberOfLines={1}>
              {session.session_name}
            </Text>
            <Text style={[styles.compactStatus, { color: theme.OnSurfaceVariant }]}>
              {getStatusText()}
            </Text>
          </View>
          {session.participant_count && session.participant_count > 0 && (
            <View style={styles.participantBadge}>
              <Icon name="people" size={14} color={theme.OnSurfaceVariant} />
              <Text style={[styles.participantCount, { color: theme.OnSurfaceVariant }]}>
                {session.participant_count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.Surface,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: getStatusColor(),
                transform: [{ scale: session.status === 'live' ? pulseAnim : 1 }],
              },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.OnPrimary }]}>
              {getStatusText()}
            </Text>
          </Animated.View>
          <View style={styles.sessionInfo}>
            <Text style={[styles.sessionName, { color: theme.OnSurface }]}>
              {session.session_name}
            </Text>
            {session.description && (
              <Text style={[styles.sessionDescription, { color: theme.OnSurfaceVariant }]} numberOfLines={2}>
                {session.description}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => onViewDetails?.(session)}>
          <Icon name="more-vert" size={24} color={theme.OnSurface} />
        </TouchableOpacity>
      </View>

      <View style={styles.timeInfo}>
        <View style={styles.timeItem}>
          <Icon name="schedule" size={16} color={theme.OnSurfaceVariant} />
          <Text style={[styles.timeText, { color: theme.OnSurfaceVariant }]}>
            {format(new Date(session.scheduled_start_at), 'h:mm a')} - {format(new Date(session.scheduled_end_at), 'h:mm a')}
          </Text>
        </View>
        
        {session.status === 'scheduled' && timeUntilStart > 0 && (
          <View style={styles.timeItem}>
            <Icon name="access-time" size={16} color={theme.OnSurfaceVariant} />
            <Text style={[styles.timeText, { color: theme.OnSurfaceVariant }]}>
              {formatTimeUntilStart(timeUntilStart)}
            </Text>
          </View>
        )}

        {session.status === 'live' && sessionDuration > 0 && (
          <View style={styles.timeItem}>
            <Icon name="play-circle-filled" size={16} color={theme.error} />
            <Text style={[styles.timeText, { color: theme.error }]}>
              Live for {formatDuration(sessionDuration)}
            </Text>
          </View>
        )}

        {session.participant_count && session.participant_count > 0 && (
          <View style={styles.timeItem}>
            <Icon name="people" size={16} color={theme.OnSurfaceVariant} />
            <Text style={[styles.timeText, { color: theme.OnSurfaceVariant }]}>
              {session.participant_count} participant{session.participant_count !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {canJoin() && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.joinButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleJoinClass}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color={theme.OnPrimary} />
            ) : (
              <>
                <Icon name="videocam" size={20} color={theme.OnPrimary} />
                <Text style={[styles.actionButtonText, { color: theme.OnPrimary }]}>
                  Join Class
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {canLeave() && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.leaveButton,
              { backgroundColor: theme.error },
            ]}
            onPress={handleLeaveClass}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <ActivityIndicator size="small" color={theme.OnError} />
            ) : (
              <>
                <Icon name="exit-to-app" size={20} color={theme.OnError} />
                <Text style={[styles.actionButtonText, { color: theme.OnError }]}>
                  Leave Class
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {session.status === 'ended' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.background, borderColor: theme.Outline, borderWidth: 1 },
            ]}
            onPress={() => onViewDetails?.(session)}
          >
            <Icon name="history" size={20} color={theme.OnSurface} />
            <Text style={[styles.actionButtonText, { color: theme.OnSurface }]}>
              View Recording
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = {
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  compactContainer: {
    borderRadius: 8,
    borderLeftWidth: 4,
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compactText: {
    flex: 1,
    marginLeft: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  compactStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  statusIndicator: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  sessionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  timeInfo: {
    marginBottom: 16,
  },
  timeItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 13,
    marginLeft: 6,
  },
  participantBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  participantCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    marginHorizontal: 4,
  },
  joinButton: {
    // Additional styles for join button
  },
  leaveButton: {
    // Additional styles for leave button
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 6,
  },
};

export default LiveClassIndicator;