import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CourseRewardProps {
  score: number;
  title: string;
  message: string;
  onClose: () => void;
}

export const CourseReward: React.FC<CourseRewardProps> = ({ score, title, message, onClose }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <Card id="certificate-reward-card" className="w-full max-w-lg border-2 border-white/5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-[#2a2d37] overflow-hidden text-white relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#ef4444]" />
        
        <CardContent className="pt-12 pb-10 px-8 text-center space-y-8">
          <div className="relative inline-block">
            <Trophy className="w-24 h-24 mx-auto text-[#fbbf24] fill-[#fbbf24]/20 animate-bounce" />
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-[#fbbf24] animate-pulse" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tighter text-[#ef4444] uppercase leading-tight">
              {title}
            </h2>
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fbbf24] font-bold">
              <Star className="w-5 h-5 fill-[#fbbf24]" />
              {t("score")}: {Math.round(score)}%
            </div>
          </div>

          <p className="text-xl text-slate-300 font-medium leading-relaxed italic opacity-90 px-4">
            "{message}"
          </p>

          <Button 
            onClick={onClose} 
            size="lg" 
            className="w-full h-16 text-xl font-black bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-2xl shadow-2xl shadow-red-900/20 transition-all active:scale-[0.98]"
          >
            {t("continue_adventure")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
