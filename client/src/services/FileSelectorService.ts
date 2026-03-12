/**
 * FileSelectorService implementation
 * Responsibility: Capture file selection and generate initial metadata
 * User Story: US-050
 */

import { FileSelector } from '@/interfaces/FileSelector';
import { DocumentMetadata } from '@/types/document';

export class FileSelectorService implements FileSelector {
  /**
   * Generate unique document ID using UUID v4 format
   * @returns Unique identifier
   */
  generateDocumentId(): string {
    // UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Handle file selection and create initial metadata
   * @param file - The File object from browser input
   * @returns Promise resolving to DocumentMetadata
   */
  async onFileSelected(file: File): Promise<DocumentMetadata> {
    const documentId = this.generateDocumentId();
    const createdAt = Date.now();

    const metadata: DocumentMetadata = {
      documentId,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      status: 'selected',
      createdAt,
    };

    return metadata;
  }
}
