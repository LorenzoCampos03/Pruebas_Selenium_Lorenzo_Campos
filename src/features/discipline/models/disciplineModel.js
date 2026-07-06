
export const INCIDENT_TYPE = {
     PHYSICAL: "PHYSICAL",
     VERBAL: "VERBAL",
     BULLYING: "BULLYING",
     DISRUPTION: "DISRUPTION",
     VANDALISM: "VANDALISM",
     OTHER: "OTHER",
};

export const INCIDENT_TYPE_LABELS = {
     [INCIDENT_TYPE.PHYSICAL]: "Físico",
     [INCIDENT_TYPE.VERBAL]: "Verbal",
     [INCIDENT_TYPE.BULLYING]: "Acoso",
     [INCIDENT_TYPE.DISRUPTION]: "Interrupción",
     [INCIDENT_TYPE.VANDALISM]: "Vandalismo",
     [INCIDENT_TYPE.OTHER]: "Otro",
};


export const SEVERITY_LEVEL = {
     LOW: "LOW",
     MEDIUM: "MEDIUM",
     HIGH: "HIGH",
     CRITICAL: "CRITICAL",
};

export const SEVERITY_LEVEL_LABELS = {
     [SEVERITY_LEVEL.LOW]: "Leve",
     [SEVERITY_LEVEL.MEDIUM]: "Moderado",
     [SEVERITY_LEVEL.HIGH]: "Grave",
     [SEVERITY_LEVEL.CRITICAL]: "Crítico",
};


export const INCIDENT_STATUS = {
     OPEN: "OPEN",
     IN_PROGRESS: "IN_PROGRESS",
     RESOLVED: "RESOLVED",
     CLOSED: "CLOSED",
};

export const INCIDENT_STATUS_LABELS = {
     [INCIDENT_STATUS.OPEN]: "Abierto",
     [INCIDENT_STATUS.IN_PROGRESS]: "En Proceso",
     [INCIDENT_STATUS.RESOLVED]: "Resuelto",
     [INCIDENT_STATUS.CLOSED]: "Cerrado",
};


export const SEVERITY_VARIANT = {
     [SEVERITY_LEVEL.LOW]: "info",
     [SEVERITY_LEVEL.MEDIUM]: "warning",
     [SEVERITY_LEVEL.HIGH]: "danger",
     [SEVERITY_LEVEL.CRITICAL]: "purple",
};

export const STATUS_VARIANT = {
     [INCIDENT_STATUS.OPEN]: "danger",
     [INCIDENT_STATUS.IN_PROGRESS]: "warning",
     [INCIDENT_STATUS.RESOLVED]: "success",
     [INCIDENT_STATUS.CLOSED]: "gray",
};

export function createEmptyIncident() {
     return {
          id: null,
          studentId: "",
          classroomId: "",
          institutionId: "",
          incidentDate: new Date().toISOString().split("T")[0],
          incidentTime: new Date().toTimeString().slice(0, 5),
          academicYear: new Date().getFullYear(),
          incidentType: INCIDENT_TYPE.OTHER,
          severityLevel: SEVERITY_LEVEL.LOW,
          description: "",
          location: "",
          witnesses: "",
          otherStudentsInvolved: [],
          immediateAction: "",
          parentsNotified: false,
          followUpRequired: false,
          reportedBy: "",
          status: INCIDENT_STATUS.OPEN,
          invalidated: false,
          invalidatedBy: "",
          invalidatedAt: null,
          invalidationReason: "",
     };
}

export function formatIncidentForCreate(incident) {
     return {
          studentId: incident.studentId,
          classroomId: incident.classroomId || undefined,
          institutionId: incident.institutionId || undefined,
          incidentDate: incident.incidentDate,
          incidentTime: incident.incidentTime ? `${incident.incidentTime}:00` : undefined,
          academicYear: incident.academicYear ? Number(incident.academicYear) : undefined,
          incidentType: incident.incidentType,
          severityLevel: incident.severityLevel,
          description: incident.description,
          location: incident.location || undefined,
          witnesses: incident.witnesses || undefined,
          otherStudentsInvolved: incident.otherStudentsInvolved?.length ? incident.otherStudentsInvolved : undefined,
          immediateAction: incident.immediateAction || undefined,
          parentsNotified: incident.parentsNotified ?? false,
          reportedBy: incident.reportedBy,
     };
}

export function formatIncidentForUpdate(incident) {
     return {
          incidentType: incident.incidentType,
          severityLevel: incident.severityLevel,
          description: incident.description,
          location: incident.location || undefined,
          witnesses: incident.witnesses || undefined,
          otherStudentsInvolved: incident.otherStudentsInvolved?.length ? incident.otherStudentsInvolved : undefined,
          immediateAction: incident.immediateAction || undefined,
          parentsNotified: incident.parentsNotified ?? false,
          followUpRequired: incident.followUpRequired ?? false,
     };
}

export function parseIncidentFromApi(apiData) {
     return {
          id: apiData.id,
          studentId: apiData.studentId || "",
          classroomId: apiData.classroomId || "",
          institutionId: apiData.institutionId || "",
          incidentDate: apiData.incidentDate || "",
          incidentTime: apiData.incidentTime ? apiData.incidentTime.slice(0, 5) : "",
          academicYear: apiData.academicYear || new Date().getFullYear(),
          incidentType: apiData.incidentType || INCIDENT_TYPE.OTHER,
          severityLevel: apiData.severityLevel || SEVERITY_LEVEL.LOW,
          description: apiData.description || "",
          location: apiData.location || "",
          witnesses: apiData.witnesses || "",
          otherStudentsInvolved: apiData.otherStudentsInvolved || [],
          immediateAction: apiData.immediateAction || "",
          parentsNotified: apiData.parentsNotified ?? false,
          notificationDate: apiData.notificationDate || null,
          followUpRequired: apiData.followUpRequired ?? false,
          status: apiData.status || INCIDENT_STATUS.OPEN,
          reportedBy: apiData.reportedBy || "",
          reportedAt: apiData.reportedAt || null,
          resolvedBy: apiData.resolvedBy || null,
          resolvedAt: apiData.resolvedAt || null,
          invalidated: apiData.invalidated ?? false,
          invalidatedBy: apiData.invalidatedBy || "",
          invalidatedAt: apiData.invalidatedAt || null,
          invalidationReason: apiData.invalidationReason || "",
     };
}
