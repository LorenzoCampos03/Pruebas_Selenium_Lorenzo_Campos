import { useState, useEffect } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { performanceService } from "../services/academicService";
import { createEmptyPerformance, AGE_LEVEL_LABELS } from "../models/academicModel";
import PerformanceForm from "./PerformanceForm";

export default function PerformanceSection({ capacity, ageLevel, onBack }) {
     const { user } = useAuth();
     const [performances, setPerformances] = useState([]);
     const [loading, setLoading] = useState(false);
     const [showForm, setShowForm] = useState(false);
     const [editingPerformance, setEditingPerformance] = useState(null);
     const [saving, setSaving] = useState(false);

     useEffect(() => {
          loadPerformances();
     }, [capacity.id]);

     const loadPerformances = async () => {
          try {
               setLoading(true);
               const data = await performanceService.getActiveByCapacity(capacity.id);
               setPerformances(data);
          } catch (error) {
               console.error("Error al cargar desempeños:", error);
          } finally {
               setLoading(false);
          }
     };

     const handleAdd = () => {
          const newPerf = createEmptyPerformance();
          newPerf.capacityId = capacity.id;
          newPerf.institutionId = user.institutionId;
          newPerf.ageLevel = ageLevel;
          setEditingPerformance(newPerf);
          setShowForm(true);
     };

     const handleEdit = (performance) => {
          setEditingPerformance(performance);
          setShowForm(true);
     };

     const handleSave = async (formData) => {
          try {
               setSaving(true);
               if (formData.id && formData.id.trim() !== "") {
                    await performanceService.update(formData.id, formData);
               } else {
                    await performanceService.create(formData);
               }
               setShowForm(false);
               setEditingPerformance(null);
               loadPerformances();
          } catch (error) {
               console.error("Error al guardar desempeño:", error);
               alert("Error al guardar el desempeño");
          } finally {
               setSaving(false);
          }
     };

     const handleDelete = async (id) => {
          if (!confirm("¿Estás seguro de eliminar este desempeño?")) return;
          
          try {
               await performanceService.delete(id);
               loadPerformances();
          } catch (error) {
               console.error("Error al eliminar desempeño:", error);
               alert("Error al eliminar el desempeño");
          }
     };

     return (
          <div>
               <button
                    onClick={onBack}
                    className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-1"
               >
                    ← Volver a Capacidades
               </button>

               <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-800">Capacidad Seleccionada:</h4>
                    <p className="text-sm text-gray-600 mt-1">{capacity.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                         Nivel: {AGE_LEVEL_LABELS[ageLevel]}
                    </p>
               </div>

               <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                         Desempeños
                    </h3>
                    <button
                         onClick={handleAdd}
                         className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                         + Agregar Desempeño
                    </button>
               </div>

               {showForm && (
                    <PerformanceForm
                         performance={editingPerformance}
                         ageLevel={ageLevel}
                         onSave={handleSave}
                         onCancel={() => {
                              setShowForm(false);
                              setEditingPerformance(null);
                         }}
                         saving={saving}
                    />
               )}

               {loading ? (
                    <div className="text-center py-8">Cargando desempeños...</div>
               ) : performances.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                         <p className="text-gray-500">No hay desempeños registrados</p>
                    </div>
               ) : (
                    <div className="space-y-3">
                         {performances.map((perf) => (
                              <div
                                   key={perf.id}
                                   className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                              >
                                   <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-2">
                                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                       {perf.code}
                                                  </span>
                                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                       {AGE_LEVEL_LABELS[perf.ageLevel]}
                                                  </span>
                                                  <span className="text-xs text-gray-400">
                                                       Orden: {perf.orderIndex}
                                                  </span>
                                             </div>
                                             <p className="text-sm text-gray-800">
                                                  {perf.description}
                                             </p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                             <button
                                                  onClick={() => handleEdit(perf)}
                                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                             >
                                                  Editar
                                             </button>
                                             <button
                                                  onClick={() => handleDelete(perf.id)}
                                                  className="text-red-600 hover:text-red-700 text-sm"
                                             >
                                                  Eliminar
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </div>
               )}
          </div>
     );
}
