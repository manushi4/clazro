// Notification category types
export type NotificationCategory =
  | "assignments"
  | "tests"
  | "announcements"
  | "doubts"
  | "attendance"
  | "grades"
  | "schedule"
  | "reminders"
  | "system";

export const NOTIFICATION_CATEGORIES: {
  id: NotificationCategory;
  label: string;
  description: string;
}[] = [
  { id: "assignments", label: "Assignments", description: "New assignments and deadlines" },
  { id: "tests", label: "Tests & Exams", description: "Upcoming tests and results" },
  { id: "announcements", label: "Announcements", description: "School/institute announcements" },
  { id: "doubts", label: "Doubts", description: "Doubt responses and updates" },
  { id: "attendance", label: "Attendance", description: "Attendance alerts" },
  { id: "grades", label: "Grades", description: "Grade updates and report cards" },
  { id: "schedule", label: "Schedule", description: "Class schedule changes" },
  { id: "reminders", label: "Reminders", description: "Study reminders and tips" },
  { id: "system", label: "System", description: "App updates and maintenance" },
];

// Channel priority
export type ChannelPriority = "low" | "default" | "high" | "urgent";

// Channel configuration
export type ChannelConfig = {
  default_priority: ChannelPriority;
  show_badge: boolean;
  group_notifications: boolean;
};

// Complete notification settings
export type NotificationSettings = {
  id?: string;
  customer_id: string;
  notifications_enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:mm format
  quiet_hours_end: string;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  channel_config: ChannelConfig;
  use_custom_icon: boolean;
  custom_icon_url?: string;
  accent_color?: string;
};

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: Omit<NotificationSettings, "customer_id"> = {
  notifications_enabled: true,
  categories: {
    assignments: true,
    tests: true,
    announcements: true,
    doubts: true,
    attendance: true,
    grades: true,
    schedule: true,
    reminders: true,
    system: true,
  },
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  sound_enabled: true,
  vibration_enabled: true,
  channel_config: {
    default_priority: "high",
    show_badge: true,
    group_notifications: true,
  },
  use_custom_icon: false,
};
