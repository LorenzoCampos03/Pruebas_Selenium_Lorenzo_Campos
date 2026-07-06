import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const institutionService = {
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.INSTITUTIONS.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.INSTITUTIONS.BY_ID(id));
          return data;
     },

     uploadLogo: async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const { data } = await apiClient.post(`${ENDPOINTS.INSTITUTIONS.BASE}/upload-logo`, formData, {
               headers: {
                    "Content-Type": "multipart/form-data",
               },
          });
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.INSTITUTIONS.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.INSTITUTIONS.BY_ID(id), payload);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.INSTITUTIONS.BY_ID(id));
          return data;
     },

     toggleStatus: async (id, currentStatus) => {
          if (currentStatus === "ACTIVE") {
               const { data } = await apiClient.delete(ENDPOINTS.INSTITUTIONS.BY_ID(id));
               return data;
          } else {
               const { data } = await apiClient.patch(ENDPOINTS.INSTITUTIONS.RESTORE(id));
               return data;
          }
     },
};
