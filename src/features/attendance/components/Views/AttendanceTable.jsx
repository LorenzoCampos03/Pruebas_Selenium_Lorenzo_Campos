import { useState } from "react";
import { Trash2, FileText, Clock, Eye, MoreHorizontal } from "lucide-react";
import { ATTENDANCE_STATUS_LABELS, formatYmdToLocaleDate } from "../../models/attendanceModel";
import ViewDocumentModal from "../Modals/ViewDocumentModal";
import Swal from "sweetalert2";

function StatusBadge({ status }) {
     const colors = {
          PRESENT: "bg-green-500 text-white",
          ABSENT: "bg-red-500 text-white",
          LATE: "bg-yellow-500 text-white",
          JUSTIFIED: "bg-blue-500 text-white",
          EXCUSED: "bg-gray-500 text-white",
     };

     return (
          <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${colors[status] || "bg-gray-500 text-white"}`}>
               {ATTENDANCE_STATUS_LABELS[status] || status}
          </span>
     );
}

function ActionsMenu({ attendance, onJustify, onPickup, onDelete, onViewDocument }) {
     const [open, setOpen] = useState(false);

     const handleAction = (action) => {
          setOpen(false);
          action();
     };

     return (
          <div className="relative">
               <button
                    onClick={() => setOpen(!open)}
                    className={`p-1.5 rounded-lg transition-colors ${open ? "bg-gray-200 text-gray-800" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"}`}
                    title="Acciones"
               >
                    <MoreHorizontal className="w-4 h-4" />
               </button>

               {open && (
                    <>
                         <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
                         <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-20">
                              {attendance.justificationDocumentUrl && (
                                   <button
                                        onClick={() => handleAction(() => onViewDocument(attendance.justificationDocumentUrl))}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-gray-50 transition-colors text-green-600"
                                   >
                                        <Eye className="w-4 h-4 flex-shrink-0" />
                                        Ver Justificación
                                   </button>
                              )}
                              <button
                                   onClick={() => handleAction(() => onJustify(attendance))}
                                   className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-gray-50 transition-colors text-blue-600"
                              >
                                   <FileText className="w-4 h-4 flex-shrink-0" />
                                   Justificar
                              </button>
                              <button
                                   onClick={() => handleAction(() => onPickup(attendance))}
                                   className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-gray-50 transition-colors text-yellow-600"
                              >
                                   <Clock className="w-4 h-4 flex-shrink-0" />
                                   Registrar Recojo
                              </button>
                              <div className="border-t border-gray-100" />
                              <button
                                   onClick={() => handleAction(() => onDelete(attendance.id))}
                                   className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-gray-50 transition-colors text-red-600"
                              >
                                   <Trash2 className="w-4 h-4 flex-shrink-0" />
                                   Eliminar
                              </button>
                         </div>
                    </>
               )}
          </div>
     );
}

export default function AttendanceTable({ attendances, onDelete, onJustify, onPickup }) {
     const [selectedIds, setSelectedIds] = useState([]);
     const [deleting, setDeleting] = useState(false);
     const [viewDocument, setViewDocument] = useState(null);

     const handleSelectAll = (e) => {
          if (e.target.checked) {
               setSelectedIds(attendances.map(a => a.id));
          } else {
               setSelectedIds([]);
          }
     };

     const handleSelectOne = (id) => {
          setSelectedIds(prev => 
               prev.includes(id) 
                    ? prev.filter(i => i !== id)
                    : [...prev, id]
          );
     };

     const handleBulkDelete = async () => {
          if (selectedIds.length === 0) return;

          const result = await Swal.fire({
               title: "¿Eliminar registros?",
               text: `Se eliminarán ${selectedIds.length} registro(s) de asistencia`,
               icon: "warning",
               showCancelButton: true,
               confirmButtonText: "Sí, eliminar",
               cancelButtonText: "Cancelar",
               confirmButtonColor: "#dc2626",
               cancelButtonColor: "#6b7280",
               reverseButtons: true,
               customClass: {
                    popup: 'rounded-lg',
                    title: 'text-lg font-semibold',
                    htmlContainer: 'text-sm text-gray-600',
                    confirmButton: 'px-5 py-2.5 rounded-lg font-medium',
                    cancelButton: 'px-5 py-2.5 rounded-lg font-medium'
               }
          });

          if (!result.isConfirmed) return;

          setDeleting(true);

          try {
               await Promise.all(selectedIds.map(id => onDelete(id)));
               
               setSelectedIds([]);
               
               Swal.fire({
                    title: "¡Eliminados!",
                    text: `Se eliminaron ${selectedIds.length} registro(s) correctamente`,
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: {
                         popup: 'rounded-lg',
                         title: 'text-lg font-semibold'
                    }
               });
           } catch {
               Swal.fire({
                    title: "Error al eliminar",
                    text: "No se pudieron eliminar algunos registros",
                    icon: "error",
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#3b82f6",
                    customClass: {
                         popup: 'rounded-lg',
                         title: 'text-lg font-semibold',
                         confirmButton: 'px-5 py-2.5 rounded-lg font-medium'
                    }
               });
          } finally {
               setDeleting(false);
          }
     };

     const isAllSelected = attendances.length > 0 && selectedIds.length === attendances.length;
     const isSomeSelected = selectedIds.length > 0 && selectedIds.length < attendances.length;

     return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
               {selectedIds.length > 0 && (
                    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
                         <span className="text-sm font-medium text-blue-900">
                              {selectedIds.length} registro(s) seleccionado(s)
                         </span>
                         <button
                              onClick={handleBulkDelete}
                              disabled={deleting}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                         >
                              {deleting ? (
                                   <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Eliminando...
                                   </>
                              ) : (
                                   <>
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar seleccionados
                                   </>
                              )}
                         </button>
                    </div>
               )}
               
               <div className="overflow-x-auto">
                    <table className="w-full">
                         <thead className="bg-gray-800 text-white">
                              <tr>
                                   <th className="px-4 py-3 text-left">
                                        <input
                                             type="checkbox"
                                             checked={isAllSelected}
                                             ref={input => {
                                                  if (input) input.indeterminate = isSomeSelected;
                                             }}
                                             onChange={handleSelectAll}
                                             className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Fecha
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Estudiante
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Aula
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Estado
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Llegada
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Salida
                                   </th>
                                   <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        Recogido Por
                                   </th>
                                   <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                                        Acciones
                                   </th>
                              </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                              {attendances.map((attendance) => (
                                   <tr 
                                        key={attendance.id} 
                                        className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(attendance.id) ? 'bg-blue-50' : ''}`}
                                   >
                                        <td className="px-4 py-3">
                                             <input
                                                  type="checkbox"
                                                  checked={selectedIds.includes(attendance.id)}
                                                  onChange={() => handleSelectOne(attendance.id)}
                                                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                             />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                             {formatYmdToLocaleDate(attendance.attendanceDate, "es-PE")}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                             <div className="text-sm font-medium text-gray-900">
                                                  {attendance.studentName}
                                             </div>
                                             <div className="text-xs text-gray-500">Año {attendance.academicYear}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                             {attendance.classroomName}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                             <StatusBadge status={attendance.status} />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                             {attendance.arrivalTime || "-"}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                             {attendance.departureTime || "-"}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                             {attendance.pickedUpByName || "-"}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                             <ActionsMenu
                                                  attendance={attendance}
                                                  onJustify={onJustify}
                                                  onPickup={onPickup}
                                                  onDelete={onDelete}
                                                  onViewDocument={setViewDocument}
                                             />
                                        </td>
                                   </tr>
                              ))}
                         </tbody>
                    </table>
               </div>
               
               <ViewDocumentModal
                    open={!!viewDocument}
                    onClose={() => setViewDocument(null)}
                    documentUrl={viewDocument}
               />
          </div>
     );
}
