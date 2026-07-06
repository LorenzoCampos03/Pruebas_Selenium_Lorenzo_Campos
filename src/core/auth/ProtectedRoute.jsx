import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./AuthContext";
import LoadingScreen from "@/shared/components/feedback/LoadingScreen";
import { getRouteByRole } from "@/core/utils/constants";
import toast from "react-hot-toast";

export default function ProtectedRoute({ allowedRoles, children }) {
     const { isAuthenticated, role, loading } = useAuth();

     const isAuthorized = !allowedRoles || allowedRoles.includes(role);

     useEffect(() => {
          if (isAuthenticated && !loading && !isAuthorized) {
               toast.error("No tienes permisos para acceder a esta sección.", {
                    id: "auth-unauthorized-warning"
               });
          }
     }, [isAuthenticated, loading, isAuthorized]);

     if (loading) {
          return <LoadingScreen />;
     }

     if (!isAuthenticated) {
          return <Navigate to="/login" replace />;
     }

     if (!isAuthorized) {
          return <Navigate to={getRouteByRole(role)} replace />;
     }

     return children;
}
