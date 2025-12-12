"use client";

import { ScreenWidgetConfig, TabConfig, ThemeConfig, CustomerBranding } from "@/types";
import { widgetRegistry } from "@/config/widgetRegistry";
import { Bell, ChevronRight, Flame, Clock, Trophy, Star, BookOpen, HelpCircle, Video, ClipboardCheck } from "lucide-react";

// Widget title mapping to match mobile app translations
const WIDGET_TITLES: Record<string, { title: string; subtitle: string }> = {
  "hero.greeting": { title: "Welcome", subtitle: "Quick stats and greeting" },
  "schedule.today": { title: "Today's Schedule", subtitle: "Your classes today" },
  "actions.quick": { title: "Quick Actions", subtitle: "Common tasks" },
  "assignments.pending": { title: "Assignments & Tests", subtitle: "Pending work" },
  "doubts.inbox": { title: "Doubts Inbox", subtitle: "Your questions" },
  "progress.snapshot": { title: "Progress Snapshot", subtitle: "Your learning progress" },
  "progress.subject-wise": { title: "Subject Progress", subtitle: "Detailed progress by subject" },
  "progress.streak": { title: "Study Streak", subtitle: "Your learning consistency" },
  "stats.grid": { title: "Statistics", subtitle: "Your learning stats at a glance" },
  "quests.active": { title: "Active Quests", subtitle: "Complete quests to earn XP" },
  "profile.card": { title: "Profile", subtitle: "Your profile information" },
  "profile.stats": { title: "Statistics", subtitle: "Your learning stats" },
  "profile.achievements": { title: "Achievements", subtitle: "Your badges and rewards" },
  "profile.activity": { title: "Recent Activity", subtitle: "Your learning journey" },
};

// Widget icons mapping
const WIDGET_ICONS: Record<string, string> = {
  "hero.greeting": "👋",
  "schedule.today": "📅",
  "actions.quick": "⚡",
  "assignments.pending": "📋",
  "doubts.inbox": "💬",
  "progress.snapshot": "📊",
  "progress.subject-wise": "📚",
  "progress.streak": "🔥",
  "stats.grid": "📊",
  "quests.active": "🎯",
  "profile.card": "👤",
  "profile.stats": "📈",
  "profile.achievements": "🏆",
  "profile.activity": "📋",
};

// Tab icons mapping
const TAB_ICONS: Record<string, string> = {
  home: "🏠",
  library: "📚",
  help: "❓",
  "trending-up": "📈",
  person: "👤",
};

type DevicePreviewProps = {
  widgets: ScreenWidgetConfig[];
  tabs: TabConfig[];
  theme: Omit<ThemeConfig, "customer_id">;
  branding: Omit<CustomerBranding, "customer_id">;
  selectedScreen: string;
};

