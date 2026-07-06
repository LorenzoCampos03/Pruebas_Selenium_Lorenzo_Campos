export const SUPPORT_STATUS = {
     ACTIVE: "ACTIVE",
     INACTIVE: "INACTIVE",
};

export const SUPPORT_STATUS_LABELS = {
     [SUPPORT_STATUS.ACTIVE]: "Activo",
     [SUPPORT_STATUS.INACTIVE]: "Inactivo",
};

export const SUPPORT_TYPES = [
     { value: "COGNITIVO",  label: "Cognitivo"  },
     { value: "MOTOR",      label: "Motor"      },
     { value: "SENSORIAL",  label: "Sensorial"  },
     { value: "EMOCIONAL",  label: "Emocional"  },
     { value: "LENGUAJE",   label: "Lenguaje"   },
     { value: "CONDUCTUAL", label: "Conductual" },
];

export const SUPPORT_TYPE_LABELS = Object.fromEntries(
     SUPPORT_TYPES.map((t) => [t.value, t.label])
);

export function createEmptySupport() {
     return {
          id: null,
          studentId: "",
          classroomId: "",
          institutionId: "",
          academicYear: new Date().getFullYear(),
          diagnosis: "",
          diagnosisDate: "",
          diagnosedBy: "",
          supportType: "",
          description: "",
          adaptationsRequired: [],
          supportMaterials: [],
          specialistInvolved: "",
          progressNotes: "",
          lastReviewDate: "",
          nextReviewDate: "",
          notificationChannels: [],
          customMessage: "",
          notifyParents: false,
          sendImmediately: false,
          status: SUPPORT_STATUS.ACTIVE,
     };
}

export function formatSupportForApi(support) {
     return {
          studentId: support.studentId,
          classroomId: support.classroomId || undefined,
          institutionId: support.institutionId || undefined,
          academicYear: support.academicYear,
          diagnosis: support.diagnosis || undefined,
          diagnosisDate: support.diagnosisDate || undefined,
          diagnosedBy: support.diagnosedBy || undefined,
          supportType: support.supportType,
          description: support.description || undefined,
          adaptationsRequired: support.adaptationsRequired || [],
          supportMaterials: support.supportMaterials || [],
          specialistInvolved: support.specialistInvolved || undefined,
          progressNotes: support.progressNotes || undefined,
          lastReviewDate: support.lastReviewDate || undefined,
          nextReviewDate: support.nextReviewDate || undefined,
          notificationChannels: support.notificationChannels || [],
          customMessage: support.customMessage || undefined,
          notifyParents: support.notifyParents || false,
          sendImmediately: support.sendImmediately || false,
     };
}

export function parseSupportFromApi(apiData) {
     return {
          id: apiData.id,
          studentId: apiData.studentId || "",
          classroomId: apiData.classroomId || "",
          institutionId: apiData.institutionId || "",
          academicYear: apiData.academicYear || new Date().getFullYear(),
          diagnosis: apiData.diagnosis || "",
          diagnosisDate: apiData.diagnosisDate || "",
          diagnosedBy: apiData.diagnosedBy || "",
          supportType: apiData.supportType || "",
          description: apiData.description || "",
          adaptationsRequired: apiData.adaptationsRequired || [],
          supportMaterials: apiData.supportMaterials || [],
          specialistInvolved: apiData.specialistInvolved || "",
          progressNotes: apiData.progressNotes || "",
          lastReviewDate: apiData.lastReviewDate || "",
          nextReviewDate: apiData.nextReviewDate || "",
          notificationChannels: apiData.notificationChannels || [],
          customMessage: apiData.customMessage || "",
          notifyParents: apiData.notifyParents || false,
          sendImmediately: apiData.sendImmediately || false,
          createdAt: apiData.createdAt || null,
          updatedAt: apiData.updatedAt || null,
          status: apiData.status === "A" || apiData.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
     };
}
