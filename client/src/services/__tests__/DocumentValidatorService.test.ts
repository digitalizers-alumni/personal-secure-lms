import { describe, it, expect } from 'vitest';
import { DocumentValidatorService } from '../DocumentValidatorService';
import { DocumentMetadata } from '@/types/document';

function makeMeta(overrides: Partial<DocumentMetadata> = {}): DocumentMetadata {
  return {
    documentId: 'test-id',
    filename: 'test.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    status: 'selected',
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('DocumentValidatorService', () => {
  const validator = new DocumentValidatorService();

  // --- Supported types ---

  describe('isSupportedType', () => {
    it('should accept text/plain', () => {
      expect(validator.isSupportedType('text/plain')).toBe(true);
    });

    it('should accept application/pdf', () => {
      expect(validator.isSupportedType('application/pdf')).toBe(true);
    });

    it('should accept DOCX mime type', () => {
      expect(validator.isSupportedType(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )).toBe(true);
    });

    it('should reject image/png', () => {
      expect(validator.isSupportedType('image/png')).toBe(false);
    });

    it('should reject application/json', () => {
      expect(validator.isSupportedType('application/json')).toBe(false);
    });

    it('should reject xlsx mime type', () => {
      expect(validator.isSupportedType(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )).toBe(false);
    });
  });

  // --- Size validation ---

  describe('isValidSize', () => {
    it('should accept 1 byte (minimum)', () => {
      expect(validator.isValidSize(1)).toBe(true);
    });

    it('should accept 20 MB exactly (maximum)', () => {
      expect(validator.isValidSize(20_971_520)).toBe(true);
    });

    it('should reject 0 bytes', () => {
      expect(validator.isValidSize(0)).toBe(false);
    });

    it('should reject 20 MB + 1 byte', () => {
      expect(validator.isValidSize(20_971_521)).toBe(false);
    });
  });

  // --- Full validation ---

  describe('validate', () => {
    it('should pass for valid PDF metadata', () => {
      const result = validator.validate(makeMeta());
      expect(result.valid).toBe(true);
      expect(result.status).toBe('selected');
    });

    it('should fail for empty file', () => {
      const result = validator.validate(makeMeta({ sizeBytes: 0 }));
      expect(result.valid).toBe(false);
      expect(result.status).toBe('empty_file');
    });

    it('should fail for file too large', () => {
      const result = validator.validate(makeMeta({ sizeBytes: 30_000_000 }));
      expect(result.valid).toBe(false);
      expect(result.status).toBe('file_too_large');
    });

    it('should fail for unsupported type', () => {
      const result = validator.validate(makeMeta({ mimeType: 'image/jpeg' }));
      expect(result.valid).toBe(false);
      expect(result.status).toBe('unsupported_type');
      expect(result.errorMessage).toContain('TXT, PDF, or DOCX');
    });

    it('should pass for valid TXT at boundary size', () => {
      const result = validator.validate(makeMeta({ mimeType: 'text/plain', sizeBytes: 1 }));
      expect(result.valid).toBe(true);
    });
  });
});
