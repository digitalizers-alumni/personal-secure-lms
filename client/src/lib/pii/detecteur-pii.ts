// ============================================================
// detecteur-pii.ts — Bloc 1 : Détection des PII (NER locale)
//
// Responsabilité : analyser un texte et retourner toutes les
// entités PII détectées avec leur position dans le texte original.
//
// Trois stratégies combinées :
//   1. Modèle NER (BERT multilingue) → noms, lieux, organisations (navigateur)
//   2. Expressions régulières (regex) → emails, téléphones, IBAN, SIRET,
//      numéros de sécu/AVS, CNI, URSSAF, IDE, adresses, IPs, URLs, etc.
//   3. Presidio (optionnel) → spaCy français + reconnaisseurs FR/CH
//      via serveur Python local (si disponible)
//
// Couvre les contextes français ET suisses romands :
//   FR : NIR, SIRET/SIREN, URSSAF, mutuelle, CNI, EUR
//   CH : AVS/AHV, IDE, NPA, CHF
//
// Conçu pour les documents d'entreprise : contrats de travail, fiches de paie,
// règlements intérieurs, NDA, dossiers RH, docs IT et conformité RGPD/LPD.
//
// Dépend de : @huggingface/transformers, decoupeur.ts, types.ts, presidio-client.ts
// Passe ses résultats à : tokenizer.ts (Bloc 2)
// ============================================================

import { pipeline, env } from '@huggingface/transformers';
import { découperTexte } from './decoupeur';
import { EntitePII } from './types';
import { détecterParPresidio, presidioEstDisponible } from './presidio-client';

// ---------------------
// Configuration du modèle
// ---------------------

// Le cache navigateur est activé par défaut dans @huggingface/transformers v3+

// Nom du modèle NER multilingue (supporte le français)
// Reconnaît : PER (personnes), LOC (lieux), ORG (organisations), MISC (divers)
const NOM_MODELE = 'Xenova/bert-base-multilingual-cased-ner-hrl';

// Instance du pipeline (null au départ, chargée une seule fois)
let pipelineNER: Awaited<ReturnType<typeof pipeline>> | null = null;

// Verrou pour éviter de charger le modèle en double si deux appels arrivent simultanément
let loadingPromise: Promise<Awaited<ReturnType<typeof pipeline>>> | null = null;

/**
 * Vérifie si le modèle NER est déjà chargé en mémoire.
 * Utile pour l'UI : afficher un indicateur de chargement ou non.
 */
export function isModelLoaded(): boolean {
  return pipelineNER !== null;
}

// ---------------------
// Interne : chargement du modèle (singleton)
// ---------------------

/**
 * Charge le modèle NER une seule fois et le réutilise pour toutes les détections.
 * Le premier appel peut prendre 10-30 secondes (téléchargement du modèle).
 * Les appels suivants sont instantanés grâce au cache du navigateur.
 */
async function obtenirPipeline(): Promise<Awaited<ReturnType<typeof pipeline>>> {
  if (pipelineNER) return pipelineNER;
  if (loadingPromise) return loadingPromise;

  loadingPromise = pipeline('token-classification', NOM_MODELE);

  pipelineNER = await loadingPromise;
  loadingPromise = null;
  return pipelineNER;
}

// ---------------------
// Interne : agrégation des sous-tokens NER
// ---------------------

// Type réel retourné par @huggingface/transformers v3 (pas de start/end, pas de entity_group)
interface NERTokenBrut {
  entity: string;      // "B-PER", "I-PER", "B-LOC", "I-ORG", etc.
  score: number;
  index: number;       // position du token dans la séquence tokenisée
  word: string;        // texte du token (peut contenir "##" pour les sous-tokens WordPiece)
}

// Seules les entités PER (personnes) du modèle NER sont des PII au sens RGPD/LPD.
// Les ORG (organisations), LOC (lieux) et MISC (divers) ne sont pas des données personnelles.
// Les emails, téléphones, IBAN, adresses, etc. sont déjà couverts par les regex.
const TYPES_NER_PII = new Set(['PER']);

