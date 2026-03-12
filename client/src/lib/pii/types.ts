// ============================================================
// types.ts — types partagés entre les trois blocs
//
// Ce fichier définit la forme des données qui circulent
// dans tout le pipeline. Chaque bloc utilise ces types
// pour s'assurer qu'ils parlent tous le même langage.
// ============================================================

// Une entité PII détectée par le modèle NER (sortie du Bloc 1)
export interface EntitePII {
  id: string;       // identifiant unique du token, ex: "PII_001"
  valeur: string;   // le texte PII réel, ex: "Jean Dupont"
  debut: number;    // position du premier caractère dans le texte original
  fin: number;      // position du dernier caractère dans le texte original
  type: string;     // catégorie de l'entité : "PER", "LOC", "ORG", "EMAIL", etc.
}

// Le blob chiffré que le Bloc 2 produit et que le Bloc 3 stocke.
// Les trois champs sont nécessaires ensemble pour déchiffrer — ne jamais les séparer.
export interface CarteTokensChiffree {
  texteCiphere: ArrayBuffer; // le JSON chiffré de { PII_001: "Jean Dupont", ... }
  iv: Uint8Array;            // vecteur d'initialisation AES-GCM (12 octets aléatoires, non secret)
  sel: Uint8Array;           // sel PBKDF2 (16 octets aléatoires, non secret)
}

// Ce qui est stocké dans IndexedDB pour chaque document
export interface EnregistrementTableTokens extends CarteTokensChiffree {
  documentId: string; // identifiant unique du document (relie l'enregistrement au bon document)
  creeA: Date;        // date de création — utile pour nettoyer les anciens enregistrements
}
