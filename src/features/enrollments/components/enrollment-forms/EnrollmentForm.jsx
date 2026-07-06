import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { AlertTriangle } from "lucide-react";
import { EnhancedStudentSelector } from "../shared/EnhancedStudentSelector";
import { ClassroomSelector } from "../shared/ClassroomSelector";
import { AcademicPeriodSelector } from "../shared/AcademicPeriodSelector";
import { useAcademicPeriods } from "../../hooks/useAcademicPeriods";
import { useEnrollmentValidation } from "../../hooks/useEnrollmentValidation";
import { useInstitutionSchedules } from "../../hooks/useInstitutionSchedules";
import { createEmptyEnrollment } from "../../models/enrollmentModel";
import { getEnrollmentBlockReason } from "../../models/academicPeriodModel";
import { useAuth } from "@/core/auth/AuthContext";
import { institutionService } from "@/features/institutions/services/institutionService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

/**
 * Formulario para crear/editar enrollments
 */
export function EnrollmentForm({ enrollment, onSubmit, onCancel, isLoading = false, hideButtons = false, onFormDataChange, onReactivateSuccess }) {
  const { user } = useAuth(); // Obtener usuario autenticado
  const { periods } = useAcademicPeriods();
  const [formData, setFormData] = useState(enrollment || createEmptyEnrollment(user?.institutionId));
  const [selectedPeriodClosed, setSelectedPeriodClosed] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const { validationErrors, validateBasicFields, clearFieldError } = useEnrollmentValidation();
  const [institution, setInstitution] = useState(null);
  const [loadingInstitution, setLoadingInstitution] = useState(false);
  
  // Obtener horarios de la institución
  const { schedules } = useInstitutionSchedules(formData.institutionId);

  // Determinar si el usuario tiene institución asignada Y estamos creando (no editando)
  const hasUserInstitution = user?.institutionId && !enrollment?.id;

  // Función para calcular edad desde fecha de nacimiento
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Cargar información de la institución
  useEffect(() => {
    const loadInstitution = async () => {
      if (!user?.institutionId) return;
      
      setLoadingInstitution(true);
      try {
        const response = await institutionService.getById(user.institutionId);
        const data = isSuccessResponse(response) ? extractData(response) : response;
        setInstitution(data);
      } catch (error) {
        console.error("Error al cargar institución:", error);
      } finally {
        setLoadingInstitution(false);
      }
    };

    loadInstitution();
  }, [user?.institutionId]);

useEffect(() => {
  if (enrollment) {
    setFormData(enrollment);
  } else if (hasUserInstitution) {
    const newFormData = createEmptyEnrollment(user.institutionId);
    setFormData(newFormData);

    if (onFormDataChange) {
      setTimeout(() => onFormDataChange(newFormData), 0);
    }
  }
}, [
  enrollment,
  hasUserInstitution,
  user?.institutionId,
  onFormDataChange,
]);

  const handlePeriodSelect = useCallback((period) => {
    const reason = period ? getEnrollmentBlockReason(period) : null;
    setSelectedPeriodClosed(reason !== null);
    setSelectedReason(reason);
  }, []);

  useEffect(() => {
    if (formData.academicPeriodId && periods.length > 0) {
      const period = periods.find(p => p.id === formData.academicPeriodId);
      const reason = period ? getEnrollmentBlockReason(period) : null;
      setSelectedPeriodClosed(reason !== null);
      setSelectedReason(reason);
    }
  }, [formData.academicPeriodId, periods]);

  const handleChange = (field, value) => {
    setFormData(prevData => {
      const updatedData = { ...prevData, [field]: value };
      
      // Notificar al componente padre sobre los cambios (usando el estado actualizado)
      if (onFormDataChange) {
        // Usar setTimeout para evitar actualizaciones durante el render
        setTimeout(() => onFormDataChange(updatedData), 0);
      }
      
      return updatedData;
    });
    
    clearFieldError(field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos básicos (skip institution validation ya que está implícita en el sistema)
    const skipInstitutionValidation = true;
    const isValid = validateBasicFields(formData, skipInstitutionValidation);
    if (!isValid) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campo informativo de institución */}
      {hasUserInstitution && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Institución: {loadingInstitution ? "Cargando..." : institution?.name || "Tu institución"}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                La matrícula se creará para tu institución asignada
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de período/matrícula cerrada */}
      {selectedPeriodClosed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                {selectedReason === "periodo_cerrado" ? "Período académico cerrado" : "Matrícula cerrada"}
              </p>
              <p className="text-xs text-red-700 mt-1">
                {selectedReason === "periodo_cerrado"
                  ? "El período académico seleccionado está cerrado. No es posible registrar nuevas matrículas."
                  : "La ventana de matrícula para este período ha finalizado. No es posible registrar nuevas matrículas."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información del Estudiante */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Estudiante</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estudiante <span className="text-red-500">*</span>
            </label>
            <EnhancedStudentSelector
              value={formData.studentId}
              onReactivateSuccess={onReactivateSuccess}
              onChange={(studentId, studentData, prefillData) => {
                // Validar que tenemos un studentId válido
                if (!studentId) {
                  // Si se deselecciona, limpiar todos los campos relacionados
                  setFormData(prevData => {
                    const updatedData = {
                      ...prevData,
                      studentId: "",
                      studentAge: null,
                      ageGroup: "",
                    };
                    
                    if (onFormDataChange) {
                      setTimeout(() => onFormDataChange(updatedData), 0);
                    }
                    
                    return updatedData;
                  });
                  clearFieldError("studentId");
                  return;
                }
                
                // Actualizar el formData con todos los cambios en una sola operación
                setFormData(prevData => {
                  const updatedData = { ...prevData, studentId };
                  
                  // Auto-completar edad si el estudiante tiene fecha de nacimiento
                  if (studentData?.dateOfBirth) {
                    const age = calculateAge(studentData.dateOfBirth);
                    if (age !== null && age >= 2 && age <= 7) {
                      updatedData.studentAge = age;
                      
                      // Auto-seleccionar grupo de edad basado en la edad calculada
                      if (age === 3) {
                        updatedData.ageGroup = "3 años";
                      } else if (age === 4) {
                        updatedData.ageGroup = "4 años";
                      } else if (age === 5) {
                        updatedData.ageGroup = "5 años";
                      }
                    }
                  }
                  
                  if (prefillData) {
                    Object.keys(prefillData).forEach(field => {
                      if (prefillData[field] !== undefined && prefillData[field] !== null) {
                        updatedData[field] = prefillData[field];
                      }
                    });
                  }
                  
                  // Notificar al componente padre sobre los cambios
                  if (onFormDataChange) {
                    setTimeout(() => onFormDataChange(updatedData), 0);
                  }
                  
                  return updatedData;
                });
                
                clearFieldError("studentId");
              }}
              institutionId={formData.institutionId}
              academicPeriodId={formData.academicPeriodId}
              disabled={isLoading}
            />
            {validationErrors.studentId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.studentId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edad del Estudiante
              </label>
              <input
                type="number"
                value={formData.studentAge || ""}
                onChange={(e) => handleChange("studentAge", parseInt(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                min="3"
                max="18"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grupo de Edad <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.ageGroup}
                onChange={(e) => handleChange("ageGroup", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">Seleccione grupo de edad</option>
                <option value="3 años">3 años</option>
                <option value="4 años">4 años</option>
                <option value="5 años">5 años</option>
              </select>
              {validationErrors.ageGroup && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.ageGroup}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información del Aula */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Aula</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aula <span className="text-red-500">*</span>
            </label>
            <ClassroomSelector
              value={formData.classroomId}
              onChange={(value) => handleChange("classroomId", value)}
              institutionId={formData.institutionId}
              disabled={isLoading}
            />
            {validationErrors.classroomId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.classroomId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Información Académica */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Académica</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año Académico <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.academicYear}
              onChange={(e) => handleChange("academicYear", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              placeholder="2025"
            />
            {validationErrors.academicYear && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.academicYear}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período Académico <span className="text-red-500">*</span>
            </label>
            <AcademicPeriodSelector
              value={formData.academicPeriodId}
              onChange={(value) => handleChange("academicPeriodId", value)}
              institutionId={formData.institutionId}
              disabled={isLoading}
              onPeriodSelect={handlePeriodSelect}
            />
            {validationErrors.academicPeriodId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.academicPeriodId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Turno <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.shift}
              onChange={(e) => handleChange("shift", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">Seleccione un turno</option>
              {schedules.length > 0 ? (
                schedules.map((schedule, index) => (
                  <option key={index} value={schedule.shift}>
                    {schedule.shift} ({schedule.startTime} - {schedule.endTime})
                  </option>
                ))
              ) : (
                <>
                  <option value="MAÑANA">Mañana</option>
                  <option value="TARDE">Tarde</option>
                </>
              )}
            </select>
            {validationErrors.shift && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.shift}</p>
            )}

          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modalidad <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.modality}
              onChange={(e) => handleChange("modality", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">Seleccione una modalidad</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="HIBRIDA">Híbrida</option>
            </select>
            {validationErrors.modality && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.modality}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            value={formData.observations}
            onChange={(e) => handleChange("observations", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            placeholder="Observaciones adicionales..."
          />
        </div>
      </div>

      {/* Botones de acción */}
      {!hideButtons && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || selectedPeriodClosed}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedPeriodClosed ? (selectedReason === "periodo_cerrado" ? "Período cerrado" : "Matrícula cerrada") : isLoading ? "Guardando..." : enrollment?.id ? "Actualizar" : "Crear"} Matrícula
          </button>
        </div>
      )}
    </form>
  );
}

EnrollmentForm.propTypes = {
  enrollment: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  hideButtons: PropTypes.bool,
  onFormDataChange: PropTypes.func,
  onReactivateSuccess: PropTypes.func,
};
