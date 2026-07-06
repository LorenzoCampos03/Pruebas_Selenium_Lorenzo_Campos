import { useState, useEffect } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { courseService } from "../services/academicService";
import { AGE_LEVELS, AGE_LEVEL_LABELS } from "../models/academicModel";
import CoursesByAge from "../components/CoursesByAge";
import CourseFormModal from "../components/CourseFormModal";
import apiClient from "@/core/api/apiClient";
import { ArrowLeft, Filter, Plus, Search, BarChart2 } from "lucide-react";
import { generateCourseCompetencyReport } from "../services/courseCompetencyReportService";

const BACK_ROUTE_BY_ROLE = {
  DOCENTE:     "/docente/cursos",
  DIRECTOR:    "/direccion/academic",
  SUBDIRECTOR: "/direccion/academic",
};

const MANAGE_ROLES = ["DIRECTOR", "SUBDIRECTOR"];

const FILTERS = [
  { key: "ACTIVE",   label: "Activos"   },
  { key: "INACTIVE", label: "Inactivos" },
  { key: "ALL",      label: "Todos"     },
];

export default function AcademicByAgePage() {
  const { age } = useParams();
  const [searchParams] = useSearchParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const ageMapping = {
    "3-anos": AGE_LEVELS.TRES_ANOS,
    "4-anos": AGE_LEVELS.CUATRO_ANOS,
    "5-anos": AGE_LEVELS.CINCO_ANOS,
  };

  const ageLevel      = ageMapping[age];
  const canManage     = MANAGE_ROLES.includes(role);
  const backRoute     = BACK_ROUTE_BY_ROLE[role] ?? "/docente/cursos";
  // Para DOCENTE: solo puede ver el nivel de edad de su aula asignada
  const docenteLevel  = user?.ageLevel;
  const hasAgeAccess  = canManage || !docenteLevel || docenteLevel === ageLevel;

  const initialFilter = searchParams.get("filter") ?? "ACTIVE";

  const [courses, setCourses]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [statusFilter, setStatusFilter]   = useState(initialFilter);
  const [search, setSearch]               = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [institution, setInstitution]     = useState({});

  useEffect(() => {
    if (user?.institutionId) loadInstitution();
  }, [user]);

  const loadInstitution = async () => {
    try {
      const { data } = await apiClient.get(`/api/institutions/${user.institutionId}`);
      setInstitution(data?.data || data || {});
    } catch {}
  };

  useEffect(() => {
    if (ageLevel && user?.institutionId) loadCourses();
  }, [ageLevel, statusFilter, user]);

  const loadCourses = async () => {
    if (!hasAgeAccess) return;
    try {
      setLoading(true);
      let list = [];

      if (canManage) {
        const data = statusFilter === "INACTIVE"
          ? await courseService.getAllByInstitution(user.institutionId)
          : await courseService.getAllByInstitution(user.institutionId);
        list = Array.isArray(data) ? data : data?.data || [];
        list = list.filter((c) => c.ageLevel === ageLevel);
        if (statusFilter === "ACTIVE")        list = list.filter((c) => c.status === "ACTIVE");
        else if (statusFilter === "INACTIVE") list = list.filter((c) => c.status === "INACTIVE");
      } else {
        // DOCENTE: usa el endpoint filtrado por institución + ageLevel directamente
        const { data } = await apiClient.get(
          `/api/v1/courses/institution/${user.institutionId}/age-level/${encodeURIComponent(ageLevel)}/active`
        );
        list = Array.isArray(data) ? data : data?.data || [];
      }

      setCourses(list);
    } catch (error) {
      console.error("Error al cargar cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = search.trim()
    ? courses.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : courses;

  if (!ageLevel) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-red-500 font-medium">Nivel de edad no válido</p>
      </div>
    );
  }

  if (!hasAgeAccess) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-gray-700 font-medium">No tienes acceso a este nivel</p>
          <p className="text-gray-400 text-sm mt-1">
            Tu aula corresponde al nivel <strong>{docenteLevel}</strong>
          </p>
          <button
            onClick={() => navigate(backRoute)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <button
            onClick={() => navigate(backRoute)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-3 text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver a selección de edades
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-0.5">
            {canManage ? "Gestión Académica" : "Cursos"} — {AGE_LEVEL_LABELS[ageLevel]}
          </h1>
          <p className="text-sm text-gray-400">
            {canManage
              ? "Agrega, edita o desactiva cursos de este nivel"
              : "Cursos de tu institución para este nivel"}
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowFormModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar curso
          </button>
        )}

        {!canManage && (
          <button
            onClick={async () => {
              setGeneratingReport(true);
              try {
                await generateCourseCompetencyReport({
                  courses: filteredCourses,
                  institution,
                  ageLevel: AGE_LEVEL_LABELS[ageLevel],
                });
              } finally {
                setGeneratingReport(false);
              }
            }}
            disabled={generatingReport || filteredCourses.length === 0}
            className="flex items-center gap-2 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-all font-medium text-sm shadow-sm disabled:opacity-50"
          >
            {generatingReport
              ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              : <BarChart2 className="w-4 h-4" />
            }
            Reporte
          </button>
        )}
      </div>

      {}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full pl-9 pr-4 h-10 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
          />
        </div>

        {canManage && (
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1.5 shadow-sm h-10">
            <Filter className="w-3.5 h-3.5 text-gray-400 ml-1 mr-1" />
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3.5 h-7 rounded-md text-sm font-medium transition-all ${
                  statusFilter === f.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {}
      <CoursesByAge
        ageLevel={ageLevel}
        courses={filteredCourses}
        loading={loading}
        onRefresh={loadCourses}
        statusFilter={statusFilter}
        canManage={canManage}
      />

      {showFormModal && (
        <CourseFormModal
          course={null}
          ageLevel={ageLevel}
          onClose={(saved) => {
            setShowFormModal(false);
            if (saved) loadCourses();
          }}
        />
      )}
    </div>
  );
}