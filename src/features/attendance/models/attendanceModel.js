export const ATTENDANCE_STATUS = {
     PRESENT: "PRESENT",
     ABSENT: "ABSENT",
     LATE: "LATE",
     JUSTIFIED: "JUSTIFIED",
     EXCUSED: "EXCUSED",
};

export const ATTENDANCE_STATUS_LABELS = {
     [ATTENDANCE_STATUS.PRESENT]: "Presente",
     [ATTENDANCE_STATUS.ABSENT]: "Ausente",
     [ATTENDANCE_STATUS.LATE]: "Tardanza",
     [ATTENDANCE_STATUS.JUSTIFIED]: "Justificado",
     [ATTENDANCE_STATUS.EXCUSED]: "Excusado",
};

// Manejo seguro de fechas YYYY-MM-DD sin desfase de zona horaria.
export function toLocalDateFromYmd(dateStr) {
     if (!dateStr || typeof dateStr !== "string") return null;
     const ymd = dateStr.slice(0, 10);
     const [y, m, d] = ymd.split("-").map(Number);
     if (!y || !m || !d) return null;
     return new Date(y, m - 1, d);
}

export function formatYmdToLocaleDate(dateStr, locale = "es-PE", options) {
     const date = toLocalDateFromYmd(dateStr);
     if (!date) return "-";
     return date.toLocaleDateString(locale, options);
}

export function formatAttendanceForApi(attendance) {
     return {
          studentId: attendance.studentId,
          classroomId: attendance.classroomId || undefined,
          institutionId: attendance.institutionId || undefined,
          attendanceDate: attendance.attendanceDate,
          academicYear: attendance.academicYear,
          status: attendance.status,
          arrivalTime: attendance.arrivalTime || undefined,
          departureTime: attendance.departureTime || undefined,
          isJustified: attendance.isJustified || false,
          justificationReason: attendance.justificationReason || undefined,
          justificationDocumentUrl: attendance.justificationDocumentUrl || undefined,
          pickedUpByName: attendance.pickedUpByName || undefined,
          pickedUpByRelationship: attendance.pickedUpByRelationship || undefined,
          pickedUpByDni: attendance.pickedUpByDni || undefined,
          pickupTime: attendance.pickupTime || undefined,
          pickupNotes: attendance.pickupNotes || undefined,
          registeredBy: attendance.registeredBy || undefined,
     };
}

export function parseAttendanceFromApi(apiData) {
     return {
          id: apiData.id,
          studentId: apiData.studentId || "",
          classroomId: apiData.classroomId || "",
          institutionId: apiData.institutionId || "",
          attendanceDate: apiData.attendanceDate || "",
          academicYear: apiData.academicYear || new Date().getFullYear(),
          status: apiData.status || ATTENDANCE_STATUS.PRESENT,
          arrivalTime: apiData.arrivalTime || "",
          departureTime: apiData.departureTime || "",
          isJustified: apiData.isJustified || false,
          justificationReason: apiData.justificationReason || "",
          justificationDocumentUrl: apiData.justificationDocumentUrl || "",
          pickedUpByName: apiData.pickedUpByName || "",
          pickedUpByRelationship: apiData.pickedUpByRelationship || "",
          pickedUpByDni: apiData.pickedUpByDni || "",
          pickupTime: apiData.pickupTime || "",
          pickupNotes: apiData.pickupNotes || "",
          registeredBy: apiData.registeredBy || "",
          createdAt: apiData.createdAt || null,
          updatedAt: apiData.updatedAt || null,
     };
}
