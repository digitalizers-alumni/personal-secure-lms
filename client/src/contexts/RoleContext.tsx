import { createContext, useContext, useState, ReactNode } from "react";

export type Role = "admin" | "user" | "guest";

interface RoleContextType {
  role: Role;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, role: Role) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem("lumina_role") as Role) || "user";
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("lumina_token");
  });
  
  const isAuthenticated = !!token;

  const login = (newToken: string, newRole: Role) => {
    setToken(newToken);
    setRoleState(newRole);
    localStorage.setItem("lumina_token", newToken);
    localStorage.setItem("lumina_role", newRole);
  };

  const logout = () => {
    setToken(null);
    setRoleState("guest");
    localStorage.removeItem("lumina_token");
    localStorage.removeItem("lumina_role");
  };

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
