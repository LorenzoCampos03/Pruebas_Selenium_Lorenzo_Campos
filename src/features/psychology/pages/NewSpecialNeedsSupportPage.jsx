import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Heart, Bell, CheckCircle, FileText, Calendar, Building2 } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useSpecialNeedsSupport } from "../hooks/useSpecialNeedsSupport";
import { createEmptySupport, formatSupportForApi, SUPPORT_TYPES } from "../models/specialNeedsSupportModel";
import { alertWarning, alertError, alertCreated } from "../../../shared/components/feedback/SweetAlertService";

function StepIndicator({ currentStep, steps }) {
     return (
          <div className="space-y-2">
               {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;
                    const Icon = step.icon;
                    
                    return (
                         <div key={stepNumber} className={`relative flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                              isActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 shadow-sm" : 
                              isCompleted ? "bg-green-50/50" : "bg-white"
                         }`}>
                              <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 transition-all duration-300 ${
                                   isActive ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200" : 
                                   isCompleted ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm" : 
                                   "bg-gray-100 text-gray-400"
                              }`}>
                                   {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                   <div className={`text-xs font-bold tracking-wide ${
                                        isActive ? "text-blue-900" : isCompleted ? "text-green-800" : "text-gray-500"
                                   }`}>
                                        {step.title}
                                   </div>
                                   <div className={`text-xs mt-0.5 font-medium ${
                                        isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                                   }`}>
                                        {isCompleted ? "✓ Completado" : isActive ? "En progreso..." : "Pendiente"}
                                   </div>
                              </div>
                         </div>
                    );
               })}
               <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs mb-2">
                         <span className="text-gray-700 font-semibold">Progreso General</span>
                         <span className="text-blue-700 font-bold text-base">{Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
                         <div 
                              className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm"
                              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                         ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                         Paso {currentStep} de {steps.length}
                    </p>
               </div>
          </div>
     );
}

export default function NewSpecialNeedsSupportPage() {
     const { user } = useAuth();
     const navigate = useNavigate();
     const { students, institutions, classrooms, createSupport, fetchAll } = useSpecialNeedsSupport(user);
     const [currentStep, setCurrentStep] = useState(1);
     const [loadingData, setLoadingData] = useState(true);
     const [submitting, setSubmitting] = useState(false);
     
     const [formData, setFormData] = useState(() => createEmptySupport());

     // Estado de texto crudo para campos que se convierten a array
     const [adaptationsText, setAdaptationsText] = useState("");
     const [materialsText, setMaterialsText] = useState("");

     const steps = [
          { title: "Información Básica", icon: User },
          { title: "Detalles del Plan", icon: Heart },
          { title: "Revisión y Notificaciones", icon: Bell },
     ];

     useEffect(() => {
          async function load() {
               await fetchAll();
               setLoadingData(false);
          }
          load();
     }, [fetchAll]);

     useEffect(() => {
          if (!loadingData && user?.institutionId) {
               const inst = institutions.find(i => String(i.id) === String(user.institutionId));
               const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
               const today = new Date().toISOString().split("T")[0];
               setFormData(prev => {
                    const updated = {
                         ...prev,
                         institutionId:   String(user.institutionId),
                         institutionName: inst?.name || prev.institutionName || "",
                         diagnosedBy:     prev.diagnosedBy || fullName,
                         lastReviewDate:  prev.lastReviewDate || today,
                    };
                    if (classrooms && classrooms.length > 0 && !prev.classroomId) {
                         const institutionClassrooms = classrooms.filter(
                              c => String(c.institutionId) === String(user.institutionId)
                         );
                         if (institutionClassrooms.length > 0) {
                              updated.classroomId = String(institutionClassrooms[0].id);
                         }
                    }
                    return updated;
               });
          }
     }, [user, loadingData, classrooms, institutions]);

     function handleChange(field, value) {
          if (field === "classroomId") {
               if (value) {
                    const studentsInClassroom = students.filter(s => String(s.classroomId) === String(value));
                    if (studentsInClassroom.length === 0) {
                         alertWarning("Esta aula no tiene estudiantes registrados. Por favor selecciona otra aula.", "Aula sin estudiantes");
                         setFormData(prev => ({ ...prev, classroomId: "", studentId: "" }));
                         return;
                    }
               }
               setFormData(prev => ({ ...prev, classroomId: value, studentId: "" }));
               return;
          }
          
          if (field === "adaptationsRequired" || field === "supportMaterials") {
               const list = value.split(",").map(item => item.trim()).filter(Boolean);
               setFormData(prev => ({ ...prev, [field]: list }));
               return;
          }
                    setFormData(prev => ({ ...prev, [field]: value }));
     }

     function validateStep1() {
          const requiredFields = [
               formData.studentId,
               formData.classroomId,
               formData.institutionId,
               formData.supportType
          ];
          
          if (!requiredFields.every(field => field)) {
               alertWarning("Por favor, complete todos los campos obligatorios antes de continuar.", "Campos incompletos");
               return false;
          }
          return true;
     }

     function validateStep2() {
          if (!formData.description || !formData.description.trim()) {
               alertWarning("Por favor, complete todos los campos obligatorios antes de continuar.", "Campos incompletos");
               return false;
          }
          if (!adaptationsText.trim()) {
               alertWarning("Por favor, complete todos los campos obligatorios antes de continuar.", "Campos incompletos");
               return false;
          }
          if (!materialsText.trim()) {
               alertWarning("Por favor, complete todos los campos obligatorios antes de continuar.", "Campos incompletos");
               return false;
          }
          if (!formData.specialistInvolved || !formData.specialistInvolved.trim()) {
               alertWarning("Por favor, complete todos los campos obligatorios antes de continuar.", "Campos incompletos");
               return false;
          }
          // Convertir textos crudos a arrays antes de avanzar
          setFormData(prev => ({
               ...prev,
               adaptationsRequired: adaptationsText.split(",").map(i => i.trim()).filter(Boolean),
               supportMaterials:    materialsText.split(",").map(i => i.trim()).filter(Boolean),
          }));
          return true;
     }

     function handleNext() {
          if (currentStep === 1 && !validateStep1()) return;
          if (currentStep === 2 && !validateStep2()) return;
          if (currentStep < steps.length) {
               setCurrentStep(currentStep + 1);
          } else {
               handleSubmit();
          }
     }

     function handlePrevious() {
          if (currentStep > 1) {
               setCurrentStep(currentStep - 1);
          }
     }

     async function handleSubmit() {
          setSubmitting(true);
          try {
               const payload = formatSupportForApi(formData);
               await createSupport(payload);
               await alertCreated("Atención Especial Registrada");
               // Si tiene próxima revisión, ir a la lista filtrando revisiones pendientes
               if (formData.nextReviewDate) {
                    navigate("/psicologo/atenciones?tab=revisiones");
               } else {
                    navigate("/psicologo/atenciones");
               }
          } catch (error) {
               console.error("Error creating support:", error);
               alertError(
                    error.response?.data?.message || "No se pudo registrar la atención",
                    "Error al guardar"
               );
          } finally {
               setSubmitting(false);
          }
     }

     if (loadingData) {
          return (
               <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
                    <div className="text-center">
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                         <p className="mt-4 text-gray-600">Cargando datos...</p>
                    </div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-4">
               <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                         <div className="flex items-center gap-3 mb-3">
                              <button
                                   onClick={() => navigate("/psicologo/atenciones")}
                                   className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 font-medium text-sm"
                              >
                                   <ArrowLeft className="w-4 h-4" />
                                   Volver
                              </button>
                         </div>
                         <div className="flex items-center justify-between">
                              <div>
                                   <h1 className="text-2xl font-bold text-gray-900 mb-1">Nueva Atención Especial</h1>
                                   <p className="text-sm text-gray-600">Complete el formulario para registrar el soporte de necesidades especiales</p>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                                   <Calendar className="w-4 h-4 text-gray-500" />
                                   <span className="text-xs text-gray-700 font-medium">{new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                         {/* Sidebar - Progreso */}
                         <div className="col-span-3">
                              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sticky top-4">
                                   <div className="flex items-center gap-2 mb-4">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Progreso</h3>
                                   </div>
                                   <StepIndicator currentStep={currentStep} steps={steps} />
                              </div>
                         </div>

                         {/* Main Content */}
                         <div className="col-span-9">
                              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                   <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 px-6 py-4">
                                        <div className="flex items-center gap-3">
                                             {currentStep === 1 && <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><User className="w-5 h-5 text-white" /></div>}
                                             {currentStep === 2 && <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><Heart className="w-5 h-5 text-white" /></div>}
                                             {currentStep === 3 && <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><Bell className="w-5 h-5 text-white" /></div>}
                                             <div>
                                                  <h2 className="text-xl font-bold text-white mb-0.5">
                                                       {currentStep === 1 && "Información Básica"}
                                                       {currentStep === 2 && "Detalles del Plan"}
                                                       {currentStep === 3 && "Revisión y Notificaciones"}
                                                  </h2>
                                                  <p className="text-emerald-100 text-xs">
                                                       {currentStep === 1 && "Datos generales del estudiante e institución"}
                                                       {currentStep === 2 && "Descripción de adaptaciones y necesidades"}
                                                       {currentStep === 3 && "Fechas de seguimiento y opciones de notificación"}
                                                  </p>
                                             </div>
                                        </div>
                                   </div>

                                   <div className="p-6">
                                        {currentStep === 1 && (
                                             <div className="space-y-4">
                                                  <div className="grid grid-cols-2 gap-4">
                                                       <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                 Estudiante <span className="text-red-500">*</span>
                                                            </label>
                                                            <select
                                                                 value={formData.studentId}
                                                                 onChange={(e) => handleChange("studentId", e.target.value)}
                                                                 disabled={!formData.classroomId}
                                                                 className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 text-sm ${
                                                                      formData.studentId ? "border-emerald-300 bg-white" : "border-gray-300 bg-white"
                                                                 } ${!formData.classroomId ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
                                                            >
                                                                 <option value="">
                                                                      {formData.classroomId ? "Seleccionar estudiante" : "Primero selecciona un aula"}
                                                                 </option>
                                                                 {students
                                                                      .filter(s => !formData.classroomId || String(s.classroomId) === String(formData.classroomId))
                                                                      .map(student => (
                                                                           <option key={student.id} value={student.id}>
                                                                                {student.firstName} {student.lastName}
                                                                           </option>
                                                                      ))
                                                                 }
                                                            </select>
                                                       </div>

                                                       <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                 Aula <span className="text-red-500">*</span>
                                                            </label>
                                                            <select
                                                                 value={formData.classroomId}
                                                                 onChange={(e) => handleChange("classroomId", e.target.value)}
                                                                 className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                                                                      formData.classroomId ? "border-emerald-300 bg-white" : "border-gray-300"
                                                                 }`}
                                                            >
                                                                 <option value="">Seleccionar aula</option>
                                                                 {classrooms.map(classroom => (
                                                                      <option key={classroom.id} value={classroom.id}>
                                                                           {classroom.classroomName}
                                                                      </option>
                                                                 ))}
                                                            </select>
                                                       </div>
                                                  </div>

                                                  <div className="grid grid-cols-2 gap-4">
                                                       <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                 Institución Educativa <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                 <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                 {formData.institutionId ? (
                                                                      <input
                                                                           type="text"
                                                                           readOnly
                                                                           value={(() => {
                                                                                const found = institutions.find(i => String(i.id) === String(formData.institutionId));
                                                                                return found ? found.name : formData.institutionId;
                                                                           })()}
                                                                           className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-lg text-gray-700 text-sm cursor-not-allowed"
                                                                      />
                                                                 ) : (
                                                                      <select
                                                                           value={formData.institutionId}
                                                                           onChange={(e) => handleChange("institutionId", e.target.value)}
                                                                           className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 text-sm"
                                                                      >
                                                                           <option value="">Seleccionar institución</option>
                                                                           {institutions.map(i => (
                                                                                <option key={i.id} value={i.id}>{i.name}</option>
                                                                           ))}
                                                                      </select>
                                                                 )}
                                                            </div>
                                                       </div>

                                                       <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                 Año Académico <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                 type="number"
                                                                 value={formData.academicYear}
                                                                 readOnly
                                                                 className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed text-sm"
                                                            />
                                                       </div>
                                                  </div>

                                                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                                       <div className="col-span-2">
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                 Tipo de Soporte <span className="text-red-500">*</span>
                                                            </label>
                                                            <select
                                                                 value={formData.supportType}
                                                                 onChange={(e) => handleChange("supportType", e.target.value)}
                                                                 className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                                                                      formData.supportType ? "border-emerald-300 bg-white" : "border-gray-300"
                                                                 }`}
                                                            >
                                                                 <option value="">Seleccionar tipo</option>
                                                                 {SUPPORT_TYPES.map(type => (
                                                                      <option key={type.value} value={type.value}>{type.label}</option>
                                                                 ))}
                                                            </select>
                                                       </div>
                                                  </div>

                                                  <div className="grid grid-cols-2 gap-4">
                                                       <div className="col-span-2">
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Diagnóstico Oficial (Opcional)</label>
                                                            <input
                                                                 type="text"
                                                                 value={formData.diagnosis || ""}
                                                                 onChange={(e) => handleChange("diagnosis", e.target.value)}
                                                                 placeholder="Ej: Trastorno del Espectro Autista"
                                                                 className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm"
                                                            />
                                                       </div>
                                                       <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha de Diagnóstico</label>
                                                            <input
                                                                 type="date"
                                                                 value={formData.diagnosisDate || ""}
                                                                 onChange={(e) => handleChange("diagnosisDate", e.target.value)}
                                                                 max={new Date().toISOString().split("T")[0]}
                                                                 className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm"
                                                            />
                                                       </div>
                                                       <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Diagnosticado Por</label>
                                                            <input
                                                                 type="text"
                                                                 value={formData.diagnosedBy || ""}
                                                                 onChange={(e) => handleChange("diagnosedBy", e.target.value)}
                                                                 placeholder="Ej: Dr. Juan Pérez"
                                                                 className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm"
                                                            />
                                                       </div>
                                                  </div>
                                             </div>
                                        )}

                                        {currentStep === 2 && (
                                             <div className="space-y-4">
                                                  <div>
                                                       <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción de Necesidades <span className="text-red-500">*</span></label>
                                                       <textarea
                                                            value={formData.description || ""}
                                                            onChange={(e) => handleChange("description", e.target.value)}
                                                            rows={3}
                                                            placeholder="Describa brevemente las necesidades del estudiante..."
                                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                                                       />
                                                  </div>

                                                  <div>
                                                       <label className="block text-xs font-semibold text-gray-700 mb-1.5">Adaptaciones Requeridas (separadas por coma) <span className="text-red-500">*</span></label>
                                                       <textarea
                                                            value={adaptationsText}
                                                            onChange={(e) => setAdaptationsText(e.target.value)}
                                                            rows={2}
                                                            placeholder="Ej: Tiempo extra, Ubicación frontal..."
                                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                                                       />
                                                  </div>

                                                  <div>
                                                       <label className="block text-xs font-semibold text-gray-700 mb-1.5">Materiales de Apoyo (separados por coma) <span className="text-red-500">*</span></label>
                                                       <textarea
                                                            value={materialsText}
                                                            onChange={(e) => setMaterialsText(e.target.value)}
                                                            rows={2}
                                                            placeholder="Ej: Cojín sensorial, Audífonos..."
                                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                                                       />
                                                  </div>

                                                  <div>
                                                       <label className="block text-xs font-semibold text-gray-700 mb-1.5">Especialista Externo Involucrado <span className="text-red-500">*</span></label>
                                                       <input
                                                            type="text"
                                                            value={formData.specialistInvolved || ""}
                                                            onChange={(e) => handleChange("specialistInvolved", e.target.value)}
                                                            placeholder="Ej: Terapeuta ocupacional"
                                                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm"
                                                       />
                                                  </div>
                                             </div>
                                        )}

                                        {currentStep === 3 && (
                                             <div className="space-y-6">
                                                  <div className="grid grid-cols-2 gap-4">
                                                       <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha de Última Revisión</label>
                                                            <input
                                                                 type="date"
                                                                 value={formData.lastReviewDate || ""}
                                                                 onChange={(e) => handleChange("lastReviewDate", e.target.value)}
                                                                 max={new Date().toISOString().split("T")[0]}
                                                                 readOnly
                                                                 className="w-full px-3 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-lg text-gray-700 cursor-not-allowed text-sm"
                                                            />
                                                       </div>
                                                       <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Próxima Revisión</label>
                                                            <input
                                                                 type="date"
                                                                 value={formData.nextReviewDate || ""}
                                                                 onChange={(e) => handleChange("nextReviewDate", e.target.value)}
                                                                 min={new Date().toISOString().split("T")[0]}
                                                                 className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm"
                                                            />
                                                       </div>
                                                  </div>

                                                  <div>
                                                       <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notas de Progreso</label>
                                                       <textarea
                                                            value={formData.progressNotes || ""}
                                                            onChange={(e) => handleChange("progressNotes", e.target.value)}
                                                            rows={3}
                                                            placeholder="Notas sobre el avance del estudiante..."
                                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                                                       />
                                                  </div>

                                                  <div className="bg-emerald-50 p-5 border border-emerald-100 rounded-xl space-y-4">
                                                       <h3 className="text-sm font-bold text-emerald-900 border-b border-emerald-200 pb-2 flex items-center gap-2">
                                                            <Bell className="w-4 h-4 text-emerald-600" />
                                                            Configuración de Notificaciones
                                                       </h3>
                                                       
                                                       <div className="space-y-3">
                                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border border-emerald-200 rounded-lg shadow-sm w-fit hover:bg-emerald-50 transition-colors">
                                                                 <input
                                                                      type="checkbox"
                                                                      checked={formData.notifyParents || false}
                                                                      onChange={(e) => handleChange("notifyParents", e.target.checked)}
                                                                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                                 />
                                                                 <span className="text-sm font-semibold text-emerald-900">Notificar a los apoderados / padres de familia</span>
                                                            </label>

                                                            {formData.notifyParents && (
                                                                 <div className="pl-6 space-y-4 border-l-2 border-emerald-200 ml-2 mt-2">
                                                                      <div className="space-y-2">
                                                                           <label className="block text-xs font-semibold text-gray-700">Canales de envío</label>
                                                                           <div className="flex gap-4">
                                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                                     <input
                                                                                          type="checkbox"
                                                                                          checked={formData.notificationChannels?.includes("EMAIL")}
                                                                                          onChange={(e) => {
                                                                                               const channels = new Set(formData.notificationChannels || []);
                                                                                               if (e.target.checked) channels.add("EMAIL");
                                                                                               else channels.delete("EMAIL");
                                                                                               handleChange("notificationChannels", Array.from(channels));
                                                                                          }}
                                                                                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                                                     />
                                                                                     <span className="text-sm text-gray-700">Email</span>
                                                                                </label>
                                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                                     <input
                                                                                          type="checkbox"
                                                                                          checked={formData.notificationChannels?.includes("WHATSAPP")}
                                                                                          onChange={(e) => {
                                                                                               const channels = new Set(formData.notificationChannels || []);
                                                                                               if (e.target.checked) channels.add("WHATSAPP");
                                                                                               else channels.delete("WHATSAPP");
                                                                                               handleChange("notificationChannels", Array.from(channels));
                                                                                          }}
                                                                                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                                                     />
                                                                                     <span className="text-sm text-gray-700">WhatsApp</span>
                                                                                </label>
                                                                           </div>
                                                                      </div>

                                                                      <div>
                                                                           <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mensaje Personalizado (Opcional)</label>
                                                                           <textarea
                                                                                value={formData.customMessage || ""}
                                                                                onChange={(e) => handleChange("customMessage", e.target.value)}
                                                                                rows={2}
                                                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                                                                           />
                                                                           <p className="text-xs text-gray-500 mt-1">Si se deja en blanco, se enviará una notificación con el formato estándar.</p>
                                                                      </div>

                                                                      <label className="flex items-center gap-2 cursor-pointer mt-2">
                                                                           <input
                                                                                type="checkbox"
                                                                                checked={formData.sendImmediately || false}
                                                                                onChange={(e) => handleChange("sendImmediately", e.target.checked)}
                                                                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                                                           />
                                                                           <span className="text-sm font-semibold text-gray-800">¡Enviar notificación en este momento!</span>
                                                                      </label>
                                                                 </div>
                                                            )}
                                                       </div>
                                                  </div>
                                             </div>
                                        )}
                                   </div>

                                   {/* Footer Navigation */}
                                   <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                        {currentStep > 1 ? (
                                             <button
                                                  onClick={handlePrevious}
                                                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                             >
                                                  Anterior
                                             </button>
                                        ) : (
                                             <div></div> // Empty div for spacing
                                        )}
                                        
                                        <button
                                             onClick={handleNext}
                                             disabled={submitting}
                                             className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-sm flex items-center gap-2 ${
                                                  submitting ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 hover:shadow"
                                             }`}
                                        >
                                             {currentStep < steps.length ? (
                                                  "Siguiente Paso"
                                             ) : (
                                                  submitting ? "Guardando..." : "Guardar Soporte Especial"
                                             )}
                                        </button>
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
}