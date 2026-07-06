import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const teacherAssignmentService = {
     getUsersByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.USERS.BY_INSTITUTION(institutionId));
          return data;
     },

     createTeacherUser: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.USERS.BASE, payload);
          return data;
     },

     getAssignmentsByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.TEACHER_ASSIGNMENTS.BY_INSTITUTION(institutionId));
          return data;
     },

     getAssignmentsByTeacher: async (teacherUserId) => {
          const { data } = await apiClient.get(ENDPOINTS.TEACHER_ASSIGNMENTS.BY_TEACHER(teacherUserId));
          return data;
     },

     createAssignment: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.TEACHER_ASSIGNMENTS.BASE, payload);
          return data;
     },

     updateAssignment: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.TEACHER_ASSIGNMENTS.BY_ID(id), payload);
          return data;
     },

     deleteAssignment: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.TEACHER_ASSIGNMENTS.BY_ID(id));
          return data;
     },

     restoreAssignment: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.TEACHER_ASSIGNMENTS.RESTORE(id));
          return data;
     },

     getAssignmentSchedules: async (assignmentId) => {
          const { data } = await apiClient.get(ENDPOINTS.ASSIGNMENTS_MANAGEMENT.SCHEDULES(assignmentId));
          return data;
     },

     addSchedule: async (assignmentId, payload) => {
          const { data } = await apiClient.post(
               ENDPOINTS.ASSIGNMENTS_MANAGEMENT.SCHEDULES(assignmentId),
               payload
          );
          return data;
     },

     updateSchedule: async (assignmentId, scheduleId, payload) => {
          const { data } = await apiClient.put(
               ENDPOINTS.ASSIGNMENTS_MANAGEMENT.SCHEDULE_BY_ID(assignmentId, scheduleId),
               payload
          );
          return data;
     },

     removeSchedule: async (assignmentId, scheduleId) => {
          const { data } = await apiClient.delete(
               ENDPOINTS.ASSIGNMENTS_MANAGEMENT.SCHEDULE_BY_ID(assignmentId, scheduleId)
          );
          return data;
     },

     uploadTeacherPhoto: async (assignmentId, file) => {
          const formData = new FormData();
          formData.append("file", file);
          const { data } = await apiClient.post(
               ENDPOINTS.TEACHER_ASSIGNMENTS.UPLOAD_PHOTO(assignmentId),
               formData,
               { headers: { "Content-Type": "multipart/form-data" } }
          );
          return data;
     },
};
