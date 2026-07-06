import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
     ArrowLeft, Brain, Heart, Users, Lightbulb, Zap,
     Calendar, User, Building2, School, BookOpen, Clock,
     AlertTriangle, CheckCircle2, Edit3, Activity,
     MessageSquare, TrendingUp, ChevronRight, Repeat2, Trash2, RotateCcw,
      Eye
} from "lucide-react";
import { useAuth } from "../../../core/auth/AuthContext";
import { usePsychology } from "../hooks/usePsychology";
import { formatDateToSpanish } from "../utils/dateFormatter";
import { logView } from "../utils/auditLog";
import AuditLogModal from "../components/AuditLogModal";
import { getEvaluatorName, getEvaluatorId } from "../utils/evaluatorHelper";

/* ── constants ─────────────────────────────────────────────────────────────── */

const TYPE_CFG = {
     INICIAL:     { label: "Inicial",      dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 ring-blue-200" },
     SEGUIMIENTO: { label: "Seguimiento",  dot: "bg-cyan-500",   badge: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
     ESPECIAL:    { label: "Especial",     dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700 ring-violet-200" },
     DERIVACION:  { label: "Derivación",   dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 ring-orange-200" },
};

const FREQ_LABELS = {
     SEMANAL: "Semanal", QUINCENAL: "Quincenal",
     MENSUAL: "Mensual", BIMESTRAL: "Bimestral",
};

function initials(name = "") {
     return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";
}

function capitalize(str = "") {
     if (!str) return "";
     return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().replace(/_/g, " ");
}

/* ── tiny primitives ───────────────────────────────────────────────────────── */

function Tag({ children, className = "" }) {
     return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${className}`}>
               {children}
          </span>
     );
}

function Divider() {
     return <div className="border-t border-gray-100 my-1" />;
}

/* ── layout blocks ─────────────────────────────────────────────────────────── */

function Section({ title, icon, children, action }) {
     const Icon = icon;
     return (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
               <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                    <div className="flex items-center gap-2">
                         <Icon className="w-4 h-4 text-gray-400" />
                         <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
                    </div>
                    {action}
               </div>
               {children}
          </div>
     );
}

function Field({ label, value, placeholder = "—" }) {
     return (
          <div>
               <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
               <p className="text-sm text-gray-800 font-medium leading-snug">
                    {value || <span className="text-gray-300 font-normal">{placeholder}</span>}
               </p>
          </div>
     );
}

function DevCard({ icon, label, value, colors }) {
     const Icon = icon;
     const text = value ? capitalize(value) : null;
     return (
          <div className={`rounded-lg border p-4 ${colors.bg} ${colors.border}`}>
               <div className="flex items-center gap-2 mb-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors.icon}`}>
                         <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wide ${colors.label}`}>{label}</span>
               </div>
               {text
                    ? <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                    : <p className="text-xs text-gray-400 italic">Sin información</p>
               }
          </div>
     );
}

const DEV_AREAS = [
     {
          key: "emotionalDevelopment", label: "Emocional", icon: Heart,
          colors: { bg: "bg-rose-50", border: "border-rose-100", icon: "bg-rose-100 text-rose-500", label: "text-rose-600" },
     },
     {
          key: "socialDevelopment", label: "Social", icon: Users,
          colors: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "bg-emerald-100 text-emerald-500", label: "text-emerald-600" },
     },
     {
          key: "cognitiveDevelopment", label: "Cognitivo", icon: Lightbulb,
          colors: { bg: "bg-violet-50", border: "border-violet-100", icon: "bg-violet-100 text-violet-500", label: "text-violet-600" },
     },
     {
          key: "motorDevelopment", label: "Motor", icon: Zap,
          colors: { bg: "bg-amber-50", border: "border-amber-100", icon: "bg-amber-100 text-amber-500", label: "text-amber-600" },
     },
];

/* ── main ──────────────────────────────────────────────────────────────────── */

export default function ViewEvaluationPage() {
     const { id } = useParams();
     const navigate = useNavigate();
     const { user, role } = useAuth();
     const { fetchById, deleteEvaluation, restoreEvaluation, hardDeleteEvaluation } = usePsychology(user);
     const [ev, setEv] = useState(null);
     const [loading, setLoading] = useState(true);
      const [auditOpen, setAuditOpen] = useState(false);
      const [canEdit, setCanEdit] = useState(false);
      const auditLogged = useRef(false);

     useEffect(() => { auditLogged.current = false; load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

     async function load() {
          setLoading(true);
          try {
                const data = await fetchById(id);
                if (data) {
                     setEv(data);
                     const currentUserId = getEvaluatorId(user);
                     const isOwner = String(data.evaluatedBy) === String(currentUserId);
                     const isAdmin = role === "ADMINISTRADOR";
                     setCanEdit(isOwner || isAdmin);
                     // Registrar acceso solo una vez por montaje
                     if (!auditLogged.current) {
                          auditLogged.current = true;
                          logView(id, data.studentName, getEvaluatorName(user));
                     }
                } else navigate("/psicologo/evaluaciones");
          } catch { navigate("/psicologo/evaluaciones"); }
          finally { setLoading(false); }
     }

     async function handleDelete() {
          const active = ev?.status !== "INACTIVE";
          if (active) {
               await deleteEvaluation(id);
          } else {
               await restoreEvaluation(id);
          }
          await load();
     }

     if (loading) {
          return (
               <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center animate-pulse">
                              <Brain className="w-5 h-5 text-white" />
                         </div>
                         <p className="text-sm text-gray-400">Cargando evaluación...</p>
                    </div>
               </div>
          );
     }

     if (!ev) return null;

     const typeCfg = TYPE_CFG[ev.evaluationType] || { label: ev.evaluationType, dot: "bg-gray-400", badge: "bg-gray-50 text-gray-600 ring-gray-200" };
     const isActive = ev.status !== "INACTIVE";

     return (
          <>
          <div className="min-h-screen bg-gray-50/80">

               {/* ── TOP NAV ──────────────────────────────────────────────── */}
               <div className="bg-white border-b border-gray-200 px-6 py-0">
                    <div className="max-w-screen-xl mx-auto flex items-center justify-between h-12">
                         <button
                              onClick={() => navigate("/psicologo/evaluaciones")}
                              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
                         >
                              <ArrowLeft className="w-4 h-4" />
                              Volver
                         </button>
                         <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <span className="hover:text-gray-600 cursor-pointer" onClick={() => navigate("/psicologo/evaluaciones")}>Evaluaciones</span>
                              <ChevronRight className="w-3 h-3" />
                              <span className="text-gray-700 font-medium">{ev.studentName}</span>
                         </div>
                         <div className="w-16" />
                    </div>
               </div>

               <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">

                    {/* ── IDENTITY CARD ────────────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
                              <div className="flex items-center gap-4">
                                   {/* avatar */}
                                   <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-md">
                                        <span className="text-white text-lg font-bold tracking-tight">{initials(ev.studentName)}</span>
                                   </div>
                                   <div>
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                             <h1 className="text-xl font-bold text-gray-900 leading-none">{ev.studentName}</h1>
                                             <Tag className={typeCfg.badge}>
                                                  <span className={`w-1.5 h-1.5 rounded-full ${typeCfg.dot}`} />
                                                  {typeCfg.label}
                                             </Tag>
                                             <Tag className={isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-600 ring-red-200"}>
                                                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
                                                  {isActive ? "Activa" : "Inactiva"}
                                             </Tag>
                                             {ev.sessionNumber && (
                                                  <Tag className="bg-gray-50 text-gray-600 ring-gray-200">
                                                       Sesión #{ev.sessionNumber}
                                                  </Tag>
                                             )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                             {ev.institutionName} · {ev.classroomName} · Año {ev.academicYear}
                                        </p>
                                   </div>
                              </div>
                              {/* actions */}
                               <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => setAuditOpen(true)}
                                        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 text-sm font-medium rounded-lg transition-colors"
                                        title="Ver auditoría de accesos"
                                   >
                                        <Eye className="w-3.5 h-3.5" />
                                        Auditoría
                                    </button>
                                    {canEdit && (
                                         <button
                                              onClick={() => navigate(`/psicologo/evaluaciones/edit/${id}`)}
                                              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                         >
                                              <Edit3 className="w-3.5 h-3.5" />
                                              Editar
                                         </button>
                                    )}
                                    {canEdit && (
                                         <button
                                              onClick={handleDelete}
                                              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${
                                                   isActive
                                                        ? "bg-white hover:bg-red-50 text-red-600 border-gray-200 hover:border-red-200"
                                                        : "bg-white hover:bg-emerald-50 text-emerald-600 border-gray-200 hover:border-emerald-200"
                                              }`}
                                         >
                                              {isActive ? <AlertTriangle className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                              {isActive ? "Desactivar" : "Reactivar"}
                                         </button>
                                    )}
                                    {role === "ADMINISTRADOR" && (
                                        <button
                                             onClick={async () => { await hardDeleteEvaluation(id); navigate("/psicologo/evaluaciones"); }}
                                             className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-200 hover:border-red-400 text-sm font-semibold rounded-lg transition-colors"
                                             title="Eliminar permanentemente (solo Admin)"
                                        >
                                             <Trash2 className="w-3.5 h-3.5" />
                                             Eliminar
                                        </button>
                                   )}
                              </div>
                         </div>

                         {/* meta strip */}
                         <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="flex items-center gap-2">
                                   <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                   <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Fecha</p>
                                        <p className="text-xs text-gray-700 font-semibold">{formatDateToSpanish(ev.evaluationDate) || "—"}</p>
                                   </div>
                              </div>
                              <div className="flex items-center gap-2">
                                   <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                   <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Evaluador</p>
                                        <p className="text-xs text-gray-700 font-semibold">{ev.evaluatorName || "—"}</p>
                                   </div>
                              </div>
                              <div className="flex items-center gap-2">
                                   <BookOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                   <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Motivo</p>
                                        <p className="text-xs text-gray-700 font-semibold truncate max-w-[160px]">{ev.evaluationReason || "—"}</p>
                                   </div>
                              </div>
                              <div className="flex items-center gap-2">
                                   <Repeat2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                   <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Seguimiento</p>
                                        <p className="text-xs text-gray-700 font-semibold">
                                             {ev.requiresFollowUp
                                                  ? `Sí · ${FREQ_LABELS[ev.followUpFrequency] || ev.followUpFrequency || "Sin frecuencia"}`
                                                  : "No requerido"}
                                        </p>
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* ── MAIN GRID ────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                         {/* left 2 cols */}
                         <div className="lg:col-span-2 space-y-5">

                              {/* development areas */}
                              <Section title="Áreas de Desarrollo" icon={Activity}>
                                   <div className="p-5 grid grid-cols-2 gap-3">
                                        {DEV_AREAS.map(area => (
                                             <DevCard key={area.key} icon={area.icon} label={area.label} value={ev[area.key]} colors={area.colors} />
                                        ))}
                                   </div>
                              </Section>

                              {/* observations */}
                              <Section title="Observaciones" icon={MessageSquare}>
                                   <div className="p-5">
                                        {ev.observations && ev.observations.trim()
                                             ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ev.observations}</p>
                                             : (
                                                  <div className="flex items-center gap-3 py-4 text-gray-400">
                                                       <MessageSquare className="w-5 h-5 flex-shrink-0" />
                                                       <p className="text-sm italic">Sin observaciones registradas para esta evaluación.</p>
                                                  </div>
                                             )
                                        }
                                   </div>
                              </Section>

                              {/* recommendations */}
                              <Section title="Recomendaciones" icon={TrendingUp}>
                                   <div className="p-5">
                                        {ev.recommendations && ev.recommendations.trim()
                                             ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ev.recommendations}</p>
                                             : (
                                                  <div className="flex items-center gap-3 py-4 text-gray-400">
                                                       <TrendingUp className="w-5 h-5 flex-shrink-0" />
                                                       <p className="text-sm italic">Sin recomendaciones registradas.</p>
                                                  </div>
                                             )
                                        }
                                   </div>
                              </Section>
                         </div>

                         {/* right 1 col */}
                         <div className="space-y-5">

                              {/* student details */}
                              <Section title="Estudiante" icon={User}>
                                   <div className="p-5 space-y-4">
                                        <Field label="Nombre completo" value={ev.studentName} />
                                        <Divider />
                                        <Field label="Institución" value={ev.institutionName} />
                                        <Divider />
                                        <Field label="Aula" value={ev.classroomName} />
                                        <Divider />
                                        <Field label="Año académico" value={ev.academicYear} />
                                   </div>
                              </Section>

                              {/* follow-up */}
                              <Section title="Seguimiento" icon={Clock}>
                                   <div className="p-5">
                                        {ev.requiresFollowUp ? (
                                             <div className="space-y-3">
                                                  <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                       <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                       <div>
                                                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Requiere seguimiento</p>
                                                            <p className="text-sm font-semibold text-amber-900 mt-0.5">
                                                                 {FREQ_LABELS[ev.followUpFrequency] || ev.followUpFrequency || "Frecuencia no definida"}
                                                            </p>
                                                       </div>
                                                  </div>
                                             </div>
                                        ) : (
                                             <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                  <p className="text-sm font-semibold text-emerald-800">No requiere seguimiento</p>
                                             </div>
                                        )}
                                   </div>
                              </Section>

                              {/* audit */}
                              <Section title="Registro" icon={Calendar}>
                                   <div className="p-5 space-y-4">
                                        <Field
                                             label="Creado el"
                                             value={ev.createdAt ? formatDateToSpanish(ev.createdAt) : null}
                                             placeholder="Sin fecha de creación"
                                        />
                                        {ev.evaluatorName && (
                                             <>
                                                  <Divider />
                                                  <div>
                                                       <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Registrado por</p>
                                                       <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                                 <span className="text-xs font-bold text-blue-600">
                                                                      {ev.evaluatorName.charAt(0).toUpperCase()}
                                                                 </span>
                                                            </div>
                                                            <p className="text-sm text-gray-800 font-semibold">{ev.evaluatorName}</p>
                                                       </div>
                                                  </div>
                                             </>
                                        )}
                                        <Divider />
                                        <Field
                                             label="Última actualización"
                                             value={ev.updatedAt ? formatDateToSpanish(ev.updatedAt) : null}
                                             placeholder="Sin actualizaciones"
                                        />
                                        {ev.updatedAt && ev.updatedBy && (
                                             <>
                                                  <Divider />
                                                  <div>
                                                       <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Actualizado por</p>
                                                       <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                                 <span className="text-xs font-bold text-indigo-600">
                                                                      {ev.updatedBy.charAt(0).toUpperCase()}
                                                                 </span>
                                                            </div>
                                                            <p className="text-sm text-gray-800 font-semibold">{ev.updatedBy}</p>
                                                       </div>
                                                  </div>
                                             </>
                                        )}
                                   </div>
                              </Section>

                         </div>
                    </div>
               </div>
          </div>

          <AuditLogModal
               isOpen={auditOpen}
               onClose={() => setAuditOpen(false)}
               evaluationId={id}
               studentName={ev?.studentName}
          />
          </>
     );
}
