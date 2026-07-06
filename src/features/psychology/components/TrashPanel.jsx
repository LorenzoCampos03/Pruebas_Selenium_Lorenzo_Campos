import { useState } from "react";
import { Trash2, RotateCcw, AlertTriangle, Search } from "lucide-react";

function fmtDate(d) {
     if (!d) return "—";
     try {
          const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
          return dt.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
     } catch { return d; }
}

const TYPE_COLORS = {
     INICIAL:     "bg-blue-100 text-blue-700",
     SEGUIMIENTO: "bg-violet-100 text-violet-700",
     ESPECIAL:    "bg-amber-100 text-amber-700",
     DERIVACION:  "bg-rose-100 text-rose-700",
};

export default function TrashPanel({ evaluations, onRestore, onHardDelete, userRole }) {
     const [search, setSearch] = useState("");

     const inactive = evaluations
          .filter(e => e.status === "INACTIVE")
          .filter(e => !search || (e.studentName || "").toLowerCase().includes(search.toLowerCase()));

     return (
          <div className="space-y-4">
               {/* Header */}
               <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <Trash2 className="w-4 h-4 text-gray-400" />
                         <h3 className="text-sm font-semibold text-gray-700">Papelera</h3>
                         <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              {inactive.length}
                         </span>
                    </div>
                    <div className="relative">
                         <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                         <input
                              type="text"
                              value={search}
                              onChange={e => setSearch(e.target.value)}
                              placeholder="Buscar..."
                              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                         />
                    </div>
               </div>

               {inactive.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                         <Trash2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                         <p className="text-sm font-medium text-gray-500">La papelera está vacía</p>
                         <p className="text-xs text-gray-400 mt-1">Las evaluaciones desactivadas aparecerán aquí</p>
                    </div>
               ) : (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                         <table className="w-full">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                   <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estudiante</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Evaluador</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Institución</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                   </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                   {inactive.map(ev => (
                                        <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                                             <td className="px-4 py-3">
                                                  <p className="text-sm font-medium text-gray-800">{ev.studentName}</p>
                                                  <p className="text-xs text-gray-400">Sesión #{ev.sessionNumber}</p>
                                             </td>
                                             <td className="px-4 py-3">
                                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[ev.evaluationType] || "bg-gray-100 text-gray-600"}`}>
                                                       {ev.evaluationType}
                                                  </span>
                                             </td>
                                             <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(ev.evaluationDate)}</td>
                                             <td className="px-4 py-3 text-sm text-gray-600">{ev.evaluatorName}</td>
                                             <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate">{ev.institutionName}</td>
                                             <td className="px-4 py-3">
                                                  <div className="flex items-center justify-end gap-2">
                                                       <button
                                                            onClick={() => onRestore(ev.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                                       >
                                                            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                                                       </button>
                                                       {userRole === "ADMINISTRADOR" && (
                                                            <button
                                                                 onClick={() => onHardDelete(ev.id)}
                                                                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                                                            >
                                                                 <AlertTriangle className="w-3.5 h-3.5" /> Eliminar
                                                            </button>
                                                       )}
                                                  </div>
                                             </td>
                                        </tr>
                                   ))}
                              </tbody>
                         </table>
                    </div>
               )}
          </div>
     );
}
