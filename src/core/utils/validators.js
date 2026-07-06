const NAME_REGEX = /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]+$/;
const DNI_REGEX = /^\d{8}$/;
const CUI_REGEX = /^\d{8}-\d$/;
const CUI_RAW_REGEX = /^\d{9}$/;
const CNE_REGEX = /^[A-Za-z0-9]{9,12}$/;
const PHONE_REGEX = /^9\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ONLY_DIGITS_REGEX = /^\d+$/;
const ONLY_LETTERS_REGEX = /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]*$/;

export function isRequired(value) {
     if (typeof value === "string") return value.trim().length > 0;
     return value !== null && value !== undefined;
}

export function minLength(value, min) {
     return typeof value === "string" && value.length >= min;
}

export function maxLength(value, max) {
     return typeof value === "string" && value.length <= max;
}

/* ── Nombres y Apellidos ───────────────────── */

export function isValidName(value) {
     if (!value || !value.trim()) return false;
     return NAME_REGEX.test(value.trim());
}

export function filterNameInput(value) {
     return value.replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]/g, "");
}

/* ── Documentos ────────────────────────────── */

export function isValidDNI(dni) {
     return DNI_REGEX.test(dni);
}

export function isValidCUI(cui) {
     if (!cui) return false;
     return CUI_REGEX.test(cui) || CUI_RAW_REGEX.test(cui);
}

export function formatCUI(value) {
     const digits = value.replace(/\D/g, "").slice(0, 9);
     if (digits.length <= 8) return digits;
     return `${digits.slice(0, 8)}-${digits.slice(8)}`;
}

export function filterCUIInput(value) {
     const clean = value.replace(/[^\d-]/g, "");
     return formatCUI(clean);
}

export function isValidCNE(cne) {
     if (!cne) return false;
     return CNE_REGEX.test(cne);
}

export function filterCNEInput(value) {
     return value.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
}

export function filterDNIInput(value) {
     return value.replace(/\D/g, "").slice(0, 8);
}

export function isValidDocumentNumber(type, number) {
     if (!number || !number.trim()) return false;
     switch (type) {
          case "DNI":
               return isValidDNI(number);
          case "CNE":
               return isValidCNE(number);
          default:
               return number.trim().length > 0;
     }
}

export function filterDocumentInput(type, value) {
     switch (type) {
          case "DNI":
               return filterDNIInput(value);
          case "CNE":
               return filterCNEInput(value);
          default:
               return value;
     }
}

export function getDocumentError(type) {
     switch (type) {
          case "DNI":
               return "DNI debe tener exactamente 8 dígitos";
          case "CNE":
               return "CNE debe tener entre 9 y 12 caracteres alfanuméricos";
          default:
               return "Número de documento inválido";
     }
}

/* ── Contacto ──────────────────────────────── */

export function isValidPhone(phone) {
     return PHONE_REGEX.test(phone);
}

export function filterPhoneInput(value) {
     const digits = value.replace(/\D/g, "");
     if (digits.length === 0) return "";
     if (digits[0] !== "9") return "";
     return digits.slice(0, 9);
}

export function isValidEmail(email) {
     return EMAIL_REGEX.test(email);
}

export function isValidWhatsapp(value) {
     if (!value || !value.trim()) return true;
     return PHONE_REGEX.test(value);
}

/* ── Filtros genéricos para inputs ─────────── */

export function filterDigitsOnly(value, max) {
     const digits = value.replace(/\D/g, "");
     return max ? digits.slice(0, max) : digits;
}

export function filterLettersOnly(value) {
     return value.replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]/g, "");
}

/* ── Validadores de formulario completo ────── */

