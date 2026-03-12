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
export function découperTexte(
  texte: string,
  tailleMax = 300,
  chevauchement = 50
): Morceau[] {
  // Trouver la position exacte de chaque mot dans le texte original
  // On utilise une regex pour trouver les séquences de caractères non-blancs
  const regexMots = /\S+/g;
  const mots: { contenu: string; debut: number; fin: number }[] = [];

  let match;
  while ((match = regexMots.exec(texte)) !== null) {
    mots.push({
      contenu: match[0],
      debut: match.index,
      fin: match.index + match[0].length,
    });
  }

  // Si le texte est vide ou trop court, retourner un seul morceau
  if (mots.length === 0) return [];
  if (mots.length <= tailleMax) {
    return [{ texte, offsetDebut: 0 }];
  }

  const morceaux: Morceau[] = [];
  const pas = tailleMax - chevauchement; // nombre de mots avancés à chaque itération

  for (let i = 0; i < mots.length; i += pas) {
    const motsDuMorceau = mots.slice(i, i + tailleMax);
    if (motsDuMorceau.length === 0) break;

    const offsetDebut = motsDuMorceau[0].debut;
    const offsetFin = motsDuMorceau[motsDuMorceau.length - 1].fin;

    // Extraire le texte exact du morceau depuis le texte original
    // (préserve les espaces et la ponctuation d'origine)
    const texteMorceau = texte.slice(offsetDebut, offsetFin);

    morceaux.push({ texte: texteMorceau, offsetDebut });
  }

  return morceaux;
}
