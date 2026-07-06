import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Users, CheckCircle2, ChevronLeft, Search,
  RefreshCw, Download, Plus, Clock, AlertTriangle,
  CalendarDays, UserCheck, UserX, MinusCircle,
  MoreHorizontal, ArrowUpDown, Activity, CheckCircle, X,
  FileText, Lock, Paperclip, ClipboardList, QrCode,
  TrendingUp, School, GraduationCap, Eye, ChevronRight,
  ChevronsLeft, ChevronsRight, Sparkles, ShieldCheck,
  UserCircle, Receipt, Calendar,
} from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "@/core/auth/AuthContext";
import { useAttendance } from "../hooks/useAttendance";
import { attendanceService } from "../services/attendanceService";
import { parseAttendanceFromApi } from "../models/attendanceModel";
import ViewDocumentModal from "../components/Modals/ViewDocumentModal";
import StudentsQRModal from "../components/QR/StudentsQRModal";
import { exportAttendanceCsv, exportAttendancePdf, exportAttendancePdfAllDays } from "../services/attendanceReportService";
import { calendarService } from "@/features/events/services/calendarService";

function getPeruNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
}
function getTodayYmd() {
  return getPeruNow().toISOString().split("T")[0];
}
function getNowTimeHm() {
  const now = getPeruNow();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function formatDateFull(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
/* ── Status config with extended styles ── */
const SC = {
  PRESENT:   { label: "Presente",    short: "P", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-500", cell: "bg-emerald-500 text-white",   header: "bg-emerald-50 border-emerald-200 text-emerald-800",   icon: UserCheck, gradient: "from-emerald-500 to-emerald-400" },
  LATE:      { label: "Tardanza",    short: "T", badge: "bg-amber-50 text-amber-700 ring-amber-200",     dot: "bg-amber-500",   bar: "bg-amber-500",   cell: "bg-amber-500 text-white",     header: "bg-amber-50 border-amber-200 text-amber-800",     icon: Clock,    gradient: "from-amber-500 to-amber-400" },
  JUSTIFIED: { label: "Justificado", short: "J", badge: "bg-blue-50 text-blue-700 ring-blue-200",        dot: "bg-blue-500",    bar: "bg-blue-500",    cell: "bg-blue-500 text-white",      header: "bg-blue-50 border-blue-200 text-blue-800",        icon: ShieldCheck, gradient: "from-blue-500 to-blue-400" },
  ABSENT:    { label: "Ausente",     short: "A", badge: "bg-red-50 text-red-600 ring-red-200",           dot: "bg-red-500",     bar: "bg-red-500",     cell: "bg-red-500 text-white",       header: "bg-red-50 border-red-200 text-red-800",         icon: UserX,    gradient: "from-red-500 to-red-400" },
  "-":       { label: "Sin registro",short: "–", badge: "bg-slate-100 text-slate-400 ring-slate-200",   dot: "bg-slate-300",   bar: "bg-slate-300",   cell: "bg-slate-100 text-slate-400", header: "bg-slate-50 border-slate-200 text-slate-500",   icon: MinusCircle, gradient: "from-slate-400 to-slate-300" },
};

function getCellConfig(status, justificationReason) {
  if (status === "LATE" && justificationReason)
    return { short: "TJ", label: "Tard. Justif.", badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500", bar: "bg-blue-500", cell: "bg-blue-500 text-white", header: "bg-blue-50 border-blue-200 text-blue-800", gradient: "from-blue-500 to-blue-400", icon: ShieldCheck };
  if (status === "LATE")
    return { short: "TI", label: "Tard. Injust.", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", bar: "bg-amber-500", cell: "bg-amber-500 text-white", header: "bg-amber-50 border-amber-200 text-amber-800", gradient: "from-amber-500 to-amber-400", icon: Clock };
  if (status === "JUSTIFIED")
    return { short: "J", label: "Justificado", badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500", bar: "bg-blue-500", cell: "bg-blue-500 text-white", header: "bg-blue-50 border-blue-200 text-blue-800", gradient: "from-blue-500 to-blue-400", icon: ShieldCheck };
  if (status === "ABSENT" && justificationReason)
    return { short: "IJ", label: "Inas. Justif.", badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500", bar: "bg-blue-500", cell: "bg-blue-500 text-white", header: "bg-blue-50 border-blue-200 text-blue-800", gradient: "from-blue-500 to-blue-400", icon: ShieldCheck };
  if (status === "ABSENT")
    return { short: "II", label: "Inas. Injust.", badge: "bg-red-50 text-red-600 ring-red-200", dot: "bg-red-500", bar: "bg-red-500", cell: "bg-red-500 text-white", header: "bg-red-50 border-red-200 text-red-800", gradient: "from-red-500 to-red-400", icon: UserX };
  return SC[status] || SC["-"];
}

/* ── Animated counter ── */
function AnimatedNumber({ value, duration = 600 }) {
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

/* ── Premium Metric Card ── */
const metricColors = {
  slate:   { bar: "from-slate-600 to-slate-500",  icon: "from-slate-500 to-slate-400", bg: "bg-slate-50" },
  emerald: { bar: "from-emerald-600 to-emerald-500", icon: "from-emerald-500 to-emerald-400", bg: "bg-emerald-50" },
  red:     { bar: "from-red-600 to-red-500",      icon: "from-red-500 to-red-400", bg: "bg-red-50" },
  amber:   { bar: "from-amber-600 to-amber-500",  icon: "from-amber-500 to-amber-400", bg: "bg-amber-50" },
  blue:    { bar: "from-blue-600 to-blue-500",    icon: "from-blue-500 to-blue-400", bg: "bg-blue-50" },
};

function MetricCard({ icon, label, value, color = "slate" }) {
  const Icon = icon;
  const c = metricColors[color] || metricColors.slate;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative bg-white rounded-2xl p-5 border border-slate-100/80 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.bar} rounded-t-2xl`} />
      <div className="flex items-start justify-between mt-0.5">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 leading-none tracking-tight tabular-nums">
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.icon} shadow-sm shrink-0`}>
          <Icon size={16} className="text-white" strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── AlertBanner ── */
function AlertBanner({ type, message }) {
  const s = type === "holiday"
    ? "bg-gradient-to-r from-red-50 to-red-50/80 border-red-200/80 text-red-700"
    : "bg-gradient-to-r from-amber-50 to-amber-50/80 border-amber-200/80 text-amber-700";
  const Icon = type === "holiday" ? AlertTriangle : CalendarDays;
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className={`flex items-start gap-3 px-5 py-4 rounded-2xl border text-sm font-semibold ${s} backdrop-blur-md`}>
      <Icon size={18} className="mt-0.5 shrink-0" strokeWidth={2.5} />
      <p className="leading-relaxed">{message}</p>
    </motion.div>
  );
}

/* ── SkeletonRow ── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0 animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-100 rounded w-44" />
        <div className="h-3 bg-slate-100 rounded w-28" />
      </div>
      <div className="hidden md:flex gap-1.5">
        {[1,2,3,4].map(i => <div key={i} className="w-9 h-9 bg-slate-100 rounded-xl" />)}
      </div>
      <div className="hidden md:block w-24 h-7 bg-slate-100 rounded-full" />
    </div>
  );
}

const RELATIONSHIP_OPTIONS = [
  "Padre", "Madre", "Tutor", "Tutor Legal", "Abuelo", "Abuela",
  "Tío", "Tía", "Hermano", "Hermana", "Otro Familiar", "Apoderado",
];

/* ── CellEditorPopover — PREMIUM CENTERED MODAL ── */
function CellEditorPopover({ student, ymd, cell, onClose, onSave, onOpenDetail }) {
  const [phase, setPhase]                     = useState(1);
  const [status, setStatus]                   = useState(cell?.status || "ABSENT");
  const [arrivalTime, setArrivalTime]         = useState(cell?.arrivalTime || "");
  const [departureTime, setDepartureTime]     = useState(cell?.departureTime || "");
  const [justificationReason, setJustificationReason] = useState(cell?.justificationReason || "");
  const [evidenceFile, setEvidenceFile]       = useState(null);
  const [uploadHint, setUploadHint]           = useState("");
  const [saving, setSaving]                   = useState(false);
  const [pickedUpByName, setPickedUpByName]   = useState(cell?.pickedUpByName || "");
  const [pickedUpByRelationship, setPickedUpByRelationship] = useState(cell?.pickedUpByRelationship || "Padre");
  const [pickedUpByDni, setPickedUpByDni]     = useState(cell?.pickedUpByDni || "");
  const [pickupTime, setPickupTime]           = useState(cell?.pickupTime || getNowTimeHm());
  const [pickupNotes, setPickupNotes]         = useState(cell?.pickupNotes || "");

  useEffect(() => {
    const data = {
      status: cell?.status || "ABSENT",
      arrivalTime: cell?.arrivalTime || "",
      departureTime: cell?.departureTime || "",
      justificationReason: cell?.justificationReason || "",
      pickedUpByName: cell?.pickedUpByName || "",
      pickedUpByRelationship: cell?.pickedUpByRelationship || "Padre",
      pickedUpByDni: cell?.pickedUpByDni || "",
      pickupTime: cell?.pickupTime || getNowTimeHm(),
      pickupNotes: cell?.pickupNotes || "",
      cellId: cell?.id || null,
    };
    // Auto-completar salida si ya tiene ingreso (segundo click)
    const isPresentOrLate = data.status === "PRESENT" || data.status === "LATE";
    if (isPresentOrLate && data.arrivalTime && !data.departureTime) {
      data.departureTime = getNowTimeHm();
    }
    // Evitar setState durante el render
    requestAnimationFrame(() => {
      setStatus(data.status);
      setArrivalTime(data.arrivalTime);
      setDepartureTime(data.departureTime);
      setJustificationReason(data.justificationReason);
      setPickedUpByName(data.pickedUpByName);
      setPickedUpByRelationship(data.pickedUpByRelationship);
      setPickedUpByDni(data.pickedUpByDni);
      setPickupTime(data.pickupTime);
      setPickupNotes(data.pickupNotes);
      setEvidenceFile(null);
      setUploadHint("");
    });
  }, [cell?.id, cell?.status, cell?.arrivalTime, cell?.departureTime, cell?.justificationReason,
      cell?.pickedUpByName, cell?.pickedUpByRelationship, cell?.pickedUpByDni, cell?.pickupTime, cell?.pickupNotes]);

  const canArrival   = status === "PRESENT" || status === "LATE";
  const canDeparture = status === "PRESENT" || status === "LATE";
  const canJustify   = status === "LATE" || status === "ABSENT" || status === "JUSTIFIED";
  const justifyMissing = canJustify && !String(justificationReason || "").trim();

  const lockArrival          = canArrival && Boolean(arrivalTime);
  const lockDeparture        = canDeparture && Boolean(departureTime);
  const isClosedReadOnly     = Boolean((cell?.status === "PRESENT" || cell?.status === "LATE") && cell?.arrivalTime && cell?.departureTime);

  const statusOptions = [
    { val: "PRESENT",   label: "Presente",    desc: "Asistió con normalidad" },
    { val: "LATE",      label: "Tardanza",    desc: "Llegó después de la hora" },
    { val: "ABSENT",    label: "Ausente",     desc: "No asistió" },
    { val: "JUSTIFIED", label: "Justificado", desc: "Falta justificada" },
  ];

  const phases = [
    { id: 1, label: "Estado",   icon: CheckCircle },
    { id: 2, label: "Recojo",   icon: UserCircle },
    { id: 3, label: "Justif.",  icon: FileText, disabled: !canJustify },
  ];

  const curCfg = getCellConfig(status, justificationReason);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative w-[520px] max-w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Premium header with gradient */}
        <div className={`px-6 py-5 bg-gradient-to-r ${curCfg.gradient || "from-slate-700 to-slate-600"} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <UserCircle size={22} className="text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white">
                  {student ? `${student.lastName}, ${student.firstName}` : "Estudiante"}
                </p>
                <p className="text-xs text-white/70 font-mono mt-0.5 flex items-center gap-1.5">
                  <CalendarDays size={11} /> {ymd}
                  {cell?.id && <><span className="opacity-40">|</span> ID: {cell.id}</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all">
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Phase tabs */}
        <div className="flex px-6 pt-4 gap-1">
          {phases.map(p => {
            const Icon = p.icon;
            const active = phase === p.id;
            return (
              <button key={p.id} disabled={p.disabled}
                onClick={() => setPhase(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  active
                    ? "bg-slate-900 text-white shadow-md"
                    : p.disabled
                      ? "text-slate-300 cursor-not-allowed opacity-50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}>
                <Icon size={13} strokeWidth={2} />
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[420px] overflow-y-auto">
          {phase === 1 && (
            <>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Seleccionar estado</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {statusOptions.map(opt => {
                    const c = SC[opt.val];
                    const active = status === opt.val;
                    const Icon = c.icon;
                    return (
                      <button key={opt.val} disabled={isClosedReadOnly}
                        onClick={() => {
                          setStatus(opt.val);
                          if (opt.val === "PRESENT" || opt.val === "LATE") setArrivalTime(prev => prev || getNowTimeHm());
                          else setDepartureTime("");
                        }}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                          active
                            ? `${c.badge} ring-2 ring-offset-2 border-transparent shadow-md`
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}>
                        <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center ${active ? `${c.cell}` : "bg-slate-100 text-slate-400"}`}>
                          <Icon size={13} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{opt.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Horarios</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Ingreso",  val: arrivalTime,   set: setArrivalTime,   disabled: true, locked: lockArrival   },
                    { label: "Salida",   val: departureTime, set: setDepartureTime, disabled: true, locked: lockDeparture },
                  ].map(({ label, val, set, disabled, locked }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                        {locked && <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md"><Lock size={8} /> Bloqueado</span>}
                      </div>
                      {locked ? (
                        <div className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-bold font-mono shadow-sm">{val}</div>
                      ) : (
                        <input type="time" value={val} disabled={disabled}
                          onChange={e => set(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-mono font-bold" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {phase === 2 && (
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Información de recojo</p>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Nombre de quien recoge</p>
                  <input type="text" value={pickedUpByName}
                    onChange={e => setPickedUpByName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all"
                    placeholder="Nombre completo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Parentesco</p>
                    <select value={pickedUpByRelationship} onChange={e => setPickedUpByRelationship(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all appearance-none">
                      {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5">DNI</p>
                    <input type="text" value={pickedUpByDni}
                      onChange={e => setPickedUpByDni(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all font-mono"
                      placeholder="8 dígitos" maxLength={8} />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Hora de recojo</p>
                  <input type="time" value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all font-mono" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Notas</p>
                  <textarea value={pickupNotes} rows={2}
                    onChange={e => setPickupNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all resize-none"
                    placeholder="Observaciones adicionales…" />
                </div>
              </div>
            </div>
          )}

          {phase === 3 && canJustify && (
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Justificación</p>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Motivo</p>
                  <textarea value={justificationReason} disabled={isClosedReadOnly} rows={3}
                    onChange={e => setJustificationReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100 transition-all resize-none"
                    placeholder="Describe el motivo de la falta…" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Documento de evidencia (opcional)</p>
                  <label className={`flex items-center gap-3 px-4 py-3.5 border-2 border-dashed rounded-xl text-sm cursor-pointer transition-all ${
                    canJustify && !isClosedReadOnly
                      ? "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-600"
                      : "border-slate-200 bg-slate-100 cursor-not-allowed text-slate-400"
                  }`}>
                    <Paperclip size={15} />
                    <span className="truncate font-medium">{evidenceFile ? evidenceFile.name : "Subir archivo (PDF, JPG, PNG)"}</span>
                    <input type="file" disabled={isClosedReadOnly || !canJustify} className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={e => { const f = e.target.files?.[0] || null; setEvidenceFile(f); setUploadHint(f ? "Se subirá al guardar" : ""); }} />
                  </label>
                  {!!cell?.justificationDocumentUrl && !evidenceFile && (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-bold mt-2">
                      <CheckCircle size={14} /> Evidencia adjunta en el registro
                    </div>
                  )}
                  {uploadHint && <p className="text-sm text-blue-600 font-semibold mt-2">{uploadHint}</p>}
                </div>
                {justifyMissing && (
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertTriangle size={15} className="text-red-600 shrink-0" />
                    <p className="text-sm text-red-800 font-bold">Debes especificar el motivo de justificación</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {phase === 3 && !canJustify && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={28} strokeWidth={1.5} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500">Justificación no disponible</p>
              <p className="text-xs text-slate-400 mt-1">Solo aplica para tardanzas e inasistencias</p>
            </div>
          )}

          {isClosedReadOnly && (
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Lock size={14} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">Registro bloqueado</p>
                <p className="text-xs text-amber-600/80 mt-0.5">Ya cuenta con hora de ingreso y salida registradas</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {cell?.id && (
              <button onClick={onOpenDetail}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-all border border-slate-200 bg-white shadow-sm">
                <Receipt size={13} /> Ver detalle
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-all border border-slate-200 bg-white shadow-sm">
              Cancelar
            </button>
            {!isClosedReadOnly && (
              <button disabled={saving}
                onClick={async () => {
                  if (justifyMissing) {
                    await Swal.fire({ icon: "warning", title: "Motivo requerido", text: "Para marcar como Justificado es obligatorio ingresar el motivo.", confirmButtonColor: "#2563eb" });
                    return;
                  }
                  const completingTimes = (status === "PRESENT" || status === "LATE") && Boolean(arrivalTime) && Boolean(departureTime) && !lockDeparture;
                  if (completingTimes) {
                    const confirm = await Swal.fire({ icon: "warning", title: "Confirmar horarios", text: "Al guardar con hora de ingreso y salida, ya no se podrán modificar después. ¿Deseas continuar?", showCancelButton: true, confirmButtonText: "Sí, guardar", cancelButtonText: "Cancelar", confirmButtonColor: "#2563eb", cancelButtonColor: "#6b7280" });
                    if (!confirm.isConfirmed) return;
                  }
                  setSaving(true);
                  const patch = {
                    status,
                    ...(canArrival && arrivalTime ? { arrivalTime } : {}),
                    ...(canDeparture && departureTime ? { departureTime } : {}),
                    ...(canJustify && justificationReason ? { justificationReason } : {}),
                    ...(pickedUpByName ? { pickedUpByName } : {}),
                    ...(pickedUpByRelationship ? { pickedUpByRelationship } : {}),
                    ...(pickedUpByDni ? { pickedUpByDni } : {}),
                    ...(pickupTime ? { pickupTime } : {}),
                    ...(pickupNotes ? { pickupNotes } : {}),
                  };
                  await onSave(patch, canJustify ? evidenceFile : null);
                  setSaving(false);
                  onClose();
                }}
                className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {saving ? "Guardando…" : "Guardar registro"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── DayDetailModal — PREMIUM ── */
function DayDetailModal({ student, ymd, cell, onClose, onViewDocument }) {
  const secureUrl = cell?.justificationDocumentUrl?.replace(/^http:/, "https:");
  const cfg = getCellConfig(cell?.status || "-", cell?.justificationReason);
  const Icon = cfg.icon;
  const studentName = student ? `${student.lastName}, ${student.firstName}` : "Estudiante";

  const fields = [
    { label: "DNI",            val: student?.documentNumber || "—", icon: FileText },
    { label: "Ingreso",        val: cell?.arrivalTime || "—",      icon: Clock },
    { label: "Salida",         val: cell?.departureTime || "—",    icon: Clock },
    { label: "Recogido por",   val: cell?.pickedUpByName || "—",   icon: UserCircle },
    { label: "Parentesco",     val: cell?.pickedUpByRelationship || "—", icon: Users },
    { label: "Hora recojo",    val: cell?.pickupTime || "—",       icon: Clock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/80">
        <div className={`px-6 py-5 bg-gradient-to-r ${cfg.gradient || "from-slate-700 to-slate-600"} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-white">{studentName}</p>
              <p className="text-xs text-white/70 mt-0.5">{formatDateFull(ymd)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all">
            <X size={16} className="text-white" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {fields.map(f => (
              <div key={f.label} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100/80">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</p>
                <p className="text-sm font-bold text-slate-800 font-mono">{f.val}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={12} className="text-slate-400" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Justificación</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{cell?.justificationReason || "Sin justificación registrada"}</p>
          </div>
          {secureUrl ? (
            <button onClick={() => onViewDocument(secureUrl)}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 rounded-xl transition-all shadow-md hover:shadow-lg">
              <Eye size={15} /> Ver documento adjunto
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100 font-semibold">
              <Paperclip size={13} /> Sin documento adjunto
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── StudentIncidenceModal — PREMIUM ── */
function StudentIncidenceModal({ student, attendances, onClose }) {
  const counts = useMemo(() => {
    let inasJust = 0, inasInjust = 0, tardJust = 0, tardInjust = 0, present = 0;
    for (const a of attendances || []) {
      const st = a.status;
      if (st === "PRESENT") present++;
      else if (st === "JUSTIFIED") inasJust++;
      else if (st === "ABSENT") inasInjust++;
      else if (st === "LATE" && a.justificationReason) tardJust++;
      else if (st === "LATE") tardInjust++;
    }
    return { inasJust, inasInjust, tardJust, tardInjust, present, total: attendances?.length || 0 };
  }, [attendances]);

  const items = [
    { label: "Presentes",          value: counts.present,    color: "emerald", icon: UserCheck, desc: "Asistieron con normalidad" },
    { label: "Inas. Justificadas", value: counts.inasJust,   color: "blue",    icon: ShieldCheck, desc: "Faltas con justificación" },
    { label: "Inas. Injustificadas", value: counts.inasInjust, color: "red",  icon: UserX, desc: "Faltas sin justificar" },
    { label: "Tard. Justificadas", value: counts.tardJust,   color: "amber",  icon: Clock, desc: "Tardanzas con justificación" },
    { label: "Tard. Injustificadas", value: counts.tardInjust, color: "orange", icon: Clock, desc: "Tardanzas sin justificar" },
  ];

  const colorBars = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
  };

  const totalMarked = counts.present + counts.inasJust + counts.inasInjust + counts.tardJust + counts.tardInjust;
  const attendanceRate = counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80">
        <div className="px-6 py-5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ClipboardList size={20} className="text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white">
                  {student ? `${student.lastName}, ${student.firstName}` : "Estudiante"}
                </p>
                <p className="text-xs text-white/60 mt-0.5">Reporte de incidencias</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all">
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {counts.total > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asistencia general</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{attendanceRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registros</p>
                <p className="text-lg font-bold text-slate-700 mt-1 tabular-nums">{totalMarked}/{counts.total}</p>
              </div>
            </div>
          )}
          <div className="space-y-2.5">
            {items.filter(i => i.value > 0).map(item => {
              const Icon = item.icon;
              const pct = counts.total > 0 ? Math.round((item.value / counts.total) * 100) : 0;
              return (
                <div key={item.label} className="bg-white rounded-xl p-3.5 border border-slate-100 hover:border-slate-200 transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg bg-${item.color}-50 flex items-center justify-center`}>
                        <Icon size={13} className={`text-${item.color}-600`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{item.label}</p>
                        <p className="text-[10px] text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-slate-900 tabular-nums">{item.value}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className={`h-full rounded-full ${colorBars[item.color]} shadow-sm`} />
                  </div>
                </div>
              );
            })}
            {items.filter(i => i.value > 0).length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <p className="text-sm font-bold text-slate-500">Sin incidencias registradas</p>
                <p className="text-xs text-slate-400 mt-1">No hay datos disponibles para este estudiante</p>
              </div>
            )}
          </div>
          {counts.total > 0 && (
            <div className="text-center text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-100">
              Última actualización: {new Date().toLocaleDateString("es-PE")}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main page ── */
export default function DailyAttendanceSheetPage() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const { classroomId } = useParams();

  const { students, classrooms, fetchAll, fetchStudentsByClassroom, updateAttendance, justifyAttendance } = useAttendance(user);

  const [sheetLoading, setSheetLoading]         = useState(false);
  const [startingDay]           = useState(false);
  const [classroomAttendances, setClassroomAttendances] = useState([]);
  const [cellEditor, setCellEditor]             = useState({ open: false, studentId: null, ymd: null });
  const [detailModal, setDetailModal]           = useState({ open: false, studentId: null, ymd: null });
  const [docModal, setDocModal]                 = useState({ open: false, url: "", title: "" });
  const [incidenceModal, setIncidenceModal]     = useState({ open: false, studentId: null });
  const [qrModalOpen, setQrModalOpen]           = useState(false);
  const [celebrations, setCelebrations]         = useState([]);
  const [allEvents, setAllEvents]               = useState([]);
  const [blockedReason, setBlockedReason]       = useState("");
  const [lastSync, setLastSync]                 = useState(new Date());
  const [search, setSearch]                     = useState("");
  const [sortDir, setSortDir]                   = useState("asc");
  const [liveTime, setLiveTime]                 = useState(getNowTimeHm);
  const [statusFilter, setStatusFilter]         = useState("all");
  const [selectedMonth, setSelectedMonth]       = useState(getPeruNow().getMonth());
  const tableScrollRef = useRef(null);

  useEffect(() => {
    if (tableScrollRef.current) {
      const el = tableScrollRef.current.querySelector("[data-today]");
      if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => setLiveTime(getNowTimeHm()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayYmd = useMemo(() => getTodayYmd(), []);
  const todayStr = useMemo(() => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" })).toISOString().split("T")[0], []);

  const currentClassroom = useMemo(
    () => (classrooms || []).find(c => String(c.id) === String(classroomId)) || null,
    [classrooms, classroomId]
  );

  const refresh = useCallback(async () => {
    setSheetLoading(true);
    try {
      await fetchAll();
      if (classroomId) await fetchStudentsByClassroom(classroomId);
      const response = await attendanceService.getByClassroom(classroomId);
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      const filtered = (list || []).filter(a => user?.institutionId ? String(a.institutionId) === String(user.institutionId) : true);
      setClassroomAttendances(filtered.map(a => parseAttendanceFromApi(a)));
      setLastSync(new Date());
    } catch (err) {
      console.error("Error loading daily sheet:", err);
      setClassroomAttendances([]);
      Swal.fire({ icon: "error", title: "No se pudo cargar", text: "Intenta nuevamente.", confirmButtonColor: "#2563eb" });
    } finally {
      setSheetLoading(false);
    }
  }, [classroomId, fetchAll, fetchStudentsByClassroom, user?.institutionId]);

  useEffect(() => {
    if (!user?.institutionId) return;
    (async () => {
      try {
        const calendars = await calendarService.getByInstitution(user.institutionId);
        const active = (calendars || []).find(c =>
          c.status === "ACTIVE" && todayStr >= String(c.startDate).slice(0, 10) && todayStr <= String(c.endDate).slice(0, 10)
        );
        if (!active?.id) return;
        const { events = [] } = await calendarService.getWithEvents(active.id);
        setAllEvents(events);
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
  }, [user?.institutionId, todayStr]);

  useEffect(() => { refresh(); }, [refresh]);

  const holidays = useMemo(() => {
    return new Set((allEvents || []).filter(e => e.isHoliday).map(e => String(e.startDate || "").slice(0, 10)));
  }, [allEvents]);

  const dateColumns = useMemo(() => {
    const now = getPeruNow();
    const year = now.getFullYear();
    const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(selectedMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    });
  }, [selectedMonth]);

  const attendanceByStudentDate = useMemo(() => {
    const map = new Map();
    for (const a of classroomAttendances || []) {
      const ymd = String(a.attendanceDate || "").slice(0, 10);
      if (!ymd) continue;
      map.set(`${String(a.studentId)}|${ymd}`, a);
    }
    return map;
  }, [classroomAttendances]);

  const getCell = useCallback((studentId, ymd) => attendanceByStudentDate.get(`${String(studentId)}|${ymd}`) || null, [attendanceByStudentDate]);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return (students || [])
      .slice()
      .sort((a, b) => {
        const an = `${a.lastName || ""} ${a.firstName || ""}`.trim().toLowerCase();
        const bn = `${b.lastName || ""} ${b.firstName || ""}`.trim().toLowerCase();
        return sortDir === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
      })
      .map((s, i) => ({ idx: i + 1, student: s, todayAttendance: attendanceByStudentDate.get(`${String(s.id)}|${todayYmd}`) || null }))
      .filter(r => {
        const name = `${r.student.firstName} ${r.student.lastName}`.toLowerCase();
        const matchesSearch = !q || name.includes(q) || (r.student.documentNumber || "").includes(q);
        if (!matchesSearch) return false;
        if (statusFilter === "all") return true;
        const st = r.todayAttendance?.status || "ABSENT";
        if (statusFilter === "present") return st === "PRESENT" || st === "LATE";
        if (statusFilter === "absent") return st === "ABSENT";
        if (statusFilter === "justified") return st === "JUSTIFIED" || (st === "ABSENT" && r.todayAttendance?.justificationReason) || (st === "LATE" && r.todayAttendance?.justificationReason);
        return true;
      });
  }, [students, attendanceByStudentDate, todayYmd, search, sortDir, statusFilter]);

  const stats = useMemo(() => {
    let present = 0, late = 0, absent = 0, justified = 0;
    for (const r of rows) {
      const st = attendanceByStudentDate.get(`${String(r.student.id)}|${todayYmd}`)?.status || "ABSENT";
      if (st === "PRESENT")   present++;
      else if (st === "LATE") late++;
      else if (st === "JUSTIFIED") justified++;
      else absent++;
    }
    return { total: rows.length, present: present + late, justified, absent, late, rawPresent: present };
  }, [rows, attendanceByStudentDate, todayYmd]);

  const todayLabel = formatDateFull(todayYmd);

  const isTeacher = window.location.pathname.includes("/docente/");

  const handleDateDelete = async (ymd) => {
    if (isTeacher) {
      await Swal.fire({ icon: "warning", title: "Acción no permitida", text: "Los docentes no pueden eliminar registros de asistencia.", confirmButtonColor: "#2563eb" });
      return;
    }
    if (ymd !== todayYmd) {
      await Swal.fire({ icon: "info", title: "Solo hoy", text: "Solo se puede restablecer el día de hoy.", confirmButtonColor: "#2563eb" });
      return;
    }
    const records = (classroomAttendances || []).filter(a => String(a.attendanceDate || "").slice(0, 10) === ymd);
    if (!records.length) {
      await Swal.fire({ icon: "info", title: "Sin registros", text: "No hay registros para esta fecha.", confirmButtonColor: "#2563eb" });
      return;
    }
    const confirm = await Swal.fire({ icon: "warning", title: "Restablecer día", text: `Se eliminarán todos los registros de asistencia de ${formatDate(ymd)}. ¿Deseas continuar?`, showCancelButton: true, confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar", confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280" });
    if (!confirm.isConfirmed) return;
    try {
      await Promise.all(records.map(r => attendanceService.delete(r.id).catch(() => {})));
      await refresh();
      await Swal.fire({ icon: "success", title: "Día restablecido", text: "Registros eliminados correctamente.", timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error("Error deleting day:", err);
      await Swal.fire({ icon: "error", title: "Error", text: "No se pudieron eliminar los registros.", confirmButtonColor: "#2563eb" });
    }
  };

  const ensureCellExists = async ({ studentId, ymd }) => {
    const existing = getCell(studentId, ymd);
    if (existing?.id) return existing;
    if (!user?.institutionId) return null;
    try {
      const now = getPeruNow();
      await attendanceService.create({ studentId, classroomId, institutionId: user.institutionId, attendanceDate: ymd, academicYear: now.getFullYear(), status: "ABSENT", registeredBy: user?.userId || user?.id });
      await refresh();
      return getCell(studentId, ymd);
    } catch (err) {
      if (err?.response?.status === 409) { await refresh(); return getCell(studentId, ymd); }
      console.error("Error creating missing attendance cell:", err);
      return null;
    }
  };

  const saveCell = async ({ studentId, ymd, patch }) => {
    const cell = await ensureCellExists({ studentId, ymd });
    if (!cell?.id) { await Swal.fire({ icon: "warning", title: "No se pudo guardar", text: "No se pudo crear/leer el registro.", confirmButtonColor: "#2563eb" }); return; }
    const isClosed = cell.status === "PRESENT" && Boolean(cell.arrivalTime) && Boolean(cell.departureTime);
    if (isClosed) { await Swal.fire({ icon: "info", title: "Registro cerrado", text: "Este registro ya tiene hora de ingreso y salida.", confirmButtonColor: "#2563eb" }); return; }
    const next = { ...cell, ...patch };
    try {
      if (next.status === "JUSTIFIED") {
        await justifyAttendance(cell.id, next);
      } else {
        await updateAttendance(cell.id, next);
      }
      await refresh();
    } catch (err) { console.error("Error updating attendance row:", err); Swal.fire({ icon: "error", title: "No se pudo guardar", text: "Intenta nuevamente.", confirmButtonColor: "#2563eb" }); }
  };

  const uploadEvidence = async ({ attendanceId, file }) => {
    const { default: apiClient } = await import("@/core/api/apiClient");
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post(`/api/attendance/${attendanceId}/upload-justification`, form, { headers: { "Content-Type": "multipart/form-data" } });
    return res?.data?.url || "";
  };

  const handleExport = async () => {
    const dateOptions = (dateColumns || []).map(d => String(d).slice(0, 10)).filter(Boolean);
    const fmtShort = d => d.slice(8,10) + "/" + d.slice(5,7) + "/" + d.slice(0,4);
    const defaultDay = dateOptions.includes(todayYmd) ? todayYmd : (dateOptions[dateOptions.length - 1] || "");
    const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"];

    const res = await Swal.fire({
      title: "Exportar reporte",
      html: `<div style="font-family:inherit;color:#0f172a;display:flex;flex-direction:column;gap:10px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div>
            <label style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:4px">Formato</label>
            <select id="fmt" style="width:100%;height:38px;padding:0 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;color:#0f172a;outline:none;appearance:none;cursor:pointer">
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:4px">Alcance</label>
            <select id="scope" style="width:100%;height:38px;padding:0 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;color:#0f172a;outline:none;appearance:none;cursor:pointer">
              <option value="month">Este mes (${monthNames[selectedMonth]})</option>
              <option value="day">Un día específico</option>
              <option value="all">Todos los días</option>
            </select>
          </div>
        </div>
        <div id="dateWrap" style="display:none">
          <label style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:4px">Seleccionar fecha</label>
          <select id="day" style="width:100%;height:38px;padding:0 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;color:#0f172a;outline:none;appearance:none;cursor:pointer">${dateOptions.map(d => `<option value="${d}" ${d === defaultDay ? "selected" : ""}>${fmtShort(d)}</option>`).join("")}</select>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:11px;color:#64748b;line-height:1.4">
          Incluye: <b style="color:#0f172a">institución, aula, estudiantes y registro de asistencia</b>
        </div>
      </div>`,
      didOpen: () => {
        const scope = document.getElementById("scope");
        const dateWrap = document.getElementById("dateWrap");
        const toggle = () => { if (dateWrap) dateWrap.style.display = scope?.value === "day" ? "block" : "none"; };
        if (scope) scope.addEventListener("change", toggle);
        toggle();
      },
      preConfirm: () => {
        const fmtEl = document.getElementById("fmt");
        const scopeEl = document.getElementById("scope");
        const dayEl = document.getElementById("day");
        return { fmt: fmtEl?.value, scope: scopeEl?.value, day: dayEl?.value };
      },
      width: 400,
      showCancelButton: true,
      confirmButtonText: "Exportar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
    });
    if (!res.isConfirmed) return;

    const { fmt, scope, day } = res.value || {};
    if (scope === "day" && !day) { await Swal.fire({ icon: "info", title: "Sin fechas registradas", text: "Aún no hay fechas registradas.", confirmButtonColor: "#2563eb" }); return; }
    const institutionRes = user?.institutionId ? await attendanceService.getInstitutionById(user.institutionId) : null;

    if (fmt === "pdf") {
      if (scope === "month") {
        const monthDays = dateColumns.filter(d => {
          const m = new Date(d + "T00:00:00").getMonth();
          return m === selectedMonth;
        });
        await exportAttendancePdfAllDays({ institutionResponse: institutionRes?.data ?? institutionRes, classroomName: currentClassroom?.classroomName || "", dateColumns: monthDays, students, getCell });
        return;
      }
      if (scope === "all") { await exportAttendancePdfAllDays({ institutionResponse: institutionRes?.data ?? institutionRes, classroomName: currentClassroom?.classroomName || "", dateColumns, students, getCell }); return; }
      const dateYmd = day || todayYmd;
      const dayAttendances = (classroomAttendances || []).filter(a => String(a.attendanceDate || "").slice(0, 10) === String(dateYmd).slice(0, 10));
      await exportAttendancePdf({ institutionResponse: institutionRes?.data ?? institutionRes, classroomName: currentClassroom?.classroomName || "", dateYmd, students, attendances: dayAttendances });
      return;
    }

    if (scope === "month") {
      const monthDays = dateColumns.filter(d => {
        const m = new Date(d + "T00:00:00").getMonth();
        return m === selectedMonth;
      });
      exportAttendanceCsv({ classroomName: currentClassroom?.classroomName || "", dateColumns: monthDays, students, getCell });
      return;
    }
    exportAttendanceCsv({ classroomName: currentClassroom?.classroomName || "", dateColumns: scope === "day" ? [day || todayYmd] : dateColumns, students, getCell });
  };

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">

      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate("/auxiliar/asistencia")}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all shrink-0">
              <ChevronLeft size={16} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center shadow-sm shrink-0">
              <BookOpen size={15} color="white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 text-[15px] tracking-tight">Control de Asistencia</span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-2">· {todayLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="tabular-nums font-medium">{liveTime}</span>
            </div>
            <button onClick={refresh} disabled={sheetLoading} title="Actualizar"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50">
              <RefreshCw size={14} className={sheetLoading ? "animate-spin" : ""} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
              <span className="w-1 h-1 bg-slate-400 rounded-full" />
              {lastSync.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <button onClick={() => setQrModalOpen(true)} disabled={!students.length}
              className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40">
              <QrCode size={13} /> QR
            </button>
            <button onClick={handleExport} disabled={sheetLoading || startingDay}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40">
              <Download size={13} /> Exportar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-5 md:px-8 py-6 space-y-6">

        {/* Alerts */}
        <AnimatePresence>
          {blockedReason && <AlertBanner type="holiday" message={blockedReason} />}
          {!blockedReason && celebrations.length > 0 && (
            <AlertBanner type="event" message={celebrations.map(e => e.title).join(" · ")} />
          )}
        </AnimatePresence>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard icon={Users}       label="Total"        value={sheetLoading ? "–" : stats.total}      color="slate"   />
          <MetricCard icon={UserCheck}   label="Presentes"    value={sheetLoading ? "–" : stats.present}    color="emerald" />
          <MetricCard icon={ShieldCheck} label="Justificados" value={sheetLoading ? "–" : stats.justified}  color="blue"    />
          <MetricCard icon={UserX}       label="Ausentes"     value={sheetLoading ? "–" : stats.absent}     color="red"     />
        </div>

        {/* Month selector */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
          <div className="flex items-center gap-1 px-4 md:px-5 py-3 overflow-x-auto scrollbar-none">
            {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((m, i) => {
              const now = getPeruNow();
              const isCur = i === now.getMonth();
              return (
                <button key={m} onClick={() => setSelectedMonth(i)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                    selectedMonth === i
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isCur ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm">

          {/* Controls */}
          <div className="px-4 md:px-5 py-3 border-b border-slate-50 flex items-center gap-3">
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-all hover:bg-slate-50">
                <ArrowUpDown size={11} />
                {sortDir === "asc" ? "A–Z" : "Z–A"}
              </button>
              <div className="relative w-36">
                <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Buscar…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-[10px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all placeholder:text-slate-300" />
              </div>
            </div>
          </div>

          {/* Scrollable table area */}
          <div className="overflow-x-auto" ref={tableScrollRef}>

            {/* Date column headers */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <div className="w-60 shrink-0 px-4 py-2.5 flex items-center sticky left-0 z-20 bg-slate-50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estudiante</span>
              </div>
              {dateColumns.map(d => {
              const dayNames = ["dom","lun","mar","mié","jue","vie","sáb"];
              const dow = new Date(d + "T00:00:00").getDay();
              const isSunday = dow === 0;
              const isHoliday = holidays.has(d);
              const isBlocked = isSunday || isHoliday;
              return (
                <div key={d} data-today={d === todayYmd ? "true" : undefined} className={`w-14 shrink-0 flex flex-col items-center justify-center py-2 border-l ${isBlocked ? "border-red-50 bg-red-50/30" : d === todayYmd ? "border-indigo-200 bg-indigo-50/60" : "border-slate-100"} group`}>
                  {isBlocked ? (
                    <span className="text-[10px] font-bold text-red-300" title="Feriado">F</span>
                  ) : (
                    <span className={`text-[10px] font-bold ${d === todayYmd ? "text-indigo-700" : "text-slate-500"}`}>{formatDate(d)}</span>
                  )}
                  <span className={`text-[8px] font-medium uppercase -mt-0.5 ${d === todayYmd ? "text-indigo-500 font-bold" : "text-slate-400"}`}>{dayNames[dow]}</span>
                  {d === todayYmd && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-500 rounded-full" />}
                  {!isBlocked && <button onClick={() => handleDateDelete(d)}
                    className="absolute -right-1 -top-1 w-4 h-4 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm text-[8px] font-bold"
                    title="Restablecer">✕</button>}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {sheetLoading ? (
            <div>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shadow-inner">
                <GraduationCap size={26} strokeWidth={1.5} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500">
                {search || statusFilter !== "all" ? "Sin resultados" : "Sin estudiantes"}
              </p>
              <p className="text-xs text-slate-400 -mt-1">
                {search || statusFilter !== "all" ? "Intenta con otros filtros" : "No hay estudiantes registrados en este aula"}
              </p>
              {(search || statusFilter !== "all") && (
                <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  className="text-xs font-bold text-white bg-slate-800 px-4 py-2 rounded-xl hover:bg-slate-900 transition-all shadow-sm">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              <AnimatePresence>
                {rows.map((r, i) => {
                  const todayAtt = r.todayAttendance;
                  const status = todayAtt?.status || "-";
                  const name = `${r.student.lastName} ${r.student.firstName}`;
                  const firstName = r.student.firstName || "";
                  const dni = r.student.documentNumber || "-";

                  const avatarMap = {
                    PRESENT: "bg-emerald-100 text-emerald-700 ring-emerald-200",
                    LATE: "bg-amber-100 text-amber-700 ring-amber-200",
                    ABSENT: "bg-red-100 text-red-700 ring-red-200",
                    JUSTIFIED: "bg-blue-100 text-blue-700 ring-blue-200",
                    "-": "bg-slate-100 text-slate-400 ring-slate-200",
                  };
                  const avatarStyle = avatarMap[status] || avatarMap["-"];

                  return (
                    <motion.div
                      key={r.student.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ delay: Math.min(i * 0.015, 0.25) }}
                      className="flex items-center hover:bg-slate-50/60 transition-all border-b border-slate-50/80 last:border-b-0"
                    >
                      {/* Student info column */}
                      <div className="w-60 shrink-0 px-4 py-2.5 flex items-center gap-3 border-r border-slate-100 min-w-0 sticky left-0 z-20 bg-white">
                        <span className="text-[9px] text-slate-300 font-bold w-4 text-center shrink-0 hidden md:block">{r.idx}</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ring-2 ${avatarStyle}`}>
                          {(firstName.charAt(0) || "?").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] md:text-sm font-bold text-slate-800 leading-tight">{name}</p>
                          <p className="text-[9px] md:text-[10px] text-slate-400 font-mono">{dni}</p>
                        </div>
                      </div>

                      {/* Date cells */}
                      {dateColumns.map(d => {
                        const dow = new Date(d + "T00:00:00").getDay();
                        const isSunday = dow === 0;
                        const isHoliday = holidays.has(d);
                        const isBlocked = isSunday || isHoliday;

                        if (isBlocked) {
                          return (
                            <div key={d} className="w-14 shrink-0 flex items-center justify-center border-l border-red-50 py-2.5 bg-red-50/20">
                              <span className="text-[9px] text-red-300 font-extrabold" title="Feriado">F</span>
                            </div>
                          );
                        }

                        const cell = getCell(r.student.id, d);
                        const cellStatus = cell?.status || "-";
                        const cellCfg = getCellConfig(cellStatus, cell?.justificationReason);

                        return (
                          <div key={d} className="w-14 shrink-0 flex items-center justify-center border-l border-slate-50 py-2.5">
                            <button onClick={e => { e.stopPropagation(); setCellEditor({ open: true, studentId: r.student.id, ymd: d }); }}
                              className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[9px] md:text-[10px] font-extrabold transition-all duration-150 hover:scale-110 ${
                                cellStatus === "-"
                                  ? "bg-white border border-dashed border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500"
                                  : `${cellCfg.cell} shadow-sm hover:shadow-md`
                              }`}>
                              {cellCfg.short}
                            </button>
                          </div>
                        );
                      })}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {cellEditor.open && (
          <CellEditorPopover
            student={(students || []).find(s => String(s.id) === String(cellEditor.studentId)) || null}
            ymd={cellEditor.ymd}
            cell={getCell(cellEditor.studentId, cellEditor.ymd)}
            onClose={() => setCellEditor({ open: false, studentId: null, ymd: null })}
            onSave={async (patch, evidenceFile) => {
              const ensured = await ensureCellExists({ studentId: cellEditor.studentId, ymd: cellEditor.ymd });
              if (!ensured?.id) return;
              let evidenceUrl = ensured.justificationDocumentUrl || "";
              if (evidenceFile) {
                try { evidenceUrl = await uploadEvidence({ attendanceId: ensured.id, file: evidenceFile }); }
                catch (err) { console.error("Error uploading evidence:", err); await Swal.fire({ icon: "error", title: "No se pudo subir la evidencia", text: "Intenta nuevamente.", confirmButtonColor: "#2563eb" }); return; }
              }
              await saveCell({ studentId: cellEditor.studentId, ymd: cellEditor.ymd, patch: evidenceUrl ? { ...patch, justificationDocumentUrl: evidenceUrl } : patch });
            }}
            onOpenDetail={() => setDetailModal({ open: true, studentId: cellEditor.studentId, ymd: cellEditor.ymd })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailModal.open && (
          <DayDetailModal
            student={(students || []).find(s => String(s.id) === String(detailModal.studentId)) || null}
            ymd={detailModal.ymd}
            cell={getCell(detailModal.studentId, detailModal.ymd)}
            onClose={() => setDetailModal({ open: false, studentId: null, ymd: null })}
            onViewDocument={url => setDocModal({ open: true, url, title: "Documento de Justificación" })}
          />
        )}
      </AnimatePresence>

      <ViewDocumentModal
        open={docModal.open}
        onClose={() => setDocModal({ open: false, url: "", title: "" })}
        documentUrl={docModal.url}
        title={docModal.title || "Documento"}
      />

      <AnimatePresence>
        {incidenceModal.open && (
          <StudentIncidenceModal
            student={(students || []).find(s => String(s.id) === String(incidenceModal.studentId)) || null}
            attendances={(classroomAttendances || []).filter(a => String(a.studentId) === String(incidenceModal.studentId))}
            onClose={() => setIncidenceModal({ open: false, studentId: null })}
          />
        )}
      </AnimatePresence>

      <StudentsQRModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        students={students}
      />
    </div>
  );
}