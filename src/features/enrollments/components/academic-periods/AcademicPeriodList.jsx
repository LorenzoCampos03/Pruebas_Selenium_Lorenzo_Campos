import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { Edit, Trash2, Calendar, Users, Lock, AlertCircle, XCircle, PlayCircle, Clock } from "lucide-react";
import { PERIOD_STATUS_LABELS, getEnrollmentPeriodStatus } from "../../models/academicPeriodModel";
import { enrollmentService } from "../../services/enrollmentService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { AcademicPeriodDetailModal } from "./AcademicPeriodDetailModal";
import { ExportPeriodDetailButton, ExportPeriodsButton } from "../shared/AcademicPeriodReportButton";
import Badge from "@/shared/components/ui/Badge";
import Button from "@/shared/components/ui/Button";
import Card from "@/shared/components/ui/Card";
import EmptyState from "@/shared/components/feedback/EmptyState";
import SearchInput from "@/shared/components/form/SearchInput";

/**
 * Lista de períodos académicos - Diseño minimalista con componentes compartidos
 */
export function AcademicPeriodList({
  periods,
  onEdit,
  onDelete,
  onActivate,
  onClose,
  isLoading = false,
  institution = {},
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [enrollmentCounts, setEnrollmentCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [detailModalPeriod, setDetailModalPeriod] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Cargar conteo de matrículas para cada período
  useEffect(() => {
    const loadEnrollmentCounts = async () => {
      setLoadingCounts(true);
      try {
        // Obtener matrículas filtradas por institución si está disponible
        let response;
        if (institution?.id) {
          response = await enrollmentService.getByInstitution(institution.id);
        } else {
          // Fallback: si no hay institución, no cargar nada para evitar mostrar datos de otras instituciones
          console.warn("No se puede cargar conteo de matrículas sin institutionId");
          setEnrollmentCounts({});
          setLoadingCounts(false);
          return;
        }
        
        const enrollments = isSuccessResponse(response) ? extractData(response) : response;
        
        // Contar matrículas por período académico
        const counts = {};
        if (Array.isArray(enrollments)) {
          enrollments.forEach(enrollment => {
            const periodId = enrollment.academicPeriodId;
            if (periodId) {
              counts[periodId] = (counts[periodId] || 0) + 1;
            }
          });
        }
        
        setEnrollmentCounts(counts);
      } catch (error) {
        console.error("Error al cargar conteo de matrículas:", error);
        setEnrollmentCounts({});
      } finally {
        setLoadingCounts(false);
      }
    };

    if (periods.length > 0) {
      loadEnrollmentCounts();
    }
  }, [periods, institution?.id]);

  // Filtrar períodos
  const filteredPeriods = useMemo(() => {
    return periods.filter((period) => {
      // Filtro de búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const periodName = period.periodName?.toLowerCase() || "";
        const academicYear = period.academicYear?.toLowerCase() || "";
        if (!periodName.includes(term) && !academicYear.includes(term)) {
          return false;
        }
      }

      // Filtro de estado
      if (statusFilter && period.status !== statusFilter) {
        return false;
      }

      // Filtro de año
      if (yearFilter && period.academicYear !== yearFilter) {
        return false;
      }

      return true;
    });
  }, [periods, searchTerm, statusFilter, yearFilter]);

  // Obtener años únicos para el filtro
  const uniqueYears = useMemo(() => {
    const years = [...new Set(periods.map((p) => p.academicYear))];
    return years.sort((a, b) => b.localeCompare(a));
  }, [periods]);

  // Skeleton loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded-xl flex-1 animate-pulse"></div>
          <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} padding="p-5">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No hay períodos académicos"
        description="Comienza creando tu primer período académico"
        action={
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm">
            <AlertCircle size={14} />
            Haz clic en "Nuevo Período"
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros compactos con componentes compartidos */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Búsqueda con SearchInput compartido */}
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar período o año..."
          className="flex-1"
        />

        {/* Filtro de estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-48 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        >
          <option value="">Todos los estados</option>
          {Object.entries(PERIOD_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Filtro de año */}
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="sm:w-40 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        >
          <option value="">Todos los años</option>
          {uniqueYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* Limpiar filtros */}
        {(searchTerm || statusFilter || yearFilter) && (
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setYearFilter("");
            }}
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Contador de resultados y botón de exportar */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {filteredPeriods.length} {filteredPeriods.length === 1 ? "período" : "períodos"}
          {filteredPeriods.length !== periods.length && ` de ${periods.length}`}
        </span>
        
        {/* Botón de exportar solo los datos filtrados */}
        {filteredPeriods.length > 0 && (
          <ExportPeriodsButton
            periods={filteredPeriods}
            institution={institution}
            filters={{
              searchTerm,
              statusFilter,
              yearFilter
            }}
          />
        )}
      </div>

      {/* Lista de períodos - Grid con Cards compartidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPeriods.map((period) => {
          const enrollmentStatus = getEnrollmentPeriodStatus(period);
          const enrollmentCount = enrollmentCounts[period.id] || 0;
          const hasEnrollments = enrollmentCount > 0;
          const canDelete = !hasEnrollments;
          const canDeactivate = !hasEnrollments || period.status !== "ACTIVE";
          const isHovered = hoveredCard === period.id;
          
          return (
            <Card
              key={period.id}
              padding="p-0"
              className="hover:shadow-md transition-all duration-200"
              onMouseEnter={() => setHoveredCard(period.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Header minimalista */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                      {period.periodName}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Calendar size={14} />
                      {period.academicYear}
                    </p>
                  </div>
                  
                  {/* Status badge compartido */}
                  <div className="flex flex-col gap-1.5 items-end ml-3">
                    <Badge variant={getStatusVariant(period.status)} size="sm" dot>
                      {PERIOD_STATUS_LABELS[period.status]}
                    </Badge>
                  </div>
                </div>

                {/* Enrollment status badge */}
                <div className="flex items-center gap-2">
                  <Badge variant={getEnrollmentStatusVariant(enrollmentStatus)} size="sm">
                    {getEnrollmentStatusLabel(enrollmentStatus)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {loadingCounts ? "..." : `${enrollmentCount} ${enrollmentCount === 1 ? "matrícula" : "matrículas"}`}
                  </span>
                </div>
              </div>

              {/* Contenido del Card */}
              <div className="p-4">
                <div className="grid grid-cols-1 gap-3">
                  {/* Período Académico */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="p-1 bg-blue-100 rounded">
                        <Calendar size={12} className="text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-xs">Período Académico</h4>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs bg-white px-2 py-1.5 rounded">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock size={10} className="text-gray-400" />
                          Inicio:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {new Date(period.startDate).toLocaleDateString("es-PE", { 
                            day: '2-digit', 
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-white px-2 py-1.5 rounded">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock size={10} className="text-gray-400" />
                          Fin:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {new Date(period.endDate).toLocaleDateString("es-PE", { 
                            day: '2-digit', 
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Período de Matrícula */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="p-1 bg-blue-200 rounded">
                        <Users size={12} className="text-blue-700" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-xs">Período de Matrícula</h4>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs bg-white px-2 py-1.5 rounded">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock size={10} className="text-gray-400" />
                          Inicio:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {new Date(period.enrollmentPeriodStart).toLocaleDateString("es-PE", { 
                            day: '2-digit', 
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-white px-2 py-1.5 rounded">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock size={10} className="text-gray-400" />
                          Fin:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {new Date(period.enrollmentPeriodEnd).toLocaleDateString("es-PE", { 
                            day: '2-digit', 
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matrícula Tardía (si aplica) */}
                {period.allowLateEnrollment && period.lateEnrollmentEndDate && (
                  <div className="mt-3 bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="p-1 bg-yellow-200 rounded">
                        <AlertCircle size={12} className="text-yellow-700" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-xs">Matrícula Tardía</h4>
                    </div>
                    <p className="text-xs text-gray-700">
                      Hasta el{" "}
                      <span className="font-bold text-yellow-700">
                        {new Date(period.lateEnrollmentEndDate).toLocaleDateString("es-PE", { 
                          day: '2-digit', 
                          month: 'short'
                        })}
                      </span>
                    </p>
                  </div>
                )}

                {/* Advertencia protección */}
                {hasEnrollments && (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <Lock size={14} />
                    <span>Protegido ({enrollmentCount} {enrollmentCount === 1 ? "matrícula" : "matrículas"})</span>
                  </div>
                )}
              </div>

              {/* Acciones - visible en hover con Buttons compartidos */}
              <div className={`border-t border-gray-100 p-3 flex items-center justify-between transition-opacity ${isHovered ? 'opacity-100' : 'opacity-60'}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetailModalPeriod(period)}
                >
                  Ver detalles
                </Button>

                <div className="flex items-center gap-1">
                  {/* Exportar PDF */}
                  <ExportPeriodDetailButton
                    period={period}
                    institution={institution}
                    enrollmentCount={enrollmentCount}
                    iconOnly={true}
                  />

                  {/* Editar */}
                  <button
                    onClick={() => onEdit(period)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>

                  {/* Activar/Desactivar */}
                  {period.status === "ACTIVE" ? (
                    <button
                      onClick={() => {
                        if (!canDeactivate) {
                          alert(`No se puede desactivar este período porque tiene ${enrollmentCount} matrícula(s) asociada(s).`);
                          return;
                        }
                        onClose(period.id);
                      }}
                      disabled={!canDeactivate}
                      className={`p-2 rounded transition-colors ${
                        canDeactivate
                          ? "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title={canDeactivate ? "Desactivar" : "No se puede desactivar"}
                    >
                      <XCircle size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => onActivate(period.id)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Activar"
                    >
                      <PlayCircle size={16} />
                    </button>
                  )}

                  {/* Eliminar */}
                  <button
                    onClick={() => {
                      if (!canDelete) {
                        alert(`No se puede eliminar este período porque tiene ${enrollmentCount} matrícula(s) asociada(s).`);
                        return;
                      }
                      onDelete(period.id);
                    }}
                    disabled={!canDelete}
                    className={`p-2 rounded transition-colors ${
                      canDelete
                        ? "text-gray-600 hover:text-red-600 hover:bg-red-50"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                    title={canDelete ? "Eliminar" : "No se puede eliminar"}
                  >
                    {canDelete ? <Trash2 size={16} /> : <Lock size={16} />}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Mensaje cuando no hay resultados filtrados */}
      {filteredPeriods.length === 0 && periods.length > 0 && (
        <EmptyState
          icon={AlertCircle}
          title="No se encontraron períodos"
          description="Intenta con otros filtros"
          action={
            <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(""); setStatusFilter(""); }}>
              Limpiar filtros
            </Button>
          }
        />
      )}

      {/* Modal de detalles completos */}
      {detailModalPeriod && (
        <AcademicPeriodDetailModal
          period={detailModalPeriod}
          enrollmentCount={enrollmentCounts[detailModalPeriod.id] || 0}
          institution={institution}
          onClose={() => setDetailModalPeriod(null)}
        />
      )}
    </div>
  );
}

AcademicPeriodList.propTypes = {
  periods: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onActivate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  institution: PropTypes.object,
};

/**
 * Mapea el status del período a variante de Badge compartido
 */
function getStatusVariant(status) {
  const variants = {
    ACTIVE: "success",
    INACTIVE: "gray",
    PENDING: "warning",
    CLOSED: "danger",
  };
  return variants[status] || "gray";
}

/**
 * Mapea el status de matrícula a variante de Badge compartido
 */
function getEnrollmentStatusVariant(status) {
  const variants = {
    open: "primary",
    late: "warning",
    closed: "gray",
    upcoming: "purple",
  };
  return variants[status] || "gray";
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
