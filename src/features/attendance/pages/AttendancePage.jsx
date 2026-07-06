import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Users, CheckCircle2, Clock, AlertCircle,
  ChevronRight, Search, Activity, AlertTriangle, CalendarDays,
  TrendingUp, RefreshCw, ScanLine, X, ClipboardList,
  School, ChevronLeft,
  ChevronsLeft, ChevronsRight, Eye,
} from "lucide-react";
import QRScannerModal from "../components/QR/QRScannerModal";
import { useAuth } from "@/core/auth/AuthContext";
import { useAttendance } from "../hooks/useAttendance";
import { attendanceService } from "../services/attendanceService";
import { calendarService } from "@/features/events/services/calendarService";
import Swal from "sweetalert2";
// (toast helpers imported but not used in this page - available via notifications.jsx)

/* ── Helpers ── */
const TODAY = () => new Date().toISOString().split("T")[0];
const LIMA_NOW = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));

const STATUS = {
  completed:   { label: "Completado", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-500", ring: "#22c55e", icon: CheckCircle2 },
  "in-progress":{ label: "En proceso", cls: "bg-blue-50 text-blue-700 ring-blue-200",     dot: "bg-blue-500",    bar: "bg-blue-500",    ring: "#3b82f6", icon: Activity },
  pending:     { label: "Pendiente",   cls: "bg-slate-100 text-slate-500 ring-slate-200",  dot: "bg-slate-400",   bar: "bg-slate-300",   ring: "#94a3b8", icon: Clock },
};

/* ── Animated counter ── */
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef(null);
  const prev = useRef(value);
  useEffect(() => {
    if (ref.current) cancelAnimationFrame(ref.current);
    const start = performance.now();
    const from = prev.current;
    prev.current = value;
    const diff = value - from;
    if (diff === 0) return;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + diff * eased));
      if (t < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value, duration]);
  return <>{display}</>;
}

/* ── Metric card with gradient accent ── */
function MetricCard({ icon, label, value, sub, accent = "from-slate-500 to-slate-600" }) {
  const Icon = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1.5">{label}</p>
          <p className="text-3xl font-bold text-slate-800 leading-none tracking-tight">
            <AnimatedNumber value={value} />
          </p>
          {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accent} shadow-sm shrink-0`}>
          <Icon size={16} className="text-white" strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const { label, cls, dot } = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

/* ── Progress bar ── */
function ProgressBar({ pct, status }) {
  const { bar } = STATUS[status] || STATUS.pending;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-[11px] font-semibold text-slate-400 w-8 text-right tabular-nums">{pct}%</span>
    </div>
  );
}

/* ── Alert banner ── */
function AlertBanner({ type, message }) {
  const styles = {
    holiday: "bg-red-50/80 border-red-200 text-red-700",
    event:   "bg-amber-50/80 border-amber-200 text-amber-700",
  };
  const icons = { holiday: AlertTriangle, event: CalendarDays };
  const Icon = icons[type];
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm backdrop-blur-sm ${styles[type]}`}
    >
      <Icon size={15} className="mt-0.5 shrink-0" strokeWidth={2} />
      <p className="leading-relaxed">{message}</p>
    </motion.div>
  );
}

