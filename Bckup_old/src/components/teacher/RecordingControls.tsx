/**
 * RecordingControls - Recording start/stop/pause controls
 * Phase 18: Recording Controls
 * Provides comprehensive recording controls with timer and status display
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

interface RecordingControlsProps {
  isRecording: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  isTeacherView?: boolean;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  isTeacherView = false,
}) => {
  const { theme } = useTheme();
  const [isPaused, setIsPaused] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Animated recording indicator
  useEffect(() => {
    let animationLoop: any;
    
    if (isRecording && !isPaused) {
      const startPulseAnimation = () => {
        animationLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 0.3,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        );
        animationLoop.start();
      };
      startPulseAnimation();
    } else {
      if (animationLoop) {
        animationLoop.stop();
      }
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (animationLoop) {
        animationLoop.stop();
      }
    };
  }, [isRecording, isPaused, pulseAnim]);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },

    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    headerIcon: {
      marginRight: 8,
      color: theme.primary,
    },

    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurface,
      flex: 1,
    },

    recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.errorContainer,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.error,
      marginRight: 6,
    },

    recordingText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnErrorContainer,
    },

    timerContainer: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      alignItems: 'center',
    },

    timerText: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.OnSurface,
      fontFamily: 'monospace',
    },

    timerLabel: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      marginTop: 4,
    },

    controlsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },

    primaryButton: {
      flex: 1,
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    recordButton: {
      backgroundColor: theme.error,
    },

    pauseButton: {
      backgroundColor: theme.Tertiary,
    },

    stopButton: {
      backgroundColor: theme.Outline,
    },

    buttonIcon: {
      color: theme.OnPrimary,
    },

    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnPrimary,
    },

    infoSection: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 12,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },

    infoIcon: {
      marginRight: 8,
      color: theme.OnSurfaceVariant,
    },

    infoText: {
      fontSize: 14,
      color: theme.OnSurfaceVariant,
      flex: 1,
    },

    disabledContainer: {
      opacity: 0.6,
    },

    disabledMessage: {
      textAlign: 'center',
      color: theme.OnSurfaceVariant,
      fontSize: 14,
      fontStyle: 'italic',
      padding: 16,
    },
  });

  const styles = getStyles(theme);

  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleStartRecording = useCallback(() => {
    Alert.alert(
      'Start Recording',
      'Are you sure you want to start recording this live class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Recording',
          onPress: () => {
            onStartRecording();
            setIsPaused(false);
          },
        },
      ]
    );
  }, [onStartRecording]);

  const handleStopRecording = useCallback(() => {
    Alert.alert(
      'Stop Recording',
      'Are you sure you want to stop the recording? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Recording',
          style: 'destructive',
          onPress: () => {
            onStopRecording();
            setIsPaused(false);
          },
        },
      ]
    );
  }, [onStopRecording]);

  const handlePauseRecording = useCallback(() => {
    setIsPaused(!isPaused);
    onPauseRecording();
  }, [isPaused, onPauseRecording]);

  if (!isTeacherView) {
    return (
      <View style={[styles.container, styles.disabledContainer]}>
        <Text style={styles.disabledMessage}>
          Recording controls are only available for teachers
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon 
            name="videocam" 
            size={24} 
            style={styles.headerIcon}
          />
          <Text style={styles.title}>Class Recording</Text>
        </View>
        
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Animated.View 
              style={[
                styles.recordingDot, 
                { opacity: pulseAnim }
              ]} 
            />
            <Text style={styles.recordingText}>
              {isPaused ? 'PAUSED' : 'REC'}
            </Text>
          </View>
        )}
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {formatDuration(recordingDuration)}
        </Text>
        <Text style={styles.timerLabel}>
          {isRecording 
            ? (isPaused ? 'Recording paused' : 'Recording time') 
            : 'Ready to record'
          }
        </Text>
      </View>

      {/* Recording Controls */}
      <View style={styles.controlsRow}>
        {!isRecording ? (
          <TouchableOpacity
            style={[styles.primaryButton, styles.recordButton]}
            onPress={handleStartRecording}
            accessibilityLabel="Start recording"
          >
            <Icon name="fiber_manual_record" size={20} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Start Recording</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, styles.pauseButton]}
              onPress={handlePauseRecording}
              accessibilityLabel={isPaused ? "Resume recording" : "Pause recording"}
            >
              <Icon 
                name={isPaused ? "play_arrow" : "pause"} 
                size={20} 
                style={styles.buttonIcon} 
              />
              <Text style={styles.buttonText}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, styles.stopButton]}
              onPress={handleStopRecording}
              accessibilityLabel="Stop recording"
            >
              <Icon name="stop" size={20} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Information Section */}
      <View style={styles.infoSection}>
        {isRecording ? (
          <>
            <View style={styles.infoRow}>
              <Icon name="info" size={16} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                The class is being recorded for students who missed the session
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="storage" size={16} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Recording will be saved automatically when stopped
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Icon name="info" size={16} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Record the entire class including screen sharing and audio
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="schedule" size={16} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Maximum recording time: 3 hours per session
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export default RecordingControls;