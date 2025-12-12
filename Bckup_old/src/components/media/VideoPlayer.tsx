/**
 * Advanced Video Player Component
 * Video playback with controls and streaming optimization
 * Phase 73: File Upload & Media Management
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme, PrimaryColors, SemanticColors } from '../../theme/colors';
import { cdnService, VideoStreamingOptions } from '../../services/storage/CDNService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface VideoPlayerProps {
  source: {
    uri: string;
    bucket?: string;
    path?: string;
  };
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  quality?: VideoStreamingOptions['quality'];
  onLoadStart?: () => void;
  onLoad?: (data: any) => void;
  onProgress?: (data: any) => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  style?: any;
  showControls?: boolean;
  enableFullscreen?: boolean;
  enableQualitySelector?: boolean;
  enablePlaybackSpeed?: boolean;
}

interface VideoState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  playbackRate: number;
  quality: string;
  error?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  title,
  poster,
  autoPlay = false,
  loop = false,
  muted = false,
  resizeMode = 'contain',
  quality = 'auto',
  onLoadStart,
  onLoad,
  onProgress,
  onEnd,
  onError,
  onFullscreenToggle,
  style,
  showControls = true,
  enableFullscreen = true,
  enableQualitySelector = false,
  enablePlaybackSpeed = false,
}) => {
  const videoRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: autoPlay,
    isPaused: !autoPlay,
    isLoading: false,
    isBuffering: false,
    isFullscreen: false,
    showControls: showControls,
    duration: 0,
    currentTime: 0,
    volume: muted ? 0 : 1,
    playbackRate: 1,
    quality: quality || 'auto',
  });

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  // Pan responder for seeking
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsSeeking(true);
      const progressBarWidth = screenWidth - 40;
      const position = Math.max(0, Math.min(evt.nativeEvent.locationX, progressBarWidth));
      const percentage = position / progressBarWidth;
      setSeekPosition(percentage * videoState.duration);
    },
    onPanResponderMove: (evt) => {
      const progressBarWidth = screenWidth - 40;
      const position = Math.max(0, Math.min(evt.nativeEvent.locationX, progressBarWidth));
      const percentage = position / progressBarWidth;
      setSeekPosition(percentage * videoState.duration);
    },
    onPanResponderRelease: () => {
      videoRef.current?.seek(seekPosition);
      setIsSeeking(false);
      
      // Clear timeout and set new one
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      
      seekTimeoutRef.current = setTimeout(() => {
        setVideoState(prev => ({ ...prev, currentTime: seekPosition }));
      }, 100);
    },
  });

  // Get optimized video URL
  const getVideoUrl = useCallback(() => {
    if (source.bucket && source.path) {
      const streamingOptions: VideoStreamingOptions = {
        quality: videoState.quality as VideoStreamingOptions['quality'],
      };
      return cdnService.getVideoUrl(source.bucket, source.path, streamingOptions);
    }
    return source.uri;
  }, [source, videoState.quality]);

  // Controls visibility management
  const showControlsTemporarily = useCallback(() => {
    setVideoState(prev => ({ ...prev, showControls: true }));
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoState.isPlaying) {
        setVideoState(prev => ({ ...prev, showControls: false }));
      }
    }, 3000);
  }, [videoState.isPlaying]);

  // Video event handlers
  const handleLoadStart = useCallback(() => {
    setVideoState(prev => ({ ...prev, isLoading: true }));
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoad = useCallback((data: any) => {
    setVideoState(prev => ({
      ...prev,
      isLoading: false,
      duration: data.duration,
    }));
    onLoad?.(data);
  }, [onLoad]);

  const handleProgress = useCallback((data: any) => {
    if (!isSeeking) {
      setVideoState(prev => ({
        ...prev,
        currentTime: data.currentTime,
        isBuffering: false,
      }));
    }
    onProgress?.(data);
  }, [isSeeking, onProgress]);

  const handleEnd = useCallback(() => {
    setVideoState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
      currentTime: prev.duration,
      showControls: true,
    }));
    onEnd?.();
  }, [onEnd]);

  const handleError = useCallback((error: any) => {
    setVideoState(prev => ({
      ...prev,
      isLoading: false,
      error: error.error?.errorString || 'Video playback error',
    }));
    onError?.(error);
    Alert.alert('Video Error', 'Failed to load video. Please try again.');
  }, [onError]);

  const handleBuffer = useCallback((meta: any) => {
    setVideoState(prev => ({
      ...prev,
      isBuffering: meta.isBuffering,
    }));
  }, []);

  // Control actions
  const togglePlay = useCallback(() => {
    setVideoState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
      isPaused: prev.isPlaying,
    }));
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const toggleMute = useCallback(() => {
    setVideoState(prev => ({
      ...prev,
      volume: prev.volume > 0 ? 0 : 1,
    }));
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const toggleFullscreen = useCallback(() => {
    if (!enableFullscreen) return;
    
    const newFullscreenState = !videoState.isFullscreen;
    setVideoState(prev => ({
      ...prev,
      isFullscreen: newFullscreenState,
      showControls: true,
    }));
    
    onFullscreenToggle?.(newFullscreenState);
  }, [enableFullscreen, videoState.isFullscreen, onFullscreenToggle]);

  const changePlaybackRate = useCallback((rate: number) => {
    setVideoState(prev => ({ ...prev, playbackRate: rate }));
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const changeQuality = useCallback((newQuality: string) => {
    setVideoState(prev => ({ ...prev, quality: newQuality }));
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get progress percentage
  const getProgressPercentage = useCallback((): number => {
    if (videoState.duration === 0) return 0;
    return (videoState.currentTime / videoState.duration) * 100;
  }, [videoState.currentTime, videoState.duration]);

  // Get buffer percentage (placeholder - would need actual buffer data)
  const getBufferPercentage = useCallback((): number => {
    // This would be calculated from actual buffer data
    return Math.min(getProgressPercentage() + 10, 100);
  }, [getProgressPercentage]);

  // Touch handlers
  const handleVideoPress = useCallback(() => {
    if (showControls) {
      showControlsTemporarily();
    } else {
      setVideoState(prev => ({ ...prev, showControls: !prev.showControls }));
    }
  }, [showControls, showControlsTemporarily]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, []);

  const containerStyle = [
    styles.container,
    videoState.isFullscreen && styles.fullscreenContainer,
    style,
  ];

  const videoStyle = [
    styles.video,
    videoState.isFullscreen && styles.fullscreenVideo,
  ];

  const renderControls = () => {
    if (!showControls || !videoState.showControls) return null;

    return (
      <View style={[styles.controlsOverlay, videoState.isFullscreen && styles.fullscreenControlsOverlay]}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          {title && (
            <Text style={styles.videoTitle} numberOfLines={1}>
              {title}
            </Text>
          )}
          
          <View style={styles.topControlsRight}>
            {enableQualitySelector && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => {
                  // Show quality selector
                  Alert.alert(
                    'Video Quality',
                    'Select video quality',
                    [
                      { text: 'Auto', onPress: () => changeQuality('auto') },
                      { text: '720p', onPress: () => changeQuality('720p') },
                      { text: '480p', onPress: () => changeQuality('480p') },
                      { text: '360p', onPress: () => changeQuality('360p') },
                    ]
                  );
                }}
              >
                <Text style={styles.qualityText}>{videoState.quality.toUpperCase()}</Text>
              </TouchableOpacity>
            )}
            
            {videoState.isFullscreen && (
              <TouchableOpacity style={styles.controlButton} onPress={toggleFullscreen}>
                <Icon name="fullscreen-exit" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Center Controls */}
        <View style={styles.centerControls}>
          {videoState.isLoading || videoState.isBuffering ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
              <Icon
                name={videoState.isPlaying ? 'pause' : 'play-arrow'}
                size={48}
                color="white"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>
              {formatTime(isSeeking ? seekPosition : videoState.currentTime)}
            </Text>
            
            <View style={styles.progressBarContainer} {...panResponder.panHandlers}>
              <View style={styles.progressBar}>
                {/* Buffer Progress */}
                <View
                  style={[
                    styles.bufferProgress,
                    { width: `${getBufferPercentage()}%` },
                  ]}
                />
                
                {/* Play Progress */}
                <View
                  style={[
                    styles.playProgress,
                    { width: `${getProgressPercentage()}%` },
                  ]}
                />
                
                {/* Seek Thumb */}
                <View
                  style={[
                    styles.progressThumb,
                    { left: `${getProgressPercentage()}%` },
                  ]}
                />
              </View>
            </View>
            
            <Text style={styles.timeText}>
              {formatTime(videoState.duration)}
            </Text>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlButtonsContainer}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
              <Icon
                name={videoState.volume === 0 ? 'volume-off' : 'volume-up'}
                size={20}
                color="white"
              />
            </TouchableOpacity>

            {enablePlaybackSpeed && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => {
                  Alert.alert(
                    'Playback Speed',
                    'Select playback speed',
                    [
                      { text: '0.5x', onPress: () => changePlaybackRate(0.5) },
                      { text: '0.75x', onPress: () => changePlaybackRate(0.75) },
                      { text: '1x', onPress: () => changePlaybackRate(1) },
                      { text: '1.25x', onPress: () => changePlaybackRate(1.25) },
                      { text: '1.5x', onPress: () => changePlaybackRate(1.5) },
                      { text: '2x', onPress: () => changePlaybackRate(2) },
                    ]
                  );
                }}
              >
                <Text style={styles.speedText}>{videoState.playbackRate}x</Text>
              </TouchableOpacity>
            )}

            {enableFullscreen && !videoState.isFullscreen && (
              <TouchableOpacity style={styles.controlButton} onPress={toggleFullscreen}>
                <Icon name="fullscreen" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={containerStyle}>
      {videoState.isFullscreen && Platform.OS === 'android' && (
        <StatusBar hidden />
      )}
      
      <TouchableOpacity
        style={videoStyle}
        activeOpacity={1}
        onPress={handleVideoPress}
      >
        <Video
          ref={videoRef}
          source={{ uri: getVideoUrl() }}
          poster={poster}
          style={StyleSheet.absoluteFillObject}
          resizeMode={resizeMode}
          paused={videoState.isPaused}
          volume={videoState.volume}
          rate={videoState.playbackRate}
          playWhenInactive={false}
          playInBackground={false}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={handleError}
          onBuffer={handleBuffer}
          repeat={loop}
          controls={false}
        />
      </TouchableOpacity>

      {renderControls()}

      {videoState.error && (
        <View style={styles.errorOverlay}>
          <Icon name="error" size={48} color={SemanticColors.Error} />
          <Text style={styles.errorText}>{videoState.error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setVideoState(prev => ({ ...prev, error: undefined }))}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
    zIndex: 1000,
  },
  video: {
    flex: 1,
  },
  fullscreenVideo: {
    width: screenWidth,
    height: screenHeight,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    padding: 16,
  },
  fullscreenControlsOverlay: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  topControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 16,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomControls: {
    gap: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  bufferProgress: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
  },
  playProgress: {
    position: 'absolute',
    height: '100%',
    backgroundColor: PrimaryColors.primary500,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: PrimaryColors.primary500,
    borderRadius: 8,
    marginLeft: -8,
  },
  controlButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    borderRadius: 4,
  },
  qualityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  speedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  retryButton: {
    backgroundColor: PrimaryColors.primary500,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VideoPlayer;
export { VideoPlayer };