/* ── Donut ring (SVG) ── */
function DonutRing({ pct, size = 44, stroke = 4, color = "#22c55e", bgColor = "#e2e8f0" }) {
  const sz = size;
  const r = (sz - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const gap = circ - dash;
  return (
    <svg width={sz} height={sz} className="shrink-0">
      <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={bgColor} strokeWidth={stroke} />
      <motion.circle
        cx={sz / 2} cy={sz / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${sz / 2} ${sz / 2})`}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${gap}` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <text x={sz / 2} y={sz / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={sz * 0.28} fontWeight="bold" fill="#1e293b" className="tabular-nums">
        {pct}%
      </text>
    </svg>
  );
}

/* ── Numbered pagination ── */
function NumberedPagination({ total, page, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (page > 2) pages.push(-1);
      const start = Math.max(1, page - 1);
      const end = Math.min(totalPages - 2, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 3) pages.push(-2);
      pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button onClick={() => onChange(0)} disabled={page === 0}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <ChevronsLeft size={14} />
      </button>
      <button onClick={() => onChange(page - 1)} disabled={page === 0}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <ChevronLeft size={14} />
      </button>
      {getPages().map((p, i) =>
        p < 0 ? (
          <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-300 select-none">...</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            className={`min-w-[32px] h-8 text-xs font-bold rounded-lg transition-all ${
              p === page
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {p + 1}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <ChevronRight size={14} />
      </button>
      <button onClick={() => onChange(totalPages - 1)} disabled={page >= totalPages - 1}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <ChevronsRight size={14} />
      </button>
    </div>
  );
}

/* ── Classroom card (rich) ── */
function ClassroomCard({ classroom, status, pct, onNavigate, onIncidence, index }) {
  const st = status || "pending";
  const { bar, ring } = STATUS[st] || STATUS.pending;
  const name = classroom.classroomName || classroom.name || "Aula";
  const subtitle = [classroom.level, classroom.section].filter(Boolean).join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="relative bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden group cursor-pointer"
      onClick={() => onNavigate(classroom.id)}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${bar.replace("bg-", "from-")} ${bar.replace("bg-", "to-")}`} />

      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br ${bar.replace("bg-", "from-")} ${bar.replace("bg-", "to-")} shadow-sm`}>
              <School size={13} className="text-white" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight max-w-[140px]">{name}</p>
              {subtitle && <p className="text-[9px] text-slate-400 mt-px">{subtitle}</p>}
            </div>
          </div>
          <StatusBadge status={st} />
        </div>

        <div className="flex items-center gap-3 mb-2">
          <DonutRing pct={pct} color={ring} size={36} stroke={3} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] font-semibold text-slate-400 w-6 text-right tabular-nums">{pct}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 pt-1.5 border-t border-slate-50" onClick={e => e.stopPropagation()}>
          <button onClick={e => { e.stopPropagation(); onIncidence(classroom.id, name); }}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-semibold text-slate-400 bg-slate-50 rounded-md hover:bg-amber-50 hover:text-amber-600 transition-all">
            <ClipboardList size={10} /> Inc.
          </button>
          <button onClick={() => onNavigate(classroom.id)}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-semibold text-slate-400 bg-slate-50 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-all ml-auto">
            <Eye size={10} /> Ver
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Loading skeleton ── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-1.5 w-full bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-slate-100 rounded w-24" />
            <div className="h-2.5 bg-slate-100 rounded w-16" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2 bg-slate-100 rounded" />
            <div className="h-2 bg-slate-100 rounded w-3/4" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-7 bg-slate-100 rounded-lg w-20" />
          <div className="h-7 bg-slate-100 rounded-lg w-16 ml-auto" />
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function AttendancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classrooms, loading, fetchAll, fetchClassroomsByInstitution } = useAttendance(user);

  const [celebrations, setCelebrations]   = useState([]);
  const [blockedReason, setBlockedReason] = useState("");
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState("todos");
  const [statuses, setStatuses]           = useState({});
  const [progress, setProgress]           = useState({ completed: 0, total: 0, pct: 0, students: 0 });
  const [schedules, setSchedules]         = useState([]);
  const [lastSync, setLastSync]           = useState(new Date());
  const [students, setStudents]           = useState([]);
  const [incidenceData, setIncidenceData] = useState([]);
  const [incidenceLoading, setIncidenceLoading] = useState(false);
  const [incidenceModal, setIncidenceModal] = useState({ open: false, classroomId: null, classroomName: "" });
  const [quickScanning, setQuickScanning] = useState(false);
  const [cardPage, setCardPage]           = useState(0);
  const [liveTime, setLiveTime]           = useState(new Date());
  const [initialLoad, setInitialLoad]     = useState(true);
  const CARD_PAGE_SIZE = 12;

  /* Live clock */
  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Helpers ── */
  const getStudents = useCallback(async () => {
    if (!user?.institutionId) return [];
    const res = await attendanceService.getStudentsByInstitution(user.institutionId);
    return res?.data || [];
  }, [user?.institutionId]);

  const getAttendances = useCallback(async () => {
    const res = await attendanceService.getByDate(TODAY());
    return Array.isArray(res) ? res : (res?.data || []);
  }, []);

  const calcStatus = (cs, ca) => {
    if (!cs.length || !ca.length) return "pending";
    const exits = ca.filter(a => (a.status === "PRESENT" || a.status === "LATE") && a.departureTime).length;
    const pct = Math.round(((exits / cs.length) * 50) + ((ca.length / cs.length) * 50));
    if (pct >= 100) return "completed";
    if (pct > 0)    return "in-progress";
    return "pending";
  };

  const calcPct = (cs, ca) => {
    if (!cs.length) return 0;
    const exits = ca.filter(a => (a.status === "PRESENT" || a.status === "LATE") && a.departureTime).length;
    return Math.min(100, Math.round(((exits / cs.length) * 50) + ((ca.length / cs.length) * 50)));
  };

  /* ── Load statuses + progress ── */
  const loadData = useCallback(async () => {
    if (!classrooms.length) return;
    try {
      const [students, attendances] = await Promise.all([getStudents(), getAttendances()]);
      const newStatuses = {};
      const newPcts = {};
      let completed = 0;

      classrooms.forEach(c => {
        const cs = students.filter(s => s.classroomId === c.id);
        const ca = attendances.filter(a => a.classroomId === c.id);
        const st = calcStatus(cs, ca);
        newStatuses[c.id] = st;
        newPcts[c.id] = calcPct(cs, ca);
        if (st === "completed") completed++;
      });

      setStudents(students || []);
      setStatuses({ ...newStatuses, _pcts: newPcts });
      setProgress({
        completed,
        total: classrooms.length,
        pct: classrooms.length ? Math.round((completed / classrooms.length) * 100) : 0,
        students: students.length,
      });
      setLastSync(new Date());
      if (initialLoad) setInitialLoad(false);
    } catch (e) {
      console.error(e);
    }
  }, [classrooms, getStudents, getAttendances, initialLoad]);

  /* ── Calendar context ── */
  useEffect(() => {
    if (!user?.institutionId) return;
    (async () => {
      try {
        const todayStr = LIMA_NOW().toISOString().split("T")[0];
        const calendars = await calendarService.getByInstitution(user.institutionId);
        const active = (calendars || []).find(c =>
          c.status === "ACTIVE" &&
          todayStr >= String(c.startDate).slice(0, 10) &&
          todayStr <= String(c.endDate).slice(0, 10)
        );
        if (!active?.id) return;
        const { events = [] } = await calendarService.getWithEvents(active.id);
        const todayEvents = events.filter(ev => {
          if (ev.status && ev.status !== "ACTIVE") return false;
          const s = String(ev.startDate).slice(0, 10);
          const e = String(ev.endDate || ev.startDate).slice(0, 10);
          return todayStr >= s && todayStr <= e;
        });
        setCelebrations(todayEvents);
        const holiday = todayEvents.find(ev => ev.isHoliday);
        if (holiday) setBlockedReason(`Feriado: "${holiday.title}". No se puede registrar asistencia.`);
      } catch (e) { console.error(e); }
    })();
  }, [user?.institutionId]);

  /* ── Init & polling ── */
  useEffect(() => {
    fetchAll();
    if (user?.institutionId) {
      fetchClassroomsByInstitution(user.institutionId);
      attendanceService.getInstitutionDetail?.(user.institutionId)
        .then(d => setSchedules(d?.schedules || []))
        .catch(() => {});
    }
    const id = setInterval(() => { fetchAll(); loadData(); }, 30000);
    return () => clearInterval(id);
  }, [fetchAll, fetchClassroomsByInstitution, user?.institutionId]);

  useEffect(() => { loadData(); }, [loadData]);

  /* Reset page when filter/search changes */
  useEffect(() => { setCardPage(0); }, [search, filter]);

  /* ── Derived ── */
  const pcts     = statuses._pcts || {};
  const FILTERS  = ["todos", "completed", "in-progress", "pending"];
  const filtered = classrooms.filter(c => {
    const name  = (c.classroomName || c.name || "").toLowerCase();
    const matchQ = name.includes(search.toLowerCase());
    const matchF = filter === "todos" || (statuses[c.id] || "pending") === filter;
    return matchQ && matchF;
  });

  /* Status counts for distribution bar */
  const statusCounts = useMemo(() => {
    const counts = { completed: 0, "in-progress": 0, pending: 0 };
    classrooms.forEach(c => {
      const st = statuses[c.id] || "pending";
      if (counts[st] !== undefined) counts[st]++;
    });
    return counts;
  }, [classrooms, statuses]);

  const todayLabel = LIMA_NOW().toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long",
  }).replace(/^\w/, l => l.toUpperCase());

  /* ── Incidence modal ── */
  const openIncidenceModal = async (classroomId, classroomName) => {
    setIncidenceModal({ open: true, classroomId, classroomName });
    setIncidenceLoading(true);
    try {
      const res = await attendanceService.getByClassroom(classroomId);
      const attList = Array.isArray(res) ? res : (res?.data || []);
      const sc = {};
      for (const att of attList) {
        const sid = att.studentId;
        const st = att.status;
        if (!sid) continue;
        if (!sc[sid]) sc[sid] = { justifiedAbsences: 0, unjustifiedAbsences: 0, justifiedLates: 0, unjustifiedLates: 0 };
        if (st === "JUSTIFIED") sc[sid].justifiedAbsences++;
        else if (st === "ABSENT") sc[sid].unjustifiedAbsences++;
        else if (st === "LATE") {
          if (att.justificationReason) sc[sid].justifiedLates++;
          else sc[sid].unjustifiedLates++;
        }
      }
      const rows = Object.entries(sc).map(([sid, c]) => ({
        student: students.find(s => String(s.id) === String(sid)),
        justifiedAbsences: c.justifiedAbsences,
        unjustifiedAbsences: c.unjustifiedAbsences,
        justifiedLates: c.justifiedLates,
        unjustifiedLates: c.unjustifiedLates,
        total: c.justifiedAbsences + c.unjustifiedAbsences + c.justifiedLates + c.unjustifiedLates,
      })).filter(r => r.student).sort((a, b) => b.total - a.total);
      setIncidenceData(rows);
    } catch (err) {
      console.error("Error loading incidence data:", err);
      setIncidenceData([]);
      await Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar las incidencias.", confirmButtonColor: "#1e293b" });
    } finally {
      setIncidenceLoading(false);
    }
  };

  const totalPendientes = classrooms.length - statusCounts.completed;

  /* ── Loading ── */
  if (initialLoad && loading && !classrooms.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-[3px] border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-[3px] border-transparent border-t-indigo-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">Cargando panel de asistencia</p>
            <p className="text-xs text-slate-400 mt-0.5">Preparando datos del día...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* ── Topbar ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center shadow-sm">
              <BookOpen size={15} color="white" strokeWidth={2} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-[15px] tracking-tight">Control de Asistencia</span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-2">· {todayLabel}</span>
            </div>
            {schedules.map((s, i) => (
              <span key={i} className="hidden lg:inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5 font-medium">
                <Clock size={10} /> {s.startTime}–{s.endTime}
                <span className="text-[9px] text-slate-400">{s.shift === "MAÑANA" ? "M" : "T"}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="tabular-nums font-medium">
                {liveTime.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <button onClick={loadData}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              title="Actualizar datos"
            >
              <RefreshCw size={14} className={initialLoad ? "animate-spin" : ""} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
              <span className="w-1 h-1 bg-slate-400 rounded-full" />
              {lastSync.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <button
              onClick={() => setQuickScanning(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl transition-all shadow-sm shadow-indigo-200"
            >
              <ScanLine size={13} /> Escanear
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* ── Alerts ── */}
        <AnimatePresence>
          {blockedReason && <AlertBanner type="holiday" message={blockedReason} />}
          {!blockedReason && celebrations.length > 0 && (
            <AlertBanner type="event" message={celebrations.map(e => e.title).join(" · ")} />
          )}
        </AnimatePresence>

        {/* ── Global progress overview bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm flex items-center gap-4 flex-wrap"
        >
          <div className="flex items-center gap-2 shrink-0">
            <TrendingUp size={13} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Progreso</span>
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress.pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              {progress.pct > 12 && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                  className="absolute inset-y-0 left-0 flex items-center px-1.5 text-[9px] font-bold text-white">
                  {progress.pct}%
                </motion.span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 shrink-0">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {statusCounts.completed}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {statusCounts["in-progress"]}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {statusCounts.pending}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full shrink-0">
            {progress.completed}/{progress.total}
          </span>
        </motion.div>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard icon={BookOpen}     label="Aulas"        value={progress.total}     accent="from-slate-600 to-slate-500" />
          <MetricCard icon={Users}        label="Estudiantes"  value={progress.students}  accent="from-blue-600 to-blue-500" />
          <MetricCard icon={CheckCircle2} label="Completadas"  value={progress.completed} accent="from-emerald-600 to-emerald-500" sub={`${progress.pct}% del día`} />
          <MetricCard icon={AlertCircle}  label="Pendientes"   value={totalPendientes}    accent="from-amber-600 to-amber-500" />
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-slate-100 shadow-sm flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 max-w-xs">
            <Search size={12} className="text-slate-400 shrink-0" />
            <input type="text" placeholder="Buscar aula..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-slate-300 text-slate-600" />
          </div>
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                  filter === f
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {f === "todos" ? "Todos" : STATUS[f]?.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 ml-auto">
            <Activity size={11} /> {filtered.length} aula{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Classroom cards grid ── */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <School size={28} strokeWidth={1.2} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No se encontraron aulas</p>
            <p className="text-xs text-slate-400">Intenta con otro filtro o término de búsqueda</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {initialLoad ? (
                Array.from({ length: CARD_PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                filtered.slice(cardPage * CARD_PAGE_SIZE, (cardPage + 1) * CARD_PAGE_SIZE).map((c, i) => (
                  <ClassroomCard
                    key={c.id}
                    classroom={c}
                    status={statuses[c.id] || "pending"}
                    pct={pcts[c.id] ?? 0}
                    index={i}
                    onNavigate={(id) => navigate(`/auxiliar/asistencia/aula/${id}`)}
                    onIncidence={(id, name) => openIncidenceModal(id, name)}
                  />
                ))
              )}
            </div>

            <NumberedPagination
              total={filtered.length}
              page={cardPage}
              pageSize={CARD_PAGE_SIZE}
              onChange={setCardPage}
            />
          </>
        )}

      </div>

      <QRScannerModal
        open={quickScanning}
        onClose={() => setQuickScanning(false)}
        currentUser={user}
      />

      {/* ── Incidence detail modal ── */}
      <AnimatePresence>
        {incidenceModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIncidenceModal({ open: false, classroomId: null, classroomName: "" })}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-slate-200 flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <ClipboardList size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Incidencias · {incidenceModal.classroomName}</p>
                    <p className="text-xs text-white/60">{incidenceData.length} estudiante{incidenceData.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <button onClick={() => setIncidenceModal({ open: false, classroomId: null, classroomName: "" })}
                  className="text-white/50 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto p-5 space-y-2">
                {incidenceLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="relative">
                      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                    </div>
                  </div>
                ) : incidenceData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                    <ClipboardList size={32} strokeWidth={1.2} className="text-slate-200" />
                    <p className="text-sm font-medium">Sin registros de incidencias</p>
                    <p className="text-xs text-slate-300">Este aula no tiene novedades registradas</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <span className="col-span-4">Estudiante</span>
                      <span className="col-span-2 text-center">Inas. Just.</span>
                      <span className="col-span-2 text-center">Inas. Injust.</span>
                      <span className="col-span-2 text-center">Tard. Just.</span>
                      <span className="col-span-2 text-center">Tard. Injust.</span>
                    </div>
                    {incidenceData.map(item => {
                      const name = item.student ? `${item.student.lastName} ${item.student.firstName}` : "—";
                      return (
                        <div key={item.student?.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 items-center">
                          <span className="col-span-4 text-xs font-semibold text-slate-700 truncate">{name}</span>
                          <span className="col-span-2 text-center text-xs font-bold text-blue-600 tabular-nums">{item.justifiedAbsences}</span>
                          <span className="col-span-2 text-center text-xs font-bold text-red-600 tabular-nums">{item.unjustifiedAbsences}</span>
                          <span className="col-span-2 text-center text-xs font-bold text-amber-600 tabular-nums">{item.justifiedLates}</span>
                          <span className="col-span-2 text-center text-xs font-bold text-orange-600 tabular-nums">{item.unjustifiedLates}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-slate-400">
                  {incidenceData.length > 0 && `${incidenceData.reduce((s, r) => s + r.total, 0)} incidencias totales`}
                </span>
                <button onClick={() => setIncidenceModal({ open: false, classroomId: null, classroomName: "" })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
