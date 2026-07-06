export const TEACHER_USER_ROLE = "DOCENTE";

export const TEACHER_STATUS = {
     ACTIVE: "ACTIVE",
     INACTIVE: "INACTIVE",
};

export const TEACHER_STATUS_LABELS = {
     [TEACHER_STATUS.ACTIVE]: "Activo",
     [TEACHER_STATUS.INACTIVE]: "Inactivo",
};

export const ASSIGNMENT_STATUS = {
     ACTIVE: "ACTIVE",
     INACTIVE: "INACTIVE",
     DELETED: "DELETED",
};

export const ASSIGNMENT_STATUS_LABELS = {
     [ASSIGNMENT_STATUS.ACTIVE]: "Activa",
     [ASSIGNMENT_STATUS.INACTIVE]: "Inactiva",
     [ASSIGNMENT_STATUS.DELETED]: "Eliminada",
};

export const ASSIGNMENT_TYPE_OPTIONS = [
     { value: "REGULAR", label: "Regular" },
     { value: "SUBSTITUTE", label: "Suplencia" },
     { value: "SUPPORT", label: "Apoyo" },
];

export const SESSION_TYPE_OPTIONS = [
     { value: "REGULAR", label: "Regular" },
     { value: "TUTORIAL", label: "Tutoria" },
     { value: "EXTRA", label: "Extra" },
];

export const DAY_OF_WEEK_OPTIONS = [
     { value: "MONDAY", label: "Lunes", short: "Lun" },
     { value: "TUESDAY", label: "Martes", short: "Mar" },
     { value: "WEDNESDAY", label: "Miércoles", short: "Mié" },
     { value: "THURSDAY", label: "Jueves", short: "Jue" },
     { value: "FRIDAY", label: "Viernes", short: "Vie" },
];

export function createEmptyTeacherUser(institutionId = "") {
     return {
          institutionId,
          firstName: "",
          lastName: "",
          motherLastName: "",
          documentType: "DNI",
          documentNumber: "",
          phone: "",
          address: "",
          email: "",
          role: TEACHER_USER_ROLE,
     };
}

export function parseTeacherUserFromApi(apiData = {}) {
     return {
          id: apiData.id || "",
          institutionId: apiData.institutionId || "",
          firstName: apiData.firstName || "",
          lastName: apiData.lastName || "",
          motherLastName: apiData.motherLastName || "",
          documentType: apiData.documentType || "",
          documentNumber: apiData.documentNumber || "",
          phone: apiData.phone || "",
          address: apiData.address || "",
          email: apiData.email || "",
          userName: apiData.userName || apiData.username || "",
          role: apiData.role || "",
          status: apiData.status || TEACHER_STATUS.ACTIVE,
          photoUrl: apiData.photoUrl || "",
          createdAt: apiData.createdAt || null,
          updatedAt: apiData.updatedAt || null,
          createdBy: apiData.createdBy || "",
          updatedBy: apiData.updatedBy || "",
          fullName: [apiData.firstName, apiData.lastName, apiData.motherLastName]
               .filter(Boolean)
               .join(" "),
     };
}

export function createEmptyAssignment(teacherUserId = "", institutionId = "", academicYear = "") {
     return {
          teacherUserId,
          institutionId,
          assignmentType: "REGULAR",
          startDate: "",
          endDate: "",
          academicYear,
          classroomId: "",
          notes: "",
     };
}

export function isTemporalAssignmentType(assignmentType) {
     return assignmentType === "SUBSTITUTE" || assignmentType === "SUPPORT";
}

export function parseAssignmentFromApi(apiData = {}) {
     return {
          id: apiData.id || "",
          teacherUserId: apiData.teacherUserId || "",
          institutionId: apiData.institutionId || "",
          assignmentType: apiData.assignmentType || "REGULAR",
          status: apiData.status || ASSIGNMENT_STATUS.ACTIVE,
          startDate: apiData.startDate || "",
          endDate: apiData.endDate || "",
          academicYear: apiData.academicYear || "",
          classroomId: apiData.classroomId || "",
          notes: apiData.notes || "",
          createdAt: apiData.createdAt || null,
          updatedAt: apiData.updatedAt || null,
          createdBy: apiData.createdBy || "",
          updatedBy: apiData.updatedBy || "",
     };
}

export function parseScheduleFromApi(apiData = {}) {
     return {
          id: apiData.id || "",
          assignmentId: apiData.assignmentId || "",
          dayOfWeek: apiData.dayOfWeek || "",
          startTime: apiData.startTime || "",
          endTime: apiData.endTime || "",
          sessionType: apiData.sessionType || "REGULAR",
          createdAt: apiData.createdAt || null,
     };
}

export function formatAssignmentType(type) {
     return ASSIGNMENT_TYPE_OPTIONS.find((item) => item.value === type)?.label || type || "-";
}

export function formatDayOfWeek(day) {
     return DAY_OF_WEEK_OPTIONS.find((item) => item.value === day)?.label || day || "-";
}

export function formatSessionType(sessionType) {
     return SESSION_TYPE_OPTIONS.find((item) => item.value === sessionType)?.label || sessionType || "-";
}
