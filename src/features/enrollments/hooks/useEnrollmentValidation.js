import { useState, useCallback } from "react";
import { enrollmentService } from "../services/enrollmentService";
import { academicPeriodService } from "../services/academicPeriodService";
import { validateEnrollment, ENROLLMENT_STATUS_LABELS } from "../models/enrollmentModel";
import { getEnrollmentBlockReason } from "../models/academicPeriodModel";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

/**
 * Hook para validación de enrollments
 * Realiza validaciones locales y verificación de duplicados
 * El backend valida las referencias cruzadas (student, institution, classroom)
 */
export function useEnrollmentValidation() {
  const [validationErrors, setValidationErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Valida un enrollment completo
   * - Validación local de campos requeridos
   * - Verificación de duplicados en la institución (con detalles de aula)
   * - El backend valida referencias cruzadas (student, institution, classroom)
   */
  const validateEnrollmentData = useCallback(async (enrollmentData) => {
    setIsValidating(true);
    setValidationErrors({});

    try {
      // 1. Validación local de campos requeridos
      const localValidation = validateEnrollment(enrollmentData);
      if (!localValidation.isValid) {
        setValidationErrors(localValidation.errors);
        setIsValidating(false);
        return false;
      }

      // 2. Validar que el período académico no esté cerrado
      if (enrollmentData.academicPeriodId) {
        try {
          const period = await academicPeriodService.getById(enrollmentData.academicPeriodId);
          const blockReason = period ? getEnrollmentBlockReason(period) : null;
          if (blockReason) {
            const errorMsg = blockReason === "periodo_cerrado"
              ? "El período académico seleccionado está cerrado. No es posible realizar matrículas."
              : "La ventana de matrícula para este período ha finalizado. No es posible realizar matrículas.";
            setValidationErrors({
              academicPeriodId: errorMsg,
            });
            setIsValidating(false);
            return false;
          }
        } catch (err) {
          console.warn("[ENROLLMENT-VALIDATION] Error al verificar período académico:", err);
        }
      }

      // 3. Validación de duplicados - verificar si el estudiante ya está matriculado en la institución
      if (enrollmentData.studentId && enrollmentData.institutionId) {
        try {
          const response = await enrollmentService.getByStudent(enrollmentData.studentId);
          const existingEnrollments = isSuccessResponse(response) ? extractData(response) : response;
          
          // Buscar matrículas activas en la misma institución
          const duplicateInInstitution = Array.isArray(existingEnrollments) && existingEnrollments.find(
            (enrollment) =>
              enrollment.institutionId === enrollmentData.institutionId &&
              enrollment.id !== enrollmentData.id && // Excluir el enrollment actual si estamos editando
              (enrollment.enrollmentStatus === "ACTIVE" || enrollment.enrollmentStatus === "PENDING")
          );

          if (duplicateInInstitution) {
            // Construir mensaje detallado con información del aula
            let errorMessage = "El estudiante ya está matriculado en esta institución";
            
            if (duplicateInInstitution.classroomName) {
              errorMessage += ` en el aula "${duplicateInInstitution.classroomName}"`;
            }
            
            if (duplicateInInstitution.academicPeriodName) {
              errorMessage += ` para el período "${duplicateInInstitution.academicPeriodName}"`;
            }
            
            errorMessage += `. Estado: ${getStatusLabel(duplicateInInstitution.enrollmentStatus)}`;
            
            setValidationErrors({
              studentId: errorMessage,
            });
            setIsValidating(false);
            return false;
          }

          // Validación adicional: verificar duplicados en el mismo período académico
          if (enrollmentData.academicPeriodId) {
            const duplicateInPeriod = Array.isArray(existingEnrollments) && existingEnrollments.find(
              (enrollment) =>
                enrollment.academicPeriodId === enrollmentData.academicPeriodId &&
                enrollment.id !== enrollmentData.id &&
                enrollment.enrollmentStatus !== "CANCELLED"
            );

            if (duplicateInPeriod) {
              let errorMessage = "El estudiante ya está matriculado en este período académico";
              
              if (duplicateInPeriod.institutionName) {
                errorMessage += ` en la institución "${duplicateInPeriod.institutionName}"`;
              }
              
              if (duplicateInPeriod.classroomName) {
                errorMessage += `, aula "${duplicateInPeriod.classroomName}"`;
              }
              
              setValidationErrors({
                studentId: errorMessage,
              });
              setIsValidating(false);
              return false;
            }
          }

          // Validación cruzada: verificar si el estudiante está matriculado activo en otra institución
          try {
            const crossResponse = await enrollmentService.checkCrossInstitution(enrollmentData.studentId);
            const crossData = isSuccessResponse(crossResponse) ? extractData(crossResponse) : crossResponse;
            if (crossData) {
              let errorMessage = "El estudiante ya está matriculado en otra institución";
              if (crossData.institutionName) {
                errorMessage += `: "${crossData.institutionName}"`;
              }
              if (crossData.classroomName) {
                errorMessage += `, aula "${crossData.classroomName}"`;
              }
              errorMessage += `. Estado: ${getStatusLabel(crossData.enrollmentStatus)}`;
              setValidationErrors({
                studentId: errorMessage,
              });
              setIsValidating(false);
              return false;
            }
          } catch (err) {
            console.warn("[ENROLLMENT-VALIDATION] Error al verificar matrículas en otras instituciones:", err);
          }
        } catch (err) {
          console.warn("[ENROLLMENT-VALIDATION] Error al verificar duplicados:", err);
          // Continuar con la validación aunque falle esta verificación
        }
      }

      // 4. Validación de fechas
      const dateErrors = validateDates(enrollmentData);
      if (Object.keys(dateErrors).length > 0) {
        setValidationErrors(dateErrors);
        setIsValidating(false);
        return false;
      }

      // Si llegamos aquí, todas las validaciones fueron exitosas
      setIsValidating(false);
      return true;
    } catch (err) {
      console.error("[ENROLLMENT-VALIDATION] Error en validación:", err);
      setValidationErrors({
        general: "Error al validar la matrícula. Por favor, intente nuevamente.",
      });
      setIsValidating(false);
      return false;
    }
  }, []);

  /**
   * Valida solo los campos básicos sin llamadas al backend
   */
  const validateBasicFields = useCallback((enrollmentData, skipInstitutionValidation = false) => {
    const validation = validateEnrollment(enrollmentData, skipInstitutionValidation);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, []);

  /**
   * Limpia los errores de validación
   */
  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  /**
   * Limpia un error específico
   */
  const clearFieldError = useCallback((fieldName) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Establece un error personalizado
   */
  const setFieldError = useCallback((fieldName, errorMessage) => {
    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: errorMessage,
    }));
  }, []);

  return {
    validationErrors,
    isValidating,
    validateEnrollmentData,
    validateBasicFields,
    clearValidationErrors,
    clearFieldError,
    setFieldError,
  };
}

