import { Badge } from "@/shared/components/ui";
import { GUARDIAN_RELATIONSHIPS } from "../../models/guardianModel";
import { Pencil, Trash2, Phone, Mail, Camera } from "lucide-react";

const relationshipMap = Object.fromEntries(
     GUARDIAN_RELATIONSHIPS.map((r) => [r.value, r.label])
);

export default function GuardianTable({
     guardians,
     onEdit,
     onDelete,
     onUploadPhoto,
     readOnly = false,
}) {
     if (!guardians || guardians.length === 0) {
          return (
               <div className="text-center py-8 text-sm text-gray-400">
                    No hay apoderados registrados
               </div>
          );
     }

     return (
          <div className="overflow-x-auto">
               <table className="w-full">
                    <thead>
                         <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                   Apoderado
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                   Parentesco
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                   Documento
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                   Contacto
                              </th>
                              {!readOnly && (
                                   <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                                        Acciones
                                   </th>
                              )}
                         </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                         {guardians.map((g) => (
                              <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                                   <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                             {g.photoUrl ? (
                                                  <img src={g.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200" />
                                             ) : (
                                                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                                       <span className="text-primary-600 text-xs font-semibold">
                                                            {(g.firstName?.[0] || "?").toUpperCase()}
                                                       </span>
                                                  </div>
                                             )}
                                             <div>
                                                  <p className="font-medium text-gray-800 text-sm">
                                                       {`${g.firstName || ""} ${g.lastName || ""} ${g.motherLastName || ""}`.trim()}
                                                  </p>
                                                  {g.isEmergencyContact && (
                                                       <Badge variant="danger" size="sm" className="mt-1">
                                                            Emergencia
                                                       </Badge>
                                                  )}
                                             </div>
                                        </div>
                                   </td>
                                   <td className="px-4 py-3">
                                        <Badge variant="purple" size="sm">
                                             {relationshipMap[g.relationship] || g.relationship}
                                        </Badge>
                                   </td>
                                   <td className="px-4 py-3">
                                        <span className="text-xs text-gray-600">
                                             {g.documentType}: {g.documentNumber}
                                        </span>
                                   </td>
                                   <td className="px-4 py-3">
                                        <div className="flex flex-col gap-0.5">
                                             {g.phone && (
                                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                                       <Phone className="w-3 h-3" />
                                                       {g.phone}
                                                  </span>
                                             )}
                                             {g.email && (
                                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                                       <Mail className="w-3 h-3" />
                                                       {g.email}
                                                  </span>
                                             )}
                                        </div>
                                   </td>
                                   {!readOnly && (
                                        <td className="px-4 py-3">
                                             <div className="flex items-center gap-1">
                                                  {onUploadPhoto && (
                                                       <button
                                                            onClick={() => onUploadPhoto?.(g)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                            title="Subir foto"
                                                       >
                                                            <Camera className="w-4 h-4" />
                                                       </button>
                                                  )}
                                                  <button
                                                       onClick={() => onEdit?.(g)}
                                                       className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                                       title="Editar"
                                                  >
                                                       <Pencil className="w-4 h-4" />
                                                  </button>
                                                  <button
                                                       onClick={() => onDelete?.(g)}
                                                       className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                       title="Eliminar"
                                                  >
                                                       <Trash2 className="w-4 h-4" />
                                                  </button>
                                             </div>
                                        </td>
                                   )}
                              </tr>
                         ))}
                    </tbody>
               </table>
          </div>
     );
}
