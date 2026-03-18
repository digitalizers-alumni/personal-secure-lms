// ============================================================
// decoupeur.ts — découpage du texte en morceaux analysables
//
// Responsabilité : diviser un texte long en morceaux de ~300 mots
// avec un chevauchement de ~50 mots entre chaque morceau.
//
// Pourquoi ? Le modèle NER (BERT) a une limite de 512 tokens,
// soit environ 300-400 mots. Un document plus long doit être
// découpé avant d'être analysé.
//
// Pourquoi le chevauchement ? Pour éviter de rater une entité
// qui tomberait exactement sur la coupure entre deux morceaux.
//
// Utilisé par : detecteur-pii.ts
// ============================================================

// Un morceau de texte avec sa position dans le texte original
export interface Morceau {
  texte: string;      // le contenu du morceau
  offsetDebut: number; // position du premier caractère dans le texte original
                       // (nécessaire pour recalculer les positions des entités détectées)
}

/**
 * Découpe un texte en morceaux de taille maximale avec chevauchement.
 *
 * Exemple avec tailleMax=5 et chevauchement=2 :
 *   mots : [A, B, C, D, E, F, G, H]
 *   morceau 1 : [A, B, C, D, E]   offset = position de A
 *   morceau 2 : [D, E, F, G, H]   offset = position de D  ← chevauchement de 2 mots
 *
 * @param texte        - le texte brut complet du document
 * @param tailleMax    - nombre maximum de mots par morceau (défaut : 300)
 * @param chevauchement - nombre de mots partagés entre deux morceaux consécutifs (défaut : 50)
 * @returns            - tableau de morceaux avec leur position dans le texte original
 */
/**
 * Découpe un texte en morceaux de taille maximale de manière performante.
 * Pour les documents lourds (1.5MB+), on évite de tokeniser chaque mot individuellement.
 */
export function découperTexte(
  texte: string,
  tailleMaxMots = 450,
  chevauchementMots = 50
): Morceau[] {
  if (!texte) return [];

  // Estimation rapide du nombre de caractères par mot (~6-7 en français/allemand avec espaces)
  const CHARS_PAR_MOT = 7;
  const tailleMaxChars = tailleMaxMots * CHARS_PAR_MOT;
  const chevauchementChars = chevauchementMots * CHARS_PAR_MOT;

  const morceaux: Morceau[] = [];
  let index = 0;

  // Si le texte est court, on retourne un seul morceau
  if (texte.length < tailleMaxChars + 1000) {
    // On vérifie quand même le nombre de mots réel pour les petits textes
    const motsCount = (texte.match(/\S+/g) || []).length;
    if (motsCount <= tailleMaxMots) {
      return [{ texte, offsetDebut: 0 }];
    }
  }

  // Boucle de découpage par fenêtres de caractères ajustées aux espaces
  while (index < texte.length) {
    let debut = index;
    let fin = Math.min(debut + tailleMaxChars, texte.length);

    // Ajuster la fin au prochain espace pour ne pas couper un mot
    if (fin < texte.length) {
      const prochainEspace = texte.indexOf(' ', fin);
      if (prochainEspace !== -1 && prochainEspace < fin + 50) {
        fin = prochainEspace;
      }
    }

    const texteMorceau = texte.slice(debut, fin);
    morceaux.push({ texte: texteMorceau, offsetDebut: debut });

    // Avancer l'index
    if (fin === texte.length) break;
    
    // Pour le prochain morceau, on recule pour le chevauchement
    // On cherche un espace proche de l'objectif pour la coupure
    index = Math.max(0, fin - chevauchementChars);
    const espaceChevauchement = texte.indexOf(' ', index);
    if (espaceChevauchement !== -1 && espaceChevauchement < fin) {
        index = espaceChevauchement + 1;
    } else {
        index = fin; // Sécurité si aucun espace trouvé
    }
  }

  return morceaux;
}
