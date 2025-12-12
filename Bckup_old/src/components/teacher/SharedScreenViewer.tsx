/**
 * SharedScreenViewer - Screen sharing viewer component
 * Phase 17: Screen Sharing UI
 * Displays shared screen content with fullscreen capability
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SharedScreenViewerProps {
  streamUrl?: string;
  isVisible: boolean;
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
  onClose?: () => void;
  sharerName?: string;
  isTeacherView?: boolean;
}

const SharedScreenViewer: React.FC<SharedScreenViewerProps> = ({
  streamUrl,
  isVisible = false,
  isFullscreen,
  onFullscreenToggle,
  onClose,
  sharerName = 'Teacher',
  isTeacherView = false,
}) => {
  const { theme } = useTheme();
  const [showControls, setShowControls] = useState(true);
  const [lastTapTime, setLastTapTime] = useState(0);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      overflow: 'hidden',
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
      padding: 12,
      backgroundColor: theme.SurfaceVariant,
      borderBottomWidth: 1,
      borderBottomColor: theme.Outline,
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

    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurface,
      flex: 1,
    },

    headerSubtitle: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      marginTop: 2,
    },

    headerControls: {
      flexDirection: 'row',
      gap: 8,
    },

    headerButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.Surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    viewerContainer: {
      backgroundColor: '#000000',
      aspectRatio: 16/9,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },

    placeholderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },

    placeholderIcon: {
      color: '#ffffff',
      marginBottom: 16,
      opacity: 0.7,
    },

    placeholderTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: 8,
    },

    placeholderSubtitle: {
      fontSize: 14,
      color: '#ffffff',
      textAlign: 'center',
      opacity: 0.8,
      lineHeight: 20,
    },

    connectingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      marginTop: 16,
    },

    connectingText: {
      color: '#ffffff',
      fontSize: 14,
      marginLeft: 8,
    },

    overlayControls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
    },

    overlayLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    overlayText: {
      color: '#ffffff',
      fontSize: 12,
      marginLeft: 8,
    },

    overlayRight: {
      flexDirection: 'row',
      gap: 8,
    },

    overlayButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Fullscreen modal styles
    fullscreenModal: {
      flex: 1,
      backgroundColor: '#000000',
    },

    fullscreenContainer: {
      flex: 1,
      position: 'relative',
    },

    fullscreenViewer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    fullscreenControls: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 20, // Status bar padding
      paddingHorizontal: 16,
      paddingBottom: 12,
    },

    fullscreenTitle: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },

    fullscreenButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },

    noStreamMessage: {
      textAlign: 'center',
      color: theme.OnSurfaceVariant,
      fontSize: 14,
      fontStyle: 'italic',
      padding: 20,
    },
  });

  const styles = getStyles(theme);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime < 300) {
      onFullscreenToggle();
    }
    setLastTapTime(now);
  }, [lastTapTime, onFullscreenToggle]);

  const handleControlsToggle = useCallback(() => {
    if (isFullscreen) {
      setShowControls(!showControls);
    }
  }, [isFullscreen, showControls]);

  const handleScreenshotCapture = useCallback(() => {
    Alert.alert(
      'Screenshot Captured',
      'The current shared screen has been saved to your device.',
      [{ text: 'OK' }]
    );
  }, []);

  const renderStreamContent = () => {
    if (!streamUrl && !isVisible) {
      return (
        <View style={styles.placeholderContainer}>
          <Icon name="desktop_access_disabled" size={64} style={styles.placeholderIcon} />
          <Text style={styles.placeholderTitle}>No Screen Shared</Text>
          <Text style={styles.placeholderSubtitle}>
            The teacher hasn't started sharing their screen yet.
            {'\n'}Screen sharing will appear here when available.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.placeholderContainer}>
        <Icon name="screen_share" size={64} style={styles.placeholderIcon} />
        <Text style={styles.placeholderTitle}>
          {sharerName}'s Screen
        </Text>
        <Text style={styles.placeholderSubtitle}>
          {streamUrl 
            ? "Screen content will be displayed here in the actual implementation"
            : "Connecting to shared screen..."}
        </Text>
        
        {!streamUrl && (
          <View style={styles.connectingIndicator}>
            <Icon name="sync" size={16} color="#ffffff" />
            <Text style={styles.connectingText}>Connecting...</Text>
          </View>
        )}
      </View>
    );
  };

  const renderOverlayControls = () => {
    if (!showControls || !isVisible) return null;

    return (
      <View style={styles.overlayControls}>
        <View style={styles.overlayLeft}>
          <Icon name="visibility" size={16} color="#ffffff" />
          <Text style={styles.overlayText}>Live</Text>
        </View>
        
        <View style={styles.overlayRight}>
          <TouchableOpacity
            style={styles.overlayButton}
            onPress={handleScreenshotCapture}
            accessibilityLabel="Capture screenshot"
          >
            <Icon name="camera_alt" size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.overlayButton}
            onPress={onFullscreenToggle}
            accessibilityLabel="Toggle fullscreen"
          >
            <Icon 
              name={isFullscreen ? "fullscreen_exit" : "fullscreen"} 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!isVisible) {
    return (
      <View style={styles.container}>
        <Text style={styles.noStreamMessage}>
          Screen sharing is not active
        </Text>
      </View>
    );
  }

  // Fullscreen modal
  if (isFullscreen) {
    return (
      <Modal
        visible={true}
        transparent={false}
        animationType="fade"
        onRequestClose={onFullscreenToggle}
      >
        <StatusBar hidden />
        <View style={styles.fullscreenModal}>
          <TouchableOpacity 
            style={styles.fullscreenContainer}
            activeOpacity={1}
            onPress={handleControlsToggle}
            onLongPress={handleDoubleTap}
          >
            <View style={styles.fullscreenViewer}>
              {renderStreamContent()}
            </View>
            
            {showControls && (
              <View style={styles.fullscreenControls}>
                <Text style={styles.fullscreenTitle}>
                  {sharerName}'s Screen Share
                </Text>
                
                <TouchableOpacity
                  style={styles.fullscreenButton}
                  onPress={handleScreenshotCapture}
                  accessibilityLabel="Capture screenshot"
                >
                  <Icon name="camera_alt" size={20} color="#ffffff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.fullscreenButton}
                  onPress={onFullscreenToggle}
                  accessibilityLabel="Exit fullscreen"
                >
                  <Icon name="fullscreen_exit" size={20} color="#ffffff" />
                </TouchableOpacity>
                
                {onClose && (
                  <TouchableOpacity
                    style={styles.fullscreenButton}
                    onPress={onClose}
                    accessibilityLabel="Close viewer"
                  >
                    <Icon name="close" size={20} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // Regular viewer
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="screen_share" size={20} style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>{sharerName}'s Screen</Text>
            <Text style={styles.headerSubtitle}>
              {streamUrl ? 'Live stream active' : 'Connecting...'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onFullscreenToggle}
            accessibilityLabel="View in fullscreen"
          >
            <Icon name="fullscreen" size={16} color={theme.OnSurface} />
          </TouchableOpacity>
          
          {onClose && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onClose}
              accessibilityLabel="Close viewer"
            >
              <Icon name="close" size={16} color={theme.OnSurface} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Viewer */}
      <TouchableOpacity
        style={styles.viewerContainer}
        activeOpacity={0.9}
        onPress={handleDoubleTap}
      >
        {renderStreamContent()}
        {renderOverlayControls()}
      </TouchableOpacity>
    </View>
  );
};

export default SharedScreenViewer;