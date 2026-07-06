import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { authService } from "./authService";
import { getTokenRole, isTokenExpired, getTokenClaims } from "@/core/utils/token";

function normalizeProfile(profile) {
     if (!profile) return null;
     return {
          userId: profile.userId || profile.user_id,
          institutionId: profile.institutionId || profile.institution_id,
          username: profile.username || profile.userName,
          firstName: profile.firstName || profile.first_name,
          lastName: profile.lastName || profile.last_name,
          email: profile.email,
          role: profile.role,
          documentNumber: profile.documentNumber || profile.document_number || null,
          ageLevel: profile.ageLevel || profile.age_level || null,
     };
}

export function AuthProvider({ children }) {
     const [user, setUser] = useState(null);
     const [role, setRole] = useState(null);
     const [loading, setLoading] = useState(true);

     const clearSession = useCallback(() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user_profile");
          localStorage.removeItem("sigei_institution_cache");
          setUser(null);
          setRole(null);
     }, []);

     const loadUser = useCallback((token) => {
          const saved = localStorage.getItem("user_profile");
          if (saved) {
               try {
                    const profile = normalizeProfile(JSON.parse(saved));
                    setUser(profile);
                    setRole(profile.role || getTokenRole(token));
                    return;
               } catch {
                    /* parse error, fallback */
               }
          }
          const claims = getTokenClaims(token);
          setUser(claims);
          setRole(claims.role);
     }, []);

     useEffect(() => {
          const init = () => {
               const token = localStorage.getItem("access_token");
               if (token && !isTokenExpired(token)) {
                    loadUser(token);
               } else {
                    clearSession();
               }
               setLoading(false);
          };
          init();
     }, [loadUser, clearSession]);

     const login = async (username, password) => {
          try {
               const response = await authService.login(username, password);

               if (response.success) {
                    const { access_token, refresh_token, profile } = response.data;
                    localStorage.setItem("access_token", access_token);
                    localStorage.setItem("refresh_token", refresh_token);

                    let userRole = getTokenRole(access_token);
                    let displayName = "";

                    if (profile) {
                         const normalized = normalizeProfile(profile);
                         displayName = normalized.firstName || "";
                         try {
                              const meRes = await authService.getMe();
                              const meData = meRes?.success ? meRes.data : meRes;
                              if (meData?.documentNumber || meData?.document_number) {
                                   normalized.documentNumber = meData.documentNumber || meData.document_number;
                              }
                         } catch {
                              /* silent — documentNumber no disponible */
                         }
                         localStorage.setItem("user_profile", JSON.stringify(normalized));
                         setUser(normalized);
                         userRole = normalized.role || userRole;
                         setRole(userRole);
                    } else {
                         const claims = getTokenClaims(access_token);
                         setUser(claims);
                         setRole(userRole);
                    }

                    return { success: true, role: userRole, displayName };
               }

               return { success: false, message: response.message };
          } catch (error) {
               const errorData = error?.response?.data;

               if (errorData?.success === false) {
                    return {
                         success: false,
                         message: errorData.message,
                         errorCode: errorData.errorCode,
                         status: errorData.status,
                    };
               }

               if (error?.code === "ECONNABORTED") {
                    return {
                         success: false,
                         message: "La solicitud tardó demasiado. Intente nuevamente.",
                         errorCode: "TIMEOUT",
                    };
               }

               if (!error?.response) {
                    return {
                         success: false,
                         message: "No se pudo conectar con el servidor. Verifique su conexión.",
                         errorCode: "NETWORK_ERROR",
                    };
               }

               return {
                    success: false,
                    message: error?.message || "Error inesperado",
                    errorCode: "UNKNOWN_ERROR",
               };
          }
     };

     const logout = async () => {
          try {
               const refreshToken = localStorage.getItem("refresh_token");
               if (refreshToken) {
                    await authService.logout(refreshToken);
               }
          } catch {
               /* silent */
          } finally {
               clearSession();
          }
     };

     const hasRole = (roles) => {
          return role ? roles.includes(role) : false;
     };

     const updateProfile = useCallback((updatedFields) => {
          setUser((prev) => {
               const updated = { ...prev, ...updatedFields };
               localStorage.setItem("user_profile", JSON.stringify(updated));
               return updated;
          });
     }, []);

     const value = {
          user,
          role,
          loading,
          login,
          logout,
          hasRole,
          updateProfile,
          isAuthenticated: !!user && !!role,
     };

     return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
