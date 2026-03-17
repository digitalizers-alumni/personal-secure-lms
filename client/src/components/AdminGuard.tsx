import { Navigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { role } = useRole();
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default AdminGuard;