/**
 * Valida las fechas del enrollment
 */
function validateDates(enrollmentData) {
  const errors = {};

  // Validar que la fecha de matrícula no sea muy futura (permitir hasta 1 año adelante)
  // Esto permite flexibilidad para matrículas anticipadas y edición de registros existentes
  if (enrollmentData.enrollmentDate) {
    const enrollmentDate = new Date(enrollmentData.enrollmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Permitir fechas hasta 1 año en el futuro
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (enrollmentDate > oneYearFromNow) {
      errors.enrollmentDate = "La fecha de matrícula no puede ser mayor a un año en el futuro";
    }
    
    // Validar que no sea muy antigua (más de 5 años atrás)
    const fiveYearsAgo = new Date(today);
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    if (enrollmentDate < fiveYearsAgo) {
      errors.enrollmentDate = "La fecha de matrícula no puede ser mayor a 5 años en el pasado";
    }
  }

  // Validar año académico
  if (enrollmentData.academicYear) {
    const year = parseInt(enrollmentData.academicYear, 10);
    const currentYear = new Date().getFullYear();

    if (year < currentYear - 5 || year > currentYear + 2) {
      errors.academicYear = "El año académico debe estar entre los últimos 5 años y los próximos 2 años";
    }
  }

  return errors;
}

/**
 * Obtiene la etiqueta legible de un estado de enrollment
 */
function getStatusLabel(status) {
  return ENROLLMENT_STATUS_LABELS[status] || status;
}
