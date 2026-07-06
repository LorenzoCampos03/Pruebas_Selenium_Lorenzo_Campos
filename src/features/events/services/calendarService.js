import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

// Normalizar datos del backend (snake_case a camelCase)
function normalizeCalendar(calendar) {
     if (!calendar) return calendar;
     const normalized = {
          id: calendar.id,
          institutionId: calendar.institution_id || calendar.institutionId,
          academicYear: calendar.academic_year || calendar.academicYear,
          academicYearName: calendar.academic_year_name || calendar.academicYearName || "",
          startDate: calendar.start_date || calendar.startDate,
          endDate: calendar.end_date || calendar.endDate,
          status: calendar.status || "ACTIVE",
          createdAt: calendar.created_at || calendar.createdAt,
          updatedAt: calendar.updated_at || calendar.updatedAt,
     };
     return normalized;
}

// Normalizar array de calendarios
function normalizeCalendars(calendars) {
     return Array.isArray(calendars) ? calendars.map(normalizeCalendar) : [];
}

// Extraer payload real de respuestas que pueden venir como:
// 1) { success, message, data }
// 2) [{ success, message, data }, ...]
// 3) payload directo (objeto o array)
function unwrapApiData(payload) {
     if (Array.isArray(payload)) {
          return payload.map((item) => (item && typeof item === "object" && "data" in item ? item.data : item));
     }

     if (payload && typeof payload === "object" && "data" in payload) {
          return payload.data;
     }

     return payload;
}

function normalizeEvent(event) {
     if (!event) return event;
     return {
          ...event,
          institutionId: event.institution_id || event.institutionId,
          startDate: event.start_date || event.startDate,
          endDate: event.end_date || event.endDate,
          eventType: event.event_type || event.eventType,
          isHoliday: event.is_holiday ?? event.isHoliday ?? false,
          isRecurring: event.is_recurring ?? event.isRecurring ?? false,
          isNational: event.is_national ?? event.isNational ?? false,
          affectsClasses: event.affects_classes ?? event.affectsClasses ?? false,
          createdAt: event.created_at || event.createdAt,
          updatedAt: event.updated_at || event.updatedAt,
     };
}

function normalizeEvents(events) {
     return Array.isArray(events) ? events.map(normalizeEvent) : [];
}

export const calendarService = {
     // Obtener todos los calendarios
     getAll: async () => {
          const response = await apiClient.get(ENDPOINTS.CALENDARS.BASE);
          const calendarsData = unwrapApiData(response.data);
          return normalizeCalendars(calendarsData);
     },

     // Obtener calendario por ID
     getById: async (id) => {
          const response = await apiClient.get(ENDPOINTS.CALENDARS.BY_ID(id));
          const calendar = unwrapApiData(response.data);
          return normalizeCalendar(calendar);
     },

     // Obtener calendarios por institución
     getByInstitution: async (institutionId) => {
          const response = await apiClient.get(ENDPOINTS.CALENDARS.BY_INSTITUTION(institutionId));
          const calendarsData = unwrapApiData(response.data);
          return normalizeCalendars(calendarsData);
     },

     // Obtener calendario con sus eventos
     getWithEvents: async (id) => {
          const response = await apiClient.get(ENDPOINTS.CALENDARS.WITH_EVENTS(id));
          const calendar = unwrapApiData(response.data);
          return {
               ...normalizeCalendar(calendar),
               events: normalizeEvents(calendar.events || []),
          };
     },

     // Crear calendario
     create: async (calendarData) => {
          const response = await apiClient.post(ENDPOINTS.CALENDARS.BASE, calendarData);
          const calendar = unwrapApiData(response.data);
          return normalizeCalendar(calendar);
     },

     // Importar calendario (con eventos opcionales)
     import: async (calendarData, eventIds = null) => {
          const url = eventIds && eventIds.length > 0
               ? `${ENDPOINTS.CALENDARS.IMPORT}?eventIds=${eventIds.join(',')}`
               : ENDPOINTS.CALENDARS.IMPORT;
          const response = await apiClient.post(url, calendarData);
          const calendar = unwrapApiData(response.data);
          return normalizeCalendar(calendar);
     },

     // Añadir eventos a calendario
     addEvents: async (calendarId, eventIds) => {
          const response = await apiClient.post(
               ENDPOINTS.CALENDARS.ADD_EVENTS(calendarId),
               { eventIds }
          );
          const calendar = unwrapApiData(response.data);
          return normalizeCalendar(calendar);
     },

     // Actualizar calendario
     update: async (calendarId, calendarData) => {
          const response = await apiClient.put(
               `${ENDPOINTS.CALENDARS.BASE}/${calendarId}`,
               calendarData
          );
          const calendar = unwrapApiData(response.data);
          return normalizeCalendar(calendar);
     },

     // Eliminar calendario (borrado lógico - cambia status a INACTIVE)
     delete: async (calendarId) => {
          await apiClient.delete(`${ENDPOINTS.CALENDARS.BASE}/${calendarId}`);
     },

     // Reactivar calendario (cambiar status de INACTIVE a ACTIVE)
     reactivate: async (calendarId) => {
          const response = await apiClient.post(
               `${ENDPOINTS.CALENDARS.BASE}/${calendarId}/reactivate`
          );
          const calendar = unwrapApiData(response.data);
          return normalizeCalendar(calendar);
     },
};
