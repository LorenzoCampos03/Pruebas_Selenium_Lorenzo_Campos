import { useState } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { competencyService } from "../services/academicService";
import { createEmptyCompetency } from "../models/academicModel";
import CompetencyForm from "./CompetencyForm";
import { Layers, Edit2, Trash2, ChevronRight, Plus } from "lucide-react";

export default function CompetencySection({ course, competencies, loading, onRefresh, onSelectCompetency }) {
     const { user } = useAuth();
     const [showForm, setShowForm] = useState(false);
     const [editingCompetency, setEditingCompetency] = useState(null);
     const [saving, setSaving] = useState(false);

     const handleAdd = () => {
          const newComp = createEmptyCompetency();
          newComp.courseId = course.id;
          newComp.institutionId = user.institutionId;
          setEditingCompetency(newComp);
          setShowForm(true);
     };

     const handleEdit = (competency) => {
          setEditingCompetency(competency);
          setShowForm(true);
     };

     const handleSave = async (formData) => {
          try {
               setSaving(true);
               if (formData.id && formData.id.trim() !== "") {
                    await competencyService.update(formData.id, formData);
               } else {
                    await competencyService.create(formData);
               }
               setShowForm(false);
               setEditingCompetency(null);
               onRefresh();
          } catch (error) {
               console.error("Error al guardar competencia:", error);
               alert("Error al guardar la competencia");
          } finally {
               setSaving(false);
          }
     };

     const handleDelete = async (id) => {
          if (!confirm("¿Estás seguro de eliminar esta competencia?")) return;
          
          try {
               await competencyService.delete(id);
               onRefresh();
          } catch (error) {
               console.error("Error al eliminar competencia:", error);
               alert("Error al eliminar la competencia");
          }
     };

     if (loading) {
          return (
               <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                         <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3"></div>
                         <p className="text-sm text-gray-500">Cargando competencias...</p>
                    </div>
               </div>
          );
     }

     return (
          <div className="space-y-5">
               {/* Header con título y botón */}
               <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                              <Layers className="w-5 h-5 text-violet-600" />
                         </div>
                         <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                   Competencias del Curso
                              </h3>
                              <p className="text-xs text-gray-500">
                                   {competencies.length} {competencies.length === 1 ? 'competencia registrada' : 'competencias registradas'}
                              </p>
                         </div>
                    </div>
                    <button
                         onClick={handleAdd}
                         className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 active:scale-95 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                    >
                         <Plus className="w-4 h-4" />
                         Agregar Competencia
                    </button>
               </div>

               {/* Formulario */}
               {showForm && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                         <CompetencyForm
                              competency={editingCompetency}
                              onSave={handleSave}
                              onCancel={() => {
                                   setShowForm(false);
                                   setEditingCompetency(null);
                              }}
                              saving={saving}
                              courseName={course.name}
                         />
                    </div>
               )}

               {/* Listado de competencias */}
               {competencies.length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                         <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                              <Layers className="w-8 h-8 text-gray-400" />
                         </div>
                         <p className="text-gray-600 font-medium mb-1">No hay competencias registradas</p>
                         <p className="text-sm text-gray-400">Comienza agregando la primera competencia del curso</p>
                    </div>
               ) : (
                    <div className="grid gap-4">
                         {competencies.map((comp, index) => (
                              <div
                                   key={comp.id}
                                   className="group bg-white border border-gray-200 rounded-xl hover:border-violet-300 hover:shadow-md transition-all duration-200"
                              >
                                   <div className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                             {/* Contenido principal */}
                                             <div className="flex-1 min-w-0">
                                                  {/* Badges de código y orden */}
                                                  <div className="flex items-center gap-2 mb-3">
                                                       <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold">
                                                            {comp.code}
                                                       </span>
                                                       <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                                                            Orden: {comp.orderIndex}
                                                       </span>
                                                  </div>
                                                  
                                                  {/* Nombre */}
                                                  <h4 className="text-base font-bold text-gray-900 mb-2 leading-snug">
                                                       {comp.name}
                                                  </h4>
                                                  
                                                  {/* Descripción */}
                                                  <p className="text-sm text-gray-600 leading-relaxed">
                                                       {comp.description}
                                                  </p>
                                             </div>

                                             {/* Botones de acción */}
                                             <div className="flex items-center gap-2 flex-shrink-0">
                                                  {/* Botón Editar */}
                                                  <button
                                                       onClick={() => handleEdit(comp)}
                                                       className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                       title="Editar competencia"
                                                  >
                                                       <Edit2 className="w-4 h-4" />
                                                  </button>
                                                  
                                                  {/* Botón Capacidades */}
                                                  <button
                                                       onClick={() => onSelectCompetency(comp)}
                                                       className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors text-sm font-semibold"
                                                       title="Ver capacidades"
                                                  >
                                                       Capacidades
                                                       <ChevronRight className="w-4 h-4" />
                                                  </button>
                                                  
                                                  {/* Botón Eliminar */}
                                                  <button
                                                       onClick={() => handleDelete(comp.id)}
                                                       className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                       title="Eliminar competencia"
                                                  >
                                                       <Trash2 className="w-4 h-4" />
                                                  </button>
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </div>
               )}
          </div>
     );
}
