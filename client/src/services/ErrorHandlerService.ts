/**
 * ErrorHandlerService
 * Responsibility: Parse and format error messages from processing operations
 * User Story: US-042
 */

import { ProcessingError } from '@/types/document';

export class ErrorHandlerService {
  /**
   * Parse error from anonymization module
   * @param response - Response from anonymization module
   * @returns ProcessingError
   */
  parseAnonymizationError(response: unknown): ProcessingError {
    try {
      if (!response || typeof response !== 'object') {
        return {
          type: 'anonymization',
          message: 'Invalid error response from anonymization module',
        };
      }

      const r = response as any;

      if (r.error && typeof r.error === 'string') {
        return {
          type: 'anonymization',
          message: r.error,
          details: r.details,
        };
      }

      if (r.message && typeof r.message === 'string') {
        return {
          type: 'anonymization',
          message: r.message,
          details: r.details,
        };
      }

      return {
        type: 'anonymization',
        message: 'Anonymization failed with unknown error',
        details: response as Record<string, unknown>,
      };
    } catch (error) {
      return {
        type: 'unknown',
        message: 'Failed to parse anonymization error response',
      };
    }
  }

  /**
   * Format error for display
   * @param error - ProcessingError
   * @returns Formatted error message
   */
  formatError(error: ProcessingError): string {
    let formatted = error.message;

    if (error.details) {
      const detailsStr = JSON.stringify(error.details, null, 2);
      formatted += `\n\nDetails:\n${detailsStr}`;
    }

    return formatted;
  }

  /**
   * Create validation error
   * @param message - Error message
   * @param details - Optional error details
   * @returns ProcessingError
   */
  createValidationError(message: string, details?: Record<string, unknown>): ProcessingError {
    return {
      type: 'validation',
      message,
      details,
    };
  }

  /**
   * Create extraction error
   * @param message - Error message
   * @param details - Optional error details
   * @returns ProcessingError
   */
  createExtractionError(message: string, details?: Record<string, unknown>): ProcessingError {
    return {
      type: 'extraction',
      message,
      details,
    };
  }

  /**
   * Create unknown error
   * @param message - Error message
   * @param details - Optional error details
   * @returns ProcessingError
   */
  createUnknownError(message: string, details?: Record<string, unknown>): ProcessingError {
    return {
      type: 'unknown',
      message,
      details,
    };
  }
}
