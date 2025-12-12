// Simple EventEmitter implementation for React Native
class SimpleEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }
}
import { Alert } from 'react-native';

export interface VideoCallParticipant {
  id: string;
  name: string;
  role: 'teacher' | 'student' | 'parent' | 'admin';
  avatar?: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isHandRaised: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  joinedAt: Date;
  lastSeen: Date;
}

export interface VideoCallSession {
  id: string;
  roomId: string;
  title: string;
  description?: string;
  hostId: string;
  participants: VideoCallParticipant[];
  maxParticipants: number;
  isRecording: boolean;
  recordingUrl?: string;
  startTime: Date;
  endTime?: Date;
  settings: {
    allowStudentVideo: boolean;
    allowStudentAudio: boolean;
    requirePermissionToJoin: boolean;
    enableChat: boolean;
    enableScreenShare: boolean;
    enableWhiteboard: boolean;
    recordingEnabled: boolean;
  };
  metadata: {
    subject?: string;
    classId?: string;
    sessionType: 'live_class' | 'doubt_session' | 'one_on_one' | 'group_study';
  };
}

export interface ScreenShareSession {
  id: string;
  callId: string;
  presenterId: string;
  presenterName: string;
  title: string;
  isActive: boolean;
  quality: 'low' | 'medium' | 'high';
  startTime: Date;
  endTime?: Date;
  viewerCount: number;
  hasAudio: boolean;
}

export interface CallStatistics {
  callId: string;
  duration: number;
  participantCount: number;
  peakParticipants: number;
  averageConnectionQuality: number;
  totalMessages: number;
  recordingDuration?: number;
  bandwidthUsed: number;
  qualityIssues: {
    audioDropouts: number;
    videoFreezes: number;
    connectionLoss: number;
  };
}

export interface VideoCallNotification {
  id: string;
  type: 'call_started' | 'participant_joined' | 'participant_left' | 'hand_raised' | 'screen_share_started' | 'recording_started' | 'quality_issue';
  callId: string;
  participantId?: string;
  participantName?: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

class VideoCallService extends SimpleEventEmitter {
  private sessions: Map<string, VideoCallSession> = new Map();
  private userSessions: Map<string, string> = new Map(); // userId -> sessionId
  private screenShareSessions: Map<string, ScreenShareSession> = new Map();
  private callStatistics: Map<string, CallStatistics> = new Map();

  async createVideoCall(
    hostId: string,
    title: string,
    settings: VideoCallSession['settings'],
    metadata: VideoCallSession['metadata']
  ): Promise<VideoCallSession> {
    const sessionId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const roomId = `room_${sessionId}`;

    const session: VideoCallSession = {
      id: sessionId,
      roomId,
      title,
      hostId,
      participants: [],
      maxParticipants: 100,
      isRecording: false,
      startTime: new Date(),
      settings,
      metadata
    };

    this.sessions.set(sessionId, session);
    this.initializeCallStatistics(sessionId);

    this.emit('callCreated', session);
    return session;
  }

  async joinVideoCall(
    sessionId: string,
    participant: Omit<VideoCallParticipant, 'joinedAt' | 'lastSeen' | 'connectionQuality'>
  ): Promise<VideoCallSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.participants.length >= session.maxParticipants) {
      throw new Error('Call is at maximum capacity');
    }

    const fullParticipant: VideoCallParticipant = {
      ...participant,
      joinedAt: new Date(),
      lastSeen: new Date(),
      connectionQuality: 'good'
    };

    session.participants.push(fullParticipant);
    this.userSessions.set(participant.id, sessionId);

    this.updateCallStatistics(sessionId, 'participant_joined');
    this.emit('participantJoined', { session, participant: fullParticipant });

    const notification: VideoCallNotification = {
      id: `notif_${Date.now()}`,
      type: 'participant_joined',
      callId: sessionId,
      participantId: participant.id,
      participantName: participant.name,
      message: `${participant.name} joined the call`,
      timestamp: new Date(),
      priority: 'low'
    };

