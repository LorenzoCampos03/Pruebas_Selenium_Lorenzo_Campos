import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { attendanceService } from "../services/attendanceService";
import { motion, AnimatePresence } from "framer-motion";
import {
  XCircle, CheckCircle2, Clock, AlertTriangle, Users,
  RefreshCw, Search, AlertCircle, X,
} from "lucide-react";
import Swal from "sweetalert2";

const INCIDENCE_TYPES = [
  { key: "justifiedAbsences",   label: "Inasistencias Justificadas",   color: "blue",      icon: CheckCircle2 },
  { key: "unjustifiedAbsences", label: "Inasistencias Injustificadas", color: "red",       icon: XCircle },
  { key: "justifiedLates",      label: "Tardanzas Justificadas",       color: "amber",     icon: Clock },
  { key: "unjustifiedLates",    label: "Tardanzas Injustificadas",     color: "orange",    icon: AlertCircle },
];

const DOT_COLORS = {
  blue:   "bg-blue-500",
  red:    "bg-red-500",
  amber:  "bg-amber-500",
  orange: "bg-orange-500",
};

const BG_COLORS = {
  blue:   "bg-blue-50 border-blue-100",
  red:    "bg-red-50 border-red-100",
  amber:  "bg-amber-50 border-amber-100",
  orange: "bg-orange-50 border-orange-100",
};

const ICON_BG = {
  blue:   "bg-blue-100 text-blue-600",
  red:    "bg-red-100 text-red-600",
  amber:  "bg-amber-100 text-amber-600",
  orange: "bg-orange-100 text-orange-600",
};

