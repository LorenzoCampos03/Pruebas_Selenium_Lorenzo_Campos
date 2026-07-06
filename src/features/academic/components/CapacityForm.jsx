import { useState, useEffect } from "react";
import { Target, Save, Loader2 } from "lucide-react";
import { capacityService } from "../services/academicService";

// Generar código automático: CAP-001, CAP-002, etc.
const generateCapacityCode = (orderIndex) => {
  const paddedNumber = String(orderIndex).padStart(3, '0');
  return `CAP-${paddedNumber}`;
};

export default function CapacityForm({ capacity, onSave, onCancel, saving }) {
     const [formData, setFormData] = useState(capacity);
     const [existingCapacities, setExistingCapacities] = useState([]);

     const isEditing = !!(formData.id && formData.id.trim() !== "");

     useEffect(() => {
          if (!isEditing && capacity.competencyId) {
               loadExistingCapacities();
          }
     }, [capacity.competencyId]);

     const loadExistingCapacities = async () => {
          try {
               const data = await capacityService.getByCompetency(capacity.competencyId);
               const existing = Array.isArray(data) ? data : (data?.data || []);
               setExistingCapacities(existing);
               
               // Generar código y orden automáticamente
               const nextOrder = existing.length + 1;
               const code = generateCapacityCode(nextOrder);
               
               setFormData(prev => ({
                    ...prev,
                    code: code,
                    orderIndex: nextOrder
               }));
          } catch (err) {
               console.error("Error al cargar capacidades existentes:", err);
               setFormData(prev => ({
                    ...prev,
                    code: generateCapacityCode(1),
                    orderIndex: 1
               }));
          }
     };

     const handleChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: name === "orderIndex" ? parseInt(value) || 1 : value
          }));
     };

     const handleSubmit = (e) => {
          e.preventDefault();
          onSave(formData);
     };

     return (
          <form onSubmit={handleSubmit} className="space-y-5">

               {}
               <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                         <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                         <h4 className="text-lg font-bold text-gray-900">
                              {isEditing ? "Editar Capacidad" : "Nueva Capacidad"}
                         </h4>
                         <p className="text-xs text-gray-400">Completa los campos requeridos</p>
                    </div>
               </div>

               {}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Código - Generado automáticamente */}
                    <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Código
                              <span className="ml-2 text-xs text-gray-400 normal-case font-normal">(automático)</span>
                         </label>
                         <input
                              type="text"
                              name="code"
                              value={formData.code}
                              onChange={handleChange}
                              readOnly={!isEditing}
                              placeholder="Ej: CAP-001"
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all ${
                                   isEditing ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                              }`}
                         />
                    </div>

                    {/* Orden - Generado automáticamente */}
                    <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Orden
                              <span className="ml-2 text-xs text-gray-400 normal-case font-normal">(automático)</span>
                         </label>
                         <input
                              type="number"
                              name="orderIndex"
                              value={formData.orderIndex}
                              onChange={handleChange}
                              min="1"
                              readOnly={!isEditing}
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all ${
                                   isEditing ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                              }`}
                         />
                    </div>

                    {/* Nombre - Manual */}
                    <div className="md:col-span-2">
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Nombre <span className="text-red-400">*</span>
                         </label>
                         <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              placeholder="Nombre de la capacidad"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                         />
                    </div>

                    {/* Descripción - Manual */}
                    <div className="md:col-span-2">
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Descripción <span className="text-red-400">*</span>
                         </label>
                         <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleChange}
                              required
                              rows={3}
                              placeholder="Descripción de la capacidad"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none"
                         />
                    </div>
               </div>

               {}
               <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                         type="button"
                         onClick={onCancel}
                         disabled={saving}
                         className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                         Cancelar
                    </button>
                    <button
                         type="submit"
                         disabled={saving}
                         className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm font-medium shadow-sm disabled:opacity-60"
                    >
                         {saving
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Save className="w-4 h-4" />}
                         {isEditing ? "Guardar cambios" : "Crear capacidad"}
                    </button>
               </div>
          </form>
     );
}