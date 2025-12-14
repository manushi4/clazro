"use client";

import { useState } from "react";
import { useConfigStore, useNotificationSettings } from "@/stores/configStore";
import {
  NOTIFICATION_CATEGORIES,
  NotificationCategory,
  ChannelPriority,
} from "@/types";
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Vibrate,
  Moon,
  Clock,
  Smartphone,
  Palette,
  Image,
  Save,
} from "lucide-react";

export default function NotificationsPage() {
  const notificationSettings = useNotificationSettings();
  const { setNotificationSettings, isDirty } = useConfigStore();
  const [saving, setSaving] = useState(false);

  const handleToggleCategory = (category: NotificationCategory) => {
    setNotificationSettings({
      categories: {
        ...notificationSettings.categories,
        [category]: !notificationSettings.categories[category],
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save to Supabase
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Notification Settings
          </h1>
          <p className="text-gray-500 mt-1">
            Configure push notification behavior for your app
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            {notificationSettings.notifications_enabled ? (
              <Bell className="text-primary-600" size={24} />
            ) : (
              <BellOff className="text-gray-400" size={24} />
            )}
            <h2 className="font-semibold text-gray-900">
              Push Notifications
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">
                Enable Notifications
              </div>
              <div className="text-sm text-gray-500">
                Master toggle for all push notifications
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.notifications_enabled}
                onChange={(e) =>
                  setNotificationSettings({
                    notifications_enabled: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        {/* Sound & Vibration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="text-primary-600" size={24} />
            <h2 className="font-semibold text-gray-900">Sound & Vibration</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {notificationSettings.sound_enabled ? (
                  <Volume2 size={18} className="text-gray-500" />
                ) : (
                  <VolumeX size={18} className="text-gray-400" />
                )}
                <span className="text-gray-700">Sound</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.sound_enabled}
                  onChange={(e) =>
                    setNotificationSettings({ sound_enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate size={18} className="text-gray-500" />
                <span className="text-gray-700">Vibration</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.vibration_enabled}
                  onChange={(e) =>
                    setNotificationSettings({
                      vibration_enabled: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Moon className="text-primary-600" size={24} />
            <h2 className="font-semibold text-gray-900">Quiet Hours</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">Enable Quiet Hours</div>
                <div className="text-sm text-gray-500">
                  Silence notifications during specified hours
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.quiet_hours_enabled}
                  onChange={(e) =>
                    setNotificationSettings({
                      quiet_hours_enabled: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {notificationSettings.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <div className="relative">
                    <Clock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="time"
                      value={notificationSettings.quiet_hours_start}
                      onChange={(e) =>
                        setNotificationSettings({
                          quiet_hours_start: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <div className="relative">
                    <Clock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="time"
                      value={notificationSettings.quiet_hours_end}
                      onChange={(e) =>
                        setNotificationSettings({
                          quiet_hours_end: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Android Channel Config */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="text-primary-600" size={24} />
            <h2 className="font-semibold text-gray-900">Android Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Priority
              </label>
              <select
                value={notificationSettings.channel_config.default_priority}
                onChange={(e) =>
                  setNotificationSettings({
                    channel_config: {
                      ...notificationSettings.channel_config,
                      default_priority: e.target.value as ChannelPriority,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="default">Default</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Show Badge Count</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.channel_config.show_badge}
                  onChange={(e) =>
                    setNotificationSettings({
                      channel_config: {
                        ...notificationSettings.channel_config,
                        show_badge: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Group Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.channel_config.group_notifications}
                  onChange={(e) =>
                    setNotificationSettings({
                      channel_config: {
                        ...notificationSettings.channel_config,
                        group_notifications: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="text-primary-600" size={24} />
            <h2 className="font-semibold text-gray-900">Notification Branding</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Custom Icon</div>
                  <div className="text-sm text-gray-500">
                    Use branded icon for notifications
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.use_custom_icon}
                    onChange={(e) =>
                      setNotificationSettings({
                        use_custom_icon: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {notificationSettings.use_custom_icon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon URL
                  </label>
                  <div className="relative">
                    <Image
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="url"
                      value={notificationSettings.custom_icon_url || ""}
                      onChange={(e) =>
                        setNotificationSettings({
                          custom_icon_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={notificationSettings.accent_color || "#6366f1"}
                  onChange={(e) =>
                    setNotificationSettings({ accent_color: e.target.value })
                  }
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={notificationSettings.accent_color || "#6366f1"}
                  onChange={(e) =>
                    setNotificationSettings({ accent_color: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used for notification LED and accent elements
              </p>
            </div>
          </div>
        </div>

        {/* Notification Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">
            Notification Categories
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Enable or disable specific notification types for your app
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {NOTIFICATION_CATEGORIES.map((category) => (
              <div
                key={category.id}
                className={`p-4 rounded-lg border transition-colors ${
                  notificationSettings.categories[category.id]
                    ? "border-primary-200 bg-primary-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {category.label}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.categories[category.id]}
                      onChange={() => handleToggleCategory(category.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-500">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
