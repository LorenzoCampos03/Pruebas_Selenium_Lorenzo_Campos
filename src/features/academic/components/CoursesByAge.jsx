import { useState } from "react";
import { AGE_LEVEL_LABELS, CURRICULAR_AREA_LABELS } from "../models/academicModel";
import CourseDetailModal from "./CourseDetailModal";
import CourseFormModal from "./CourseFormModal";
import { BookOpen, ChevronRight, Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import { courseService } from "../services/academicService";

export default function CoursesByAge({ ageLevel, courses, loading, onRefresh, canManage }) {
  const [selectedCourse, setSelectedCourse]   = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal]     = useState(false);
  const [editingCourse, setEditingCourse]     = useState(null);
  const [actionLoading, setActionLoading]     = useState(null);

  const [localStatus, setLocalStatus] = useState({});

  const getStatus = (course) => localStatus[course.id] ?? course.status;
  const isInactiveStatus = (course) => String(getStatus(course)).toUpperCase() === "INACTIVE";

  const handleCourseClick = (course) => {
    if (canManage) return;
    setSelectedCourse(course);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCourse(null);
    onRefresh();
  };

  const handleCreate = () => { setEditingCourse(null); setShowFormModal(true); };

  const handleEdit = (e, course) => {
    e.stopPropagation();
    setEditingCourse(course);
    setShowFormModal(true);
  };

  const handleDelete = async (e, course) => {
    e.stopPropagation();
    if (!confirm(`¿Desactivar el curso "${course.name}"?`)) return;
    try {
      setActionLoading(course.id);
      await courseService.deactivate(course.id);
      setLocalStatus((prev) => ({ ...prev, [course.id]: "INACTIVE" }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (e, course) => {
    e.stopPropagation();
    try {
      setActionLoading(course.id);
      await courseService.activate(course.id);
      // Limpia el override y refresca
      setLocalStatus((prev) => {
        const next = { ...prev };
        delete next[course.id];
        return next;
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseFormModal = (saved) => {
    setShowFormModal(false);
    setEditingCourse(null);
    if (saved) onRefresh();
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto" />
        <p className="text-gray-400 mt-4 text-sm">Cargando cursos...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <>
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-600 font-medium text-sm">No hay cursos disponibles</p>
          <p className="text-gray-400 text-xs mt-1 mb-5">para {AGE_LEVEL_LABELS[ageLevel]}</p>
          {canManage && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 active:scale-95 transition-all text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> Agregar primer curso
            </button>
          )}
        </div>
        {showFormModal && (
          <CourseFormModal course={editingCourse} ageLevel={ageLevel} onClose={handleCloseFormModal} />
        )}
      </>
    );
  }

  return (
    <>
      {}
      <div className="mb-4">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {courses.length} {courses.length === 1 ? "curso" : "cursos"}
        </span>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {courses.map((course) => {
          const isInactive  = isInactiveStatus(course);
          const isActioning = actionLoading === course.id;

          return (
            <div
              key={course.id}
              onClick={() => handleCourseClick(course)}
              className={`group relative bg-white border-2 rounded-xl p-4 transition-all overflow-hidden
                ${canManage
                  ? "border-gray-200 cursor-default hover:border-blue-200 hover:shadow-md"
                  : "border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-lg"}
                ${isInactive ? "opacity-60" : ""}
              `}
            >
              {!canManage && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              )}

              <div className="relative">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
                      {course.code}
                    </span>
                  </div>

                  {canManage && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isInactive ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {isInactive ? "Inactivo" : "Activo"}
                    </span>
                  )}
                </div>

                <h3 className={`font-bold text-gray-800 mb-1.5 text-sm leading-snug ${
                  !canManage ? "group-hover:text-blue-600 transition-colors" : ""
                }`}>
                  {course.name}
                </h3>

                <p className="text-xs text-gray-400 mb-2.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  {CURRICULAR_AREA_LABELS[course.areaCurricular] || course.areaCurricular}
                </p>

                {course.description && (
                  <p className="text-xs text-gray-400 line-clamp-1 mb-2.5">
                    {course.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                  {!canManage && (
                    <>
                      <span className="text-xs text-gray-300">Click para gestionar</span>
                      <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}

                  {canManage && (
                    <div className="flex items-center gap-1 w-full justify-end">
                      {}
                      {!isInactive && (
                        <button
                          onClick={(e) => handleEdit(e, course)}
                          disabled={isActioning}
                          title="Editar"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-40"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {}
                      {isInactive && (
                        <button
                          onClick={(e) => handleRestore(e, course)}
                          disabled={isActioning}
                          title="Restaurar"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                        >
                          {isActioning
                            ? <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            : <RotateCcw className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {}
                      {!isInactive && (
                        <button
                          onClick={(e) => handleDelete(e, course)}
                          disabled={isActioning}
                          title="Eliminar"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {isActioning
                            ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showDetailModal && selectedCourse && (
        <CourseDetailModal course={selectedCourse} onClose={handleCloseDetailModal} />
      )}
      {showFormModal && (
        <CourseFormModal course={editingCourse} ageLevel={ageLevel} onClose={handleCloseFormModal} />
      )}
    </>
  );
}