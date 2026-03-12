// ============================================================
// extracteur-texte.ts — conversion d'un fichier en texte brut
//
// Responsabilité : prendre un fichier uploadé par l'utilisateur
// (PDF, Word, texte) et retourner son contenu
// sous forme de string exploitable par détecterPII().
//
// Formats supportés :
//   .pdf              → pdfjs-dist
//   .docx             → mammoth
//   .txt              → API native du navigateur (aucune dépendance)
//
// Dépend de : pdfjs-dist, mammoth
// Passe ses résultats à : detecteur-pii.ts (Bloc 1)
// ============================================================

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Configuration du worker PDF.js
// Le worker tourne dans un thread séparé pour ne pas bloquer l'interface
// On utilise le fichier local du package (via Vite ?url) au lieu du CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// ---------------------
// Extracteurs par format
// ---------------------

/**
 * Extrait le texte d'un fichier PDF page par page.
 * Chaque page est séparée par un saut de ligne double.
 */
async function extrairePDF(fichier: File): Promise<string> {
  const buffer = await fichier.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const contenu = await page.getTextContent();

    // Reconstituer le texte de la page en joignant les fragments
    const textePage = contenu.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');

    pages.push(textePage);
  }

  return pages.join('\n\n');
}

/**
 * Extrait le texte d'un fichier Word (.docx).
 * mammoth ignore la mise en forme et retourne uniquement le texte.
 */
async function extraireDOCX(fichier: File): Promise<string> {
  const buffer = await fichier.arrayBuffer();
  const résultat = await mammoth.extractRawText({ arrayBuffer: buffer });
  return résultat.value;
}

/**
 * Lit un fichier texte brut (.txt) directement.
 * Aucune bibliothèque nécessaire — on utilise l'API native du navigateur.
 */
async function extraireTexteSimple(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(lecteur.result as string);
    lecteur.onerror = () => reject(new Error(`Impossible de lire le fichier : ${fichier.name}`));
    lecteur.readAsText(fichier, 'UTF-8');
  });
}

// ---------------------
// API publique
// ---------------------

// Types de fichiers acceptés
export const FORMATS_ACCEPTES = [
  '.pdf',
  '.docx',
  '.txt',
] as const;

// Type utile pour l'attribut "accept" d'un input file HTML
export const ACCEPT_INPUT_FILE = FORMATS_ACCEPTES.join(',');

/**
 * Convertit un fichier uploadé en texte brut exploitable par détecterPII().
 *
 * Utilisation dans un composant :
 *   const texte = await extraireTexte(fichier);
 *   const entités = await détecterPII(texte);
 *
 * @param fichier - le File object reçu depuis un <input type="file"> ou un drag & drop
 * @returns       - le contenu textuel du fichier sous forme de string
 * @throws        - une erreur si le format n'est pas supporté
 */
export async function extraireTexte(fichier: File): Promise<string> {
  const nom = fichier.name.toLowerCase();

  if (nom.endsWith('.pdf'))  return extrairePDF(fichier);
  if (nom.endsWith('.docx')) return extraireDOCX(fichier);
  if (nom.endsWith('.txt'))  return extraireTexteSimple(fichier);

  throw new Error(
    `Format non supporté : "${fichier.name}". ` +
    `Formats acceptés : ${FORMATS_ACCEPTES.join(', ')}`
  );
}
