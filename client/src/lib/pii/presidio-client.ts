// ============================================================
// presidio-client.ts — Client Presidio pour la détection PII
//
// Responsabilité : appeler le serveur Presidio (Python/FastAPI)
// et convertir les résultats au format EntitePII utilisé par
// le reste du pipeline.
//
// Le serveur Presidio apporte :
//   - Le modèle spaCy français (fr_core_news_lg) pour NER
//   - 18 reconnaisseurs personnalisés FR + CH (SECU, SIRET, AVS, IDE...)
//   - Le scoring contextuel de Presidio (mots autour de l'entité)
//
// Dépend de : types.ts (EntitePII)
// Utilisé par : detecteur-pii.ts (comme source de détection)
// ============================================================

import { EntitePII } from './types';

// ---------------------
// Configuration
// ---------------------

// URL par défaut du serveur Presidio local
// Peut être surchargée via configurerPresidio()
let PRESIDIO_URL = 'http://localhost:5002';

// Seuil de confiance minimum — les entités en dessous sont ignorées
let SCORE_THRESHOLD = 0.4;

// Timeout pour l'appel API (en ms) — évite de bloquer le pipeline si le serveur est lent
let TIMEOUT_MS = 15_000;

/**
 * Permet de configurer l'URL du serveur Presidio et le seuil de confiance.
 * À appeler au démarrage de l'application si les valeurs par défaut ne conviennent pas.
 */
export function configurerPresidio(options: {
  url?: string;
  scoreThreshold?: number;
  timeoutMs?: number;
}): void {
  if (options.url) PRESIDIO_URL = options.url;
  if (options.scoreThreshold !== undefined) SCORE_THRESHOLD = options.scoreThreshold;
  if (options.timeoutMs !== undefined) TIMEOUT_MS = options.timeoutMs;
}

// ---------------------
// Mapping des types d'entités
// ---------------------

// Presidio utilise ses propres noms d'entités (PERSON, LOCATION, etc.)
// et nos reconnaisseurs français utilisent FR_SECU, FR_IBAN, etc.
// Cette table les convertit vers les types utilisés par le reste du pipeline.
const MAPPING_TYPES: Record<string, string> = {
  // Entités standard de Presidio (spaCy NER)
  PERSON: 'PER',
  LOCATION: 'LOC',
  ORGANIZATION: 'ORG',
  NRP: 'MISC',         // Nationalité, religion, orientation politique
  DATE_TIME: 'DATE',
  EMAIL_ADDRESS: 'EMAIL',
  PHONE_NUMBER: 'TELEPHONE',
  IBAN_CODE: 'IBAN',
  IP_ADDRESS: 'ADRESSE_IP',
  URL: 'URL',

  // Entités françaises personnalisées (nos reconnaisseurs)
  FR_SECU: 'SECU',
  FR_SIRET_SIREN: 'SIRET_SIREN',
  FR_IBAN: 'IBAN',
  FR_TELEPHONE: 'TELEPHONE',
  FR_CODE_POSTAL: 'CODE_POSTAL',
  FR_ADRESSE: 'ADRESSE',
  FR_URSSAF: 'URSSAF',
  FR_MUTUELLE: 'MUTUELLE',
  FR_CNI: 'CNI',
  FR_DATE_NAISSANCE: 'DATE_NAISSANCE',
  FR_MONTANT: 'MONTANT',
  FR_REFERENCE: 'REFERENCE',

  // Entités suisses personnalisées
  CH_AVS: 'AVS',
  CH_IBAN: 'IBAN',
  CH_TELEPHONE: 'TELEPHONE',
  CH_NPA: 'CODE_POSTAL',
  CH_IDE: 'IDE',
  CH_MONTANT: 'MONTANT',
};

/**
 * Convertit un type d'entité Presidio vers le type utilisé dans notre pipeline.
 * Si le type n'est pas dans la table, il est retourné tel quel.
 */
function convertirType(typePresidio: string): string {
  return MAPPING_TYPES[typePresidio] ?? typePresidio;
}

// ---------------------
// Types pour la réponse API
// ---------------------

interface PresidioEntity {
  entity_type: string;
  start: number;
  end: number;
  score: number;
  text: string;
}

// ---------------------
// API publique
// ---------------------

/**
 * Vérifie si le serveur Presidio est accessible.
 * Utile pour décider si on utilise Presidio ou seulement NER + regex.
 *
 * @returns true si le serveur répond, false sinon
 */
export async function presidioEstDisponible(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${PRESIDIO_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Détecte les PII dans un texte via le serveur Presidio.
 *
 * Retourne les entités au format Omit<EntitePII, 'id'> — les IDs sont
 * attribués plus tard par detecteur-pii.ts lors de la fusion des résultats.
 *
 * @param texte    - le texte complet à analyser
 * @param langue   - code langue (défaut : "fr")
 * @returns        - tableau d'entités détectées, ou tableau vide si le serveur est inaccessible
 */
export async function détecterParPresidio(
  texte: string,
  langue: string = 'fr'
): Promise<Omit<EntitePII, 'id'>[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${PRESIDIO_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: texte,
        language: langue,
        score_threshold: SCORE_THRESHOLD,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      console.warn(`[Presidio] Erreur ${response.status} : ${response.statusText}`);
      return [];
    }

    const entities: PresidioEntity[] = await response.json();

    return entities.map((e) => ({
      valeur: e.text,
      debut: e.start,
      fin: e.end,
      type: convertirType(e.entity_type),
    }));
  } catch (err) {
    // Le serveur Presidio n'est pas critique — si indisponible, on continue
    // avec les détections NER locale + regex uniquement
    console.warn('[Presidio] Serveur inaccessible, détection Presidio ignorée.', err);
    return [];
  }
}
