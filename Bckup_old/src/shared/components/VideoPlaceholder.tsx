/**
 * VideoPlaceholder - Production-Ready Video Component
 * Purpose: Polished video placeholder with loading states and professional UI
 * Used in: Virtual classroom, live class, and enhanced live class screens
 *
 * Note: This is a placeholder component ready for video service integration.
 * To integrate real video, replace the placeholder content with:
 * - Agora Video SDK
 * - Jitsi Meet SDK
 * - Twilio Video
 * - react-native-webrtc
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { T } from '../../ui';

interface VideoPlaceholderProps {
  /** Stream ID or class ID for the video */
  streamId?: string;
  /** Whether this is a live stream */
  isLive?: boolean;
  /** Aspect ratio (default 16:9) */
  aspectRatio?: number;
  /** Show controls overlay */
  showControls?: boolean;
  /** Custom placeholder message */
  placeholderMessage?: string;
}

export function VideoPlaceholder({
  streamId,
  isLive = false,
  aspectRatio = 16 / 9,
  showControls = true,
  placeholderMessage,
}: VideoPlaceholderProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate connection attempt
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false);
      // In production, this would check for real video service availability
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Calculate height based on aspect ratio
  const containerStyle = {
    aspectRatio,
  };

  if (isConnecting) {
    return (
      <View style={[styles.container, styles.loadingContainer, containerStyle]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <T variant="body" style={styles.loadingText}>
          Connecting to stream...
        </T>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, containerStyle]}>
        <T variant="h2">⚠️</T>
        <T variant="body" weight="semiBold" style={styles.errorText}>
          Connection Failed
        </T>
        <T variant="caption" style={styles.errorSubtext}>
          {error}
        </T>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setIsConnecting(true);
          }}
        >
          <T variant="body" weight="semiBold" style={styles.retryText}>
            Retry
          </T>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Video Placeholder Content */}
      <View style={styles.videoContent}>
        {/* Live Indicator */}
        {isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <T variant="caption" weight="bold" style={styles.liveText}>
              LIVE
            </T>
          </View>
        )}

        {/* Center Content */}
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <T variant="display" style={styles.videoIcon}>
              📹
            </T>
          </View>
          <T variant="title" weight="semiBold" style={styles.placeholderTitle}>
            {placeholderMessage || 'Video Stream Ready'}
          </T>
          <T variant="caption" style={styles.placeholderSubtitle}>
            Video service integration pending
          </T>
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <T variant="caption" style={styles.infoText}>
            💡 To enable video: Integrate Agora, Jitsi, or Twilio
          </T>
        </View>
      </View>

      {/* Controls Overlay (if enabled) */}
      {showControls && (
        <View style={styles.controlsOverlay}>
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlButton}>
              <T variant="body">🎤</T>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <T variant="body">📷</T>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <T variant="body">🔊</T>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <T variant="body">⚙️</T>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#9CA3AF',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: {
    color: '#F87171',
  },
  errorSubtext: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
  },
  videoContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 200,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  videoIcon: {
    fontSize: 40,
  },
  placeholderTitle: {
    color: '#F9FAFB',
    textAlign: 'center',
  },
  placeholderSubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomInfo: {
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  infoText: {
    color: '#D1D5DB',
    textAlign: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
