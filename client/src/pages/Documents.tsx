import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { FileText, Upload, File, FileSpreadsheet, Presentation, ShieldCheck, AlertTriangle, Loader2, Eye, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocuments, type ScannedDocument } from "@/contexts/DocumentContext";
import { usePIIDetector, type DetectionResult } from "@/hooks/usePIIDetector";
import PIIPreviewDialog from "@/components/PIIPreviewDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { extraireTexte, ACCEPT_INPUT_FILE } from "@/lib/pii";
import { toast } from "@/hooks/use-toast";

// --- Helpers ---

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: File,
  pptx: Presentation,
  xlsx: FileSpreadsheet,
};

function getFileType(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "txt";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Rend le texte du document avec les PII remplacés par des tokens colorés.
 * Ex : "Jean Dupont habite à Genève" → "[[PII_001]] habite à [[PII_002]]"
 */
function renderTextWithTokens(texte: string, result: DetectionResult): React.ReactNode {
  // Trier les entités par position dans le texte
  const sorted = [...result.rawEntities].sort((a, b) => a.debut - b.debut);

  const fragments: React.ReactNode[] = [];
  let cursor = 0;

  for (const entite of sorted) {
    // Texte avant cette entité
    if (entite.debut > cursor) {
      fragments.push(texte.slice(cursor, entite.debut));
    }

    // Le token PII avec style distinctif
    fragments.push(
      <span
        key={entite.id}
        className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-primary/15 text-primary border border-primary/25 text-xs font-semibold"
        title={`${entite.type} — "${entite.valeur}"`}
      >
        [[{entite.id}]]
      </span>
    );

    cursor = entite.fin;
  }

  // Texte restant après la dernière entité
  if (cursor < texte.length) {
    fragments.push(texte.slice(cursor));
  }

  return fragments;
}

// --- Page ---

const Documents = () => {
  const { t } = useLanguage();
  const { documents, setDocuments, nextId } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { detect, isLoading: piiLoading, loadProgress, lastResult } = usePIIDetector();

  const [piiDialogOpen, setPiiDialogOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ScannedDocument | null>(null);

  /** Exporte le document tokenise (texte original avec PII remplaces par [[PII_XXX]]) */
  const exportPipelineOutput = useCallback((doc: ScannedDocument) => {
    if (!doc.detectionResult) return;

    const blob = new Blob([doc.detectionResult.anonymizedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.name.replace(/\.[^.]+$/, "")}-tokenise.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const processFile = useCallback(async (file: File) => {
    const docId = nextId.current++;
    const fileType = getFileType(file.name);

    // Ajouter le document en statut "scanning"
    const newDoc: ScannedDocument = {
      id: docId,
      name: file.name,
      type: fileType.toUpperCase(),
      size: formatSize(file.size),
      scannedAt: new Date().toLocaleString("fr-CH"),
      entityCount: 0,
      categories: [],
      status: "scanning",
    };
    setDocuments((prev) => [newDoc, ...prev]);

    try {
      // 1. Extraire le texte du fichier
      setIsExtracting(true);
      const texte = await extraireTexte(file);
      setIsExtracting(false);

      if (!texte.trim()) {
        toast({ variant: "destructive", title: "Fichier vide", description: `Aucun texte extrait de "${file.name}"` });
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        return;
      }

      // 2. Lancer la détection PII
      setCurrentFileName(file.name);
      setPiiDialogOpen(true);
      const result = await detect(texte);

      // 3. Mettre à jour le document avec les résultats
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                entityCount: result.entities.length,
                categories: [...new Set(result.entities.map((e) => e.entity))],
                status: result.entities.length > 0 ? "pii-found" : "clean",
                texteOriginal: texte,
                detectionResult: result,
              }
            : d
        )
      );
    } catch (err: any) {
      setIsExtracting(false);
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de traiter le fichier" });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  }, [detect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) processFile(files[0]);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("docs_title")}</h1>
            <p className="text-muted-foreground mt-1">
              Importez un document pour analyser et détecter les données sensibles (PII)
            </p>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gradient-primary text-primary-foreground gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <Upload className="w-4 h-4" />
            {t("docs_import")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_INPUT_FILE}
            onChange={handleFileChange}
            className="hidden"
          />
        </motion.div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer group"
        >
          {isExtracting ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">Extraction du texte en cours...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-3" />
              <p className="text-sm font-medium text-foreground">{t("docs_drop_zone")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, PPTX, XLSX, TXT, CSV, MD — Max 50MB par fichier
              </p>
            </>
          )}
        </motion.div>

        {/* Scanned documents table */}
        {documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Documents analysés ({documents.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Taille</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut PII</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catégories</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const TypeIcon = typeIcons[doc.type.toLowerCase()] || FileText;
                    return (
                      <tr key={doc.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <TypeIcon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{doc.size}</td>
                        <td className="py-3 px-4">
                          {doc.status === "scanning" && (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Loader2 className="w-3 h-3 animate-spin" /> Analyse...
                            </span>
                          )}
                          {doc.status === "clean" && (
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-success" />
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">Aucun PII</span>
                            </span>
                          )}
                          {doc.status === "pii-found" && (
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                                {doc.entityCount} PII
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {doc.categories.map((cat) => (
                              <Badge key={cat} variant="outline" className="text-[9px] px-1.5 py-0">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{doc.scannedAt}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {doc.status !== "scanning" && doc.detectionResult && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                onClick={() => setPreviewDoc(doc)}
                                title="Prévisualiser"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {documents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              Aucun document analysé. Importez un fichier pour lancer la détection PII.
            </p>
          </motion.div>
        )}

        {/* PII Preview Dialog (pendant l'analyse) */}
        <PIIPreviewDialog
          open={piiDialogOpen}
          onOpenChange={setPiiDialogOpen}
          result={lastResult}
          isLoading={piiLoading}
          loadProgress={loadProgress}
          fileName={currentFileName}
          onConfirm={(anonymizedText) => {
            toast({
              title: "Analyse terminée",
              description: `${lastResult?.entities.length ?? 0} donnée(s) sensible(s) détectée(s) dans "${currentFileName}"`,
            });
            setPiiDialogOpen(false);
          }}
          onCancel={() => setPiiDialogOpen(false)}
        />

        {/* Prévisualisation du document avec tokens PII */}
        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
          <DialogContent className="glass-card border-border sm:max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Eye className="w-5 h-5 text-primary" />
                {previewDoc?.name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {previewDoc?.entityCount
                  ? `${previewDoc.entityCount} donnée(s) sensible(s) remplacée(s) par des tokens`
                  : "Aucune donnée sensible détectée"}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 min-h-0 max-h-[60vh]">
              <div className="p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
                {previewDoc?.detectionResult && previewDoc?.texteOriginal
                  ? renderTextWithTokens(previewDoc.texteOriginal, previewDoc.detectionResult)
                  : previewDoc?.texteOriginal}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => previewDoc && exportPipelineOutput(previewDoc)}
              >
                <Download className="w-4 h-4" />
                Exporter tokenise
              </Button>
              <Button variant="outline" onClick={() => setPreviewDoc(null)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Documents;
