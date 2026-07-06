import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import { courseService } from "../services/academicService";
import { AGE_LEVELS, AGE_LEVEL_LABELS } from "../models/academicModel";
import CourseFormModal from "../components/CourseFormModal";
import apiClient from "@/core/api/apiClient";
import { Plus, ArrowRight, Lock, BarChart2 } from "lucide-react";
import { generateCoursesReport } from "../services/courseReportService";

const BASE_ROUTE_BY_ROLE = {
  DOCENTE:     "/docente/cursos",
  DIRECTOR:    "/direccion/academic",
  SUBDIRECTOR: "/direccion/academic",
};

const MANAGE_ROLES = ["DIRECTOR", "SUBDIRECTOR"];

const AGE_CONFIG = {
  "3 años": {
    emoji: "👶",
    accent: "#7C3AED",
    accentLight: "#F5F3FF",
    accentMid: "#DDD6FE",
    label: "3 Años",
    sub: "Nivel Inicial",
  },
  "4 años": {
    emoji: "🧒",
    accent: "#0891B2",
    accentLight: "#ECFEFF",
    accentMid: "#A5F3FC",
    label: "4 Años",
    sub: "Nivel Inicial",
  },
  "5 años": {
    emoji: "👦",
    accent: "#059669",
    accentLight: "#ECFDF5",
    accentMid: "#A7F3D0",
    label: "5 Años",
    sub: "Nivel Inicial",
  },
};

