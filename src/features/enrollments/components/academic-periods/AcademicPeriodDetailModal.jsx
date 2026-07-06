import PropTypes from "prop-types";
import { Calendar, Users, AlertCircle, X } from "lucide-react";
import { PERIOD_STATUS_LABELS, getEnrollmentPeriodStatus } from "../../models/academicPeriodModel";
import { ExportPeriodDetailButton } from "../shared/AcademicPeriodReportButton";

/**
 * Modal minimalista para ver detalles de un período académico
 */
export function AcademicPeriodDetailModal({ period, enrollmentCount = 0, onClose, institution = {} }) {
  if (!period) return null;

  const enrollmentStatus = getEnrollmentPeriodStatus(period);
  const hasEnrollments = enrollmentCount > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header compacto */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{period.periodName}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar size={14} />
                Año Académico {period.academicYear}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Badges */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md ${getStatusBadgeClass(period.status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(period.status)}`}></span>
              {PERIOD_STATUS_LABELS[period.status]}
            </span>
            <span className={`px-3 py-1 text-xs font-medium rounded-md ${getEnrollmentStatusBadgeClass(enrollmentStatus)}`}>
              {getEnrollmentStatusLabel(enrollmentStatus)}
            </span>
            <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
              {enrollmentCount} {enrollmentCount === 1 ? "matrícula" : "matrículas"}
            </span>
          </div>

          {/* Contenido */}
          <div className="px-6 py-6 space-y-6">
            {/* Período Académico */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                Período Académico
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Fecha de Inicio</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(period.startDate).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Fecha de Fin</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(period.endDate).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Duración: {Math.ceil((new Date(period.endDate) - new Date(period.startDate)) / (1000 * 60 * 60 * 24))} días
              </p>
            </div>

            {/* Período de Matrícula */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                Período de Matrícula
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Inicio de Matrícula</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(period.enrollmentPeriodStart).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Fin de Matrícula</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(period.enrollmentPeriodEnd).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Duración: {Math.ceil(
                  (new Date(period.enrollmentPeriodEnd) - new Date(period.enrollmentPeriodStart)) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                días
              </p>
            </div>

            {/* Matrícula Tardía */}
            {period.allowLateEnrollment && period.lateEnrollmentEndDate && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-600" />
                  Matrícula Tardía Habilitada
                </h3>
                <p className="text-sm text-gray-700">
                  Fecha límite:{" "}
                  <span className="font-semibold">
                    {new Date(period.lateEnrollmentEndDate).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
              </div>
            )}

            {/* Advertencia protección */}
            {hasEnrollments && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Período Protegido</h4>
                  <p className="text-sm text-blue-800">
                    Este período tiene {enrollmentCount} {enrollmentCount === 1 ? "matrícula" : "matrículas"} asociada(s).
                    No se puede eliminar ni desactivar.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center gap-3">
            <ExportPeriodDetailButton
              period={period}
              institution={institution}
              enrollmentCount={enrollmentCount}
              iconOnly={false}
              className="flex-1"
            />
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

AcademicPeriodDetailModal.propTypes = {
  period: PropTypes.object,
  enrollmentCount: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  institution: PropTypes.object,
};

/**
 * Obtiene las clases CSS para el badge de estado - minimalista
 */
function getStatusBadgeClass(status) {
  const classes = {
    ACTIVE: "bg-green-50 text-green-700 border border-green-200",
    INACTIVE: "bg-gray-50 text-gray-600 border border-gray-200",
    PENDING: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    CLOSED: "bg-red-50 text-red-700 border border-red-200",
  };
  return classes[status] || "bg-gray-50 text-gray-600 border border-gray-200";
}

/**
 * Obtiene el color del status dot
 */
function getStatusDotClass(status) {
  const classes = {
    ACTIVE: "bg-green-500",
    INACTIVE: "bg-gray-400",
    PENDING: "bg-yellow-500",
    CLOSED: "bg-red-500",
  };
  return classes[status] || "bg-gray-400";
}

/**
 * Obtiene las clases CSS para el badge de estado de matrícula - minimalista
 */
function getEnrollmentStatusBadgeClass(status) {
  const classes = {
    open: "bg-blue-50 text-blue-700 border border-blue-200",
    late: "bg-orange-50 text-orange-700 border border-orange-200",
    closed: "bg-gray-50 text-gray-600 border border-gray-200",
    upcoming: "bg-purple-50 text-purple-700 border border-purple-200",
  };
  return classes[status] || "bg-gray-50 text-gray-600 border border-gray-200";
}

/**
 * Obtiene la etiqueta para el estado de matrícula
 */
function getEnrollmentStatusLabel(status) {
  const labels = {
    open: "Matrícula Abierta",
    late: "Matrícula Tardía",
    closed: "Matrícula Cerrada",
    upcoming: "Próximamente",
  };
  return labels[status] || status;
}
