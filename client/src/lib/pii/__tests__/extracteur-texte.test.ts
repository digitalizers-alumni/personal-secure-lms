import { describe, it, expect, vi } from 'vitest';

// pdfjs-dist requires DOMMatrix which doesn't exist in jsdom
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '' }));

import { FORMATS_ACCEPTES, ACCEPT_INPUT_FILE } from '../extracteur-texte';

describe('extracteur-texte (format config)', () => {
  it('should only support PDF, DOCX, and TXT', () => {
    expect(FORMATS_ACCEPTES).toEqual(['.pdf', '.docx', '.txt']);
  });

  it('should NOT include xlsx, pptx, csv, or md', () => {
    const formats = [...FORMATS_ACCEPTES];
    expect(formats).not.toContain('.xlsx');
    expect(formats).not.toContain('.pptx');
    expect(formats).not.toContain('.csv');
    expect(formats).not.toContain('.md');
  });

  it('ACCEPT_INPUT_FILE should be a comma-separated string for <input accept>', () => {
    expect(ACCEPT_INPUT_FILE).toBe('.pdf,.docx,.txt');
  });
});
