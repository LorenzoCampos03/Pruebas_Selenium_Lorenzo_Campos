/**
 * Academic Period Model
 * Define las estructuras de datos y transformaciones para Períodos Académicos
 */

// Constantes de estado de período académico
export const PERIOD_STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    PENDING: "PENDING",
    CLOSED: "CLOSED",
};

export const PERIOD_STATUS_LABELS = {
    [PERIOD_STATUS.ACTIVE]: "Activo",
    [PERIOD_STATUS.INACTIVE]: "Inactivo",
    [PERIOD_STATUS.PENDING]: "Pendiente",
    [PERIOD_STATUS.CLOSED]: "Cerrado",
};

/**
 * Crea una instancia vacía de período académico
 * @param {string} institutionId - ID de la institución (opcional)
 * @returns {Object} Objeto academic period con valores por defecto
 */
export function createEmptyAcademicPeriod(institutionId = "") {
    return {
        id: null,
        institutionId: institutionId,
        academicYear: new Date().getFullYear().toString(),
        periodName: "",
        startDate: "",
        endDate: "",
        enrollmentPeriodStart: "",
        enrollmentPeriodEnd: "",
        allowLateEnrollment: false,
        lateEnrollmentEndDate: "",
        status: PERIOD_STATUS.PENDING,
    };
}

/**
 * Convierte una fecha de formato YYYY-MM-DD a LocalDateTime para el backend
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha en formato ISO para LocalDateTime
 */
function formatDateForBackend(dateString) {
    if (!dateString) return null;
    // Convertir YYYY-MM-DD a YYYY-MM-DDTHH:mm:ss para LocalDateTime
    return `${dateString}T00:00:00`;
}

/**
 * Formatea un período académico para enviar a la API
 * @param {Object} period - Objeto academic period del formulario
 * @returns {Object} Payload formateado para la API
 */
export function formatAcademicPeriodForApi(period) {
    const payload = {
        institutionId: period.institutionId,
        academicYear: period.academicYear,
        periodName: period.periodName,
        startDate: formatDateForBackend(period.startDate),
        endDate: formatDateForBackend(period.endDate),
        enrollmentPeriodStart: formatDateForBackend(period.enrollmentPeriodStart),
        enrollmentPeriodEnd: formatDateForBackend(period.enrollmentPeriodEnd),
        allowLateEnrollment: period.allowLateEnrollment || false,
    };

    // Campos opcionales
    if (period.lateEnrollmentEndDate) {
        payload.lateEnrollmentEndDate = formatDateForBackend(period.lateEnrollmentEndDate);
    }
    if (period.status) {
        payload.status = period.status;
    }

    return payload;
}

/**
 * Formatea un período académico para actualización
 * @param {Object} period - Objeto academic period con cambios
 * @returns {Object} Payload con solo los campos a actualizar
 */
export function formatAcademicPeriodUpdateForApi(period) {
    const payload = {};
    const fields = [
        "institutionId",
        "academicYear",
        "periodName",
        "allowLateEnrollment",
        "status",
    ];

    // Campos simples
    fields.forEach((field) => {
        if (period[field] !== undefined && period[field] !== null) {
            payload[field] = period[field];
        }
    });

    // Campos de fecha que necesitan formateo especial
    const dateFields = [
        "startDate",
        "endDate",
        "enrollmentPeriodStart",
        "enrollmentPeriodEnd",
        "lateEnrollmentEndDate",
    ];

    dateFields.forEach((field) => {
        if (period[field] !== undefined && period[field] !== null && period[field] !== "") {
            payload[field] = formatDateForBackend(period[field]);
        }
    });

    return payload;
}

/**
 * Convierte una fecha de LocalDateTime del backend a formato YYYY-MM-DD
 * @param {string} dateTimeString - Fecha en formato LocalDateTime
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function formatDateFromBackend(dateTimeString) {
    if (!dateTimeString) return "";
    // Extraer solo la parte de fecha de LocalDateTime
    return dateTimeString.split('T')[0];
}

/**
 * Parsea un período académico desde la respuesta de la API
 * @param {Object} data - Datos del período académico desde la API
 * @returns {Object} Objeto academic period normalizado
 */
export function parseAcademicPeriodFromApi(data) {
    return {
        id: data.id || null,
        institutionId: data.institutionId || "",
        academicYear: data.academicYear || "",
        periodName: data.periodName || "",
        startDate: formatDateFromBackend(data.startDate),
        endDate: formatDateFromBackend(data.endDate),
        enrollmentPeriodStart: formatDateFromBackend(data.enrollmentPeriodStart),
        enrollmentPeriodEnd: formatDateFromBackend(data.enrollmentPeriodEnd),
        allowLateEnrollment: data.allowLateEnrollment || false,
        lateEnrollmentEndDate: formatDateFromBackend(data.lateEnrollmentEndDate),
        status: data.status || PERIOD_STATUS.PENDING,
        // Relaciones
        institution: data.institution || null,
        enrollments: data.enrollments || [],
        // Metadata
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        deleted: data.deleted || false,
    };
}

