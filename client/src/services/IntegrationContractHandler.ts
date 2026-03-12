/**
 * IntegrationContractHandler
 * Responsibility: Create and validate standardized data structure for anonymization module
 * User Story: US-052
 */

import { IntegrationContract, DocumentMetadata, ValidationResult } from '@/types/document';

export class IntegrationContractHandler {
  /**
   * Create contract from extraction result
   * @param documentId - Document identifier
   * @param extractedText - Extracted text content
   * @param metadata - Document metadata
   * @returns IntegrationContract object
   */
  create(
    documentId: string,
    extractedText: string,
    metadata: DocumentMetadata
  ): IntegrationContract {
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('extractedText must be a non-empty string');
    }

    return {
      documentId,
      extractedText,
      metadata: {
        filename: metadata.filename,
        mimeType: metadata.mimeType,
        sizeBytes: metadata.sizeBytes,
      },
    };
  }

  /**
   * Validate contract structure
   * @param contract - Contract object to validate
   * @returns ValidationResult
   */
  validate(contract: unknown): ValidationResult {
    if (!contract || typeof contract !== 'object') {
      return {
        valid: false,
        status: 'extraction_failed',
        errorMessage: 'Integration contract must be an object',
      };
    }

    const c = contract as any;

    // Check required fields
    const requiredFields = ['documentId', 'extractedText', 'metadata'];
    const missingFields = requiredFields.filter((field) => !(field in c));

    if (missingFields.length > 0) {
      return {
        valid: false,
        status: 'extraction_failed',
        errorMessage: `Integration contract missing required fields: ${missingFields.join(', ')}`,
      };
    }

    // Validate documentId
    if (typeof c.documentId !== 'string' || c.documentId.trim().length === 0) {
      return {
        valid: false,
        status: 'extraction_failed',
        errorMessage: 'documentId must be a non-empty string',
      };
    }

    // Validate extractedText
    if (typeof c.extractedText !== 'string' || c.extractedText.trim().length === 0) {
      return {
        valid: false,
        status: 'extraction_failed',
        errorMessage: 'extractedText must be a non-empty string',
      };
    }

    // Validate metadata
    if (!c.metadata || typeof c.metadata !== 'object') {
      return {
        valid: false,
        status: 'extraction_failed',
        errorMessage: 'metadata must be an object',
      };
    }

    // Validate metadata fields
    const metadataFields = ['filename', 'mimeType', 'sizeBytes'];
    const missingMetadataFields = metadataFields.filter((field) => !(field in c.metadata));

    if (missingMetadataFields.length > 0) {
      return {
        valid: false,
        status: 'extraction_failed',
        errorMessage: `metadata missing required fields: ${missingMetadataFields.join(', ')}`,
      };
    }

    // Validate metadata.filename
    if (typeof c.metadata.filename !== 'string' || c.metadata.filename.trim().length === 0) {
      return {
        valid: false,
        status: 'extraction_failed',
        errorMessage: 'metadata.filename must be a non-empty string',
      };
    }

    // Validate metadata.mimeType
    if (typeof c.metadata.mimeType !== 'string') {
      return {
        valid: false,
        status: 'extraction_failed',
        errorMessage: 'metadata.mimeType must be a string',
      };
    }

    // Validate metadata.sizeBytes
    if (typeof c.metadata.sizeBytes !== 'number' || c.metadata.sizeBytes <= 0) {
      return {
        valid: false,
        status: 'extraction_failed',
        errorMessage: 'metadata.sizeBytes must be a positive number',
      };
    }

    return {
      valid: true,
      status: 'extracted',
    };
  }

  /**
   * Parse contract from JSON
   * @param json - JSON string
   * @returns IntegrationContract object
   */
  parse(json: string): IntegrationContract {
    try {
      const parsed = JSON.parse(json);
      const validation = this.validate(parsed);

      if (!validation.valid) {
        throw new Error(validation.errorMessage || 'Invalid contract structure');
      }

      return parsed as IntegrationContract;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw error;
    }
  }

  /**
   * Pretty print contract to JSON
   * @param contract - IntegrationContract object
   * @returns Formatted JSON string
   */
  print(contract: IntegrationContract): string {
    return JSON.stringify(contract, null, 2);
  }
}
