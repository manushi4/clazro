"use client";

import { Role, ROLE_LABELS } from "@/types";
import { DrawerConfig, DrawerMenuItem } from "@/types/drawer.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

type Props = {
  config: DrawerConfig;
  menuItems: DrawerMenuItem[];
  role: Role;
};

// Icon helper
const getIcon = (name: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    home: Icons.Home,
    "book-open": Icons.BookOpen,
    calendar: Icons.Calendar,
    "bar-chart-2": Icons.BarChart2,
    settings: Icons.Settings,
    users: Icons.Users,
    bell: Icons.Bell,
    "log-out": Icons.LogOut,
    star: Icons.Star,
    heart: Icons.Heart,
    circle: Icons.Circle,
    "message-circle": Icons.MessageCircle,
    "file-text": Icons.FileText,
    download: Icons.Download,
    trophy: Icons.Trophy,
    gift: Icons.Gift,
    "help-circle": Icons.HelpCircle,
    share: Icons.Share2,
    "credit-card": Icons.CreditCard,
    clipboard: Icons.Clipboard,
    "user-check": Icons.UserCheck,
    "user-plus": Icons.UserPlus,
    "check-square": Icons.CheckSquare,
  };
  return iconMap[name] || Icons.Circle;
};

export const DrawerPreview: React.FC<Props> = ({ config, menuItems, role }) => {
  const theme = useAppTheme();

  // Calculate preview dimensions
  const previewHeight = 600;
  const drawerWidth = Math.min(280, (config.width_percentage / 100) * 360);

  const enabledItems = menuItems.filter((item) => item.enabled);

  // Render header based on style
  const renderHeader = () => {
    if (config.header_style === "none") return null;

    const headerHeight = config.header_height || 180;

    const headerBg =
      config.header_background_style === "gradient"
        ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
        : config.header_background_style === "solid"
        ? theme.primary
        : "transparent";

    return (
      <div
        className="relative overflow-hidden"
        style={{
          height: headerHeight,
          background: headerBg,
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          {config.header_style === "avatar" && (
            <>
              <div
                className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3"
                style={{ border: "2px solid rgba(255,255,255,0.5)" }}
              >
                <Icons.User size={32} className="text-white" />
              </div>
              <p className="text-white font-semibold text-lg">Demo User</p>
              {config.header_show_role && (
                <p className="text-white/80 text-sm capitalize">{ROLE_LABELS[role]}</p>
              )}
              {config.header_show_email && (
                <p className="text-white/60 text-xs mt-1">demo@example.com</p>
              )}
            </>
          )}
          {config.header_style === "logo" && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <Icons.GraduationCap size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Learning App</p>
                {config.header_show_role && (
                  <p className="text-white/80 text-xs capitalize">{ROLE_LABELS[role]}</p>
                )}
              </div>
            </div>
          )}
          {config.header_style === "compact" && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Icons.User size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Demo User</p>
                {config.header_show_role && (
                  <p className="text-white/70 text-xs capitalize">{ROLE_LABELS[role]}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render menu item
  const renderMenuItem = (item: DrawerMenuItem) => {
    if (item.item_type === "divider") {
      return (
        <div
          key={item.item_id}
          className="h-px bg-gray-200 my-2 mx-4"
        />
      );
    }

    if (item.item_type === "section_header") {
      return (
        <div
          key={item.item_id}
          className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide"
        >
          {item.label_en}
        </div>
      );
    }

    const IconComponent = getIcon(item.icon);

    return (
      <div
        key={item.item_id}
        className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-colors ${
          item.highlight
            ? "bg-primary-50 text-primary-700"
            : "hover:bg-gray-100"
        }`}
      >
        <IconComponent
          size={20}
          style={{ color: item.icon_color || (item.highlight ? "#6366F1" : "#6B7280") }}
        />
        <span
          className="flex-1 text-sm font-medium"
          style={{ color: item.text_color || (item.highlight ? "#4338CA" : "#374151") }}
        >
          {item.label_en}
        </span>
        {item.badge_type === "dot" && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: item.badge_color || "#EF4444" }}
          />
        )}
        {item.badge_type === "count" && (
          <span
            className="px-1.5 py-0.5 text-xs font-semibold text-white rounded-full min-w-[20px] text-center"
            style={{ backgroundColor: item.badge_color || "#EF4444" }}
          >
            3
          </span>
        )}
        {item.item_type === "expandable" && (
          <Icons.ChevronDown size={16} className="text-gray-400" />
        )}
      </div>
    );
  };

  // Render footer
  const renderFooter = () => {
    if (!config.footer_enabled) return null;

    return (
      <div className="border-t border-gray-200 p-4">
        {config.footer_show_logout && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 cursor-pointer text-red-600">
            <Icons.LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </div>
        )}
        {config.footer_show_version && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Version 1.0.0
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-100 rounded-xl p-6">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-gray-700">Preview</h3>
        <p className="text-xs text-gray-500">
          {config.position === "left" ? "Left" : "Right"} drawer
        </p>
      </div>

      {/* Phone frame */}
      <div
        className="relative mx-auto bg-gray-800 rounded-3xl overflow-hidden"
        style={{
          width: 360,
          height: previewHeight,
          padding: 8,
        }}
      >
        {/* Screen */}
        <div className="relative w-full h-full bg-gray-50 rounded-2xl overflow-hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: config.overlay_color || "#000000",
              opacity: (config.overlay_opacity || 50) / 100,
              zIndex: 10,
            }}
          />

          {/* Drawer */}
          <div
            className="absolute top-0 bottom-0 bg-white overflow-hidden z-20 flex flex-col"
            style={{
              width: drawerWidth,
              [config.position]: 0,
              borderRadius:
                config.border_radius > 0
                  ? `0 ${config.border_radius}px ${config.border_radius}px 0`
                  : 0,
              boxShadow: config.shadow_enabled
                ? `4px 0 20px rgba(0,0,0,${(config.shadow_opacity || 30) / 100})`
                : "none",
              opacity: (config.background_opacity || 100) / 100,
            }}
          >
            {/* Header */}
            {renderHeader()}

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-2">
              {enabledItems.length > 0 ? (
                enabledItems.map(renderMenuItem)
              ) : (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  No menu items
                </div>
              )}
            </div>

            {/* Footer */}
            {renderFooter()}
          </div>

          {/* Content placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Icons.Smartphone size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">App Content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
