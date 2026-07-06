import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Edit } from "lucide-react";
import { useEnrollments } from "../../hooks/useEnrollments";
import { useEnrollmentValidation } from "../../hooks/useEnrollmentValidation";
import { IntegratedEnrollmentForm } from "../enrollment-forms/IntegratedEnrollmentForm";
import { EnrollmentValidation } from "../enrollment-forms/EnrollmentValidation";
import { formatEnrollmentForApi, formatEnrollmentUpdateForApi, parseEnrollmentFromApi } from "../../models/enrollmentModel";
import { Modal } from "../shared/Modal";
import { alertConfirmAction } from "@/shared/components/feedback/SweetAlertService";

export function EnrollmentEditModal({ enrollmentId, isOpen, onClose, onSuccess, onReactivateSuccess }) {
  const { fetchById, updateEnrollment, createEnrollment } = useEnrollments();
  const { validationErrors, validateEnrollmentData } = useEnrollmentValidation();
  const [enrollment, setEnrollment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const enrollmentIdRef = useRef(enrollmentId);

  useEffect(() => {
    enrollmentIdRef.current = enrollmentId;
  }, [enrollmentId]);

  useEffect(() => {
    if (!isOpen || !enrollmentId) return;

    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchById(enrollmentId);
        if (mounted) {
          setEnrollment(parseEnrollmentFromApi(data));
        }
      } catch (error) {
        console.error("Error al cargar matrícula:", error);
        if (mounted) onClose();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [isOpen, enrollmentId, fetchById, onClose]);

  const handleSubmit = async (enrollmentData) => {
    setIsSubmitting(true);
    try {
      const isValid = await validateEnrollmentData(enrollmentData);
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      const periodChanged = enrollment?.academicPeriodId && enrollmentData.academicPeriodId &&
        enrollment.academicPeriodId !== enrollmentData.academicPeriodId;

      if (periodChanged) {
        const result = await alertConfirmAction({
          title: "Cambiar período académico",
          message: "Se creará una nueva matrícula para este estudiante en el nuevo período. La matrícula actual en el período anterior se mantendrá como historial.",
          confirmText: "Crear nueva matrícula",
          cancelText: "Cancelar",
          icon: "warning",
          confirmColor: "amber",
        });
        if (!result.isConfirmed) {
          setIsSubmitting(false);
          return;
        }
        const payload = formatEnrollmentForApi(enrollmentData);
        await createEnrollment(payload);
      } else {
        const payload = formatEnrollmentUpdateForApi(enrollmentData);
        await updateEnrollment(enrollmentId, payload);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error al guardar matrícula:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Matrícula"
      subtitle={enrollment ? `Código: ${enrollment.enrollmentCode || enrollment.id}` : "Cargando..."}
      icon={Edit}
      size="2xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Cargando matrícula...</p>
          </div>
        </div>
      ) : !enrollment ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No se encontró la matrícula</p>
        </div>
      ) : (
        <>
          {Object.keys(validationErrors).length > 0 && (
            <div className="mb-6">
              <EnrollmentValidation validationErrors={validationErrors} />
            </div>
          )}
          <IntegratedEnrollmentForm
            enrollment={enrollment}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isSubmitting}
            onReactivateSuccess={onReactivateSuccess}
          />
        </>
      )}
    </Modal>
  );
}

EnrollmentEditModal.propTypes = {
  enrollmentId: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onReactivateSuccess: PropTypes.func,
};
