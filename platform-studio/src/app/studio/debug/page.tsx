"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Info, AlertTriangle, Bug, Download, Trash2 } from "lucide-react";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";
type LogCategory = "PUBLISH" | "VALIDATE" | "CONFIG" | "REALTIME" | "DB" | "MOBILE";

type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
};

// Generate demo logs with current timestamps (called client-side only)
function generateDemoLogs(): LogEntry[] {
  const now = Date.now();
  return [
    { id: "1", timestamp: new Date(now).toISOString(), level: "INFO", category: "PUBLISH", message: "Publish job created: pub_abc123" },
    { id: "2", timestamp: new Date(now - 1000).toISOString(), level: "INFO", category: "VALIDATE", message: "Validation started" },
    { id: "3", timestamp: new Date(now - 2000).toISOString(), level: "INFO", category: "VALIDATE", message: "Validation passed (0 errors, 2 warnings)" },
    { id: "4", timestamp: new Date(now - 2500).toISOString(), level: "WARN", category: "VALIDATE", message: 'Screen "study-hub" has no widgets' },
    { id: "5", timestamp: new Date(now - 3000).toISOString(), level: "INFO", category: "PUBLISH", message: "Publishing config..." },
    { id: "6", timestamp: new Date(now - 4000).toISOString(), level: "DEBUG", category: "DB", message: "INSERT INTO published_configs..." },
    { id: "7", timestamp: new Date(now - 5000).toISOString(), level: "INFO", category: "REALTIME", message: "Event sent to 3 connected devices" },
    { id: "8", timestamp: new Date(now - 6000).toISOString(), level: "INFO", category: "PUBLISH", message: "✅ Publish completed successfully" },
  ];
}

export default function DebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | "ALL">("ALL");
  const [mounted, setMounted] = useState(false);

  // Initialize logs client-side only to avoid hydration mismatch
  useEffect(() => {
    setLogs(generateDemoLogs());
    setMounted(true);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter !== "ALL" && log.level !== filter) return false;
    if (categoryFilter !== "ALL" && log.category !== categoryFilter) return false;
    return true;
  });

  const levelIcon = (level: LogLevel) => {
    switch (level) {
      case "DEBUG":
        return <Bug size={14} className="text-gray-400" />;
      case "INFO":
        return <Info size={14} className="text-blue-500" />;
      case "WARN":
        return <AlertTriangle size={14} className="text-yellow-500" />;
      case "ERROR":
        return <AlertCircle size={14} className="text-red-500" />;
    }
  };

  const levelColor = (level: LogLevel) => {
    switch (level) {
      case "DEBUG":
        return "text-gray-500";
      case "INFO":
        return "text-blue-600";
      case "WARN":
        return "text-yellow-600";
      case "ERROR":
        return "text-red-600";
    }
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debug Console</h1>
          <p className="text-gray-500 mt-1">View logs and debug information</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setLogs([])}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Trash2 size={16} />
            Clear
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex gap-1">
          {(["ALL", "DEBUG", "INFO", "WARN", "ERROR"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                filter === level
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(["ALL", "PUBLISH", "VALIDATE", "CONFIG", "REALTIME", "DB", "MOBILE"] as const).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  categoryFilter === cat
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 bg-gray-900 rounded-xl overflow-auto font-mono text-sm">
        <div className="p-4 space-y-1">
          {!mounted ? (
            <div className="text-center text-gray-500 py-8">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No logs to display</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex gap-3 py-1 hover:bg-gray-800 px-2 rounded">
                <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="w-5">{levelIcon(log.level)}</span>
                <span className={`w-16 text-xs font-medium ${levelColor(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-gray-400 w-20 text-xs">[{log.category}]</span>
                <span className="text-gray-200 flex-1">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
