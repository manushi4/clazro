// Real-time UI Components
export { default as ChatWindow } from './ChatWindow';
export { default as MessageBubble } from './MessageBubble';
export { default as LivePoll } from './LivePoll';
export { default as LiveClassIndicator } from './LiveClassIndicator';
export { default as NotificationBanner } from './NotificationBanner';
export { default as PresenceIndicator } from './PresenceIndicator';
export { default as TypingIndicator } from './TypingIndicator';

// Real-time Services
export { realtimeConnection } from '../../services/realtime/RealtimeConnectionManager';
export { chatService } from '../../services/realtime/ChatService';
export { liveClassService } from '../../services/realtime/LiveClassService';
export { pollService } from '../../services/realtime/PollService';
export { notificationService } from '../../services/realtime/NotificationService';
export { presenceService } from '../../services/realtime/PresenceService';
export { realtimeDataService } from '../../services/realtime/RealtimeDataService';

// Context
export { RealtimeProvider, useRealtime } from '../../context/RealtimeContext';

// Types
export type {
  ChatRoom,
  ChatMessage,
  RoomParticipant,
  SendMessageOptions,
} from '../../services/realtime/ChatService';

export type {
  LiveSession,
  SessionParticipant,
  CreateSessionOptions,
  JoinSessionOptions,
} from '../../services/realtime/LiveClassService';

export type {
  Poll,
  PollOption,
  PollResponse,
  PollResults,
  CreatePollOptions,
} from '../../services/realtime/PollService';

export type {
  Notification,
  NotificationPreferences,
  CreateNotificationOptions,
} from '../../services/realtime/NotificationService';

export type {
  UserPresence,
  PresenceStatus,
} from '../../services/realtime/PresenceService';

export type {
  DashboardData,
  RealtimeUpdate,
  DataSubscription,
} from '../../services/realtime/RealtimeDataService';

export type {
  ConnectionState,
  RealtimeSubscription,
  ConnectionOptions,
} from '../../services/realtime/RealtimeConnectionManager';