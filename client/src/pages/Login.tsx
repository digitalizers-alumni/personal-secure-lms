import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/contexts/RoleContext";
import { useLanguage } from "@/contexts/LanguageContext";

const Login = () => {
  const navigate = useNavigate();
  const { setRole } = useRole();
  const { t } = useLanguage();

  const handleSelect = (role: "admin" | "user") => {
    setRole(role);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-silver/5 blur-[80px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("login_back")}
        </button>

        <div className="glass-card rounded-2xl p-8 border border-border space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-lg font-bold">
                <span className="text-gradient-silver">Lumina</span>{" "}
                <span className="text-gradient-red">Swiss</span>
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("login_title")}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Mode développement — choisissez un rôle
              </p>
            </div>
          </div>

          {/* Role buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSelect("admin")}
              className="w-full gradient-primary text-primary-foreground font-semibold h-14 glow-red text-base"
            >
              <Shield className="w-5 h-5 mr-3" />
              Administrateur
            </Button>
            <Button
              onClick={() => handleSelect("user")}
              variant="outline"
              className="w-full font-semibold h-14 text-base border-silver/30 hover:bg-silver/10"
            >
              <User className="w-5 h-5 mr-3" />
              Utilisateur
            </Button>
          </div>

          {/* Dev mode notice */}
          <p className="text-[11px] text-center text-muted-foreground">
            L'authentification sera ajoutée ultérieurement.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
