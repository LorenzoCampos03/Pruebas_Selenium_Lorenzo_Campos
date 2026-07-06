import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const incidentService = {
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.DISCIPLINE.INCIDENTS.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.DISCIPLINE.INCIDENTS.BY_ID(id));
          return data;
     },

     getByStudent: async (studentId) => {
          const { data } = await apiClient.get(ENDPOINTS.DISCIPLINE.INCIDENTS.BY_STUDENT(studentId));
          return data;
     },

     getByStatus: async (status) => {
          const { data } = await apiClient.get(ENDPOINTS.DISCIPLINE.INCIDENTS.BY_STATUS(status));
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.DISCIPLINE.INCIDENTS.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.DISCIPLINE.INCIDENTS.BY_ID(id), payload);
          return data;
     },

     resolve: async (id, resolvedBy) => {
          const { data } = await apiClient.patch(
               `${ENDPOINTS.DISCIPLINE.INCIDENTS.RESOLVE(id)}?resolvedBy=${encodeURIComponent(resolvedBy)}`
          );
          return data;
     },

     changeStatus: async (id, status, resolvedBy) => {
          let url = `${ENDPOINTS.DISCIPLINE.INCIDENTS.CHANGE_STATUS(id)}?status=${encodeURIComponent(status)}`;
          if (resolvedBy) {
               url += `&resolvedBy=${encodeURIComponent(resolvedBy)}`;
          }
          const { data } = await apiClient.patch(url);
          return data;
     },

     invalidate: async (id, invalidatedBy, invalidationReason) => {
          let url = ENDPOINTS.DISCIPLINE.INCIDENTS.BY_ID(id);
          const params = [];

          if (invalidatedBy) {
               params.push(`invalidatedBy=${encodeURIComponent(invalidatedBy)}`);
          }

          if (invalidationReason) {
               params.push(`invalidationReason=${encodeURIComponent(invalidationReason)}`);
          }

          if (params.length) {
               url += `?${params.join("&")}`;
          }

          await apiClient.delete(url);
     },
};
