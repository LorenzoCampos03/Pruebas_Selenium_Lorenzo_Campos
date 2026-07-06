import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FileText, Edit, Trash2, CheckCircle, Clock, Lock, User, BookOpen, Building2, Calendar } from "lucide-react";
import { useEnrollments } from "../../hooks/useEnrollments";
import { academicPeriodService } from "../../services/academicPeriodService";
import { getEnrollmentBlockReason, parseAcademicPeriodFromApi } from "../../models/academicPeriodModel";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { ExportEnrollmentDetailButton } from "../shared/EnrollmentReportButton";
import { DocumentViewer } from "../shared/DocumentViewer";
import {
  parseEnrollmentFromApi,
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_TYPE_LABELS,
  REQUIRED_DOCUMENTS,
} from "../../models/enrollmentModel";
import { Modal } from "../shared/Modal";
import Card from "@/shared/components/ui/Card";
import Badge from "@/shared/components/ui/Badge";
import Button from "@/shared/components/ui/Button";
import { alertConfirmAction } from "@/shared/components/feedback/SweetAlertService";

export function EnrollmentDetailModal({ enrollmentId, isOpen, onClose, onSuccess, onEdit }) {
  const { fetchById, deleteEnrollment, activateEnrollment, setPendingEnrollment } = useEnrollments();
  const [enrollment, setEnrollment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isSettingPending, setIsSettingPending] = useState(false);

  useEffect(() => {
    if (!isOpen || !enrollmentId) return;

    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchById(enrollmentId);
        const parsed = parseEnrollmentFromApi(data);

        if (parsed.academicPeriodId && !parsed.academicPeriod) {
          try {
            const periodResponse = await academicPeriodService.getById(parsed.academicPeriodId);
            const periodData = isSuccessResponse(periodResponse)
              ? extractData(periodResponse)
              : periodResponse;
            parsed.academicPeriod = parseAcademicPeriodFromApi(periodData);
          } catch (err) {
            console.warn("No se pudo cargar el período académico:", err);
          }
        }

        if (mounted) {
          setEnrollment(parsed);
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

  const refreshEnrollment = async () => {
    if (!enrollmentId) return;
    try {
      const data = await fetchById(enrollmentId);
      setEnrollment(parseEnrollmentFromApi(data));
    } catch (error) {
      console.error("Error al refrescar matrícula:", error);
    }
  };

  const handleEdit = () => {
    onEdit?.(enrollmentId);
  };

  const handleDelete = async () => {
    const confirm = await alertConfirmAction({
      title: "Eliminar matrícula",
      message: "¿Estás seguro de eliminar esta matrícula? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      icon: "warning",
      confirmColor: "red",
    });
    if (!confirm.isConfirmed) return;

    const result = await deleteEnrollment(enrollmentId);
    if (result) {
      onSuccess?.();
      onClose();
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const result = await activateEnrollment(enrollmentId);
      if (result) {
        await refreshEnrollment();
        onSuccess?.();
      }
    } finally {
      setIsActivating(false);
    }
  };

  const handleSetPending = async () => {
    setIsSettingPending(true);
    try {
      const result = await setPendingEnrollment(enrollmentId);
      if (result) {
        await refreshEnrollment();
        onSuccess?.();
      }
    } finally {
      setIsSettingPending(false);
    }
  };

  const showActivateConfirm = async () => {
    const result = await alertConfirmAction({
      title: "Activar matrícula",
      message: "¿Estás seguro de activar esta matrícula?",
      confirmText: "Activar",
      cancelText: "Cancelar",
      icon: "warning",
      confirmColor: "amber",
    });
    if (result.isConfirmed) handleActivate();
  };

  const showSetPendingConfirm = async () => {
    const result = await alertConfirmAction({
      title: "Cambiar a pendiente",
      message: "¿Estás seguro de cambiar esta matrícula a pendiente?",
      confirmText: "Cambiar",
      cancelText: "Cancelar",
      icon: "warning",
      confirmColor: "amber",
    });
    if (result.isConfirmed) handleSetPending();
  };

  const getBadgeVariant = (status) => {
    const variants = {
      ACTIVE: "success",
      INACTIVE: "gray",
      PENDING: "warning",
      CANCELLED: "danger",
    };
    return variants[status] || "gray";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de Matrícula"
      subtitle={enrollment ? `Código: ${enrollment.enrollmentCode || enrollment.id}` : "Cargando..."}
      icon={FileText}
      size="4xl"
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
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <Badge variant={getBadgeVariant(enrollment.enrollmentStatus)} size="md">
              {ENROLLMENT_STATUS_LABELS[enrollment.enrollmentStatus]}
            </Badge>
            <div className="flex items-center gap-2">
              <ExportEnrollmentDetailButton
                enrollment={enrollment}
                student={enrollment.student}
                institution={enrollment.institution}
                classroom={enrollment.classroom}
                academicPeriod={enrollment.academicPeriod}
              />
              {enrollment.enrollmentStatus === "CANCELLED" || (enrollment.academicPeriod && getEnrollmentBlockReason(enrollment.academicPeriod) !== null) ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 bg-gray-100 rounded-lg" title={
                  enrollment.enrollmentStatus === "CANCELLED"
                    ? "Matrícula cancelada"
                    : getEnrollmentBlockReason(enrollment.academicPeriod) === "periodo_cerrado"
                      ? "El período académico está cerrado"
                      : "La ventana de matrícula finalizó"
                }>
                  <Lock size={14} />
                  Bloqueado
                </span>
              ) : (
                <>
                  {enrollment.enrollmentStatus === "PENDING" && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle}
                      loading={isActivating}
                      onClick={showActivateConfirm}
                    >
                      Activar
                    </Button>
                  )}
                  {enrollment.enrollmentStatus === "INACTIVE" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Clock}
                      loading={isSettingPending}
                      onClick={showSetPendingConfirm}
                    >
                      Pendiente
                    </Button>
                  )}
                  <Button variant="primary" size="sm" icon={Edit} onClick={handleEdit}>
                    Editar
                  </Button>
                  {enrollment.enrollmentStatus !== "INACTIVE" && (
                    <Button variant="danger" size="sm" icon={Trash2} onClick={handleDelete}>
                      Eliminar
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Enrollment Info */}
              <Card padding="p-0">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-900" />
                    <h3 className="font-semibold text-gray-900">Información de Matrícula</h3>
                  </div>
                </div>
                <div className="p-5">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField label="Estado" value={ENROLLMENT_STATUS_LABELS[enrollment.enrollmentStatus]} badge={getBadgeVariant(enrollment.enrollmentStatus)} />
                    <InfoField label="Tipo" value={ENROLLMENT_TYPE_LABELS[enrollment.enrollmentType]} />
                    <InfoField label="Fecha de Matrícula" value={enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString("es-PE") : "N/A"} />
                    <InfoField label="Código" value={enrollment.enrollmentCode || "Auto"} />
                  </dl>
                </div>
              </Card>

              {/* Academic Info */}
              <Card padding="p-0">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-900" />
                    <h3 className="font-semibold text-gray-900">Información Académica</h3>
                  </div>
                </div>
                <div className="p-5">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField label="Año Académico" value={enrollment.academicYear} />
                    <InfoField label="Período Académico" value={formatPeriodName(enrollment)} />
                    <InfoField label="Turno" value={enrollment.shift} />
                    <InfoField label="Modalidad" value={enrollment.modality} />
                    <InfoField label="Grupo de Edad" value={enrollment.ageGroup} />
                  </dl>
                  {enrollment.observations && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <dt className="text-sm font-medium text-gray-500 mb-1">Observaciones</dt>
                      <dd className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{enrollment.observations}</dd>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Student Card */}
              <Card padding="p-0">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-900" />
                    <h3 className="font-semibold text-gray-900">Estudiante</h3>
                  </div>
                </div>
                <div className="p-5">
                  <dl className="space-y-3">
                    {enrollment.studentFullName && (
                      <InfoField label="Nombre" value={enrollment.studentFullName} bold />
                    )}
                    {enrollment.studentDocumentNumber && (
                      <InfoField label="Documento" value={enrollment.studentDocumentNumber} />
                    )}
                    <InfoField label="Edad" value={enrollment.studentAge ? `${enrollment.studentAge} años` : "N/A"} />
                  </dl>
                </div>
              </Card>

              {/* Institution Card */}
              <Card padding="p-0">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-900" />
                    <h3 className="font-semibold text-gray-900">Institución y Aula</h3>
                  </div>
                </div>
                <div className="p-5">
                  <dl className="space-y-3">
                    {enrollment.institutionName && (
                      <InfoField label="Institución" value={enrollment.institutionName} bold />
                    )}
                    {enrollment.institutionCode && (
                      <InfoField label="Código" value={enrollment.institutionCode} />
                    )}
                    {enrollment.classroomName && (
                      <InfoField label="Aula" value={enrollment.classroomName} bold />
                    )}
                    {enrollment.classroomGrade && (
                      <InfoField label="Grado" value={enrollment.classroomGrade} />
                    )}
                  </dl>
                </div>
              </Card>

              {/* Document Progress */}
              <Card padding="p-0">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-900" />
                    <h3 className="font-semibold text-gray-900">Documentos</h3>
                  </div>
                </div>
                <div className="p-5">
                  {(() => {
                    const totalDocs = REQUIRED_DOCUMENTS.length;
                    const completedDocs = REQUIRED_DOCUMENTS.filter(doc => enrollment[doc.key]).length;
                    const pct = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {completedDocs} de {totalDocs}
                          </span>
                          <Badge variant={pct === 100 ? "success" : pct >= 70 ? "warning" : "danger"} size="sm">
                            {pct}%
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${
                              pct === 100 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Card>
            </div>
          </div>

          {/* Documentos de Matrícula */}
          <Card padding="p-0">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-900" />
                <h3 className="font-semibold text-gray-900">Documentos de Matrícula</h3>
              </div>
            </div>
            <div className="p-5">
              <DocumentViewer enrollment={enrollment} />
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
}

function InfoField({ label, value, bold = false, badge }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5">
        {badge ? (
          <Badge variant={badge} size="sm">{value}</Badge>
        ) : (
          <span className={`text-sm ${bold ? "font-semibold" : ""} text-gray-900`}>
            {value || <span className="text-gray-400">—</span>}
          </span>
        )}
      </dd>
    </div>
  );
}

function formatPeriodName(enrollment) {
  const period = enrollment.academicPeriod;
  if (period?.periodName) {
    const year = period.academicYear || enrollment.academicYear;
    return year ? `${period.periodName} (${year})` : period.periodName;
  }
  return enrollment.academicPeriodId || "—";
}

EnrollmentDetailModal.propTypes = {
  enrollmentId: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onEdit: PropTypes.func,
};
