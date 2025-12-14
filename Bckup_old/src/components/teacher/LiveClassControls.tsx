/**
 * LiveClassControls - Centralized live class control panel
 * Phase 17: Screen Sharing UI
 * Provides unified controls for all live class features
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

interface LiveClassControlsProps {
  // Class state
  isClassActive: boolean;
  participantCount: number;
  
  // Screen sharing
  isScreenSharing: boolean;
  onToggleScreenShare: (enabled: boolean) => void;
  
  // Recording
  isRecording: boolean;
  onToggleRecording: (enabled: boolean) => void;
  
  // Audio/Video
  isMuted: boolean;
  isVideoEnabled: boolean;
  onToggleMute: (muted: boolean) => void;
  onToggleVideo: (enabled: boolean) => void;
  
  // Navigation handlers
  onShowParticipants: () => void;
  onShowChat: () => void;
  onShowWhiteboard: () => void;
  onShowSettings: () => void;
  
  // Optional handlers
  onEndClass?: () => void;
  onShowPolls?: () => void;
  onShowBreakoutRooms?: () => void;
  
  isTeacherView?: boolean;
}

interface ControlAction {
  id: string;
  title: string;
  icon: string;
  isActive?: boolean;
  isEnabled?: boolean;
  color?: string;
  onPress: () => void;
  badge?: string;
}

const LiveClassControls: React.FC<LiveClassControlsProps> = ({
  isClassActive,
  participantCount,
  isScreenSharing,
  onToggleScreenShare,
  isRecording,
  onToggleRecording,
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  onShowParticipants,
  onShowChat,
  onShowWhiteboard,
  onShowSettings,
  onEndClass,
  onShowPolls,
  onShowBreakoutRooms,
  isTeacherView = false,
}) => {
  const { theme } = useTheme();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      marginBottom: 16,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.Outline,
    },

    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: isClassActive ? '#4CAF50' : '#FF9800',
      marginRight: 8,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurface,
    },

    headerSubtitle: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      marginTop: 2,
    },

    participantCount: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primaryContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },

    participantIcon: {
      color: theme.OnPrimaryContainer,
      marginRight: 4,
    },

    participantText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnPrimaryContainer,
    },

    // Primary Controls Section
    primaryControls: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.Outline,
    },

    primaryButton: {
      flex: 1,
      backgroundColor: theme.SurfaceVariant,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      borderWidth: 2,
      borderColor: 'transparent',
    },

    primaryButtonActive: {
      backgroundColor: theme.primaryContainer,
      borderColor: theme.primary,
    },

    primaryButtonDanger: {
      backgroundColor: theme.errorContainer,
      borderColor: theme.error,
    },

    primaryButtonIcon: {
      color: theme.OnSurfaceVariant,
    },

    primaryButtonIconActive: {
      color: theme.OnPrimaryContainer,
    },

    primaryButtonIconDanger: {
      color: theme.OnErrorContainer,
    },

    primaryButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },

    primaryButtonTextActive: {
      color: theme.OnPrimaryContainer,
    },

    primaryButtonTextDanger: {
      color: theme.OnErrorContainer,
    },

    // Secondary Controls Sections
    secondarySection: {
      borderBottomWidth: 1,
      borderBottomColor: theme.Outline,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: theme.SurfaceVariant,
    },

    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnSurface,
    },

    sectionToggle: {
      padding: 4,
    },

    sectionContent: {
      padding: 16,
    },

    controlsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    controlButton: {
      backgroundColor: theme.SurfaceVariant,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minWidth: '30%',
    },

    controlButtonActive: {
      backgroundColor: theme.TertiaryContainer,
    },

    controlIcon: {
      color: theme.OnSurfaceVariant,
    },

    controlIconActive: {
      color: theme.OnTertiaryContainer,
    },

    controlText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.OnSurfaceVariant,
    },

    controlTextActive: {
      color: theme.OnTertiaryContainer,
    },

    badge: {
      backgroundColor: theme.error,
      color: theme.OnError,
      fontSize: 10,
      fontWeight: '600',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 16,
      textAlign: 'center',
    },

    disabledMessage: {
      textAlign: 'center',
      color: theme.OnSurfaceVariant,
      fontSize: 14,
      fontStyle: 'italic',
      padding: 20,
    },
  });

  const styles = getStyles(theme);

  const handleEndClass = useCallback(() => {
    Alert.alert(
      'End Live Class',
      'Are you sure you want to end this live class? All participants will be disconnected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Class',
          style: 'destructive',
          onPress: () => onEndClass?.(),
        },
      ]
    );
  }, [onEndClass]);

  const handleToggleSection = useCallback((sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  }, [expandedSection]);

  // Primary controls (always visible)
  const primaryControls: ControlAction[] = [
    {
      id: 'mute',
      title: isMuted ? 'Unmute' : 'Mute',
      icon: isMuted ? 'mic_off' : 'mic',
      isActive: isMuted,
      color: isMuted ? 'danger' : 'default',
      onPress: () => onToggleMute(!isMuted),
    },
    {
      id: 'video',
      title: isVideoEnabled ? 'Stop Video' : 'Start Video',
      icon: isVideoEnabled ? 'videocam' : 'videocam_off',
      isActive: isVideoEnabled,
      onPress: () => onToggleVideo(!isVideoEnabled),
    },
    {
      id: 'screen_share',
      title: isScreenSharing ? 'Stop Sharing' : 'Share Screen',
      icon: isScreenSharing ? 'stop_screen_share' : 'screen_share',
      isActive: isScreenSharing,
      onPress: () => onToggleScreenShare(!isScreenSharing),
    },
    {
      id: 'record',
      title: isRecording ? 'Stop Recording' : 'Record',
      icon: isRecording ? 'stop' : 'fiber_manual_record',
      isActive: isRecording,
      color: isRecording ? 'danger' : 'default',
      onPress: () => onToggleRecording(!isRecording),
    },
  ];

  // Navigation controls
  const navigationControls: ControlAction[] = [
    {
      id: 'participants',
      title: 'Participants',
      icon: 'group',
      onPress: onShowParticipants,
      badge: participantCount.toString(),
    },
    {
      id: 'chat',
      title: 'Chat',
      icon: 'chat',
      onPress: onShowChat,
    },
    {
      id: 'whiteboard',
      title: 'Whiteboard',
      icon: 'dashboard',
      onPress: onShowWhiteboard,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      onPress: onShowSettings,
    },
  ];

  // Advanced features
  const advancedControls: ControlAction[] = [
    ...(onShowPolls ? [{
      id: 'polls',
      title: 'Polls',
      icon: 'poll',
      onPress: onShowPolls,
    }] : []),
    ...(onShowBreakoutRooms ? [{
      id: 'breakout',
      title: 'Breakout Rooms',
      icon: 'meeting_room',
      onPress: onShowBreakoutRooms,
    }] : []),
  ];

  if (!isTeacherView) {
    return (
      <View style={styles.container}>
        <Text style={styles.disabledMessage}>
          Live class controls are only available for teachers
        </Text>
      </View>
    );
  }

  const renderControlButton = (control: ControlAction, isPrimary = false) => {
    if (isPrimary) {
      const buttonStyle = [
        styles.primaryButton,
        control.isActive && styles.primaryButtonActive,
        control.color === 'danger' && styles.primaryButtonDanger,
      ];

      const iconStyle = [
        styles.primaryButtonIcon,
        control.isActive && styles.primaryButtonIconActive,
        control.color === 'danger' && styles.primaryButtonIconDanger,
      ];

      const textStyle = [
        styles.primaryButtonText,
        control.isActive && styles.primaryButtonTextActive,
        control.color === 'danger' && styles.primaryButtonTextDanger,
      ];

      return (
        <TouchableOpacity
          key={control.id}
          style={buttonStyle}
          onPress={control.onPress}
          accessibilityLabel={control.title}
          accessibilityState={{ selected: control.isActive }}
        >
          <Icon name={control.icon} size={20} style={iconStyle} />
          <Text style={textStyle}>{control.title}</Text>
          {control.badge && (
            <Text style={styles.badge}>{control.badge}</Text>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={control.id}
        style={[
          styles.controlButton,
          control.isActive && styles.controlButtonActive,
        ]}
        onPress={control.onPress}
        accessibilityLabel={control.title}
        accessibilityState={{ selected: control.isActive }}
      >
        <Icon 
          name={control.icon} 
          size={16} 
          style={[
            styles.controlIcon,
            control.isActive && styles.controlIconActive,
          ]} 
        />
        <Text style={[
          styles.controlText,
          control.isActive && styles.controlTextActive,
        ]}>
          {control.title}
        </Text>
        {control.badge && (
          <Text style={styles.badge}>{control.badge}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = (
    id: string,
    title: string,
    controls: ControlAction[],
    expanded = false
  ) => (
    <View key={id} style={styles.secondarySection}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => handleToggleSection(id)}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity style={styles.sectionToggle}>
          <Icon 
            name={expanded ? 'expand_less' : 'expand_more'} 
            size={20} 
            color={theme.OnSurface}
          />
        </TouchableOpacity>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.sectionContent}>
          <View style={styles.controlsGrid}>
            {controls.map(control => renderControlButton(control, false))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.statusIndicator} />
          <View>
            <Text style={styles.headerTitle}>Live Class Controls</Text>
            <Text style={styles.headerSubtitle}>
              {isClassActive ? 'Class is active' : 'Class is preparing'}
            </Text>
          </View>
        </View>
        
        <View style={styles.participantCount}>
          <Icon name="group" size={12} style={styles.participantIcon} />
          <Text style={styles.participantText}>{participantCount}</Text>
        </View>
      </View>

      {/* Primary Controls */}
      <View style={styles.primaryControls}>
        {primaryControls.map(control => renderControlButton(control, true))}
      </View>

      {/* Secondary Controls */}
      <ScrollView>
        {renderSection('navigation', 'Navigation', navigationControls, expandedSection === 'navigation')}
        {advancedControls.length > 0 && renderSection('advanced', 'Advanced Features', advancedControls, expandedSection === 'advanced')}
      </ScrollView>

      {/* End Class Button */}
      {isClassActive && onEndClass && (
        <View style={styles.primaryControls}>
          <TouchableOpacity
            style={[styles.primaryButton, styles.primaryButtonDanger]}
            onPress={handleEndClass}
            accessibilityLabel="End live class"
          >
            <Icon name="call_end" size={20} style={styles.primaryButtonIconDanger} />
            <Text style={styles.primaryButtonTextDanger}>End Class</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default LiveClassControls;