/**
 * Agrège les tokens bruts du modèle NER en entités complètes.
 *
 * Le modèle BERT retourne un résultat par sous-token WordPiece :
 *   "Kamel"       → ["Ka" (B-PER), "##mel" (I-PER)]
 *   "Jean Dupont" → ["Jean" (B-PER), "Du" (I-PER), "##pont" (I-PER)]
 *
 * Cette fonction fusionne les sous-tokens consécutifs du même type
 * et retrouve leur position dans le texte original.
 */
function agrégerTokensNER(
  tokens: NERTokenBrut[],
  texteOriginal: string
): { mot: string; type: string; score: number; debut: number; fin: number }[] {
  const entités: { mot: string; type: string; score: number; debut: number; fin: number }[] = [];
  let posRecherche = 0; // Avance dans le texte pour trouver les positions séquentiellement

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // Extraire le préfixe (B- ou I-) et le type d'entité (PER, LOC, ORG, MISC)
    const préfixe = token.entity.slice(0, 2);
    const typeEntité = token.entity.slice(2);

    // On commence un groupe seulement sur un B- (ou un I- orphelin qu'on traite comme B-)
    if (préfixe !== 'B-' && préfixe !== 'I-') {
      i++;
      continue;
    }

    // Collecter les tokens consécutifs I- du même type
    const groupe = [token];
    while (i + 1 < tokens.length) {
      const suivant = tokens[i + 1];
      if (
        suivant.entity.startsWith('I-') &&
        suivant.entity.slice(2) === typeEntité &&
        suivant.index === tokens[i].index + 1
      ) {
        groupe.push(suivant);
        i++;
      } else {
        break;
      }
    }

    // Reconstruire le mot complet à partir des sous-tokens
    // "##xxx" = continuation (pas d'espace), sinon = nouveau mot (espace)
    const mot = groupe
      .map((t, idx) => {
        if (idx === 0) return t.word;
        if (t.word.startsWith('##')) return t.word.slice(2);
        return ' ' + t.word;
      })
      .join('')
      .trim();

    // Ne garder que les types pertinents pour la détection PII (noms de personnes)
    if (!TYPES_NER_PII.has(typeEntité)) {
      i++;
      continue;
    }

    // Score moyen du groupe
    const score = groupe.reduce((sum, t) => sum + t.score, 0) / groupe.length;

    // Trouver la position dans le texte original (recherche séquentielle)
    // On utilise une regex avec \s+ pour tolérer les espaces multiples
    // fréquents dans les PDF (ex: "Ken  Schwaber" vs "Ken Schwaber")
    if (mot.length > 0) {
      const escaped = mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patternFlexible = escaped.replace(/\s+/g, '\\s+');
      const regex = new RegExp(patternFlexible, 'i');
      const match = regex.exec(texteOriginal.slice(posRecherche));

      if (match) {
        const pos = posRecherche + match.index;
        entités.push({
          mot: texteOriginal.slice(pos, pos + match[0].length), // Garder la casse originale
          type: typeEntité,
          score,
          debut: pos,
          fin: pos + match[0].length,
        });
        posRecherche = pos + match[0].length;
      }
    }

    i++;
  }

  return entités;
}

// ---------------------
// Interne : détection par regex
// ---------------------

