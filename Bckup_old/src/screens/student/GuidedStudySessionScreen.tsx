/**
 * GuidedStudySessionScreen - Focus Mode Study Session
 * Purpose: Full-focus session with countdown timer and simple controls
 * Design: Complete Framer design system with circular timer and focus UI
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Row, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type SessionMode = 'focus' | 'pomodoro';
type SessionState = 'running' | 'paused' | 'completed';

interface Props {
  route: {
    params: {
      topic?: string;
      mode?: SessionMode;
      duration?: number; // in minutes
      fromPlan?: string;
    };
  };
  navigation: any;
}

// Framer Design Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  timerRing: '#2D5BFF',
  timerRingBg: '#E5E7EB',
  pausedColor: '#F59E0B',
};

// Icon Container Component
const IconContainer = ({ iconName, color, size = 40, onPress }: {
  iconName: string;
  color: string;
  size?: number;
  onPress?: () => void;
}) => (
  <Pressable
    style={[styles.iconContainer, { backgroundColor: `${color}26`, width: size, height: size, borderRadius: size / 3.2 }]}
    onPress={onPress}
    accessibilityRole="button"
  >
    <Icon name={iconName} size={size * 0.5} color={color} />
  </Pressable>
);

// Info Chip Component
const InfoChip = ({ label, color = FRAMER_COLORS.primary }: { label: string; color?: string }) => (
  <View style={[styles.infoChip, { backgroundColor: `${color}1A` }]}>
    <T style={StyleSheet.flatten([styles.infoChipText, { color }])}>{label}</T>
  </View>
);

// Control Button Component
const ControlButton = ({ icon, label, onPress, variant = 'default', disabled = false }: {
  icon: string;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}) => {
  const getButtonStyle = () => {
    if (disabled) return { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' };
    switch (variant) {
      case 'primary':
        return { backgroundColor: FRAMER_COLORS.primary };
      case 'danger':
        return { backgroundColor: FRAMER_COLORS.danger };
      default:
        return { backgroundColor: FRAMER_COLORS.cardBg, borderWidth: 1, borderColor: '#E5E7EB' };
    }
  };

  const getTextColor = () => {
    if (disabled) return FRAMER_COLORS.textTertiary;
    return variant === 'default' ? FRAMER_COLORS.textPrimary : '#FFFFFF';
  };

  return (
    <Pressable
      style={[styles.controlButton, getButtonStyle()]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} size={24} color={getTextColor()} />
      <T style={StyleSheet.flatten([styles.controlButtonText, { color: getTextColor() }])}>{label}</T>
    </Pressable>
  );
};

export default function GuidedStudySessionScreen({ route, navigation }: Props) {
  const {
    topic = 'Algebra – Linear equations',
    mode = 'focus',
    duration = 25,
    fromPlan
  } = route.params || {};

  const [sessionState, setSessionState] = useState<SessionState>('running');
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds

  useEffect(() => {
    trackScreenView('GuidedStudySessionScreen');
  }, []);

  // Timer logic
  useEffect(() => {
    if (sessionState !== 'running') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setSessionState('completed');
          trackAction('session_completed', 'GuidedStudySessionScreen', { topic, mode, duration });
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState, topic, mode, duration]);

  // Format time MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = ((duration * 60 - timeRemaining) / (duration * 60)) * 100;

  // Handle pause/resume
  const handlePauseResume = useCallback(() => {
    if (sessionState === 'running') {
      setSessionState('paused');
      trackAction('session_paused', 'GuidedStudySessionScreen', { topic, timeRemaining });
    } else if (sessionState === 'paused') {
      setSessionState('running');
      trackAction('session_resumed', 'GuidedStudySessionScreen', { topic, timeRemaining });
    }
  }, [sessionState, topic, timeRemaining]);

  // Handle end session
  const handleEndSession = useCallback(() => {
    Alert.alert(
      'End session?',
      'Are you sure you want to end this study session? Your progress will be saved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => {
            trackAction('session_ended_early', 'GuidedStudySessionScreen', { topic, timeRemaining });
            navigation.goBack();
          },
        },
      ]
    );
  }, [navigation, topic, timeRemaining]);

  // Handle close with confirmation
  const handleClose = useCallback(() => {
    if (sessionState === 'completed') {
      navigation.goBack();
      return;
    }
    handleEndSession();
  }, [sessionState, navigation, handleEndSession]);

  // Get instruction text based on mode
  const getInstructionText = (): string => {
    if (sessionState === 'completed') {
      return '🎉 Session completed! Great work!';
    }
    if (mode === 'pomodoro') {
      return 'Focus: Work deeply without distractions during this Pomodoro.';
    }
    return 'Focus: Solve 3–5 practice questions without checking your phone.';
  };

  const getSubtext = (): string => {
    if (sessionState === 'completed') {
      return 'Review what you learned and mark tasks as complete.';
    }
    if (sessionState === 'paused') {
      return 'Session paused. Resume when ready.';
    }
    return 'You can pause, but try not to 😉';
  };

  return (
    <BaseScreen backgroundColor={FRAMER_COLORS.background}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.container}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <View style={styles.headerLeft}>
              <T style={styles.heroTitle}>Guided study session</T>
            </View>
            <IconContainer
              iconName="close"
              color={FRAMER_COLORS.textSecondary}
              size={40}
              onPress={handleClose}
            />
          </Animated.View>

          {/* Session Info Card */}
          <Animated.View entering={FadeInUp.delay(100).springify().stiffness(120).damping(15)} style={styles.infoCard}>
            <T style={styles.topicLabel}>Topic: {topic}</T>
            <Row style={styles.modeRow}>
              <T style={styles.modeText}>
                Mode: {mode === 'focus' ? 'Focus' : 'Pomodoro'} • {duration} min
              </T>
            </Row>
            {fromPlan && (
              <InfoChip label={`From plan: ${fromPlan}`} color={FRAMER_COLORS.success} />
            )}
          </Animated.View>

          {/* Timer Section */}
          <Animated.View entering={FadeInUp.delay(200).springify().stiffness(120).damping(15)} style={styles.timerSection}>
            {/* Circular Timer Ring (Visual representation) */}
            <View style={styles.timerRingContainer}>
              <View style={styles.timerRingBg} />
              <View
                style={[
                  styles.timerRingProgress,
                  {
                    transform: [{ rotate: `${progressPercentage * 3.6}deg` }],
                    opacity: sessionState === 'paused' ? 0.5 : 1,
                  }
                ]}
              />
              <View style={styles.timerInner}>
                <T style={styles.timerText}>{formatTime(timeRemaining)}</T>
                {sessionState === 'paused' && (
                  <View style={[styles.statusPill, { backgroundColor: `${FRAMER_COLORS.pausedColor}26` }]}>
                    <T style={StyleSheet.flatten([styles.statusPillText, { color: FRAMER_COLORS.pausedColor }])}>
                      Paused
                    </T>
                  </View>
                )}
                {sessionState === 'completed' && (
                  <View style={[styles.statusPill, { backgroundColor: `${FRAMER_COLORS.success}26` }]}>
                    <T style={StyleSheet.flatten([styles.statusPillText, { color: FRAMER_COLORS.success }])}>
                      Completed
                    </T>
                  </View>
                )}
              </View>
            </View>

            {/* Instruction Text */}
            <T style={styles.instructionText}>{getInstructionText()}</T>
            <T style={styles.subtextText}>{getSubtext()}</T>
          </Animated.View>

          {/* Controls Row */}
          <Animated.View entering={FadeInUp.delay(300).springify().stiffness(120).damping(15)} style={styles.controlsCard}>
            <Row style={styles.controlsRow}>
              <ControlButton
                icon={sessionState === 'running' ? 'pause' : 'play-arrow'}
                label={sessionState === 'running' ? 'Pause' : 'Resume'}
                onPress={handlePauseResume}
                variant="primary"
                disabled={sessionState === 'completed'}
              />
              <ControlButton
                icon="stop"
                label="End Session"
                onPress={handleEndSession}
                variant="danger"
                disabled={sessionState === 'completed'}
              />
            </Row>
          </Animated.View>

          {/* Next Steps / Tips Card */}
          <Animated.View entering={FadeInUp.delay(400).springify().stiffness(120).damping(15)} style={styles.tipsCard}>
            <T style={styles.tipsTitle}>Next steps</T>
            <View style={styles.tipsList}>
              <Row style={styles.tipRow}>
                <Icon name="check-circle" size={20} color={FRAMER_COLORS.success} />
                <T style={styles.tipText}>Mark completed tasks in Task hub.</T>
              </Row>
              <Row style={styles.tipRow}>
                <Icon name="note" size={20} color={FRAMER_COLORS.primary} />
                <T style={styles.tipText}>Write quick notes about what you studied.</T>
              </Row>
              <Row style={styles.tipRow}>
                <Icon name="schedule" size={20} color={FRAMER_COLORS.warning} />
                <T style={styles.tipText}>Take a 5-minute break before your next session.</T>
              </Row>
            </View>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                trackAction('open_task_hub_from_session', 'GuidedStudySessionScreen');
                navigation.navigate('TaskHubScreen');
              }}
              accessibilityRole="button"
              accessibilityLabel="Open Task Hub"
            >
              <T style={styles.actionButtonText}>Open Task Hub</T>
              <Icon name="arrow-forward" size={20} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    lineHeight: 36,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Session Info Card
  infoCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  topicLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 8,
  },
  modeRow: {
    marginBottom: 12,
  },
  modeText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  infoChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Timer Section
  timerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerRingContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  timerRingBg: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 12,
    borderColor: FRAMER_COLORS.timerRingBg,
  },
  timerRingProgress: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 12,
    borderColor: FRAMER_COLORS.timerRing,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  timerInner: {
    width: 200,
    height: 200,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    letterSpacing: -1,
  },
  statusPill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subtextText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Controls Card
  controlsCard: {
    marginBottom: 24,
  },
  controlsRow: {
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Tips Card
  tipsCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
    marginBottom: 20,
  },
  tipRow: {
    gap: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: FRAMER_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
