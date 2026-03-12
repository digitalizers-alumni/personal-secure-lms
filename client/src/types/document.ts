/**
 * Document processing types for LuminaSwiss
 * Feature: Document Ingestion, Validation & TLS Gateway
 * User Stories: US-050, US-051, US-052
 */

/**
 * Document processing status
 */
export type DocumentStatus =
  | 'selected'              // File selected, not yet validated
  | 'extracted'             // Text extraction successful
  | 'unsupported_type'      // File type not supported
  | 'empty_file'            // File size is 0 bytes
  | 'file_too_large'        // File exceeds 20 MB limit
  | 'extraction_failed';    // Text extraction failed

/**
 * Document metadata stored in frontend state
 */
export interface DocumentMetadata {
  documentId: string;          // Unique identifier (UUID v4)
  filename: string;             // Original filename
  mimeType: string;             // MIME type from File object
  sizeBytes: number;            // File size in bytes
  status: DocumentStatus;       // Current processing status
  errorMessage?: string;        // Error details if status indicates failure
  createdAt: number;            // Timestamp (milliseconds since epoch)
}

/**
 * Integration contract for frontend-to-frontend communication
 * between extraction layer and anonymization module
 */
export interface IntegrationContract {
  documentId: string;
  extractedText: string;
  metadata: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
  };
}

/**
 * Validation result from DocumentValidator
 */
export interface ValidationResult {
  valid: boolean;
  status: DocumentStatus;
  errorMessage?: string;
}

/**
 * Extraction result from TextExtractor
 */
export interface ExtractionResult {
  success: boolean;
  extractedText?: string;
  status: DocumentStatus;
  errorMessage?: string;
}

/**
 * Processing error types
 */
export interface ProcessingError {
  type: 'validation' | 'extraction' | 'anonymization' | 'unknown';
  message: string;
  details?: Record<string, unknown>;
}
