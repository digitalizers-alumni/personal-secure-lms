import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Database, Building2, ArrowRight, Globe, Monitor, Server, LogIn } from "lucide-react";
import { useLanguage, type Locale } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const locales: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "it", label: "IT" },
  { code: "de", label: "DE" },
  { code: "en", label: "EN" },
  { code: "rm", label: "RM" },
];

const SwissCross = () => (
  <svg viewBox="0 0 32 32" className="w-6 h-6" aria-label="Swiss cross">
    <rect width="32" height="32" rx="4" fill="hsl(0 72% 51%)" />
    <rect x="13" y="6" width="6" height="20" rx="1" fill="white" />
    <rect x="6" y="13" width="20" height="6" rx="1" fill="white" />
  </svg>
);

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Landing = () => {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useLanguage();

  const features = [
    { icon: Sparkles, key: "feat_ai" },
    { icon: Database, key: "feat_rag" },
    { icon: Building2, key: "feat_tenant" },
    { icon: Globe, key: "feat_swiss" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-60 -left-40 w-[600px] h-[600px] rounded-full bg-silver/5 blur-[80px]"
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(0 0% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 50%) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div>
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-gradient-silver">Lumina</span>{" "}
              <span className="text-gradient-red">Swiss</span>
            </span>
            <span className="text-xs block text-muted-foreground -mt-0.5 font-medium">{t("hero_title")}</span>
          </div>
        </motion.div>

        {/* Language switcher */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1 bg-secondary/60 backdrop-blur-sm rounded-full px-1 py-1 border border-border/50"
        >
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                locale === l.code
                  ? "bg-primary text-primary-foreground shadow-sm glow-red"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
          <SwissCross />
        </motion.div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-16 space-y-20">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-6"
        >
          <p className="text-2xl lg:text-3xl text-foreground max-w-2xl mx-auto leading-relaxed font-semibold">
            {t("hero_subtitle")}
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="gradient-primary text-primary-foreground font-semibold h-14 px-10 text-base glow-red"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {t("login_submit")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.section>

        {/* Feature strip */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.key}
              whileHover={{ scale: 1.08, y: -2 }}
              className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm rounded-full px-5 py-2.5 border border-border/30 shadow-md hover:shadow-lg transition-shadow"
            >
              <f.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t(f.key)}</span>
            </motion.div>
          ))}
        </motion.section>

        {/* Architecture section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold text-foreground text-center">{t("arch_title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-elevated rounded-xl p-6 border-glow-red">
              <div className="flex items-center gap-3 mb-3">
                <Monitor className="w-6 h-6 text-primary" />
                <h3 className="font-bold text-foreground">{t("arch_client")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("arch_client_desc")}</p>
              <div className="flex gap-2 mt-4">
                {["React", "Vite", "Tailwind"].map((tech) => (
                  <span key={tech} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tech}</span>
                ))}
              </div>
            </div>
            <div className="card-elevated rounded-xl p-6 border border-silver/20">
              <div className="flex items-center gap-3 mb-3">
                <Server className="w-6 h-6 text-silver" />
                <h3 className="font-bold text-foreground">{t("arch_server")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("arch_server_desc")}</p>
              <div className="flex gap-2 mt-4">
                {["Infomaniak", "Ubuntu", "pgvector"].map((tech) => (
                  <span key={tech} className="text-[10px] font-bold bg-silver/10 text-silver px-2 py-0.5 rounded-full">{tech}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center space-y-3 pb-8"
        >
          <div className="flex items-center justify-center gap-2">
            <SwissCross />
            <span className="text-sm font-semibold text-muted-foreground">{t("footer")}</span>
          </div>
          <p className="text-xs text-muted-foreground">FR · IT · DE · EN · RM</p>
        </motion.footer>
      </main>
    </div>
  );
};

export default Landing;
