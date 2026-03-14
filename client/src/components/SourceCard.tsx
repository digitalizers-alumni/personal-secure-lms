import React from "react";

interface SourceCardProps {
  text: string;
  docName: string;
  docId: number;
  score: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ text, docName, docId, score }) => {
  return (
    <div className="text-xs p-3 rounded-lg bg-background/50 border border-border/50">
      <div className="flex items-center justify-between mb-1 text-muted-foreground font-medium">
        <span>{docName || `Doc ID: ${docId}`}</span>
        <span className="opacity-70">Score: {score}</span>
      </div>
      <p className="line-clamp-3 opacity-80">{text}</p>
    </div>
  );
};

export default SourceCard;
