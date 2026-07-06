// Event Types (basado en el backend)
export const EVENT_TYPES = {
     CIVICO: "CIVICO",
     CULTURAL: "CULTURAL",
     RELIGIOSO: "RELIGIOSO",
     INSTITUCIONAL: "INSTITUCIONAL",
     INCIDENTE: "INCIDENTE",
};

export const EVENT_TYPE_LABELS = {
     [EVENT_TYPES.CIVICO]: "Cívico",
     [EVENT_TYPES.CULTURAL]: "Cultural",
     [EVENT_TYPES.RELIGIOSO]: "Religioso",
     [EVENT_TYPES.INSTITUCIONAL]: "Institucional",
     [EVENT_TYPES.INCIDENTE]: "Incidente",
};

export const EVENT_TYPE_OPTIONS = Object.keys(EVENT_TYPES).map((key) => ({
     value: EVENT_TYPES[key],
     label: EVENT_TYPE_LABELS[EVENT_TYPES[key]],
}));

// Event Status
export const EVENT_STATUS = {
     ACTIVE: "ACTIVE",
     INACTIVE: "INACTIVE",
};

export const EVENT_STATUS_LABELS = {
     [EVENT_STATUS.ACTIVE]: "Activo",
     [EVENT_STATUS.INACTIVE]: "Inactivo",
};

// Fechas Cívicas Peruanas Predefinidas
export const PERU_CIVIC_DATES = [
     { month: 1, day: 1, title: "Año Nuevo", type: "CIVICO", isNational: true, affectsClasses: true },
     { month: 1, day: 6, title: "Día de Reyes", type: "RELIGIOSO", isNational: false, affectsClasses: false },
     { month: 5, day: 1, title: "Día del Trabajo", type: "CIVICO", isNational: true, affectsClasses: true },
     { month: 6, day: 29, title: "Día de San Pedro y San Pablo", type: "RELIGIOSO", isNational: true, affectsClasses: true },
     { month: 7, day: 28, title: "Fiesta Nacional del Perú (Independencia)", type: "CIVICO", isNational: true, affectsClasses: true },
     { month: 7, day: 29, title: "Fiesta Nacional del Perú (Independencia)", type: "CIVICO", isNational: true, affectsClasses: true },
     { month: 10, day: 8, title: "Combate de Angamos", type: "CIVICO", isNational: true, affectsClasses: false },
     { month: 11, day: 1, title: "Día de Todos los Santos", type: "RELIGIOSO", isNational: false, affectsClasses: false },
     { month: 12, day: 8, title: "Día de la Inmaculada Concepción", type: "RELIGIOSO", isNational: false, affectsClasses: false },
     { month: 12, day: 25, title: "Navidad", type: "RELIGIOSO", isNational: true, affectsClasses: true },
];

// Generar eventos cívicos peruanos para un año específico
export function generatePeruCivicEventsForYear(academicYear) {
     return PERU_CIVIC_DATES.map(date => ({
          title: date.title,
          description: "Fecha cívica de Perú",
          startDate: `${academicYear}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
          endDate: `${academicYear}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
          eventType: date.type,
          isHoliday: date.isNational || false,
          isRecurring: true,
          isNational: date.isNational || false,
          affectsClasses: date.affectsClasses || false,
     }));
}

// Verificar si los eventos cívicos peruanos ya están agregados al calendario
export function hasPeruCivicDatesIncluded(calendarEvents = []) {
     if (!Array.isArray(calendarEvents) || calendarEvents.length === 0) {
          return false;
     }

     // Obtener los títulos de los eventos cívicos peruanos
     const civicTitles = new Set(PERU_CIVIC_DATES.map(date => date.title));

     // Contar cuántos eventos cívicos están presentes en el calendario
     const foundCivicCount = calendarEvents.filter(event => 
          civicTitles.has(event.title)
     ).length;

     // Retornar verdadero si todos los 10 eventos cívicos están presentes
     return foundCivicCount === PERU_CIVIC_DATES.length;
}

// Factory para crear evento vacío
export function createEmptyEvent() {
     return {
          title: "",
          description: "",
          startDate: "",
          endDate: "",
          eventType: EVENT_TYPES.CIVICO,
          isHoliday: false,
          isRecurring: false,
          isNational: false,
          affectsClasses: false,
          notificationChannels: [],
          customMessage: "",
          targetRoles: [],
          isNotificationScheduled: false,
          sendImmediately: false,
     };
}

// Factory para crear evento vacío CON AÑO PREFIJADO del calendario académico
export function createEmptyEventWithYear(academicYear) {
     // Establecer startDate al primer día del año académico (YYYY-01-01)
     // endDate queda vacío para que el usuario lo complete
     return {
          title: "",
          description: "",
          startDate: `${academicYear}-01-01`,
          endDate: "",
          eventType: EVENT_TYPES.CIVICO,
          isHoliday: false,
          isRecurring: false,
          isNational: false,
          affectsClasses: false,
          notificationChannels: [],
          customMessage: "",
          targetRoles: [],
          isNotificationScheduled: false,
          sendImmediately: false,
     };
}

// Formatear para enviar al backend (CREATE)
export function formatEventForCreate(event, institutionId, userId) {
     return {
          institutionId,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          eventType: event.eventType,
          isHoliday: event.isHoliday || false,
          isRecurring: event.isRecurring || false,
          isNational: event.isNational || false,
          affectsClasses: event.affectsClasses || false,
          notificationChannels: event.notificationChannels || [],
          customMessage: event.customMessage || "",
          targetRoles: event.targetRoles || [],
          isNotificationScheduled: event.isNotificationScheduled || false,
          sendImmediately: event.sendImmediately || false,
          createdBy: userId,
     };
}

// Formatear para actualizar (UPDATE)
export function formatEventForUpdate(event) {
     return {
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          eventType: event.eventType,
          isHoliday: event.isHoliday || false,
          isRecurring: event.isRecurring || false,
          isNational: event.isNational || false,
          affectsClasses: event.affectsClasses || false,
          notificationChannels: event.notificationChannels || [],
          customMessage: event.customMessage || "",
          targetRoles: event.targetRoles || [],
          isNotificationScheduled: event.isNotificationScheduled || false,
          sendImmediately: event.sendImmediately || false,
     };
}
