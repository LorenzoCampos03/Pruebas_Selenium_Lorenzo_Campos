import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const studentService = {
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BY_ID(id));
          return data;
     },

     getByStatus: async (status) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BY_STATUS(status));
          return data;
     },

     getByCui: async (cui) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BY_CUI(cui));
          return data;
     },

     getByClassroom: async (classroomId) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BY_CLASSROOM(classroomId));
          return data;
     },

     getByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BY_INSTITUTION(institutionId));
          return data;
     },

     getMyChildren: async (documentNumber) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.MY_CHILDREN(documentNumber));
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.STUDENTS.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.STUDENTS.BY_ID(id), payload);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.STUDENTS.BY_ID(id));
          return data;
     },

     restore: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.STUDENTS.RESTORE(id));
          return data;
     },

     existsByCui: async (cui) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.EXISTS_CUI(cui));
          return data;
     },

     existsByDocument: async (documentNumber) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.EXISTS_DOCUMENT(documentNumber));
          return data;
     },

     uploadPhoto: async (id, file) => {
          const formData = new FormData();
          formData.append("file", file);
          const { data } = await apiClient.post(ENDPOINTS.STUDENTS.UPLOAD_PHOTO(id), formData, {
               headers: { "Content-Type": "multipart/form-data" },
          });
          return data;
     },
};
