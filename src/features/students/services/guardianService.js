import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const guardianService = {
     getByStudent: async (studentId) => {
          const { data } = await apiClient.get(ENDPOINTS.GUARDIANS.BY_STUDENT(studentId));
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.GUARDIANS.BY_ID(id));
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.GUARDIANS.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.GUARDIANS.BY_ID(id), payload);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.GUARDIANS.BY_ID(id));
          return data;
     },

     existsByDocument: async (documentNumber) => {
          const { data } = await apiClient.get(ENDPOINTS.GUARDIANS.EXISTS_DOCUMENT(documentNumber));
          return data;
     },

     existsByPhone: async (phone) => {
          const { data } = await apiClient.get(ENDPOINTS.GUARDIANS.EXISTS_PHONE(phone));
          return data;
     },

     existsByEmail: async (email) => {
          const { data } = await apiClient.get(ENDPOINTS.GUARDIANS.EXISTS_EMAIL(email));
          return data;
     },

     existsByWhatsapp: async (whatsapp) => {
          const { data } = await apiClient.get(ENDPOINTS.GUARDIANS.EXISTS_WHATSAPP(whatsapp));
          return data;
     },

     uploadPhoto: async (id, file) => {
          const formData = new FormData();
          formData.append("file", file);
          const { data } = await apiClient.post(ENDPOINTS.GUARDIANS.UPLOAD_PHOTO(id), formData, {
               headers: { "Content-Type": "multipart/form-data" },
          });
          return data;
     },
};
