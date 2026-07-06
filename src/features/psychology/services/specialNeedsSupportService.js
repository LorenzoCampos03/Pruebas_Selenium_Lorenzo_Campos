import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const specialNeedsSupportService = {
     getAllActive: async () => {
          const { data } = await apiClient.get(ENDPOINTS.PSYCHOLOGY.SPECIAL_NEEDS_SUPPORT.BASE);
          return data;
     },
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.PSYCHOLOGY.SPECIAL_NEEDS_SUPPORT.ALL);
          return data;
     },
     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.PSYCHOLOGY.SPECIAL_NEEDS_SUPPORT.BY_ID(id));
          return data;
     },
     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.PSYCHOLOGY.SPECIAL_NEEDS_SUPPORT.BASE, payload);
          return data;
     },
     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.PSYCHOLOGY.SPECIAL_NEEDS_SUPPORT.BY_ID(id), payload);
          return data;
     },
     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.PSYCHOLOGY.SPECIAL_NEEDS_SUPPORT.BY_ID(id));
          return data;
     },
     hardDelete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.PSYCHOLOGY.SPECIAL_NEEDS_SUPPORT.HARD_DELETE(id));
          return data;
     },
     restore: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.PSYCHOLOGY.SPECIAL_NEEDS_SUPPORT.RESTORE(id));
          return data;
     }
};
