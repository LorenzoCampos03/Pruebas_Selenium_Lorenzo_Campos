import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit, Trash2, CheckCircle, Clock, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { ENROLLMENT_STATUS_LABELS } from "../../models/enrollmentModel";
import { getEnrollmentBlockReason } from "../../models/academicPeriodModel";
import { ExportEnrollmentDetailButton, ExportEnrollmentsButton } from "../shared/EnrollmentReportButton";
import Badge from "@/shared/components/ui/Badge";
import Button from "@/shared/components/ui/Button";
import Card from "@/shared/components/ui/Card";
import EmptyState from "@/shared/components/feedback/EmptyState";
import SearchInput from "@/shared/components/form/SearchInput";
import Spinner from "@/shared/components/ui/Spinner";
import { alertConfirmAction } from "@/shared/components/feedback/SweetAlertService";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function EnrollmentList({ enrollments, onEdit, onDelete, onView, onActivate, onSetPending, isLoading = false, institution = null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [activatingIds, setActivatingIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  // Filtrar enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enrollment) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const studentId = enrollment.studentId?.toLowerCase() || "";
        const studentName = enrollment.studentFullName?.toLowerCase() || "";
        const studentDoc = enrollment.studentDocumentNumber?.toLowerCase() || "";
        const enrollmentCode = enrollment.enrollmentCode?.toLowerCase() || "";
        const institutionName = enrollment.institutionName?.toLowerCase() || "";
        
        const matches = studentId.includes(term) || 
                       studentName.includes(term) || 
                       studentDoc.includes(term) ||
                       enrollmentCode.includes(term) ||
                       institutionName.includes(term);
        
        if (!matches) return false;
      }

      if (statusFilter && enrollment.enrollmentStatus !== statusFilter) return false;
      if (yearFilter && enrollment.academicYear !== yearFilter) return false;
      if (classroomFilter && enrollment.classroomId !== classroomFilter) return false;

      return true;
    });
  }, [enrollments, searchTerm, statusFilter, yearFilter, classroomFilter]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / pageSize));
  const paginatedEnrollments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEnrollments.slice(start, start + pageSize);
  }, [filteredEnrollments, currentPage, pageSize]);

  // Reiniciar página al cambiar filtros o tamaño
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, yearFilter, classroomFilter, pageSize]);

  // Obtener años únicos para el filtro
  const uniqueYears = useMemo(() => {
    const years = [...new Set(enrollments.map((e) => e.academicYear))];
    return years.sort((a, b) => b.localeCompare(a));
  }, [enrollments]);

  // Obtener aulas únicas para el filtro
  const uniqueClassrooms = useMemo(() => {
    const classrooms = enrollments
      .filter(e => e.classroomId && e.classroomName)
      .map(e => ({ id: e.classroomId, name: e.classroomName }));
    const uniqueMap = new Map();
    classrooms.forEach(c => uniqueMap.set(c.id, c));
    return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [enrollments]);

  const handleDelete = async (id) => {
    setDeletingIds(prev => new Set([...prev, id]));
    try {
      await onDelete(id);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleActivate = async (id) => {
    setActivatingIds(prev => new Set([...prev, id]));
    try {
      await onActivate(id);
    } finally {
      setActivatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleSetPending = async (id) => {
    setPendingIds(prev => new Set([...prev, id]));
    try {
      await onSetPending(id);
    } finally {
      setPendingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const showActivateConfirm = async (id) => {
    const result = await alertConfirmAction({
      title: "Activar matrícula",
      message: "¿Estás seguro de activar esta matrícula?",
      confirmText: "Activar",
      cancelText: "Cancelar",
      icon: "warning",
      confirmColor: "amber",
    });
    if (result.isConfirmed) {
      await handleActivate(id);
    }
  };

  const showSetPendingConfirm = async (id) => {
    const result = await alertConfirmAction({
      title: "Cambiar a pendiente",
      message: "¿Estás seguro de cambiar esta matrícula a pendiente?",
      confirmText: "Cambiar",
      cancelText: "Cancelar",
      icon: "warning",
      confirmColor: "amber",
    });
    if (result.isConfirmed) {
      await handleSetPending(id);
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-600 mt-4">Cargando matrículas...</p>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <EmptyState
        title="No hay matrículas"
        description="Comienza creando una nueva matrícula"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Buscar</label>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Nombre, DNI, código..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ENROLLMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Año Académico</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="">Todos los años</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Aula</label>
            <select
              value={classroomFilter}
              onChange={(e) => setClassroomFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="">Todas las aulas</option>
              {uniqueClassrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredEnrollments.length} de {enrollments.length} matrículas
          </div>
          <div className="flex items-center gap-2">
            {filteredEnrollments.length > 0 && institution && (
              <ExportEnrollmentsButton
                enrollments={filteredEnrollments}
                institution={institution}
                filters={{ searchTerm, statusFilter, yearFilter, classroomFilter }}
                className="text-sm"
              />
            )}
            {(searchTerm || statusFilter || yearFilter || classroomFilter) && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setYearFilter("");
                setClassroomFilter("");
              }}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institución</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence mode="popLayout">
                {paginatedEnrollments.map((enrollment, index) => (
                  <motion.tr
                    key={enrollment.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.04)" }}
                    className="transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {enrollment.enrollmentCode || enrollment.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{enrollment.studentFullName || enrollment.studentId}</p>
                        {enrollment.studentDocumentNumber && (
                          <p className="text-xs text-gray-500">DNI: {enrollment.studentDocumentNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p className="font-medium">{enrollment.institutionName || enrollment.institutionId}</p>
                        {enrollment.institutionCode && (
                          <p className="text-xs text-gray-500">{enrollment.institutionCode}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p className="font-medium">{enrollment.classroomName || enrollment.classroomId}</p>
                        {enrollment.classroomGrade && (
                          <p className="text-xs text-gray-500">Grado: {enrollment.classroomGrade}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {enrollment.shift}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(enrollment.enrollmentStatus)} size="sm">
                        {ENROLLMENT_STATUS_LABELS[enrollment.enrollmentStatus] || enrollment.enrollmentStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onView(enrollment.id)} className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalles">
                          <Eye size={16} />
                        </button>
                        {(enrollment.enrollmentStatus === "CANCELLED" || (enrollment.academicPeriod && getEnrollmentBlockReason(enrollment.academicPeriod) !== null)) ? (
                          <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 bg-gray-50 rounded-md" title={
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
                            <button onClick={() => onEdit(enrollment.id)} className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors" title="Editar">
                              <Edit size={16} />
                            </button>
                            {enrollment.enrollmentStatus === "PENDING" && (
                              <button
                                onClick={() => showActivateConfirm(enrollment.id)}
                                disabled={activatingIds.has(enrollment.id)}
                                className="p-1.5 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Activar matrícula"
                              >
                                {activatingIds.has(enrollment.id) ? (
                                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                              </button>
                            )}
                            {enrollment.enrollmentStatus === "INACTIVE" && (
                              <button
                                onClick={() => showSetPendingConfirm(enrollment.id)}
                                disabled={pendingIds.has(enrollment.id)}
                                className="p-1.5 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Cambiar a pendiente"
                              >
                                {pendingIds.has(enrollment.id) ? (
                                  <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Clock size={16} />
                                )}
                              </button>
                            )}
                            <ExportEnrollmentDetailButton
                              enrollment={enrollment}
                              student={enrollment.student}
                              institution={institution}
                              classroom={enrollment.classroom}
                              academicPeriod={enrollment.academicPeriod}
                              iconOnly={true}
                            />
                            {enrollment.enrollmentStatus !== "INACTIVE" && (
                              <button
                                onClick={() => handleDelete(enrollment.id)}
                                disabled={deletingIds.has(enrollment.id)}
                                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Eliminar"
                              >
                                {deletingIds.has(enrollment.id) ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredEnrollments.length === 0 && (
          <div className="text-center py-8">
            <EmptyState title="No se encontraron matrículas" description="Intenta con otros filtros" />
          </div>
        )}

        {/* Paginación */}
        {filteredEnrollments.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Filas por página:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="ml-2">
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredEnrollments.length)} de {filteredEnrollments.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

EnrollmentList.propTypes = {
  enrollments: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onActivate: PropTypes.func.isRequired,
  onSetPending: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  institution: PropTypes.object,
};

/**
 * Mapea el status de enrollment a variante de Badge compartido
 */
function getStatusVariant(status) {
  const variants = {
    ACTIVE: "success",
    INACTIVE: "gray",
    PENDING: "warning",
    CANCELLED: "danger",
  };
  return variants[status] || "gray";
}
