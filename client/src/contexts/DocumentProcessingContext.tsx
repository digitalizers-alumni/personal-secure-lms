/**
 * DocumentProcessingContext - React Context for document processing metadata
 * Implements MetadataStore interface using React Context API
 * User Story: US-050
 *
 * Note: This is separate from DocumentContext.tsx which manages
 * the UI-visible ScannedDocument list. This context tracks the
 * ingestion pipeline state (selection → validation → extraction).
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DocumentMetadata, DocumentStatus } from '@/types/document';
import { MetadataStore } from '@/interfaces/MetadataStore';

interface DocumentProcessingContextValue extends MetadataStore {
  documents: Map<string, DocumentMetadata>;
  currentDocument: DocumentMetadata | null;
}

const DocumentProcessingContext = createContext<DocumentProcessingContextValue | undefined>(undefined);

export const useDocumentProcessing = () => {
  const context = useContext(DocumentProcessingContext);
  if (!context) {
    throw new Error('useDocumentProcessing must be used within DocumentProcessingProvider');
  }
  return context;
};

interface DocumentProcessingProviderProps {
  children: ReactNode;
}

export const DocumentProcessingProvider: React.FC<DocumentProcessingProviderProps> = ({ children }) => {
  const [documents, setDocuments] = useState<Map<string, DocumentMetadata>>(new Map());
  const [currentDocument, setCurrentDocument] = useState<DocumentMetadata | null>(null);

  const create = (metadata: DocumentMetadata): void => {
    setDocuments((prev) => {
      const newMap = new Map(prev);
      newMap.set(metadata.documentId, metadata);
      return newMap;
    });
    setCurrentDocument(metadata);
  };

  const updateStatus = (
    documentId: string,
    status: DocumentStatus,
    errorMessage?: string
  ): void => {
    setDocuments((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(documentId);
      if (existing) {
        const updated: DocumentMetadata = {
          ...existing,
          status,
          errorMessage,
        };
        newMap.set(documentId, updated);

        // Update current document if it's the one being updated
        if (currentDocument?.documentId === documentId) {
          setCurrentDocument(updated);
        }
      }
      return newMap;
    });
  };

  const get = (documentId: string): DocumentMetadata | null => {
    return documents.get(documentId) || null;
  };

  const clear = (): void => {
    setDocuments(new Map());
    setCurrentDocument(null);
  };

  const value: DocumentProcessingContextValue = {
    documents,
    currentDocument,
    create,
    updateStatus,
    get,
    clear,
  };

  return (
    <DocumentProcessingContext.Provider value={value}>
      {children}
    </DocumentProcessingContext.Provider>
  );
};
