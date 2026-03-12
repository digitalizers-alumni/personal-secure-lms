import { describe, it, expect } from 'vitest';
import { FileSelectorService } from '../FileSelectorService';

describe('FileSelectorService', () => {
  const service = new FileSelectorService();

  describe('generateDocumentId', () => {
    it('should generate a valid UUID v4 format', () => {
      const id = service.generateDocumentId();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      expect(id).toMatch(uuidV4Regex);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 50 }, () => service.generateDocumentId()));
      expect(ids.size).toBe(50);
    });
  });

  describe('onFileSelected', () => {
    it('should create metadata for a PDF file', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const metadata = await service.onFileSelected(file);

      expect(metadata.filename).toBe('test.pdf');
      expect(metadata.mimeType).toBe('application/pdf');
      expect(metadata.sizeBytes).toBe(7); // "content" = 7 bytes
      expect(metadata.status).toBe('selected');
      expect(metadata.documentId).toBeTruthy();
      expect(metadata.createdAt).toBeGreaterThan(0);
    });

    it('should create metadata for a TXT file', async () => {
      const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
      const metadata = await service.onFileSelected(file);

      expect(metadata.filename).toBe('notes.txt');
      expect(metadata.mimeType).toBe('text/plain');
      expect(metadata.sizeBytes).toBe(5);
      expect(metadata.status).toBe('selected');
    });

    it('should create metadata for a DOCX file', async () => {
      const file = new File(['data'], 'report.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const metadata = await service.onFileSelected(file);

      expect(metadata.filename).toBe('report.docx');
      expect(metadata.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
  });
});
