/**
 * ParticipantSpotlightManager - Central management system for participant spotlights
 * Phase 14: Participant Spotlight System
 * Handles spotlight queue, rotation, and state management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LightTheme, SemanticColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DashboardCard from '../core/DashboardCard';
import CoachingButton from '../core/CoachingButton';
import { SpotlightParticipant, SpotlightData } from './SpotlightParticipant';
import { VideoSpotlight } from './VideoSpotlight';
import { Participant } from './ParticipantCard';

const { width } = Dimensions.get('window');

export type SpotlightViewMode = 'grid' | 'carousel' | 'single' | 'video';

interface SpotlightSettings {
  maxActiveSpotlights: number;
  defaultDuration: number; // in seconds
  autoRotate: boolean;
  rotationInterval: number; // in seconds
  allowMultipleTypes: boolean;
  queueEnabled: boolean;
  priorityEnabled: boolean;
}

interface ParticipantSpotlightManagerProps {
  participants: Participant[];
  isTeacherView?: boolean;
  onParticipantUpdate?: (participant: Participant) => void;
  onSpotlightAction?: (action: string, participantId: string, data?: any) => void;
  classStartTime?: Date;
  maxHeight?: number;
}

export interface SpotlightManagerRef {
  addToSpotlight: (participantId: string, spotlightType: SpotlightData['type'], reason?: string, duration?: number, priority?: SpotlightData['priority']) => void;
  removeFromSpotlight: (participantId: string) => void;
  extendSpotlight: (participantId: string, additionalTime: number) => void;
  rotateSpotlights: () => void;
  getActiveSpotlights: () => SpotlightData[];
  getQueuedSpotlights: () => SpotlightData[];
  settings: SpotlightSettings;
  updateSettings: (newSettings: Partial<SpotlightSettings>) => void;
}

const ParticipantSpotlightManager: React.FC<ParticipantSpotlightManagerProps> = ({
  participants,
  isTeacherView = false,
  onParticipantUpdate,
  onSpotlightAction,
  classStartTime,
  maxHeight = 600,
}) => {
  const [spotlights, setSpotlights] = useState<SpotlightData[]>([]);
  const [spotlightQueue, setSpotlightQueue] = useState<SpotlightData[]>([]);
  const [viewMode, setViewMode] = useState<SpotlightViewMode>('grid');
  const [selectedSpotlight, setSelectedSpotlight] = useState<string | null>(null);
  const [settings, setSettings] = useState<SpotlightSettings>({
    maxActiveSpotlights: 3,
    defaultDuration: 300, // 5 minutes
    autoRotate: false,
    rotationInterval: 180, // 3 minutes
    allowMultipleTypes: true,
    queueEnabled: true,
    priorityEnabled: true,
  });
  const [autoRotateTimer, setAutoRotateTimer] = useState<NodeJS.Timeout | null>(null);

  // Initialize with sample spotlight data for demonstration
  useEffect(() => {
    if (participants.length === 0) return;

    const sampleSpotlights: SpotlightData[] = [
      {
        id: 'spotlight1',
        participant: participants[0] || {
          id: 'p1',
          name: 'Alice Johnson',
          role: 'student',
          status: 'active',
          joinedAt: new Date(),
          audioEnabled: true,
          videoEnabled: true,
        },
        type: 'presentation',
        priority: 'high',
        duration: 300,
        remainingTime: 180,
        reason: 'Presenting their project on React Native components',
        isActive: true,
      },
      {
        id: 'spotlight2',
        participant: participants[1] || {
          id: 'p2',
          name: 'Bob Smith',
          role: 'student',
          status: 'active',
          joinedAt: new Date(),
          audioEnabled: true,
          videoEnabled: true,
        },
        type: 'question',
        priority: 'medium',
        duration: 180,
        remainingTime: 120,
        reason: 'Asking a question about state management',
        isActive: true,
      },
    ];

    const queuedSpotlights: SpotlightData[] = [
      {
        id: 'spotlight3',
        participant: participants[2] || {
          id: 'p3',
          name: 'Carol Davis',
          role: 'student',
          status: 'active',
          joinedAt: new Date(),
          audioEnabled: true,
          videoEnabled: true,
        },
        type: 'presentation',
        priority: 'medium',
        duration: 240,
        remainingTime: 240,
        reason: 'Next presenter for group discussion',
        isActive: false,
        queuePosition: 1,
      },
      {
        id: 'spotlight4',
        participant: participants[3] || {
          id: 'p4',
          name: 'David Wilson',
          role: 'student',
          status: 'active',
          joinedAt: new Date(),
          audioEnabled: true,
          videoEnabled: true,
        },
        type: 'assistance',
        priority: 'low',
        duration: 120,
        remainingTime: 120,
        reason: 'Needs help with assignment',
        isActive: false,
        queuePosition: 2,
      },
    ];

    setSpotlights(sampleSpotlights);
    setSpotlightQueue(queuedSpotlights);
  }, [participants]);

  // Auto-rotation timer
  useEffect(() => {
    if (settings.autoRotate && spotlights.length > 0) {
      const timer = setInterval(() => {
        rotateSpotlights();
      }, settings.rotationInterval * 1000);
      
      setAutoRotateTimer(timer);
      return () => clearInterval(timer);
    } else if (autoRotateTimer) {
      clearInterval(autoRotateTimer);
      setAutoRotateTimer(null);
    }
  }, [settings.autoRotate, settings.rotationInterval, spotlights.length]);

  const generateSpotlightId = useCallback((): string => {
    return 'spotlight_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }, []);

  const addToSpotlight = useCallback((
    participantId: string,
    spotlightType: SpotlightData['type'],
    reason?: string,
    duration?: number,
    priority: SpotlightData['priority'] = 'medium'
  ) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    // Check if participant is already in spotlight or queue
    const existingSpotlight = [...spotlights, ...spotlightQueue].find(s => s.participant.id === participantId);
    if (existingSpotlight) {
      Alert.alert('Already in Spotlight', `${participant.name} is already in the spotlight or queue.`);
      return;
    }

    const newSpotlight: SpotlightData = {
      id: generateSpotlightId(),
      participant,
      type: spotlightType,
      priority,
      duration: duration || settings.defaultDuration,
      remainingTime: duration || settings.defaultDuration,
      reason: reason || `${spotlightType} spotlight`,
      isActive: false,
      queuePosition: undefined,
    };

    // Add to active spotlights if space available, otherwise add to queue
    if (spotlights.filter(s => s.isActive).length < settings.maxActiveSpotlights) {
      newSpotlight.isActive = true;
      setSpotlights(prev => [...prev, newSpotlight]);
    } else if (settings.queueEnabled) {
      newSpotlight.queuePosition = spotlightQueue.length + 1;
      setSpotlightQueue(prev => [...prev, newSpotlight]);
    } else {
      Alert.alert('Spotlight Full', 'Maximum number of active spotlights reached. Enable queue or end existing spotlights.');
      return;
    }

    onSpotlightAction?.('add', participantId, newSpotlight);
  }, [participants, spotlights, spotlightQueue, settings, generateSpotlightId, onSpotlightAction]);

  const removeFromSpotlight = useCallback((participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    // Remove from active spotlights
    const activeSpotlight = spotlights.find(s => s.participant.id === participantId);
    if (activeSpotlight) {
      setSpotlights(prev => prev.filter(s => s.participant.id !== participantId));
      
      // Move next queued spotlight to active if available
      if (spotlightQueue.length > 0) {
        const nextSpotlight = { ...spotlightQueue[0] };
        nextSpotlight.isActive = true;
        nextSpotlight.remainingTime = nextSpotlight.duration;
        nextSpotlight.queuePosition = undefined;
        
        setSpotlights(prev => [...prev, nextSpotlight]);
        setSpotlightQueue(prev => {
          const newQueue = prev.slice(1);
          // Update queue positions
          return newQueue.map((s, index) => ({
            ...s,
            queuePosition: index + 1,
          }));
        });
      }
    } else {
      // Remove from queue
      setSpotlightQueue(prev => {
        const newQueue = prev.filter(s => s.participant.id !== participantId);
        // Update queue positions
        return newQueue.map((s, index) => ({
          ...s,
          queuePosition: index + 1,
        }));
      });
    }

    onSpotlightAction?.('remove', participantId);
  }, [participants, spotlights, spotlightQueue, onSpotlightAction]);

  const extendSpotlight = useCallback((participantId: string, additionalTime: number) => {
    setSpotlights(prev => prev.map(s => {
      if (s.participant.id === participantId) {
        return {
          ...s,
          duration: s.duration + additionalTime,
          remainingTime: s.remainingTime + additionalTime,
        };
      }
      return s;
    }));

    onSpotlightAction?.('extend', participantId, additionalTime);
  }, [onSpotlightAction]);

  const rotateSpotlights = useCallback(() => {
    if (spotlights.length <= 1 || spotlightQueue.length === 0) return;

    // Move the first active spotlight to end of queue
    const firstActive = spotlights[0];
    if (firstActive) {
      const queueSpotlight: SpotlightData = {
        ...firstActive,
        isActive: false,
        queuePosition: spotlightQueue.length + 1,
        remainingTime: firstActive.duration, // Reset remaining time
      };

      // Move first queued spotlight to active
      const nextQueued = spotlightQueue[0];
      if (nextQueued) {
        const activeSpotlight: SpotlightData = {
          ...nextQueued,
          isActive: true,
          remainingTime: nextQueued.duration,
          queuePosition: undefined,
        };

        setSpotlights(prev => [
          ...prev.slice(1),
          activeSpotlight,
        ]);

        setSpotlightQueue(prev => {
          const newQueue = [...prev.slice(1), queueSpotlight];
          return newQueue.map((s, index) => ({
            ...s,
            queuePosition: index + 1,
          }));
        });

        onSpotlightAction?.('rotate', firstActive.participant.id);
      }
    }
  }, [spotlights, spotlightQueue, onSpotlightAction]);

  const handleSpotlightEnd = useCallback((participantId: string) => {
    removeFromSpotlight(participantId);
  }, [removeFromSpotlight]);

  const handleParticipantAudioToggle = useCallback((participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      const updatedParticipant = {
        ...participant,
        audioEnabled: !participant.audioEnabled,
      };
      onParticipantUpdate?.(updatedParticipant);
    }
  }, [participants, onParticipantUpdate]);

  const getSpotlightParticipant = (spotlight: SpotlightData): Participant | undefined => {
    return spotlight.participant;
  };

  const getActiveSpotlights = () => spotlights.filter(s => s.isActive);
  const getQueuedSpotlights = () => spotlightQueue;

  const renderSpotlightGrid = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.gridContainer}
    >
      {getActiveSpotlights().map((spotlight) => {
        const participant = getSpotlightParticipant(spotlight);
        if (!participant) return null;

        return (
          <SpotlightParticipant
            key={spotlight.id}
            participant={participant}
            spotlightData={spotlight}
            isTeacherView={isTeacherView}
            onSpotlightEnd={handleSpotlightEnd}
            onExtendSpotlight={extendSpotlight}
            onMuteParticipant={handleParticipantAudioToggle}
            onUnmuteParticipant={handleParticipantAudioToggle}
            onRemoveFromSpotlight={removeFromSpotlight}
            classStartTime={classStartTime}
            size="medium"
            showControls={isTeacherView}
            showTimer={true}
          />
        );
      })}
    </ScrollView>
  );

  const renderVideoSpotlight = () => {
    const activeSpotlight = getActiveSpotlights()[0];
    if (!activeSpotlight) return null;

    const participant = getSpotlightParticipant(activeSpotlight);
    if (!participant) return null;

    return (
      <View style={styles.videoContainer}>
        <VideoSpotlight
          participant={participant}
          spotlightData={activeSpotlight}
          isTeacherView={isTeacherView}
          onToggleAudio={handleParticipantAudioToggle}
          onToggleVideo={(id) => {
            const p = participants.find(p => p.id === id);
            if (p) {
              onParticipantUpdate?.({ ...p, videoEnabled: !p.videoEnabled });
            }
          }}
          onEndSpotlight={handleSpotlightEnd}
          onRecordSpotlight={(id) => onSpotlightAction?.('record', id)}
          onTakeScreenshot={(id) => onSpotlightAction?.('screenshot', id)}
          showControls={isTeacherView}
        />
      </View>
    );
  };

  const renderSpotlightQueue = () => {
    const queuedSpotlights = getQueuedSpotlights();
    if (queuedSpotlights.length === 0) return null;

    return (
      <DashboardCard title="Spotlight Queue" style={styles.queueCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.queueContainer}
        >
          {queuedSpotlights.map((spotlight) => {
            const participant = getSpotlightParticipant(spotlight);
            if (!participant) return null;

            return (
              <SpotlightParticipant
                key={spotlight.id}
                participant={participant}
                spotlightData={spotlight}
                isTeacherView={isTeacherView}
                onRemoveFromSpotlight={removeFromSpotlight}
                classStartTime={classStartTime}
                size="small"
                showControls={false}
                showTimer={false}
              />
            );
          })}
        </ScrollView>
      </DashboardCard>
    );
  };

  const renderViewModeControls = () => {
    if (!isTeacherView) return null;

    return (
      <View style={styles.viewModeControls}>
        <Text style={styles.viewModeLabel}>View:</Text>
        {(['grid', 'video'] as SpotlightViewMode[]).map((mode) => (
          <CoachingButton
            key={mode}
            title={mode.charAt(0).toUpperCase() + mode.slice(1)}
            variant={viewMode === mode ? 'primary' : 'text'}
            size="small"
            onPress={() => setViewMode(mode)}
            style={styles.viewModeButton}
          />
        ))}
      </View>
    );
  };

  const renderSpotlightStats = () => {
    const activeCount = getActiveSpotlights().length;
    const queuedCount = getQueuedSpotlights().length;
    const totalTime = spotlights.reduce((total, s) => total + s.duration, 0);

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{queuedCount}</Text>
          <Text style={styles.statLabel}>Queued</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.floor(totalTime / 60)}m
          </Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { maxHeight }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Participant Spotlight</Text>
        {renderViewModeControls()}
      </View>

      {renderSpotlightStats()}

      <View style={styles.content}>
        {viewMode === 'video' ? renderVideoSpotlight() : renderSpotlightGrid()}
      </View>

      {renderSpotlightQueue()}

      {isTeacherView && (
        <View style={styles.controls}>
          <CoachingButton
            title="Auto Rotate"
            variant={settings.autoRotate ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSettings(prev => ({ ...prev, autoRotate: !prev.autoRotate }))}
            style={styles.controlButton}
          />
          
          <CoachingButton
            title="Rotate Now"
            variant="text"
            size="small"
            onPress={rotateSpotlights}
            disabled={spotlights.length <= 1 || spotlightQueue.length === 0}
            style={styles.controlButton}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  title: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
  },
  viewModeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  viewModeLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  viewModeButton: {
    minWidth: 60,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    paddingVertical: Spacing.SM,
    marginBottom: Spacing.MD,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '700',
    color: LightTheme.OnSurface,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  content: {
    marginBottom: Spacing.MD,
  },
  gridContainer: {
    paddingHorizontal: Spacing.SM,
    gap: Spacing.SM,
  },
  videoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  queueCard: {
    marginBottom: Spacing.MD,
  },
  queueContainer: {
    paddingHorizontal: Spacing.SM,
    gap: Spacing.SM,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.MD,
  },
  controlButton: {
    minWidth: 100,
  },
});

export default ParticipantSpotlightManager;