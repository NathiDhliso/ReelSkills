import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  code: string;
  message: string;
  details?: string;
  userMessage: string;
  retryable: boolean;
}

export class ErrorHandler {
  static handleSupabaseError(error: PostgrestError): AppError {
    console.error('Supabase error:', error);

    // Handle specific Supabase error codes
    switch (error.code) {
      case 'PGRST116':
        return {
          code: 'NOT_FOUND',
          message: error.message,
          userMessage: 'The requested data was not found.',
          retryable: false
        };
      
      case 'PGRST301':
        return {
          code: 'PERMISSION_DENIED',
          message: error.message,
          userMessage: 'You don\'t have permission to perform this action.',
          retryable: false
        };
      
      case '23505':
        return {
          code: 'DUPLICATE_ENTRY',
          message: error.message,
          userMessage: 'This item already exists. Please try a different name.',
          retryable: false
        };
      
      case '23503':
        return {
          code: 'FOREIGN_KEY_VIOLATION',
          message: error.message,
          userMessage: 'Cannot complete this action due to related data.',
          retryable: false
        };
      
      default:
        return {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error.details,
          userMessage: 'A database error occurred. Please try again.',
          retryable: true
        };
    }
  }

  static handleNetworkError(error: Error): AppError {
    console.error('Network error:', error);

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        retryable: true
      };
    }

    return {
      code: 'UNKNOWN_NETWORK_ERROR',
      message: error.message,
      userMessage: 'A network error occurred. Please try again.',
      retryable: true
    };
  }

  static handleValidationError(field: string, value: any): AppError {
    return {
      code: 'VALIDATION_ERROR',
      message: `Invalid ${field}: ${value}`,
      userMessage: `Please provide a valid ${field}.`,
      retryable: false
    };
  }

  static handleFileUploadError(error: Error): AppError {
    console.error('File upload error:', error);

    if (error.message.includes('size')) {
      return {
        code: 'FILE_TOO_LARGE',
        message: error.message,
        userMessage: 'File is too large. Please select a smaller file.',
        retryable: false
      };
    }

    if (error.message.includes('type')) {
      return {
        code: 'INVALID_FILE_TYPE',
        message: error.message,
        userMessage: 'Invalid file type. Please select a supported file format.',
        retryable: false
      };
    }

    return {
      code: 'UPLOAD_ERROR',
      message: error.message,
      userMessage: 'Failed to upload file. Please try again.',
      retryable: true
    };
  }

  static handleGenericError(error: Error): AppError {
    console.error('Generic error:', error);

    return {
      code: 'GENERIC_ERROR',
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: true
    };
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }

      const delay = ErrorHandler.getRetryDelay(attempt);
      onRetry?.(attempt + 1, lastError);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};