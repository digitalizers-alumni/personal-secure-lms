import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type DetectionResult, type PIICategory } from "@/hooks/usePIIDetector";
import { useLanguage } from "@/contexts/LanguageContext";

interface PIIPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: DetectionResult | null;
  isLoading: boolean;
  loadProgress: number;
  onConfirm: (anonymizedText: string) => void;
  onCancel: () => void;
  fileName?: string;
}

const CATEGORY_KEYS: Record<string, string> = {
  PER: "person",
  ORG: "organization",
  LOC: "location",
  MISC: "misc",
  EMAIL: "email",
  TELEPHONE: "phone",
  IBAN: "iban",
  SECU: "social_security",
  AVS: "avs",
  DATE: "date",
  MONTANT: "amount",
  ADRESSE: "address",
  URL: "url",
  ADRESSE_IP: "ip_address",
  SIRET_SIREN: "siret_siren",
  CNI: "cni",
  URSSAF: "urssaf",
  MUTUELLE: "mutuelle",
  REFERENCE: "reference",
  CODE_POSTAL: "zip_code",
  IDE: "ide",
  DATE_NAISSANCE: "birth_date",
};

function getCategoryLabel(cat: string, t: (k: string) => string): string {
  const key = CATEGORY_KEYS[cat];
  return key ? t(key) : cat;
}

const CATEGORY_COLORS: Record<string, string> = {
  PER: "bg-destructive/10 text-destructive border-destructive/20",
  ORG: "bg-info/10 text-info border-info/20",
  LOC: "bg-warning/10 text-warning border-warning/20",
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || "bg-muted text-muted-foreground border-border";
}

const PIIPreviewDialog = ({
  open, onOpenChange, result, isLoading, loadProgress, onConfirm, onCancel, fileName,
}: PIIPreviewDialogProps) => {
  const { t } = useLanguage();
  const [showOriginal, setShowOriginal] = useState(false);

  const entityCount = result?.entities.length ?? 0;
  const categories = result
    ? [...new Set(result.entities.map((e) => e.entity))]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {t("pii_analysis_title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {fileName
              ? t("pii_analysis_desc").replace("{name}", fileName)
              : t("pii_verification_desc")}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("pii_loading_model")}
            </div>
            <Progress value={loadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">{loadProgress}%</p>
          </div>
        )}

        {!isLoading && result && (
          <div className="space-y-4 pt-2">
            {/* Summary */}
            <div className="flex items-center gap-3">
              {entityCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-success flex-shrink-0" />
              )}
              <p className="text-sm text-foreground">
                {entityCount > 0
                  ? t("pii_entities_detected").replace("{n}", String(entityCount))
                  : t("pii_no_entities")}
              </p>
            </div>

            {/* Category badges */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const count = result.entities.filter((e) => e.entity === cat).length;
                  return (
                    <Badge
                      key={cat}
                      variant="outline"
                      className={`${getCategoryColor(cat)} text-xs`}
                    >
                      {getCategoryLabel(cat, t)} ({count})
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Entity list */}
            {entityCount > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {result.entities.map((e, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/30"
                  >
                    <span className="font-mono text-foreground">
                      {showOriginal ? e.word : `[[PII_${String(i + 1).padStart(3, '0')}]]`}
                    </span>
                    <span className="text-muted-foreground">
                      {getCategoryLabel(e.entity, t)} · {Math.round(e.score * 100)}%
                    </span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Toggle original */}
            {entityCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                {showOriginal ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showOriginal ? t("pii_hide_originals") : t("pii_view_originals")}
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => result && onConfirm(result.anonymizedText)}
            disabled={isLoading || !result}
            className="gradient-primary text-primary-foreground gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {entityCount > 0 ? t("pii_send_anonymized") : t("pii_send_anyway")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PIIPreviewDialog;
