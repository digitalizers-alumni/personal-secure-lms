import { Navigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useRole();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default AuthGuard;
