import { useState } from "react";
import { Plus, Trash2, Layers, Target, Award, X } from "lucide-react";

export default function CompetencyCompleteForm({ course, institutionId, onSave, onCancel, saving }) {
     const [competency, setCompetency] = useState({
          code: "",
          name: "",
          description: "",
          orderIndex: 1,
     });

     const [capacities, setCapacities] = useState([
          {
               tempId: Date.now(),
               code: "",
               name: "",
               description: "",
               orderIndex: 1,
               performances: [
                    { tempId: Date.now() + 1, code: "", description: "", orderIndex: 1 }
               ]
          }
     ]);

     const handleCompetencyChange = (field, value) => {
          setCompetency(prev => ({ ...prev, [field]: field === "orderIndex" ? parseInt(value) || 1 : value }));
     };

     const handleCapacityChange = (capIndex, field, value) => {
          const n = [...capacities];
          n[capIndex][field] = field === "orderIndex" ? parseInt(value) || 1 : value;
          setCapacities(n);
     };

     const handlePerformanceChange = (capIndex, perfIndex, field, value) => {
          const n = [...capacities];
          n[capIndex].performances[perfIndex][field] = field === "orderIndex" ? parseInt(value) || 1 : value;
          setCapacities(n);
     };

     const addCapacity = () => setCapacities([...capacities, {
          tempId: Date.now(), code: "", name: "", description: "",
          orderIndex: capacities.length + 1,
          performances: [{ tempId: Date.now() + 1, code: "", description: "", orderIndex: 1 }]
     }]);

     const removeCapacity = (i) => { if (capacities.length > 1) setCapacities(capacities.filter((_, idx) => idx !== i)); };

     const addPerformance = (capIndex) => {
          const n = [...capacities];
          n[capIndex].performances.push({ tempId: Date.now(), code: "", description: "", orderIndex: n[capIndex].performances.length + 1 });
          setCapacities(n);
     };

     const removePerformance = (capIndex, perfIndex) => {
          const n = [...capacities];
          if (n[capIndex].performances.length > 1) {
               n[capIndex].performances = n[capIndex].performances.filter((_, i) => i !== perfIndex);
               setCapacities(n);
          }
     };

     const handleSubmit = (e) => {
          e.preventDefault();
          const ts = Date.now();
          onSave({
               competency: { id: `COMP-${ts}`, ...competency, courseId: course.id, institutionId, status: "ACTIVE" },
               capacities: capacities.map((cap, ci) => ({
                    id: `CAP-${ts}-${ci}`, code: cap.code, name: cap.name,
                    description: cap.description, orderIndex: cap.orderIndex, institutionId, status: "ACTIVE",
                    performances: cap.performances.map((perf, pi) => ({
                         id: `PERF-${ts}-${ci}-${pi}`, code: perf.code, description: perf.description,
                         ageLevel: course.ageLevel, orderIndex: perf.orderIndex, institutionId, status: "ACTIVE",
                    }))
               }))
          });
     };

     const Field = ({ label, required, children }) => (
          <div>
               <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    {label}{required && <span className="text-red-400 ml-1">*</span>}
               </label>
               {children}
          </div>
     );

     const inputCls = (ring = "blue") =>
          `w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-${ring}-400 focus:border-transparent transition-all`;

     return (
          <form onSubmit={handleSubmit} className="space-y-5">

               {}
               <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div>
                         <h3 className="text-lg font-bold text-gray-900">Nueva Competencia Completa</h3>
                         <p className="text-xs text-gray-400 mt-0.5">Curso: <span className="font-medium text-gray-600">{course.name}</span></p>
                    </div>
                    <button type="button" onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                         <X className="w-4 h-4" />
                    </button>
               </div>

               {}
               <div className="bg-white border border-violet-200 rounded-2xl overflow-hidden">
                    <div className="bg-violet-50 px-4 py-3 flex items-center gap-2 border-b border-violet-100">
                         <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                              <Layers className="w-4 h-4 text-violet-600" />
                         </div>
                         <span className="text-sm font-bold text-violet-800">Competencia</span>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Field label="Código" required>
                              <input type="text" value={competency.code} onChange={(e) => handleCompetencyChange("code", e.target.value)} required className={inputCls("violet")} placeholder="Ej: COMP-001" />
                         </Field>
                         <Field label="Orden">
                              <input type="number" value={competency.orderIndex} onChange={(e) => handleCompetencyChange("orderIndex", e.target.value)} min="1" className={inputCls("violet")} />
                         </Field>
                         <div className="md:col-span-2">
                              <Field label="Nombre" required>
                                   <input type="text" value={competency.name} onChange={(e) => handleCompetencyChange("name", e.target.value)} required className={inputCls("violet")} placeholder="Nombre de la competencia" />
                              </Field>
                         </div>
                         <div className="md:col-span-2">
                              <Field label="Descripción" required>
                                   <textarea value={competency.description} onChange={(e) => handleCompetencyChange("description", e.target.value)} required rows={2} className={`${inputCls("violet")} resize-none`} placeholder="Descripción de la competencia" />
                              </Field>
                         </div>
                    </div>
               </div>

               {}
               <div className="space-y-3">
                    {capacities.map((cap, ci) => (
                         <div key={cap.tempId} className="bg-white border border-emerald-200 rounded-2xl overflow-hidden">
                              {}
                              <div className="bg-emerald-50 px-4 py-3 flex items-center justify-between border-b border-emerald-100">
                                   <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                                             <Target className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-bold text-emerald-800">Capacidad {ci + 1}</span>
                                   </div>
                                   {capacities.length > 1 && (
                                        <button type="button" onClick={() => removeCapacity(ci)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                                             <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                   )}
                              </div>

                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <Field label="Código" required>
                                        <input type="text" value={cap.code} onChange={(e) => handleCapacityChange(ci, "code", e.target.value)} required className={inputCls("emerald")} placeholder="Ej: CAP-001" />
                                   </Field>
                                   <Field label="Orden">
                                        <input type="number" value={cap.orderIndex} onChange={(e) => handleCapacityChange(ci, "orderIndex", e.target.value)} min="1" className={inputCls("emerald")} />
                                   </Field>
                                   <div className="md:col-span-2">
                                        <Field label="Nombre" required>
                                             <input type="text" value={cap.name} onChange={(e) => handleCapacityChange(ci, "name", e.target.value)} required className={inputCls("emerald")} placeholder="Nombre de la capacidad" />
                                        </Field>
                                   </div>
                                   <div className="md:col-span-2">
                                        <Field label="Descripción" required>
                                             <textarea value={cap.description} onChange={(e) => handleCapacityChange(ci, "description", e.target.value)} required rows={2} className={`${inputCls("emerald")} resize-none`} placeholder="Descripción de la capacidad" />
                                        </Field>
                                   </div>
                              </div>

                              {}
                              <div className="px-4 pb-4 space-y-2">
                                   <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                             <Award className="w-4 h-4 text-purple-500" />
                                             <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Desempeños</span>
                                        </div>
                                        <button type="button" onClick={() => addPerformance(ci)} className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:bg-purple-50 px-2.5 py-1 rounded-lg transition-colors">
                                             <Plus className="w-3.5 h-3.5" /> Agregar
                                        </button>
                                   </div>

                                   {cap.performances.map((perf, pi) => (
                                        <div key={perf.tempId} className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                                             <div className="flex items-center justify-between mb-2.5">
                                                  <span className="text-xs font-semibold text-purple-700">Desempeño {pi + 1}</span>
                                                  {cap.performances.length > 1 && (
                                                       <button type="button" onClick={() => removePerformance(ci, pi)} className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="w-3 h-3" />
                                                       </button>
                                                  )}
                                             </div>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                  <Field label="Código" required>
                                                       <input type="text" value={perf.code} onChange={(e) => handlePerformanceChange(ci, pi, "code", e.target.value)} required className={inputCls("purple")} placeholder="Ej: DES-001" />
                                                  </Field>
                                                  <Field label="Orden">
                                                       <input type="number" value={perf.orderIndex} onChange={(e) => handlePerformanceChange(ci, pi, "orderIndex", e.target.value)} min="1" className={inputCls("purple")} />
                                                  </Field>
                                                  <div className="md:col-span-2">
                                                       <Field label="Descripción" required>
                                                            <textarea value={perf.description} onChange={(e) => handlePerformanceChange(ci, pi, "description", e.target.value)} required rows={2} className={`${inputCls("purple")} resize-none`} placeholder="Descripción del desempeño" />
                                                       </Field>
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         </div>
                    ))}

                    {}
                    <button
                         type="button"
                         onClick={addCapacity}
                         className="w-full py-3 border border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                         <Plus className="w-4 h-4" /> Agregar otra capacidad
                    </button>
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
                         {saving ? (
                              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                         ) : null}
                         {saving ? "Guardando..." : "Guardar Todo"}
                    </button>
               </div>
          </form>
     );
}