    this.emit('callNotification', notification);
    return session;
  }

  async leaveVideoCall(sessionId: string, participantId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const participantIndex = session.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) return false;

    const participant = session.participants[participantIndex];
    session.participants.splice(participantIndex, 1);
    this.userSessions.delete(participantId);

    if (session.hostId === participantId && session.participants.length > 0) {
      session.hostId = session.participants[0].id;
    }

    this.updateCallStatistics(sessionId, 'participant_left');
    this.emit('participantLeft', { session, participantId });

    const notification: VideoCallNotification = {
      id: `notif_${Date.now()}`,
      type: 'participant_left',
      callId: sessionId,
      participantId,
      participantName: participant.name,
      message: `${participant.name} left the call`,
      timestamp: new Date(),
      priority: 'low'
    };

    this.emit('callNotification', notification);

    if (session.participants.length === 0) {
      await this.endVideoCall(sessionId);
    }

    return true;
  }

  async toggleMute(sessionId: string, participantId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) return false;

    participant.isMuted = !participant.isMuted;
    participant.lastSeen = new Date();

    this.emit('participantUpdated', { session, participant });
    return participant.isMuted;
  }

  async toggleVideo(sessionId: string, participantId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) return false;

    participant.isVideoEnabled = !participant.isVideoEnabled;
    participant.lastSeen = new Date();

    this.emit('participantUpdated', { session, participant });
    return participant.isVideoEnabled;
  }

  async raiseHand(sessionId: string, participantId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) return false;

    participant.isHandRaised = !participant.isHandRaised;
    participant.lastSeen = new Date();

    this.emit('participantUpdated', { session, participant });

    if (participant.isHandRaised) {
      const notification: VideoCallNotification = {
        id: `notif_${Date.now()}`,
        type: 'hand_raised',
        callId: sessionId,
        participantId,
        participantName: participant.name,
        message: `${participant.name} raised their hand`,
        timestamp: new Date(),
        priority: 'medium'
      };

      this.emit('callNotification', notification);
    }

    return participant.isHandRaised;
  }

  async startScreenShare(
    sessionId: string,
    presenterId: string,
    title: string = 'Screen Share'
  ): Promise<ScreenShareSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.settings.enableScreenShare) return null;

    const presenter = session.participants.find(p => p.id === presenterId);
    if (!presenter) return null;

    // End any existing screen share
    const existingScreenShare = Array.from(this.screenShareSessions.values())
      .find(ss => ss.callId === sessionId && ss.isActive);
    if (existingScreenShare) {
      await this.stopScreenShare(existingScreenShare.id);
    }

    const screenShareId = `screen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const screenShare: ScreenShareSession = {
      id: screenShareId,
      callId: sessionId,
      presenterId,
      presenterName: presenter.name,
      title,
      isActive: true,
      quality: 'medium',
      startTime: new Date(),
      viewerCount: session.participants.length - 1,
      hasAudio: true
    };

    this.screenShareSessions.set(screenShareId, screenShare);
    this.emit('screenShareStarted', { session, screenShare });

    const notification: VideoCallNotification = {
      id: `notif_${Date.now()}`,
      type: 'screen_share_started',
      callId: sessionId,
      participantId: presenterId,
      participantName: presenter.name,
      message: `${presenter.name} started screen sharing`,
      timestamp: new Date(),
      priority: 'medium'
    };

    this.emit('callNotification', notification);
    return screenShare;
  }

  async stopScreenShare(screenShareId: string): Promise<boolean> {
    const screenShare = this.screenShareSessions.get(screenShareId);
    if (!screenShare || !screenShare.isActive) return false;

    screenShare.isActive = false;
    screenShare.endTime = new Date();

    const session = this.sessions.get(screenShare.callId);
    this.emit('screenShareEnded', { session, screenShare });

    return true;
  }

  async startRecording(sessionId: string, hostId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.hostId !== hostId || !session.settings.recordingEnabled) {
      return false;
    }

    session.isRecording = true;
    this.emit('recordingStarted', session);

    const notification: VideoCallNotification = {
      id: `notif_${Date.now()}`,
      type: 'recording_started',
      callId: sessionId,
      message: 'Recording started',
      timestamp: new Date(),
      priority: 'high'
    };

    this.emit('callNotification', notification);
    return true;
  }

  async stopRecording(sessionId: string, hostId: string): Promise<string | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.hostId !== hostId || !session.isRecording) {
      return null;
    }

    session.isRecording = false;
    const recordingUrl = `recording_${sessionId}_${Date.now()}.mp4`;
    session.recordingUrl = recordingUrl;

    this.emit('recordingStopped', { session, recordingUrl });
    return recordingUrl;
  }

  async endVideoCall(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.endTime = new Date();

    // Stop any active screen sharing
    const activeScreenShare = Array.from(this.screenShareSessions.values())
      .find(ss => ss.callId === sessionId && ss.isActive);
    if (activeScreenShare) {
      await this.stopScreenShare(activeScreenShare.id);
    }

    // Stop recording if active
    if (session.isRecording) {
      await this.stopRecording(sessionId, session.hostId);
    }

    // Clear user sessions
    session.participants.forEach(p => {
      this.userSessions.delete(p.id);
    });

    this.finalizeCallStatistics(sessionId);
    this.emit('callEnded', session);

    return true;
  }

  async updateConnectionQuality(
    sessionId: string,
    participantId: string,
    quality: VideoCallParticipant['connectionQuality']
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) return;

    const wasGood = participant.connectionQuality === 'good' || participant.connectionQuality === 'excellent';
    const isGood = quality === 'good' || quality === 'excellent';

    participant.connectionQuality = quality;
    participant.lastSeen = new Date();

    if (wasGood && !isGood) {
      this.updateCallStatistics(sessionId, 'quality_issue');
      
      const notification: VideoCallNotification = {
        id: `notif_${Date.now()}`,
        type: 'quality_issue',
        callId: sessionId,
        participantId,
        participantName: participant.name,
        message: `${participant.name} is experiencing connection issues`,
        timestamp: new Date(),
        priority: 'medium'
      };

      this.emit('callNotification', notification);
    }

    this.emit('participantUpdated', { session, participant });
  }

  getSessionById(sessionId: string): VideoCallSession | undefined {
    return this.sessions.get(sessionId);
  }

  getUserActiveSession(userId: string): VideoCallSession | undefined {
    const sessionId = this.userSessions.get(userId);
    return sessionId ? this.sessions.get(sessionId) : undefined;
  }

  getActiveScreenShare(sessionId: string): ScreenShareSession | undefined {
    return Array.from(this.screenShareSessions.values())
      .find(ss => ss.callId === sessionId && ss.isActive);
  }

  getCallStatistics(sessionId: string): CallStatistics | undefined {
    return this.callStatistics.get(sessionId);
  }

  private initializeCallStatistics(sessionId: string): void {
    const stats: CallStatistics = {
      callId: sessionId,
      duration: 0,
      participantCount: 0,
      peakParticipants: 0,
      averageConnectionQuality: 100,
      totalMessages: 0,
      bandwidthUsed: 0,
      qualityIssues: {
        audioDropouts: 0,
        videoFreezes: 0,
        connectionLoss: 0
      }
    };

    this.callStatistics.set(sessionId, stats);
  }

  private updateCallStatistics(sessionId: string, event: string): void {
    const stats = this.callStatistics.get(sessionId);
    const session = this.sessions.get(sessionId);
    if (!stats || !session) return;

    stats.participantCount = session.participants.length;
    stats.peakParticipants = Math.max(stats.peakParticipants, stats.participantCount);

    switch (event) {
      case 'quality_issue':
        stats.qualityIssues.connectionLoss++;
        break;
      case 'message_sent':
        stats.totalMessages++;
        break;
    }
  }

  private finalizeCallStatistics(sessionId: string): void {
    const stats = this.callStatistics.get(sessionId);
    const session = this.sessions.get(sessionId);
    if (!stats || !session) return;

    if (session.endTime) {
      stats.duration = session.endTime.getTime() - session.startTime.getTime();
    }

    // Calculate average connection quality
    const qualityScores = session.participants.map(p => {
      switch (p.connectionQuality) {
        case 'excellent': return 100;
        case 'good': return 80;
        case 'fair': return 60;
        case 'poor': return 30;
        default: return 50;
      }
    });

    if (qualityScores.length > 0) {
      stats.averageConnectionQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    }
  }

  // Cleanup method for memory management
  cleanup(): void {
    // Clean up ended sessions older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.endTime && session.endTime < oneDayAgo) {
        this.sessions.delete(sessionId);
        this.callStatistics.delete(sessionId);
        
        // Clean up screen share sessions
        for (const [screenShareId, screenShare] of this.screenShareSessions.entries()) {
          if (screenShare.callId === sessionId) {
            this.screenShareSessions.delete(screenShareId);
          }
        }
      }
    }
  }
}

export const videoCallService = new VideoCallService();