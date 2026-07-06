export const APP_NAME = "SIGEI";
export const APP_DESCRIPTION = "Sistema Integrado de Gestión Educativa";
export const COPYRIGHT = "Valle Grande";

export const ROLES = {
     ADMINISTRADOR: "ADMINISTRADOR",
     DIRECTOR: "DIRECTOR",
     SUBDIRECTOR: "SUBDIRECTOR",
     SECRETARIA: "SECRETARIA",
     DOCENTE: "DOCENTE",
     AUXILIAR: "AUXILIAR",
     PSICOLOGO: "PSICOLOGO",
     APODERADO: "APODERADO",
     PADRE: "PADRE",
     MADRE: "MADRE",
};

export const ROLE_ROUTES = {
     [ROLES.ADMINISTRADOR]: "/admin",
     [ROLES.DIRECTOR]: "/direccion",
     [ROLES.SUBDIRECTOR]: "/direccion",
     [ROLES.SECRETARIA]: "/secretaria",
     [ROLES.DOCENTE]: "/docente",
     [ROLES.AUXILIAR]: "/auxiliar",
     [ROLES.PSICOLOGO]: "/psicologo",
     [ROLES.APODERADO]: "/familia",
     [ROLES.PADRE]: "/familia",
     [ROLES.MADRE]: "/familia",
};

export const ROLE_LABELS = {
     [ROLES.ADMINISTRADOR]: "Administrador",
     [ROLES.DIRECTOR]: "Director",
     [ROLES.SUBDIRECTOR]: "Sub Director",
     [ROLES.SECRETARIA]: "Secretaria",
     [ROLES.DOCENTE]: "Docente",
     [ROLES.AUXILIAR]: "Auxiliar",
     [ROLES.PSICOLOGO]: "Psicólogo",
     [ROLES.APODERADO]: "Apoderado",
     [ROLES.PADRE]: "Padre de Familia",
     [ROLES.MADRE]: "Madre de Familia",
};

export function getRouteByRole(role) {
     return ROLE_ROUTES[role] || "/login";
}

export function getRoleLabel(role) {
     return ROLE_LABELS[role] || role;
}

export const STATUS = {
     ACTIVE: "A",
     INACTIVE: "I",
};

export const DOCUMENT_TYPES = ["DNI", "CNE"];

export const GENDERS = {
     M: "Masculino",
     F: "Femenino",
};
