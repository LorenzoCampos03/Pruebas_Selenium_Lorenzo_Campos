import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const gradeService = {
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.GRADES.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.GRADES.BY_ID(id));
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.GRADES.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.GRADES.BY_ID(id), payload);
          return data;
     },
};
