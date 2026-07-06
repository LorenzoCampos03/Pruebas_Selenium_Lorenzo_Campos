/**
 * Enrollment Model
 * Define las estructuras de datos y transformaciones para el módulo de Matrículas
 */

// Constantes de estado de matrícula
export const ENROLLMENT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
  CANCELLED: "CANCELLED",
};

export const ENROLLMENT_STATUS_LABELS = {
  [ENROLLMENT_STATUS.ACTIVE]: "Activo",
  [ENROLLMENT_STATUS.INACTIVE]: "Inactivo",
  [ENROLLMENT_STATUS.PENDING]: "Pendiente",
  [ENROLLMENT_STATUS.CANCELLED]: "Cancelado",
};

// Constantes de tipo de matrícula
export const ENROLLMENT_TYPE = {
  NUEVA: "NUEVA",
  REINSCRIPCION: "REINSCRIPCION",
};

export const ENROLLMENT_TYPE_LABELS = {
  [ENROLLMENT_TYPE.NUEVA]: "Nueva",
  [ENROLLMENT_TYPE.REINSCRIPCION]: "Reinscripción",
};

// Lista de documentos requeridos
export const REQUIRED_DOCUMENTS = [
  { key: "birthCertificate", label: "Certificado de Nacimiento", required: true },
  { key: "studentDni", label: "DNI del Estudiante", required: true },
  { key: "guardianDni", label: "DNI del Apoderado", required: true },
  { key: "vaccinationCard", label: "Carné de Vacunación", required: true },
  { key: "disabilityCertificate", label: "Certificado de Discapacidad", required: false },
  { key: "utilityBill", label: "Recibo de Servicios", required: true },
  { key: "psychologicalReport", label: "Informe Psicológico", required: false },
  { key: "studentPhoto", label: "Foto del Estudiante", required: true },
  { key: "healthRecord", label: "Ficha de Salud", required: true },
  { key: "signedEnrollmentForm", label: "Formulario de Matrícula Firmado", required: true },
  { key: "dniVerification", label: "Verificación de DNI", required: true },
];

// Función auxiliar para obtener el nombre del campo URL de un documento
export const getDocumentUrlKey = (docKey) => `${docKey}Url`;

/**
 * Crea una instancia vacía de enrollment
 * @param {string} userInstitutionId - ID de la institución del usuario autenticado
 * @returns {Object} Objeto enrollment con valores por defecto
 */
export function createEmptyEnrollment(userInstitutionId = "") {
  return {
    id: null,
    studentId: "",
    institutionId: userInstitutionId, // Usar la institución del usuario autenticado
    classroomId: "",
    academicYear: new Date().getFullYear().toString(),
    academicPeriodId: "",
    enrollmentDate: "",
    enrollmentStatus: ENROLLMENT_STATUS.PENDING,
    enrollmentType: ENROLLMENT_TYPE.NUEVA,
    previousInstitution: "",
    observations: "",
    ageGroup: "",
    shift: "",
    section: "",
    modality: "",
    educationalLevel: "INITIAL",
    studentAge: null,
    enrollmentCode: "",
    // Documentos requeridos (checkboxes)
    birthCertificate: false,
    studentDni: false,
    guardianDni: false,
    vaccinationCard: false,
    disabilityCertificate: false,
    utilityBill: false,
    psychologicalReport: false,
    studentPhoto: false,
    healthRecord: false,
    signedEnrollmentForm: false,
    dniVerification: false,
    // URLs de documentos
    birthCertificateUrl: null,
    studentDniUrl: null,
    guardianDniUrl: null,
    vaccinationCardUrl: null,
    disabilityCertificateUrl: null,
    utilityBillUrl: null,
    psychologicalReportUrl: null,
    studentPhotoUrl: null,
    healthRecordUrl: null,
    signedEnrollmentFormUrl: null,
    dniVerificationUrl: null,
  };
}

/**
 * Formatea un enrollment para enviar a la API
 * @param {Object} enrollment - Objeto enrollment del formulario
 * @returns {Object} Payload formateado para la API
 */
