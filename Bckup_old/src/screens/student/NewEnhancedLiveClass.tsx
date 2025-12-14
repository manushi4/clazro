/**
 * NewEnhancedLiveClass - EXACT match to HTML reference
 * Purpose: Live class video conferencing interface
 * Design: Material Design with video grid, controls, and chat
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<any, 'NewEnhancedLiveClass'>;

interface Participant {
  id: string;
  name: string;
  isMuted?: boolean;
}

export default function NewEnhancedLiveClass({ route, navigation }: Props) {
  const [messageText, setMessageText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const classTitle = route.params?.title || 'Physics 101: Newton\'s Laws';

  // Track screen view
  useEffect(() => {
    trackScreenView('NewEnhancedLiveClass');
  }, []);

  // Timer for class duration
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const participants: Participant[] = [
    { id: '1', name: 'Mia Wallace', isMuted: false },
    { id: '2', name: 'Jules Winnfield', isMuted: true },
    { id: '3', name: 'Vincent Vega', isMuted: false },
    { id: '4', name: 'Esmeralda', isMuted: false },
  ];

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    trackAction('send_message', 'NewEnhancedLiveClass', {
      messageLength: messageText.length,
    });
    setMessageText('');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    trackAction('toggle_mute', 'NewEnhancedLiveClass', { muted: !isMuted });
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    trackAction('toggle_video', 'NewEnhancedLiveClass', { videoOn: !isVideoOn });
  };

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
    trackAction('raise_hand', 'NewEnhancedLiveClass', { raised: !isHandRaised });
  };

  const handleLeave = () => {
    trackAction('leave_class', 'NewEnhancedLiveClass');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            trackAction('back_button', 'NewEnhancedLiveClass');
            navigation.goBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T style={styles.icon}>←</T>
        </TouchableOpacity>

        <T variant="body" weight="bold" style={styles.topBarTitle}>
          {classTitle}
        </T>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => trackAction('more_options', 'NewEnhancedLiveClass')}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <T style={styles.icon}>⋮</T>
        </TouchableOpacity>
      </View>

      {/* Status Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
        contentContainerStyle={styles.chipsContent}
      >
        <View style={[styles.chip, styles.recordingChip]}>
          <T style={styles.recordingDot}>●</T>
          <T variant="caption" style={styles.recordingText}>Recording</T>
        </View>

        <View style={[styles.chip, styles.primaryChip]}>
          <T style={styles.chipIcon}>⏱</T>
          <T variant="caption" style={styles.primaryText}>{formatTime(elapsedTime)}</T>
        </View>

        <View style={[styles.chip, styles.primaryChip]}>
          <T style={styles.chipIcon}>👥</T>
          <T variant="caption" style={styles.primaryText}>32 Students</T>
        </View>
      </ScrollView>

      {/* Main Video Grid */}
      <ScrollView
        style={styles.videoContainer}
        contentContainerStyle={styles.videoContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Teacher's Pinned Video */}
        <View style={styles.teacherVideoContainer}>
          <View style={styles.teacherVideo}>
            <View style={styles.videoPlaceholder}>
              <T style={styles.videoPlaceholderIcon}>👨‍🏫</T>
            </View>
            <View style={styles.videoLabel}>
              <T variant="caption" style={styles.videoLabelText}>
                Dr. Evelyn Reed (Teacher)
              </T>
            </View>
            <View style={styles.pinBadge}>
              <T style={styles.pinIcon}>📌</T>
            </View>
          </View>
        </View>

        {/* Student Videos Grid */}
        <View style={styles.studentsGrid}>
          {participants.map((participant) => (
            <View key={participant.id} style={styles.studentVideoContainer}>
              <View style={styles.studentVideo}>
                <View style={styles.videoPlaceholder}>
                  <T style={styles.videoPlaceholderIcon}>👤</T>
                </View>
                <View style={styles.videoLabel}>
                  <T variant="caption" style={styles.videoLabelText}>
                    {participant.name}
                  </T>
                </View>
                {participant.isMuted && (
                  <View style={styles.muteBadge}>
                    <T style={styles.muteIcon}>🔇</T>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Self Video (PiP) */}
        <View style={styles.pipContainer}>
          <View style={styles.pip}>
            <View style={styles.videoPlaceholder}>
              <T style={styles.pipIcon}>🙋</T>
            </View>
            <View style={styles.pipLabel}>
              <T variant="caption" style={styles.pipLabelText}>You</T>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Action Buttons */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={toggleMute}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
          >
            <View style={[styles.actionButton, isMuted && styles.actionButtonActive]}>
              <T style={styles.actionIcon}>{isMuted ? '🔇' : '🎤'}</T>
            </View>
            <T variant="caption" style={styles.actionLabel}>
              {isMuted ? 'Unmute' : 'Mute'}
            </T>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={toggleVideo}
            accessibilityRole="button"
            accessibilityLabel={isVideoOn ? 'Stop Video' : 'Start Video'}
          >
            <View style={[styles.actionButton, !isVideoOn && styles.actionButtonActive]}>
              <T style={styles.actionIcon}>{isVideoOn ? '📹' : '🚫'}</T>
            </View>
            <T variant="caption" style={styles.actionLabel}>
              {isVideoOn ? 'Stop Video' : 'Start Video'}
            </T>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={toggleHandRaise}
            accessibilityRole="button"
            accessibilityLabel="Raise Hand"
          >
            <View style={[styles.actionButton, isHandRaised && styles.actionButtonActive]}>
              <T style={styles.actionIcon}>✋</T>
            </View>
            <T variant="caption" style={styles.actionLabel}>Raise Hand</T>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => trackAction('share_screen', 'NewEnhancedLiveClass')}
            accessibilityRole="button"
            accessibilityLabel="Share Screen"
          >
            <View style={styles.actionButton}>
              <T style={styles.actionIcon}>📱</T>
            </View>
            <T variant="caption" style={styles.actionLabel}>Share</T>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              trackAction('open_interactive_tools', 'NewEnhancedLiveClass');
              // @ts-expect-error - Student routes not yet in ParentStackParamList
              safeNavigate('NewInteractiveClassroom', {
                classId: route.params?.classId,
                title: classTitle,
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="Interactive Tools"
          >
            <View style={styles.actionButton}>
              <T style={styles.actionIcon}>🎯</T>
            </View>
            <T variant="caption" style={styles.actionLabel}>Tools</T>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleLeave}
            accessibilityRole="button"
            accessibilityLabel="Leave Class"
          >
            <View style={styles.leaveButton}>
              <T style={styles.actionIcon}>📞</T>
            </View>
            <T variant="caption" style={styles.leaveLabel}>Leave</T>
          </TouchableOpacity>
        </View>

        {/* Chat Composer */}
        <View style={styles.composer}>
          <View style={styles.avatarPlaceholder}>
            <T style={styles.avatarIcon}>👤</T>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Send a message..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              accessibilityLabel="Message input"
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={styles.emojiButton}
                onPress={() => trackAction('emoji_picker', 'NewEnhancedLiveClass')}
                accessibilityRole="button"
                accessibilityLabel="Add emoji"
              >
                <T style={styles.emojiIcon}>😊</T>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !messageText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <T style={styles.sendIcon}>▶</T>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  // Top App Bar
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: '#F6F7F8',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  icon: {
    fontSize: 24,
    color: '#111418',
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: '#111418',
    paddingHorizontal: 8,
  },
  // Status Chips
  chipsContainer: {
    maxHeight: 44,
    backgroundColor: '#F6F7F8',
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,

  },
  chip: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',

    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 16,
  },
  recordingChip: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  recordingDot: {
    fontSize: 16,
    color: '#EF4444',
  },
  recordingText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryChip: {
    backgroundColor: 'rgba(19, 127, 236, 0.1)',
  },
  chipIcon: {
    fontSize: 16,
  },
  primaryText: {
    color: '#137FEC',
    fontSize: 14,
    fontWeight: '500',
  },
  // Video Grid
  videoContainer: {
    flex: 1,
  },
  videoContent: {
    padding: 16,
    paddingBottom: 80,
  },
  teacherVideoContainer: {
    marginBottom: 12,
  },
  teacherVideo: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#D1D5DB',
  },
  studentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

  },
  studentVideoContainer: {
    width: '48%',
  },
  studentVideo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#D1D5DB',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  videoPlaceholderIcon: {
    fontSize: 48,
  },
  videoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  pinBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#137FEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    fontSize: 14,
  },
  muteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteIcon: {
    fontSize: 12,
  },
  // PiP
  pipContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  pip: {
    width: 96,
    height: 128,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#137FEC',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  pipIcon: {
    fontSize: 32,
  },
  pipLabel: {
    position: 'absolute',
    bottom: 4,
    left: '50%',
    transform: [{ translateX: -15 }],
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pipLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  // Bottom Controls
  bottomContainer: {
    backgroundColor: '#F6F7F8',
    paddingHorizontal: 16,
    paddingVertical: 12,

  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',

  },
  actionItem: {
    flex: 1,
    alignItems: 'center',

  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(19, 127, 236, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#137FEC',
  },
  leaveButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  leaveLabel: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  // Chat Composer
  composer: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 20,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingRight: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: '#111418',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  emojiButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiIcon: {
    fontSize: 20,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#137FEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
