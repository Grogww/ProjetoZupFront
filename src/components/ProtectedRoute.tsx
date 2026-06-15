import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, isInstitutional } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireInstitutional?: boolean;
  redirectTo?: string;
}

const ProtectedRoute = ({ children, requireInstitutional = false, redirectTo = "/login" }: ProtectedRouteProps) => {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requireInstitutional && !isInstitutional(roles)) {
    return <Navigate to="/gestao/login" state={{ from: location, reason: "no_access" }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
