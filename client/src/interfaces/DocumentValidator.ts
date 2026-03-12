/**
 * DocumentValidator interface
 * Responsibility: Validate file type and size constraints
 * User Stories: US-050, US-080
 */

import { DocumentMetadata, ValidationResult } from '@/types/document';

export interface DocumentValidator {
  /**
   * Validate file meets all constraints
   * @param metadata - Document metadata to validate
   * @returns ValidationResult with valid flag, status, and optional error message
   */
  validate(metadata: DocumentMetadata): ValidationResult;

  /**
   * Check if mime type is supported
   * @param mimeType - MIME type to check
   * @returns true if supported, false otherwise
   */
  isSupportedType(mimeType: string): boolean;

  /**
   * Check if file size is within limits
   * @param sizeBytes - File size in bytes
   * @returns true if valid size, false otherwise
   */
  isValidSize(sizeBytes: number): boolean;
}
