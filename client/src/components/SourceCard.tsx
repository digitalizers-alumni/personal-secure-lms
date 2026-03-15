import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Search } from "lucide-react";

interface SourceCardProps {
  text: string;
  docName: string;
  docId: number;
  score: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ text, docName, docId, score }) => {
  const { t } = useLanguage();
  
  // Format score as percentage if it's a typical similarity score (0-1)
  const isSimilarity = score <= 1.0;
  const displayScore = isSimilarity 
    ? `${(score * 100).toFixed(1)}%` 
    : score.toFixed(2);

  return (
    <div className="group relative glass-card p-4 rounded-xl border-border/40 hover:border-primary/30 transition-all duration-300 card-hover-lift overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Search className="w-12 h-12" />
      </div>
      
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[11px] font-bold text-foreground/80 tracking-wide uppercase truncate max-w-[150px]">
            {docName || `ID: ${docId}`}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">{t("score") || "Pertinence"}</span>
          <span className="text-[10px] font-bold text-primary">{displayScore}</span>
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-[12px] leading-relaxed text-foreground/70 italic line-clamp-3 pl-3 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors">
          "{text}"
        </p>
      </div>
    </div>
  );
};

export default SourceCard;