export function DevicePreview({ widgets, tabs, theme, branding, selectedScreen }: DevicePreviewProps) {
  const enabledTabs = tabs.filter((t) => t.enabled);
  const activeTabIndex = enabledTabs.findIndex((t) => t.root_screen_id === selectedScreen);
  const primaryColor = theme.primary_color || "#6366F1";
  const textColor = theme.text_color || "#1C1B1F";
  const surfaceColor = theme.surface_color || "#FFFFFF";
  const bgColor = theme.background_color || "#F5F5F5";

  return (
    <div className="p-3">
      <div className="mx-auto w-[280px]">
        <div className="rounded-[2rem] p-1.5 shadow-xl bg-[#1a1a1a]">
          <div className="flex justify-center mb-0.5">
            <div className="w-20 h-5 rounded-b-xl bg-black" />
          </div>
          <div className="rounded-[1.5rem] overflow-hidden h-[520px] flex flex-col" style={{ backgroundColor: bgColor }}>
            {/* Status bar */}
            <div className="h-5 flex items-center justify-between px-4 text-[9px] font-medium" style={{ color: textColor }}>
              <span>9:41</span>
              <div className="flex gap-1">📶 🔋</div>
            </div>

            {/* App Header - matches BrandedHeader */}
            <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: surfaceColor }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>
                  {(branding.app_name || "K").charAt(0)}
                </div>
                <div>
                  <div className="text-[11px] font-semibold" style={{ color: textColor }}>{branding.app_name || "App"}</div>
                  {branding.app_tagline && <div className="text-[8px]" style={{ color: textColor + "70" }}>{branding.app_tagline}</div>}
                </div>
              </div>
              <Bell size={16} style={{ color: textColor + "50" }} />
            </div>

            {/* Content - Widget list */}
            <div className="flex-1 p-2 space-y-2 overflow-auto" style={{ backgroundColor: bgColor }}>
              {widgets.filter((w) => w.enabled).sort((a, b) => a.position - b.position).map((widget) => (
                <PreviewWidget key={widget.widget_id} widget={widget} theme={theme} />
              ))}
              {widgets.filter(w => w.enabled).length === 0 && (
                <div className="h-full flex items-center justify-center text-[10px]" style={{ color: textColor + "40" }}>No widgets</div>
              )}
            </div>

            {/* Tab bar */}
            <div className="h-14 border-t flex items-center justify-around" style={{ backgroundColor: surfaceColor, borderColor: textColor + "15" }}>
              {enabledTabs.slice(0, 5).map((tab, i) => (
                <div key={tab.tab_id} className="flex flex-col items-center gap-0.5" style={{ color: i === activeTabIndex ? primaryColor : textColor + "50" }}>
                  <span className="text-base">{TAB_ICONS[tab.icon] || "📱"}</span>
                  <span className="text-[8px] font-medium">{tab.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewWidget({ widget, theme }: { widget: ScreenWidgetConfig; theme: Omit<ThemeConfig, "customer_id"> }) {
  const metadata = widgetRegistry[widget.widget_id];
  if (!metadata) return null;

  const props = widget.custom_props || {};
  const accentColor = (props.accentColor as string) || theme.primary_color || "#6366F1";
  const showHeader = props.showHeader !== false;
  const borderRadius = (props.borderRadius as number) ?? theme.roundness ?? 12;
  const shadow = (props.shadow as string) || "small";
  const textColor = theme.text_color || "#1C1B1F";
  const surfaceColor = theme.surface_color || "#FFFFFF";
  
  const titles = WIDGET_TITLES[widget.widget_id] || { title: metadata.name, subtitle: metadata.description };
  const shadowClass = shadow === "none" ? "" : shadow === "medium" ? "shadow-md" : "shadow-sm";

  return (
    <div className={`overflow-hidden ${shadowClass}`} style={{ backgroundColor: surfaceColor, borderRadius: `${Math.min(borderRadius, 16)}px` }}>
      {/* Accent bar at top */}
      <div className="h-[3px]" style={{ backgroundColor: accentColor }} />
      
      <div className="p-3">
        {showHeader && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor + "15" }}>
              <span className="text-base">{WIDGET_ICONS[widget.widget_id] || "📱"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold" style={{ color: textColor }}>{titles.title}</div>
              <div className="text-[8px]" style={{ color: textColor + "60" }}>{titles.subtitle}</div>
            </div>
            <ChevronRight size={14} style={{ color: textColor + "30" }} />
          </div>
        )}
        <WidgetContent widgetId={widget.widget_id} theme={theme} props={props} size={widget.size} />
      </div>
    </div>
  );
}

function WidgetContent({ widgetId, theme, props, size }: { widgetId: string; theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown>; size: string }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const accentColor = (props.accentColor as string) || theme.primary_color || "#6366F1";

  switch (widgetId) {
    case "hero.greeting":
      return <HeroContent theme={theme} props={props} size={size} />;
    case "schedule.today":
      return <ScheduleContent theme={theme} props={props} />;
    case "actions.quick":
      return <QuickActionsContent theme={theme} props={props} />;
    case "progress.snapshot":
      return <ProgressContent theme={theme} props={props} />;
    case "progress.subject-wise":
      return <SubjectProgressContent theme={theme} props={props} />;
    case "progress.streak":
      return <StudyStreakContent theme={theme} props={props} />;
    case "stats.grid":
      return <StatsGridContent theme={theme} props={props} />;
    case "quests.active":
      return <ActiveQuestsContent theme={theme} props={props} />;
    case "doubts.inbox":
      return <DoubtsContent theme={theme} props={props} />;
    case "assignments.pending":
      return <AssignmentsContent theme={theme} props={props} />;
    case "profile.card":
      return <ProfileCardContent theme={theme} props={props} />;
    case "profile.stats":
      return <ProfileStatsContent theme={theme} props={props} />;
    case "profile.achievements":
      return <ProfileAchievementsContent theme={theme} props={props} />;
    case "profile.activity":
      return <ProfileActivityContent theme={theme} props={props} />;
    case "peers.leaderboard":
      return <PeersLeaderboardContent theme={theme} props={props} />;
    case "continue.learning":
      return <ContinueLearningContent theme={theme} props={props} />;
    default:
      return <div className="h-8 rounded flex items-center justify-center" style={{ backgroundColor: bgVariant }}><span className="text-[8px]" style={{ color: textColor + "40" }}>Preview</span></div>;
  }
}

// Hero Widget - matches HeroCardWidget.tsx
function HeroContent({ theme, props, size }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown>; size: string }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const accentColor = (props.accentColor as string) || theme.primary_color || "#6366F1";
  
  const greetingStyle = (props.greetingStyle as string) || "friendly";
  const customGreeting = props.customGreeting as string;
  const showEmoji = props.showEmoji !== false;
  const showAvatar = props.showAvatar !== false;
  const avatarStyle = (props.avatarStyle as string) || "circle";
  const showUserName = props.showUserName !== false;
  const showSubtitle = props.showSubtitle !== false;
  const showStats = props.showStats !== false;
  const showStreak = props.showStreak !== false;
  const showStudyTime = props.showStudyTime !== false;
  const showScore = props.showScore !== false;
  const showXP = props.showXP === true;

  const greeting = customGreeting || (greetingStyle === "emoji" ? "🌅 Good Morning" : "WHy are u here");
  const avatarRadius = avatarStyle === "circle" ? "rounded-full" : avatarStyle === "rounded" ? "rounded-lg" : "rounded";

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-[9px]" style={{ color: textColor + "70" }}>{greeting} {showEmoji && greetingStyle !== "emoji" && "👋"}</div>
          {showUserName && <div className="text-base font-bold" style={{ color: textColor }}>Student</div>}
          {showSubtitle && <div className="text-[8px]" style={{ color: textColor + "60" }}>{(props.customSubtitle as string) || "NOW LEAN"}</div>}
        </div>
        {showAvatar && <div className={`w-10 h-10 ${avatarRadius} flex items-center justify-center`} style={{ backgroundColor: accentColor + "20" }}><span className="text-lg">👤</span></div>}
      </div>
      {showStats && size !== "compact" && (
        <div className="flex justify-around py-2 rounded-xl" style={{ backgroundColor: bgVariant }}>
          {showStreak && <StatItem icon={<Flame size={14} style={{ color: accentColor }} />} value="7" label="Day Streak" textColor={textColor} />}
          {showStudyTime && <StatItem icon={<Clock size={14} style={{ color: theme.secondary_color || "#958DA5" }} />} value="2.5h" label="Today" textColor={textColor} />}
          {showScore && <StatItem icon={<Trophy size={14} className="text-yellow-500" />} value="85%" label="Score" textColor={textColor} />}
          {showXP && <StatItem icon={<Star size={14} className="text-purple-500" />} value="1.2k" label="XP" textColor={textColor} />}
        </div>
      )}
    </div>
  );
}

function StatItem({ icon, value, label, textColor }: { icon: React.ReactNode; value: string; label: string; textColor: string }) {
  return (
    <div className="text-center">
      <div className="flex justify-center">{icon}</div>
      <div className="text-sm font-bold mt-0.5" style={{ color: textColor }}>{value}</div>
      <div className="text-[7px]" style={{ color: textColor + "60" }}>{label}</div>
    </div>
  );
}

// Schedule Widget - matches TodayScheduleWidget.tsx
function ScheduleContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  
  const maxItems = Math.min((props.maxItems as number) || 3, 3);
  const layoutStyle = (props.layoutStyle as string) || "list";
  const showTimeIndicator = props.showTimeIndicator !== false;
  const showIcon = props.showIcon !== false;
  const showTime = props.showTime !== false;
  const showBadges = props.showBadges !== false;
  const highlightNext = props.highlightNext !== false;

  const items = [
    { title: "Mathematics", time: "9:00 AM", color: "#6366F1", icon: "📚" },
    { title: "Physics Lab", time: "11:00 AM", color: "#10B981", icon: "🔬" },
    { title: "Essay Due", time: "2:00 PM", color: "#F59E0B", icon: "📝", badge: "Due" },
  ];

  // Cards layout - horizontal scrollable cards
  if (layoutStyle === "cards") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.slice(0, maxItems).map((item, i) => (
          <div key={i} className="flex-shrink-0 w-24 p-2 rounded-xl shadow-sm" style={{ backgroundColor: bgVariant, border: i === 0 && highlightNext ? `2px solid ${item.color}` : "1px solid #e5e7eb" }}>
            {showIcon && <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2 mx-auto" style={{ backgroundColor: item.color + "20" }}>{item.icon}</div>}
            <div className="text-[8px] font-semibold text-center" style={{ color: textColor }}>{item.title}</div>
            {showTime && <div className="text-[7px] text-center mt-1" style={{ color: textColor + "60" }}>{item.time}</div>}
            {showBadges && item.badge && <div className="text-center mt-1"><span className="text-[6px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">{item.badge}</span></div>}
          </div>
        ))}
      </div>
    );
  }

  // Grid layout - 2 column grid
  if (layoutStyle === "grid") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {items.slice(0, maxItems).map((item, i) => (
          <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: bgVariant, border: i === 0 && highlightNext ? `1px solid ${item.color}` : "none" }}>
            <div className="flex items-center gap-1.5 mb-1">
              {showIcon && <div className="w-5 h-5 rounded flex items-center justify-center text-xs" style={{ backgroundColor: item.color + "20" }}>{item.icon}</div>}
              <div className="text-[8px] font-semibold truncate" style={{ color: textColor }}>{item.title}</div>
            </div>
            {showTime && <div className="text-[7px]" style={{ color: textColor + "60" }}>{item.time}</div>}
            {showBadges && item.badge && <span className="text-[6px] px-1 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium mt-1 inline-block">{item.badge}</span>}
          </div>
        ))}
      </div>
    );
  }

  // Timeline layout - vertical timeline with line
  if (layoutStyle === "timeline") {
    return (
      <div className="relative pl-4">
        <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-gray-200" />
        {items.slice(0, maxItems).map((item, i) => (
          <div key={i} className="relative flex items-start gap-2 pb-3 last:pb-0">
            <div className="absolute left-[-12px] w-2.5 h-2.5 rounded-full border-2 bg-white" style={{ borderColor: item.color }} />
            <div className="flex-1 p-2 rounded-lg ml-1" style={{ backgroundColor: bgVariant }}>
              <div className="flex items-center gap-1.5">
                {showIcon && <span className="text-xs">{item.icon}</span>}
                <div className="text-[9px] font-semibold" style={{ color: textColor }}>{item.title}</div>
              </div>
              {showTime && <div className="text-[7px] mt-0.5" style={{ color: textColor + "60" }}>{item.time}</div>}
              {showBadges && item.badge && <span className="text-[6px] px-1 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium mt-1 inline-block">{item.badge}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default list layout
  return (
    <div className="space-y-1.5">
      {items.slice(0, maxItems).map((item, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg relative" style={{ backgroundColor: bgVariant, border: i === 0 && highlightNext ? `1px solid ${item.color}` : "none" }}>
          {showTimeIndicator && <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg" style={{ backgroundColor: item.color }} />}
          {showIcon && <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: item.color + "20" }}>{item.icon}</div>}
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-semibold" style={{ color: textColor }}>{item.title}</div>
            {showTime && <div className="text-[8px] flex items-center gap-1" style={{ color: textColor + "60" }}><Clock size={8} /> {item.time}</div>}
          </div>
          {showBadges && item.badge && <span className="text-[7px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">{item.badge}</span>}
        </div>
      ))}
    </div>
  );
}

// Quick Actions Widget - matches QuickActionsWidget.tsx
function QuickActionsContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  
  const columns = parseInt((props.columns as string) || "2");
  const showLabels = props.showLabels !== false;
  const showStudy = props.showStudy !== false;
  const showAskDoubt = props.showAskDoubt !== false;
  const showTest = props.showTest !== false;
  const showLiveClass = props.showLiveClass !== false;

  const actions = [
    { id: "study", Icon: BookOpen, label: "Study", color: "#6366F1", show: showStudy },
    { id: "ask", Icon: HelpCircle, label: "Ask Doubt", color: "#10B981", show: showAskDoubt },
    { id: "test", Icon: ClipboardCheck, label: "Take Test", color: "#F59E0B", show: showTest },
    { id: "live", Icon: Video, label: "Live Class", color: "#EC4899", show: showLiveClass },
  ].filter(a => a.show);

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(columns, actions.length)}, 1fr)` }}>
      {actions.map((action) => (
        <div key={action.id} className="flex flex-col items-center py-3 rounded-xl" style={{ backgroundColor: action.color + "10" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: action.color + "20" }}>
            <action.Icon size={16} style={{ color: action.color }} />
          </div>
          {showLabels && <span className="text-[8px] font-semibold mt-1.5 text-center" style={{ color: textColor }}>{action.label}</span>}
        </div>
      ))}
    </div>
  );
}

// Progress Widget - matches ProgressSnapshotWidget.tsx
function ProgressContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const accentColor = (props.accentColor as string) || theme.primary_color || "#6366F1";
  
  const showOverallCircle = props.showOverallCircle !== false;
  const showSubjects = props.showSubjects !== false;
  const maxSubjects = Math.min((props.maxSubjects as number) || 4, 3);

  const subjects = [
    { name: "Mathematics", progress: 75, color: "#6366F1" },
    { name: "Physics", progress: 60, color: "#10B981" },
    { name: "Chemistry", progress: 45, color: "#F59E0B" },
  ];

  return (
    <div className="space-y-3">
      {showOverallCircle && (
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-4 flex flex-col items-center justify-center" style={{ borderColor: accentColor }}>
            <span className="text-sm font-bold" style={{ color: accentColor }}>68%</span>
            <span className="text-[6px]" style={{ color: textColor + "60" }}>Overall</span>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1 text-[8px]" style={{ color: textColor }}><span className="text-green-500">📗</span> 12 Chapters</div>
            <div className="flex items-center gap-1 text-[8px]" style={{ color: textColor }}><span className="text-blue-500">⏱️</span> 24 Hours</div>
            <div className="flex items-center gap-1 text-[8px]" style={{ color: textColor }}><span className="text-yellow-500">🏆</span> 8 Tests</div>
          </div>
        </div>
      )}
      {showSubjects && (
        <div className="space-y-2">
          <div className="text-[9px] font-semibold" style={{ color: textColor }}>Subject Progress</div>
          {subjects.slice(0, maxSubjects).map((subject, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[8px]" style={{ color: textColor }}><span>{subject.name}</span><span style={{ color: subject.color }}>{subject.progress}%</span></div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: bgVariant }}><div className="h-full rounded-full" style={{ width: `${subject.progress}%`, backgroundColor: subject.color }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Subject Progress Widget - matches SubjectProgressWidget.tsx
function SubjectProgressContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const accentColor = theme.primary_color || "#6366F1";
  
  const layoutStyle = (props.layoutStyle as string) || "list";
  const maxSubjects = Math.min((props.maxSubjects as number) || 5, 4);
  const showProgressBar = props.showProgressBar !== false;
  const showPercentage = props.showPercentage !== false;
  const showStats = props.showStats !== false;

  const subjects = [
    { name: "Mathematics", progress: 75, chapters: "9/12", color: "#6366F1", icon: "📐" },
    { name: "Physics", progress: 60, chapters: "6/10", color: "#10B981", icon: "⚛️" },
    { name: "Chemistry", progress: 45, chapters: "4/9", color: "#F59E0B", icon: "🧪" },
    { name: "English", progress: 85, chapters: "8/10", color: "#8B5CF6", icon: "📖" },
  ];

  if (layoutStyle === "cards") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {subjects.slice(0, maxSubjects).map((subject, i) => (
          <div key={i} className="flex-shrink-0 w-20 p-2 rounded-xl text-center" style={{ backgroundColor: bgVariant }}>
            <div className="w-10 h-10 mx-auto rounded-full border-2 flex items-center justify-center mb-1" style={{ borderColor: subject.color }}>
              <span className="text-xs font-bold" style={{ color: subject.color }}>{subject.progress}%</span>
            </div>
            <div className="text-[8px] font-medium truncate" style={{ color: textColor }}>{subject.name}</div>
            {showStats && <div className="text-[7px]" style={{ color: textColor + "60" }}>{subject.chapters}</div>}
          </div>
        ))}
      </div>
    );
  }

  if (layoutStyle === "grid") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {subjects.slice(0, maxSubjects).map((subject, i) => (
          <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: bgVariant }}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px]">{subject.icon}</span>
              {showPercentage && <span className="text-[9px] font-bold" style={{ color: subject.color }}>{subject.progress}%</span>}
            </div>
            <div className="text-[8px] font-medium truncate" style={{ color: textColor }}>{subject.name}</div>
            {showProgressBar && (
              <div className="h-1 rounded-full mt-1" style={{ backgroundColor: textColor + "20" }}>
                <div className="h-full rounded-full" style={{ width: `${subject.progress}%`, backgroundColor: subject.color }} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Default list layout
  return (
    <div className="space-y-2">
      {subjects.slice(0, maxSubjects).map((subject, i) => (
        <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: bgVariant }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: subject.color + "20" }}>
              <span className="text-[10px]">{subject.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-medium" style={{ color: textColor }}>{subject.name}</span>
                {showPercentage && <span className="text-[9px] font-bold" style={{ color: subject.color }}>{subject.progress}%</span>}
              </div>
              {showStats && <div className="text-[7px]" style={{ color: textColor + "60" }}>{subject.chapters} chapters</div>}
            </div>
          </div>
          {showProgressBar && (
            <div className="h-1 rounded-full mt-1.5" style={{ backgroundColor: textColor + "20" }}>
              <div className="h-full rounded-full" style={{ width: `${subject.progress}%`, backgroundColor: subject.color }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Doubts Widget - matches DoubtsInboxWidget.tsx
function DoubtsContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const accentColor = (props.accentColor as string) || theme.primary_color || "#6366F1";
  
  const maxItems = Math.min((props.maxItems as number) || 3, 2);
  const layoutStyle = (props.layoutStyle as string) || "list";
  const showSubject = props.showSubject !== false;
  const showPreview = props.showPreview !== false;
  const showStatus = props.showStatus !== false;
  const highlightUnread = props.highlightUnread !== false;
  const showAskNew = props.showAskNew !== false;

  const doubts = [
    { subject: "Mathematics", question: "How to solve quadratic equations?", status: "pending", unread: true, color: "#6366F1" },
    { subject: "Physics", question: "Explain Newton's third law", status: "answered", unread: false, color: "#10B981" },
  ];

  // Cards layout
  if (layoutStyle === "cards") {
    return (
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {doubts.slice(0, maxItems).map((doubt, i) => (
            <div key={i} className="flex-shrink-0 w-32 p-2 rounded-xl shadow-sm" style={{ backgroundColor: bgVariant, border: doubt.unread && highlightUnread ? `2px solid ${accentColor}` : "1px solid #e5e7eb" }}>
              {showSubject && <span className="text-[7px] px-1.5 py-0.5 rounded font-medium inline-block" style={{ backgroundColor: doubt.color + "20", color: doubt.color }}>{doubt.subject}</span>}
              {showPreview && <div className="text-[8px] mt-1.5 line-clamp-2" style={{ color: textColor }}>{doubt.question}</div>}
              {showStatus && <div className="mt-2"><span className="text-[6px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: doubt.status === "answered" ? "#ECFDF5" : "#FEF3C7", color: doubt.status === "answered" ? "#059669" : "#D97706" }}>{doubt.status}</span></div>}
            </div>
          ))}
        </div>
        {showAskNew && <div className="flex items-center justify-center gap-1 py-2 rounded-lg text-[8px] font-semibold text-white" style={{ backgroundColor: accentColor }}>+ Ask New</div>}
      </div>
    );
  }

  // Grid layout
  if (layoutStyle === "grid") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {doubts.slice(0, maxItems).map((doubt, i) => (
            <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: bgVariant, border: doubt.unread && highlightUnread ? `2px solid ${accentColor}` : "none" }}>
              {showSubject && <span className="text-[6px] px-1 py-0.5 rounded font-medium" style={{ backgroundColor: doubt.color + "20", color: doubt.color }}>{doubt.subject}</span>}
              {showPreview && <div className="text-[7px] mt-1 line-clamp-2" style={{ color: textColor }}>{doubt.question}</div>}
              {showStatus && <div className="mt-1"><span className="text-[5px] px-1 py-0.5 rounded font-medium" style={{ backgroundColor: doubt.status === "answered" ? "#ECFDF5" : "#FEF3C7", color: doubt.status === "answered" ? "#059669" : "#D97706" }}>{doubt.status}</span></div>}
            </div>
          ))}
        </div>
        {showAskNew && <div className="flex items-center justify-center gap-1 py-2 rounded-lg text-[8px] font-semibold text-white" style={{ backgroundColor: accentColor }}>+ Ask New</div>}
      </div>
    );
  }

  // Default list layout
  return (
    <div className="space-y-2">
      {doubts.slice(0, maxItems).map((doubt, i) => (
        <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: bgVariant, borderLeft: highlightUnread && doubt.unread ? `3px solid ${accentColor}` : "none" }}>
          {showSubject && <span className="text-[7px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: doubt.color + "20", color: doubt.color }}>{doubt.subject}</span>}
          {showPreview && <div className="text-[8px] mt-1 line-clamp-1" style={{ color: textColor }}>{doubt.question}</div>}
          <div className="flex justify-between items-center mt-1">
            <span className="text-[7px]" style={{ color: textColor + "60" }}>2h ago</span>
            {showStatus && <span className="text-[6px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: doubt.status === "answered" ? "#ECFDF5" : "#FEF3C7", color: doubt.status === "answered" ? "#059669" : "#D97706" }}>{doubt.status}</span>}
          </div>
        </div>
      ))}
      {showAskNew && <div className="flex items-center justify-center gap-1 py-2 rounded-lg text-[8px] font-semibold text-white" style={{ backgroundColor: accentColor }}>+ Ask New</div>}
    </div>
  );
}

// Assignments Widget - matches AssignmentsTestsWidget.tsx
function AssignmentsContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  
  const maxItems = Math.min((props.maxItems as number) || 3, 2);
  const layoutStyle = (props.layoutStyle as string) || "list";
  const showSubject = props.showSubject !== false;
  const showDueDate = props.showDueDate !== false;
  const showPoints = props.showPoints !== false;
  const showUrgencyBadge = props.showUrgencyBadge !== false;
  const highlightOverdue = props.highlightOverdue !== false;

  const assignments = [
    { title: "Math Problem Set 5", subject: "Mathematics", due: "Today", points: 100, status: "due-today", color: "#6366F1" },
    { title: "Physics Lab Report", subject: "Physics", due: "Tomorrow", points: 50, status: "upcoming", color: "#10B981" },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    "due-today": { bg: "#FEF3C7", text: "#D97706" },
    "overdue": { bg: "#FEE2E2", text: "#DC2626" },
    "upcoming": { bg: "#E0E7FF", text: "#4F46E5" },
  };

  // Cards layout
  if (layoutStyle === "cards") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {assignments.slice(0, maxItems).map((item, i) => {
          const colors = statusColors[item.status] || statusColors.upcoming;
          return (
            <div key={i} className="flex-shrink-0 w-28 p-2 rounded-xl shadow-sm" style={{ backgroundColor: bgVariant, border: highlightOverdue && item.status === "due-today" ? `2px solid ${colors.text}` : "1px solid #e5e7eb" }}>
              {showUrgencyBadge && item.status !== "upcoming" && <span className="text-[6px] px-1.5 py-0.5 rounded font-medium mb-1 inline-block" style={{ backgroundColor: colors.bg, color: colors.text }}>Due Today</span>}
              <div className="text-[8px] font-semibold" style={{ color: textColor }}>{item.title}</div>
              {showSubject && <span className="text-[6px] px-1 py-0.5 rounded font-medium mt-1 inline-block" style={{ backgroundColor: item.color + "20", color: item.color }}>{item.subject}</span>}
              <div className="flex justify-between items-center mt-2">
                {showDueDate && <span className="text-[6px]" style={{ color: textColor + "60" }}>📅 {item.due}</span>}
                {showPoints && <span className="text-[6px]" style={{ color: textColor + "60" }}>⭐ {item.points}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid layout
  if (layoutStyle === "grid") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {assignments.slice(0, maxItems).map((item, i) => {
          const colors = statusColors[item.status] || statusColors.upcoming;
          return (
            <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: bgVariant, border: highlightOverdue && item.status === "due-today" ? `2px solid ${colors.text}` : "none" }}>
              <div className="text-[8px] font-semibold" style={{ color: textColor }}>{item.title}</div>
              {showSubject && <span className="text-[6px] px-1 py-0.5 rounded font-medium mt-0.5 inline-block" style={{ backgroundColor: item.color + "20", color: item.color }}>{item.subject}</span>}
              {showDueDate && <div className="text-[6px] mt-1" style={{ color: textColor + "60" }}>📅 {item.due}</div>}
            </div>
          );
        })}
      </div>
    );
  }

  // Timeline layout
  if (layoutStyle === "timeline") {
    return (
      <div className="relative pl-4">
        <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-gray-200" />
        {assignments.slice(0, maxItems).map((item, i) => {
          const colors = statusColors[item.status] || statusColors.upcoming;
          return (
            <div key={i} className="relative flex items-start gap-2 pb-3 last:pb-0">
              <div className="absolute left-[-12px] w-2.5 h-2.5 rounded-full border-2 bg-white" style={{ borderColor: item.color }} />
              <div className="flex-1 p-2 rounded-lg ml-1" style={{ backgroundColor: bgVariant }}>
                <div className="text-[8px] font-semibold" style={{ color: textColor }}>{item.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  {showSubject && <span className="text-[6px] px-1 py-0.5 rounded font-medium" style={{ backgroundColor: item.color + "20", color: item.color }}>{item.subject}</span>}
                  {showUrgencyBadge && item.status !== "upcoming" && <span className="text-[5px] px-1 py-0.5 rounded font-medium" style={{ backgroundColor: colors.bg, color: colors.text }}>Due</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default list layout
  return (
    <div className="space-y-2">
      {assignments.slice(0, maxItems).map((item, i) => {
        const colors = statusColors[item.status] || statusColors.upcoming;
        return (
          <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: bgVariant, borderLeft: highlightOverdue && item.status === "due-today" ? `3px solid ${colors.text}` : "none" }}>
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold" style={{ color: textColor }}>{item.title}</div>
                {showSubject && <span className="text-[7px] px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block" style={{ backgroundColor: item.color + "20", color: item.color }}>{item.subject}</span>}
              </div>
              {showUrgencyBadge && item.status !== "upcoming" && <span className="text-[6px] px-1.5 py-0.5 rounded font-medium ml-1" style={{ backgroundColor: colors.bg, color: colors.text }}>Due Today</span>}
            </div>
            <div className="flex justify-between items-center mt-1.5">
              {showDueDate && <span className="text-[7px] flex items-center gap-1" style={{ color: textColor + "60" }}>📅 {item.due}</span>}
              {showPoints && <span className="text-[7px] flex items-center gap-1" style={{ color: textColor + "60" }}>⭐ {item.points} pts</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Profile Card Widget - matches ProfileCardWidget.tsx
function ProfileCardContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const accentColor = theme.primary_color || "#6366F1";
  
  const layoutStyle = (props.layoutStyle as string) || "horizontal";
  const avatarSize = (props.avatarSize as string) || "medium";
  const showAvatar = props.showAvatar !== false;
  const showClass = props.showClass !== false;
  const showSchool = props.showSchool !== false;
  const showStats = props.showStats !== false;
  const showEditButton = props.showEditButton !== false;

  const avatarSizes = { small: "w-10 h-10", medium: "w-14 h-14", large: "w-16 h-16" };
  const avatarClass = avatarSizes[avatarSize as keyof typeof avatarSizes] || avatarSizes.medium;

  // Vertical layout
  if (layoutStyle === "vertical") {
    return (
      <div className="space-y-3 text-center">
        {showAvatar && (
          <div className="flex justify-center">
            <div className={`${avatarClass} rounded-full flex items-center justify-center`} style={{ backgroundColor: accentColor + "20" }}>
              <span className="text-2xl">👤</span>
            </div>
          </div>
        )}
        <div>
          <div className="text-sm font-bold" style={{ color: textColor }}>Rahul Sharma</div>
          {showClass && <div className="text-[9px]" style={{ color: textColor + "70" }}>Class 10 - A</div>}
          {showSchool && <div className="text-[8px]" style={{ color: textColor + "50" }}>Delhi Public School</div>}
        </div>
        {showStats && (
          <div className="flex justify-around py-2 rounded-lg" style={{ backgroundColor: bgVariant }}>
            <div className="text-center"><div className="text-[10px] font-bold" style={{ color: textColor }}>2.4k</div><div className="text-[7px]" style={{ color: textColor + "60" }}>XP</div></div>
            <div className="text-center"><div className="text-[10px] font-bold" style={{ color: textColor }}>7</div><div className="text-[7px]" style={{ color: textColor + "60" }}>Streak</div></div>
            <div className="text-center"><div className="text-[10px] font-bold" style={{ color: textColor }}>12</div><div className="text-[7px]" style={{ color: textColor + "60" }}>Badges</div></div>
          </div>
        )}
        {showEditButton && (
          <div className="py-2 rounded-lg text-[9px] font-medium" style={{ backgroundColor: accentColor + "20", color: accentColor }}>✏️ Edit Profile</div>
        )}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {showAvatar && (
          <div className={`${avatarClass} rounded-full flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: accentColor + "20" }}>
            <span className="text-xl">👤</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold" style={{ color: textColor }}>Rahul Sharma</div>
          {showClass && <div className="text-[9px]" style={{ color: textColor + "70" }}>Class 10 - A</div>}
          {showSchool && <div className="text-[8px]" style={{ color: textColor + "50" }}>Delhi Public School</div>}
        </div>
        {showEditButton && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: bgVariant }}>
            <span className="text-xs">✏️</span>
          </div>
        )}
      </div>
      {showStats && (
        <div className="flex justify-around py-2 rounded-lg" style={{ backgroundColor: bgVariant }}>
          <div className="text-center"><div className="text-[10px] font-bold" style={{ color: textColor }}>2.4k</div><div className="text-[7px]" style={{ color: textColor + "60" }}>XP</div></div>
          <div className="text-center"><div className="text-[10px] font-bold" style={{ color: textColor }}>7</div><div className="text-[7px]" style={{ color: textColor + "60" }}>Streak</div></div>
          <div className="text-center"><div className="text-[10px] font-bold" style={{ color: textColor }}>12</div><div className="text-[7px]" style={{ color: textColor + "60" }}>Badges</div></div>
        </div>
      )}
    </div>
  );
}

