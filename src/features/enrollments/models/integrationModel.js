/**
 * Integration Model
 * Define las estructuras de datos para integraciones con microservicios externos
 */

// Constantes de estado de estudiantes
export const STUDENT_STATUS = {
  ACTIVE: "A",
  INACTIVE: "I",
  TRANSFERRED: "T",
  GRADUATED: "G",
};

export const STUDENT_STATUS_LABELS = {
  [STUDENT_STATUS.ACTIVE]: "Activo",
  [STUDENT_STATUS.INACTIVE]: "Inactivo",
  [STUDENT_STATUS.TRANSFERRED]: "Transferido",
  [STUDENT_STATUS.GRADUATED]: "Graduado",
};

// Constantes de estado de instituciones
export const INSTITUTION_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const INSTITUTION_STATUS_LABELS = {
  [INSTITUTION_STATUS.ACTIVE]: "Activo",
  [INSTITUTION_STATUS.INACTIVE]: "Inactivo",
};

// Constantes de estado de aulas
export const CLASSROOM_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const CLASSROOM_STATUS_LABELS = {
  [CLASSROOM_STATUS.ACTIVE]: "Activo",
  [CLASSROOM_STATUS.INACTIVE]: "Inactivo",
};

/**
 * Crea una instancia vacía de integración
 * @returns {Object} Objeto integration con valores por defecto
 */
export function createEmptyIntegration() {
  return {
    id: null,
    enrollmentId: "",
    integrationType: "",
    integrationData: {},
    status: "PENDING",
    errorMessage: null,
  };
}

/**
 * Formatea una integración para enviar a la API
 * @param {Object} integration - Objeto integration del formulario
 * @returns {Object} Payload formateado para la API
 */
export function formatIntegrationForApi(integration) {
  const payload = {
    enrollmentId: integration.enrollmentId,
    integrationType: integration.integrationType,
    integrationData: integration.integrationData || {},
  };

  if (integration.status) {
    payload.status = integration.status;
  }

  return payload;
}

/**
 * Parsea una integración desde la respuesta de la API
 * @param {Object} data - Datos de la integración desde la API
 * @returns {Object} Objeto integration normalizado
 */
export function parseIntegrationFromApi(data) {
  return {
    id: data.id || null,
    enrollmentId: data.enrollmentId || "",
    integrationType: data.integrationType || "",
    integrationData: data.integrationData || {},
    status: data.status || "PENDING",
    errorMessage: data.errorMessage || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

/**
 * Parsea datos de estudiante desde el microservicio de estudiantes
 * @param {Object} data - Datos del estudiante desde la API externa
 * @returns {Object} Objeto student normalizado
 */
export function parseStudentFromIntegration(data) {
  return {
    studentId: data.studentId || "",
    cui: data.cui || "",
    names: data.personalInfo?.names || "",
    lastNames: data.personalInfo?.lastNames || "",
    documentType: data.personalInfo?.documentType || "",
    documentNumber: data.personalInfo?.documentNumber || "",
    gender: data.personalInfo?.gender || "",
    dateOfBirth: data.dateOfBirth || "",
    address: data.address || "",
    photoPerfil: data.photoPerfil || "",
    status: data.status || STUDENT_STATUS.ACTIVE,
    institutionId: data.institutionId || "",
    classroomId: data.classroomId || "",
    guardians: data.guardians || [],
  };
}

/**
 * Parsea datos de institución desde el microservicio de instituciones
 * @param {Object} data - Datos de la institución desde la API externa
 * @returns {Object} Objeto institution normalizado
 */
export function parseInstitutionFromIntegration(data) {
  return {
    id: data.id || "",
    codeInstitution: data.codeInstitution || "",
    modularCode: data.modularCode || "",
    name: data.name || "",
    institutionType: data.institutionType || "",
    institutionLevel: data.institutionLevel || "",
    gender: data.gender || "",
    slogan: data.slogan || "",
    logoUrl: data.logoUrl || "",
    address: data.address || {},
    contactMethods: data.contactMethods || [],
    schedules: data.schedules || [],
    gradingType: data.gradingType || "",
    classroomType: data.classroomType || "",
    ugel: data.ugel || "",
    dre: data.dre || "",
    directorId: data.directorId || "",
    status: data.status || INSTITUTION_STATUS.ACTIVE,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    deletedAt: data.deletedAt || null,
  };
}

/**
 * Parsea datos de aula desde el microservicio de instituciones
 * @param {Object} data - Datos del aula desde la API externa
 * @returns {Object} Objeto classroom normalizado
 */
export function parseClassroomFromIntegration(data) {
  return {
    classroomId: data.classroomId || "",
    institutionId: data.institutionId || "",
    classroomName: data.classroomName || "",
    classroomAge: data.classroomAge || "",
    capacity: data.capacity || 0,
    color: data.color || "",
    status: data.status || CLASSROOM_STATUS.ACTIVE,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

/**
 * Parsea respuesta de validación de matrícula
 * @param {Object} data - Datos de validación desde la API
 * @returns {Object} Objeto validation normalizado
 */
export function parseEnrollmentValidationFromApi(data) {
  return {
    studentValid: data.studentValid || false,
    institutionValid: data.institutionValid || false,
    classroomValid: data.classroomValid || false,
    studentName: data.studentName || "",
    institutionName: data.institutionName || "",
    classroomName: data.classroomName || "",
    classroomCapacity: data.classroomCapacity || 0,
    validationMessage: data.validationMessage || "",
    valid: data.valid || false,
  };
}

/**
 * Valida si los datos de integración son válidos
 * @param {Object} integration - Objeto integration a validar
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateIntegration(integration) {
  const errors = {};

  if (!integration.enrollmentId) {
    errors.enrollmentId = "El ID de matrícula es requerido";
  }
  if (!integration.integrationType) {
    errors.integrationType = "El tipo de integración es requerido";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Verifica si una integración fue exitosa
 * @param {Object} integration - Objeto integration
 * @returns {boolean} true si fue exitosa
 */
export function isIntegrationSuccessful(integration) {
  return integration.status === "SUCCESS";
}

/**
 * Verifica si una integración falló
 * @param {Object} integration - Objeto integration
 * @returns {boolean} true si falló
 */
export function isIntegrationFailed(integration) {
  return integration.status === "FAILED";
}

/**
 * Verifica si una integración está pendiente
 * @param {Object} integration - Objeto integration
 * @returns {boolean} true si está pendiente
 */
export function isIntegrationPending(integration) {
  return integration.status === "PENDING";
}