export function validateStudentForm(data) {
     const errors = {};

     if (!isRequired(data.cui)) {
          errors.cui = "CUI es requerido";
     } else if (!isValidCUI(data.cui)) {
          errors.cui = "CUI debe tener formato XXXXXXXX-X (9 dígitos)";
     }

     if (!isRequired(data.firstName)) {
          errors.firstName = "Nombres son requeridos";
     } else if (!isValidName(data.firstName)) {
          errors.firstName = "Solo se permiten letras y espacios";
     }

     if (!isRequired(data.lastName)) {
          errors.lastName = "Apellido paterno es requerido";
     } else if (!isValidName(data.lastName)) {
          errors.lastName = "Solo se permiten letras y espacios";
     }

     if (data.motherLastName && data.motherLastName.trim() && !isValidName(data.motherLastName)) {
          errors.motherLastName = "Solo se permiten letras y espacios";
     }

     if (!isRequired(data.documentType)) {
          errors.documentType = "Tipo de documento es requerido";
     }

     if (!isRequired(data.documentNumber)) {
          errors.documentNumber = "Número de documento es requerido";
     } else if (!isValidDocumentNumber(data.documentType, data.documentNumber)) {
          errors.documentNumber = getDocumentError(data.documentType);
     }

     if (!isRequired(data.gender)) {
          errors.gender = "Género es requerido";
     }

     if (!isRequired(data.dateOfBirth)) {
          errors.dateOfBirth = "Fecha de nacimiento es requerida";
     } else {
          const ageError = validateBirthDateAge(data.dateOfBirth);
          if (ageError) errors.dateOfBirth = ageError;
     }

     return errors;
}

/* ── Fecha de nacimiento para nivel inicial ── */

export function getBirthDateRange() {
     const today = new Date();
     const year = today.getFullYear();
     const min = `${year - 6}-01-01`;
     const max = `${year - 3}-03-31`;
     return { min, max };
}

export function validateBirthDateAge(dateStr) {
     if (!dateStr) return null;
     const birth = new Date(dateStr + "T00:00:00");
     const today = new Date();
     let age = today.getFullYear() - birth.getFullYear();
     const monthDiff = today.getMonth() - birth.getMonth();
     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
     }
     if (age < 2) return "El estudiante debe tener al menos 3 años (nivel inicial)";
     if (age > 6) return "El estudiante no debe tener más de 6 años (nivel inicial)";
     return null;
}

export function validateGuardianForm(data) {
     const errors = {};

     if (!isRequired(data.firstName)) {
          errors.firstName = "Nombres son requeridos";
     } else if (!isValidName(data.firstName)) {
          errors.firstName = "Solo se permiten letras y espacios";
     }

     if (!isRequired(data.lastName)) {
          errors.lastName = "Apellido paterno es requerido";
     } else if (!isValidName(data.lastName)) {
          errors.lastName = "Solo se permiten letras y espacios";
     }

     if (data.motherLastName && data.motherLastName.trim() && !isValidName(data.motherLastName)) {
          errors.motherLastName = "Solo se permiten letras y espacios";
     }

     if (!isRequired(data.relationship)) {
          errors.relationship = "Parentesco es requerido";
     }

     if (!isRequired(data.documentType)) {
          errors.documentType = "Tipo de documento es requerido";
     }

     if (!isRequired(data.documentNumber)) {
          errors.documentNumber = "Número de documento es requerido";
     } else if (!isValidDocumentNumber(data.documentType, data.documentNumber)) {
          errors.documentNumber = getDocumentError(data.documentType);
     }

     if (!isRequired(data.phone)) {
          errors.phone = "Teléfono es requerido";
     } else if (!isValidPhone(data.phone)) {
          errors.phone = "Teléfono debe tener 9 dígitos y empezar con 9";
     }

     if (data.email && data.email.trim() && !isValidEmail(data.email)) {
          errors.email = "Correo electrónico inválido";
     }

     if (data.whatsapp && data.whatsapp.trim() && !isValidWhatsapp(data.whatsapp)) {
          errors.whatsapp = "WhatsApp debe tener 9 dígitos y empezar con 9";
     }

     return errors;
}
