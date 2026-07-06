import { Clock, AlertTriangle, CheckCircle2, User, Calendar } from "lucide-react";

const FREQ_DAYS = {
     SEMANAL:    7,
     QUINCENAL:  15,
     MENSUAL:    30,
     BIMESTRAL:  60,
};

function getDaysSince(dateStr) {
     if (!dateStr) return null;
     try {
          const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
          return Math.floor((Date.now() - d.getTime()) / 86400000);
     } catch { return null; }
}

function getUrgency(ev) {
     const freq = FREQ_DAYS[ev.followUpFrequency];
     if (!freq) return "pending";
     const days = getDaysSince(ev.evaluationDate);
     if (days === null) return "pending";
     if (days > freq * 1.5) return "overdue";
     if (days > freq * 0.8) return "due";
     return "ok";
}

const URGENCY_CONFIG = {
     overdue: { label: "Vencido",   bg: "bg-red-50",    border: "border-red-200",   badge: "bg-red-100 text-red-700",    icon: AlertTriangle, iconColor: "text-red-500"    },
     due:     { label: "Próximo",   bg: "bg-amber-50",  border: "border-amber-200", badge: "bg-amber-100 text-amber-700", icon: Clock,         iconColor: "text-amber-500"  },
     ok:      { label: "Al día",    bg: "bg-emerald-50",border: "border-emerald-200",badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, iconColor: "text-emerald-500" },
     pending: { label: "Pendiente", bg: "bg-gray-50",   border: "border-gray-200",  badge: "bg-gray-100 text-gray-600",  icon: Clock,         iconColor: "text-gray-400"   },
};

function fmtDate(d) {
     if (!d) return "—";
     try {
          const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
          return dt.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
     } catch { return d; }
}

export default function FollowUpPanel({ evaluations }) {
     // Solo activas con seguimiento requerido
     const pending = evaluations
          .filter(ev => ev.status === "ACTIVE" && ev.requiresFollowUp)
          .map(ev => ({ ...ev, urgency: getUrgency(ev) }))
          .sort((a, b) => {
               const order = { overdue: 0, due: 1, pending: 2, ok: 3 };
               return (order[a.urgency] ?? 4) - (order[b.urgency] ?? 4);
          });

     const overdue = pending.filter(e => e.urgency === "overdue").length;
     const due     = pending.filter(e => e.urgency === "due").length;

     if (pending.length === 0) {
          return (
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Sin seguimientos pendientes</p>
                    <p className="text-xs text-gray-400 mt-1">Todos los estudiantes están al día</p>
               </div>
          );
     }

     return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               {/* Header */}
               <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <Clock className="w-4 h-4 text-amber-500" />
                         <h3 className="text-sm font-bold text-gray-900">Seguimientos Pendientes</h3>
                         <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{pending.length}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                         {overdue > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">{overdue} vencido{overdue !== 1 ? "s" : ""}</span>}
                         {due > 0    && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">{due} próximo{due !== 1 ? "s" : ""}</span>}
                    </div>
               </div>

               {/* List */}
               <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                    {pending.map(ev => {
                         const cfg = URGENCY_CONFIG[ev.urgency];
                         const Icon = cfg.icon;
                         const days = getDaysSince(ev.evaluationDate);
                         return (
                              <div key={ev.id} className={`flex items-center gap-3 px-5 py-3 ${cfg.bg}`}>
                                   <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.iconColor}`} />
                                   <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <User className="w-3 h-3 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{ev.studentName}</span>
                                   </div>
                                   <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                                        <Calendar className="w-3 h-3" />
                                        {fmtDate(ev.evaluationDate)}
                                   </div>
                                   <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                                        {ev.followUpFrequency && (
                                             <span className="text-xs text-gray-500">{ev.followUpFrequency}</span>
                                        )}
                                        {days !== null && (
                                             <span className="text-xs text-gray-400">hace {days}d</span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>{cfg.label}</span>
                                   </div>
                              </div>
                         );
                    })}
               </div>
          </div>
     );
}
