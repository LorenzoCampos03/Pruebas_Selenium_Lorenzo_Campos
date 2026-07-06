import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const eventService = {
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.EVENTS.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.EVENTS.BY_ID(id));
          return data;
     },

     getByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.EVENTS.BY_INSTITUTION(institutionId));
          return data;
     },

     getInactive: async () => {
          const { data } = await apiClient.get(ENDPOINTS.EVENTS.INACTIVE);
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.EVENTS.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.EVENTS.BY_ID(id), payload);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.EVENTS.BY_ID(id));
          return data;
     },

     restore: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.EVENTS.RESTORE(id));
          return data;
     },
};
