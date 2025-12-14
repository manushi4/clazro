/**
 * RecordingStatus - Recording status display with animation
 * Phase 18: Recording Controls
 * Shows recording status with animated indicators and duration display
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

interface RecordingStatusProps {
  status: 'idle' | 'recording' | 'paused' | 'processing';
  duration: number;
  fileSize?: string;
}

const RecordingStatus: React.FC<RecordingStatusProps> = ({
  status,
  duration,
  fileSize,
}) => {
  const { theme } = useTheme();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [blinkAnim] = useState(new Animated.Value(1));

  // Pulse animation for recording status
  useEffect(() => {
    let animationLoop: any;
    
    if (status === 'recording') {
      const startPulseAnimation = () => {
        animationLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 0.4,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
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
  }, [status, pulseAnim]);

  // Blink animation for paused status
  useEffect(() => {
    let blinkLoop: any;
    
    if (status === 'paused') {
      const startBlinkAnimation = () => {
        blinkLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(blinkAnim, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(blinkAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
        blinkLoop.start();
      };
      startBlinkAnimation();
    } else {
      if (blinkLoop) {
        blinkLoop.stop();
      }
      Animated.timing(blinkAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (blinkLoop) {
        blinkLoop.stop();
      }
    };
  }, [status, blinkAnim]);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getStatusBackgroundColor(status, theme),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },

    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: getStatusDotColor(status, theme),
      marginRight: 6,
    },

    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: getStatusTextColor(status, theme),
      marginRight: 8,
    },

    durationText: {
      fontSize: 11,
      fontWeight: '500',
      color: getStatusTextColor(status, theme),
      fontFamily: 'monospace',
    },

    separator: {
      fontSize: 11,
      color: getStatusTextColor(status, theme),
      marginHorizontal: 4,
      opacity: 0.7,
    },

    fileSizeText: {
      fontSize: 10,
      fontWeight: '400',
      color: getStatusTextColor(status, theme),
      opacity: 0.8,
    },

    processingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    processingIcon: {
      marginRight: 6,
      color: getStatusTextColor(status, theme),
    },

    // Compact status badge for header
    compact: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },

    compactText: {
      fontSize: 10,
      fontWeight: '700',
    },

    compactDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },
  });

  const styles = getStyles(theme);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusLabel = (): string => {
    switch (status) {
      case 'recording':
        return 'REC';
      case 'paused':
        return 'PAUSED';
      case 'processing':
        return 'PROCESSING';
      case 'idle':
      default:
        return 'READY';
    }
  };

  const getStatusIcon = (): string => {
    switch (status) {
      case 'recording':
        return 'fiber_manual_record';
      case 'paused':
        return 'pause';
      case 'processing':
        return 'sync';
      case 'idle':
      default:
        return 'radio_button_unchecked';
    }
  };

  const renderAnimatedDot = () => {
    if (status === 'recording') {
      return (
        <Animated.View 
          style={[
            styles.statusDot, 
            { opacity: pulseAnim }
          ]} 
        />
      );
    } else if (status === 'paused') {
      return (
        <Animated.View 
          style={[
            styles.statusDot, 
            { opacity: blinkAnim }
          ]} 
        />
      );
    } else {
      return <View style={styles.statusDot} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated Status Dot */}
      {renderAnimatedDot()}
      
      {/* Status Text */}
      <Text style={styles.statusText}>
        {getStatusLabel()}
      </Text>

      {/* Duration Display */}
      {(status === 'recording' || status === 'paused' || (status === 'idle' && duration > 0)) && (
        <>
          <Text style={styles.durationText}>
            {formatDuration(duration)}
          </Text>
          
          {/* File Size Display */}
          {fileSize && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.fileSizeText}>{fileSize}</Text>
            </>
          )}
        </>
      )}

      {/* Processing Status */}
      {status === 'processing' && (
        <View style={styles.processingContainer}>
          <Animated.View style={{ transform: [{ rotate: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }) }] }}>
            <Icon 
              name={getStatusIcon()} 
              size={12} 
              style={styles.processingIcon}
            />
          </Animated.View>
        </View>
      )}
    </View>
  );
};

// Helper functions for dynamic styling
const getStatusBackgroundColor = (status: string, theme: any): string => {
  switch (status) {
    case 'recording':
      return theme.errorContainer;
    case 'paused':
      return theme.TertiaryContainer;
    case 'processing':
      return theme.primaryContainer;
    case 'idle':
    default:
      return theme.SurfaceVariant;
  }
};

const getStatusDotColor = (status: string, theme: any): string => {
  switch (status) {
    case 'recording':
      return theme.error;
    case 'paused':
      return theme.Tertiary;
    case 'processing':
      return theme.primary;
    case 'idle':
    default:
      return theme.Outline;
  }
};

const getStatusTextColor = (status: string, theme: any): string => {
  switch (status) {
    case 'recording':
      return theme.OnErrorContainer;
    case 'paused':
      return theme.OnTertiaryContainer;
    case 'processing':
      return theme.OnPrimaryContainer;
    case 'idle':
    default:
      return theme.OnSurfaceVariant;
  }
};

// Compact version for header display
const RecordingStatusCompact: React.FC<RecordingStatusProps> = (props) => {
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <RecordingStatus {...props} />
    </View>
  );
};

export default RecordingStatus;