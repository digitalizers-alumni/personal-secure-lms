// ============================================================
// tokenizer.ts — Bloc 2 : Tokenisation + Chiffrement + Censure
//
// Responsabilité :
//   1. Remplacer les entités PII du texte par des tokens [[PII_001]]
//   2. Chiffrer le mapping { PII_001: "Jean Dupont" } avec le JWT
//   3. Retourner le texte censuré (→ serveur) et le blob chiffré (→ Bloc 3)
//
// Dépend de : crypto.ts (chiffrement), types.ts (types partagés)
// Reçoit du  : Bloc 1 (liste d'EntitePII + texte brut)
// Transmet à : Bloc 3 (sauvegarderTableTokens) et l'appel API
// ============================================================

import { chiffrerCarteTokens, déchiffrerCarteTokens } from './crypto';
import { chargerTableTokens } from './token-table';
import { EntitePII, CarteTokensChiffree } from './types';

// ---------------------
// Interne : censure du texte
// ---------------------

/**
 * Remplace les entités PII détectées dans le texte par des tokens placeholder.
 *
 * IMPORTANT : les entités sont traitées en ordre INVERSE (de la fin vers le début).
 * Pourquoi ? Remplacer une entité décale les positions de tout ce qui suit.
 * En partant de la fin, les positions du début restent valides.
 *
 * Exemple :
 *   texte  : "Bonjour Jean Dupont, ton email est jean@gmail.com"
 *   entités: [{ id: "PII_001", debut: 8, fin: 19 }, { id: "PII_002", debut: 35, fin: 49 }]
 *   résultat: "Bonjour [[PII_001]], ton email est [[PII_002]]"
 *
 * @param texte   - le texte brut original du document
 * @param entites - entités PII du Bloc 1, chacune avec les positions debut/fin
 * @returns       - { texteCensure, carteTokens }
 */
function censurerDocument(
  texte: string,
  entites: EntitePII[]
): { texteCensure: string; carteTokens: Record<string, string> } {
  // Construire la carte de tokens : { PII_001: "Jean Dupont", PII_002: "jean@gmail.com" }
  const carteTokens: Record<string, string> = {};
  for (const entite of entites) {
    carteTokens[entite.id] = entite.valeur;
  }

  // Trier les entités par position de début décroissante (dernière entité en premier)
  const entitesTriees = [...entites].sort((a, b) => b.debut - a.debut);

  // Remplacer chaque entité par son token placeholder, de la fin vers le début
  let texteCensure = texte;
  for (const entite of entitesTriees) {
    const placeholder = `[[${entite.id}]]`;
    texteCensure =
      texteCensure.slice(0, entite.debut) +
      placeholder +
      texteCensure.slice(entite.fin);
  }

  return { texteCensure, carteTokens };
}

// ---------------------
// API publique
// ---------------------

// Le résultat du traitement d'un document par le Bloc 2
export interface DocumentTraite {
  texteCensure: string;         // à envoyer au serveur (sans aucune PII)
  chiffre: CarteTokensChiffree; // à sauvegarder dans le Bloc 3 (IndexedDB)
}

/**
 * Pipeline complet du Bloc 2 : censurer le document et chiffrer la carte de tokens.
 *
 * Utilisation :
 *   const { texteCensure, chiffre } = await traiterDocument(texte, entites, jwt);
 *   await sauvegarderTableTokens(documentId, chiffre); // Bloc 3
 *   envoyerAuServeur(documentId, texteCensure);         // appel API
 *
 * @param texte   - texte brut du document uploadé
 * @param entites - entités PII détectées par le Bloc 1
 * @param jwt     - JWT actuel de l'utilisateur (source de la clé de chiffrement)
 */
export async function traiterDocument(
  texte: string,
  entites: EntitePII[],
  jwt: string
): Promise<DocumentTraite> {
  // Étape 1 : remplacer les PII par des tokens dans le texte
  const { texteCensure, carteTokens } = censurerDocument(texte, entites);

  // Étape 2 : chiffrer la carte de tokens pour un stockage local sécurisé
  const chiffre = await chiffrerCarteTokens(carteTokens, jwt);

  return { texteCensure, chiffre };
}

/**
 * Restaure les vraies valeurs PII dans la réponse du LLM en remplaçant les tokens.
 *
 * Appelé après : déchiffrerCarteTokens (crypto.ts) qui retourne la carte de tokens.
 * But : la réponse du serveur peut contenir [[PII_001]] — cette fonction les remplace
 * par les vraies valeurs avant d'afficher le texte à l'utilisateur.
 *
 * @param texte       - texte de la réponse du LLM contenant des tokens [[PII_XXX]]
 * @param carteTokens - carte déchiffrée depuis crypto.ts : { PII_001: "Jean Dupont", ... }
 * @returns           - la réponse avec les vraies valeurs PII restaurées
 */
/**
 * Pipeline complet de restauration : charge, déchiffre, et restaure en un seul appel.
 *
 * Raccourci pour les 3 étapes qui vont toujours ensemble :
 *   chargerTableTokens() → déchiffrerCarteTokens() → restaurerDocument()
 *
 * Appelé par : le composant qui affiche la réponse du LLM à l'utilisateur.
 *
 * @param documentId  - l'identifiant du document source
 * @param texte       - la réponse du LLM contenant des tokens [[PII_XXX]]
 * @param jwt         - le JWT actuel de l'utilisateur
 * @returns           - la réponse avec les vraies valeurs PII restaurées,
 *                      ou le texte original si aucune table n'existe pour ce document
 */
export async function restaurerRéponse(
  documentId: string,
  texte: string,
  jwt: string
): Promise<string> {
  const enregistrement = await chargerTableTokens(documentId);

  // Si aucune table n'existe (ex: cache vidé), retourner le texte tel quel
  if (!enregistrement) return texte;

  const carteTokens = await déchiffrerCarteTokens(enregistrement, jwt);
  return restaurerDocument(texte, carteTokens);
}

export function restaurerDocument(
  texte: string,
  carteTokens: Record<string, string>
): string {
  let texteRestaure = texte;

  for (const [id, valeur] of Object.entries(carteTokens)) {
    // Remplacer toutes les occurrences de [[PII_001]] par la vraie valeur
    texteRestaure = texteRestaure.replaceAll(`[[${id}]]`, valeur);
  }

  return texteRestaure;
}
