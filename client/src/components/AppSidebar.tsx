import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/contexts/RoleContext";
import { useLanguage, SUPPORTED_LOCALES } from "@/contexts/LanguageContext";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  Users as UsersIcon,
  UserCircle,
  Globe,
} from "lucide-react";

interface NavItem {
  labelKey: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { labelKey: "nav_dashboard",    icon: LayoutDashboard, path: "/dashboard"     },
  { labelKey: "nav_documents",    icon: FileText,        path: "/documents"     },
  { labelKey: "nav_ai_prompt",    icon: Sparkles,        path: "/ai-prompt"     },
  { labelKey: "nav_formations",   icon: FileText,        path: "/courses"       },
  { labelKey: "nav_create_course",icon: GraduationCap,   path: "/create-course" },
];

const AppSidebar = () => {
  const { role, logout } = useRole();
  const { t, locale, setLocale } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
      location.pathname === path
        ? "bg-sidebar-accent text-sidebar-primary"
        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
    }`;

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
                {t("knowledge_engine")}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 flex flex-col no-scrollbar overflow-hidden">
        <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={navLinkClass(item.path)}>
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

          {/* Admin section */}
          {role === "admin" && (
            <>
              <div className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </div>
              <Link to="/users" className={navLinkClass("/users")}>
                {location.pathname === "/users" && (
                  <motion.div
                    layoutId="activeIndicatorAdmin"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-primary active-glow"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <UsersIcon className={`w-5 h-5 flex-shrink-0 ${location.pathname === "/users" ? "text-sidebar-primary" : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium overflow-hidden whitespace-nowrap"
                    >
                      {t("nav_users")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </>
          )}
        </div>

        {/* Language Selector (Just over the line) */}
        <div className="mt-auto px-2 pb-2 border-t border-sidebar-border/20 pt-4">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="expanded-lang"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-between bg-white/5 p-1 rounded-lg border border-sidebar-border/30 shadow-inner"
              >
                <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5">
                  {SUPPORTED_LOCALES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLocale(l.code)}
                      className={`px-2 py-1 rounded-md text-[10px] font-black transition-all duration-300 ${
                        locale === l.code
                          ? "bg-sidebar-primary text-primary-foreground shadow-lg scale-105"
                          : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <div className="ml-2 pl-2 border-l border-sidebar-border/30 flex-shrink-0 mr-1">
                  <Globe className="w-3.5 h-3.5 text-sidebar-primary/60 animate-pulse-slow" />
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="collapsed-lang"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  const currentIndex = SUPPORTED_LOCALES.findIndex(l => l.code === locale);
                  const nextIndex = (currentIndex + 1) % SUPPORTED_LOCALES.length;
                  setLocale(SUPPORTED_LOCALES[nextIndex].code);
                }}
                className="w-full flex flex-col items-center justify-center py-2.5 rounded-xl bg-white/5 border border-sidebar-border/30 hover:bg-white/10 transition-all group shadow-sm active:scale-95"
              >
                <span className="text-xs font-black text-sidebar-primary group-hover:scale-110 transition-transform">
                  {locale.toUpperCase()}
                </span>
                <Globe className="w-3.5 h-3.5 text-sidebar-foreground/30 mt-1 group-hover:text-sidebar-primary/50 transition-colors" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Role Badge, Profile, Logout & Collapse */}
      <div className="px-3 pb-4 space-y-3 border-t border-sidebar-border pt-3 bg-sidebar/50 backdrop-blur-md">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-2"
            >
              <Shield className="w-4 h-4 text-sidebar-primary shadow-sm" />
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/80">
                {role}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile link */}
        <Link to="/profile" className={navLinkClass("/profile")}>
          {location.pathname === "/profile" && (
            <motion.div
              layoutId="activeIndicatorProfile"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-primary active-glow"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <UserCircle className={`w-5 h-5 flex-shrink-0 ${location.pathname === "/profile" ? "text-sidebar-primary" : ""}`} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium overflow-hidden whitespace-nowrap"
              >
                {t("my_profile")}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Logout */}
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

        {/* Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2.5 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all border border-transparent hover:border-sidebar-border/30"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;