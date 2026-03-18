import { useState, useCallback } from "react";
import { détecterPII, isModelLoaded, type EntitePII, type CarteTokensChiffree } from "@/lib/pii";
import { sauvegarderTableTokens } from "@/lib/pii";
import { traiterDocument } from "@/lib/pii";

// Re-export compatible types for PIIPreviewDialog
export interface PIIEntity {
  entity: string;
  score: number;
  word: string;
  start: number;
  end: number;
  index: number;
}

export type PIICategory = "PER" | "ORG" | "LOC" | "MISC" | string;

export interface DetectionResult {
  entities: PIIEntity[];
  anonymizedText: string;
  tokenMap: Map<string, string>;
  rawEntities: EntitePII[];
  chiffre?: CarteTokensChiffree;
}

interface UsePIIDetectorReturn {
  detect: (text: string, jwt?: string, backendDocId?: string) => Promise<DetectionResult>;
  isLoading: boolean;
  modelReady: boolean;
  loadProgress: number;
  lastResult: DetectionResult | null;
  preloadModel: () => Promise<void>;
  saveTokens: (backendDocId: string, customChiffre?: CarteTokensChiffree) => Promise<void>;
}

/** Convert new EntitePII[] to legacy format for PIIPreviewDialog */
function convertToLegacy(text: string, entites: EntitePII[]): DetectionResult {
  const entities: PIIEntity[] = entites.map((e, i) => ({
    entity: e.type,
    score: 1.0,
    word: e.valeur,
    start: e.debut,
    end: e.fin,
    index: i,
  }));

  // Build anonymized text and token map
  const tokenMap = new Map<string, string>();
  let anonymizedText = text;
  // Sort by position descending to replace from end
  const sorted = [...entites].sort((a, b) => b.debut - a.debut);
  for (const entite of sorted) {
    const token = `[[${entite.id}]]`;
    tokenMap.set(token, entite.valeur);
    anonymizedText =
      anonymizedText.slice(0, entite.debut) +
      token +
      anonymizedText.slice(entite.fin);
  }

  return { entities, anonymizedText, tokenMap, rawEntities: entites };
}

export function usePIIDetector(): UsePIIDetectorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [modelReady, setModelReady] = useState(isModelLoaded());
  const [loadProgress, setLoadProgress] = useState(0);
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);

  const preloadModel = useCallback(async () => {
    if (isModelLoaded()) { setModelReady(true); return; }
    setIsLoading(true);
    try {
      await détecterPII("test", (p) => setLoadProgress(p));
      setModelReady(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detect = useCallback(async (text: string, jwt?: string, backendDocId?: string) => {
    setIsLoading(true);
    try {
      const entites = await détecterPII(text, (p) => setLoadProgress(p), backendDocId);
      const result = convertToLegacy(text, entites);
      
      let tableToSave: CarteTokensChiffree | undefined;

      if (jwt) {
        // Generate the encrypted token table if we have a valid user token
        const piiResult = await traiterDocument(text, entites, jwt);
        result.chiffre = piiResult.chiffre;
        tableToSave = piiResult.chiffre;
      }
      
      if (backendDocId && tableToSave) {
        await sauvegarderTableTokens(backendDocId, tableToSave);
      }
      
      setLastResult(result);
      setModelReady(true);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTokens = useCallback(async (backendDocId: string, customChiffre?: CarteTokensChiffree) => {
    const tableToSave = customChiffre || lastResult?.chiffre;
    if (!tableToSave) {
      console.warn("No token table available to save");
      return;
    }
    await sauvegarderTableTokens(backendDocId, tableToSave);
  }, [lastResult]);

  return { detect, isLoading, modelReady, loadProgress, lastResult, preloadModel, saveTokens };
}
