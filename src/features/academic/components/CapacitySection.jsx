import { useState, useEffect } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { capacityService } from "../services/academicService";
import { createEmptyCapacity } from "../models/academicModel";
import CapacityForm from "./CapacityForm";

export default function CapacitySection({ competency, onBack, onSelectCapacity }) {
     const { user } = useAuth();
     const [capacities, setCapacities] = useState([]);
     const [loading, setLoading] = useState(false);
     const [showForm, setShowForm] = useState(false);
     const [editingCapacity, setEditingCapacity] = useState(null);
     const [saving, setSaving] = useState(false);

     useEffect(() => {
          loadCapacities();
     }, [competency.id]);

     const loadCapacities = async () => {
          try {
               setLoading(true);
               const data = await capacityService.getActiveByCompetency(competency.id);
               setCapacities(data);
          } catch (error) {
               console.error("Error al cargar capacidades:", error);
          } finally {
               setLoading(false);
          }
     };

     const handleAdd = () => {
          const newCap = createEmptyCapacity();
          newCap.competencyId = competency.id;
          newCap.institutionId = user.institutionId;
          setEditingCapacity(newCap);
          setShowForm(true);
     };

     const handleEdit = (capacity) => {
          setEditingCapacity(capacity);
          setShowForm(true);
     };

     const handleSave = async (formData) => {
          try {
               setSaving(true);
               if (formData.id && formData.id.trim() !== "") {
                    await capacityService.update(formData.id, formData);
               } else {
                    await capacityService.create(formData);
               }
               setShowForm(false);
               setEditingCapacity(null);
               loadCapacities();
          } catch (error) {
               console.error("Error al guardar capacidad:", error);
               alert("Error al guardar la capacidad");
          } finally {
               setSaving(false);
          }
     };

     const handleDelete = async (id) => {
          if (!confirm("¿Estás seguro de eliminar esta capacidad?")) return;
          
          try {
               await capacityService.delete(id);
               loadCapacities();
          } catch (error) {
               console.error("Error al eliminar capacidad:", error);
               alert("Error al eliminar la capacidad");
          }
     };

     return (
          <div>
               <button
                    onClick={onBack}
                    className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-1"
               >
                    ← Volver a Competencias
               </button>

               <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-800">Competencia Seleccionada:</h4>
                    <p className="text-sm text-gray-600 mt-1">{competency.name}</p>
               </div>

               <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                         Capacidades
                    </h3>
                    <button
                         onClick={handleAdd}
                         className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                         + Agregar Capacidad
                    </button>
               </div>

               {showForm && (
                    <CapacityForm
                         capacity={editingCapacity}
                         onSave={handleSave}
                         onCancel={() => {
                              setShowForm(false);
                              setEditingCapacity(null);
                         }}
                         saving={saving}
                    />
               )}

               {loading ? (
                    <div className="text-center py-8">Cargando capacidades...</div>
               ) : capacities.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                         <p className="text-gray-500">No hay capacidades registradas</p>
                    </div>
               ) : (
                    <div className="space-y-3">
                         {capacities.map((cap) => (
                              <div
                                   key={cap.id}
                                   className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                              >
                                   <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-2">
                                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                       {cap.code}
                                                  </span>
                                                  <span className="text-xs text-gray-400">
                                                       Orden: {cap.orderIndex}
                                                  </span>
                                             </div>
                                             <h4 className="font-semibold text-gray-800 mb-1">
                                                  {cap.name}
                                             </h4>
                                             <p className="text-sm text-gray-600">
                                                  {cap.description}
                                             </p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                             <button
                                                  onClick={() => handleEdit(cap)}
                                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                             >
                                                  Editar
                                             </button>
                                             <button
                                                  onClick={() => onSelectCapacity(cap)}
                                                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                                             >
                                                  Desempeños →
                                             </button>
                                             <button
                                                  onClick={() => handleDelete(cap.id)}
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
