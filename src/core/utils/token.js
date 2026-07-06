const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "sigei-gateway";

function decodeBase64Url(value) {
     const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
     const padding = (4 - (base64.length % 4)) % 4;
     return atob(base64 + "=".repeat(padding));
}

export function decodeToken(token) {
     try {
          const payload = token?.split(".")?.[1];
          if (!payload) return null;
          const decoded = JSON.parse(decodeBase64Url(payload));
          return decoded;
     } catch {
          return null;
     }
}

export function getTokenRole(token) {
     const decoded = decodeToken(token);
     if (!decoded) return null;

     const clientRoles = decoded.resource_access?.[KEYCLOAK_CLIENT_ID]?.roles;
     const realmRoles = decoded.realm_access?.roles;
     const roles = (Array.isArray(clientRoles) && clientRoles.length > 0 ? clientRoles : realmRoles || []).map(
          (role) => String(role).toUpperCase()
     );

     const roleHierarchy = [
          "ADMINISTRADOR",
          "DIRECTOR",
          "SUBDIRECTOR",
          "DOCENTE",
          "AUXILIAR",
          "PSICOLOGO",
          "SECRETARIA",
          "APODERADO",
          "PADRE",
          "MADRE",
     ];

     for (const r of roleHierarchy) {
          if (roles.includes(r)) return r;
     }

     return roles[0] || null;
}

export function isTokenExpired(token) {
     const decoded = decodeToken(token);
     if (!decoded || !decoded.exp) return true;
     return Date.now() >= decoded.exp * 1000;
}

export function getTokenClaims(token) {
     const decoded = decodeToken(token);
     if (!decoded) return {};

     return {
          userId: decoded.userId || decoded.sub,
          username: decoded.preferred_username,
          institutionId: decoded.institutionId,
          role: getTokenRole(token),
     };
}
