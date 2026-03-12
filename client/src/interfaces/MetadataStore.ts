/**
 * MetadataStore interface
 * Responsibility: Manage document metadata and processing status in frontend state
 * User Story: US-050
 */

import { DocumentMetadata, DocumentStatus } from '@/types/document';

export interface MetadataStore {
  /**
   * Store initial metadata
   * @param metadata - Document metadata to store
   */
  create(metadata: DocumentMetadata): void;

  /**
   * Update document status
   * @param documentId - Document identifier
   * @param status - New status
   * @param errorMessage - Optional error message
   */
  updateStatus(documentId: string, status: DocumentStatus, errorMessage?: string): void;

  /**
   * Retrieve metadata by ID
   * @param documentId - Document identifier
   * @returns DocumentMetadata or null if not found
   */
  get(documentId: string): DocumentMetadata | null;

  /**
   * Clear all metadata
   */
  clear(): void;
}
