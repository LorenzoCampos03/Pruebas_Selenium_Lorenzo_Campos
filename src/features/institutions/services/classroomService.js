import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const classroomService = {
     getAll: async (institutionId) => {
          const normalizeClassroomsResponse = (response) => {
               const payload = response?.success ? response.data : response;
               const classrooms = Array.isArray(payload?.classrooms)
                    ? payload.classrooms
                    : [];

               if (response?.success) {
                    return {
                         ...response,
                         data: classrooms,
                    };
               }

               return classrooms;
          };

          try {
               const { data } = await apiClient.get(
                    ENDPOINTS.CLASSROOMS.BY_INSTITUTION(institutionId)
               );
               return data;
          } catch (error) {
               if (error?.response?.status !== 404) {
                    throw error;
               }

               try {
                    const { data: detailResponse } = await apiClient.get(
                         ENDPOINTS.INSTITUTIONS.DETAIL(institutionId)
                    );
                    return normalizeClassroomsResponse(detailResponse);
               } catch (detailError) {
                    if (detailError?.response?.status !== 404) {
                         throw detailError;
                    }

                    const { data: institutionResponse } = await apiClient.get(
                         ENDPOINTS.INSTITUTIONS.BY_ID(institutionId)
                    );
                    return normalizeClassroomsResponse(institutionResponse);
               }
          }
     },

     getById: async (institutionId, classroomId) => {
          const { data } = await apiClient.get(
               ENDPOINTS.CLASSROOMS.BY_ID(classroomId)
          );
          return data;
     },

     create: async (institutionId, payload) => {
          const { data } = await apiClient.post(
               ENDPOINTS.CLASSROOMS.BASE,
               { ...payload, institutionId }
          );
          return data;
     },

     update: async (institutionId, classroomId, payload) => {
          const { data } = await apiClient.put(
               ENDPOINTS.CLASSROOMS.BY_ID(classroomId),
               payload
          );
          return data;
     },

     toggleStatus: async (institutionId, classroomId, currentStatus) => {
          if (currentStatus === "ACTIVE" || currentStatus === "A") {
               const { data } = await apiClient.delete(ENDPOINTS.CLASSROOMS.BY_ID(classroomId));
               return data;
          } else {
               const { data } = await apiClient.patch(ENDPOINTS.CLASSROOMS.RESTORE(classroomId));
               return data;
          }
     },
};
