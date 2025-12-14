/**
 * Centralized Logger Utility
 * Controls console output across the app.
 * Set LOG_LEVEL to control verbosity.
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "none";

// Set this to control what gets logged
// "debug" = everything, "info" = info+warn+error, "warn" = warn+error, "error" = errors only, "none" = silent
const LOG_LEVEL: LogLevel = __DEV__ ? "info" : "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

const shouldLog = (level: LogLevel): boolean => {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL];
};

export const logger = {
  /** Debug level - verbose details, only in development */
  debug: (tag: string, message: string, data?: unknown) => {
    if (shouldLog("debug")) {
      console.log(`[${tag}] ${message}`, data ?? "");
    }
  },

  /** Info level - important events like successful operations */
  info: (tag: string, message: string, data?: unknown) => {
    if (shouldLog("info")) {
      console.log(`✓ [${tag}] ${message}`, data ?? "");
    }
  },

  /** Warning level - potential issues */
  warn: (tag: string, message: string, data?: unknown) => {
    if (shouldLog("warn")) {
      console.warn(`⚠ [${tag}] ${message}`, data ?? "");
    }
  },

  /** Error level - failures and errors */
  error: (tag: string, message: string, data?: unknown) => {
    if (shouldLog("error")) {
      console.error(`✗ [${tag}] ${message}`, data ?? "");
    }
  },

  /** Action level - user actions like button presses (always shown in dev) */
  action: (tag: string, action: string, result?: "success" | "fail", data?: unknown) => {
    if (__DEV__) {
      const icon = result === "success" ? "✓" : result === "fail" ? "✗" : "→";
      console.log(`${icon} [${tag}] ${action}`, data ?? "");
    }
  },
};

export default logger;
