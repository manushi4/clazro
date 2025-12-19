# 👩‍🏫 TEACHER PHASE 2 - ADVANCED FEATURES IMPLEMENTATION GUIDE

> **Version:** 1.0.0
> **Date:** December 2024
> **Scope:** Teacher Role - Phase 2 (Advanced Features)
> **Sprints:** 6 Sprints (Sprint 9-14)
> **Total:** 6 Fixed Screens, 7 Dynamic Screens, 16 Widgets

---

## 📋 TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Sprint 9: Live Class System](#2-sprint-9-live-class-system)
3. [Sprint 10: AI Teaching Insights](#3-sprint-10-ai-teaching-insights)
4. [Sprint 11: Voice Assessment System](#4-sprint-11-voice-assessment-system)
5. [Sprint 12: Professional Development](#5-sprint-12-professional-development)
6. [Sprint 13: Automation Engine](#6-sprint-13-automation-engine)
7. [Sprint 14: Question Bank + Polish](#7-sprint-14-question-bank--polish)
8. [Database Schema](#8-database-schema)
9. [Platform Studio Config](#9-platform-studio-config)
10. [Testing Checklist](#10-testing-checklist)

---

## 1. OVERVIEW

### 1.1 Phase 2 Scope Summary

| Component | Count |
|-----------|-------|
| Fixed Screens | 6 |
| Dynamic Screens | 7 |
| Widgets | 16 |
| Query Hooks | 10 |
| Mutation Hooks | 5 |
| DB Tables | 6 |

### 1.2 Phase 2 Features

| Sprint | Feature | Description |
|--------|---------|-------------|
| Sprint 9 | Live Class System | WebRTC video, whiteboard, breakout rooms |
| Sprint 10 | AI Teaching Insights | Predictive analytics, learning gaps, recommendations |
| Sprint 11 | Voice Assessment | Multi-language voice tests, proctoring |
| Sprint 12 | Professional Development | Micro-credentials, learning paths, AI coaching |
| Sprint 13 | Automation Engine | Workflow automation, scheduled tasks |
| Sprint 14 | Question Bank + Polish | Question repository, final polish |

### 1.3 File Structure (Phase 2 Additions)

```
src/
├── screens/teacher/
│   ├── LiveClassHostScreen.tsx       # Sprint 9
│   ├── LiveClassSettingsScreen.tsx   # Sprint 9
│   ├── WhiteboardScreen.tsx          # Sprint 9
│   ├── AITeachingInsightsScreen.tsx  # Sprint 10
│   ├── VoiceAssessmentHubScreen.tsx  # Sprint 11
│   ├── VoiceAssessmentCreateScreen.tsx # Sprint 11
│   ├── ProctoringMonitorScreen.tsx   # Sprint 11
│   ├── ProfessionalDevScreen.tsx     # Sprint 12
│   ├── AutomationHubScreen.tsx       # Sprint 13
│   ├── AutomationRuleCreateScreen.tsx # Sprint 13
│   └── QuestionBankScreen.tsx        # Sprint 14
├── components/widgets/teacher/
│   ├── LiveSessionWidget.tsx         # Sprint 9
│   ├── BreakoutRoomsWidget.tsx       # Sprint 9
│   ├── AIInsightsSummaryWidget.tsx   # Sprint 10
│   ├── StudentPredictionsWidget.tsx  # Sprint 10
│   ├── LearningGapsWidget.tsx        # Sprint 10
│   ├── ActionableRecsWidget.tsx      # Sprint 10
│   ├── VoiceAssessmentsWidget.tsx    # Sprint 11
│   ├── ProctoringStatusWidget.tsx    # Sprint 11
│   ├── VoiceAnalyticsWidget.tsx      # Sprint 11
│   ├── CredentialsWidget.tsx         # Sprint 12
│   ├── LearningPathsWidget.tsx       # Sprint 12
│   ├── AICoachingWidget.tsx          # Sprint 12
│   ├── AutomationRulesWidget.tsx     # Sprint 13
│   ├── TaskQueueWidget.tsx           # Sprint 13
│   ├── ExecutionHistoryWidget.tsx    # Sprint 13
│   └── QuestionBankWidget.tsx        # Sprint 14
├── hooks/queries/teacher/
│   ├── useLiveSessionQuery.ts        # Sprint 9
│   ├── useAIInsightsQuery.ts         # Sprint 10
│   ├── useStudentPredictionsQuery.ts # Sprint 10
│   ├── useLearningGapsQuery.ts       # Sprint 10
│   ├── useVoiceAssessmentsQuery.ts   # Sprint 11
│   ├── useProctoringQuery.ts         # Sprint 11
│   ├── useCredentialsQuery.ts        # Sprint 12
│   ├── useLearningPathsQuery.ts      # Sprint 12
│   ├── useAutomationRulesQuery.ts    # Sprint 13
│   └── useQuestionBankQuery.ts       # Sprint 14
└── hooks/mutations/teacher/
    ├── useStartLiveSession.ts        # Sprint 9
    ├── useImplementInsight.ts        # Sprint 10
    ├── useCreateVoiceAssessment.ts   # Sprint 11
    ├── useCreateAutomationRule.ts    # Sprint 13
    └── useAddToQuestionBank.ts       # Sprint 14
```


---

## 2. SPRINT 9: LIVE CLASS SYSTEM

### 2.1 Deliverables

| Type | Item | Status |
|------|------|--------|
| Fixed Screen | `live-class-host` | 🔲 |
| Fixed Screen | `live-class-settings` | 🔲 |
| Fixed Screen | `whiteboard` | 🔲 |
| Widget | `live.session-controls` | 🔲 |
| Widget | `live.breakout-rooms` | 🔲 |
| Hook | `useLiveSessionQuery` | 🔲 |
| Hook | `useStartLiveSession` | 🔲 |
| DB Table | `live_sessions` | 🔲 |
| DB Table | `breakout_rooms` | 🔲 |
| DB Table | `whiteboard_data` | 🔲 |

### 2.2 LiveClassHostScreen.tsx

```typescript
// src/screens/teacher/LiveClassHostScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, IconButton, Surface, FAB, Portal, Modal, Button, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { useLiveSessionQuery } from '@/hooks/queries/teacher';
import { useStartLiveSession, useEndLiveSession } from '@/hooks/mutations/teacher';

type SessionState = 'waiting' | 'live' | 'ended';

export const LiveClassHostScreen: React.FC = ({ route, navigation }) => {
  const theme = useAppTheme();
  const { sessionId } = route.params;
  const { data: session, isLoading } = useLiveSessionQuery(sessionId);
  const { mutate: startSession } = useStartLiveSession();
  const { mutate: endSession } = useEndLiveSession();

  const [sessionState, setSessionState] = useState<SessionState>('waiting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  const handleStartSession = () => {
    startSession(sessionId, {
      onSuccess: () => setSessionState('live'),
    });
  };

  const handleEndSession = () => {
    endSession(sessionId, {
      onSuccess: () => {
        setSessionState('ended');
        navigation.goBack();
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1a1a1a' }]}>
      {/* Video Grid Area */}
      <View style={styles.videoArea}>
        {sessionState === 'waiting' && (
          <View style={styles.waitingOverlay}>
            <Icon name="video-outline" size={64} color="white" />
            <Text variant="headlineSmall" style={styles.waitingText}>
              Ready to start class
            </Text>
            <Text variant="bodyMedium" style={styles.waitingSubtext}>
              {session?.title_en}
            </Text>
            <Button mode="contained" onPress={handleStartSession} style={styles.startButton}>
              Start Class
            </Button>
          </View>
        )}

        {sessionState === 'live' && (
          <>
            {/* Teacher Video (Self View) */}
            <Surface style={styles.selfView} elevation={4}>
              <View style={styles.videoPlaceholder}>
                <Icon name="account" size={48} color="white" />
              </View>
              <Chip style={styles.selfLabel}>You</Chip>
            </Surface>

            {/* Participant Grid */}
            <View style={styles.participantGrid}>
              {/* WebRTC video streams would render here */}
            </View>
          </>
        )}
      </View>

      {/* Bottom Controls */}
      <Surface style={styles.controlBar} elevation={4}>
        <View style={styles.controlsRow}>
          <IconButton
            icon={isMuted ? 'microphone-off' : 'microphone'}
            iconColor={isMuted ? theme.colors.error : 'white'}
            size={28}
            onPress={() => setIsMuted(!isMuted)}
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          />
          <IconButton
            icon={isVideoOff ? 'video-off' : 'video'}
            iconColor={isVideoOff ? theme.colors.error : 'white'}
            size={28}
            onPress={() => setIsVideoOff(!isVideoOff)}
            style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
          />
          <IconButton
            icon="monitor-share"
            iconColor={isScreenSharing ? '#4CAF50' : 'white'}
            size={28}
            onPress={() => setIsScreenSharing(!isScreenSharing)}
            style={[styles.controlButton, isScreenSharing && styles.screenShareActive]}
          />
          <IconButton
            icon="draw"
            iconColor="white"
            size={28}
            onPress={() => navigation.navigate('whiteboard', { sessionId })}
            style={styles.controlButton}
          />
          <IconButton
            icon="account-group"
            iconColor="white"
            size={28}
            onPress={() => navigation.navigate('breakout-rooms', { sessionId })}
            style={styles.controlButton}
          />
          <IconButton
            icon="phone-hangup"
            iconColor="white"
            size={28}
            onPress={() => setShowEndModal(true)}
            style={[styles.controlButton, styles.endCallButton]}
          />
        </View>

        <View style={styles.infoRow}>
          <Chip icon="account-group" style={styles.infoChip}>{participantCount} joined</Chip>
          <Chip icon="clock-outline" style={styles.infoChip}>
            {sessionState === 'live' ? 'LIVE' : 'Not Started'}
          </Chip>
        </View>
      </Surface>

      {/* End Session Modal */}
      <Portal>
        <Modal visible={showEndModal} onDismiss={() => setShowEndModal(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.modalTitle}>End Class?</Text>
          <Text variant="bodyMedium" style={styles.modalText}>
            This will end the session for all participants.
          </Text>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowEndModal(false)}>Cancel</Button>
            <Button mode="contained" buttonColor={theme.colors.error} onPress={handleEndSession}>
              End Class
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  videoArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitingOverlay: { alignItems: 'center' },
  waitingText: { color: 'white', marginTop: 16 },
  waitingSubtext: { color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  startButton: { marginTop: 24 },
  selfView: { position: 'absolute', top: 16, right: 16, width: 120, height: 160, borderRadius: 12, overflow: 'hidden' },
  videoPlaceholder: { flex: 1, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  selfLabel: { position: 'absolute', bottom: 8, left: 8 },
  participantGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  controlBar: { backgroundColor: '#2a2a2a', paddingVertical: 12, paddingHorizontal: 16 },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  controlButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24 },
  controlButtonActive: { backgroundColor: 'rgba(255,0,0,0.3)' },
  screenShareActive: { backgroundColor: 'rgba(76,175,80,0.3)' },
  endCallButton: { backgroundColor: '#f44336' },
  infoRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 },
  infoChip: { backgroundColor: 'rgba(255,255,255,0.1)' },
  modal: { backgroundColor: 'white', margin: 20, padding: 24, borderRadius: 12 },
  modalTitle: { marginBottom: 8 },
  modalText: { opacity: 0.7, marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
});
```


### 2.3 WhiteboardScreen.tsx

```typescript
// src/screens/teacher/WhiteboardScreen.tsx
import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { Text, IconButton, Surface, SegmentedButtons, Slider } from 'react-native-paper';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useAppTheme } from '@/theme/useAppTheme';

type Tool = 'pen' | 'highlighter' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'text';
type DrawPath = { d: string; stroke: string; strokeWidth: number; opacity: number };

export const WhiteboardScreen: React.FC = ({ route, navigation }) => {
  const theme = useAppTheme();
  const { sessionId } = route.params;

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  const colors = ['#000000', '#f44336', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#FFFFFF'];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(prev => `${prev} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        if (currentPath) {
          setPaths(prev => [...prev, {
            d: currentPath,
            stroke: tool === 'eraser' ? '#FFFFFF' : color,
            strokeWidth: tool === 'eraser' ? strokeWidth * 3 : strokeWidth,
            opacity: tool === 'highlighter' ? 0.4 : 1,
          }]);
          setCurrentPath('');
        }
      },
    })
  ).current;

  const handleClear = () => setPaths([]);
  const handleUndo = () => setPaths(prev => prev.slice(0, -1));

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <Surface style={styles.toolbar} elevation={2}>
        <View style={styles.toolRow}>
          <SegmentedButtons
            value={tool}
            onValueChange={(v) => setTool(v as Tool)}
            buttons={[
              { value: 'pen', icon: 'pencil' },
              { value: 'highlighter', icon: 'marker' },
              { value: 'eraser', icon: 'eraser' },
              { value: 'line', icon: 'vector-line' },
            ]}
            style={styles.toolButtons}
          />
        </View>

        <View style={styles.colorRow}>
          {colors.map(c => (
            <IconButton
              key={c}
              icon="circle"
              iconColor={c}
              size={24}
              onPress={() => setColor(c)}
              style={[styles.colorButton, color === c && styles.colorButtonActive]}
            />
          ))}
        </View>

        <View style={styles.sizeRow}>
          <Text variant="labelSmall">Size:</Text>
          <Slider
            value={strokeWidth}
            onValueChange={setStrokeWidth}
            minimumValue={1}
            maximumValue={20}
            step={1}
            style={styles.slider}
          />
        </View>

        <View style={styles.actionRow}>
          <IconButton icon="undo" onPress={handleUndo} disabled={paths.length === 0} />
          <IconButton icon="delete" onPress={handleClear} disabled={paths.length === 0} />
          <IconButton icon="content-save" onPress={() => {/* Save whiteboard */}} />
          <IconButton icon="close" onPress={() => navigation.goBack()} />
        </View>
      </Surface>

      {/* Canvas */}
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path.d}
              stroke={path.stroke}
              strokeWidth={path.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={path.opacity}
            />
          ))}
          {currentPath && (
            <Path
              d={currentPath}
              stroke={tool === 'eraser' ? '#FFFFFF' : color}
              strokeWidth={tool === 'eraser' ? strokeWidth * 3 : strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={tool === 'highlighter' ? 0.4 : 1}
            />
          )}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  toolbar: { padding: 12, backgroundColor: 'white' },
  toolRow: { marginBottom: 8 },
  toolButtons: { alignSelf: 'center' },
  colorRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  colorButton: { margin: 0 },
  colorButtonActive: { borderWidth: 2, borderColor: '#2196F3' },
  sizeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  slider: { flex: 1, marginLeft: 8 },
  actionRow: { flexDirection: 'row', justifyContent: 'center' },
  canvas: { flex: 1, backgroundColor: 'white' },
});
```


### 2.4 BreakoutRoomsWidget.tsx

```typescript
// src/components/widgets/teacher/BreakoutRoomsWidget.tsx
import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface, Button, IconButton, Chip, TextInput, Portal, Modal } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/theme/useAppTheme';
import { WidgetContainer } from '@/components/widgets/base/WidgetContainer';
import { TeacherWidgetProps } from '@/types/widget.types';

