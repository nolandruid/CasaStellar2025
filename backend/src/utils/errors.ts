/**
 * Error Types and Response Utilities
 * Provides standardized error handling and response formatting
 */

export enum ErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  
  // Authentication/Authorization Errors (401, 403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Resource Errors (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Conflict Errors (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  
  // Contract/Blockchain Errors (422)
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  SIMULATION_FAILED = 'SIMULATION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  CONTRACT_NOT_CONFIGURED = 'CONTRACT_NOT_CONFIGURED',
  
  // External Service Errors (502, 503)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SOROBAN_ERROR = 'SOROBAN_ERROR',
  HORIZON_ERROR = 'HORIZON_ERROR',
  SDP_ERROR = 'SDP_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Server Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string;
  [key: string]: any;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
    timestamp: string;
    path?: string;
    txHash?: string;
  };
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: ErrorDetails;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: ErrorDetails,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

/**
 * Authentication Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: ErrorDetails) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details);
  }
}

/**
 * Authorization Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: ErrorDetails) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(ErrorCode.NOT_FOUND, message, 404, details);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(ErrorCode.CONFLICT, message, 409, details);
  }
}

/**
 * Contract Error (422)
 */
export class ContractError extends AppError {
  public readonly txHash?: string;

  constructor(message: string, details?: ErrorDetails, txHash?: string) {
    super(ErrorCode.CONTRACT_ERROR, message, 422, details);
    this.txHash = txHash;
  }

  toJSON(): ErrorResponse {
    const response = super.toJSON();
    if (this.txHash) {
      response.error.txHash = this.txHash;
    }
    return response;
  }
}

/**
 * Transaction Failed Error (422)
 */
export class TransactionFailedError extends AppError {
  public readonly txHash?: string;

  constructor(message: string, txHash?: string, details?: ErrorDetails) {
    super(ErrorCode.TRANSACTION_FAILED, message, 422, details);
    this.txHash = txHash;
  }

  toJSON(): ErrorResponse {
    const response = super.toJSON();
    if (this.txHash) {
      response.error.txHash = this.txHash;
    }
    return response;
  }
}

/**
 * Simulation Failed Error (422)
 */
export class SimulationFailedError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(ErrorCode.SIMULATION_FAILED, message, 422, details);
  }
}

/**
 * External Service Error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: ErrorDetails) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `${service} error: ${message}`,
      502,
      details
    );
  }
}

/**
 * Soroban RPC Error (502)
 */
export class SorobanError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(ErrorCode.SOROBAN_ERROR, `Soroban error: ${message}`, 502, details);
  }
}

/**
 * Horizon API Error (502)
 */
export class HorizonError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(ErrorCode.HORIZON_ERROR, `Horizon error: ${message}`, 502, details);
  }
}

/**
 * SDP Error (502)
 */
export class SDPError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(ErrorCode.SDP_ERROR, `SDP error: ${message}`, 502, details);
  }
}

/**
 * Database Error (503)
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(ErrorCode.DATABASE_ERROR, message, 503, details);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: ErrorDetails) {
    super(ErrorCode.INTERNAL_ERROR, message, 500, details, false);
  }
}

/**
 * Helper: Create error response object
 */
export function createErrorResponse(
  error: Error | AppError,
  path?: string
): ErrorResponse {
  if (error instanceof AppError) {
    const response = error.toJSON();
    if (path) {
      response.error.path = path;
    }
    return response;
  }

  // Handle unknown errors
  return {
    success: false,
    error: {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path,
    },
  };
}

/**
 * Helper: Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Helper: Parse Stellar/Soroban errors
 */
export function parseStellarError(error: any): AppError {
  const errorMessage = error?.message || 'Unknown Stellar error';
  
  // Check for specific error types
  if (errorMessage.includes('simulation failed') || errorMessage.includes('Simulation failed')) {
    return new SimulationFailedError(errorMessage, {
      originalError: error?.toString(),
    });
  }
  
  if (errorMessage.includes('transaction failed') || errorMessage.includes('Transaction failed')) {
    return new TransactionFailedError(errorMessage, undefined, {
      originalError: error?.toString(),
    });
  }
  
  if (errorMessage.includes('insufficient balance') || errorMessage.includes('Insufficient')) {
    return new ContractError('Insufficient balance for transaction', {
      originalError: error?.toString(),
    });
  }
  
  if (errorMessage.includes('account not found') || errorMessage.includes('Account not found')) {
    return new HorizonError('Account not found on network', {
      originalError: error?.toString(),
    });
  }
  
  // Default to Soroban error
  return new SorobanError(errorMessage, {
    originalError: error?.toString(),
  });
}

/**
 * Helper: Wrap async function with error handling
 */
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // Try to parse as Stellar error
      const parsedError = parseStellarError(error);
      throw parsedError;
    }
  };
}