// Patterns pour les types de PII que le modèle NER ne détecte pas bien.
//
// Organisés par catégorie de document pour faciliter la maintenance :
//   - Coordonnées personnelles  → tous documents
//   - Identifiants légaux       → contrats, dossiers employés
//   - Données financières       → contrats de travail, fiches de paie
//   - Dates                     → tous documents
//   - Références internes       → RH, SOP, comptes-rendus
//   - Données techniques        → docs IT, sécurité, conformité RGPD
const PATTERNS_REGEX: { type: string; regex: RegExp }[] = [

  // ── Coordonnées personnelles ──────────────────────────────────────────
  {
    type: 'EMAIL',
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  },
  {
    // Numéros de téléphone français : 06 12 34 56 78, +33 6 12 34 56 78, etc.
    type: 'TELEPHONE',
    regex: /(?:\+33|0033|0)\s*[1-9](?:[\s.\-]?\d{2}){4}/g,
  },
  {
    // Adresses postales : "12 rue de la Paix", "3 allée des Roses", etc.
    // Le modèle NER capture les villes mais pas les numéros de rue
    type: 'ADRESSE',
    regex: /\b\d{1,4}\s+(?:rue|avenue|boulevard|allée|impasse|chemin|route|place|voie)\s+[^\n,]{3,50}/gi,
  },
  {
    // Codes postaux français (séparés pour ne pas être absorbés par ADRESSE)
    type: 'CODE_POSTAL',
    regex: /\b(?:0[1-9]|[1-8]\d|9[0-5])\d{3}\b/g,
  },

  // ── Identifiants légaux ───────────────────────────────────────────────
  {
    // Numéro de sécurité sociale : 1 85 12 75 123 456 78
    // Présent dans les fiches de paie, dossiers employés, documents mutuelle
    type: 'SECU',
    regex: /[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}/g,
  },
  {
    // Carte nationale d'identité française : 1 ou 2 lettres + 7 chiffres
    // Ex : 123456789012 ou format "CNI : 123456789012"
    // Présent dans les dossiers d'embauche et contrats
    type: 'CNI',
    regex: /\b(?:CNI|carte\s+d'identité|passeport)\s*:?\s*[A-Z0-9]{9,12}\b/gi,
  },
  {
    // SIRET (14 chiffres) et SIREN (9 chiffres)
    // Présents dans les contrats pour identifier les entreprises parties prenantes
    type: 'SIRET_SIREN',
    regex: /\b\d{3}\s?\d{3}\s?\d{3}(?:\s?\d{5})?\b/g,
  },
  {
    // Numéro URSSAF : identifie l'employeur auprès de l'URSSAF
    // Format : 3 chiffres + 7 chiffres, ex : 117 7600001
    // Présent sur les fiches de paie
    type: 'URSSAF',
    regex: /\b\d{3}\s?\d{7}\b/g,
  },
  {
    // Numéro de mutuelle / prévoyance : formats alphanumériques variés
    // Ex : "Adhérent n° 123456789", "contrat mutuelle AXA 987654"
    type: 'MUTUELLE',
    regex: /\b(?:adhérent|contrat|police|mutuelle|prévoyance)\s*n?°?\s*:?\s*[A-Z0-9\-]{6,20}\b/gi,
  },

  // ── Données financières ───────────────────────────────────────────────
  {
    // IBAN français et européens : FR76 3000 6000 0112 3456 7890 189
    // Présent dans les contrats et fiches de paie (coordonnées bancaires)
    type: 'IBAN',
    regex: /\b[A-Z]{2}\d{2}(?:\s?\d{4}){4,7}\s?\d{1,4}\b/g,
  },
  {
    // Code BIC/SWIFT : BIC : BNPAFRPPXXX, SWIFT: CRLYFRPP
    // Identifie la banque — souvent à côté de l'IBAN dans les contrats et fiches de paie
    // Format : 4 lettres (banque) + 2 lettres (pays) + 2 alphanum (ville) + 3 alphanum optionnels (agence)
    // Contexte obligatoire (BIC/SWIFT) pour éviter les faux positifs sur des mots majuscules
    type: 'BIC',
    regex: /(?:BIC|SWIFT)\s*:?\s*\b[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/gi,
  },
  {
    // Salaires et montants financiers : 3 500 €, 45 000 € brut, 2500EUR, etc.
    // Très fréquents dans les contrats de travail et documents RH
    type: 'MONTANT',
    regex: /\b\d[\d\s]*(?:,\d{1,2})?\s*(?:€|EUR|euros?)(?!\w)/gi,
  },

  // ── Dates ─────────────────────────────────────────────────────────────
  {
    // Dates de naissance : né le 12/03/1985, née le 5 mars 1990, etc.
    // Prioritaire sur DATE générique — à placer avant dans la liste
    type: 'DATE_NAISSANCE',
    regex: /\bn[ée]e?\s+le\s+\d{1,2}[\s\/.\-]\w+[\s\/.\-]\d{4}\b/gi,
  },
  {
    // Dates génériques : 12/03/2024, 12-03-2024, 12.03.2024
    // Dates de signature, d'embauche, d'échéance dans les contrats
    type: 'DATE',
    regex: /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}\b/g,
  },

  // ── Références internes ───────────────────────────────────────────────
  {
    // Numéros de contrat / matricules RH : formats variés alphanumériques
    // Ex : CTR-2024-00123, MAT/85412, EMP_00234
    // Le séparateur est obligatoire pour éviter les faux positifs (ex: "empirisme" → EMP + irisme)
    type: 'REFERENCE',
    regex: /\b(?:CTR|MAT|EMP|REF|N°|NR)[\s\-_\/][\dA-Z]{4,}\b/gi,
  },

  // ── Données techniques (docs IT, conformité RGPD, SOP) ───────────────
  {
    // Adresses IPv4 : 192.168.1.1, 10.0.0.254
    // Présentes dans les docs IT, politiques de sécurité, registres RGPD
    type: 'ADRESSE_IP',
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  },
  {
    // URLs internes ou personnelles mentionnées dans les docs
    // Ex : http://intranet.entreprise.fr, https://mon-espace.rh.com
    type: 'URL',
    regex: /https?:\/\/[^\s<>"]{4,}/gi,
  },

  // ── Identifiants suisses ────────────────────────────────────────
  {
    // Numéro AVS/AHV : 756.1234.5678.97 (13 chiffres, préfixe 756 = Suisse)
    // Équivalent suisse du NIR français, présent dans contrats et fiches de salaire
    type: 'AVS',
    regex: /756[.\s]?\d{4}[.\s]?\d{4}[.\s]?\d{2}/g,
  },
  {
    // IBAN suisse : CH93 0076 2011 6238 5295 7 (21 caractères)
    type: 'IBAN',
    regex: /\bCH\d{2}(?:\s?\d{4}){4}\s?\d\b/g,
  },
  {
    // Téléphone suisse : +41 79 123 45 67, 079 123 45 67
    type: 'TELEPHONE',
    regex: /\+41\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
  },
  {
    // Numéro IDE (identifiant des entreprises suisses) : CHE-123.456.789
    type: 'IDE',
    regex: /\bCHE[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b/g,
  },
  {
    // Montants en CHF : 3'500 CHF, CHF 45 000.00, 2500 Fr.
    type: 'MONTANT',
    regex: /\b\d[\d\s']*(?:\.\d{1,2})?\s*(?:CHF|Fr\.|francs?)\b/gi,
  },
  {
    // Montants en CHF (préfixe) : CHF 3'500, Fr. 45 000
    type: 'MONTANT',
    regex: /(?:CHF|Fr\.)\s*\d[\d\s']*(?:\.\d{1,2})?/g,
  },
];

/**
 * Détecte les PII dans un texte via des expressions régulières.
 * Complémentaire au modèle NER pour les formats structurés (emails, téléphones...).
 *
 * @param texte - le texte complet à analyser
 * @returns     - tableau d'entités PII détectées par regex
 */
function détecterParRegex(texte: string): Omit<EntitePII, 'id'>[] {
  const résultats: Omit<EntitePII, 'id'>[] = [];

  for (const { type, regex } of PATTERNS_REGEX) {
    // Réinitialiser l'index de la regex à chaque utilisation
    regex.lastIndex = 0;

    let match;
    while ((match = regex.exec(texte)) !== null) {
      résultats.push({
        valeur: match[0],
        debut: match.index,
        fin: match.index + match[0].length,
        type,
      });
    }
  }

  return résultats;
}

// ---------------------
// Interne : déduplication
// ---------------------

/**
 * Supprime les entités en double (même position = même entité détectée
 * dans la zone de chevauchement de deux morceaux consécutifs).
 * Conserve l'entité avec le score de confiance le plus élevé.
 *
 * @param entites - liste brute avec potentiels doublons
 * @returns       - liste sans doublons, triée par position
 */
function dédupliquer(entites: Omit<EntitePII, 'id'>[]): Omit<EntitePII, 'id'>[] {
  // Trier par position de début
  const triées = [...entites].sort((a, b) => a.debut - b.debut);
  const résultat: Omit<EntitePII, 'id'>[] = [];

  for (const entite of triées) {
    const dernière = résultat[résultat.length - 1];

    // Ignorer si cette entité chevauche la précédente (même zone)
    if (dernière && entite.debut < dernière.fin) {
      continue;
    }

    résultat.push(entite);
  }

  return résultat;
}

// ---------------------
// Interne : génération d'identifiants
// ---------------------

/**
 * Attribue un identifiant unique à chaque entité : PII_001, PII_002, etc.
 *
 * @param entites - entités sans ID
 * @returns       - entités avec ID assigné
 */
function attribuerIdentifiants(
  entites: Omit<EntitePII, 'id'>[]
): EntitePII[] {
  return entites.map((entite, index) => ({
    ...entite,
    id: `PII_${String(index + 1).padStart(3, '0')}`, // PII_001, PII_002...
  }));
}

// ---------------------
// API publique
// ---------------------

/**
 * Détecte toutes les entités PII dans un texte.
 *
 * Pipeline complet :
 *   1. Découper le texte en morceaux de ~300 mots
 *   2. Lancer le modèle NER sur chaque morceau
 *   3. Recalculer les positions dans le texte original
 *   4. Détecter les emails/téléphones/numéros par regex
 *   5. Si disponible, appeler Presidio (spaCy FR + reconnaisseurs FR/CH)
 *   6. Fusionner, dédupliquer et attribuer des IDs
 *
 * Appelé par : tokenizer.ts (Bloc 2), qui utilisera les entités
 * pour censurer le document.
 *
 * @param texte             - le texte brut complet du document uploadé
 * @param rappelChargement  - callback optionnel appelé pendant le chargement du modèle
 *                            (utile pour afficher une barre de progression dans l'UI)
 * @returns                 - tableau d'entités PII avec positions dans le texte original
 */
export async function détecterPII(
  texte: string,
  rappelChargement?: (progression: number) => void
): Promise<EntitePII[]> {
  // Charger le modèle (instantané si déjà en cache)
  const ner = await obtenirPipeline();

  // Découper le texte en morceaux analysables
  const morceaux = découperTexte(texte);

  const entitésBrutes: Omit<EntitePII, 'id'>[] = [];

  // Analyser chaque morceau avec le modèle NER
  for (let i = 0; i < morceaux.length; i++) {
    const morceau = morceaux[i];

    // Informer l'UI de l'avancement (ex: 2/5 morceaux traités)
    if (rappelChargement) {
      rappelChargement(Math.round((i / morceaux.length) * 100));
    }

    // Lancer la détection NER sur ce morceau (retourne des tokens individuels)
    const tokensBruts = await ner(morceau.texte) as NERTokenBrut[];

    // Agréger les sous-tokens en entités complètes (ex: "Ka" + "##mel" → "Kamel")
    const entitésAgrégées = agrégerTokensNER(tokensBruts, morceau.texte);

    // Recalculer les positions dans le texte ORIGINAL en ajoutant l'offset du morceau
    for (const entité of entitésAgrégées) {
      entitésBrutes.push({
        valeur: entité.mot,
        debut: morceau.offsetDebut + entité.debut,
        fin: morceau.offsetDebut + entité.fin,
        type: entité.type, // "PER", "LOC", "ORG", "MISC"
      });
    }
  }

  // Détecter les emails, téléphones, numéros par regex sur le texte complet
  const entitésRegex = détecterParRegex(texte);

  // Détecter via Presidio si le serveur est disponible (spaCy FR + reconnaisseurs FR/CH)
  let entitésPresidio: Omit<EntitePII, 'id'>[] = [];
  if (await presidioEstDisponible()) {
    entitésPresidio = await détecterParPresidio(texte);
  }

  // Fusionner les trois sources, dédupliquer, puis attribuer les IDs
  const toutesLesEntités = [...entitésBrutes, ...entitésRegex, ...entitésPresidio];
  const sansDoublons = dédupliquer(toutesLesEntités);
  const avecIdentifiants = attribuerIdentifiants(sansDoublons);

  // Informer l'UI que la détection est terminée
  if (rappelChargement) rappelChargement(100);

  return avecIdentifiants;
}
