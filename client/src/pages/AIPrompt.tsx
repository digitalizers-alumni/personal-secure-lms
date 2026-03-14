import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocuments, type ScannedDocument } from "@/contexts/DocumentContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateFromRAG } from "@/lib/api";
import { restaurerRéponse } from "@/lib/pii";
import {
  Sparkles,
  FileText,
  File as FileIcon,
  FileSpreadsheet,
  Presentation,
  Send,
  AlertTriangle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import SourceCard from "@/components/SourceCard";

// --- Helpers ---

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: FileIcon,
  pptx: Presentation,
  xlsx: FileSpreadsheet,
};

const AIPrompt = () => {
  const { t } = useLanguage();
  const { documents } = useDocuments();

  // Documents sélectionnés (set d'IDs)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [generationResult, setGenerationResult] = useState<{
    answer: string;
    sources: { text: string; doc_id: number; score: number }[];
  } | null>(null);

  // Seuls les documents indexés avec backendDocId sont sélectionnables
  const readyDocs = useMemo(
    () => documents.filter((d) => d.indexStatus === "indexed" && d.backendDocId !== undefined),
    [documents]
  );

  const selectedCount = selectedIds.size;

  const toggleDoc = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCount === readyDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(readyDocs.map((d) => d.id)));
    }
  };

  const handleSend = async () => {
    if (selectedCount === 0) {
      toast({
        variant: "destructive",
        title: t("ai_no_docs_title"),
        description: t("ai_no_docs_desc"),
      });
      return;
    }
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: t("ai_no_prompt_title"),
        description: t("ai_no_prompt_desc"),
      });
      return;
    }

    setIsSending(true);
    setGenerationResult(null);

    // Get the backend doc IDs for the selected items
    const selectedBackendDocIds = readyDocs
      .filter((d) => selectedIds.has(d.id))
      .map((d) => d.backendDocId as number);

    try {
      const result = await generateFromRAG(prompt.trim(), selectedBackendDocIds.length > 0 ? selectedBackendDocIds : undefined);

      let finalAnswer = result.answer;

      // Restauration PII pour chaque document sélectionné qui a été envoyé. 
      const token = localStorage.getItem("lumina_token") || "";
      const selectedClientDocs = readyDocs.filter((d) => selectedIds.has(d.id));
      for (const doc of selectedClientDocs) {
        try {
          if (doc.backendDocId) {
            finalAnswer = await restaurerRéponse(doc.backendDocId.toString(), finalAnswer, token);
          }
        } catch (e) {
          console.error(`Failed to restore tokens for doc ${doc.id}`, e);
        }
      }

      setGenerationResult({
        answer: finalAnswer,
        sources: result.sources || []
      });

      toast({
        title: t("ai_sent_title"),
        description: t("ai_sent_desc"),
      });
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erreur de génération",
        description: e.message || "Impossible de générer une réponse."
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">{t("ai_title")}</h1>
          <p className="text-muted-foreground mt-1">{t("ai_subtitle")}</p>
        </motion.div>

        {/* Sélection des documents */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t("ai_select_docs")}
              {readyDocs.length > 0 && (
                <Badge variant="outline" className="ml-1 text-xs">
                  {selectedCount}/{readyDocs.length}
                </Badge>
              )}
            </h2>
            {readyDocs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7">
                {selectedCount === readyDocs.length
                  ? t("ai_deselect_all")
                  : t("ai_select_all")}
              </Button>
            )}
          </div>

          {readyDocs.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{t("ai_no_docs_yet")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {readyDocs.map((doc) => {
                const TypeIcon = typeIcons[doc.type.toLowerCase()] || FileText;
                const isSelected = selectedIds.has(doc.id);

                return (
                  <label
                    key={doc.id}
                    className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${isSelected
                        ? "bg-primary/5"
                        : "hover:bg-muted/20"
                      }`}
                  >
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => toggleDoc(doc.id)}
                    />
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} &middot; {doc.size}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {doc.status === "clean" && (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {t("ai_clean")}
                        </span>
                      )}
                      {doc.status === "pii-found" && (
                        <span className="flex items-center gap-1 text-xs text-warning">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {doc.entityCount} PII
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Zone de prompt */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {t("ai_prompt_label")}
          </h2>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("ai_prompt_placeholder")}
            rows={5}
            className="resize-none bg-background/50 border-border focus:border-primary/50 text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {selectedCount > 0
                ? t("ai_docs_selected").replace("{n}", String(selectedCount))
                : t("ai_docs_none_selected")}
            </p>
            <Button
              onClick={handleSend}
              disabled={isSending}
              className="gradient-primary text-primary-foreground gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {t("ai_send")}
            </Button>
          </div>
        </motion.div>

        {/* Résultat de la génération */}
        {generationResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-5 space-y-4 border-primary/20 bg-primary/5"
          >
            <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Réponse
            </h2>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {generationResult.answer}
            </div>

            {generationResult.sources.length > 0 && (
              <div className="pt-4 border-t border-border/50 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sources utilisées
                </h3>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2 pr-4">
                    {generationResult.sources.map((source, i) => {
                      const sourceDoc = documents.find(d => d.backendDocId === source.doc_id);
                      return (
                        <SourceCard
                          key={i}
                          text={source.text}
                          docName={sourceDoc?.name || ""}
                          docId={source.doc_id}
                          score={source.score}
                        />
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AIPrompt;
