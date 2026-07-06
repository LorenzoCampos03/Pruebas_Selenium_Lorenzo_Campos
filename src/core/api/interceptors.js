import axios from "axios";
import { isTokenExpired } from "@/core/utils/token";

const API_BASE_URL = window.APP_CONFIG?.API_URL || "https://lab.vallegrande.edu.pe/sigei/gateway";

const AUTH_ENDPOINTS = ["/api/auth/login", "/api/auth/refresh", "/api/auth/logout"];

function isAuthEndpoint(url) {
     return AUTH_ENDPOINTS.some((endpoint) => url?.includes(endpoint));
}

function clearSession() {
     localStorage.removeItem("access_token");
     localStorage.removeItem("refresh_token");
     localStorage.removeItem("user_profile");
}

export function setupInterceptors(client) {
     client.interceptors.request.use((config) => {
          const token = localStorage.getItem("access_token");

          if (token && isTokenExpired(token)) {
               clearSession();
               if (!isAuthEndpoint(config?.url)) {
                    window.location.href = "/login";
                    return Promise.reject(new Error("Sesion expirada"));
               }
          }

          if (token && !isTokenExpired(token)) {
               config.headers.Authorization = `Bearer ${token}`;
          }

          return config;
     });

     client.interceptors.response.use(
          (response) => response,
          async (error) => {
               const originalRequest = error.config;

               if (isAuthEndpoint(originalRequest?.url)) {
                    return Promise.reject(error);
               }

               if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    const refreshToken = localStorage.getItem("refresh_token");

                    if (refreshToken) {
                         try {
                              const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                                   refreshToken,
                              });

                              if (data.success) {
                                   localStorage.setItem("access_token", data.data.access_token);
                                   localStorage.setItem("refresh_token", data.data.refresh_token);
                                   originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`;
                                   return client(originalRequest);
                              }

                              clearSession();
                              window.location.href = "/login";
                              return Promise.reject(error);
                         } catch {
                              clearSession();
                              window.location.href = "/login";
                         }
                    } else {
                         clearSession();
                         window.location.href = "/login";
                    }
               }

               return Promise.reject(error);
          }
     );
}
