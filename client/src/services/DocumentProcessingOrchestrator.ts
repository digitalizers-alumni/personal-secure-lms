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
import { extraireTexte, détecterPII, traiterDocument, sauvegarderTableTokens, type CarteTokensChiffree } from '@/lib/pii';
import { DocumentMetadata, IntegrationContract, ProcessingError, DocumentStatus } from '@/types/document';
import { DetectionResult } from '@/hooks/usePIIDetector';
import { uploadDocumentToRAG } from '@/lib/api';

export interface ProcessingResult {
  success: boolean;
  contract?: IntegrationContract;
  error?: ProcessingError;
  metadata: DocumentMetadata;
  extractedText?: string;
  piiResult?: DetectionResult;
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
   * Process a file through the scan phase (extraction + PII detection)
   * @param file - File to process
   * @param jwt - Optional JWT for PII encryption
   * @param overrideId - Optional ID to use instead of generating one
   * @returns ProcessingResult
   */
  async processFile(file: File, jwt?: string, overrideId?: string): Promise<ProcessingResult> {
    // Step 1: File selection and metadata creation
    const metadata = await this.fileSelector.onFileSelected(file);
    if (overrideId) {
      metadata.documentId = overrideId;
    }
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

    try {
      // Step 6: PII Detection (NEW)
      this.metadataStore.updateStatus(metadata.documentId, 'scanning' as DocumentStatus);
      
      const entites = await détecterPII(extractedText, (progress) => {
        // Update status with percentage if possible, or just log
        console.log(`PII Detection Progress for ${metadata.documentId}: ${progress}%`);
        this.metadataStore.updateStatus(
          metadata.documentId, 
          'scanning' as DocumentStatus, 
          `Analyse PII : ${progress}%`
        );
      });
      
      const piiResult = this.convertToDetectionResult(extractedText, entites);

      // Step 7: PII Encryption (if JWT provided)
      if (jwt) {
        const fullResult = await traiterDocument(extractedText, entites, jwt);
        piiResult.chiffre = fullResult.chiffre;
      }

      this.metadataStore.updateStatus(
        metadata.documentId,
        piiResult.entities.length > 0 ? 'pii-found' as DocumentStatus : 'clean' as DocumentStatus
      );

      // Step 8: Create integration contract
      const contract = this.contractHandler.create(
        metadata.documentId,
        extractedText,
        metadata
      );

      return {
        success: true,
        contract,
        extractedText,
        piiResult,
        metadata: {
          ...metadata,
          status: piiResult.entities.length > 0 ? ('pii-found' as DocumentStatus) : ('clean' as DocumentStatus),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in pipeline';
      this.metadataStore.updateStatus(metadata.documentId, 'extraction_failed', errorMessage);

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

  /**
   * Helper to convert EntitePII to DetectionResult (matches usePIIDetector logic)
   */
  private convertToDetectionResult(text: string, entites: any[]): DetectionResult {
    const entities = entites.map((e, i) => ({
      entity: e.type,
      score: 1.0,
      word: e.valeur,
      start: e.debut,
      end: e.fin,
      index: i,
    }));

    const tokenMap = new Map<string, string>();
    const sorted = [...entites].sort((a, b) => a.debut - b.debut);
    
    // Optimisation : reconstruction par fragments pour éviter O(N^2) allocations de chaînes
    const fragments: string[] = [];
    let lastPos = 0;
    
    for (const entite of sorted) {
      const token = `[[${entite.id}]]`;
      tokenMap.set(token, entite.valeur);
      
      // Texte avant l'entité
      if (entite.debut > lastPos) {
        fragments.push(text.slice(lastPos, entite.debut));
      }
      
      // Le token
      fragments.push(token);
      lastPos = entite.fin;
    }
    
    // Reste du texte
    if (lastPos < text.length) {
      fragments.push(text.slice(lastPos));
    }

    const anonymizedText = fragments.join('');

    return { entities, anonymizedText, tokenMap, rawEntities: entites };
  }

  /**
   * Ingest the anonymized file to RAG and update status
   */
  async ingestFile(
    documentId: string, 
    filename: string, 
    anonymizedText: string, 
    chiffre?: CarteTokensChiffree,
    entityCount?: number,
    categories?: string[]
  ): Promise<{ doc_id: string }> {
    const fileToUpload = new File(
      [anonymizedText], 
      `${filename.replace(/\.[^.]+$/, "")}-anonymized.txt`, 
      { type: "text/plain" }
    );
    
    const response = await uploadDocumentToRAG(fileToUpload);
    const backendDocId = response.doc_id.toString();

    // Consolidate: Save tokens directly if provided
    if (chiffre) {
      await sauvegarderTableTokens(backendDocId, chiffre, entityCount, categories);
    }

    this.metadataStore.updateStatus(documentId, 'indexed' as DocumentStatus);
    
    return { doc_id: backendDocId };
  }
}