export function formatEnrollmentForApi(enrollment) {
  // Formatear fecha para LocalDateTime del backend (YYYY-MM-DDTHH:mm:ss)
  const formatDateForBackend = (dateString) => {
    if (!dateString) {
      const now = new Date();
      return now.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
    }
    // Si ya tiene formato de fecha, convertir a LocalDateTime
    const date = new Date(dateString);
    return date.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  };

  const payload = {
    studentId: enrollment.studentId,
    institutionId: enrollment.institutionId,
    classroomId: enrollment.classroomId,
    academicYear: enrollment.academicYear,
    academicPeriodId: enrollment.academicPeriodId,
    enrollmentDate: formatDateForBackend(enrollment.enrollmentDate),
    ageGroup: enrollment.ageGroup,
    shift: enrollment.shift,
    modality: enrollment.modality,
  };

  // Campos opcionales
  if (enrollment.enrollmentStatus) payload.enrollmentStatus = enrollment.enrollmentStatus;
  if (enrollment.enrollmentType) payload.enrollmentType = enrollment.enrollmentType;
  if (enrollment.previousInstitution) payload.previousInstitution = enrollment.previousInstitution;
  if (enrollment.observations) payload.observations = enrollment.observations;
  if (enrollment.educationalLevel) payload.educationalLevel = enrollment.educationalLevel;
  if (enrollment.studentAge) payload.studentAge = enrollment.studentAge;
  if (enrollment.enrollmentCode) payload.enrollmentCode = enrollment.enrollmentCode;

  // Documentos (convertir a Boolean explícitamente)
  payload.birthCertificate = enrollment.birthCertificate === true;
  payload.studentDni = enrollment.studentDni === true;
  payload.guardianDni = enrollment.guardianDni === true;
  payload.vaccinationCard = enrollment.vaccinationCard === true;
  payload.disabilityCertificate = enrollment.disabilityCertificate === true;
  payload.utilityBill = enrollment.utilityBill === true;
  payload.psychologicalReport = enrollment.psychologicalReport === true;
  payload.studentPhoto = enrollment.studentPhoto === true;
  payload.healthRecord = enrollment.healthRecord === true;
  payload.signedEnrollmentForm = enrollment.signedEnrollmentForm === true;
  payload.dniVerification = enrollment.dniVerification === true;

  // URLs de documentos
  if (enrollment.birthCertificateUrl) payload.birthCertificateUrl = enrollment.birthCertificateUrl;
  if (enrollment.studentDniUrl) payload.studentDniUrl = enrollment.studentDniUrl;
  if (enrollment.guardianDniUrl) payload.guardianDniUrl = enrollment.guardianDniUrl;
  if (enrollment.vaccinationCardUrl) payload.vaccinationCardUrl = enrollment.vaccinationCardUrl;
  if (enrollment.disabilityCertificateUrl) payload.disabilityCertificateUrl = enrollment.disabilityCertificateUrl;
  if (enrollment.utilityBillUrl) payload.utilityBillUrl = enrollment.utilityBillUrl;
  if (enrollment.psychologicalReportUrl) payload.psychologicalReportUrl = enrollment.psychologicalReportUrl;
  if (enrollment.studentPhotoUrl) payload.studentPhotoUrl = enrollment.studentPhotoUrl;
  if (enrollment.healthRecordUrl) payload.healthRecordUrl = enrollment.healthRecordUrl;
  if (enrollment.signedEnrollmentFormUrl) payload.signedEnrollmentFormUrl = enrollment.signedEnrollmentFormUrl;
  if (enrollment.dniVerificationUrl) payload.dniVerificationUrl = enrollment.dniVerificationUrl;

  console.log("📋 Payload formateado:", payload);
  return payload;
}

/**
 * Formatea un enrollment para actualización (solo campos modificados)
 * @param {Object} enrollment - Objeto enrollment con cambios
 * @returns {Object} Payload con solo los campos a actualizar
 */
export function formatEnrollmentUpdateForApi(enrollment) {
  const payload = {};

  // Campos base de la matrícula
  const baseFields = [
    "studentId", "institutionId", "classroomId", "academicYear", "academicPeriodId",
    "enrollmentStatus", "enrollmentType", "previousInstitution", "observations",
    "ageGroup", "shift", "modality", "educationalLevel", "studentAge",
    "enrollmentCode"
  ];
  baseFields.forEach((field) => {
    if (enrollment[field] !== undefined && enrollment[field] !== null) {
      payload[field] = enrollment[field];
    }
  });

  // Documentos booleanos — siempre incluirlos explícitamente
  const docBooleanFields = [
    "birthCertificate", "studentDni", "guardianDni", "vaccinationCard",
    "disabilityCertificate", "utilityBill", "psychologicalReport", "studentPhoto",
    "healthRecord", "signedEnrollmentForm", "dniVerification"
  ];
  docBooleanFields.forEach((field) => {
    payload[field] = enrollment[field] === true;
  });

  // URLs de documentos — siempre incluirlas (incluso si son null)
  const docUrlFields = [
    "birthCertificateUrl", "studentDniUrl", "guardianDniUrl", "vaccinationCardUrl",
    "disabilityCertificateUrl", "utilityBillUrl", "psychologicalReportUrl", "studentPhotoUrl",
    "healthRecordUrl", "signedEnrollmentFormUrl", "dniVerificationUrl"
  ];
  docUrlFields.forEach((field) => {
    payload[field] = enrollment[field] || null;
  });

  console.log("📝 Payload de actualización formateado:", JSON.stringify(payload, null, 2));
  
  return payload;
}

