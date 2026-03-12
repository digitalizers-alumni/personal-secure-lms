/**
 * DocumentProcessingOrchestrator
 * Responsibility: Orchestrate the complete document processing flow
 * User Stories: US-050, US-051, US-052, US-042
 *
 * Uses the existing extracteur-texte.ts (from @/lib/pii) for text extraction
 * instead of a separate TextExtractorService, to avoid duplication.
 */

import { FileSelectorService } from './FileSelectorService';
import { DocumentValidatorService } from './DocumentValidatorService';
import { IntegrationContractHandler } from './IntegrationContractHandler';
import { ErrorHandlerService } from './ErrorHandlerService';
import { MetadataStore } from '@/interfaces/MetadataStore';
import { extraireTexte } from '@/lib/pii';
import { DocumentMetadata, IntegrationContract, ProcessingError } from '@/types/document';

export interface ProcessingResult {
  success: boolean;
  contract?: IntegrationContract;
  error?: ProcessingError;
  metadata: DocumentMetadata;
}

export class DocumentProcessingOrchestrator {
  private fileSelector: FileSelectorService;
  private validator: DocumentValidatorService;
  private contractHandler: IntegrationContractHandler;
  private errorHandler: ErrorHandlerService;

  constructor(private metadataStore: MetadataStore) {
    this.fileSelector = new FileSelectorService();
    this.validator = new DocumentValidatorService();
    this.contractHandler = new IntegrationContractHandler();
    this.errorHandler = new ErrorHandlerService();
  }

  /**
   * Process a file through the complete pipeline
   * @param file - File to process
   * @returns ProcessingResult
   */
  async processFile(file: File): Promise<ProcessingResult> {
    // Step 1: File selection and metadata creation
    const metadata = await this.fileSelector.onFileSelected(file);
    this.metadataStore.create(metadata);

    // Step 2: Validation
    const validationResult = this.validator.validate(metadata);

    if (!validationResult.valid) {
      this.metadataStore.updateStatus(
        metadata.documentId,
        validationResult.status,
        validationResult.errorMessage
      );

      return {
        success: false,
        error: this.errorHandler.createValidationError(
          validationResult.errorMessage || 'Validation failed'
        ),
        metadata: {
          ...metadata,
          status: validationResult.status,
          errorMessage: validationResult.errorMessage,
        },
      };
    }

    // Step 3: Text extraction using existing extracteur-texte
    let extractedText: string;
    try {
      extractedText = await extraireTexte(file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error';
      this.metadataStore.updateStatus(
        metadata.documentId,
        'extraction_failed',
        errorMessage
      );

      return {
        success: false,
        error: this.errorHandler.createExtractionError(errorMessage),
        metadata: {
          ...metadata,
          status: 'extraction_failed',
          errorMessage,
        },
      };
    }

    // Step 4: Update status to extracted
    this.metadataStore.updateStatus(metadata.documentId, 'extracted');

    // Step 5: Create integration contract
    try {
      const contract = this.contractHandler.create(
        metadata.documentId,
        extractedText,
        metadata
      );

      // Validate the contract
      const contractValidation = this.contractHandler.validate(contract);

      if (!contractValidation.valid) {
        return {
          success: false,
          error: this.errorHandler.createValidationError(
            contractValidation.errorMessage || 'Contract validation failed'
          ),
          metadata: {
            ...metadata,
            status: 'extracted',
          },
        };
      }

      return {
        success: true,
        contract,
        metadata: {
          ...metadata,
          status: 'extracted',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error creating contract';

      return {
        success: false,
        error: this.errorHandler.createUnknownError(errorMessage),
        metadata: {
          ...metadata,
          status: 'extracted',
        },
      };
    }
  }
}
