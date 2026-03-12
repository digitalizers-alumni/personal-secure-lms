import { describe, it, expect } from 'vitest';
import { ErrorHandlerService } from '../ErrorHandlerService';

const service = new ErrorHandlerService();

describe('ErrorHandlerService', () => {
  describe('parseAnonymizationError', () => {
    it('should extract error string from response', () => {
      const result = service.parseAnonymizationError({ error: 'Model failed' });
      expect(result.type).toBe('anonymization');
      expect(result.message).toBe('Model failed');
    });

    it('should extract message string from response', () => {
      const result = service.parseAnonymizationError({ message: 'Timeout' });
      expect(result.type).toBe('anonymization');
      expect(result.message).toBe('Timeout');
    });

    it('should handle null response', () => {
      const result = service.parseAnonymizationError(null);
      expect(result.type).toBe('anonymization');
      expect(result.message).toContain('Invalid');
    });

    it('should handle unknown shape', () => {
      const result = service.parseAnonymizationError({ foo: 'bar' });
      expect(result.type).toBe('anonymization');
      expect(result.message).toContain('unknown error');
    });
  });

  describe('factory methods', () => {
    it('createValidationError should set correct type', () => {
      const err = service.createValidationError('bad file');
      expect(err.type).toBe('validation');
      expect(err.message).toBe('bad file');
    });

    it('createExtractionError should set correct type', () => {
      const err = service.createExtractionError('parse failed');
      expect(err.type).toBe('extraction');
      expect(err.message).toBe('parse failed');
    });

    it('createUnknownError should set correct type', () => {
      const err = service.createUnknownError('oops');
      expect(err.type).toBe('unknown');
      expect(err.message).toBe('oops');
    });

    it('should include details when provided', () => {
      const err = service.createValidationError('bad', { field: 'size' });
      expect(err.details).toEqual({ field: 'size' });
    });
  });

  describe('formatError', () => {
    it('should format without details', () => {
      const formatted = service.formatError({ type: 'validation', message: 'Too big' });
      expect(formatted).toBe('Too big');
    });

    it('should include details when present', () => {
      const formatted = service.formatError({
        type: 'extraction',
        message: 'Failed',
        details: { page: 3 },
      });
      expect(formatted).toContain('Failed');
      expect(formatted).toContain('page');
    });
  });
});
