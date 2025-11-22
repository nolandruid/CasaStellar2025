/**
 * Logging Middleware
 * Provides request/response logging and error handling
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AppError, createErrorResponse, isOperationalError } from '../utils/errors';

/**
 * Request logging middleware
 * Logs incoming requests with timing information
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Log incoming request
  logger.httpRequest(req.method, req.path, {
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: req.body && Object.keys(req.body).length > 0 ? sanitizeBody(req.body) : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to log response
  res.end = function(this: Response, chunk?: any, encoding?: any, callback?: any): Response {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.httpResponse(req.method, req.path, res.statusCode, duration);
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding, callback);
  } as any;

  next();
}

/**
 * Sanitize request body for logging
 * Removes sensitive fields like passwords, tokens, etc.
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'privateKey',
    'private_key',
    'secretKey',
    'secret_key',
  ];

  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Error handling middleware
 * Catches and formats errors for consistent API responses
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  if (err instanceof AppError) {
    logger.error(`${err.code}: ${err.message}`, err, {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
    });
  } else {
    logger.error('Unhandled error', err, {
      path: req.path,
      method: req.method,
    });
  }

  // Create error response
  const errorResponse = createErrorResponse(err, req.path);
  
  // Determine status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  
  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
}

/**
 * Process error handler
 * Handles uncaught exceptions and unhandled rejections
 */
export function setupProcessErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', error);
    
    // Exit if it's not an operational error
    if (!isOperationalError(error)) {
      logger.error('Non-operational error detected, shutting down...');
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason: any) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled Rejection', error);
    
    // Exit if it's not an operational error
    if (!isOperationalError(error)) {
      logger.error('Non-operational error detected, shutting down...');
      process.exit(1);
    }
  });
}
