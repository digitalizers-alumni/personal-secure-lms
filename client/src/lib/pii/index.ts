// ============================================================
// index.ts — point d'entrée du module de protection PII
//
// Réexporte tout ce dont les autres parties de l'application
// ont besoin. Vos collègues n'importent que depuis ce fichier,
// sans avoir à savoir dans quel fichier se trouve chaque fonction.
//
// Utilisation dans un composant React :
//   import { détecterPII, traiterDocument, ... } from '@/lib/pii';
// ============================================================

// --- Extraction de texte (point d'entrée du pipeline) ---
// extraireTexte()     → convertit un fichier uploadé en texte brut
// ACCEPT_INPUT_FILE   → chaîne à passer à l'attribut "accept" du <input type="file">
export { extraireTexte, ACCEPT_INPUT_FILE, FORMATS_ACCEPTES } from './extracteur-texte';

// --- Types partagés ---
// À importer quand on veut typer une variable dans un composant
export type { EntitePII, CarteTokensChiffree, EnregistrementTableTokens } from './types';

// --- Bloc 1 : Détection PII ---
// détecterPII()    → à appeler dès qu'un document est uploadé
// isModelLoaded()  → vérifie si le modèle NER est déjà chargé (utile pour l'UI)
export { détecterPII, isModelLoaded } from './detecteur-pii';

// --- Presidio (optionnel) ---
// configurerPresidio()       → changer l'URL du serveur ou le seuil de confiance
// presidioEstDisponible()    → vérifier si le serveur Presidio répond
// détecterParPresidio()      → appeler Presidio directement (usage avancé)
export { configurerPresidio, presidioEstDisponible, détecterParPresidio } from './presidio-client';

// --- Bloc 2 : Tokenisation + Chiffrement ---
// traiterDocument()   → censure le texte et chiffre le mapping (après détection)
// restaurerRéponse()  → charge + déchiffre + restaure en un seul appel (à utiliser en priorité)
// restaurerDocument() → version bas niveau si on a déjà la carteTokens en main
export { traiterDocument, restaurerRéponse, restaurerDocument } from './tokenizer';
export type { DocumentTraite } from './tokenizer';

// --- Bloc 2 (crypto) : Déchiffrement ---
// déchiffrerCarteTokens() → à appeler entre chargerTableTokens() et restaurerDocument()
export { déchiffrerCarteTokens } from './crypto';

// --- Bloc 3 : Table locale de tokens (IndexedDB) ---
// sauvegarderTableTokens()      → après traiterDocument()
// chargerTableTokens()          → quand la réponse du LLM arrive
// supprimerTableTokens()        → quand l'utilisateur termine avec un document
// viderToutesLesTableTokens()   → à la déconnexion
export {
  sauvegarderTableTokens,
  chargerTableTokens,
  supprimerTableTokens,
  viderToutesLesTableTokens,
} from './token-table';
