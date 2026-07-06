export const USER_STATUS = {
     ACTIVE: "A",
     INACTIVE: "I",
};

export const USER_STATUS_LABELS = {
     [USER_STATUS.ACTIVE]: "Activo",
     [USER_STATUS.INACTIVE]: "Inactivo",
};

export const USER_ROLES = [
     "ADMINISTRADOR",
     "DIRECTOR",
     "SUBDIRECTOR",
     "SECRETARIA",
     "DOCENTE",
     "AUXILIAR",
     "PSICOLOGO",
     "APODERADO",
     "PADRE",
     "MADRE",
];

export function createEmptyUser() {
     return {
          id: null,
          username: "",
          email: "",
          firstName: "",
          lastName: "",
          documentType: "DNI",
          documentNumber: "",
          phone: "",
          role: "",
          institutionId: "",
          status: USER_STATUS.ACTIVE,
     };
}

export function formatUserForApi(user) {
     return {
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          documentType: user.documentType,
          documentNumber: user.documentNumber,
          phone: user.phone,
          role: user.role,
          institutionId: user.institutionId,
     };
}

export function parseUserFromApi(apiData) {
     return {
          id: apiData.id,
          username: apiData.username || "",
          email: apiData.email || "",
          firstName: apiData.firstName || "",
          lastName: apiData.lastName || "",
          documentType: apiData.documentType || "DNI",
          documentNumber: apiData.documentNumber || "",
          phone: apiData.phone || "",
          role: apiData.role || "",
          institutionId: apiData.institutionId || "",
          status: apiData.status || USER_STATUS.ACTIVE,
          createdAt: apiData.createdAt || null,
          updatedAt: apiData.updatedAt || null,
          createdBy: apiData.createdBy || "",
          updatedBy: apiData.updatedBy || "",
          photoUrl: apiData.photoUrl || "",
     };
}
