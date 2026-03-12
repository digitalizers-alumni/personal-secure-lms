/**
 * FileSelector interface
 * Responsibility: Capture file selection and generate initial metadata
 * User Story: US-050
 */

import { DocumentMetadata } from '@/types/document';

export interface FileSelector {
  /**
   * Triggered when user selects a file
   * @param file - The File object from browser input
   * @returns Promise resolving to DocumentMetadata
   */
  onFileSelected(file: File): Promise<DocumentMetadata>;

  /**
   * Generate unique document ID
   * @returns Unique identifier (UUID v4 or timestamp-based)
   */
  generateDocumentId(): string;
}
