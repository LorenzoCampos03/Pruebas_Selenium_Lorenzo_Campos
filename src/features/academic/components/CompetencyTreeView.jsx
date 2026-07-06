import { useState, useEffect } from "react";
import { useAuth } from "@/core/auth/AuthContext";
import { competencyService, capacityService } from "../services/academicService";
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, RotateCcw, CheckCircle, XCircle, Layers, Target } from "lucide-react";
import CompetencyForm from "./CompetencyForm";
import CapacityForm from "./CapacityForm";

export default function CompetencyTreeView({ course }) {
     const { user } = useAuth();
     const [competencies, setCompetencies] = useState([]);
     const [expandedCompetencies, setExpandedCompetencies] = useState(new Set());
     const [showInactiveCompetencies, setShowInactiveCompetencies] = useState(false);
     const [showInactiveCapacities, setShowInactiveCapacities] = useState(false);
     const [loading, setLoading] = useState(false);
     const [localStatus, setLocalStatus] = useState({});

     const getStatus = (id, original) => localStatus[id] ?? original;
     const isInactive = (id, original) => String(getStatus(id, original)).toUpperCase() === "INACTIVE";
     const [showCompetencyForm, setShowCompetencyForm]   = useState(false);
     const [editingCompetency, setEditingCompetency]     = useState(null);
     const [showCapacityForm, setShowCapacityForm]       = useState(false);
     const [editingCapacity, setEditingCapacity]         = useState(null);
     const [selectedCompetencyForCapacity, setSelectedCompetencyForCapacity] = useState(null);

     useEffect(() => {
          loadData();
     }, [course.id, showInactiveCompetencies, showInactiveCapacities]);

     const loadData = async () => {
          try {
               setLoading(true);
               setLocalStatus({}); 
               
               // Obtener todas las competencias del curso
               const allComps = await competencyService.getByCourse(course.id);
               
               // Filtrar competencias según el estado del checkbox
               const filteredComps = showInactiveCompetencies
                    ? allComps.filter(comp => String(comp.status).toUpperCase() === "INACTIVE")
                    : allComps.filter(comp => String(comp.status).toUpperCase() === "ACTIVE");

               const compsWithData = await Promise.all(
                    filteredComps.map(async (comp) => {
                         // Obtener todas las capacidades de la competencia
                         const allCapacities = await capacityService.getByCompetency(comp.id);
                         
                         // Filtrar capacidades según el estado del checkbox
                         const capacities = showInactiveCapacities
                              ? allCapacities.filter(cap => String(cap.status).toUpperCase() === "INACTIVE")
                              : allCapacities.filter(cap => String(cap.status).toUpperCase() === "ACTIVE");

                         return { ...comp, capacities };
                    })
               );
               setCompetencies(compsWithData);
          } catch (error) {
               console.error("Error al cargar datos:", error);
          } finally {
               setLoading(false);
          }
     };

     const markLocal = (id, status) =>
          setLocalStatus((prev) => ({ ...prev, [id]: status }));

     const clearLocal = (id) =>
          setLocalStatus((prev) => { const n = { ...prev }; delete n[id]; return n; });

     const toggleCompetency = (id) => {
          const s = new Set(expandedCompetencies);
          s.has(id) ? s.delete(id) : s.add(id);
          setExpandedCompetencies(s);
     };

     const handleAddCompetency = () => {
          setEditingCompetency({ id: "", courseId: course.id, institutionId: user.institutionId, code: "", name: "", description: "", orderIndex: 1, status: "ACTIVE" });
          setShowCompetencyForm(true);
     };
     const handleAddCapacity = (comp) => {
          setSelectedCompetencyForCapacity(comp);
          setEditingCapacity({ id: "", competencyId: comp.id, institutionId: user.institutionId, code: "", name: "", description: "", orderIndex: 1, status: "ACTIVE" });
          setShowCapacityForm(true);
     };

     const handleSaveCompetency = async (formData) => {
          try {
               formData.id?.trim() ? await competencyService.update(formData.id, formData) : await competencyService.create(formData);
               setShowCompetencyForm(false); setEditingCompetency(null); loadData();
          } catch { alert("Error al guardar la competencia"); }
     };
     const handleSaveCapacity = async (formData) => {
          try {
               formData.id?.trim() ? await capacityService.update(formData.id, formData) : await capacityService.create(formData);
               setShowCapacityForm(false); setEditingCapacity(null); setSelectedCompetencyForCapacity(null); loadData();
          } catch { alert("Error al guardar la capacidad"); }
     };

     const handleDeleteCompetency = async (id) => {
          if (!confirm("¿Eliminar esta competencia?")) return;
          try { await competencyService.delete(id); markLocal(id, "INACTIVE"); }
          catch (e) { console.error(e); }
     };
     const handleDeleteCapacity = async (id) => {
          if (!confirm("¿Eliminar esta capacidad?")) return;
          try { await capacityService.delete(id); markLocal(id, "INACTIVE"); }
          catch (e) { console.error(e); }
     };

     const handleRestoreCompetency = async (id) => {
          try { await competencyService.restore(id); clearLocal(id); loadData(); }
          catch (e) { console.error(e); }
     };
     const handleRestoreCapacity = async (id) => {
          try { await capacityService.restore(id); clearLocal(id); loadData(); }
          catch (e) { console.error(e); }
     };

     if (loading) return <div className="text-center py-8 text-sm text-gray-400">Cargando...</div>;

     return (
          <div className="space-y-4">
               {/* Header */}
               <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                         <h3 className="text-xl font-bold text-gray-900">
                              Competencias y Capacidades
                         </h3>
                         <div className="flex items-center gap-3">
                              {/* Checkbox para competencias inactivas */}
                              <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                                   <input
                                        type="checkbox"
                                        checked={showInactiveCompetencies}
                                        onChange={(e) => setShowInactiveCompetencies(e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                   />
                                   <span className="text-gray-700 font-medium">Competencias inactivas</span>
                              </label>
                              
                              {/* Checkbox para capacidades inactivas */}
                              <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                                   <input
                                        type="checkbox"
                                        checked={showInactiveCapacities}
                                        onChange={(e) => setShowInactiveCapacities(e.target.checked)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                   />
                                   <span className="text-gray-700 font-medium">Capacidades inactivas</span>
                              </label>
                         </div>
                    </div>
                    <button
                         onClick={handleAddCompetency}
                         className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-medium shadow-lg shadow-blue-500/30 transition-all"
                    >
                         <Plus className="w-4 h-4" /> Nueva Competencia
                    </button>
               </div>

               {/* Modals */}
               {showCompetencyForm && (
                    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                         <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                              <CompetencyForm 
                                   competency={editingCompetency} 
                                   onSave={handleSaveCompetency} 
                                   onCancel={() => { setShowCompetencyForm(false); setEditingCompetency(null); }} 
                                   saving={false}
                                   courseName={course.name}
                              />
                         </div>
                    </div>
               )}
               {showCapacityForm && (
                    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                         <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                              <CapacityForm capacity={editingCapacity} onSave={handleSaveCapacity} onCancel={() => { setShowCapacityForm(false); setEditingCapacity(null); setSelectedCompetencyForCapacity(null); }} saving={false} />
                         </div>
                    </div>
               )}

               {/* Lista de competencias */}
               {competencies.length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                         <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                         <p className="text-gray-600 font-medium text-lg mb-2">No hay competencias registradas</p>
                         <p className="text-gray-400 text-sm">Haz clic en "Nueva Competencia" para comenzar</p>
                    </div>
               ) : (
                    <div className="space-y-4">
                         {competencies.map((comp, idx) => {
                              const compInactive = isInactive(comp.id, comp.status);
                              const isExpanded = expandedCompetencies.has(comp.id);
                              
                              return (
                                   <div 
                                        key={comp.id} 
                                        className={`border-2 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all ${
                                             compInactive ? "opacity-60 border-gray-200" : "border-blue-100"
                                        }`}
                                   >
                                        {/* Competencia Header */}
                                        <div className={`p-5 rounded-t-2xl ${compInactive ? "bg-gray-50" : "bg-gradient-to-r from-blue-50 to-indigo-50"}`}>
                                             <div className="flex items-start gap-4">
                                                  <button 
                                                       onClick={() => toggleCompetency(comp.id)} 
                                                       className={`mt-1 p-2 rounded-lg transition-all ${
                                                            compInactive ? "text-gray-400 hover:bg-gray-100" : "text-blue-600 hover:bg-blue-100"
                                                       }`}
                                                  >
                                                       {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                  </button>
                                                  
                                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                       compInactive ? "bg-gray-200" : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
                                                  }`}>
                                                       <Layers className={`w-6 h-6 ${compInactive ? "text-gray-400" : "text-white"}`} />
                                                  </div>
                                                  
                                                  <div className="flex-1 min-w-0">
                                                       <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                                                                 compInactive 
                                                                      ? "bg-gray-200 text-gray-600" 
                                                                      : "bg-blue-600 text-white shadow-sm"
                                                            }`}>
                                                                 {comp.code}
                                                            </span>
                                                            {compInactive
                                                                 ? <XCircle className="w-5 h-5 text-red-500" />
                                                                 : <CheckCircle className="w-5 h-5 text-green-500" />}
                                                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                                                                 compInactive 
                                                                      ? "bg-gray-100 text-gray-500" 
                                                                      : "bg-emerald-100 text-emerald-700"
                                                            }`}>
                                                                 {comp.capacities?.length || 0} capacidades
                                                            </span>
                                                       </div>
                                                       <h4 className="font-bold text-gray-900 text-lg mb-1">{comp.name}</h4>
                                                       <p className="text-sm text-gray-600 leading-relaxed">{comp.description}</p>
                                                  </div>
                                                  
                                                  <div className="flex gap-2">
                                                       {!compInactive && (
                                                            <>
                                                                 <button 
                                                                      onClick={() => handleAddCapacity(comp)} 
                                                                      title="Agregar capacidad" 
                                                                      className="w-9 h-9 flex items-center justify-center rounded-xl text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm hover:shadow"
                                                                 >
                                                                      <Plus className="w-5 h-5" />
                                                                 </button>
                                                                 <button 
                                                                      onClick={() => { setEditingCompetency(comp); setShowCompetencyForm(true); }} 
                                                                      title="Editar" 
                                                                      className="w-9 h-9 flex items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50 transition-all shadow-sm hover:shadow"
                                                                 >
                                                                      <Edit2 className="w-5 h-5" />
                                                                 </button>
                                                                 <button 
                                                                      onClick={() => handleDeleteCompetency(comp.id)} 
                                                                      title="Eliminar" 
                                                                      className="w-9 h-9 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-all shadow-sm hover:shadow"
                                                                 >
                                                                      <Trash2 className="w-5 h-5" />
                                                                 </button>
                                                            </>
                                                       )}
                                                       {compInactive && (
                                                            <button 
                                                                 onClick={() => handleRestoreCompetency(comp.id)} 
                                                                 title="Restaurar" 
                                                                 className="w-9 h-9 flex items-center justify-center rounded-xl text-emerald-500 hover:bg-emerald-50 transition-all shadow-sm hover:shadow"
                                                            >
                                                                 <RotateCcw className="w-5 h-5" />
                                                            </button>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Capacidades */}
                                        {isExpanded && (
                                             <div className="p-5 bg-gray-50 rounded-b-2xl">
                                                  {comp.capacities?.length === 0 ? (
                                                       <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                                            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                            <p className="text-sm text-gray-500 font-medium">No hay capacidades registradas</p>
                                                            <p className="text-xs text-gray-400 mt-1">Haz clic en el botón + para agregar</p>
                                                       </div>
                                                  ) : (
                                                       <div className="grid grid-cols-1 gap-3">
                                                            {comp.capacities?.map((cap) => {
                                                                 const capInactive = isInactive(cap.id, cap.status);
                                                                 return (
                                                                      <div 
                                                                           key={cap.id} 
                                                                           className={`p-4 rounded-xl border-2 transition-all ${
                                                                                capInactive 
                                                                                     ? "bg-gray-100 border-gray-200 opacity-60" 
                                                                                     : "bg-white border-emerald-100 hover:border-emerald-300 hover:shadow-md"
                                                                           }`}
                                                                      >
                                                                           <div className="flex items-start gap-3">
                                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                                                     capInactive ? "bg-gray-200" : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow"
                                                                                }`}>
                                                                                     <Target className={`w-5 h-5 ${capInactive ? "text-gray-400" : "text-white"}`} />
                                                                                </div>
                                                                                
                                                                                <div className="flex-1 min-w-0">
                                                                                     <div className="flex items-center gap-2 mb-2">
                                                                                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                                                                               capInactive 
                                                                                                    ? "bg-gray-200 text-gray-600" 
                                                                                                    : "bg-emerald-600 text-white"
                                                                                          }`}>
                                                                                               {cap.code}
                                                                                          </span>
                                                                                          {capInactive
                                                                                               ? <XCircle className="w-4 h-4 text-red-500" />
                                                                                               : <CheckCircle className="w-4 h-4 text-green-500" />}
                                                                                     </div>
                                                                                     <h5 className="font-bold text-gray-900 mb-1">{cap.name}</h5>
                                                                                     <p className="text-sm text-gray-600">{cap.description}</p>
                                                                                </div>
                                                                                
                                                                                <div className="flex gap-2">
                                                                                     {!capInactive && (
                                                                                          <>
                                                                                               <button 
                                                                                                    onClick={() => { setEditingCapacity(cap); setSelectedCompetencyForCapacity(comp); setShowCapacityForm(true); }} 
                                                                                                    title="Editar" 
                                                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-all"
                                                                                               >
                                                                                                    <Edit2 className="w-4 h-4" />
                                                                                               </button>
                                                                                               <button 
                                                                                                    onClick={() => handleDeleteCapacity(cap.id)} 
                                                                                                    title="Eliminar" 
                                                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-all"
                                                                                               >
                                                                                                    <Trash2 className="w-4 h-4" />
                                                                                               </button>
                                                                                          </>
                                                                                     )}
                                                                                     {capInactive && (
                                                                                          <button 
                                                                                               onClick={() => handleRestoreCapacity(cap.id)} 
                                                                                               title="Restaurar" 
                                                                                               className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50 transition-all"
                                                                                          >
                                                                                               <RotateCcw className="w-4 h-4" />
                                                                                          </button>
                                                                                     )}
                                                                                </div>
                                                                           </div>
                                                                      </div>
                                                                 );
                                                            })}
                                                       </div>
                                                  )}
                                             </div>
                                        )}
                                   </div>
                              );
                         })}
                    </div>
               )}
          </div>
     );
}
