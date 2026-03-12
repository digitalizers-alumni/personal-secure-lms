// ============================================================
// table-tokens.ts — Bloc 3 : Table locale de tokens (IndexedDB)
//
// Responsabilité : sauvegarder et récupérer la carte de tokens
// chiffrée dans la base de données locale du navigateur.
// Rien ici ne quitte jamais l'appareil de l'utilisateur.
//
// Dépend de : idb (npm install idb)
// Utilisé par : le Bloc 2 (chiffrer → sauvegarder)
//               et le gestionnaire de réponse (charger → déchiffrer)
// ============================================================

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { EnregistrementTableTokens, CarteTokensChiffree } from './types';

// ---------------------
// Configuration de la base de données
// ---------------------

const NOM_BDD = 'pii-privacy';       // nom de la base IndexedDB
const VERSION_BDD = 1;                // à incrémenter si on change le schéma
const NOM_STORE = 'table-tokens' as const;

// Définition du schéma — indique à la bibliothèque idb la structure de la base.
// La clé de chaque enregistrement est le champ documentId.
interface PIIPrivacyDB extends DBSchema {
  'table-tokens': {
    key: string;                      // documentId
    value: EnregistrementTableTokens;
  };
}

// ---------------------
// Interne : ouverture de la base
// ---------------------

// Ouvre (ou crée) la base de données IndexedDB.
// Le callback `upgrade` ne s'exécute qu'à la première création ou lors d'un changement de version.
async function ouvrirBaseDeDonnees(): Promise<IDBPDatabase<PIIPrivacyDB>> {
  return openDB<PIIPrivacyDB>(NOM_BDD, VERSION_BDD, {
    upgrade(db) {
      // keyPath: 'documentId' signifie qu'IndexedDB utilise automatiquement
      // le champ documentId comme clé de chaque enregistrement
      db.createObjectStore(NOM_STORE, { keyPath: 'documentId' });
    },
  });
}

// ---------------------
// API publique
// ---------------------

/**
 * Sauvegarde la carte de tokens chiffrée pour un document.
 * Si un enregistrement existe déjà pour ce documentId, il est écrasé (db.put).
 *
 * Appelé par : le Bloc 2, juste après avoir chiffré la carte de tokens.
 *
 * @param documentId - identifiant unique du document (ex: un UUID généré à l'upload)
 * @param chiffre    - l'objet { texteCiphere, iv, sel } produit par le Bloc 2
 */
export async function sauvegarderTableTokens(
  documentId: string,
  chiffre: CarteTokensChiffree
): Promise<void> {
  const db = await ouvrirBaseDeDonnees();

  await db.put(NOM_STORE, {
    documentId,
    texteCiphere: chiffre.texteCiphere,
    iv: chiffre.iv,
    sel: chiffre.sel,
    creeA: new Date(),
  });
}

/**
 * Charge la carte de tokens chiffrée pour un document.
 * Retourne undefined si aucun enregistrement n'existe pour ce documentId.
 *
 * Appelé par : le gestionnaire de réponse, après l'arrivée de la réponse du LLM,
 * pour déchiffrer et remplacer les tokens par les vraies valeurs PII.
 *
 * @param documentId - le même identifiant utilisé lors de la sauvegarde
 */
export async function chargerTableTokens(
  documentId: string
): Promise<EnregistrementTableTokens | undefined> {
  const db = await ouvrirBaseDeDonnees();
  return db.get(NOM_STORE, documentId);
}

/**
 * Supprime la carte de tokens d'un document.
 * À appeler quand l'utilisateur a terminé avec un document.
 * Bonne pratique : ne pas laisser les mappings PII plus longtemps que nécessaire.
 *
 * @param documentId - l'identifiant du document à nettoyer
 */
export async function supprimerTableTokens(documentId: string): Promise<void> {
  const db = await ouvrirBaseDeDonnees();
  await db.delete(NOM_STORE, documentId);
}

/**
 * Supprime TOUTES les tables de tokens de la base.
 * À appeler lors de la déconnexion pour s'assurer qu'aucun mapping PII ne subsiste.
 */
export async function viderToutesLesTableTokens(): Promise<void> {
  const db = await ouvrirBaseDeDonnees();
  await db.clear(NOM_STORE);
}