/**
 * Valida si un período académico tiene todos los campos requeridos
 * @param {Object} period - Objeto academic period a validar
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateAcademicPeriod(period) {
    const errors = {};

    if (!period.institutionId) {
        errors.institutionId = "La institución es requerida";
    }
    if (!period.academicYear) {
        errors.academicYear = "El año académico es requerido";
    }
    if (!period.periodName) {
        errors.periodName = "El nombre del período es requerido";
    }
    if (!period.startDate) {
        errors.startDate = "La fecha de inicio es requerida";
    }
    if (!period.endDate) {
        errors.endDate = "La fecha de fin es requerida";
    }
    if (!period.enrollmentPeriodStart) {
        errors.enrollmentPeriodStart = "La fecha de inicio de matrícula es requerida";
    }
    if (!period.enrollmentPeriodEnd) {
        errors.enrollmentPeriodEnd = "La fecha de fin de matrícula es requerida";
    }

    // Validaciones de fechas
    if (period.startDate && period.endDate) {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        if (start >= end) {
            errors.endDate = "La fecha de fin debe ser posterior a la fecha de inicio";
        }
    }

    if (period.enrollmentPeriodStart && period.enrollmentPeriodEnd) {
        const enrollStart = new Date(period.enrollmentPeriodStart);
        const enrollEnd = new Date(period.enrollmentPeriodEnd);
        if (enrollStart >= enrollEnd) {
            errors.enrollmentPeriodEnd = "La fecha de fin de matrícula debe ser posterior a la fecha de inicio";
        }
    }

    if (period.allowLateEnrollment && !period.lateEnrollmentEndDate) {
        errors.lateEnrollmentEndDate = "La fecha de fin de matrícula tardía es requerida cuando se permite matrícula tardía";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Verifica si un período académico está actualmente en período de matrícula
 * @param {Object} period - Objeto academic period
 * @returns {boolean} true si está en período de matrícula
 */
export function isEnrollmentPeriodOpen(period) {
    const now = new Date();
    const enrollStart = new Date(period.enrollmentPeriodStart);
    const enrollEnd = new Date(period.enrollmentPeriodEnd);

    if (now >= enrollStart && now <= enrollEnd) {
        return true;
    }

    // Verificar matrícula tardía
    if (period.allowLateEnrollment && period.lateEnrollmentEndDate) {
        const lateEnd = new Date(period.lateEnrollmentEndDate);
        return now <= lateEnd;
    }

    return false;
}

/**
 * Verifica si un período académico está activo
 * @param {Object} period - Objeto academic period
 * @returns {boolean} true si está activo
 */
export function isPeriodActive(period) {
    return period.status === PERIOD_STATUS.ACTIVE;
}

/**
 * Verifica si un período académico está cerrado
 * @param {Object} period - Objeto academic period
 * @returns {boolean} true si está cerrado
 */
export function isPeriodClosed(period) {
    return period?.status === PERIOD_STATUS.CLOSED;
}

/**
 * Obtiene el estado del período de matrícula
 * @param {Object} period - Objeto academic period
 * @returns {string} Estado: "open", "late", "closed"
 */
export function getEnrollmentPeriodStatus(period) {
    const now = new Date();
    const enrollStart = new Date(period.enrollmentPeriodStart);
    const enrollEnd = new Date(period.enrollmentPeriodEnd);

    if (now < enrollStart) {
        return "upcoming";
    }

    if (now >= enrollStart && now <= enrollEnd) {
        return "open";
    }

    if (period.allowLateEnrollment && period.lateEnrollmentEndDate) {
        const lateEnd = new Date(period.lateEnrollmentEndDate);
        if (now <= lateEnd) {
            return "late";
        }
    }

    return "closed";
}

/**
 * Verifica si la ventana de matrícula del período está cerrada (basado en fechas)
 * @param {Object} period - Objeto academic period
 * @returns {boolean} true si la ventana de matrícula está cerrada
 */
export function isEnrollmentWindowClosed(period) {
    if (!period) return false;
    return getEnrollmentPeriodStatus(period) === "closed";
}

/**
 * Retorna la razón por la cual no se pueden realizar acciones en un período
 * @param {Object} period - Objeto academic period
 * @returns {string|null} "periodo_cerrado", "matricula_cerrada" o null si está permitido
 */
export function getEnrollmentBlockReason(period) {
    if (!period) return null;
    if (isPeriodClosed(period)) return "periodo_cerrado";
    if (isEnrollmentWindowClosed(period)) return "matricula_cerrada";
    return null;
}