/**
 * Parsea un enrollment desde la respuesta de la API
 * @param {Object} data - Datos del enrollment desde la API
 * @returns {Object} Objeto enrollment normalizado
 */
export function parseEnrollmentFromApi(data) {
  return {
    id: data.id || null,
    studentId: data.studentId || "",
    institutionId: data.institutionId || "",
    classroomId: data.classroomId || "",
    academicYear: data.academicYear || "",
    academicPeriodId: data.academicPeriodId || "",
    enrollmentDate: data.enrollmentDate || "",
    enrollmentStatus: data.enrollmentStatus || ENROLLMENT_STATUS.PENDING,
    enrollmentType: data.enrollmentType || ENROLLMENT_TYPE.NUEVA,
    previousInstitution: data.previousInstitution || "",
    observations: data.observations || "",
    ageGroup: data.ageGroup || "",
    shift: data.shift || "",
    section: data.section || "",
    modality: data.modality || "",
    educationalLevel: data.educationalLevel || "INITIAL",
    studentAge: data.studentAge || null,
    enrollmentCode: data.enrollmentCode || "",
    // Documentos (checkboxes)
    birthCertificate: data.birthCertificate || false,
    studentDni: data.studentDni || false,
    guardianDni: data.guardianDni || false,
    vaccinationCard: data.vaccinationCard || false,
    disabilityCertificate: data.disabilityCertificate || false,
    utilityBill: data.utilityBill || false,
    psychologicalReport: data.psychologicalReport || false,
    studentPhoto: data.studentPhoto || false,
    healthRecord: data.healthRecord || false,
    signedEnrollmentForm: data.signedEnrollmentForm || false,
    dniVerification: data.dniVerification || false,
    // URLs de documentos
    birthCertificateUrl: data.birthCertificateUrl || null,
    studentDniUrl: data.studentDniUrl || null,
    guardianDniUrl: data.guardianDniUrl || null,
    vaccinationCardUrl: data.vaccinationCardUrl || null,
    disabilityCertificateUrl: data.disabilityCertificateUrl || null,
    utilityBillUrl: data.utilityBillUrl || null,
    psychologicalReportUrl: data.psychologicalReportUrl || null,
    studentPhotoUrl: data.studentPhotoUrl || null,
    healthRecordUrl: data.healthRecordUrl || null,
    signedEnrollmentFormUrl: data.signedEnrollmentFormUrl || null,
    dniVerificationUrl: data.dniVerificationUrl || null,
    // Datos enriquecidos del estudiante (desde servicio externo de estudiantes)
    studentFullName: data.studentFullName || null,
    studentDocumentNumber: data.studentDocumentNumber || null,
    // Datos enriquecidos de la institución (desde servicio externo de instituciones)
    institutionName: data.institutionName || null,
    institutionCode: data.institutionCode || null,
    // Datos enriquecidos del aula (desde servicio externo de instituciones)
    classroomName: data.classroomName || null,
    classroomGrade: data.classroomGrade || null,
    // Relaciones
    student: data.student || null,
    academicPeriod: data.academicPeriod || null,
    institution: data.institution || null,
    classroom: data.classroom || null,
    // Metadata
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    deleted: data.deleted || false,
  };
}

/**
 * Calcula el progreso de documentos completados
 * @param {Object} enrollment - Objeto enrollment
 * @returns {Object} Objeto con completed, total y percentage
 */
export function calculateDocumentProgress(enrollment) {
  const requiredDocs = REQUIRED_DOCUMENTS.filter(doc => doc.required);
  const completed = requiredDocs.filter(doc => enrollment[doc.key] === true).length;
  const total = requiredDocs.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * Valida si un enrollment tiene todos los campos requeridos
 * @param {Object} enrollment - Objeto enrollment a validar
 * @param {boolean} skipInstitutionValidation - Si true, no valida institutionId (para usuarios con institución asignada)
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateEnrollment(enrollment, skipInstitutionValidation = false) {
  const errors = {};

  if (!enrollment.studentId) errors.studentId = "El estudiante es requerido";
  if (!skipInstitutionValidation && !enrollment.institutionId) errors.institutionId = "La institución es requerida";
  if (!enrollment.classroomId) errors.classroomId = "El aula es requerida";
  if (!enrollment.academicYear) errors.academicYear = "El año académico es requerido";
  if (!enrollment.academicPeriodId) errors.academicPeriodId = "El período académico es requerido";
  if (!enrollment.ageGroup) errors.ageGroup = "El grupo de edad es requerido";
  if (!enrollment.shift) errors.shift = "El turno es requerido";
  if (!enrollment.modality) errors.modality = "La modalidad es requerida";

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
