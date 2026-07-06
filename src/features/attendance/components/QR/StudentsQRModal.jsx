import { useState } from "react";
import { X, QrCode, Search } from "lucide-react";
import StudentQRGenerator from "./StudentQRGenerator";

function Modal({ isOpen, onClose, title, children }) {
     if (!isOpen) return null;
     return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
                    <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                         <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
                              <h2 className="text-lg font-semibold flex items-center gap-2">
                                   <QrCode className="w-5 h-5 text-primary-600" />
                                   {title}
                              </h2>
                              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                   <X className="w-5 h-5" />
                              </button>
                         </div>
                         <div className="flex-1 overflow-y-auto">{children}</div>
                    </div>
               </div>
          </div>
     );
}

export default function StudentsQRModal({ open, onClose, students }) {
     const [searchTerm, setSearchTerm] = useState("");

     const filteredStudents = students.filter(student => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
          return fullName.includes(term) || 
                 student.cui?.toLowerCase().includes(term) ||
                 student.documentNumber?.toLowerCase().includes(term);
     });

     return (
          <Modal isOpen={open} onClose={onClose} title="Códigos QR de Estudiantes">
               <div className="p-6 space-y-4">
                    {/* Buscador */}
                    <div className="relative">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                         <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Buscar por nombre, CUI o DNI..."
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                         />
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                         <p className="text-xs text-blue-800">
                              Haz clic en el ícono QR para ver, imprimir o descargar el código QR de cada estudiante.
                         </p>
                    </div>

                    {/* Lista de estudiantes */}
                    {filteredStudents.length === 0 ? (
                         <div className="text-center py-12">
                              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500">No se encontraron estudiantes</p>
                         </div>
                    ) : (
                         <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <table className="w-full">
                                   <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Estudiante
                                             </th>
                                             <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                                  Código QR
                                             </th>
                                        </tr>
                                   </thead>
                                   <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStudents.map((student) => (
                                             <tr key={student.id} className="hover:bg-gray-50">
                                                  <td className="px-4 py-3">
                                                       <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                 {student.firstName} {student.lastName}
                                                            </p>
                                                            {(student.cui || student.documentNumber) && (
                                                                 <p className="text-xs text-gray-500">
                                                                      {student.cui && `CUI: ${student.cui}`}
                                                                      {student.cui && student.documentNumber && ' • '}
                                                                      {student.documentNumber && `DNI: ${student.documentNumber}`}
                                                                 </p>
                                                            )}
                                                       </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                       <StudentQRGenerator student={student} />
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    )}

                    {/* Footer con contador */}
                    <div className="text-center text-sm text-gray-500 pt-2 border-t">
                         Mostrando {filteredStudents.length} de {students.length} estudiantes
                    </div>
               </div>
          </Modal>
     );
}
