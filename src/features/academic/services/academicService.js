import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const courseService = {
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.COURSES.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.COURSES.BY_ID(id));
          return data;
     },

     getByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.COURSES.BY_INSTITUTION(institutionId));
          return data;
     },

     getAllByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.COURSES.BY_INSTITUTION(institutionId));
          return data;
     },

     getActiveByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.COURSES.ACTIVE_BY_INSTITUTION(institutionId));
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.ACADEMIC.COURSES.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.ACADEMIC.COURSES.BY_ID(id), payload);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.ACADEMIC.COURSES.BY_ID(id));
          return data;
     },

     deactivate: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.ACADEMIC.COURSES.BY_ID(id));
          return data;
     },

     restore: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.ACADEMIC.COURSES.RESTORE(id));
          return data;
     },

     activate: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.ACADEMIC.COURSES.RESTORE(id));
          return data;
     },
};

export const competencyService = {
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.COMPETENCIES.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.COMPETENCIES.BY_ID(id));
          return data;
     },

     getByCourse: async (courseId) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.COMPETENCIES.BY_COURSE(courseId));
          return data;
     },

     getActiveByCourse: async (courseId) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.COMPETENCIES.ACTIVE_BY_COURSE(courseId));
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.ACADEMIC.COMPETENCIES.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.ACADEMIC.COMPETENCIES.BY_ID(id), payload);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.ACADEMIC.COMPETENCIES.BY_ID(id));
          return data;
     },

     restore: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.ACADEMIC.COMPETENCIES.RESTORE(id));
          return data;
     },
};

export const capacityService = {
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.CAPACITIES.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.CAPACITIES.BY_ID(id));
          return data;
     },

     getByCompetency: async (competencyId) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.CAPACITIES.BY_COMPETENCY(competencyId));
          return data;
     },

     getActiveByCompetency: async (competencyId) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.CAPACITIES.ACTIVE_BY_COMPETENCY(competencyId));
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.ACADEMIC.CAPACITIES.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.ACADEMIC.CAPACITIES.BY_ID(id), payload);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.ACADEMIC.CAPACITIES.BY_ID(id));
          return data;
     },

     restore: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.ACADEMIC.CAPACITIES.RESTORE(id));
          return data;
     },
};

export const performanceService = {
     getAll: async () => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.PERFORMANCES.BASE);
          return data;
     },

     getById: async (id) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.PERFORMANCES.BY_ID(id));
          return data;
     },

     getByCapacity: async (capacityId) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.PERFORMANCES.BY_CAPACITY(capacityId));
          return data;
     },

     getActiveByCapacity: async (capacityId) => {
          const { data } = await apiClient.get(ENDPOINTS.ACADEMIC.PERFORMANCES.ACTIVE_BY_CAPACITY(capacityId));
          return data;
     },

     create: async (payload) => {
          const { data } = await apiClient.post(ENDPOINTS.ACADEMIC.PERFORMANCES.BASE, payload);
          return data;
     },

     update: async (id, payload) => {
          const { data } = await apiClient.put(ENDPOINTS.ACADEMIC.PERFORMANCES.BY_ID(id), payload);
          return data;
     },

     delete: async (id) => {
          const { data } = await apiClient.delete(ENDPOINTS.ACADEMIC.PERFORMANCES.BY_ID(id));
          return data;
     },

     restore: async (id) => {
          const { data } = await apiClient.patch(ENDPOINTS.ACADEMIC.PERFORMANCES.RESTORE(id));
          return data;
     },
};