function MetricCard({ icon, label, value, color }) {
  const Icon = icon;
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${ICON_BG[color] || "bg-slate-100 text-slate-500"}`}>
        <Icon size={22} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function IncidenceRow({ student, classroomName, onClick }) {
  const name = student ? `${student.lastName} ${student.firstName}` : "";
  const dni = student?.documentNumber || "—";
  return (
    <div onClick={onClick} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
        <Users size={14} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
        <p className="text-xs text-slate-400">{dni}{classroomName ? ` · ${classroomName}` : ""}</p>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Cargando incidencias…</p>
      </div>
    </div>
  );
}

export default function IncidencesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [activeType, setActiveType] = useState("justifiedAbsences");
  const [search, setSearch] = useState("");
  const [detailStudent, setDetailStudent] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, studRes, classRes] = await Promise.all([
        attendanceService.getAll(),
        attendanceService.getStudentsByInstitution(user?.institutionId),
        attendanceService.getClassroomsByInstitution(user?.institutionId),
      ]);

      const attList = Array.isArray(attRes) ? attRes : (attRes?.data || []);
      const studList = studRes?.data || [];
      const classList = classRes?.data || [];

      const filteredAtt = user?.institutionId
        ? attList.filter(a => String(a.institutionId) === String(user.institutionId))
        : attList;

      setAttendanceData(filteredAtt);
      setStudents(studList);
      setClassrooms(classList);
    } catch (err) {
      console.error("Error loading incidences:", err);
      await Swal.fire({ icon: "error", title: "Error al cargar", text: "No se pudieron cargar las incidencias.", confirmButtonColor: "#2563eb" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.institutionId) return;
    loadData();
  }, [user?.institutionId]);

  const stats = useMemo(() => {
    const counts = { justifiedAbsences: 0, unjustifiedAbsences: 0, justifiedLates: 0, unjustifiedLates: 0 };
    const studentCounts = {};

    for (const att of attendanceData) {
      const sid = att.studentId;
      const st  = att.status;
      if (!sid) continue;

      if (!studentCounts[sid]) {
        studentCounts[sid] = { justifiedAbsences: 0, unjustifiedAbsences: 0, justifiedLates: 0, unjustifiedLates: 0 };
      }

      if (st === "JUSTIFIED") {
        studentCounts[sid].justifiedAbsences++;
        counts.justifiedAbsences++;
      } else if (st === "ABSENT") {
        studentCounts[sid].unjustifiedAbsences++;
        counts.unjustifiedAbsences++;
      } else if (st === "LATE") {
        const isJustified = !!att.justificationReason;
        if (isJustified) {
          studentCounts[sid].justifiedLates++;
          counts.justifiedLates++;
        } else {
          studentCounts[sid].unjustifiedLates++;
          counts.unjustifiedLates++;
        }
      }
    }

    const classroomMap = {};
    for (const c of classrooms) {
      classroomMap[c.id] = c.classroomName || c.name;
    }

    const buildList = (typeKey) => Object.entries(studentCounts)
      .filter(([, c]) => c[typeKey] > 0)
      .map(([id, c]) => ({
        student: students.find(s => String(s.id) === String(id)),
        count: c[typeKey],
        classroomName: classroomMap[students.find(s => String(s.id) === String(id))?.classroomId] || "",
      }))
      .filter(s => s.student)
      .sort((a, b) => b.count - a.count);

    return {
      counts,
      lists: {
        justifiedAbsences: buildList("justifiedAbsences"),
        unjustifiedAbsences: buildList("unjustifiedAbsences"),
        justifiedLates: buildList("justifiedLates"),
        unjustifiedLates: buildList("unjustifiedLates"),
      },
    };
  }, [attendanceData, students, classrooms]);

  const activeList = useMemo(() => {
    const list = stats.lists[activeType] || [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(item => {
      const name = item.student ? `${item.student.firstName} ${item.student.lastName}`.toLowerCase() : "";
      return name.includes(q) || (item.student?.documentNumber || "").includes(q);
    });
  }, [stats.lists, activeType, search]);

  if (loading && !attendanceData.length) {
    return <Skeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Topbar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-md rounded-b-2xl">
        <div className="max-w-full mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle size={15} color="white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-white text-[15px] tracking-wide">Incidencias de Asistencia</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="text-white/60 hover:text-white transition-colors" title="Actualizar">
              <RefreshCw size={14} />
            </button>
          </div>
      </div>

      {/* Student detail modal */}
      <AnimatePresence>
        {detailStudent && (() => {
          const sc = stats.studentCounts[detailStudent.id] || {};
          const name = `${detailStudent.lastName} ${detailStudent.firstName}`;
          const items = [
            { icon: CheckCircle2, label: "Inasistencias Justificadas", value: sc.justifiedAbsences || 0, color: "blue" },
            { icon: XCircle,      label: "Inasistencias Injustificadas", value: sc.unjustifiedAbsences || 0, color: "red" },
            { icon: Clock,        label: "Tardanzas Justificadas", value: sc.justifiedLates || 0, color: "amber" },
            { icon: AlertCircle,  label: "Tardanzas Injustificadas", value: sc.unjustifiedLates || 0, color: "orange" },
          ];
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setDetailStudent(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
                onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700">
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-xs text-white/60">{detailStudent.documentNumber || "Sin DNI"}</p>
                  </div>
                  <button onClick={() => setDetailStudent(null)} className="text-white/60 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  {items.map(item => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <item.icon size={16} className={`text-${item.color}-500`} />
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      </div>
                      <span className="text-lg font-bold text-slate-800">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex justify-end">
                  <button onClick={() => setDetailStudent(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>

      <div className="w-full px-6 py-6 space-y-6">

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(stats.counts).every(c => c === 0) && !loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <AlertCircle size={32} strokeWidth={1.2} />
              <p className="text-sm">No hay registros de asistencia aún</p>
            </div>
          ) : (
            INCIDENCE_TYPES.map(t => (
              <MetricCard key={t.key} icon={t.icon} label={t.label} value={stats.counts[t.key]} color={t.color} />
            ))
          )}
        </div>

        {/* Tab pills */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 flex flex-wrap gap-1.5">
            {INCIDENCE_TYPES.map(t => {
              const active = activeType === t.key;
              const dotColor = DOT_COLORS[t.color];
              return (
                <button
                  key={t.key}
                  onClick={() => { setActiveType(t.key); setSearch(""); }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all ${
                    active
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? "bg-white" : dotColor}`} />
                  {t.label}
                  <span className={`text-xs ml-0.5 ${active ? "text-white/70" : "text-slate-400"}`}>
                    {stats.counts[t.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + list */}
          <div className="p-4 space-y-3">
            <div className="relative w-full sm:w-64">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar estudiante…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-slate-400 transition-colors"
              />
            </div>

            {activeList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Users size={24} strokeWidth={1.2} />
                <p className="text-sm">
                  {search ? "Sin resultados" : "No hay estudiantes con este tipo de incidencia"}
                </p>
              </div>
            ) : (
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
                <div className="px-4 py-2 bg-slate-50/80 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  <span>Estudiantes ({activeList.length})</span>
                  <span>Total: {activeList.reduce((s, i) => s + i.count, 0)}</span>
                </div>
            <AnimatePresence>
              {activeList.map((item, i) => (
                <motion.div
                  key={item.student.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                >
                  <IncidenceRow student={item.student} classroomName={item.classroomName}
                    onClick={() => setDetailStudent(item.student)} />
                </motion.div>
              ))}
            </AnimatePresence>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