// Profile Stats Widget - matches ProfileStatsWidget.tsx
function ProfileStatsContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const accentColor = theme.primary_color || "#6366F1";
  const successColor = theme.success_color || "#10B981";
  const warningColor = theme.warning_color || "#F59E0B";
  
  const layoutStyle = (props.layoutStyle as string) || "grid";
  const compactMode = props.compactMode === true;
  const showXP = props.showXP !== false;
  const showStreak = props.showStreak !== false;
  const showBadges = props.showBadges !== false;
  const showStudyTime = props.showStudyTime !== false;
  const showAssessments = props.showAssessments !== false;
  const showProgress = props.showProgress !== false;
  const showTrends = props.showTrends !== false;

  const stats = [
    { icon: "⚡", value: "2,450", label: "Total XP", color: warningColor, trend: "+320", show: showXP },
    { icon: "🔥", value: "7", label: "Streak", color: "#EF4444", trend: "days", show: showStreak },
    { icon: "🏅", value: "12", label: "Badges", color: accentColor, show: showBadges },
    { icon: "⏱️", value: "30h", label: "Study Time", color: accentColor, trend: "+7h", show: showStudyTime },
    { icon: "✅", value: "83%", label: "Pass Rate", color: successColor, show: showAssessments },
    { icon: "📖", value: "45", label: "Lessons", color: "#3B82F6", show: showProgress },
  ].filter(s => s.show);

  // Cards layout - horizontal scroll
  if (layoutStyle === "cards") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {stats.map((stat, i) => (
          <div key={i} className="flex-shrink-0 w-20 p-2 rounded-xl text-center" style={{ backgroundColor: bgVariant }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: stat.color + "15" }}>
              <span className="text-sm">{stat.icon}</span>
            </div>
            <div className={`font-bold ${compactMode ? "text-[10px]" : "text-sm"}`} style={{ color: textColor }}>{stat.value}</div>
            <div className="text-[7px]" style={{ color: textColor + "60" }}>{stat.label}</div>
            {showTrends && stat.trend && (
              <div className="text-[6px] mt-0.5" style={{ color: successColor }}>↑ {stat.trend}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // List layout
  if (layoutStyle === "list") {
    return (
      <div className="space-y-1.5">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: bgVariant }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: stat.color + "15" }}>
              <span className="text-sm">{stat.icon}</span>
            </div>
            <div className="flex-1">
              <div className={`font-bold ${compactMode ? "text-[10px]" : "text-sm"}`} style={{ color: textColor }}>{stat.value}</div>
              <div className="text-[7px]" style={{ color: textColor + "60" }}>{stat.label}</div>
            </div>
            {showTrends && stat.trend && (
              <div className="text-[7px] flex items-center gap-0.5" style={{ color: successColor }}>
                <span>↑</span> {stat.trend}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat, i) => (
        <div key={i} className="p-2 rounded-lg text-center" style={{ backgroundColor: bgVariant }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: stat.color + "15" }}>
            <span className="text-xs">{stat.icon}</span>
          </div>
          <div className={`font-bold ${compactMode ? "text-[9px]" : "text-[11px]"}`} style={{ color: textColor }}>{stat.value}</div>
          <div className="text-[7px]" style={{ color: textColor + "60" }}>{stat.label}</div>
          {showTrends && stat.trend && (
            <div className="text-[6px] mt-0.5" style={{ color: successColor }}>↑ {stat.trend}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// Profile Achievements Widget - matches ProfileAchievementsWidget.tsx
function ProfileAchievementsContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const accentColor = theme.primary_color || "#6366F1";
  const warningColor = theme.warning_color || "#F59E0B";
  
  const layoutStyle = (props.layoutStyle as string) || "grid";
  const maxItems = Math.min((props.maxItems as number) || 6, 6);
  const showSummary = props.showSummary !== false;
  const showProgress = props.showProgress !== false;
  const showPoints = props.showPoints !== false;
  const showRarity = props.showRarity !== false;
  const showLocked = props.showLocked !== false;

  const achievements = [
    { icon: "🎓", title: "First Steps", points: 50, rarity: "common", color: "#10B981", unlocked: true },
    { icon: "🔥", title: "Week Warrior", points: 100, rarity: "uncommon", color: "#EF4444", unlocked: true },
    { icon: "⭐", title: "Perfect Score", points: 150, rarity: "rare", color: "#F59E0B", unlocked: false, progress: 0 },
    { icon: "💡", title: "Doubt Solver", points: 100, rarity: "uncommon", color: "#8B5CF6", unlocked: false, progress: 70 },
    { icon: "🏅", title: "Monthly Master", points: 500, rarity: "epic", color: "#EC4899", unlocked: false, progress: 23 },
    { icon: "📚", title: "Knowledge Seeker", points: 300, rarity: "rare", color: "#3B82F6", unlocked: false, progress: 45 },
  ];

  const rarityColors: Record<string, string> = {
    common: "#9CA3AF",
    uncommon: "#10B981",
    rare: "#3B82F6",
    epic: "#8B5CF6",
    legendary: "#F59E0B",
  };

  const displayAchievements = showLocked 
    ? achievements.slice(0, maxItems) 
    : achievements.filter(a => a.unlocked).slice(0, maxItems);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-2">
      {/* Summary */}
      {showSummary && (
        <div className="flex justify-around py-2 rounded-lg" style={{ backgroundColor: bgVariant }}>
          <div className="text-center">
            <Trophy size={12} style={{ color: warningColor }} className="mx-auto" />
            <div className="text-[10px] font-bold mt-0.5" style={{ color: textColor }}>{unlockedCount}/{achievements.length}</div>
            <div className="text-[6px]" style={{ color: textColor + "60" }}>Unlocked</div>
          </div>
          <div className="w-px" style={{ backgroundColor: textColor + "20" }} />
          <div className="text-center">
            <Star size={12} style={{ color: accentColor }} className="mx-auto" />
            <div className="text-[10px] font-bold mt-0.5" style={{ color: textColor }}>{totalPoints}</div>
            <div className="text-[6px]" style={{ color: textColor + "60" }}>Points</div>
          </div>
        </div>
      )}

      {/* Cards layout */}
      {layoutStyle === "cards" && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayAchievements.map((achievement, i) => (
            <div key={i} className="flex-shrink-0 w-20 p-2 rounded-xl text-center relative" style={{ backgroundColor: bgVariant, opacity: achievement.unlocked ? 1 : 0.5 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto border-2" style={{ backgroundColor: achievement.unlocked ? achievement.color + "20" : bgVariant, borderColor: achievement.unlocked ? achievement.color : textColor + "30" }}>
                <span className="text-base">{achievement.unlocked ? achievement.icon : "🔒"}</span>
              </div>
              <div className="text-[7px] font-semibold mt-1" style={{ color: textColor }}>{achievement.title}</div>
              {showPoints && <div className="text-[6px] mt-0.5" style={{ color: textColor + "60" }}>⭐ {achievement.points}</div>}
              {showRarity && <div className="text-[5px] px-1 py-0.5 rounded mt-1 inline-block" style={{ backgroundColor: rarityColors[achievement.rarity] + "20", color: rarityColors[achievement.rarity] }}>{achievement.rarity}</div>}
              {achievement.unlocked && <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center"><span className="text-[6px] text-white">✓</span></div>}
            </div>
          ))}
        </div>
      )}

      {/* List layout */}
      {layoutStyle === "list" && (
        <div className="space-y-1.5">
          {displayAchievements.map((achievement, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg relative" style={{ backgroundColor: bgVariant, opacity: achievement.unlocked ? 1 : 0.5 }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: achievement.unlocked ? achievement.color + "20" : bgVariant, borderColor: achievement.unlocked ? achievement.color : textColor + "30" }}>
                <span className="text-sm">{achievement.unlocked ? achievement.icon : "🔒"}</span>
              </div>
              <div className="flex-1">
                <div className="text-[8px] font-semibold" style={{ color: textColor }}>{achievement.title}</div>
                {showProgress && !achievement.unlocked && achievement.progress !== undefined && achievement.progress > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: textColor + "20" }}>
                      <div className="h-full rounded-full" style={{ width: `${achievement.progress}%`, backgroundColor: achievement.color }} />
                    </div>
                    <span className="text-[6px]" style={{ color: textColor + "60" }}>{achievement.progress}%</span>
                  </div>
                )}
              </div>
              {showPoints && <div className="text-[7px]" style={{ color: textColor + "60" }}>⭐ {achievement.points}</div>}
              {achievement.unlocked && <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center"><span className="text-[6px] text-white">✓</span></div>}
            </div>
          ))}
        </div>
      )}

      {/* Grid layout (default) */}
      {layoutStyle === "grid" && (
        <div className="grid grid-cols-3 gap-1.5">
          {displayAchievements.map((achievement, i) => (
            <div key={i} className="p-1.5 rounded-lg text-center relative" style={{ backgroundColor: bgVariant, opacity: achievement.unlocked ? 1 : 0.5 }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto border-2" style={{ backgroundColor: achievement.unlocked ? achievement.color + "20" : bgVariant, borderColor: achievement.unlocked ? achievement.color : textColor + "30" }}>
                <span className="text-sm">{achievement.unlocked ? achievement.icon : "🔒"}</span>
              </div>
              <div className="text-[6px] font-semibold mt-1 truncate" style={{ color: textColor }}>{achievement.title}</div>
              {showPoints && <div className="text-[5px]" style={{ color: textColor + "60" }}>⭐ {achievement.points}</div>}
              {achievement.unlocked && <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 flex items-center justify-center"><span className="text-[5px] text-white">✓</span></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// Profile Activity Widget - matches ProfileActivityWidget.tsx
function ProfileActivityContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const primaryColor = theme.primary_color || "#6366F1";
  const warningColor = theme.warning_color || "#F59E0B";
  
  const layoutStyle = (props.layoutStyle as string) || "timeline";
  const showTodayStats = props.showTodayStats !== false;
  const showPoints = props.showPoints !== false;
  const showTime = props.showTime !== false;
  const compactMode = props.compactMode === true;

  const activities = [
    { icon: "📚", title: "Completed Algebra Basics", time: "30m ago", points: 50, color: "#10B981" },
    { icon: "📝", title: "Physics Quiz - 85%", time: "2h ago", points: 100, color: "#3B82F6" },
    { icon: "🏆", title: "Earned Week Warrior Badge", time: "5h ago", points: 100, color: "#F59E0B" },
    { icon: "💡", title: "Doubt Answered", time: "1d ago", points: 10, color: "#8B5CF6" },
  ];

  return (
    <div className="space-y-2">
      {/* Today's Stats Banner */}
      {showTodayStats && (
        <div className="p-2 rounded-lg" style={{ backgroundColor: primaryColor + "15" }}>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[8px]">📅</span>
            <span className="text-[8px] font-semibold" style={{ color: primaryColor }}>Today's Progress</span>
          </div>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-[10px] font-bold" style={{ color: textColor }}>4</div>
              <div className="text-[6px]" style={{ color: textColor + "60" }}>Activities</div>
            </div>
            <div className="w-px" style={{ backgroundColor: primaryColor + "30" }} />
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5">
                <Star size={8} style={{ color: warningColor }} />
                <span className="text-[10px] font-bold" style={{ color: textColor }}>260</span>
              </div>
              <div className="text-[6px]" style={{ color: textColor + "60" }}>XP</div>
            </div>
          </div>
        </div>
      )}

      {/* Cards layout */}
      {layoutStyle === "cards" && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {activities.slice(0, 3).map((activity, i) => (
            <div key={i} className="flex-shrink-0 w-20 p-2 rounded-lg text-center" style={{ backgroundColor: bgVariant }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: activity.color + "20" }}>
                <span className="text-sm">{activity.icon}</span>
              </div>
              <div className="text-[7px] font-medium" style={{ color: textColor }}>{activity.title}</div>
              {showTime && <div className="text-[6px] mt-0.5" style={{ color: textColor + "60" }}>{activity.time}</div>}
              {showPoints && (
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  <Star size={6} style={{ color: warningColor }} />
                  <span className="text-[6px] font-semibold" style={{ color: warningColor }}>+{activity.points}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Timeline layout */}
      {layoutStyle === "timeline" && (
        <div className="space-y-1">
          {activities.slice(0, 3).map((activity, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: activity.color }}>
                  <span className="text-[8px] text-white">{activity.icon}</span>
                </div>
                {i < 2 && <div className="w-0.5 flex-1 mt-0.5" style={{ backgroundColor: textColor + "20" }} />}
              </div>
              <div className={`flex-1 p-1.5 rounded-lg mb-1 border-l-2 ${compactMode ? "py-1" : ""}`} style={{ backgroundColor: bgVariant, borderLeftColor: activity.color }}>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-medium" style={{ color: textColor }}>{activity.title}</span>
                  {showPoints && (
                    <div className="flex items-center gap-0.5 px-1 py-0.5 rounded" style={{ backgroundColor: warningColor + "20" }}>
                      <Star size={6} style={{ color: warningColor }} />
                      <span className="text-[6px] font-semibold" style={{ color: warningColor }}>+{activity.points}</span>
                    </div>
                  )}
                </div>
                {showTime && <div className="text-[6px] mt-0.5" style={{ color: textColor + "60" }}>{activity.time}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List layout */}
      {layoutStyle === "list" && (
        <div className="space-y-1">
          {activities.slice(0, 3).map((activity, i) => (
            <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg border-l-2 ${compactMode ? "py-1" : ""}`} style={{ backgroundColor: bgVariant, borderLeftColor: activity.color }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: activity.color + "20" }}>
                <span className="text-xs">{activity.icon}</span>
              </div>
              <div className="flex-1">
                <div className="text-[8px] font-medium" style={{ color: textColor }}>{activity.title}</div>
                {showTime && <div className="text-[6px]" style={{ color: textColor + "60" }}>{activity.time}</div>}
              </div>
              {showPoints && (
                <div className="flex items-center gap-0.5">
                  <Star size={8} style={{ color: warningColor }} />
                  <span className="text-[7px] font-semibold" style={{ color: warningColor }}>+{activity.points}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Study Streak Widget - matches StudyStreakWidget.tsx
function StudyStreakContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const accentColor = (props.accentColor as string) || theme.primary_color || "#6366F1";
  const warningColor = "#F59E0B";
  const successColor = "#10B981";
  
  const showCurrentStreak = props.showCurrentStreak !== false;
  const showLongestStreak = props.showLongestStreak !== false;
  const showWeeklyGoal = props.showWeeklyGoal !== false;
  const showTotalDays = props.showTotalDays !== false;
  const showTotalHours = props.showTotalHours !== false;
  const showAchievements = props.showAchievements !== false;
  const maxAchievements = Math.min((props.maxAchievements as number) || 2, 3);
  const showMotivation = props.showMotivation !== false;

  const achievements = [
    { title: "Study Starter", icon: "🔥", color: warningColor },
    { title: "Weekly Champion", icon: "🏆", color: successColor },
    { title: "Dedication Master", icon: "🎖️", color: accentColor },
  ];

  return (
    <div className="space-y-2">
      {/* Current Streak Section */}
      {showCurrentStreak && (
        <div className="p-2 rounded-xl" style={{ backgroundColor: bgVariant }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Flame size={18} style={{ color: warningColor }} />
              <span className="text-xl font-bold" style={{ color: textColor }}>7</span>
            </div>
            <div className="flex-1">
              <div className="text-[9px] font-semibold" style={{ color: textColor }}>Current Streak</div>
              <div className="text-[7px]" style={{ color: textColor + "60" }}>days</div>
            </div>
          </div>
          {showWeeklyGoal && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full" style={{ backgroundColor: textColor + "20" }}>
                <div className="h-full rounded-full" style={{ width: "70%", backgroundColor: warningColor }} />
              </div>
              <div className="text-[7px] mt-1" style={{ color: textColor + "60" }}>7/5 this week</div>
            </div>
          )}
        </div>
      )}

      {/* Stats Row */}
      {(showLongestStreak || showTotalDays || showTotalHours) && (
        <div className="flex gap-2">
          {showLongestStreak && (
            <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: bgVariant }}>
              <Trophy size={12} style={{ color: warningColor }} className="mx-auto" />
              <div className="text-sm font-bold mt-0.5" style={{ color: textColor }}>15</div>
              <div className="text-[6px]" style={{ color: textColor + "60" }}>Longest</div>
            </div>
          )}
          {showTotalDays && (
            <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: bgVariant }}>
              <span className="text-xs">📅</span>
              <div className="text-sm font-bold mt-0.5" style={{ color: textColor }}>45</div>
              <div className="text-[6px]" style={{ color: textColor + "60" }}>Total Days</div>
            </div>
          )}
          {showTotalHours && (
            <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: bgVariant }}>
              <Clock size={12} style={{ color: accentColor }} className="mx-auto" />
              <div className="text-sm font-bold mt-0.5" style={{ color: textColor }}>67h</div>
              <div className="text-[6px]" style={{ color: textColor + "60" }}>Total Hours</div>
            </div>
          )}
        </div>
      )}

      {/* Achievements */}
      {showAchievements && (
        <div>
          <div className="text-[8px] font-semibold mb-1" style={{ color: textColor }}>Recent Achievements</div>
          <div className="flex gap-2 overflow-x-auto">
            {achievements.slice(0, maxAchievements).map((achievement, i) => (
              <div key={i} className="flex-shrink-0 w-16 p-2 rounded-lg text-center" style={{ backgroundColor: bgVariant }}>
                <div className="w-6 h-6 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: achievement.color + "20" }}>
                  <span className="text-xs">{achievement.icon}</span>
                </div>
                <div className="text-[6px] font-medium mt-1 truncate" style={{ color: textColor }}>{achievement.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivation Message */}
      {showMotivation && (
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: warningColor + "15" }}>
          <Star size={12} style={{ color: warningColor }} />
          <div className="flex-1">
            <div className="text-[8px] font-semibold" style={{ color: textColor }}>Week Warrior</div>
            <div className="text-[6px]" style={{ color: textColor + "60" }}>Studied for 7 consecutive days!</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stats Grid Widget - matches StatsGridWidget.tsx
function StatsGridContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const primaryColor = theme.primary_color || "#6366F1";
  const warningColor = "#F59E0B";
  const successColor = "#10B981";
  const errorColor = "#EF4444";
  const infoColor = "#3B82F6";
  
  const columns = (props.columns as string) === "3" ? 3 : 2;
  const compactMode = props.compactMode === true;
  const showXP = props.showXP !== false;
  const showStreak = props.showStreak !== false;
  const showBadges = props.showBadges !== false;
  const showStudyTime = props.showStudyTime !== false;
  const showTests = props.showTests !== false;
  const showAssignments = props.showAssignments !== false;
  const showTrends = props.showTrends !== false;

  const stats = [];
  if (showXP) stats.push({ icon: "⭐", value: "2.4k", label: "Total XP", color: warningColor, trend: 12 });
  if (showStreak) stats.push({ icon: "🔥", value: "7", label: "Day Streak", color: errorColor, trend: 5 });
  if (showBadges) stats.push({ icon: "🏅", value: "12", label: "Badges", color: primaryColor });
  if (showStudyTime) stats.push({ icon: "⏰", value: "7h", label: "This Week", color: infoColor, trend: 8 });
  if (showTests) stats.push({ icon: "✅", value: "10/12", label: "Tests Passed", color: successColor });
  if (showAssignments) stats.push({ icon: "📄", value: "18", label: "Completed", color: primaryColor });

  return (
    <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {stats.map((stat, i) => (
        <div key={i} className={`${compactMode ? 'p-2' : 'p-3'} rounded-xl text-center`} style={{ backgroundColor: bgVariant }}>
          <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: stat.color + "20" }}>
            <span className={compactMode ? "text-xs" : "text-sm"}>{stat.icon}</span>
          </div>
          <div className={`font-bold ${compactMode ? 'text-sm' : 'text-lg'}`} style={{ color: textColor }}>{stat.value}</div>
          <div className={`${compactMode ? 'text-[8px]' : 'text-[10px]'} truncate`} style={{ color: textColor + "60" }}>{stat.label}</div>
          {stat.trend && showTrends && !compactMode && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-[8px]" style={{ color: stat.trend >= 0 ? successColor : errorColor }}>↗</span>
              <span className="text-[8px] font-semibold" style={{ color: stat.trend >= 0 ? successColor : errorColor }}>{Math.abs(stat.trend)}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Active Quests Widget - matches ActiveQuestsWidget.tsx
function ActiveQuestsContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const primaryColor = theme.primary_color || "#6366F1";
  const warningColor = "#F59E0B";
  const successColor = "#10B981";
  const errorColor = "#EF4444";
  
  const maxQuests = Math.min((props.maxQuests as number) || 3, 4);
  const showDaily = props.showDaily !== false;
  const showWeekly = props.showWeekly !== false;
  const showProgress = props.showProgress !== false;
  const showXPReward = props.showXPReward !== false;
  const showSummary = props.showSummary !== false;
  const compactMode = props.compactMode === true;

  const quests = [
    { icon: "📚", title: "Complete 3 Lessons", type: "daily", progress: 33, current: 1, target: 3, xp: 50, difficulty: "easy" },
    { icon: "⏱️", title: "Study for 30 Minutes", type: "daily", progress: 60, current: 18, target: 30, xp: 75, difficulty: "medium" },
    { icon: "✅", title: "Pass 5 Tests", type: "weekly", progress: 60, current: 3, target: 5, xp: 200, difficulty: "hard" },
    { icon: "💬", title: "Ask a Doubt", type: "daily", progress: 100, current: 1, target: 1, xp: 25, difficulty: "easy" },
  ];

  const displayQuests = quests
    .filter(q => (showDaily && q.type === "daily") || (showWeekly && q.type === "weekly"))
    .slice(0, maxQuests);

  const getDifficultyColor = (d: string) => d === "easy" ? successColor : d === "medium" ? warningColor : errorColor;

  return (
    <div className="space-y-2">
      {/* Summary Banner */}
      {showSummary && !compactMode && (
        <div className="flex items-center justify-around p-2 rounded-lg" style={{ backgroundColor: primaryColor + "15" }}>
          <div className="text-center">
            <div className="text-[10px] font-bold" style={{ color: textColor }}>2</div>
            <div className="text-[6px]" style={{ color: textColor + "60" }}>Done Today</div>
          </div>
          <div className="w-px h-6" style={{ backgroundColor: primaryColor + "30" }} />
          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5">
              <span className="text-[8px]">⭐</span>
              <span className="text-[10px] font-bold" style={{ color: textColor }}>325</span>
            </div>
            <div className="text-[6px]" style={{ color: textColor + "60" }}>XP Available</div>
          </div>
        </div>
      )}

      {/* Quest List */}
      <div className="space-y-1.5">
        {displayQuests.map((quest, i) => (
          <div key={i} className={`flex items-center gap-2 ${compactMode ? 'p-1.5' : 'p-2'} rounded-lg`} style={{ backgroundColor: bgVariant }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: getDifficultyColor(quest.difficulty) + "20" }}>
              <span className="text-sm">{quest.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className={`${compactMode ? 'text-[8px]' : 'text-[9px]'} font-semibold truncate`} style={{ color: textColor }}>{quest.title}</span>
                <span className="text-[6px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: quest.type === "weekly" ? primaryColor + "20" : successColor + "20", color: quest.type === "weekly" ? primaryColor : successColor }}>
                  {quest.type === "weekly" ? "Weekly" : "Daily"}
                </span>
              </div>
              {showProgress && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: textColor + "20" }}>
                    <div className="h-full rounded-full" style={{ width: `${quest.progress}%`, backgroundColor: getDifficultyColor(quest.difficulty) }} />
                  </div>
                  <span className="text-[6px]" style={{ color: textColor + "60" }}>{quest.current}/{quest.target}</span>
                </div>
              )}
              {showXPReward && !compactMode && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="text-[6px]">⭐</span>
                  <span className="text-[6px] font-semibold" style={{ color: warningColor }}>+{quest.xp} XP</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Peers Leaderboard Widget - matches PeersLeaderboardWidget.tsx
function PeersLeaderboardContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  const primaryColor = theme.primary_color || "#6366F1";
  const warningColor = "#F59E0B";
  const errorColor = "#EF4444";
  
  const scope = (props.scope as string) || "school";
  const maxEntries = Math.min((props.maxEntries as number) || 5, 8);
  const showMyRank = props.showMyRank !== false;
  const showPercentile = props.showPercentile !== false;
  const showScope = props.showScope !== false;
  const showXP = props.showXP !== false;
  const showStreak = props.showStreak !== false;
  const compactMode = props.compactMode === true;

  const leaderboardData = [
    { rank: 1, name: "Priya Patel", xp: 3250, streak: 12, isMe: false, emoji: "🏆" },
    { rank: 2, name: "Karan Mehta", xp: 2890, streak: 8, isMe: false, emoji: "🥈" },
    { rank: 3, name: "You", xp: 2450, streak: 7, isMe: true, emoji: "🥉" },
    { rank: 4, name: "Rahul Kumar", xp: 2180, streak: 15, isMe: false },
    { rank: 5, name: "Sneha Singh", xp: 1950, streak: 3, isMe: false },
    { rank: 6, name: "Vikram Gupta", xp: 1720, streak: 7, isMe: false },
    { rank: 7, name: "Ananya Reddy", xp: 1580, streak: 2, isMe: false },
    { rank: 8, name: "Pooja Agarwal", xp: 1420, streak: 9, isMe: false },
  ].slice(0, maxEntries);

  const myRank = leaderboardData.find(entry => entry.isMe);
  const getScopeLabel = (s: string) => s === "class" ? "Class" : s === "school" ? "School" : "Global";

  return (
    <div className="space-y-2">
      {/* Scope Tabs */}
      {showScope && !compactMode && (
        <div className="flex rounded-lg p-0.5" style={{ backgroundColor: bgVariant }}>
          {["class", "school", "global"].map((scopeOption) => (
            <div
              key={scopeOption}
              className="flex-1 text-center py-1 px-2 rounded-md text-[8px] font-semibold"
              style={{
                backgroundColor: scope === scopeOption ? primaryColor : "transparent",
                color: scope === scopeOption ? "white" : textColor + "80",
              }}
            >
              {getScopeLabel(scopeOption)}
            </div>
          ))}
        </div>
      )}

      {/* My Rank Card */}
      {showMyRank && myRank && !compactMode && (
        <div className="p-2 rounded-lg" style={{ backgroundColor: primaryColor + "15" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8px] font-medium" style={{ color: textColor + "80" }}>My Rank</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-bold" style={{ color: primaryColor }}>#{myRank.rank}</span>
                {showPercentile && (
                  <span className="text-[7px] font-medium" style={{ color: textColor + "80" }}>Top 85%</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {showXP && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[8px]">⭐</span>
                  <span className="text-[9px] font-semibold" style={{ color: textColor }}>{myRank.xp.toLocaleString()}</span>
                </div>
              )}
              {showStreak && myRank.streak > 0 && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[8px]">🔥</span>
                  <span className="text-[9px] font-semibold" style={{ color: textColor }}>{myRank.streak}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-1">
        {leaderboardData.map((entry, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 ${compactMode ? 'p-1.5' : 'p-2'} rounded-lg`}
            style={{ backgroundColor: entry.isMe ? primaryColor + "15" : bgVariant }}
          >
            {/* Rank */}
            <div className="w-6 text-center">
              {entry.emoji ? (
                <span className="text-xs">{entry.emoji}</span>
              ) : (
                <span className="text-[9px] font-semibold" style={{ color: textColor + "60" }}>#{entry.rank}</span>
              )}
            </div>

            {/* Avatar */}
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: textColor + "20" }}>
              <span className="text-[8px]">👤</span>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className={`${compactMode ? 'text-[8px]' : 'text-[9px]'} font-semibold`} style={{ color: textColor }}>
                {entry.name}
                {entry.isMe && <span className="text-[7px] font-bold" style={{ color: primaryColor }}> (You)</span>}
              </div>
              {!compactMode && (
                <div className="flex gap-2 mt-0.5">
                  {showXP && (
                    <div className="flex items-center gap-0.5">
                      <span className="text-[6px]">⭐</span>
                      <span className="text-[6px] font-medium" style={{ color: textColor + "60" }}>{entry.xp.toLocaleString()}</span>
                    </div>
                  )}
                  {showStreak && entry.streak > 0 && (
                    <div className="flex items-center gap-0.5">
                      <span className="text-[6px]">🔥</span>
                      <span className="text-[6px] font-medium" style={{ color: textColor + "60" }}>{entry.streak}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// Continue Learning Widget - matches ContinueLearningWidget.tsx
function ContinueLearningContent({ theme, props }: { theme: Omit<ThemeConfig, "customer_id">; props: Record<string, unknown> }) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  
  const maxItems = Math.min((props.maxItems as number) || 4, 5);
  const showProgress = props.showProgress !== false;
  const showTimeAgo = props.showTimeAgo !== false;
  const showType = props.showType !== false;
  const layoutStyle = (props.layoutStyle as string) || "horizontal";
  const compactMode = props.compactMode === true;

  const items = [
    { icon: "📐", title: "Quadratic Equations", subtitle: "Chapter 4 - Math", color: "#6366F1", progress: 65, timeAgo: "2h ago", type: "Lesson" },
    { icon: "🔬", title: "Newton's Laws", subtitle: "Physics - Unit 2", color: "#EF4444", progress: 40, timeAgo: "5h ago", type: "Video" },
    { icon: "🤖", title: "Chemistry Doubt", subtitle: "Organic Chemistry", color: "#10B981", progress: 100, timeAgo: "8h ago", type: "AI Session" },
    { icon: "📝", title: "Essay Writing", subtitle: "English - Due Tomorrow", color: "#F59E0B", progress: 30, timeAgo: "12h ago", type: "Assignment" },
    { icon: "📄", title: "Mock Test Review", subtitle: "Science - 85%", color: "#8B5CF6", progress: 100, timeAgo: "1d ago", type: "Review" },
  ].slice(0, maxItems);

  if (layoutStyle === "horizontal") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item, i) => (
          <div key={i} className="flex-shrink-0 w-28 p-2 rounded-lg" style={{ backgroundColor: bgVariant }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1.5" style={{ backgroundColor: item.color + "20" }}>
              <span className="text-sm">{item.icon}</span>
            </div>
            <div className="text-[9px] font-semibold truncate" style={{ color: textColor }}>{item.title}</div>
            {!compactMode && <div className="text-[7px] truncate mt-0.5" style={{ color: textColor + "60" }}>{item.subtitle}</div>}
            {showProgress && item.progress < 100 && (
              <div className="flex items-center gap-1 mt-1.5">
                <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: textColor + "20" }}>
                  <div className="h-full rounded-full" style={{ width: `${item.progress}%`, backgroundColor: item.color }} />
                </div>
                <span className="text-[6px]" style={{ color: textColor + "60" }}>{item.progress}%</span>
              </div>
            )}
            {showTimeAgo && <div className="text-[6px] mt-1" style={{ color: textColor + "50" }}>{item.timeAgo}</div>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: bgVariant }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + "20" }}>
            <span className="text-sm">{item.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] font-semibold truncate" style={{ color: textColor }}>{item.title}</span>
              {showType && (
                <span className="text-[6px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: item.color + "20", color: item.color }}>{item.type}</span>
              )}
            </div>
            <div className="text-[7px] truncate" style={{ color: textColor + "60" }}>{item.subtitle}</div>
            <div className="flex items-center justify-between mt-1">
              {showProgress && item.progress < 100 && (
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1 rounded-full" style={{ backgroundColor: textColor + "20" }}>
                    <div className="h-full rounded-full" style={{ width: `${item.progress}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-[6px]" style={{ color: textColor + "60" }}>{item.progress}%</span>
                </div>
              )}
              {showTimeAgo && <span className="text-[6px]" style={{ color: textColor + "50" }}>{item.timeAgo}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
