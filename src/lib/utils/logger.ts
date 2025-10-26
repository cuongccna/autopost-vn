import winston from 'winston';
import path from 'path';

/**
 * Winston Logger Configuration for AutoPost VN
 * 
 * Features:
 * - Structured JSON logging for production
 * - Pretty colored output for development
 * - Separate error log file
 * - Log rotation ready
 * - Context-aware logging (userId, requestId, etc.)
 * 
 * @module logger
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Custom log format for production
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

/**
 * Custom log format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: isDevelopment ? consoleFormat : jsonFormat,
  defaultMeta: {
    service: 'autopost-vn',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      stderrLevels: ['error']
    })
  ]
});

// Add file transports for production
if (!isDevelopment) {
  const logsDir = path.join(process.cwd(), 'logs');
  
  // Combined log file
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true
  }));
  
  // Error log file
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true
  }));
}

/**
 * Create a child logger with additional context
 * 
 * @param context - Additional context (userId, requestId, etc.)
 * @returns Child logger instance
 * 
 * @example
 * const userLogger = createLogger({ userId: '123', action: 'create-post' });
 * userLogger.info('Post created successfully');
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log levels:
 * - error: Error events that might still allow the application to continue
 * - warn: Warning events that might lead to errors
 * - info: Informational messages (e.g., user actions, API calls)
 * - http: HTTP request logs
 * - debug: Detailed debug information
 */
export default logger;

/**
 * Helper functions for common logging patterns
 */

export const loggers = {
  /**
   * Log OAuth connection event
   */
  oauthConnect: (provider: string, userId: string, success: boolean, error?: string) => {
    const level = success ? 'info' : 'error';
    logger.log(level, `OAuth connection ${success ? 'successful' : 'failed'}`, {
      provider,
      userId,
      success,
      error,
      type: 'oauth'
    });
  },

  /**
   * Log post creation event
   */
  postCreate: (postId: string, userId: string, providers: string[], scheduled?: boolean) => {
    logger.info('Post created', {
      postId,
      userId,
      providers,
      scheduled,
      type: 'post-create'
    });
  },

  /**
   * Log post publish event
   */
  postPublish: (postId: string, provider: string, success: boolean, externalId?: string, error?: string) => {
    const level = success ? 'info' : 'error';
    logger.log(level, `Post ${success ? 'published' : 'failed'}`, {
      postId,
      provider,
      success,
      externalId,
      error,
      type: 'post-publish'
    });
  },

  /**
   * Log API request
   */
  apiRequest: (method: string, path: string, userId?: string, duration?: number) => {
    logger.http('API request', {
      method,
      path,
      userId,
      duration,
      type: 'api-request'
    });
  },

  /**
   * Log API error
   */
  apiError: (method: string, path: string, error: Error, userId?: string) => {
    logger.error('API error', {
      method,
      path,
      userId,
      error: error.message,
      stack: error.stack,
      type: 'api-error'
    });
  },

  /**
   * Log scheduler event
   */
  scheduler: (event: string, details: Record<string, any>) => {
    logger.info(`Scheduler: ${event}`, {
      ...details,
      type: 'scheduler'
    });
  },

  /**
   * Log rate limit event
   */
  rateLimit: (userId: string, provider: string, limited: boolean) => {
    logger.warn('Rate limit check', {
      userId,
      provider,
      limited,
      type: 'rate-limit'
    });
  }
};
