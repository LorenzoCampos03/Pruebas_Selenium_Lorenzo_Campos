import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

function unwrapApiData(payload) {
     if (payload && typeof payload === "object" && "data" in payload) {
          return payload.data;
     }
     return payload;
}

export const recurringEventService = {
     getAll: async (status = "ACTIVE") => {
          const response = await apiClient.get(`${ENDPOINTS.RECURRING_EVENTS.BASE}?status=${status}`);
          return unwrapApiData(response.data);
     },

     create: async (data) => {
          const response = await apiClient.post(ENDPOINTS.RECURRING_EVENTS.BASE, data);
          return unwrapApiData(response.data);
     },

     update: async (id, data) => {
          const response = await apiClient.put(ENDPOINTS.RECURRING_EVENTS.BY_ID(id), data);
          return unwrapApiData(response.data);
     },

     delete: async (id) => {
          const response = await apiClient.delete(ENDPOINTS.RECURRING_EVENTS.BY_ID(id));
          return unwrapApiData(response.data);
     },

     restore: async (id) => {
          const response = await apiClient.put(`${ENDPOINTS.RECURRING_EVENTS.BY_ID(id)}/restore`);
          return unwrapApiData(response.data);
     },

     applyToCalendar: async (calendarId, year) => {
          const response = await apiClient.post(
               `${ENDPOINTS.RECURRING_EVENTS.APPLY_TO_CALENDAR(calendarId)}?year=${year}`
          );
          return unwrapApiData(response.data);
     }
};
