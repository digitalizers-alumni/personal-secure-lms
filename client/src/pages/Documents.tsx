import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { FileText, Upload, File as FileIcon, FileSpreadsheet, Presentation, ShieldCheck, AlertTriangle, Loader2, Eye, Trash2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocuments, type ScannedDocument } from "@/contexts/DocumentContext";
import { usePIIDetector, type DetectionResult } from "@/hooks/usePIIDetector";
import PIIPreviewDialog from "@/components/PIIPreviewDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentProcessingOrchestrator } from "@/services/DocumentProcessingOrchestrator";
import { MetadataStore } from "@/interfaces/MetadataStore";
import { DocumentStatus } from "@/types/document";
import { ACCEPT_INPUT_FILE } from "@/lib/pii";
import { toast } from "@/hooks/use-toast";
import { uploadDocumentToRAG, deleteDocument, API_URL } from "@/lib/api";
import { DocumentValidatorService } from "@/services/DocumentValidatorService";
import { DocumentMetadata } from "@/types/document";
import { supprimerTableTokens } from "@/lib/pii/token-table";

// --- Helpers ---

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: FileIcon,
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
  const { documents, setDocuments, nextId, isLoading } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { detect, isLoading: piiLoading, loadProgress, lastResult, saveTokens } = usePIIDetector();

  const [piiDialogOpen, setPiiDialogOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState("");
  const [currentDocId, setCurrentDocId] = useState<number | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activePiiResult, setActivePiiResult] = useState<DetectionResult | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ScannedDocument | null>(null);
  const [showPromptAI, setShowPromptAI] = useState(false);
  const navigate = useNavigate();

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

    // Adapter for MetadataStore to update the UI state
    const metadataStore: MetadataStore = {
      create: (metadata) => {
        const newDoc: ScannedDocument = {
          id: Number(metadata.documentId),
          name: metadata.filename,
          type: getFileType(metadata.filename).toUpperCase(),
          size: formatSize(metadata.sizeBytes),
          scannedAt: new Date(metadata.createdAt).toLocaleString("fr-CH"),
          entityCount: 0,
          categories: [],
          status: "scanning",
          indexStatus: "pending"
        };
        setDocuments((prev) => [newDoc, ...prev]);
      },
      updateStatus: (id, status, errorMessage) => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === Number(id)
              ? { ...d, status: status as any, backendError: errorMessage }
              : d
          )
        );
      },
      get: (id) => null, // Not needed for this component's flow
      clear: () => setDocuments([])
    };

    const orchestrator = new DocumentProcessingOrchestrator(metadataStore);

    try {
      setIsExtracting(true);
      const token = localStorage.getItem("lumina_token") || "";
      const result = await orchestrator.processFile(file, token, docId.toString());
      setIsExtracting(false);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.error?.message || "Échec du traitement"
        });
        if ((result.metadata.status as string) !== "scanning") {
            setDocuments((prev) => prev.filter((d) => d.id !== docId));
        }
        return;
      }

      // If PII detection was successful, finalize the UI state
      if (result.piiResult && result.extractedText) {
        setCurrentFileName(file.name);
        setCurrentDocId(docId);
        setActivePiiResult(result.piiResult);
        setPiiDialogOpen(true);

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId
              ? {
                ...d,
                entityCount: result.piiResult!.entities.length,
                categories: [...new Set(result.piiResult!.entities.map((e) => e.entity))],
                status: result.piiResult!.entities.length > 0 ? "pii-found" : "clean",
                texteOriginal: result.extractedText!,
                detectionResult: result.piiResult!,
              }
              : d
          )
        );
      }
    } catch (err: any) {
      setIsExtracting(false);
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de traiter le fichier" });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  }, [setDocuments, nextId]);

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
      <div className="p-6 lg:p-8 pt-20 lg:pt-24 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("docs_title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("docs_subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {showPromptAI && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Button
                  onClick={() => navigate("/ai-prompt")}
                  className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg glow-red font-bold"
                >
                  <Sparkles className="w-4 h-4" />
                  Prompt AI
                </Button>
              </motion.div>
            )}
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gradient-primary text-primary-foreground gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Upload className="w-4 h-4" />
              {t("docs_import")}
            </Button>
          </div>
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
              <p className="text-sm font-medium text-foreground">{t("docs_extracting")}</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-3" />
              <p className="text-sm font-medium text-foreground">{t("docs_drop_zone")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("docs_drop_subtitle")}
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
                {t("docs_analyzed")} ({documents.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("col_document")}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("col_size")}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("docs_status_pii")}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("docs_categories")}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("docs_date")}</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("docs_actions")}</th>
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
                              <Loader2 className="w-3 h-3 animate-spin" /> {t("docs_scanning_label")}
                            </span>
                          )}
                          {doc.status === "clean" && (
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-success" />
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">{t("docs_no_pii")}</span>
                            </span>
                          )}
                          {doc.status === "pii-found" && (
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                                {t("docs_pii_count").replace("{n}", String(doc.entityCount))}
                              </span>
                            </span>
                          )}
                          {doc.indexStatus === "pending" && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> {t("docs_rag_indexing")}
                            </span>
                          )}
                          {doc.indexStatus === "indexed" && (
                            <span className="flex items-center gap-1 text-[10px] text-success mt-1">
                              <ShieldCheck className="w-3 h-3" /> {t("docs_rag_indexed")}
                            </span>
                          )}
                          {doc.indexStatus === "failed" && (
                            <span className="flex items-center gap-1 text-[10px] text-destructive mt-1">
                              <AlertTriangle className="w-3 h-3" /> {t("docs_rag_failed")}
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
                                title={t("preview")}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            )}
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={async () => {
                                  const idToDelete = doc.backendDocId || doc.id;
                                  try {
                                    if (doc.backendDocId) {
                                      await deleteDocument(doc.backendDocId);
                                    }
                                    
                                    // Cleanup local PII tokens for this document
                                    const idToCleanup = doc.backendDocId?.toString() || doc.id.toString();
                                    await supprimerTableTokens(idToCleanup).catch(err => 
                                      console.error(`Failed to cleanup tokens for doc ${idToCleanup}:`, err)
                                    );

                                    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                                    toast({ title: t("delete_success") || "Document supprimé" });
                                  } catch (err) {
                                    toast({ variant: "destructive", title: "Erreur", description: "Échec de la suppression" });
                                  }
                                }}
                                title={t("delete")}
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

        {/* Empty state or Loading */}
        {documents.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              {t("docs_empty_state")}
            </p>
          </motion.div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Chargement de vos documents...</p>
          </div>
        )}

        {/* PII Preview Dialog (pendant l'analyse) */}
        <PIIPreviewDialog
          open={piiDialogOpen}
          onOpenChange={setPiiDialogOpen}
          result={activePiiResult}
          isLoading={piiLoading}
          loadProgress={loadProgress}
          fileName={currentFileName}
          onConfirm={async (anonymizedText) => {
            if (currentDocId === null || !activePiiResult) {
              setPiiDialogOpen(false);
              return;
            }

            try {
              toast({ title: t("docs_saving_server"), description: t("docs_saving_desc") });
              
              const orchestrator = new DocumentProcessingOrchestrator({
                create: () => {},
                updateStatus: () => {},
                get: () => null,
                clear: () => {}
              });
              
              // 1. Ingest & Save tokens via orchestrator (Consolidated)
              const { doc_id } = await orchestrator.ingestFile(
                currentDocId.toString(), 
                currentFileName, 
                anonymizedText, 
                activePiiResult.chiffre,
                activePiiResult.entities.length,
                [...new Set(activePiiResult.entities.map((e) => e.entity))]
              );

              setDocuments((prev) =>
                prev.map((d) =>
                  d.id === currentDocId
                    ? { ...d, backendDocId: Number(doc_id), indexStatus: "pending" as const }
                    : d
                )
              );

              toast({
                title: t("docs_save_success"),
                description: t("docs_save_success_desc").replace("{n}", String(activePiiResult.entities.length ?? 0)),
              });

              setShowPromptAI(true);

              // Start polling
              const pollInterval = setInterval(async () => {
                try {
                  const token = localStorage.getItem("lumina_token");
                  const statusRes = await fetch(`${API_URL}/api/documents/${doc_id}/status`, {
                    headers: token ? { "Authorization": `Bearer ${token}` } : {}
                  });
                  if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.status === "indexed" || statusData.status === "failed") {
                      clearInterval(pollInterval);
                      setDocuments(prev => prev.map(d =>
                        (d.backendDocId === Number(statusData.doc_id) || d.backendDocId === Number(statusData.id) || d.backendDocId === Number(doc_id))
                          ? { ...d, indexStatus: statusData.status }
                          : d
                      ));
                      if (statusData.status === "indexed") {
                        toast({ title: "Base de connaissance", description: t("docs_ready_for_ai") });
                      }
                    }
                  }
                } catch (e) {
                  console.error("Polling error", e);
                }
              }, 3000);

            } catch (err: any) {
              console.error(err);
              setDocuments((prev) =>
                prev.map((d) =>
                  d.id === currentDocId
                    ? { ...d, indexStatus: "failed" as const, backendError: "Erreur envoi" }
                    : d
                )
              );
              toast({ variant: "destructive", title: t("docs_server_error"), description: t("docs_server_error_desc") });
            } finally {
              setPiiDialogOpen(false);
            }
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
                  ? t("docs_preview_pii_replaced").replace("{n}", String(previewDoc.entityCount))
                  : t("docs_preview_no_pii")}
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
                {t("docs_export_tokenized")}
              </Button>
              <Button variant="outline" onClick={() => setPreviewDoc(null)}>
                {t("close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Documents;
