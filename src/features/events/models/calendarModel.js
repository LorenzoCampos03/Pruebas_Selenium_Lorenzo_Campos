// Calendar Model - Calendarios académicos que agrupan eventos

// Factory para crear calendario vacío
export function createEmptyCalendar() {
     return {
          institutionId: "",
          academicYear: new Date().getFullYear(),
          academicYearName: "",  // Se mapea desde academic_year_name del backend
          startDate: "",
          endDate: "",
          includeCivicDates: false,  // Campo local para agregar fechas cívicas automáticamente
     };
}

// Formatear para enviar al backend (CREATE)
export function formatCalendarForCreate(calendar, institutionId) {
     return {
          institutionId: institutionId,
          academicYear: parseInt(calendar.academicYear),
          academicYearName: calendar.academicYearName && calendar.academicYearName.trim() ? calendar.academicYearName.trim() : null,
          startDate: calendar.startDate,
          endDate: calendar.endDate,
          status: "ACTIVE"
     };
}

// Validar fechas del calendario
export function validateCalendarDates(startDate, endDate) {
     if (!startDate || !endDate) {
          return { valid: false, message: "Las fechas de inicio y fin son obligatorias" };
     }
     
     if (new Date(startDate) >= new Date(endDate)) {
          return { valid: false, message: "La fecha de inicio debe ser anterior a la fecha de fin" };
     }
     
     return { valid: true };
}

// Obtener el año académico del calendario
export function getAcademicYearLabel(calendar) {
     if (calendar.academicYearName) {
          return `${calendar.academicYear} - ${calendar.academicYearName}`;
     }
     return `${calendar.academicYear}`;
}

// Verificar si el calendario está activo (dentro del rango de fechas)
export function isCalendarActive(calendar) {
     const now = new Date();
     const start = new Date(calendar.startDate);
     const end = new Date(calendar.endDate);
     return now >= start && now <= end;
}

// Calcular duración del calendario en días
export function getCalendarDuration(calendar) {
     const start = new Date(calendar.startDate);
     const end = new Date(calendar.endDate);
     const diffTime = Math.abs(end - start);
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
     return diffDays;
}

// Formatear para enviar al backend (UPDATE)
export function formatCalendarForUpdate(calendar) {
     return {
          academicYear: parseInt(calendar.academicYear),
          academicYearName: calendar.academicYearName && calendar.academicYearName.trim() ? calendar.academicYearName.trim() : null,
          startDate: calendar.startDate,
          endDate: calendar.endDate,
     };
}

// Verificar si el calendario está inactivo (borrado lógicamente)
export function isCalendarInactive(calendar) {
     return calendar.status === "INACTIVE";
}

// Verificar si el calendario está activo (estado)
export function isCalendarActiveStatus(calendar) {
     return calendar.status === "ACTIVE";
}
