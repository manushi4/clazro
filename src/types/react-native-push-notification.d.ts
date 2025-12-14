declare module 'react-native-push-notification' {
  export interface PushNotificationObject {
    id?: string;
    title?: string;
    message: string;
    userInfo?: Record<string, unknown>;
    channelId?: string;
    largeIcon?: string;
    smallIcon?: string;
    bigPictureUrl?: string;
    bigLargeIcon?: string;
    bigText?: string;
    subText?: string;
    color?: string;
    vibrate?: boolean;
    vibration?: number;
    tag?: string;
    group?: string;
    groupSummary?: boolean;
    ongoing?: boolean;
    priority?: 'max' | 'high' | 'low' | 'min' | 'default';
    visibility?: 'private' | 'public' | 'secret';
    importance?: 'default' | 'max' | 'high' | 'low' | 'min' | 'none' | 'unspecified';
    allowWhileIdle?: boolean;
    ignoreInForeground?: boolean;
    shortcutId?: string;
    number?: number;
    repeatType?: 'week' | 'day' | 'hour' | 'minute' | 'time';
    repeatTime?: number;
    actions?: string[];
    invokeApp?: boolean;
    playSound?: boolean;
    soundName?: string;
    timeoutAfter?: number | null;
    when?: number | null;
    usesChronometer?: boolean;
    data?: Record<string, unknown>;
    userInteraction?: boolean;
  }

  export interface ChannelObject {
    channelId: string;
    channelName: string;
    channelDescription?: string;
    playSound?: boolean;
    soundName?: string;
    importance?: number;
    vibrate?: boolean;
  }

  export interface ConfigureOptions {
    onRegister?: (token: { os: string; token: string }) => void;
    onNotification?: (notification: PushNotificationObject) => void;
    onAction?: (notification: PushNotificationObject) => void;
    onRegistrationError?: (err: Error) => void;
    permissions?: {
      alert?: boolean;
      badge?: boolean;
      sound?: boolean;
    };
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  }

  const PushNotification: {
    configure: (options: ConfigureOptions) => void;
    localNotification: (details: PushNotificationObject) => void;
    localNotificationSchedule: (details: PushNotificationObject & { date: Date }) => void;
    cancelLocalNotification: (id: string) => void;
    cancelAllLocalNotifications: () => void;
    createChannel: (channel: ChannelObject, callback: (created: boolean) => void) => void;
    deleteChannel: (channelId: string) => void;
    getChannels: (callback: (channels: string[]) => void) => void;
    requestPermissions: () => Promise<{ alert: boolean; badge: boolean; sound: boolean }>;
    checkPermissions: (callback: (permissions: { alert: boolean; badge: boolean; sound: boolean }) => void) => void;
    setApplicationIconBadgeNumber: (number: number) => void;
    getApplicationIconBadgeNumber: (callback: (number: number) => void) => void;
    popInitialNotification: (callback: (notification: PushNotificationObject | null) => void) => void;
    abandonPermissions: () => void;
    clearAllNotifications: () => void;
    removeAllDeliveredNotifications: () => void;
    getDeliveredNotifications: (callback: (notifications: PushNotificationObject[]) => void) => void;
    getScheduledLocalNotifications: (callback: (notifications: PushNotificationObject[]) => void) => void;
  };

  export default PushNotification;
}
