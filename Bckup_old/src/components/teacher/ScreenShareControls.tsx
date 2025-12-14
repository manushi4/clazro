/**
 * ScreenShareControls - Screen sharing control panel
 * Phase 17: Screen Sharing UI
 * Provides controls for screen sharing functionality
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

interface ScreenShareControlsProps {
  isSharing: boolean;
  onToggleShare: (enabled: boolean) => void;
  onSelectWindow?: () => void;
  onSelectRegion?: () => void;
  isTeacherView?: boolean;
}

interface ShareOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
}

const ScreenShareControls: React.FC<ScreenShareControlsProps> = ({
  isSharing,
  onToggleShare,
  onSelectWindow,
  onSelectRegion,
  isTeacherView = false,
}) => {
  const { theme } = useTheme();
  const [showShareOptions, setShowShareOptions] = useState(false);

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
      marginBottom: 16,
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

    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.SurfaceVariant,
    },

    statusBadgeActive: {
      backgroundColor: theme.primary,
    },

    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.OnSurfaceVariant,
    },

    statusTextActive: {
      color: theme.OnPrimary,
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

    primaryButtonActive: {
      backgroundColor: theme.error,
    },

    secondaryButton: {
      backgroundColor: theme.SurfaceVariant,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnPrimary,
    },

    buttonTextSecondary: {
      color: theme.OnSurfaceVariant,
    },

    infoSection: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
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

    warningSection: {
      backgroundColor: theme.errorContainer,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    },

    warningText: {
      fontSize: 12,
      color: theme.OnErrorContainer,
      textAlign: 'center',
      fontStyle: 'italic',
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

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContainer: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxWidth: 400,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.Outline,
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurface,
    },

    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.SurfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },

    optionsContainer: {
      gap: 12,
    },

    optionButton: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },

    optionIcon: {
      marginRight: 12,
      color: theme.OnSurfaceVariant,
    },

    optionContent: {
      flex: 1,
    },

    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 4,
    },

    optionDescription: {
      fontSize: 14,
      color: theme.OnSurfaceVariant,
    },
  });

  const styles = getStyles(theme);

  const handleToggleShare = () => {
    if (isSharing) {
      Alert.alert(
        'Stop Screen Sharing',
        'Are you sure you want to stop sharing your screen?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Stop Sharing', 
            style: 'destructive',
            onPress: () => onToggleShare(false)
          },
        ]
      );
    } else {
      setShowShareOptions(true);
    }
  };

  const handleStartShare = (type: 'window' | 'region' | 'fullscreen') => {
    setShowShareOptions(false);
    
    // Simulate screen sharing start
    setTimeout(() => {
      onToggleShare(true);
      Alert.alert(
        'Screen Sharing Started',
        `Your ${type === 'fullscreen' ? 'entire screen' : type} is now being shared with students.`
      );
    }, 500);

    // Call appropriate handler
    if (type === 'window' && onSelectWindow) {
      onSelectWindow();
    } else if (type === 'region' && onSelectRegion) {
      onSelectRegion();
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'fullscreen',
      title: 'Share Entire Screen',
      description: 'Share your complete screen with all applications',
      icon: 'desktop_windows',
      action: () => handleStartShare('fullscreen'),
    },
    {
      id: 'window',
      title: 'Share Application Window',
      description: 'Share a specific application or window',
      icon: 'web_asset',
      action: () => handleStartShare('window'),
    },
    {
      id: 'region',
      title: 'Share Screen Region',
      description: 'Share a selected area of your screen',
      icon: 'crop_free',
      action: () => handleStartShare('region'),
    },
  ];

  if (!isTeacherView) {
    return (
      <View style={[styles.container, styles.disabledContainer]}>
        <Text style={styles.disabledMessage}>
          Screen sharing controls are only available for teachers
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon 
          name="screen_share" 
          size={24} 
          style={styles.headerIcon}
        />
        <Text style={styles.title}>Screen Sharing</Text>
        <View style={[
          styles.statusBadge,
          isSharing && styles.statusBadgeActive
        ]}>
          <Text style={[
            styles.statusText,
            isSharing && styles.statusTextActive
          ]}>
            {isSharing ? 'SHARING' : 'READY'}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            isSharing && styles.primaryButtonActive
          ]}
          onPress={handleToggleShare}
          accessibilityLabel={isSharing ? 'Stop screen sharing' : 'Start screen sharing'}
        >
          <Icon 
            name={isSharing ? 'stop_screen_share' : 'screen_share'} 
            size={20} 
            color={theme.OnPrimary}
          />
          <Text style={styles.buttonText}>
            {isSharing ? 'Stop Sharing' : 'Start Sharing'}
          </Text>
        </TouchableOpacity>

        {isSharing && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => Alert.alert('Settings', 'Screen share settings will be available in a future update')}
            accessibilityLabel="Screen sharing settings"
          >
            <Icon 
              name="settings" 
              size={20} 
              style={styles.buttonTextSecondary}
            />
            <Text style={styles.buttonTextSecondary}>Settings</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Information Section */}
      <View style={styles.infoSection}>
        {isSharing ? (
          <>
            <View style={styles.infoRow}>
              <Icon name="visibility" size={16} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Students can now see your screen
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="security" size={16} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Your screen is being shared in real-time
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Icon name="info" size={16} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Share your screen to show presentations, applications, or demonstrate tasks
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="group" size={16} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                All students in the class will be able to view your shared screen
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Warning Section */}
      {isSharing && (
        <View style={styles.warningSection}>
          <Text style={styles.warningText}>
            ⚠️ Be mindful of sensitive information that might be visible on your screen
          </Text>
        </View>
      )}

      {/* Share Options Modal */}
      <Modal
        visible={showShareOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🖥️ Select Sharing Option</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowShareOptions(false)}
                accessibilityLabel="Close sharing options"
              >
                <Icon name="close" size={20} color={theme.OnSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Share Options */}
            <View style={styles.optionsContainer}>
              {shareOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionButton}
                  onPress={option.action}
                  accessibilityLabel={option.title}
                >
                  <Icon name={option.icon} size={24} style={styles.optionIcon} />
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ScreenShareControls;