type BreakoutRoom = {
  id: string;
  name: string;
  participantCount: number;
  maxParticipants: number;
  topic?: string;
  isActive: boolean;
};

export const BreakoutRoomsWidget: React.FC<TeacherWidgetProps> = ({ config, sessionId }) => {
  const theme = useAppTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const rooms: BreakoutRoom[] = [
    { id: '1', name: 'Group 1', participantCount: 4, maxParticipants: 6, topic: 'Problem Set A', isActive: true },
    { id: '2', name: 'Group 2', participantCount: 5, maxParticipants: 6, topic: 'Problem Set B', isActive: true },
    { id: '3', name: 'Group 3', participantCount: 3, maxParticipants: 6, topic: 'Problem Set C', isActive: true },
  ];

  const renderRoom = ({ item }: { item: BreakoutRoom }) => (
    <Surface style={styles.roomCard} elevation={1}>
      <View style={styles.roomHeader}>
        <Text variant="titleSmall">{item.name}</Text>
        <Chip compact icon="account-group">{item.participantCount}/{item.maxParticipants}</Chip>
      </View>
      {item.topic && (
        <Text variant="bodySmall" style={styles.topic}>{item.topic}</Text>
      )}
      <View style={styles.roomActions}>
        <Button mode="text" compact onPress={() => {/* Join room */}}>
          Join
        </Button>
        <Button mode="text" compact onPress={() => {/* Broadcast to room */}}>
          Broadcast
        </Button>
        <IconButton icon="close" size={16} onPress={() => {/* Close room */}} />
      </View>
    </Surface>
  );

  return (
    <WidgetContainer
      title="Breakout Rooms"
      action={
        <Button mode="text" compact onPress={() => setShowCreateModal(true)}>
          + Create
        </Button>
      }
    >
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roomsList}
      />

      <View style={styles.bulkActions}>
        <Button mode="outlined" compact onPress={() => {/* Broadcast to all */}}>
          Broadcast to All
        </Button>
        <Button mode="outlined" compact onPress={() => {/* Close all rooms */}}>
          Close All Rooms
        </Button>
      </View>

      <Portal>
        <Modal visible={showCreateModal} onDismiss={() => setShowCreateModal(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge">Create Breakout Room</Text>
          <TextInput
            label="Room Name"
            value={newRoomName}
            onChangeText={setNewRoomName}
            mode="outlined"
            style={styles.input}
          />
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowCreateModal(false)}>Cancel</Button>
            <Button mode="contained" onPress={() => {/* Create room */}}>Create</Button>
          </View>
        </Modal>
      </Portal>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  roomsList: { paddingVertical: 8 },
  roomCard: { width: 180, padding: 12, marginRight: 12, borderRadius: 12 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topic: { opacity: 0.7, marginTop: 4 },
  roomActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  bulkActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 },
  modal: { backgroundColor: 'white', margin: 20, padding: 24, borderRadius: 12 },
  input: { marginVertical: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
});
```

### 2.5 useStartLiveSession Hook

```typescript
// src/hooks/mutations/teacher/useStartLiveSession.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useStartLiveSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('live_sessions')
        .update({
          status: 'live',
          actual_start_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-session'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
    },
  });
};

export const useEndLiveSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('live_sessions')
        .update({
          status: 'ended',
          actual_end_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-session'] });
    },
  });
};
```

### 2.6 Sprint 9 Checkpoint

✅ **Test Criteria:**
- [ ] Live class host screen loads correctly
- [ ] Start session button works
- [ ] Audio/video toggle controls work
- [ ] Screen sharing toggle works
- [ ] Whiteboard opens and drawing works
- [ ] Breakout rooms can be created
- [ ] End session modal confirms before ending
- [ ] Session status updates in database