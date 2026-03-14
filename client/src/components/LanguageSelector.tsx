import { motion } from "framer-motion";
import { useLanguage, SUPPORTED_LOCALES } from "@/contexts/LanguageContext";

const SwissCross = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5" aria-label="Swiss cross">
    <rect width="32" height="32" rx="4" fill="hsl(0 72% 51%)" />
    <rect x="13" y="6" width="6" height="20" rx="1" fill="white" />
    <rect x="6" y="13" width="20" height="6" rx="1" fill="white" />
  </svg>
);

export const LanguageSelector = () => {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="fixed top-4 right-6 z-50 flex items-center gap-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1 bg-secondary/80 backdrop-blur-md rounded-full px-1.5 py-1.5 border border-border/50 shadow-lg"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
              locale === l.code
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
        <div className="ml-1 pr-1 border-l border-border/50 pl-2">
          <SwissCross />
        </div>
      </motion.div>
    </div>
  );
};
