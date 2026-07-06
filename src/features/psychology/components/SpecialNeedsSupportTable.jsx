import React, { useState as useStateLocal, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Eye, Pencil, Trash2, RotateCcw, MoreHorizontal, Send } from "lucide-react";
import { SUPPORT_STATUS, SUPPORT_TYPES } from "../models/specialNeedsSupportModel";

const SUPPORT_TYPE_INFO = {
     COGNITIVO:   { label: "Cognitivo",   color: "bg-blue-100 text-blue-800",     desc: "Apoyo para dificultades de aprendizaje, atención o memoria." },
     MOTOR:       { label: "Motor",       color: "bg-emerald-100 text-emerald-800", desc: "Apoyo para dificultades físicas o de desplazamiento." },
     SENSORIAL:   { label: "Sensorial",   color: "bg-amber-100 text-amber-800",   desc: "Apoyo para dificultades visuales, auditivas o sensoriales." },
     EMOCIONAL:   { label: "Emocional",   color: "bg-purple-100 text-purple-800", desc: "Apoyo para dificultades de regulación emocional o ansiedad." },
     LENGUAJE:    { label: "Lenguaje",    color: "bg-indigo-100 text-indigo-800", desc: "Apoyo para dificultades en el habla o comunicación." },
     CONDUCTUAL:  { label: "Conductual",  color: "bg-rose-100 text-rose-800",     desc: "Apoyo para dificultades de conducta en el entorno escolar." },
};

