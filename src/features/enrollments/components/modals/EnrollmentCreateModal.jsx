import { useState } from "react";
import PropTypes from "prop-types";
import { FileText } from "lucide-react";
import { useEnrollments } from "../../hooks/useEnrollments";
import { useEnrollmentValidation } from "../../hooks/useEnrollmentValidation";
import { IntegratedEnrollmentForm } from "../enrollment-forms/IntegratedEnrollmentForm";
import { EnrollmentValidation } from "../enrollment-forms/EnrollmentValidation";
import { formatEnrollmentForApi } from "../../models/enrollmentModel";
import { Modal } from "../shared/Modal";

export function EnrollmentCreateModal({ isOpen, onClose, onSuccess, onReactivateSuccess }) {
  const { createEnrollment } = useEnrollments();
  const { validationErrors, validateEnrollmentData } = useEnrollmentValidation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (enrollmentData) => {
    setIsSubmitting(true);
    try {
      const isValid = await validateEnrollmentData(enrollmentData);
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }
      const payload = formatEnrollmentForApi(enrollmentData);
      await createEnrollment(payload);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error al crear matrícula:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Matrícula"
      subtitle="Complete la información para registrar una nueva matrícula"
      icon={FileText}
      size="2xl"
    >
      {Object.keys(validationErrors).length > 0 && (
        <div className="mb-6">
          <EnrollmentValidation validationErrors={validationErrors} />
        </div>
      )}
      <IntegratedEnrollmentForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={isSubmitting}
        onReactivateSuccess={onReactivateSuccess}
      />
    </Modal>
  );
}

EnrollmentCreateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onReactivateSuccess: PropTypes.func,
};
