import { createContext, useContext, useState, useRef, type ReactNode } from "react";

// --- Types partagés ---

export interface ScannedDocument {
  id: number;
  name: string;
  type: string;
  size: string;
  scannedAt: string;
  entityCount: number;
  categories: string[];
  status: "scanning" | "clean" | "pii-found";
  texteOriginal?: string;
  detectionResult?: import("@/hooks/usePIIDetector").DetectionResult | null;
}

interface DocumentContextType {
  documents: ScannedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<ScannedDocument[]>>;
  nextId: React.MutableRefObject<number>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const nextId = useRef(1);

  return (
    <DocumentContext.Provider value={{ documents, setDocuments, nextId }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentProvider");
  return ctx;
};