import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

interface RestrictedBadgeProps {
  label?: string;
  className?: string;
}

const RestrictedBadge = ({ label, className = "" }: RestrictedBadgeProps) => {
  const { t } = useLanguage();
  const text = label || t("access_restricted");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-not-allowed select-none ${className}`}>
          <Lock className="w-3.5 h-3.5" />
          <span>{text}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default RestrictedBadge;
