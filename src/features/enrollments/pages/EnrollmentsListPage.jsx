import { useEffect, useRef, useState, useMemo } from "react";
import { Plus, Archive, FileText, CheckCircle, Clock, XCircle, Calendar, AlertTriangle } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useEnrollments } from "../hooks/useEnrollments";
import { useAcademicPeriods } from "../hooks/useAcademicPeriods";
import { institutionService } from "@/features/institutions/services/institutionService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { getEnrollmentBlockReason } from "../models/academicPeriodModel";
import { EnrollmentList } from "../components/enrollment-forms/EnrollmentList";
import { EnrollmentCreateModal } from "../components/modals/EnrollmentCreateModal";
import { EnrollmentDetailModal } from "../components/modals/EnrollmentDetailModal";
import { EnrollmentEditModal } from "../components/modals/EnrollmentEditModal";
import Button from "@/shared/components/ui/Button";
import Card from "@/shared/components/ui/Card";

export default function EnrollmentsListPage() {
  const { user } = useAuth();
  const { enrollments, loading, fetchByInstitution, deleteEnrollment, activateEnrollment, setPendingEnrollment, archiveByYear } = useEnrollments();
  const { periods, fetchByInstitution: fetchPeriods } = useAcademicPeriods();
  const [institution, setInstitution] = useState(null);
  const [userSelectedPeriodId, setUserSelectedPeriodId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    if (!user?.institutionId) return;

    const initInstitution = async () => {
      try {
        const response = await institutionService.getById(user.institutionId);
        const data = isSuccessResponse(response) ? extractData(response) : response;
        setInstitution(data);
      } catch (error) {
        console.error("Error al cargar institución:", error);
        setInstitution({ name: "Sistema SIGEI", logoUrl: null, colorInstitution: null });
      }
    };

    fetchByInstitution(user.institutionId);
    fetchPeriods(user.institutionId);
    initInstitution();
  }, [fetchByInstitution, fetchPeriods, user?.institutionId]);

  const selectedPeriodId = useMemo(() => {
    if (userSelectedPeriodId) return userSelectedPeriodId;
    if (periods.length === 0) return "";
    const active = periods.find(p => p.status === "ACTIVE");
    const currentYear = new Date().getFullYear().toString();
    const currentYearPeriod = periods.find(p => p.academicYear === currentYear);
    return active?.id || currentYearPeriod?.id || periods[0]?.id || "";
  }, [userSelectedPeriodId, periods]);

  const selectedPeriod = useMemo(() => {
    return periods.find(p => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  const isCreateDisabled = selectedPeriod ? getEnrollmentBlockReason(selectedPeriod) !== null : false;

  const setSelectedPeriodId = (id) => setUserSelectedPeriodId(id);

  const filteredEnrollments = useMemo(() => {
    if (!selectedPeriodId) return enrollments;
    return enrollments.filter(e => e.academicPeriodId === selectedPeriodId);
  }, [enrollments, selectedPeriodId]);

  const handleRefresh = () => {
    if (user?.institutionId) {
      fetchByInstitution(user.institutionId);
    }
  };

  const handleCreate = () => {
    setCreateModalOpen(true);
  };

  const handleEdit = (id) => {
    setSelectedEnrollmentId(id);
    setEditModalOpen(true);
  };

  const handleEditFromDetail = (id) => {
    setDetailModalOpen(false);
    setSelectedEnrollmentId(id);
    setEditModalOpen(true);
  };

  const handleView = (id) => {
    setSelectedEnrollmentId(id);
    setDetailModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await deleteEnrollment(id);
      if (result === true && user?.institutionId) {
        fetchByInstitution(user.institutionId);
      }
    } catch (error) {
      console.error("Error inesperado al eliminar:", error);
    }
  };

  const handleActivate = async (id) => {
    try {
      const result = await activateEnrollment(id);
      if (result === true && user?.institutionId) {
        fetchByInstitution(user.institutionId);
      }
    } catch (error) {
      console.error("Error inesperado al activar:", error);
    }
  };

  const handleSetPending = async (id) => {
    try {
      const result = await setPendingEnrollment(id);
      if (result === true && user?.institutionId) {
        fetchByInstitution(user.institutionId);
      }
    } catch (error) {
      console.error("Error inesperado al cambiar a pendiente:", error);
    }
  };

  const handleArchive = async () => {
    const period = periods.find(p => p.id === selectedPeriodId);
    const year = period?.academicYear;
    if (!year) return;

    const result = await archiveByYear(year);
    if (result === true && user?.institutionId) {
      fetchByInstitution(user.institutionId);
    }
  };

  const stats = {
    total: filteredEnrollments.length,
    active: filteredEnrollments.filter(e => e.enrollmentStatus === "ACTIVE").length,
    pending: filteredEnrollments.filter(e => e.enrollmentStatus === "PENDING").length,
    inactive: filteredEnrollments.filter(e => e.enrollmentStatus === "INACTIVE").length,
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: FileText, color: "blue" },
    { label: "Activas", value: stats.active, icon: CheckCircle, color: "green" },
    { label: "Pendientes", value: stats.pending, icon: Clock, color: "yellow" },
    { label: "Inactivas", value: stats.inactive, icon: XCircle, color: "red" },
  ];

  const colorMap = {
    blue: "bg-blue-50 text-blue-600 bg-blue-100",
    green: "bg-green-50 text-green-600 bg-green-100",
    yellow: "bg-yellow-50 text-yellow-600 bg-yellow-100",
    red: "bg-red-50 text-red-600 bg-red-100",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-lg">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Matrículas</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {filteredEnrollments.length} {filteredEnrollments.length === 1 ? 'matrícula' : 'matrículas'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {periods.length === 0 && (
                    <option value="">Cargando períodos...</option>
                  )}
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.periodName} ({period.academicYear}) - {period.status === "ACTIVE" ? "Vigente" : period.status}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                size="md"
                icon={Archive}
                onClick={handleArchive}
              >
                Archivar
              </Button>
              <div className="relative group">
                <Button
                  variant="primary"
                  size="md"
                  icon={isCreateDisabled ? AlertTriangle : Plus}
                  onClick={handleCreate}
                  disabled={isCreateDisabled}
                >
                  {isCreateDisabled ? (getEnrollmentBlockReason(selectedPeriod) === "periodo_cerrado" ? "Período cerrado" : "Matrícula cerrada") : "Nueva Matrícula"}
                </Button>
                {isCreateDisabled && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {getEnrollmentBlockReason(selectedPeriod) === "periodo_cerrado" ? "No se pueden crear matrículas en un período cerrado" : "No se pueden crear matrículas, la ventana de matrícula finalizó"}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat) => {
            const colors = colorMap[stat.color].split(" ");
            return (
              <Card key={stat.label} padding="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${colors[2]}`}>
                    <stat.icon className={`w-5 h-5 ${colors[1]}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Alerta de período/matrícula cerrada */}
        {isCreateDisabled && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {getEnrollmentBlockReason(selectedPeriod) === "periodo_cerrado" ? "Período académico cerrado" : "Matrícula cerrada"}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {getEnrollmentBlockReason(selectedPeriod) === "periodo_cerrado"
                    ? `El período académico "${selectedPeriod?.periodName}" (${selectedPeriod?.academicYear}) está cerrado. No es posible crear, editar o reactivar matrículas en este período.`
                    : `La ventana de matrícula para "${selectedPeriod?.periodName}" (${selectedPeriod?.academicYear}) ha finalizado. No es posible crear, editar o reactivar matrículas.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de matrículas */}
        <EnrollmentList
          enrollments={filteredEnrollments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onActivate={handleActivate}
          onSetPending={handleSetPending}
          isLoading={loading}
          institution={institution}
        />
      </div>

      {/* Create Modal */}
      <EnrollmentCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleRefresh}
        onReactivateSuccess={handleRefresh}
      />

      {/* Detail Modal */}
      <EnrollmentDetailModal
        enrollmentId={selectedEnrollmentId}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedEnrollmentId(null);
        }}
        onSuccess={handleRefresh}
        onEdit={handleEditFromDetail}
      />

      {/* Edit Modal */}
      <EnrollmentEditModal
        enrollmentId={selectedEnrollmentId}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedEnrollmentId(null);
        }}
        onSuccess={handleRefresh}
        onReactivateSuccess={handleRefresh}
      />
    </div>
  );
}
