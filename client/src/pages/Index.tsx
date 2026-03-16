import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { useRole } from "@/contexts/RoleContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocuments } from "@/contexts/DocumentContext";
import { 
  FileText, Shield, ArrowRight, Activity, 
  Lock, Database, Sparkles, CheckCircle2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const { documents } = useDocuments();
  const navigate = useNavigate();

  const indexedCount = documents.filter(d => d.indexStatus === 'indexed').length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={item}>
            <StatCard
              title={t("stat_indexed_docs")}
              value={indexedCount.toString()}
              change=""
              changeType="neutral"
              icon={FileText}
              color="info"
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              title={t("dash_current_role")}
              value={role === "admin" ? t("dash_admin_role") : t("dash_user_role")}
              change=""
              changeType="neutral"
              icon={Shield}
              color="primary"
            />
          </motion.div>
          
          <motion.div variants={item} className="sm:col-span-2">
            <Card className="h-full border-2 border-primary/10 shadow-sm overflow-hidden bg-primary/5">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  {t("dash_system_status")}
                </CardTitle>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {t("dash_status_online")}
                </Badge>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-background/50 border border-border/50">
                    <Lock className="w-4 h-4 text-blue-500 mb-1" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{t("dash_tool_pii")}</span>
                    <span className="text-[11px] font-black text-blue-600">{t("dash_status_active")}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-background/50 border border-border/50">
                    <Database className="w-4 h-4 text-purple-500 mb-1" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{t("dash_tool_rag")}</span>
                    <span className="text-[11px] font-black text-purple-600">{t("dash_status_ready")}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-background/50 border border-border/50">
                    <Sparkles className="w-4 h-4 text-amber-500 mb-1" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{t("dash_tool_courses")}</span>
                    <span className="text-[11px] font-black text-amber-600">{t("dash_status_active")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick action — go to Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate("/documents")}
            className="w-full card-elevated card-accent-left hover-ring rounded-xl p-8 text-left hover:shadow-xl transition-all group cursor-pointer border-2 border-primary/5"
            style={{ "--accent-gradient": "var(--gradient-primary)" } as React.CSSProperties}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-black text-foreground">{t("nav_documents")}</p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Propulsé par RAG</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 max-w-lg font-medium">
                    {t("dash_quick_upload_desc")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Explorer <ArrowRight className="w-4 h-4" />
                </span>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-blue-100 flex items-center justify-center" title="Privacy Protected"><Lock className="w-3.5 h-3.5 text-blue-600" /></div>
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-green-100 flex items-center justify-center" title="AI Ready"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /></div>
                </div>
              </div>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
