import { useEffect } from "react";
import { Brain, Clock, AlertTriangle, Users, ArrowUpRight, Heart, CalendarClock, ShieldAlert, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/auth/AuthContext";
import { usePsychology } from "../../psychology/hooks/usePsychology";
import { useSpecialNeedsSupport } from "../../psychology/hooks/useSpecialNeedsSupport";
import PsychologyCharts from "../../psychology/components/PsychologyCharts";
import FollowUpPanel from "../../psychology/components/FollowUpPanel";
import { calcRiskLevel } from "../../psychology/components/Badges";

const MONTHS_ES    = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const SUPPORT_TYPE_LABEL = {
     COGNITIVO:   "Cognitivo",
     MOTOR:       "Motor",
     SENSORIAL:   "Sensorial",
     EMOCIONAL:   "Emocional",
     LENGUAJE:    "Lenguaje",
     CONDUCTUAL:  "Conductual",
};

const SUPPORT_TYPE_DOT = {
     COGNITIVO:   "bg-blue-500",
     MOTOR:       "bg-orange-500",
     SENSORIAL:   "bg-purple-500",
     EMOCIONAL:   "bg-rose-500",
     LENGUAJE:    "bg-teal-500",
     CONDUCTUAL:  "bg-amber-500",
};

function getMonthCount(evaluations, offset = 0) {
     const d = new Date();
     const t = new Date(d.getFullYear(), d.getMonth() + offset, 1);
     return evaluations.filter(e => {
          if (!e.evaluationDate) return false;
          const ed = new Date(e.evaluationDate);
          return ed.getFullYear() === t.getFullYear() && ed.getMonth() === t.getMonth();
     }).length;
}

function fmtDate(d) {
     if (!d) return "—";
     try {
          const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
          return `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`;
     } catch { return d; }
}

const TYPE_LABEL = { INICIAL: "Inicial", SEGUIMIENTO: "Seguimiento", ESPECIAL: "Especial", DERIVACION: "Derivación" };
const TYPE_DOT   = { INICIAL: "bg-blue-500", SEGUIMIENTO: "bg-violet-500", ESPECIAL: "bg-amber-500", DERIVACION: "bg-rose-500" };

export default function PsicologoDashboard() {
     const { user } = useAuth();
     const navigate = useNavigate();
     const { evaluations, fetchAll, loading }                      = usePsychology(user);
     const { supports, fetchAll: fetchSupports, loading: loadingSup } = useSpecialNeedsSupport(user);

     useEffect(() => { fetchAll(); }, [fetchAll]);
     useEffect(() => { fetchSupports(); }, [fetchSupports]);

     const now            = new Date();
     const active         = evaluations.filter(e => e.status === "ACTIVE");
     const followUp       = evaluations.filter(e => e.requiresFollowUp && e.status === "ACTIVE");
     const uniqueStudents = new Set(evaluations.map(e => e.studentId)).size;

     const studentMap = {};
     evaluations.forEach(ev => {
          if (!studentMap[ev.studentId]) studentMap[ev.studentId] = [];
          studentMap[ev.studentId].push(ev);
     });
     const highRisk  = Object.values(studentMap).filter(evs => calcRiskLevel(evs) === "high").length;
     const thisMonth = getMonthCount(active, 0);
     const lastMonth = getMonthCount(active, -1);
     const diff      = thisMonth - lastMonth;

     const recent = [...active]
          .sort((a, b) => new Date(b.evaluationDate || 0) - new Date(a.evaluationDate || 0))
          .slice(0, 6);

     // ── SpecialNeedsSupport stats ──────────────────────────────────────────────
     const activeSupports  = supports.filter(s => s.status === "ACTIVE");
     const next30          = new Date(); next30.setDate(now.getDate() + 30);
     const upcomingReviews = activeSupports.filter(s => {
          if (!s.nextReviewDate) return false;
          const d = new Date(s.nextReviewDate);
          return d >= now && d <= next30;
     });
     const overdueReviews  = activeSupports.filter(s => {
          if (!s.nextReviewDate) return false;
          return new Date(s.nextReviewDate) < now;
     });
     const recentSupports  = [...activeSupports]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5);

     return (
          <div className="space-y-5">

               {/* Header */}
               <div className="border-b border-gray-200 pb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">
                         {MONTHS_ES[now.getMonth()]} {now.getFullYear()}
                    </p>
                    <h1 className="text-2xl font-semibold text-gray-900">Panel de Psicología</h1>
               </div>

               {/* ── Sección: Evaluaciones ──────────────────────────────────────────────── */}
               <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Evaluaciones Psicológicas</p>
               </div>

               {/* KPIs Evaluaciones */}
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                         { label: "Evaluaciones activas", value: active.length,   icon: Brain,         accent: "border-l-blue-500"  },
                         { label: "Estudiantes",          value: uniqueStudents,  icon: Users,         accent: "border-l-gray-400"  },
                         { label: "Con seguimiento",      value: followUp.length, icon: Clock,         accent: "border-l-amber-400" },
                         { label: "Riesgo alto",          value: highRisk,        icon: AlertTriangle, accent: "border-l-rose-500"  },
                    ].map(s => {
                         const Icon = s.icon;
                         return (
                              <div key={s.label} className={`bg-white border border-gray-200 border-l-4 ${s.accent} rounded-lg px-4 py-4`}>
                                   <div className="flex items-start justify-between">
                                        <div>
                                             <p className="text-3xl font-bold text-gray-900 leading-none">
                                                  {loading ? <span className="text-gray-300">—</span> : s.value}
                                             </p>
                                             <p className="text-xs text-gray-500 mt-1.5">{s.label}</p>
                                        </div>
                                        <Icon className="w-4 h-4 text-gray-300 mt-1" />
                                   </div>
                              </div>
                         );
                    })}
               </div>

               {/* Tendencia evaluaciones */}
               {!loading && (
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                         <span>Este mes:</span>
                         <span className="font-semibold text-gray-800">{thisMonth} evaluaciones</span>
                         {diff !== 0 && (
                              <span className={`font-medium ${diff > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                                   {diff > 0 ? "↑" : "↓"} {Math.abs(diff)} respecto al mes anterior
                              </span>
                         )}
                    </div>
               )}

               {/* Fila principal: gráficos + recientes */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    <div className="lg:col-span-2 space-y-4">
                         <PsychologyCharts evaluations={evaluations} />
                         <FollowUpPanel evaluations={evaluations} />
                    </div>

                    {/* Recientes evaluaciones */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                         <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                              <p className="text-sm font-semibold text-gray-700">Últimas evaluaciones</p>
                              <button
                                   onClick={() => navigate("/psicologo/evaluaciones")}
                                   className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium"
                              >
                                   Ver todas <ArrowUpRight className="w-3 h-3" />
                              </button>
                         </div>
                         <div className="divide-y divide-gray-50">
                              {loading ? (
                                   Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="px-4 py-3 flex items-center gap-3">
                                             <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                                             <div className="flex-1 space-y-1.5">
                                                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                                                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/3" />
                                             </div>
                                        </div>
                                   ))
                              ) : recent.length === 0 ? (
                                   <p className="text-sm text-gray-400 text-center py-8">Sin evaluaciones</p>
                              ) : (
                                   recent.map(ev => (
                                        <div key={ev.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                             <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-600">
                                                  {(ev.studentName || "?")[0].toUpperCase()}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                  <p className="text-sm text-gray-800 font-medium truncate">{ev.studentName}</p>
                                                  <p className="text-xs text-gray-400">{fmtDate(ev.evaluationDate)}</p>
                                             </div>
                                             <div className="flex items-center gap-1.5 flex-shrink-0">
                                                  <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[ev.evaluationType] || "bg-gray-300"}`} />
                                                  <span className="text-xs text-gray-500">{TYPE_LABEL[ev.evaluationType] || ev.evaluationType}</span>
                                             </div>
                                        </div>
                                   ))
                              )}
                         </div>
                    </div>
               </div>

               {/* ── Separador ─────────────────────────────────────────────────────────── */}
               <div className="border-t border-gray-200 pt-2" />

               {/* ── Sección: Soporte de Necesidades Especiales ────────────────────────── */}
               <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <Heart className="w-4 h-4 text-emerald-500" />
                         <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Soporte de Necesidades Especiales</p>
                    </div>
                    <button
                         onClick={() => navigate("/psicologo/atenciones")}
                         className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 font-medium"
                    >
                         Ver todos <ArrowUpRight className="w-3 h-3" />
                    </button>
               </div>

               {/* KPIs SpecialNeedsSupport */}
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                         { label: "Casos activos",         value: activeSupports.length,   icon: Heart,         accent: "border-l-emerald-500" },
                         { label: "Estudiantes atendidos", value: new Set(activeSupports.map(s => s.studentId)).size, icon: Users, accent: "border-l-gray-400" },
                         { label: "Revisiones próximas",   value: upcomingReviews.length,  icon: CalendarClock, accent: "border-l-blue-400"    },
                         { label: "Revisiones vencidas",   value: overdueReviews.length,   icon: ShieldAlert,   accent: "border-l-rose-500"    },
                    ].map(s => {
                         const Icon = s.icon;
                         return (
                              <div key={s.label} className={`bg-white border border-gray-200 border-l-4 ${s.accent} rounded-lg px-4 py-4`}>
                                   <div className="flex items-start justify-between">
                                        <div>
                                             <p className="text-3xl font-bold text-gray-900 leading-none">
                                                  {loadingSup ? <span className="text-gray-300">—</span> : s.value}
                                             </p>
                                             <p className="text-xs text-gray-500 mt-1.5">{s.label}</p>
                                        </div>
                                        <Icon className="w-4 h-4 text-gray-300 mt-1" />
                                   </div>
                              </div>
                         );
                    })}
               </div>

               {/* Fila: Casos recientes + Revisiones próximas */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

                    {/* Casos recientes activos */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
                         <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                   <Activity className="w-4 h-4 text-emerald-500" />
                                   <p className="text-sm font-semibold text-gray-700">Casos recientes</p>
                              </div>
                         </div>
                         <div className="divide-y divide-gray-50">
                              {loadingSup ? (
                                   Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="px-4 py-3 flex items-center gap-3">
                                             <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                                             <div className="flex-1 space-y-1.5">
                                                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                                                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                                             </div>
                                        </div>
                                   ))
                              ) : recentSupports.length === 0 ? (
                                   <p className="text-sm text-gray-400 text-center py-8">Sin casos registrados</p>
                              ) : (
                                   recentSupports.map(sup => (
                                        <div
                                             key={sup.id}
                                             className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                             onClick={() => navigate(`/psicologo/atenciones/view/${sup.id}`)}
                                        >
                                             <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-emerald-600">
                                                  {(sup.studentName || "?")[0].toUpperCase()}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                  <p className="text-sm text-gray-800 font-medium truncate">{sup.studentName}</p>
                                                  <p className="text-xs text-gray-400 truncate">{sup.diagnosis || "Sin diagnóstico"}</p>
                                             </div>
                                             <div className="flex items-center gap-1.5 flex-shrink-0">
                                                  <span className={`w-1.5 h-1.5 rounded-full ${SUPPORT_TYPE_DOT[sup.supportType] || "bg-gray-300"}`} />
                                                  <span className="text-xs text-gray-500">{SUPPORT_TYPE_LABEL[sup.supportType] || sup.supportType}</span>
                                             </div>
                                        </div>
                                   ))
                              )}
                         </div>
                    </div>

                    {/* Revisiones próximas (30 días) */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                         <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                              <CalendarClock className="w-4 h-4 text-blue-400" />
                              <p className="text-sm font-semibold text-gray-700">Revisiones próximas</p>
                              <span className="ml-auto text-xs text-gray-400">30 días</span>
                         </div>
                         <div className="divide-y divide-gray-50">
                              {loadingSup ? (
                                   Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="px-4 py-3 space-y-1.5">
                                             <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                                             <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/3" />
                                        </div>
                                   ))
                              ) : upcomingReviews.length === 0 ? (
                                   <p className="text-sm text-gray-400 text-center py-8">Sin revisiones pendientes</p>
                              ) : (
                                   upcomingReviews
                                        .sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate))
                                        .map(sup => {
                                             const days = Math.ceil((new Date(sup.nextReviewDate) - now) / (1000 * 60 * 60 * 24));
                                             const urgent = days <= 7;
                                             return (
                                                  <div
                                                       key={sup.id}
                                                       className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                                       onClick={() => navigate(`/psicologo/atenciones/view/${sup.id}`)}
                                                  >
                                                       <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${urgent ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                                                            {(sup.studentName || "?")[0].toUpperCase()}
                                                       </div>
                                                       <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-800 font-medium truncate">{sup.studentName}</p>
                                                            <p className="text-xs text-gray-400">{fmtDate(sup.nextReviewDate)}</p>
                                                       </div>
                                                       <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${urgent ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                                                            {days === 0 ? "Hoy" : `${days}d`}
                                                       </span>
                                                  </div>
                                             );
                                        })
                              )}
                         </div>
                    </div>

               </div>

          </div>
     );
}

