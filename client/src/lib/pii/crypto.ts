// ============================================================
// crypto.ts — chiffrement et déchiffrement de la carte de tokens
//
// Responsabilité : étant donné une carte de tokens et le JWT
// de l'utilisateur, produire un blob chiffré (et l'inverser).
//
// Utilise uniquement l'API WebCrypto (window.crypto.subtle) —
// intégrée dans tous les navigateurs modernes, aucune dépendance.
//
// Deux primitives cryptographiques :
//   PBKDF2  → dérive une clé AES solide à partir du JWT
//   AES-GCM → chiffre/déchiffre la carte de tokens avec cette clé
// ============================================================

import { CarteTokensChiffree } from './types';

// ---------------------
// Interne : dérivation de clé
// ---------------------

/**
 * Dérive une clé AES-GCM 256 bits à partir du JWT de l'utilisateur et d'un sel aléatoire.
 *
 * Pourquoi PBKDF2 ? Le JWT n'est pas une clé — c'est une chaîne de caractères
 * avec une entropie variable. PBKDF2 la "transforme" en une vraie clé cryptographique.
 * Le sel garantit que le même JWT produit une clé différente à chaque fois,
 * donc deux documents chiffrés avec le même JWT ne peuvent pas être comparés entre eux.
 *
 * @param jwt - le JWT de l'utilisateur (utilisé comme mot de passe)
 * @param sel - 16 octets aléatoires (générés au moment du chiffrement, stockés avec le texte chiffré)
 */
async function dériverClé(jwt: string, sel: Uint8Array): Promise<CryptoKey> {
  // Étape 1 : importer le JWT comme matériau de clé brut
  const materiau = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(jwt),
    { name: 'PBKDF2' },
    false,          // non extractible — le matériau brut ne quitte jamais le moteur crypto
    ['deriveKey']
  );

  // Étape 2 : dériver la clé AES-GCM réelle à partir de ce matériau
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: sel,
      iterations: 100_000, // 100 000 itérations rendent la force brute très coûteuse
      hash: 'SHA-256',
    },
    materiau,
    { name: 'AES-GCM', length: 256 }, // clé AES 256 bits
    false,          // non extractible — la clé dérivée ne quitte jamais le moteur crypto
    ['encrypt', 'decrypt']
  );
}

// ---------------------
// API publique
// ---------------------

/**
 * Chiffre la carte de tokens avec le JWT de l'utilisateur.
 *
 * Appelé par : tokenizer.ts, après avoir construit la carte de tokens.
 * La sortie va vers : le Bloc 3 (sauvegarderTableTokens).
 *
 * @param carteTokens - objet simple ex: { PII_001: "Jean Dupont", PII_002: "jean@gmail.com" }
 * @param jwt         - le JWT actuel de l'utilisateur connecté
 * @returns           - { texteCiphere, iv, sel } — les trois sont nécessaires pour déchiffrer
 */
export async function chiffrerCarteTokens(
  carteTokens: Record<string, string>,
  jwt: string
): Promise<CarteTokensChiffree> {
  // Générer un sel et un IV aléatoires — nouvelles valeurs à chaque fois, même document
  const sel = crypto.getRandomValues(new Uint8Array(16)); // 16 octets pour PBKDF2
  const iv  = crypto.getRandomValues(new Uint8Array(12)); // 12 octets pour AES-GCM

  const cle = await dériverClé(jwt, sel);

  // Sérialiser la carte de tokens en octets avant de chiffrer
  const texteClair = new TextEncoder().encode(JSON.stringify(carteTokens));

  const texteCiphere = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cle,
    texteClair
  );

  return { texteCiphere, iv, sel };
}

/**
 * Déchiffre la carte de tokens avec le JWT de l'utilisateur.
 *
 * Appelé par : le gestionnaire de réponse, après chargement depuis le Bloc 3,
 * pour récupérer { PII_001: "Jean Dupont", ... } et remplacer les tokens dans la réponse du LLM.
 *
 * @param chiffre - l'objet { texteCiphere, iv, sel } chargé depuis IndexedDB
 * @param jwt     - le JWT actuel de l'utilisateur (doit être le même que celui utilisé pour chiffrer)
 * @returns       - la carte de tokens originale sous forme d'objet simple
 */
export async function déchiffrerCarteTokens(
  chiffre: CarteTokensChiffree,
  jwt: string
): Promise<Record<string, string>> {
  const cle = await dériverClé(jwt, chiffre.sel);

  const texteClair = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: chiffre.iv },
    cle,
    chiffre.texteCiphere
  );

  return JSON.parse(new TextDecoder().decode(texteClair));
}
