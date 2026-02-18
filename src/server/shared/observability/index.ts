type LogLevel = 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

type Logger = {
  info: (message: string, context?: LogContext) => void
  warn: (message: string, context?: LogContext) => void
  error: (message: string, context?: LogContext) => void
}

export function createLogger(scope: string): Logger {
  const write = (level: LogLevel, message: string, context: LogContext = {}) => {
    const payload = {
      level,
      scope,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    const serialized = JSON.stringify(payload)

    if (level === 'error') {
      console.error(serialized)
      return
    }

    if (level === 'warn') {
      console.warn(serialized)
      return
    }

    console.info(serialized)
  }

  return {
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
  }
}
