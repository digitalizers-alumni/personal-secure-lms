import { motion } from "framer-motion";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color?: "primary" | "accent" | "success" | "info";
}

const colorMap = {
  primary: "gradient-primary",
  accent: "gradient-accent",
  success: "bg-success",
  info: "bg-info",
};

const accentGradients = {
  primary: "var(--gradient-primary)",
  accent: "linear-gradient(135deg, hsl(0 0% 88%), hsl(0 0% 68%))",
  success: "linear-gradient(135deg, hsl(152 60% 42%), hsl(152 60% 32%))",
  info: "linear-gradient(135deg, hsl(200 80% 50%), hsl(200 80% 40%))",
};

const StatCard = ({ title, value, change, changeType = "neutral", icon: Icon, color = "primary" }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="card-elevated card-accent-top hover-ring rounded-xl p-5 cursor-default"
      style={{ "--accent-gradient": accentGradients[color] } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={`text-xs font-medium ${
              changeType === "positive" ? "text-success" : changeType === "negative" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${colorMap[color]} flex items-center justify-center icon-bounce`}>
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
