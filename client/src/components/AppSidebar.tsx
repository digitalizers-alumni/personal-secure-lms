import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/contexts/RoleContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
} from "lucide-react";

interface NavItem {
  labelKey: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { labelKey: "nav_dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { labelKey: "nav_documents", icon: FileText, path: "/documents" },
  { labelKey: "nav_ai_prompt", icon: Sparkles, path: "/ai-prompt" },
];

const AppSidebar = () => {
  const { role, logout } = useRole();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="gradient-dark flex flex-col h-screen sticky top-0 z-30 border-r border-sidebar-border sidebar-depth"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-extrabold text-xs">LS</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="text-lg font-bold tracking-tight">
                <span className="text-gradient-silver">Lumina</span>{" "}
                <span className="text-gradient-red">Swiss</span>
              </span>
              <span className="text-xs block text-sidebar-foreground -mt-1">
                Knowledge Engine
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-primary active-glow"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium overflow-hidden whitespace-nowrap"
                  >
                    {t(item.labelKey)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Role Badge & Logout & Collapse */}
      <div className="px-3 pb-4 space-y-3 border-t border-sidebar-border pt-3">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-2"
            >
              <Shield className="w-4 h-4 text-sidebar-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground">
                {role}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200 group cursor-pointer"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium overflow-hidden whitespace-nowrap"
              >
                {t("nav_logout")}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
