export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

const envLevel =
  typeof process !== "undefined" ? (process.env.ENTRESTATE_LOG_LEVEL?.toUpperCase() as LogLevel) : undefined
const CURRENT_LEVEL: LogLevel = envLevel || "INFO"

const LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[CURRENT_LEVEL]
}

function hasEmoji(text: string): boolean {
  return /[^\x00-\x7F]/.test(text)
}

function stripEmojis(text: string): string {
  return text.replace(/[^\x00-\x7F]/g, "").trim()
}

export const logger = {
  debug: (...args: any[]) => {
    if (shouldLog("DEBUG")) {
      console.debug(...args)
    }
  },
  info: (...args: any[]) => {
    if (shouldLog("INFO")) {
      const sanitized = args.map(arg => 
        typeof arg === "string" && CURRENT_LEVEL === "INFO" ? stripEmojis(arg) : arg
      ).filter(arg => typeof arg !== "string" || arg.length > 0)
      
      if (sanitized.length > 0) {
        console.info(...sanitized)
      }
    }
  },
  warn: (...args: any[]) => {
    if (shouldLog("WARN")) {
      console.warn(...args)
    }
  },
  error: (...args: any[]) => {
    if (shouldLog("ERROR")) {
      console.error(...args)
    }
  },
}
