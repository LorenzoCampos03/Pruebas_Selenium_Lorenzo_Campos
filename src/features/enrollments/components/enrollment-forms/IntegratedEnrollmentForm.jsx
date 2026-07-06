import { useState } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { User, FileText, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { EnrollmentForm } from "./EnrollmentForm";
import { REQUIRED_DOCUMENTS, createEmptyEnrollment, getDocumentUrlKey } from "../../models/enrollmentModel";
import { useAuth } from "@/core/auth/AuthContext";
import { DocumentUploader } from "../shared/DocumentUploader";
import Badge from "@/shared/components/ui/Badge";
import Button from "@/shared/components/ui/Button";
import Card from "@/shared/components/ui/Card";

const STEPS = [
  { key: "basic", label: "Información Básica", icon: User },
  { key: "documents", label: "Documentos", icon: FileText },
];

const stepVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

export function IntegratedEnrollmentForm({
  enrollment,
  onSubmit,
  onCancel,
  isLoading = false,
  onReactivateSuccess,
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(enrollment || createEmptyEnrollment(user?.institutionId));
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [documents, setDocuments] = useState(
    enrollment
      ? REQUIRED_DOCUMENTS.reduce((acc, doc) => {
        acc[doc.key] = enrollment[doc.key] || false;
        return acc;
      }, {})
      : REQUIRED_DOCUMENTS.reduce((acc, doc) => {
        acc[doc.key] = false;
        return acc;
      }, {})
  );
  const [documentUrls, setDocumentUrls] = useState(
    enrollment
      ? REQUIRED_DOCUMENTS.reduce((acc, doc) => {
        const urlKey = getDocumentUrlKey(doc.key);
        acc[doc.key] = enrollment[urlKey] || null;
        return acc;
      }, {})
      : REQUIRED_DOCUMENTS.reduce((acc, doc) => {
        acc[doc.key] = null;
        return acc;
      }, {})
  );

  const handleFormDataChange = (updatedData) => {
    setFormData(updatedData);

    const hasDocData = REQUIRED_DOCUMENTS.some(doc =>
      updatedData[doc.key] !== undefined || updatedData[getDocumentUrlKey(doc.key)] !== undefined
    );

    if (hasDocData) {
      setDocuments(prev => {
        const newDocs = { ...prev };
        REQUIRED_DOCUMENTS.forEach(doc => {
          if (updatedData[doc.key] !== undefined) {
            newDocs[doc.key] = updatedData[doc.key] === true;
          }
        });
        return newDocs;
      });

      setDocumentUrls(prev => {
        const newUrls = { ...prev };
        REQUIRED_DOCUMENTS.forEach(doc => {
          const urlKey = getDocumentUrlKey(doc.key);
          if (updatedData[urlKey] !== undefined) {
            newUrls[doc.key] = updatedData[urlKey];
          }
        });
        return newUrls;
      });
    }
  };

  const handleFormSubmit = (enrollmentData) => {
    const completeData = { ...enrollmentData };

    REQUIRED_DOCUMENTS.forEach((doc) => {
      completeData[doc.key] = documents[doc.key] === true;
    });

    REQUIRED_DOCUMENTS.forEach((doc) => {
      const urlKey = getDocumentUrlKey(doc.key);
      completeData[urlKey] = documentUrls[doc.key] || null;
    });

    onSubmit(completeData);
  };

  const handleDocumentChange = (docKey, checked) => {
    setDocuments((prev) => ({
      ...prev,
      [docKey]: checked,
    }));
  };

  const handleDocumentUrlChange = (docKey, url) => {
    setDocumentUrls((prev) => ({
      ...prev,
      [docKey]: url,
    }));
    if (url) {
      setDocuments((prev) => ({
        ...prev,
        [docKey]: true,
      }));
    }
  };

  const toggleAllDocuments = (checked) => {
    const newDocuments = REQUIRED_DOCUMENTS.reduce((acc, doc) => {
      acc[doc.key] = checked;
      return acc;
    }, {});
    setDocuments(newDocuments);
  };

  const goToStep = (step) => {
    setDirection(step > activeStep ? 1 : -1);
    setActiveStep(step);
  };

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) goToStep(activeStep + 1);
  };

  const handlePrev = () => {
    if (activeStep > 0) goToStep(activeStep - 1);
  };

  const totalDocs = REQUIRED_DOCUMENTS.length;
  const completedDocs = Object.values(documents).filter(Boolean).length;
  const progress = Math.round((completedDocs / totalDocs) * 100);

  const requiredDocs = REQUIRED_DOCUMENTS.filter(doc => doc.required);
  const optionalDocs = REQUIRED_DOCUMENTS.filter(doc => !doc.required);

  const isLastStep = activeStep === STEPS.length - 1;
  const stepStatus = (stepIndex) => {
    if (stepIndex < activeStep) return "completed";
    if (stepIndex === activeStep) return "current";
    return "pending";
  };

  return (
    <div className="space-y-6">
      {/* Step Progress Indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const status = stepStatus(index);
            const StepIcon = step.icon;
            const isLast = index === STEPS.length - 1;

            return (
              <div key={step.key} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => goToStep(index)}
                  className="flex items-center gap-3 group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      status === "completed"
                        ? "bg-green-500 text-white"
                        : status === "current"
                        ? "bg-primary-600 text-white ring-4 ring-primary-100"
                        : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                    }`}
                  >
                    {status === "completed" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-xs font-medium ${
                      status === "completed"
                        ? "text-green-600"
                        : status === "current"
                        ? "text-primary-600"
                        : "text-gray-400"
                    }`}>
                      Paso {index + 1}
                    </p>
                    <p className={`text-sm font-semibold ${
                      status === "completed" || status === "current"
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}>
                      {step.label}
                    </p>
                  </div>
                </button>

                {!isLast && (
                  <div className="flex-1 mx-4">
                    <div className={`h-1 rounded-full ${
                      status === "completed" ? "bg-green-500" : "bg-gray-200"
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content with Animation */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {activeStep === 0 && (
              <Card>
                <EnrollmentForm
                  enrollment={formData}
                  onSubmit={handleFormSubmit}
                  onCancel={onCancel}
                  isLoading={isLoading}
                  hideButtons={true}
                  onFormDataChange={handleFormDataChange}
                  onReactivateSuccess={onReactivateSuccess}
                />
              </Card>
            )}

            {activeStep === 1 && (
              <Card>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-600" />
                        Documentos Requeridos
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Marque los documentos que el estudiante ha presentado
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAllDocuments(completedDocs < totalDocs)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      disabled={isLoading}
                    >
                      {completedDocs < totalDocs ? "Marcar todos" : "Desmarcar todos"}
                    </button>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Progreso: {completedDocs} de {totalDocs} documentos
                      </span>
                      <span className="text-sm font-bold text-blue-600">{progress}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${progress === 100 ? "bg-green-500" : progress >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <h4 className="font-semibold text-gray-900">Documentos Obligatorios</h4>
                      <Badge variant="danger" size="sm">{requiredDocs.length} requeridos</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requiredDocs.map((doc) => (
                        <DocumentCard
                          key={doc.key}
                          doc={doc}
                          checked={documents[doc.key]}
                          onChange={(checked) => handleDocumentChange(doc.key, checked)}
                          documentUrl={documentUrls[doc.key]}
                          onDocumentUrlChange={(url) => handleDocumentUrlChange(doc.key, url)}
                          disabled={isLoading}
                          required={true}
                        />
                      ))}
                    </div>
                  </div>

                  {optionalDocs.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <h4 className="font-semibold text-gray-900">Documentos Opcionales</h4>
                        <Badge variant="primary" size="sm">{optionalDocs.length} opcionales</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {optionalDocs.map((doc) => (
                          <DocumentCard
                            key={doc.key}
                            doc={doc}
                            checked={documents[doc.key]}
                            onChange={(checked) => handleDocumentChange(doc.key, checked)}
                            documentUrl={documentUrls[doc.key]}
                            onDocumentUrlChange={(url) => handleDocumentUrlChange(doc.key, url)}
                            disabled={isLoading}
                            required={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Información importante:</p>
                        <ul className="space-y-1 text-blue-700">
                          <li>• Los documentos marcados con <span className="text-red-600 font-medium">*</span> son obligatorios para completar la matrícula</li>
                          <li>• Puede marcar documentos opcionales si el estudiante los ha presentado</li>
                          <li>• El progreso se guarda automáticamente al crear la matrícula</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}


          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {activeStep === 1 && (
              <Badge variant={progress === 100 ? "success" : progress >= 50 ? "warning" : "danger"} size="sm">
                {progress}% completado
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeStep > 0 ? (
              <Button type="button" variant="outline" icon={ArrowLeft} onClick={handlePrev} disabled={isLoading}>
                Anterior
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            )}

            {!isLastStep ? (
              <Button type="button" variant="primary" icon={ArrowRight} onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                icon={CheckCircle}
                loading={isLoading}
                onClick={() => {
                  const basicData = formData || {};
                  handleFormSubmit(basicData);
                }}
              >
                {enrollment?.id ? "Actualizar Matrícula" : "Crear Matrícula"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Componente para cada tarjeta de documento
 */
function DocumentCard({ doc, checked, onChange, documentUrl, onDocumentUrlChange, disabled, required }) {
  const getDocumentIcon = (key) => {
    const icons = {
      birthCertificate: "📄",
      studentDni: "🆔",
      guardianDni: "👤",
      vaccinationCard: "💉",
      disabilityCertificate: "♿",
      utilityBill: "🧾",
      psychologicalReport: "🧠",
      studentPhoto: "📸",
      healthRecord: "🏥",
      signedEnrollmentForm: "📝",
      dniVerification: "✅"
    };
    return icons[key] || "📄";
  };

  return (
    <div
      className={`relative p-5 border-2 rounded-xl transition-all ${
        checked
          ? required
            ? "border-green-500 bg-green-50"
            : "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-4">
        {/* Icono y checkbox */}
        <div className="flex items-start gap-3 flex-shrink-0">
          <div className="text-3xl">{getDocumentIcon(doc.key)}</div>
          <label className="flex items-center cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-semibold text-gray-900 text-base">{doc.label}</span>
            {required && <span className="text-red-500 text-sm font-bold">*</span>}
            {checked && (
              <CheckCircle className={`h-5 w-5 ml-auto ${required ? "text-green-500" : "text-blue-500"}`} />
            )}
          </div>
          
          <div className="mb-3">
            <Badge variant={required ? "danger" : "primary"} size="sm">
              {required ? "Obligatorio" : "Opcional"}
            </Badge>
          </div>

          {/* Uploader de documentos */}
          <DocumentUploader
            documentKey={doc.key}
            value={documentUrl}
            onChange={onDocumentUrlChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

IntegratedEnrollmentForm.propTypes = {
  enrollment: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onReactivateSuccess: PropTypes.func,
};

DocumentCard.propTypes = {
  doc: PropTypes.object.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  documentUrl: PropTypes.string,
  onDocumentUrlChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool.isRequired,
};