function ActionsMenu({ support, onView, onEdit, onMessage, onDelete, onRestore, onHardDelete, userRole }) {
     const [open, setOpen] = useStateLocal(false);
     const [menuPos, setMenuPos] = useStateLocal(null);
     const btnRef = useRef(null);

     useEffect(() => {
          if (!open) return;
          function handleClick(e) {
               const portal = document.getElementById("__actions_portal__");
               if (
                    btnRef.current && !btnRef.current.contains(e.target) &&
                    portal && !portal.contains(e.target)
               ) {
                    setOpen(false);
                    setMenuPos(null);
               }
          }
          document.addEventListener("mousedown", handleClick);
          return () => document.removeEventListener("mousedown", handleClick);
     }, [open]);

     function handleToggle() {
          if (open) { setOpen(false); setMenuPos(null); return; }
          if (!btnRef.current) return;
          const r = btnRef.current.getBoundingClientRect();
          setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
          setOpen(true);
     }

     function close() { setOpen(false); setMenuPos(null); }

     const isActive = support.status === "ACTIVE";

     const items = [
          { icon: Eye,      label: "Ver detalles",  color: "text-blue-600",    onClick: () => { close(); onView(support); } },
          { icon: Pencil,   label: "Editar",        color: "text-yellow-600",  onClick: () => { close(); onEdit(support); } },
          { icon: Send,     label: "Enviar mensaje", color: "text-emerald-600", onClick: () => { close(); onMessage && onMessage(support); } },
          isActive
               ? { icon: Trash2,    label: "Desactivar",  color: "text-red-500",     onClick: () => { close(); onDelete(support.id); }, divider: true }
               : { icon: RotateCcw, label: "Reactivar",   color: "text-gray-600",    onClick: () => { close(); onRestore && onRestore(support.id); }, divider: true },
          ...(userRole === "ADMINISTRADOR"
               ? [{ icon: Trash2, label: "Eliminar permanente", color: "text-red-800", onClick: () => { close(); onHardDelete && onHardDelete(support.id); } }]
               : []),
     ];

     return (
          <>
               <button
                    ref={btnRef}
                    onClick={handleToggle}
                    className={`p-1.5 rounded-lg transition-colors ${open ? "bg-gray-200 text-gray-800" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"}`}
                    title="Acciones"
               >
                    <MoreHorizontal className="w-4 h-4" />
               </button>

               {open && menuPos && ReactDOM.createPortal(
                    <div
                         id="__actions_portal__"
                         style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
                         className="w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                    >
                         {items.map((item, i) => {
                              const Icon = item.icon;
                              return (
                                   <React.Fragment key={i}>
                                        {item.divider && <div className="border-t border-gray-100" />}
                                        <button
                                             onMouseDown={e => e.stopPropagation()}
                                             onClick={item.onClick}
                                             className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-gray-50 transition-colors ${item.color}`}
                                        >
                                             <Icon className="w-4 h-4 flex-shrink-0" />
                                             {item.label}
                                        </button>
                                   </React.Fragment>
                              );
                         })}
                    </div>,
                    document.body
               )}
          </>
     );
}

function Card({ children, padding = "p-6" }) {
     return (
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${padding}`}>
               {children}
          </div>
     );
}

export default function SpecialNeedsSupportTable({ supports, onView, onEdit, onMessage, onDelete, onRestore, onHardDelete, userRole }) {
     const [currentPage, setCurrentPage] = React.useState(1);
     const itemsPerPage = 7;

     if (!supports || supports.length === 0) {
          return (
               <Card padding="p-8">
                    <div className="text-center text-gray-500">
                         <p className="text-lg font-medium">No hay soportes de necesidades especiales registrados</p>
                         <p className="text-sm mt-1">Comienza registrando tu primer soporte especial</p>
                    </div>
               </Card>
          );
     }

     const totalPages = Math.ceil(supports.length / itemsPerPage);
     const startIndex = (currentPage - 1) * itemsPerPage;
     const endIndex = startIndex + itemsPerPage;
     const paginatedSupports = supports.slice(startIndex, endIndex);

     const goToPage = (page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
     };

     const renderPagination = () => {
          const maxVisiblePages = 5;
          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

          if (endPage - startPage < maxVisiblePages - 1) {
               startPage = Math.max(1, endPage - maxVisiblePages + 1);
          }

          return (
               <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                         <button
                              onClick={() => goToPage(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              Anterior
                         </button>
                         <button
                              onClick={() => goToPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              Siguiente
                         </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                         <div>
                              <p className="text-sm text-gray-700">
                                   Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                                   <span className="font-medium">{Math.min(endIndex, supports.length)}</span> de{' '}
                                   <span className="font-medium">{supports.length}</span> registros
                              </p>
                         </div>
                         <div>
                              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                   <button
                                        onClick={() => goToPage(1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                        </svg>
                                   </button>
                                   <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                   </button>
                                   {startPage > 1 && (
                                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                             ...
                                        </span>
                                   )}
                                   {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                                        <button
                                             key={page}
                                             onClick={() => goToPage(page)}
                                             className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                  page === currentPage
                                                       ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                                       : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                             }`}
                                        >
                                             {page}
                                        </button>
                                   ))}
                                   {endPage < totalPages && (
                                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                             ...
                                        </span>
                                   )}
                                   <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                   </button>
                                   <button
                                        onClick={() => goToPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm-6 0a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                   </button>
                              </nav>
                         </div>
                    </div>
               </div>
          );
     };

     return (
          <Card padding="p-0">
               <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                         <thead className="bg-gray-800 text-white text-xs uppercase font-semibold">
                              <tr>
                                   <th className="px-4 py-3 text-left">Estudiante</th>
                                   <th className="px-4 py-3 text-left">Institución</th>
                                   <th className="px-4 py-3 text-left">Aula</th>
                                   <th className="px-4 py-3 text-left">Tipo Soporte</th>
                                   <th className="px-4 py-3 text-left">Diagnóstico</th>
                                   <th className="px-4 py-3 text-left">Fecha Diagnóstico</th>
                                   <th className="px-4 py-3 text-left">Especialista</th>
                                   <th className="px-4 py-3 text-left">Próxima Revisión</th>
                                   <th className="px-4 py-3 text-left">Estado</th>
                                   <th className="px-4 py-3 text-center">Acciones</th>
                              </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-200 bg-white">
                              {paginatedSupports.map((support) => {
                                   const info = SUPPORT_TYPE_INFO[support.supportType] || { label: support.supportType, color: "bg-gray-100 text-gray-800", desc: "" };
                                   return (
                                        <tr key={support.id} className="hover:bg-gray-50 transition-colors">
                                             <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                                                  {support.studentName}
                                                  <div className="text-xs text-gray-400">Año {support.academicYear}</div>
                                             </td>
                                             <td className="px-4 py-3 whitespace-nowrap text-gray-500 truncate max-w-[150px]" title={support.institutionName}>
                                                  {support.institutionName}
                                             </td>
                                             <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                                                  {support.classroomName}
                                             </td>
                                             <td className="px-4 py-3 whitespace-nowrap">
                                                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${info.color}`} title={info.desc}>
                                                       {info.label}
                                                  </span>
                                             </td>
                                             <td className="px-4 py-3 max-w-[200px] truncate text-gray-600" title={support.diagnosis}>
                                                  {support.diagnosis || "Sin diagnóstico"}
                                             </td>
                                             <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                                  {support.diagnosisDate ? new Date(support.diagnosisDate).toLocaleDateString('es-PE') : "N/A"}
                                             </td>
                                             <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                                  {support.specialistInvolved || "No especificado"}
                                             </td>
                                             <td className="px-4 py-3 whitespace-nowrap">
                                                  {support.nextReviewDate ? (
                                                       <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                            {new Date(support.nextReviewDate).toLocaleDateString('es-PE')}
                                                       </span>
                                                  ) : (
                                                       <span className="text-gray-400">Sin revisar</span>
                                                  )}
                                             </td>
                                             <td className="px-4 py-3 whitespace-nowrap">
                                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                       support.status === "ACTIVE" 
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                                            : "bg-red-50 text-red-700 border border-red-200"
                                                  }`}>
                                                       <span className={`w-1.5 h-1.5 rounded-full ${support.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`} />
                                                       {support.status === "ACTIVE" ? "Activo" : "Inactivo"}
                                                  </span>
                                             </td>
                                             <td className="px-4 py-3 whitespace-nowrap text-center">
                                                  <ActionsMenu
                                                       support={support}
                                                       onView={onView}
                                                       onEdit={onEdit}
                                                       onMessage={onMessage}
                                                       onDelete={onDelete}
                                                       onRestore={onRestore}
                                                       onHardDelete={onHardDelete}
                                                       userRole={userRole}
                                                  />
                                             </td>
                                        </tr>
                                   );
                              })}
                         </tbody>
                    </table>
               </div>
               {renderPagination()}
          </Card>
     );
}
