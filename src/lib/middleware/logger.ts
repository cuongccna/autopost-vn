import { NextRequest, NextResponse } from 'next/server';
import logger, { loggers } from '@/lib/utils/logger';

/**
 * API Request Logger Middleware
 * 
 * Logs all API requests with timing information
 * Integrates with Sentry for error tracking
 */

export function withLogging(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    const startTime = Date.now();
    const { method, url } = req;
    const path = new URL(url).pathname;
    
    // Extract user ID if available (from session/auth)
    let userId: string | undefined;
    try {
      // You can extract userId from session here if needed
      // const session = await getServerSession();
      // userId = session?.user?.id;
    } catch (e) {
      // Ignore auth errors in middleware
    }

    try {
      // Execute handler
      const response = await handler(req, context);
      const duration = Date.now() - startTime;
      
      // Log successful request
      loggers.apiRequest(method, path, userId, duration);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      loggers.apiError(method, path, error as Error, userId);
      
      // Re-throw to let error handler catch it
      throw error;
    }
  };
}

/**
 * Performance monitoring wrapper
 * Tracks execution time of async functions
 */
export async function trackPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.debug(`Performance: ${name}`, {
      duration,
      ...context,
      type: 'performance'
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`Performance: ${name} failed`, {
      duration,
      error: (error as Error).message,
      ...context,
      type: 'performance'
    });
    
    throw error;
  }
}
