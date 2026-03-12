import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { useRole } from "@/contexts/RoleContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Shield, ArrowRight } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Index = () => {
  const { role } = useRole();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold text-foreground">
            {t("dashboard_title")}
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard_subtitle")}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <motion.div variants={item}>
            <StatCard
              title={t("stat_indexed_docs")}
              value="—"
              change=""
              changeType="neutral"
              icon={FileText}
              color="info"
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              title="Rôle actuel"
              value={role === "admin" ? "Administrateur" : "Utilisateur"}
              change=""
              changeType="neutral"
              icon={Shield}
              color="primary"
            />
          </motion.div>
        </motion.div>

        {/* Quick action — go to Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/documents")}
            className="w-full card-elevated card-accent-left hover-ring rounded-xl p-6 text-left hover:shadow-lg transition-all group cursor-pointer"
            style={{ "--accent-gradient": "var(--gradient-primary)" } as React.CSSProperties}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center icon-bounce">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{t("nav_documents")}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Uploader et analyser des documents avec détection PII
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </motion.button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
