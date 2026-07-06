import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const attendanceService = {
      // Registros de asistencia
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.ATTENDANCE.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.ATTENDANCE.BY_ID(id));
          return data;
     },

     getByStudent: async (studentId) => {
          const { data } = await apiClient.get(ENDPOINTS.ATTENDANCE.BY_STUDENT(studentId));
          return data;
     },

     getByClassroom: async (classroomId) => {
          const { data } = await apiClient.get(ENDPOINTS.ATTENDANCE.BY_CLASSROOM(classroomId));
          return data;
     },

     getByDate: async (date) => {
          const { data } = await apiClient.get(ENDPOINTS.ATTENDANCE.BY_DATE(date));
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.ATTENDANCE.BASE, payload);
          return data;
     },

     bulkCreate: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.ATTENDANCE.BULK, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.ATTENDANCE.BY_ID(id), payload);
          return data;
     },

     justify: async (id, payload) => {
          const { data } = await apiClient.patch(ENDPOINTS.ATTENDANCE.JUSTIFY(id), payload);
          return data;
     },

     registerPickup: async (id, payload) => {
          const { data } = await apiClient.patch(ENDPOINTS.ATTENDANCE.PICKUP(id), payload);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.ATTENDANCE.BY_ID(id));
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

     getStudentsByClassroom: async (classroomId) => {
          const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BY_CLASSROOM(classroomId));
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

     getInstitutionDetail: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.INSTITUTIONS.DETAIL(id));
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

      // Fechas cívicas - Feriados
     getHolidaysByYear: async (year) => {
          const { data } = await apiClient.get(ENDPOINTS.CIVIC_DATES.HOLIDAYS(year));
          return data;
     },

     getCivicDatesByYear: async (year) => {
          const { data } = await apiClient.get(ENDPOINTS.CIVIC_DATES.BY_YEAR(year));
          return data;
     },
};
