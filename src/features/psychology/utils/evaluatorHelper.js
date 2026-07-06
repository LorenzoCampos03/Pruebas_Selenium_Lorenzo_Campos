import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

/**
 * Obtiene el nombre completo del evaluador desde /api/users/me.
 * Fallback al objeto user del AuthContext si la llamada falla.
 */
export async function fetchEvaluatorFullName() {
     try {
          const { data } = await apiClient.get(ENDPOINTS.USERS.ME);
          const me = data?.data || data;
          if (me) {
               const first = me.firstName || me.first_name || "";
               const last  = me.lastName  || me.last_name  || "";
               const full  = `${first} ${last}`.trim();
               if (full.length > 2) return full;
          }
     } catch { /* silent */ }
     return null;
}

/**
 * Extrae el nombre completo del evaluador desde el objeto user del AuthContext.
 * Soporta campos de Keycloak (given_name/family_name) y del perfil normalizado (firstName/lastName).
 */
export function getEvaluatorName(user) {
     if (!user) return "";
     const first = user.firstName || user.given_name || user.first_name || "";
     const last  = user.lastName  || user.family_name || user.last_name  || "";
     const full  = `${first} ${last}`.trim();
     if (full.length <= 2 && user.username) return user.username;
     return full;
}

/**
 * Extrae el userId del evaluador desde el objeto user del AuthContext.
 */
export function getEvaluatorId(user) {
     if (!user) return "";
     const fromUser = user.userId || user.user_id || user.sub || "";
     if (fromUser) return fromUser;
     try {
          const token = localStorage.getItem("access_token");
          if (token) {
               const payload = token.split(".")[1];
               const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
               return decoded.userId || decoded.sub || "";
          }
     } catch { /* silent */ }
     return "";
}