export default function AcademicPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [courseCounts, setCourseCounts]         = useState({});
  const [allCourses, setAllCourses]             = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showFormModal, setShowFormModal]        = useState(false);
  const [docenteAgeLevels, setDocenteAgeLevels] = useState([]);
  const [institution, setInstitution]           = useState({});

  const canManage = MANAGE_ROLES.includes(role);
  const basePath  = BASE_ROUTE_BY_ROLE[role] ?? "/docente/cursos";

  useEffect(() => {
    if (!user?.institutionId) return;
    loadInstitution();
    if (role === "DOCENTE") {
      loadDocenteClassrooms();
    } else {
      loadCourseCounts([]);
    }
  }, [user, role]);

  const loadInstitution = async () => {
    try {
      const { data } = await apiClient.get(`/api/institutions/${user.institutionId}`);
      setInstitution(data?.data || data || {});
    } catch {}
  };

  const loadDocenteClassrooms = async () => {
    try {
      setLoading(true);

      // 1. Si el perfil ya trae ageLevel, usarlo directo
      if (user.ageLevel) {
        const levels = [user.ageLevel];
        setDocenteAgeLevels(levels);
        loadCourseCounts(levels);
        return;
      }

      // 2. Obtener asignaciones del docente para sacar sus classroomIds
      const assignRes = await apiClient.get(`/api/teacher-assignments/teacher/${user.userId}`);
      const assignments = assignRes.data?.data || assignRes.data || [];
      const classroomIds = [...new Set(
        (Array.isArray(assignments) ? assignments : [])
          .map(a => a.classroomId)
          .filter(Boolean)
      )];

      if (!classroomIds.length) {
        setDocenteAgeLevels(["__sin_asignar__"]);
        loadCourseCounts(["__sin_asignar__"]);
        return;
      }

      // 3. Obtener todas las aulas de la institución y filtrar por los IDs del docente
      const classRes = await apiClient.get(`/api/classrooms/institution/${user.institutionId}`);
      const allClassrooms = classRes.data?.data || classRes.data || [];
      const myClassrooms = (Array.isArray(allClassrooms) ? allClassrooms : [])
        .filter(c => classroomIds.includes(c.id) && c.status === "ACTIVE");

      const levels = [...new Set(myClassrooms.map(c => c.classroomAge).filter(Boolean))];
      const finalLevels = levels.length ? levels : ["__sin_asignar__"];
      setDocenteAgeLevels(finalLevels);
      loadCourseCounts(finalLevels);
    } catch (err) {
      console.error("[AcademicPage] Error al cargar aulas del docente:", err);
      loadCourseCounts(["__sin_asignar__"]);
    }
  };

  const loadCourseCounts = async (ageLevelsFilter = []) => {
    try {
      setLoading(true);
      const data = canManage
        ? await courseService.getAllByInstitution(user.institutionId)
        : await courseService.getActiveByInstitution(user.institutionId);
      const list = Array.isArray(data) ? data : data?.data || [];
      setAllCourses(list);
      const counts = {};
      Object.values(AGE_LEVELS).forEach((level) => {
        const byLevel = list.filter((c) => c.ageLevel === level);
        counts[level] = {
          active:    byLevel.filter((c) => c.status === "ACTIVE").length,
          inactive:  byLevel.filter((c) => c.status === "INACTIVE").length,
          hasAccess: canManage
            || ageLevelsFilter.length === 0
            || ageLevelsFilter.includes(level),
        };
      });
      setCourseCounts(counts);
    } catch (error) {
      console.error("[AcademicPage] Error al cargar cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const ageRouteMapping = {
    [AGE_LEVELS.TRES_ANOS]:   "3-anos",
    [AGE_LEVELS.CUATRO_ANOS]: "4-anos",
    [AGE_LEVELS.CINCO_ANOS]:  "5-anos",
  };

  const handleAgeClick = (ageValue) => {
    const counts = courseCounts[ageValue];
    if (!canManage && counts && !counts.hasAccess) return;
    navigate(`${basePath}/${ageRouteMapping[ageValue]}`);
  };

  const handleInactiveClick = (e, ageValue) => {
    e.stopPropagation();
    navigate(`${basePath}/${ageRouteMapping[ageValue]}?filter=INACTIVE`);
  };

  const handleFormClose = (saved) => {
    setShowFormModal(false);
    if (saved) loadCourseCounts(docenteAgeLevels);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {}
      <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Cursos</h1>
          <p className="text-sm text-gray-400">
            Selecciona un nivel de edad para gestionar los cursos de tu institución
          </p>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setGeneratingReport(true);
                try {
                  const directorName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";
                  await generateCoursesReport({
                    courses: allCourses,
                    institution: { ...institution, directorName: institution.directorName || directorName }
                  });
                } finally {
                  setGeneratingReport(false);
                }
              }}
              disabled={generatingReport || !allCourses.length}
              className="flex items-center gap-2 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-all font-medium text-sm shadow-sm disabled:opacity-50"
            >
              {generatingReport
                ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                : <BarChart2 className="w-4 h-4" />
              }
              Reporte
            </button>
            <button
              onClick={() => setShowFormModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo curso
            </button>
          </div>
        )}
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.values(AGE_LEVELS).map((value, i) => {
          const counts = courseCounts[value] ?? { active: 0, inactive: 0, hasAccess: true };
          const locked = !canManage && !counts.hasAccess;
          const cfg    = AGE_CONFIG[value] ?? {
            emoji: "🧒", accent: "#2563EB", accentLight: "#EFF6FF",
            accentMid: "#BFDBFE", label: value, sub: "Nivel Inicial",
          };

          return (
            <button
              key={value}
              onClick={() => handleAgeClick(value)}
              disabled={locked}
              style={{ animationDelay: `${i * 80}ms` }}
              className={`group relative bg-white rounded-2xl border overflow-hidden text-left
                transition-all duration-300
                animate-[fadeSlideUp_0.4s_ease_forwards] opacity-0
                ${locked
                  ? "border-gray-100 opacity-40 cursor-not-allowed"
                  : "border-gray-200 hover:border-transparent hover:shadow-xl cursor-pointer"}
              `}
            >
              {}
              {!locked && (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, ${cfg.accent}, ${cfg.accentMid})` }}
                />
              )}

              {}
              {!locked && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at top left, ${cfg.accentLight} 0%, transparent 65%)` }}
                />
              )}

              <div className="relative p-6">
                {}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: locked ? "#F3F4F6" : cfg.accentLight }}
                  >
                    {locked ? <Lock size={20} className="text-gray-300" /> : cfg.emoji}
                  </div>

                  {!locked && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0"
                      style={{ background: cfg.accentLight }}
                    >
                      <ArrowRight size={14} style={{ color: cfg.accent }} />
                    </div>
                  )}
                </div>

                {}
                <h3 className={`text-xl font-bold mb-0.5 ${locked ? "text-gray-300" : "text-gray-900"}`}>
                  {cfg.label}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{cfg.sub}</p>

                {}
                {loading ? (
                  <div className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                ) : locked ? (
                  <span className="inline-block bg-gray-100 text-gray-300 text-xs px-3 py-1 rounded-full font-medium">
                    No asignado
                  </span>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: cfg.accentLight, color: cfg.accent }}
                    >
                      {counts.active} activos
                    </span>

                    {}
                    {canManage && counts.inactive > 0 && (
                      <span
                        onClick={(e) => handleInactiveClick(e, value)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                        title="Ver inactivos para restaurar"
                      >
                        {counts.inactive} inactivos
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {}
      {!canManage && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 border-dashed">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-gray-600 font-medium text-sm mb-1">
            Selecciona un nivel de edad para comenzar
          </p>
          <p className="text-gray-400 text-xs">
            Gestiona cursos, competencias, capacidades y desempeños
          </p>
        </div>
      )}

      {}
      {showFormModal && (
        <CourseFormModal
          course={null}
          ageLevel={null}
          onClose={handleFormClose}
        />
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}