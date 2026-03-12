/**
 * DocumentValidatorService implementation
 * Responsibility: Validate file type and size constraints
 * User Stories: US-050, US-080
 */

import { DocumentValidator } from '@/interfaces/DocumentValidator';
import { DocumentMetadata, ValidationResult } from '@/types/document';

export class DocumentValidatorService implements DocumentValidator {
  // Supported MIME types
  private static readonly SUPPORTED_TYPES = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // Size constraints
  private static readonly MIN_SIZE_BYTES = 1;
  private static readonly MAX_SIZE_BYTES = 20971520; // 20 MB

  /**
   * Check if mime type is supported
   * @param mimeType - MIME type to check
   * @returns true if supported, false otherwise
   */
  isSupportedType(mimeType: string): boolean {
    return DocumentValidatorService.SUPPORTED_TYPES.includes(mimeType);
  }

  /**
   * Check if file size is within limits
   * @param sizeBytes - File size in bytes
   * @returns true if valid size, false otherwise
   */
  isValidSize(sizeBytes: number): boolean {
    return (
      sizeBytes >= DocumentValidatorService.MIN_SIZE_BYTES &&
      sizeBytes <= DocumentValidatorService.MAX_SIZE_BYTES
    );
  }

  /**
   * Validate file meets all constraints
   * @param metadata - Document metadata to validate
   * @returns ValidationResult with valid flag, status, and optional error message
   */
  validate(metadata: DocumentMetadata): ValidationResult {
    // Check for empty file
    if (metadata.sizeBytes === 0) {
      return {
        valid: false,
        status: 'empty_file',
        errorMessage: 'File is empty. Please select a file with content.',
      };
    }

    // Check file size
    if (metadata.sizeBytes > DocumentValidatorService.MAX_SIZE_BYTES) {
      return {
        valid: false,
        status: 'file_too_large',
        errorMessage: 'File exceeds 20 MB limit. Please select a smaller file.',
      };
    }

    if (metadata.sizeBytes < DocumentValidatorService.MIN_SIZE_BYTES) {
      return {
        valid: false,
        status: 'empty_file',
        errorMessage: 'File is empty. Please select a file with content.',
      };
    }

    // Check file type
    if (!this.isSupportedType(metadata.mimeType)) {
      return {
        valid: false,
        status: 'unsupported_type',
        errorMessage: 'File type not supported. Please upload TXT, PDF, or DOCX files.',
      };
    }

    // All validations passed
    return {
      valid: true,
      status: 'selected',
    };
  }
}
