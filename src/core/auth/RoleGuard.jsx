import { useAuth } from "./AuthContext";

export default function RoleGuard({ roles, fallback = null, children }) {
     const { hasRole } = useAuth();

     if (!hasRole(roles)) {
          return fallback;
     }

     return children;
}
