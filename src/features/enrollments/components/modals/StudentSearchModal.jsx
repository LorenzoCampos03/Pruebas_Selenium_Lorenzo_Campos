import { useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { X, User, AlertCircle, CheckCircle, Info, Plus, RotateCcw } from "lucide-react";

export function StudentSearchModal({ isOpen, onClose, searchResult, onStudentSelected, onStudentNotFound, onReactivate, searching = false }) {
  const [reactivating, setReactivating] = useState(false);

  const handleClose = () => onClose();

  const handleReuse = () => {
    if (searchResult?.student) {
      onStudentSelected({ student: searchResult.student, enrollment: searchResult.enrollment });
      handleClose();
    }
  };

  const handleReactivate = async () => {
    if (!searchResult?.enrollment?.id || !onReactivate) return;
    setReactivating(true);
    try {
      await onReactivate(searchResult.enrollment.id);
      handleClose();
    } finally {
      setReactivating(false);
    }
  };

  const handleCreateNew = () => {
    if (onStudentNotFound && searchResult?.documentNumber) {
      onStudentNotFound(searchResult.documentNumber);
    }
    handleClose();
  };

  const getStatusLabel = (status) => {
    const labels = { ACTIVE: "Activo", INACTIVE: "Inactivo", PENDING: "Pendiente", CANCELLED: "Cancelado" };
    return labels[status] || status;
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ zIndex: 9999 }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-all duration-300"
          style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", backgroundColor: "rgba(0, 0, 0, 0.1)" }}
          onClick={handleClose}
          aria-hidden="true"
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div
          className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {searching ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-600">Buscando estudiante...</p>
            </div>
          ) : !searchResult ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-sm text-gray-500">No hay resultados de búsqueda</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Resultado de Búsqueda</h3>
                    <p className="text-sm text-gray-600">
                      {searchResult.type === "found" ? "Estudiante encontrado" : "Estudiante no encontrado"}
                    </p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" type="button" aria-label="Cerrar">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {searchResult.type === "found" && (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-green-900">
                            {searchResult.student.firstName} {searchResult.student.lastName} {searchResult.student.motherLastName || ""}
                          </p>
                          <p className="text-xs text-green-700">
                            DNI: {searchResult.student.documentNumber}
                            {searchResult.student.cui && ` • CUI: ${searchResult.student.cui}`}
                          </p>
                          {searchResult.student.dateOfBirth && (
                            <p className="text-xs text-green-600">
                              Nacimiento: {new Date(searchResult.student.dateOfBirth).toLocaleDateString()}
                            </p>
                          )}
                          {searchResult.student.gender && (
                            <p className="text-xs text-green-600">
                              Género: {searchResult.student.gender === "M" ? "Masculino" : "Femenino"}
                            </p>
                          )}
                        </div>
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      </div>
                    </div>

                    {searchResult.crossEnrollmentStatus === "cross_enrolled" ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-900">
                              Este estudiante YA ESTÁ MATRICULADO en {searchResult.crossEnrollment.institutionName || "otra institución"}
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              No puede matricularlo en esta institución porque ya cuenta con una matrícula activa en otra institución.
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                              <div>
                                <span className="text-red-600">Institución:</span>
                                <p className="font-medium text-red-800">{searchResult.crossEnrollment.institutionName || "—"}</p>
                              </div>
                              <div>
                                <span className="text-red-600">Aula:</span>
                                <p className="font-medium text-red-800">{searchResult.crossEnrollment.classroomName || "—"}</p>
                              </div>
                              <div>
                                <span className="text-red-600">Estado:</span>
                                <p className="font-medium text-red-800">{getStatusLabel(searchResult.crossEnrollment.enrollmentStatus)}</p>
                              </div>
                              <div>
                                <span className="text-red-600">Turno:</span>
                                <p className="font-medium text-red-800">{searchResult.crossEnrollment.shift || "—"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {searchResult.enrollmentStatus === "currently_enrolled" ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-900">
                              Este alumno YA ESTÁ MATRICULADO actualmente
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              No es posible realizar una nueva matrícula porque el estudiante ya cuenta con una matrícula activa o pendiente.
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                              <div>
                                <span className="text-red-600">Año:</span>
                                <p className="font-medium text-red-800">{searchResult.enrollment.academicYear || "—"}</p>
                              </div>
                              <div>
                                <span className="text-red-600">Aula:</span>
                                <p className="font-medium text-red-800">{searchResult.enrollment.classroomName || "—"}</p>
                              </div>
                              <div>
                                <span className="text-red-600">Turno:</span>
                                <p className="font-medium text-red-800">{searchResult.enrollment.shift || "—"}</p>
                              </div>
                              <div>
                                <span className="text-red-600">Modalidad:</span>
                                <p className="font-medium text-red-800">{searchResult.enrollment.modality || "—"}</p>
                              </div>
                              <div>
                                <span className="text-red-600">Estado:</span>
                                <p className="font-medium text-red-800">{getStatusLabel(searchResult.enrollment.enrollmentStatus)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : searchResult.enrollmentStatus === "inactive_in_period" ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <RotateCcw className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-900">
                              Este estudiante ya tiene una matrícula en este período académico en estado inactivo
                            </p>
                            <p className="text-sm text-amber-700 mt-1">
                              El estudiante ya cuenta con una matrícula registrada en <strong>este período académico</strong> pero se encuentra <strong>Inactiva</strong>. ¿Desea activarla?
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                              <div>
                                <span className="text-amber-600">Año:</span>
                                <p className="font-medium text-amber-800">{searchResult.enrollment.academicYear || "—"}</p>
                              </div>
                              <div>
                                <span className="text-amber-600">Aula:</span>
                                <p className="font-medium text-amber-800">{searchResult.enrollment.classroomName || "—"}</p>
                              </div>
                              <div>
                                <span className="text-amber-600">Turno:</span>
                                <p className="font-medium text-amber-800">{searchResult.enrollment.shift || "—"}</p>
                              </div>
                              <div>
                                <span className="text-amber-600">Modalidad:</span>
                                <p className="font-medium text-amber-800">{searchResult.enrollment.modality || "—"}</p>
                              </div>
                              <div>
                                <span className="text-amber-600">Estado:</span>
                                <p className="font-medium text-amber-800">{getStatusLabel(searchResult.enrollment.enrollmentStatus)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : searchResult.enrollmentStatus === "inactive_enrolled" ? (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <RotateCcw className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-orange-900">
                              Este alumno tiene una matrícula INACTIVA
                            </p>
                            <p className="text-sm text-orange-700 mt-1">
                              El estudiante ya cuenta con una matrícula registrada pero se encuentra <strong>Inactiva</strong>. ¿Desea reactivarla cambiando su estado a Pendiente?
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                              <div>
                                <span className="text-orange-600">Año:</span>
                                <p className="font-medium text-orange-800">{searchResult.enrollment.academicYear || "—"}</p>
                              </div>
                              <div>
                                <span className="text-orange-600">Aula:</span>
                                <p className="font-medium text-orange-800">{searchResult.enrollment.classroomName || "—"}</p>
                              </div>
                              <div>
                                <span className="text-orange-600">Turno:</span>
                                <p className="font-medium text-orange-800">{searchResult.enrollment.shift || "—"}</p>
                              </div>
                              <div>
                                <span className="text-orange-600">Modalidad:</span>
                                <p className="font-medium text-orange-800">{searchResult.enrollment.modality || "—"}</p>
                              </div>
                              <div>
                                <span className="text-orange-600">Estado:</span>
                                <p className="font-medium text-orange-800">{getStatusLabel(searchResult.enrollment.enrollmentStatus)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : searchResult.enrollmentStatus === "previously_enrolled" ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-900">
                              Este alumno fue matriculado en otro período académico
                            </p>
                            <p className="text-sm text-amber-700 mt-1">
                              Se reutilizarán todos sus datos anteriores (incluyendo documentos) para la nueva matrícula.
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                              <div>
                                <span className="text-amber-600">Año anterior:</span>
                                <p className="font-medium text-amber-800">{searchResult.enrollment.academicYear || "—"}</p>
                              </div>
                              <div>
                                <span className="text-amber-600">Aula:</span>
                                <p className="font-medium text-amber-800">{searchResult.enrollment.classroomName || "—"}</p>
                              </div>
                              <div>
                                <span className="text-amber-600">Turno:</span>
                                <p className="font-medium text-amber-800">{searchResult.enrollment.shift || "—"}</p>
                              </div>
                              <div>
                                <span className="text-amber-600">Modalidad:</span>
                                <p className="font-medium text-amber-800">{searchResult.enrollment.modality || "—"}</p>
                              </div>
                              <div>
                                <span className="text-amber-600">Estado:</span>
                                <p className="font-medium text-amber-800">{getStatusLabel(searchResult.enrollment.enrollmentStatus)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : searchResult.enrollmentStatus === "not_enrolled" ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-900">Estudiante sin matrícula previa</p>
                            <p className="text-sm text-green-700 mt-1">
                              Este estudiante existe en la institución pero no tiene matrículas registradas. Puede proceder a realizar la nueva matrícula.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : searchResult.enrollmentStatus === "check_error" ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900">No se pudo verificar el estado de matrícula</p>
                            <p className="text-sm text-yellow-700 mt-1">
                              No se pudo verificar si el estudiante tiene matrículas previas. Puede continuar con la nueva matrícula.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Estudiante encontrado en el sistema</p>
                            <p className="text-sm text-blue-700 mt-1">
                              Este estudiante ya existe en la institución. ¿Desea seleccionarlo para la nueva matrícula?
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={reactivating}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Cancelar
                      </button>
                      {(searchResult.enrollmentStatus === "inactive_in_period" || searchResult.enrollmentStatus === "inactive_enrolled") && onReactivate ? (
                        <button
                          type="button"
                          onClick={handleReactivate}
                          disabled={reactivating}
                          className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {reactivating ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          {reactivating ? "Reactivando..." : "Reactivar matrícula"}
                        </button>
                      ) : searchResult.enrollmentStatus !== "currently_enrolled" && searchResult.crossEnrollmentStatus !== "cross_enrolled" ? (
                        <button
                          type="button"
                          onClick={handleReuse}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {searchResult.enrollment ? "Reutilizar datos anteriores" : "Seleccionar estudiante"}
                        </button>
                      ) : null}
                    </div>
                  </>
                )}

                {searchResult.type === "found_elsewhere" && (
                  <>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-orange-900">
                            Estudiante encontrado en otra institución
                          </p>
                          <p className="text-sm text-orange-700 mt-1">
                            El usuario con DNI <strong>{searchResult.documentNumber}</strong> no está registrado en esta institución,
                            pero existe en el sistema.
                          </p>
                          {searchResult.student && (
                            <div className="mt-2 p-2 bg-orange-100/50 rounded text-xs">
                              <p><span className="font-medium">Nombre:</span> {searchResult.student.firstName} {searchResult.student.lastName} {searchResult.student.motherLastName || ""}</p>
                            </div>
                          )}
                          {searchResult.crossEnrollmentStatus === "cross_enrolled" && searchResult.crossEnrollment && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                              <div>
                                <span className="text-orange-600">Institución:</span>
                                <p className="font-medium text-orange-800">{searchResult.crossEnrollment.institutionName || "—"}</p>
                              </div>
                              <div>
                                <span className="text-orange-600">Aula:</span>
                                <p className="font-medium text-orange-800">{searchResult.crossEnrollment.classroomName || "—"}</p>
                              </div>
                              <div>
                                <span className="text-orange-600">Estado:</span>
                                <p className="font-medium text-orange-800">{getStatusLabel(searchResult.crossEnrollment.enrollmentStatus)}</p>
                              </div>
                              <div>
                                <span className="text-orange-600">Turno:</span>
                                <p className="font-medium text-orange-800">{searchResult.crossEnrollment.shift || "—"}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        onClick={() => onStudentNotFound && onStudentNotFound(searchResult.documentNumber)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Crear nuevo estudiante
                      </button>
                    </div>
                  </>
                )}

                {searchResult.type === "not_found" && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Estudiante no encontrado</p>
                          <p className="text-sm text-blue-700 mt-1">
                            No se encontró ningún estudiante con DNI <strong>{searchResult.documentNumber}</strong> en esta institución.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateNew}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Crear nuevo estudiante
                      </button>
                    </div>
                  </>
                )}

                {searchResult.type === "error" && (
                  <>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-900">Error</p>
                          <p className="text-sm text-red-700 mt-1">{searchResult.message}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

StudentSearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  searchResult: PropTypes.object,
  onStudentSelected: PropTypes.func.isRequired,
  onStudentNotFound: PropTypes.func,
  onReactivate: PropTypes.func,
  searching: PropTypes.bool,
};
