type LogLevel = 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

export function createLogger(scope: string) {
  const write = (level: LogLevel, message: string, context: LogContext = {}) => {
    const payload = {
      level,
      scope,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    if (level === 'error') {
      console.error(payload)
      return
    }

    if (level === 'warn') {
      console.warn(payload)
      return
    }

    console.info(payload)
  }

  return {
    info: (message: string, context?: LogContext) => write('info', message, context),
    warn: (message: string, context?: LogContext) => write('warn', message, context),
    error: (message: string, context?: LogContext) => write('error', message, context),
  }
}
