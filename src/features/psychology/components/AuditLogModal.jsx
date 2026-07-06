import { X, Eye, Clock, User } from "lucide-react";
import { getLogByEvaluation } from "../utils/auditLog";

function fmtDateTime(iso) {
     if (!iso) return "—";
     try {
          const d = new Date(iso);
          return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) +
               " " + d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
     } catch { return iso; }
}

export default function AuditLogModal({ isOpen, onClose, evaluationId, studentName }) {
     if (!isOpen) return null;
     const log = getLogByEvaluation(evaluationId);

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
               <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
               <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                         <div>
                              <h2 className="text-sm font-semibold text-gray-900">Auditoría de accesos</h2>
                              <p className="text-xs text-gray-400 mt-0.5">{studentName}</p>
                         </div>
                         <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                              <X className="w-4 h-4" />
                         </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                         {log.length === 0 ? (
                              <div className="py-12 text-center">
                                   <Eye className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                   <p className="text-sm text-gray-400">Sin registros de acceso</p>
                                   <p className="text-xs text-gray-300 mt-1">Los accesos se registran al abrir la evaluación</p>
                              </div>
                         ) : (
                              <div className="divide-y divide-gray-50">
                                   {log.map((entry, i) => (
                                        <div key={i} className="flex items-start gap-3 px-5 py-3">
                                             <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2">
                                                       <User className="w-3 h-3 text-gray-400" />
                                                       <span className="text-sm font-medium text-gray-800">{entry.viewerName}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 mt-0.5">
                                                       <Clock className="w-3 h-3 text-gray-300" />
                                                       <span className="text-xs text-gray-400">{fmtDateTime(entry.timestamp)}</span>
                                                  </div>
                                             </div>
                                             <span className="text-xs text-gray-300 flex-shrink-0">#{log.length - i}</span>
                                        </div>
                                   ))}
                              </div>
                         )}
                    </div>

                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                         <p className="text-xs text-gray-400">
                              {log.length} acceso{log.length !== 1 ? "s" : ""} registrado{log.length !== 1 ? "s" : ""} · Solo en este dispositivo
                         </p>
                    </div>
               </div>
          </div>
     );
}
