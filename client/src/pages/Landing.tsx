import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  LogIn,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  ShieldOff,
  Upload,
  ScanEye,
  GraduationCap,
  Scale,
  Server,
  ShieldCheck,
  Users,
  BookOpen,
  Building2,
  Monitor,
} from "lucide-react";
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

const Landing = () => {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useLanguage();

  const problems = [
    { icon: Clock, key: "problem_1", stat: "47%", source: "Document360, 2025" },
    { icon: ShieldOff, key: "problem_2", stat: "77%", source: "LayerX Security Report, 2025" },
    { icon: DollarSign, key: "problem_3", stat: "CHF 250k", source: "nFADP Art. 60" },
  ];

  const steps = [
    { icon: Upload, key: "step_1", num: "01" },
    { icon: ScanEye, key: "step_2", num: "02" },
    { icon: GraduationCap, key: "step_3", num: "03" },
  ];

  const privacyLayers = [
    { icon: Scale, key: "privacy_law" },
    { icon: Server, key: "privacy_hosting" },
    { icon: ShieldCheck, key: "privacy_pii" },
  ];

  const useCases = [
    { icon: Users, key: "usecase_onboarding" },
    { icon: BookOpen, key: "usecase_compliance" },
    { icon: Building2, key: "usecase_knowledge" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
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

      {/* Header */}
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
            <span className="text-xs block text-muted-foreground -mt-0.5 font-medium">
              {t("brand_tagline")}
            </span>
          </div>
        </motion.div>

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

      <main className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 py-8 lg:py-16 space-y-24">

        {/* ── SECTION 1: Hero ── */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-6"
        >
          <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            {t("hero_headline")}
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("hero_sub")}
          </p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="gradient-primary text-primary-foreground font-semibold h-14 px-10 text-base glow-red"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {t("hero_cta")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground font-medium">
              {t("hero_trust")}
            </p>
          </motion.div>
        </motion.section>

        {/* ── SECTION 2: The Problem ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-1.5 rounded-full text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              {t("problem_badge")}
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              {t("problem_title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("problem_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <motion.div
                key={p.key}
                whileHover={{ y: -4 }}
                className="card-elevated rounded-xl p-6 border border-border/50 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <p.icon className="w-5 h-5 text-destructive" />
                  </div>
                  <span className="text-2xl font-bold font-mono text-foreground">{p.stat}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(p.key)}</p>
                <p className="text-[10px] text-muted-foreground/50 font-mono mt-2">{p.source}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── SECTION 3: The Solution ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              {t("solution_title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("solution_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.key}
                whileHover={{ y: -4 }}
                className="relative card-elevated rounded-xl p-6 border border-border/50 space-y-3"
              >
                <span className="absolute top-4 right-4 text-4xl font-bold text-primary/10 font-mono">
                  {s.num}
                </span>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{t(`${s.key}_title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`${s.key}_desc`)}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── SECTION 4: Swiss Privacy Shield ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2">
              <SwissCross />
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                {t("privacy_title")}
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("privacy_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {privacyLayers.map((layer, i) => (
              <motion.div
                key={layer.key}
                whileHover={{ y: -4 }}
                className={`card-elevated rounded-xl p-6 space-y-3 ${
                  i === 2 ? "border-glow-red" : "border border-border/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    i === 2 ? "bg-primary/15" : "bg-silver/10"
                  }`}>
                    <layer.icon className={`w-5 h-5 ${i === 2 ? "text-primary" : "text-silver"}`} />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t(`${layer.key}_label`)}
                  </span>
                </div>
                <h3 className="font-bold text-foreground">{t(`${layer.key}_title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`${layer.key}_desc`)}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── SECTION 5: Use Cases ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              {t("usecases_title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <motion.div
                key={uc.key}
                whileHover={{ y: -4 }}
                className="card-elevated rounded-xl p-6 border border-border/50 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <uc.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{t(`${uc.key}_title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`${uc.key}_desc`)}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── SECTION 6: Architecture (simplified) ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
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
              <div className="flex flex-wrap gap-2 mt-4">
                {["React", "TypeScript", "Hugging Face NER", "IndexedDB"].map((tech) => (
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
              <div className="flex flex-wrap gap-2 mt-4">
                {["FastAPI", "spaCy NER", "Presidio", "Infomaniak"].map((tech) => (
                  <span key={tech} className="text-[10px] font-bold bg-silver/10 text-silver px-2 py-0.5 rounded-full">{tech}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── SECTION 7: Final CTA ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center space-y-6 py-8"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
            {t("cta_title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("cta_subtitle")}
          </p>
          <Button
            onClick={() => navigate("/login")}
            size="lg"
            className="gradient-primary text-primary-foreground font-semibold h-14 px-10 text-base glow-red"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {t("hero_cta")}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
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
          <p className="text-xs text-muted-foreground">{t("footer_sub")}</p>
        </motion.footer>
      </main>
    </div>
  );
};

export default Landing;
