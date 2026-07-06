import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const psychologyService = {
     // Evaluaciones
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.BY_ID(id));
          return data;
     },

     getByStudent: async (studentId) => {
          const { data } = await apiClient.get(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.BY_STUDENT(studentId));
          return data;
     },

     getByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.BY_INSTITUTION(institutionId));
          return data;
     },

     getByClassroom: async (classroomId) => {
          const { data } = await apiClient.get(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.BY_CLASSROOM(classroomId));
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.BY_ID(id), payload);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.BY_ID(id));
          return data;
     },

     hardDelete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.HARD_DELETE(id));
          return data;
     },

     restore: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.RESTORE(id));
          return data;
     },

     startScheduledSession: async (id, payload) => {
          const { data } = await apiClient.patch(ENDPOINTS.PSYCHOLOGY.EVALUATIONS.START_SCHEDULED(id), payload);
          return data;
     },

     // Referencias - Estudiantes
     getAllStudents: async () => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BASE);
          return data;
     },

     getStudentById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BY_ID(id));
          return data;
     },

     getStudentsByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BY_INSTITUTION(institutionId));
          return data;
     },

     // Referencias - Instituciones
     getAllInstitutions: async () => {
          const { data } = await apiClient.get(ENDPOINTS.INSTITUTIONS.BASE);
          return data;
     },

     getInstitutionById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.INSTITUTIONS.BY_ID(id));
          return data;
     },

     // Referencias - Aulas
     getAllClassrooms: async () => {
          const { data } = await apiClient.get(ENDPOINTS.CLASSROOMS.BASE);
          return data;
     },

     getClassroomById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.CLASSROOMS.BY_ID(id));
          return data;
     },

     getClassroomsByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.CLASSROOMS.BY_INSTITUTION(institutionId));
          return data;
     },

     // Referencias - Usuarios
     getAllUsers: async () => {
          const { data } = await apiClient.get(ENDPOINTS.USERS.BASE);
          return data;
     },

     getUserById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.USERS.BY_ID(id));
          return data;
     },
};
