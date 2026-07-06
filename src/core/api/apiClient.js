import axios from "axios";
import { setupInterceptors } from "./interceptors";

const API_BASE_URL = window.APP_CONFIG?.API_URL || "https://lab.vallegrande.edu.pe/sigei/gateway";

console.log("[ApiClient] BASE_URL:", API_BASE_URL);

const apiClient = axios.create({
     baseURL: API_BASE_URL,
     headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Accept": "application/json; charset=utf-8",
     },
     responseEncoding: "utf8",
     timeout: 15000,
});

// Log para todas las requests
apiClient.interceptors.request.use((config) => {
     const logData = {
          url: config.url,
          method: config.method?.toUpperCase(),
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          data: config.data ? JSON.parse(JSON.stringify(config.data)) : null,
          headers: config.headers
     };
     console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, logData);
     return config;
}, error => {
     console.error("[API Request Error]", error);
     return Promise.reject(error);
});

// Log para todas las responses
apiClient.interceptors.response.use((response) => {
     console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: JSON.parse(JSON.stringify(response.data))
     });
     return response;
}, error => {
     const errorLog = {
          status: error.response?.status,
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          message: error.message,
          data: error.response?.data ? JSON.parse(JSON.stringify(error.response.data)) : null
     };
     console.error(`[API Error] ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, errorLog);
     return Promise.reject(error);
});

setupInterceptors(apiClient);

export default apiClient;
