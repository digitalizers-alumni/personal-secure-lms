import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from "react";

export type Role = "admin" | "user" | "guest";

interface RoleContextType {
  role: Role;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, role: Role) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem("lumina_role") as Role) || "user";
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("lumina_token");
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    setRoleState("guest");
    localStorage.removeItem("lumina_token");
    localStorage.removeItem("lumina_role");
    localStorage.removeItem("lumina_last_activity");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    const now = Date.now();
    localStorage.setItem("lumina_last_activity", now.toString());
    
    timeoutRef.current = setTimeout(() => {
      const lastActivity = localStorage.getItem("lumina_last_activity");
      const currentNow = Date.now();
      
      if (lastActivity && currentNow - parseInt(lastActivity) < INACTIVITY_TIMEOUT) {
        // Another tab was active! Restart the timer.
        resetInactivityTimer();
      } else {
        console.log("Inactivity timeout reached, logging out...");
        logout();
      }
    }, INACTIVITY_TIMEOUT);
  }, [logout]);

  const login = (newToken: string, newRole: Role) => {
    setToken(newToken);
    setRoleState(newRole);
    localStorage.setItem("lumina_token", newToken);
    localStorage.setItem("lumina_role", newRole);
    resetInactivityTimer();
  };

  // Check for inactivity on mount and set up listeners
  useEffect(() => {
    if (token) {
      const lastActivity = localStorage.getItem("lumina_last_activity");
      const now = Date.now();
      
      if (lastActivity && now - parseInt(lastActivity) > INACTIVITY_TIMEOUT) {
        logout();
      } else {
        resetInactivityTimer();
        
        const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
        const handleActivity = () => resetInactivityTimer();
        
        events.forEach(event => document.addEventListener(event, handleActivity));
        
        return () => {
          events.forEach(event => document.removeEventListener(event, handleActivity));
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
      }
    }
  }, [token, logout, resetInactivityTimer]);

  const isAuthenticated = !!token;

  return (
    <RoleContext.Provider value={{ role, token, isAuthenticated, login, logout }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};
