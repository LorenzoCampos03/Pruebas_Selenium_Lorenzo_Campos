export const INSTITUTION_STATUS = {
     ACTIVE: "ACTIVE",
     INACTIVE: "INACTIVE",
};

export const INSTITUTION_STATUS_LABELS = {
     [INSTITUTION_STATUS.ACTIVE]: "Activa",
     [INSTITUTION_STATUS.INACTIVE]: "Inactiva",
};

export const INSTITUTION_LEVELS = [
     "Inicial",
     "Inicial-primaria",
     "Inicial-Primaria-Secundaria",
];

export const INSTITUTION_TYPES = [
     { value: "PUBLICA", label: "Pública" },
     { value: "PRIVADA", label: "Privada" },
     { value: "CONVENIO", label: "Convenio" },
];

export const INSTITUTION_GENDERS = [
     { value: "MIXTO", label: "Mixto" },
     { value: "MASCULINO", label: "Masculino" },
     { value: "FEMENINO", label: "Femenino" },
];

export const GRADING_TYPES = [
     { value: "LITERAL", label: "Literal (AD, A, B, C)" },
     { value: "NUMERICO", label: "Numérico (0-20)" },
];

export const CLASSROOM_TYPES = [
     { value: "POR_EDAD", label: "Por Edad" },
     { value: "POR_GRADO", label: "Por Grado" },
     { value: "MULTIGRADO", label: "Multigrado" },
];

export const SCHEDULE_SHIFTS = [
     { value: "MAÑANA", label: "Mañana" },
     { value: "TARDE", label: "Tarde" },
];

export function createEmptyInstitution() {
     return {
          id: null,
          codeInstitution: "",
          colorInstitution: "",
          modularCode: "",
          name: "",
          institutionType: "",
          level: "",
          gender: "",
          slogan: "",
          logoUrl: "",
          address: {
               department: "",
               province: "",
               district: "",
               urbanization: "",
               reference: "",
          },
          phone: "",
          email: "",
          schedules: [],
          gradingType: "",
          classroomType: "",
          ugel: "",
          dre: "",
          director: "",
          directorData: {
               firstName: "",
               lastName: "",
               motherLastName: "",
               documentType: "DNI",
               documentNumber: "",
               email: "",
               phone: "",
               username: "",
          },
          status: INSTITUTION_STATUS.ACTIVE,
     };
}

export function createEmptySchedule() {
     return { shift: "", startTime: "", endTime: "" };
}

export function formatInstitutionForApi(institution) {
     const contactMethods = [];
     if (institution.phone) {
          contactMethods.push({ type: "PHONE", value: institution.phone });
     }
     if (institution.email) {
          contactMethods.push({ type: "EMAIL", value: institution.email });
     }

     return {
          codeInstitution: institution.codeInstitution || undefined,
          colorInstitution: institution.colorInstitution || undefined,
          modularCode: institution.modularCode,
          name: institution.name,
          institutionType: institution.institutionType || undefined,
          institutionLevel: institution.level,
          gender: institution.gender || undefined,
          slogan: institution.slogan || undefined,
          logoUrl: institution.logoUrl || undefined,
          address: institution.address
               ? {
                    department: institution.address.department,
                    province: institution.address.province,
                    district: institution.address.district,
                    urbanization: institution.address.urbanization || institution.address.detail,
                    reference: institution.address.reference,
               }
               : undefined,
          contactMethods,
          schedules: institution.schedules?.length ? institution.schedules : undefined,
          gradingType: institution.gradingType || undefined,
          classroomType: institution.classroomType || undefined,
          ugel: institution.ugel || undefined,
          dre: institution.dre || undefined,
          directorId: institution.director || undefined,
     };
}

export function parseInstitutionFromApi(apiData) {
     const phone = apiData.contactMethods?.find((c) => c.type?.toUpperCase() === "PHONE")?.value || apiData.phone || "";
     const email = apiData.contactMethods?.find((c) => c.type?.toUpperCase() === "EMAIL")?.value || apiData.email || "";
     const address = apiData.address || {};

     return {
          id: apiData.id,
          codeInstitution: apiData.codeInstitution || "",
          colorInstitution: apiData.colorInstitution || "",
          modularCode: apiData.modularCode || "",
          name: apiData.name || "",
          institutionType: apiData.institutionType || "",
          level: apiData.institutionLevel || apiData.level || "",
          gender: apiData.gender || "",
          slogan: apiData.slogan || "",
          logoUrl: apiData.logoUrl || "",
          address: {
               department: address.department || "",
               province: address.province || "",
               district: address.district || "",
               urbanization: address.urbanization || "",
               reference: address.reference || "",
          },
          phone,
          email,
          schedules: apiData.schedules || [],
          gradingType: apiData.gradingType || "",
          classroomType: apiData.classroomType || "",
          ugel: apiData.ugel || "",
          dre: apiData.dre || "",
          director: apiData.directorId || apiData.director || "",
          status: apiData.status || INSTITUTION_STATUS.ACTIVE,
          createdAt: apiData.createdAt || null,
          updatedAt: apiData.updatedAt || null,
     };
}
