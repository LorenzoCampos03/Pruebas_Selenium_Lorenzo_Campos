import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const classroomService = {
     getByInstitution: async (institutionId) => {
          const { data } = await apiClient.get(ENDPOINTS.CLASSROOMS.BY_INSTITUTION(institutionId));
          return data;
     },
};
