import { X, Brain, Calendar, User, AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import { calcRiskLevel, RiskBadge } from "./Badges";

const TYPE_COLORS = {
     INICIAL:      { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-300"   },
     SEGUIMIENTO:  { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
     ESPECIAL:     { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-300"  },
     DERIVACION:   { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-300"    },
};

const AREA_LABELS = {
     emotionalDevelopment: "Emocional",
     socialDevelopment:    "Social",
     cognitiveDevelopment: "Cognitivo",
     motorDevelopment:     "Motor",
};

function fmtDate(d) {
     if (!d) return "—";
     try {
          const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
          return dt.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
     } catch { return d; }
}

function AreaBlock({ label, content }) {
     if (!content) return null;
     return (
          <div className="bg-gray-50 rounded-lg p-3">
               <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
               <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
          </div>
     );
}

export default function StudentTimelineModal({ isOpen, onClose, studentName, evaluations }) {
     if (!isOpen) return null;

     const sorted = [...(evaluations || [])].sort((a, b) =>
          new Date(a.evaluationDate || a.createdAt || 0) - new Date(b.evaluationDate || b.createdAt || 0)
     );
     const risk = calcRiskLevel(evaluations);

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
               <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
               <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-700 to-blue-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
                         <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                   <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                   <h2 className="text-white font-bold text-base leading-none">{studentName}</h2>
                                   <p className="text-blue-200 text-xs mt-0.5">{sorted.length} sesión{sorted.length !== 1 ? "es" : ""} registrada{sorted.length !== 1 ? "s" : ""}</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-3">
                              <RiskBadge level={risk} />
                              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                                   <X className="w-5 h-5" />
                              </button>
                         </div>
                    </div>

                    {/* Timeline */}
                    <div className="overflow-y-auto flex-1 p-6">
                         <div className="relative">
                              {/* vertical line */}
                              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

                              <div className="space-y-6">
                                   {sorted.map((ev, idx) => {
                                        const tc = TYPE_COLORS[ev.evaluationType] || TYPE_COLORS.INICIAL;
                                        const isActive = ev.status === "ACTIVE";
                                        return (
                                             <div key={ev.id} className="relative flex gap-4">
                                                  {/* dot */}
                                                  <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${tc.bg} ${tc.border}`}>
                                                       <span className={`text-xs font-bold ${tc.text}`}>#{idx + 1}</span>
                                                  </div>

                                                  {/* card */}
                                                  <div className={`flex-1 bg-white border rounded-xl p-4 shadow-sm ${isActive ? "border-gray-200" : "border-gray-100 opacity-70"}`}>
                                                       <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                 <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tc.bg} ${tc.text}`}>
                                                                      {ev.evaluationType}
                                                                 </span>
                                                                 {ev.requiresFollowUp && (
                                                                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                                                           <Clock className="w-3 h-3" /> Seguimiento
                                                                      </span>
                                                                 )}
                                                                 {isActive
                                                                      ? <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"><CheckCircle2 className="w-3 h-3" /> Activa</span>
                                                                      : <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold"><AlertCircle className="w-3 h-3" /> Inactiva</span>
                                                                 }
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                                                                 <Calendar className="w-3 h-3" />
                                                                 {fmtDate(ev.evaluationDate)}
                                                            </div>
                                                       </div>

                                                       {ev.evaluationReason && (
                                                            <p className="text-sm text-gray-600 mb-3 italic">"{ev.evaluationReason}"</p>
                                                       )}

                                                       <div className="grid grid-cols-2 gap-2 mb-3">
                                                            {Object.entries(AREA_LABELS).map(([key, label]) =>
                                                                 ev[key] ? <AreaBlock key={key} label={label} content={ev[key]} /> : null
                                                            )}
                                                       </div>

                                                       {ev.observations && (
                                                            <div className="border-t border-gray-100 pt-3 mt-2">
                                                                 <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                                                      <FileText className="w-3 h-3" /> Observaciones
                                                                 </p>
                                                                 <p className="text-sm text-gray-600">{ev.observations}</p>
                                                            </div>
                                                       )}
                                                       {ev.recommendations && (
                                                            <div className="border-t border-gray-100 pt-3 mt-2">
                                                                 <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                                                      <Brain className="w-3 h-3" /> Recomendaciones
                                                                 </p>
                                                                 <p className="text-sm text-gray-600">{ev.recommendations}</p>
                                                            </div>
                                                       )}

                                                       <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                                            <span>Evaluador: {ev.evaluatorName}</span>
                                                            {ev.followUpFrequency && (
                                                                 <span className="text-amber-600 font-medium">Frecuencia: {ev.followUpFrequency}</span>
                                                            )}
                                                       </div>
                                                  </div>
                                             </div>
                                        );
                                   })}
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
}
