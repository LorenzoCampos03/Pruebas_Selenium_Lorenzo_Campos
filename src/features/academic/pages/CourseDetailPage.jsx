import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import { courseService, competencyService, capacityService, performanceService } from "../services/academicService";
import { ArrowLeft, Plus, Trash2, Filter, FilterX, RotateCcw, ChevronDown, ChevronRight, Layers, Target, Award } from "lucide-react";
import CompetencyCompleteForm from "../components/CompetencyCompleteForm";

export default function CourseDetailPage() {
     const { age, courseId } = useParams();
     const navigate = useNavigate();
     const { user } = useAuth();
     const [course, setCourse] = useState(null);
     const [competencies, setCompetencies] = useState([]);
     const [expandedCompetencies, setExpandedCompetencies] = useState(new Set());
     const [expandedCapacities, setExpandedCapacities] = useState(new Set());
     const [showInactive, setShowInactive] = useState(false);
     const [loading, setLoading] = useState(true);
     const [showCompleteForm, setShowCompleteForm] = useState(false);
     const [saving, setSaving] = useState(false);

     useEffect(() => {
          loadCourse();
          loadData();
     }, [courseId, showInactive]);

     const loadCourse = async () => {
          try {
               const data = await courseService.getById(courseId);
               setCourse(data);
          } catch (error) {
               console.error("Error al cargar curso:", error);
          }
     };

     const loadData = async () => {
          try {
               setLoading(true);
               const comps = showInactive
                    ? await competencyService.getByCourse(courseId)
                    : await competencyService.getActiveByCourse(courseId);

               const validComps = comps.filter(comp => comp && comp.id);

               const compsWithData = await Promise.all(
                    validComps.map(async (comp) => {
                         const capacities = showInactive
                              ? await capacityService.getByCompetency(comp.id)
                              : await capacityService.getActiveByCompetency(comp.id);

                         const capsWithPerformances = await Promise.all(
                              capacities.map(async (cap) => {
                                   const performances = showInactive
                                        ? await performanceService.getByCapacity(cap.id)
                                        : await performanceService.getActiveByCapacity(cap.id);
                                   return { ...cap, performances };
                              })
                         );

                         return { ...comp, capacities: capsWithPerformances };
                    })
               );

               setCompetencies(compsWithData);
          } catch (error) {
               console.error("Error al cargar datos:", error);
          } finally {
               setLoading(false);
          }
     };

     const toggleCompetency = (compId) => {
          const newExpanded = new Set(expandedCompetencies);
          if (newExpanded.has(compId)) newExpanded.delete(compId);
          else newExpanded.add(compId);
          setExpandedCompetencies(newExpanded);
     };

     const toggleCapacity = (capId) => {
          const newExpanded = new Set(expandedCapacities);
          if (newExpanded.has(capId)) newExpanded.delete(capId);
          else newExpanded.add(capId);
          setExpandedCapacities(newExpanded);
     };

     const handleSaveComplete = async (data) => {
          try {
               setSaving(true);
               const compResponse = await competencyService.create(data.competency);

               for (const capacity of data.capacities) {
                    const capResponse = await capacityService.create({
                         id: capacity.id,
                         competencyId: compResponse.id,
                         institutionId: capacity.institutionId,
                         code: capacity.code,
                         name: capacity.name,
                         description: capacity.description,
                         orderIndex: capacity.orderIndex,
                         status: capacity.status,
                    });

                    for (const performance of capacity.performances) {
                         await performanceService.create({
                              id: performance.id,
                              capacityId: capResponse.id,
                              institutionId: performance.institutionId,
                              code: performance.code,
                              description: performance.description,
                              ageLevel: performance.ageLevel,
                              orderIndex: performance.orderIndex,
                              status: performance.status,
                         });
                    }
               }

               await loadData();
               setShowCompleteForm(false);
               alert("¡Competencia completa creada exitosamente!");
          } catch (error) {
               console.error("Error:", error);
               alert(`Error al guardar: ${error.response?.data?.message || error.message || "Por favor intenta de nuevo"}`);
          } finally {
               setSaving(false);
          }
     };

     const handleToggleCompetencyStatus = async (comp) => {
          try {
               if (comp.status === "ACTIVE") {
                    if (comp.capacities && comp.capacities.length > 0) {
                         for (const cap of comp.capacities) {
                              if (cap.performances && cap.performances.length > 0) {
                                   for (const perf of cap.performances) {
                                        try { await performanceService.delete(perf.id); } catch (e) {}
                                   }
                              }
                              try { await capacityService.delete(cap.id); } catch (e) {}
                         }
                    }
                    await competencyService.delete(comp.id);
               } else {
                    await competencyService.restore(comp.id);
                    if (comp.capacities && comp.capacities.length > 0) {
                         for (const cap of comp.capacities) {
                              try { await capacityService.restore(cap.id); } catch (e) {}
                              if (cap.performances && cap.performances.length > 0) {
                                   for (const perf of cap.performances) {
                                        try { await performanceService.restore(perf.id); } catch (e) {}
                                   }
                              }
                         }
                    }
               }
               await loadData();
          } catch (error) {
               console.error("Error:", error);
               alert("Error al cambiar el estado de la competencia.");
          }
     };

     const handleToggleCapacityStatus = async (cap) => {
          try {
               if (cap.status === "ACTIVE") {
                    await capacityService.delete(cap.id);
               } else {
                    await capacityService.restore(cap.id);
               }
               loadData();
          } catch (error) {
               console.error("Error:", error);
          }
     };

     const handleTogglePerformanceStatus = async (perf) => {
          try {
               if (perf.status === "ACTIVE") {
                    await performanceService.delete(perf.id);
               } else {
                    await performanceService.restore(perf.id);
               }
               await loadData();
          } catch (error) {
               const errorMessage = error.response?.data?.message || error.message || "Error desconocido";
               alert(`Error al cambiar el estado del desempeño: ${errorMessage}`);
               await loadData();
          }
     };

     if (!course) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
               </div>
          );
     }

     return (
          <div className="p-6">
               <div className="mb-6">
                    {}
                    <button
                         onClick={() => navigate(`/docente/cursos/${age}`)}
                         className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                         <ArrowLeft className="w-5 h-5" />
                         <span className="font-medium">Volver a Cursos</span>
                    </button>

                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                         <div className="flex justify-between items-start">
                              <div>
                                   <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-lg text-sm font-bold">
                                             {course.code}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                             course.status === "ACTIVE"
                                                  ? "bg-green-400 text-green-900"
                                                  : "bg-red-400 text-red-900"
                                        }`}>
                                             {course.status === "ACTIVE" ? "Activo" : "Inactivo"}
                                        </span>
                                   </div>
                                   <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
                                   <p className="text-blue-100">
                                        Área: {course.areaCurricular} · Edad: {course.ageLevel}
                                   </p>
                              </div>
                              <div className="flex items-center gap-3">
                                   <button
                                        onClick={() => setShowInactive(!showInactive)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                             showInactive
                                                  ? 'bg-white text-indigo-600 shadow-lg'
                                                  : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                                        }`}
                                   >
                                        {showInactive
                                             ? <><FilterX className="w-5 h-5" /><span>Ocultar inactivos</span></>
                                             : <><Filter className="w-5 h-5" /><span>Mostrar inactivos</span></>
                                        }
                                   </button>
                                   <button
                                        onClick={() => setShowCompleteForm(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-xl hover:bg-purple-50 transition-colors font-bold shadow-lg"
                                   >
                                        <Plus className="w-5 h-5" />
                                        Nueva Competencia Completa
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>

               {showCompleteForm && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                         <div className="bg-white rounded-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto my-8">
                              <CompetencyCompleteForm
                                   course={course}
                                   institutionId={user.institutionId}
                                   onSave={handleSaveComplete}
                                   onCancel={() => setShowCompleteForm(false)}
                                   saving={saving}
                              />
                         </div>
                    </div>
               )}

               {loading ? (
                    <div className="text-center py-16">
                         <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                         <p className="text-gray-500">Cargando competencias...</p>
                    </div>
               ) : competencies.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                         <Layers className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                         <p className="text-gray-600 text-lg font-medium mb-2">No hay competencias registradas</p>
                         <p className="text-gray-400 text-sm">Haz clic en "Nueva Competencia Completa" para comenzar</p>
                    </div>
               ) : (
                    <div className="space-y-4">
                         {competencies.map((comp) => (
                              <div key={comp.id} className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
                                   <div className={`p-6 ${comp.status === "INACTIVE" ? "bg-gray-100" : "bg-purple-50"}`}>
                                        <div className="flex items-start gap-4">
                                             <button onClick={() => toggleCompetency(comp.id)} className="mt-1 p-2 hover:bg-white/50 rounded-lg transition-colors">
                                                  {expandedCompetencies.has(comp.id)
                                                       ? <ChevronDown className="w-6 h-6 text-purple-600" />
                                                       : <ChevronRight className="w-6 h-6 text-purple-600" />}
                                             </button>
                                             <Layers className="w-6 h-6 text-purple-600 mt-1" />
                                             <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-2">
                                                       <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-lg text-sm font-bold">{comp.code}</span>
                                                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${comp.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                            {comp.status === "ACTIVE" ? "Activo" : "Inactivo"}
                                                       </span>
                                                       <span className="text-sm text-gray-500">{comp.capacities?.length || 0} capacidades</span>
                                                  </div>
                                                  <h3 className="text-lg font-bold text-gray-800 mb-1">{comp.name}</h3>
                                                  <p className="text-sm text-gray-600">{comp.description}</p>
                                                  <div className="flex gap-2 mt-2">
                                                       <button
                                                            onClick={() => handleToggleCompetencyStatus(comp)}
                                                            className={`p-2 rounded-lg transition-colors ${comp.status === "ACTIVE" ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}
                                                       >
                                                            {comp.status === "ACTIVE" ? <Trash2 className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
                                                       </button>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>

                                   {expandedCompetencies.has(comp.id) && (
                                        <div className="p-6 bg-gray-50 space-y-3">
                                             {comp.capacities?.length === 0 ? (
                                                  <p className="text-sm text-gray-500 text-center py-4">No hay capacidades</p>
                                             ) : (
                                                  comp.capacities?.map((cap) => (
                                                       <div key={cap.id} className="bg-white rounded-lg border-2 border-blue-200 overflow-hidden">
                                                            <div className={`p-4 ${cap.status === "INACTIVE" ? "bg-gray-100" : "bg-blue-50"}`}>
                                                                 <div className="flex items-start gap-3">
                                                                      <button onClick={() => toggleCapacity(cap.id)} className="mt-1 p-1 hover:bg-white/50 rounded-lg transition-colors">
                                                                           {expandedCapacities.has(cap.id)
                                                                                ? <ChevronDown className="w-5 h-5 text-blue-600" />
                                                                                : <ChevronRight className="w-5 h-5 text-blue-600" />}
                                                                      </button>
                                                                      <Target className="w-5 h-5 text-blue-600 mt-1" />
                                                                      <div className="flex-1">
                                                                           <div className="flex items-center gap-2 mb-1">
                                                                                <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-bold">{cap.code}</span>
                                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cap.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                                                     {cap.status === "ACTIVE" ? "Activo" : "Inactivo"}
                                                                                </span>
                                                                                <span className="text-xs text-gray-500">{cap.performances?.length || 0} desempeños</span>
                                                                           </div>
                                                                           <h4 className="font-bold text-gray-800 text-sm mb-1">{cap.name}</h4>
                                                                           <p className="text-xs text-gray-600">{cap.description}</p>
                                                                      </div>
                                                                      <button
                                                                           onClick={() => handleToggleCapacityStatus(cap)}
                                                                           className={`p-2 rounded-lg transition-colors ${cap.status === "ACTIVE" ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}
                                                                      >
                                                                           {cap.status === "ACTIVE" ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                                                      </button>
                                                                 </div>
                                                            </div>

                                                            {expandedCapacities.has(cap.id) && (
                                                                 <div className="p-4 bg-gray-50 space-y-2">
                                                                      {cap.performances?.length === 0 ? (
                                                                           <p className="text-xs text-gray-500 text-center py-2">No hay desempeños</p>
                                                                      ) : (
                                                                           cap.performances?.map((perf) => (
                                                                                <div key={perf.id} className={`p-3 rounded-lg border ${perf.status === "INACTIVE" ? "bg-gray-100 border-gray-300" : "bg-green-50 border-green-200"}`}>
                                                                                     <div className="flex items-start gap-3">
                                                                                          <Award className="w-4 h-4 text-green-600 mt-1" />
                                                                                          <div className="flex-1">
                                                                                               <div className="flex items-center gap-2 mb-1">
                                                                                                    <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">{perf.code}</span>
                                                                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${perf.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                                                                         {perf.status === "ACTIVE" ? "Activo" : "Inactivo"}
                                                                                                    </span>
                                                                                               </div>
                                                                                               <p className="text-xs text-gray-700">{perf.description}</p>
                                                                                          </div>
                                                                                          <button
                                                                                               onClick={() => handleTogglePerformanceStatus(perf)}
                                                                                               className={`p-1 rounded-lg transition-colors ${perf.status === "ACTIVE" ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-blue-600 hover:bg-green-200"}`}
                                                                                          >
                                                                                               {perf.status === "ACTIVE" ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                                                                          </button>
                                                                                     </div>
                                                                                </div>
                                                                           ))
                                                                      )}
                                                                 </div>
                                                            )}
                                                       </div>
                                                  ))
                                             )}
                                        </div>
                                   )}
                              </div>
                         ))}
                    </div>
               )}
          </div>
     );
}