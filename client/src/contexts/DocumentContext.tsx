import { createContext, useContext, useState, useRef, useEffect, type ReactNode, useCallback } from "react";
import { listDocuments } from "@/lib/api";
import { chargerTableTokens, déchiffrerCarteTokens, sauvegarderTableTokens } from "@/lib/pii";

// --- Types partagés ---

export interface ScannedDocument {
  id: number;
  documentId?: string;  // UUID used as IndexedDB key for PII token table
  name: string;
  type: string;
  size: string;
  scannedAt: string;
  entityCount: number;
  categories: string[];
  status: "scanning" | "clean" | "pii-found";
  texteOriginal?: string;
  detectionResult?: any;
  backendDocId?: number;
  indexStatus?: "pending" | "processing" | "indexed" | "failed";
  backendError?: string;
}

interface DocumentContextType {
  documents: ScannedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<ScannedDocument[]>>;
  nextId: React.MutableRefObject<number>;
  refreshDocuments: () => Promise<void>;
  isLoading: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const nextId = useRef(1);

  const refreshDocuments = useCallback(async () => {
    const token = localStorage.getItem("lumina_token");
    if (!token) return;

    setIsLoading(true);
    try {
      const backendDocs = await listDocuments();
      
      // Use Promise.all to fetch metadata from IndexedDB for each document in parallel
      const mapped: ScannedDocument[] = await Promise.all(
        backendDocs.map(async (doc: any) => {
          let localTokens = await chargerTableTokens(doc.doc_id.toString());
          
          // Retroactive fix: If tokens exist but metadata (count/categories) is missing,
          // try to decrypt and restore the metadata once.
          if (localTokens && localTokens.entityCount === undefined) {
            try {
              const decryptedMap = await déchiffrerCarteTokens(localTokens, token);
              const entities = Object.keys(decryptedMap);
              localTokens.entityCount = entities.length;
              // We don't have categories here easily without the raw entities, 
              // but we can at least restore the count and 'pii-found' status.
              localTokens.categories = []; 
              
              // Persist the restored metadata back to IndexedDB
              await sauvegarderTableTokens(
                doc.doc_id.toString(), 
                localTokens, 
                localTokens.entityCount, 
                localTokens.categories
              );
            } catch (decryptionError) {
              console.warn(`Could not retroactively restore PII metadata for doc ${doc.doc_id}:`, decryptionError);
            }
          }

          const hasPii = localTokens && (localTokens.entityCount || 0) > 0;
          
          return {
            id: doc.doc_id,
            backendDocId: doc.doc_id,
            name: doc.filename,
            type: doc.filename.split(".").pop()?.toUpperCase() || "TXT",
            size: doc.metadata_json?.size_bytes 
              ? (doc.metadata_json.size_bytes < 1024 * 1024 
                  ? (doc.metadata_json.size_bytes / 1024).toFixed(0) + " KB" 
                  : (doc.metadata_json.size_bytes / (1024 * 1024)).toFixed(1) + " MB")
              : "0 KB",
            scannedAt: new Date(doc.created_at).toLocaleString("fr-CH"),
            entityCount: localTokens?.entityCount || 0,
            categories: localTokens?.categories || [],
            status: hasPii ? "pii-found" : "clean",
            indexStatus: (doc.status === "pending" || doc.status === "processing") ? "pending" : (doc.status as any)
          };
        })
      );
      
      setDocuments(mapped);
      
      // Update nextId to prevent collisions if new ones are added
      const maxId = mapped.reduce((max, d) => Math.max(max, d.id), 0);
      nextId.current = maxId + 1;
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  return (
    <DocumentContext.Provider value={{ documents, setDocuments, nextId, refreshDocuments, isLoading }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentProvider");
  return ctx;
};