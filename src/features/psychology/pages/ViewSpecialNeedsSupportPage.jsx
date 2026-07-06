import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Pencil } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useSpecialNeedsSupport } from "../hooks/useSpecialNeedsSupport";
import SpecialNeedsSupportForm from "../components/SpecialNeedsSupportForm";
import Swal from "sweetalert2";

export default function ViewSpecialNeedsSupportPage() {
     const { user } = useAuth();
     const { id } = useParams();
     const navigate = useNavigate();
     const { 
          students, 
          classrooms, 
          institutions, 
          fetchById,
          fetchAll 
     } = useSpecialNeedsSupport(user);

     const [formData, setFormData] = useState(null);
     const [loadingData, setLoadingData] = useState(true);

     useEffect(() => {
          async function load() {
               await fetchAll();
               const record = await fetchById(id);
               if (record) {
                    setFormData(record);
               } else {
                    Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar el registro de soporte" });
                    navigate("/psicologo/atenciones");
               }
               setLoadingData(false);
          }
          load();
     }, [id, fetchById, fetchAll, navigate]);

     if (loadingData) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-gray-50/50 p-6">
               <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                              <button
                                   onClick={() => navigate("/psicologo/atenciones")}
                                   className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                   <ArrowLeft className="w-5 h-5" />
                              </button>
                              <div>
                                   <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Heart className="w-5 h-5 text-blue-600" />
                                        Detalles del Soporte Especial
                                   </h1>
                                   <p className="text-xs text-gray-500">Plan de soporte psicopedagógico de {formData?.studentName}</p>
                              </div>
                         </div>
                         <button
                              type="button"
                              onClick={() => navigate(`/psicologo/atenciones/edit/${id}`)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
                         >
                              <Pencil className="w-4 h-4" />
                              Editar Soporte
                         </button>
                    </div>

                    <div className="space-y-6">
                         <SpecialNeedsSupportForm
                              support={formData}
                              students={students}
                              classrooms={classrooms}
                              institutions={institutions}
                              readOnly={true}
                         />
                         
                         {/* Action Buttons */}
                         <div className="flex items-center justify-end gap-3 pt-4 border-t">
                              <button
                                   type="button"
                                   onClick={() => navigate("/psicologo/atenciones")}
                                   className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-all"
                              >
                                   Volver
                              </button>
                         </div>
                    </div>
               </div>
          </div>
     );
}
