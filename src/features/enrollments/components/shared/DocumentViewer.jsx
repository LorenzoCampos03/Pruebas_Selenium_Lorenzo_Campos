import { useState } from "react";
import PropTypes from "prop-types";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { REQUIRED_DOCUMENTS, getDocumentUrlKey } from "../../models/enrollmentModel";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

/**
 * Componente para visualizar documentos de una matrícula (modo solo lectura)
 */
export function DocumentViewer({ enrollment }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

  if (!enrollment) return null;

  const requiredDocs = REQUIRED_DOCUMENTS.filter(doc => doc.required);
  const optionalDocs = REQUIRED_DOCUMENTS.filter(doc => !doc.required);

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

  const DocumentItem = ({ doc }) => {
    const isChecked = enrollment[doc.key];
    const urlKey = getDocumentUrlKey(doc.key);
    const documentUrl = enrollment[urlKey];

    return (
      <div
        className={`p-4 rounded-lg border-2 transition-all ${
          isChecked
            ? "border-green-300 bg-green-50"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">{getDocumentIcon(doc.key)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">{doc.label}</span>
              {doc.required && <span className="text-red-500 text-xs">*</span>}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              {isChecked ? (
                <div className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Presentado</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-500">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">No presentado</span>
                </div>
              )}
            </div>

            {documentUrl && (
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(documentUrl);
                  setPreviewTitle(doc.label);
                }}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Eye className="h-4 w-4" />
                Ver documento
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Documentos Obligatorios */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-red-500">●</span>
          Documentos Obligatorios
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requiredDocs.map((doc) => (
            <DocumentItem key={doc.key} doc={doc} />
          ))}
        </div>
      </div>

      {/* Documentos Opcionales */}
      {optionalDocs.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-blue-500">●</span>
            Documentos Opcionales
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {optionalDocs.map((doc) => (
              <DocumentItem key={doc.key} doc={doc} />
            ))}
          </div>
        </div>
      )}

      <DocumentPreviewModal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        url={previewUrl}
        title={previewTitle}
      />
    </div>
  );
}

DocumentViewer.propTypes = {
  enrollment: PropTypes.object.isRequired,
};
