import { describe, it, expect } from 'vitest';
import { IntegrationContractHandler } from '../IntegrationContractHandler';
import { DocumentMetadata } from '@/types/document';

const handler = new IntegrationContractHandler();

const sampleMeta: DocumentMetadata = {
  documentId: 'abc-123',
  filename: 'contrat.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 5000,
  status: 'extracted',
  createdAt: Date.now(),
};

describe('IntegrationContractHandler', () => {
  // --- create ---

  describe('create', () => {
    it('should create a valid contract', () => {
      const contract = handler.create('abc-123', 'Bonjour le monde', sampleMeta);

      expect(contract.documentId).toBe('abc-123');
      expect(contract.extractedText).toBe('Bonjour le monde');
      expect(contract.metadata.filename).toBe('contrat.pdf');
      expect(contract.metadata.mimeType).toBe('application/pdf');
      expect(contract.metadata.sizeBytes).toBe(5000);
    });

    it('should throw for empty extractedText', () => {
      expect(() => handler.create('abc-123', '', sampleMeta)).toThrow('non-empty');
    });

    it('should throw for whitespace-only extractedText', () => {
      expect(() => handler.create('abc-123', '   ', sampleMeta)).toThrow('non-empty');
    });
  });

  // --- validate ---

  describe('validate', () => {
    it('should validate a correct contract', () => {
      const contract = handler.create('abc-123', 'texte', sampleMeta);
      const result = handler.validate(contract);
      expect(result.valid).toBe(true);
    });

    it('should reject null', () => {
      const result = handler.validate(null);
      expect(result.valid).toBe(false);
    });

    it('should reject missing fields', () => {
      const result = handler.validate({ documentId: 'x' });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('missing required fields');
    });

    it('should reject empty documentId', () => {
      const result = handler.validate({
        documentId: '',
        extractedText: 'text',
        metadata: { filename: 'a.pdf', mimeType: 'application/pdf', sizeBytes: 100 },
      });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('documentId');
    });

    it('should reject negative sizeBytes', () => {
      const result = handler.validate({
        documentId: 'x',
        extractedText: 'text',
        metadata: { filename: 'a.pdf', mimeType: 'application/pdf', sizeBytes: -1 },
      });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('sizeBytes');
    });
  });

  // --- parse / print round-trip ---

  describe('parse and print', () => {
    it('should round-trip through JSON', () => {
      const contract = handler.create('id-1', 'Mon texte PII', sampleMeta);
      const json = handler.print(contract);
      const parsed = handler.parse(json);

      expect(parsed.documentId).toBe('id-1');
      expect(parsed.extractedText).toBe('Mon texte PII');
      expect(parsed.metadata.filename).toBe('contrat.pdf');
    });

    it('should throw on invalid JSON', () => {
      expect(() => handler.parse('not json')).toThrow('Invalid JSON');
    });
  });
});
