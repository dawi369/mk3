/**
 * Simple structured logger for the backend
 * Outputs JSON format for easy parsing in production
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const isDev = Bun.env.NODE_ENV !== "production";

function formatLog(entry: LogEntry): string {
  if (isDev) {
    // Human-readable format for development
    const { timestamp, level, message, ...rest } = entry;
    const extras =
      Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
    return `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${message}${extras}`;
  }
  // JSON format for production (easier to parse in log aggregators)
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  console.log(formatLog(entry));
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    log("error", message, meta),

  /**
   * Log an HTTP request with timing
   */
  request: (
    method: string,
    path: string,
    status: number,
    durationMs: number,
    meta?: Record<string, unknown>,
  ) => {
    const level: LogLevel =
      status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    log(level, `${method} ${path}`, {
      status,
      durationMs,
      ...meta,
    });
  },
};
