import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createEmptyAcademicPeriod, validateAcademicPeriod } from "../../models/academicPeriodModel";
import { useAuth } from "@/core/auth/AuthContext";
import { institutionService } from "@/features/institutions/services/institutionService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import FormSection from "@/shared/components/form/FormSection";
import FormField from "@/shared/components/form/FormField";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";

/**
 * Formulario para crear/editar períodos académicos con componentes compartidos
 */
export function AcademicPeriodForm({ period, onSubmit, onCancel, isLoading = false }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(period || createEmptyAcademicPeriod(user?.institutionId));
  const [errors, setErrors] = useState({});
  const [institution, setInstitution] = useState(null);
  const [loadingInstitution, setLoadingInstitution] = useState(false);

  // Cargar información de la institución del usuario
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
    if (period) {
      setFormData(period);
    } else if (user?.institutionId) {
      // Si estamos creando un nuevo periodo, usar la institución del usuario
      setFormData(createEmptyAcademicPeriod(user.institutionId));
    }
  }, [period, user?.institutionId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateAcademicPeriod(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <FormSection title="Información Básica">
        {/* Campo informativo de institución (solo lectura) */}
        <FormField label="Institución" required>
          <div className="relative">
            <Input
              type="text"
              value={loadingInstitution ? "Cargando..." : institution?.name || "Institución del usuario"}
              disabled={true}
              className="bg-gray-50 cursor-not-allowed"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            El período académico se creará para tu institución asignada
          </p>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Año Académico" required error={errors.academicYear}>
            <Input
              type="text"
              value={formData.academicYear}
              onChange={(e) => handleChange("academicYear", e.target.value)}
              disabled={isLoading}
              placeholder="2025"
            />
          </FormField>

          <FormField label="Nombre del Período" required error={errors.periodName}>
            <Input
              type="text"
              value={formData.periodName}
              onChange={(e) => handleChange("periodName", e.target.value)}
              disabled={isLoading}
              placeholder="Primer Bimestre"
            />
          </FormField>
        </div>


      </FormSection>

      {/* Fechas del Período */}
      <FormSection title="Fechas del Período Académico">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Fecha de Inicio" required error={errors.startDate}>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Fecha de Fin" required error={errors.endDate}>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              disabled={isLoading}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Fechas de Matrícula */}
      <FormSection title="Período de Matrícula">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Inicio de Matrícula" required error={errors.enrollmentPeriodStart}>
            <Input
              type="date"
              value={formData.enrollmentPeriodStart}
              onChange={(e) => handleChange("enrollmentPeriodStart", e.target.value)}
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Fin de Matrícula" required error={errors.enrollmentPeriodEnd}>
            <Input
              type="date"
              value={formData.enrollmentPeriodEnd}
              onChange={(e) => handleChange("enrollmentPeriodEnd", e.target.value)}
              disabled={isLoading}
            />
          </FormField>
        </div>

        <div className="mt-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allowLateEnrollment}
              onChange={(e) => handleChange("allowLateEnrollment", e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-700">Permitir matrícula tardía</span>
          </label>
        </div>

        {formData.allowLateEnrollment && (
          <FormField label="Fin de Matrícula Tardía" required error={errors.lateEnrollmentEndDate}>
            <Input
              type="date"
              value={formData.lateEnrollmentEndDate}
              onChange={(e) => handleChange("lateEnrollmentEndDate", e.target.value)}
              disabled={isLoading}
            />
          </FormField>
        )}
      </FormSection>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
        >
          {period?.id ? "Actualizar" : "Crear"} Período
        </Button>
      </div>
    </form>
  );
}

AcademicPeriodForm.propTypes = {
  period: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};
