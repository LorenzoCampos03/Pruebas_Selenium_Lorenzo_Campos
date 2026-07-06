import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Brain, MessageSquare, CheckCircle, FileText, Calendar, Building2, HelpCircle, Clock } from "lucide-react";
import { useAuth } from "../../../core/auth/AuthContext";
import { usePsychology } from "../hooks/usePsychology";
import { createEmptyEvaluation, formatEvaluationForApi, EVALUATION_TYPES, EVALUATION_STATUS } from "../models/psychologyModel";
import { toastWarning, toastError, toastSuccess } from "../utils/notifications.jsx";
import { getEvaluatorName, getEvaluatorId, fetchEvaluatorFullName } from "../utils/evaluatorHelper";

const EVAL_TYPE_DESCS = {
     INICIAL:     "Primera evaluación del estudiante. Establece la línea base de su estado psicológico y emocional.",
     SEGUIMIENTO: "Evaluación de continuidad para monitorear la evolución del estudiante tras una sesión previa.",
     ESPECIAL:    "Para casos que requieren atención diferenciada o protocolos específicos fuera de lo rutinario.",
     DERIVACION:  "El caso es escalado a un especialista externo o a otra área de atención especializada.",
};

const EVAL_TYPE_LIST = [
     { value: "INICIAL",     label: "Inicial",      color: "bg-blue-100 text-blue-700",   desc: EVAL_TYPE_DESCS.INICIAL     },
     { value: "SEGUIMIENTO", label: "Seguimiento",  color: "bg-cyan-100 text-cyan-700",   desc: EVAL_TYPE_DESCS.SEGUIMIENTO },
     { value: "ESPECIAL",    label: "Especial",     color: "bg-purple-100 text-purple-700",desc: EVAL_TYPE_DESCS.ESPECIAL    },
     { value: "DERIVACION",  label: "Derivación",   color: "bg-orange-100 text-orange-700",desc: EVAL_TYPE_DESCS.DERIVACION  },
];

function EvalTypeTooltip() {
     const [open, setOpen] = useState(false);
     const [pos, setPos] = useState(null);
     const btnRef = useRef(null);

     return (
          <span className="relative inline-flex items-center">
               <button
                    type="button"
                    ref={btnRef}
                    onMouseEnter={() => {
                         if (!btnRef.current) return;
                         const r = btnRef.current.getBoundingClientRect();
                         setPos({ x: r.left + r.width / 2, y: r.top });
                         setOpen(true);
                    }}
                    onMouseLeave={() => setOpen(false)}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                    tabIndex={-1}
               >
                    <HelpCircle className="w-3.5 h-3.5" />
               </button>

               {open && pos && (
                    <EvalTypePopover x={pos.x} y={pos.y} onClose={() => setOpen(false)} />
               )}
          </span>
     );
}

function EvalTypePopover({ x, y, onClose }) {
     const [style, setStyle] = useState({ opacity: 0 });
     const popoverRef = useCallback((node) => {
          if (!node) return;
          const w = node.offsetWidth;
          const h = node.offsetHeight;
          const left = Math.max(8, Math.min(x - w / 2, window.innerWidth - w - 8));
          const top  = y - h - 10;
          setStyle({ left, top: top < 8 ? y + 24 : top, opacity: 1 });
     }, [x, y]);

     return (
          <div
               ref={popoverRef}
               onMouseLeave={onClose}
               style={{ position: "fixed", zIndex: 9999, pointerEvents: "none", ...style }}
               className="w-72 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 transition-opacity duration-100"
          >
               <p className="text-xs font-bold text-gray-700 mb-2.5 uppercase tracking-wide">Tipos de evaluación</p>
               <div className="space-y-2">
                    {EVAL_TYPE_LIST.map(t => (
                         <div key={t.value} className="flex items-start gap-2">
                              <span className={`mt-0.5 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${t.color}`}>
                                   {t.label}
                              </span>
                              <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                         </div>
                    ))}
               </div>
               <div className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-2.5 h-2.5 bg-white border-r border-b border-gray-200 rotate-45 rounded-sm" />
          </div>
     );
}

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

export default function NewEvaluationPage() {
     const { user } = useAuth();
     const navigate = useNavigate();
     const { students, institutions, classrooms, users, evaluations, createEvaluation, fetchAll, fetchStudents, fetchInstitutions, fetchClassrooms, fetchClassroomsByInstitution, fetchUsers } = usePsychology(user);
     const [currentStep, setCurrentStep] = useState(1);
     const [selectedReasonType, setSelectedReasonType] = useState("");
       const getPeruDate = () => {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" });
            const parts = formatter.formatToParts(now);
            const find = (t) => parseInt(parts.find(p => p.type === t).value, 10);
            return new Date(find("year"), find("month") - 1, find("day"));
       };
       
       const getDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
       };
      
      const today = getPeruDate();
      
       // Rango: 3 días atrás hasta hoy
       const minDate = new Date(today);
      const maxDate = new Date(today);
        minDate.setDate(minDate.getDate() - 3);
       
        const getTomorrow = () => {
             const d = new Date(today);
             d.setDate(d.getDate() + 1);
             return d;
        };
        const getMaxScheduledDate = () => {
             const d = new Date(today);
             d.setMonth(d.getMonth() + 3);
             return d;
        };
      
      // Casos comunes de evaluación
     const commonReasons = [
          "Evaluación inicial de ingreso",
          "Dificultades de aprendizaje",
          "Problemas de conducta en el aula",
          "Dificultades de adaptación social",
          "Bajo rendimiento académico",
          "Problemas emocionales o ansiedad",
          "Otros (especificar)"
     ];
     
     const [formData, setFormData] = useState(() => {
          const initial = createEmptyEvaluation();
          if (user) {
               initial.evaluatedBy = getEvaluatorId(user);
               initial.evaluatorName = getEvaluatorName(user);
               // Auto-set institution from logged-in user
               if (user.institutionId) {
                    initial.institutionId = String(user.institutionId);
               }
          }
          initial.evaluationDate = getDateString(today);
          initial.academicYear = today.getFullYear();
          initial.evaluationType = "INICIAL";
          return initial;
     });

     // Actualiza evaluatedBy/evaluatorName/institutionId cuando el user carga después del mount
     useEffect(() => {
          if (user) {
               setFormData(prev => ({
                    ...prev,
                    ...(!prev.evaluatedBy && { evaluatedBy: getEvaluatorId(user) }),
                    ...(!prev.evaluatorName && { evaluatorName: getEvaluatorName(user) }),
                    ...(!prev.institutionId && user.institutionId && { institutionId: String(user.institutionId) }),
               }));
               // Resolver nombre completo desde /api/users/me
               fetchEvaluatorFullName().then(fullName => {
                    if (fullName) setFormData(prev => ({ ...prev, evaluatorName: fullName }));
               });
          }
     }, [user]);
     const [loading, setLoading] = useState(false);

     const steps = [
          { title: "Información Básica", icon: User },
          { title: "Desarrollo", icon: Brain },
          { title: "Observaciones", icon: MessageSquare },
     ];

      useEffect(() => {
           fetchAll();
           fetchUsers();
           if (user?.institutionId) {
                fetchClassroomsByInstitution(user.institutionId);
           } else {
                fetchClassrooms();
           }
           fetchStudents();
      }, [fetchAll, fetchStudents, fetchClassrooms, fetchClassroomsByInstitution, fetchUsers, user?.institutionId]);

      // When classroom changes, reset student selection
      async function handleChange(field, value) {

          if (field === "classroomId") {
               // Validar si el aula tiene estudiantes
               if (value) {
                    const studentsInClassroom = students.filter(s => String(s.classroomId) === String(value));
                    if (studentsInClassroom.length === 0) {
                          toastWarning("Esta aula no tiene estudiantes registrados. Por favor selecciona otra aula.");
                         setFormData(prev => ({ ...prev, classroomId: "", studentId: "" }));
                         return;
                    }
               }
               setFormData(prev => ({ ...prev, classroomId: value, studentId: "" }));
               return;
          }
          if (field === "studentId") {
               // Verificar si el estudiante tiene una sesión PROGRAMADA
               const scheduledSession = evaluations.find(e => 
                    String(e.studentId) === String(value) && 
                    e.status === "SCHEDULED"
               );
               
               if (scheduledSession) {
                     toastWarning("Este estudiante ya tiene una sesión programada. Debes iniciar esa sesión antes de crear una nueva evaluación.");
                    setFormData(prev => ({ ...prev, studentId: "" }));
                    return;
               }

               // Calcular sesiones previas y sugerir tipo
               const prevSessions = evaluations.filter(e => String(e.studentId) === String(value)).length;
               let suggestedType = "INICIAL";
               if (prevSessions === 0) {
                    suggestedType = "INICIAL"; // Primera evaluación siempre es INICIAL
               } else if (prevSessions >= 6) {
                    suggestedType = "DERIVACION";
               } else if (prevSessions >= 4) {
                    suggestedType = "ESPECIAL";
               } else if (prevSessions >= 1) {
                    suggestedType = "SEGUIMIENTO";
               }
               setFormData(prev => ({ ...prev, studentId: value, evaluationType: value ? suggestedType : "INICIAL" }));
               return;
          }
           // For text fields, prevent leading spaces
           if (typeof value === 'string' && (field === 'evaluationReason' || field === 'observations' || field === 'recommendations')) {
                if (value.length > 0 && value[0] === ' ') {
                     value = value.trimStart();
                }
           }
            setFormData(prev => ({ ...prev, [field]: value }));
     }

     // Sesiones previas del estudiante seleccionado
     const studentPrevSessions = formData.studentId
          ? evaluations.filter(e => String(e.studentId) === String(formData.studentId)).length
          : 0;

     // Recalcular tipo sugerido cuando carguen las evaluaciones y haya estudiante
     useEffect(() => {
          if (!formData.studentId || evaluations.length === 0) return;
          const prev = evaluations.filter(e => String(e.studentId) === String(formData.studentId)).length;
          let suggested = "INICIAL";
          if (prev === 0) {
               suggested = "INICIAL"; // Primera evaluación siempre es INICIAL
          } else if (prev >= 6) {
               suggested = "DERIVACION";
          } else if (prev >= 4) {
               suggested = "ESPECIAL";
          } else if (prev >= 1) {
               suggested = "SEGUIMIENTO";
          }
          setFormData(f => ({ ...f, evaluationType: suggested }));
     }, [evaluations, formData.studentId]);

     function validateStep1() {
          const requiredFields = [
               formData.studentId,
               formData.classroomId,
               formData.institutionId,
               formData.evaluationDate,
               formData.evaluationType,
               selectedReasonType
          ];
          
          // Check if all required fields are filled
          if (!requiredFields.every(field => field)) {
                toastWarning("Por favor, complete todos los campos obligatorios antes de continuar.");
               return false;
          }
          
          // If "Otros" is selected, validate custom reason has at least 10 characters (excluding ALL whitespace)
          if (selectedReasonType === "Otros (especificar)") {
               const reasonWithoutSpaces = formData.evaluationReason.replace(/\s/g, '');
               if (!reasonWithoutSpaces || reasonWithoutSpaces.length < 10) {
                     toastWarning("El motivo de evaluación debe tener al menos 10 caracteres (sin contar espacios).");
                    return false;
               }
          }
          
          return true;
     }

       function validateStep2() {
            if (formData.isScheduled) return true;
            const devFields = [
                 { key: "emotionalDevelopment", label: "Desarrollo Emocional" },
                 { key: "socialDevelopment", label: "Desarrollo Social" },
                 { key: "cognitiveDevelopment", label: "Desarrollo Cognitivo" },
                 { key: "motorDevelopment", label: "Desarrollo Motor" },
            ];
            for (const field of devFields) {
                 if (!formData[field.key]) {
                       toastWarning(`El campo "${field.label}" es obligatorio.`);
                      return false;
                 }
            }
            return true;
       }

       function validateStep3() {
            if (formData.isScheduled) return true;
            // Validate observations (minimum 10 characters excluding ALL whitespace)
            const observationsWithoutSpaces = formData.observations.replace(/\s/g, '');
           if (!observationsWithoutSpaces || observationsWithoutSpaces.length < 10) {
                 toastWarning("Las observaciones deben tener al menos 10 caracteres (sin contar espacios).");
                return false;
           }
           
           // Validate recommendations (minimum 10 characters excluding ALL whitespace)
           const recommendationsWithoutSpaces = formData.recommendations.replace(/\s/g, '');
           if (!recommendationsWithoutSpaces || recommendationsWithoutSpaces.length < 10) {
                 toastWarning("Las recomendaciones deben tener al menos 10 caracteres (sin contar espacios).");
                return false;
           }
           
           // If follow-up is required, validate frequency is selected
           if (formData.requiresFollowUp && !formData.followUpFrequency) {
                 toastWarning("Por favor, seleccione la frecuencia de seguimiento.");
                return false;
           }
           
           return true;
      }

       async function handleNext() {
            // Validate Step 1 before moving to Step 2
            if (currentStep === 1 && !validateStep1()) {
                 return;
            }
            
            // When scheduled, submit directly from Step 1
            if (formData.isScheduled && currentStep === 1) {
                 await handleSubmit();
                 return;
            }
            
            // Validate Step 2 before moving to Step 3
            if (currentStep === 2 && !validateStep2()) {
                 return;
            }
             
             // Validate Step 3 before submitting
            if (currentStep === 3 && !validateStep3()) {
                 return;
            }
           
           if (currentStep < steps.length) {
                setCurrentStep(currentStep + 1);
           } else {
                await handleSubmit();
           }
      }

     function handlePrevious() {
          if (currentStep > 1) {
               setCurrentStep(currentStep - 1);
          }
     }

     async function handleSubmit() {
          setLoading(true);
          try {
               const resolvedData = { ...formData };
               const invalidNames = ["evaluator not found", "sin evaluador", ""];

                // Validación de duplicados: no permitir dos INICIAL para el mismo estudiante en el mismo año
                if (resolvedData.evaluationType === "INICIAL" && !resolvedData.isScheduled) {
                    const duplicate = evaluations.find(e =>
                         String(e.studentId) === String(resolvedData.studentId) &&
                         String(e.academicYear) === String(resolvedData.academicYear) &&
                         e.evaluationType === "INICIAL" &&
                         e.status === "ACTIVE"
                    );
                    if (duplicate) {
                          toastError(`${duplicate.studentName} ya tiene una evaluación INICIAL activa en el año ${resolvedData.academicYear}. Use el tipo Seguimiento para nuevas sesiones.`);
                         setLoading(false);
                         return;
                    }
               }

               // Garantizar evaluatedBy (ID del evaluador)
               if (!resolvedData.evaluatedBy) {
                    resolvedData.evaluatedBy = getEvaluatorId(user);
               }

               // Garantizar evaluatorName
               const nameIsInvalid = !resolvedData.evaluatorName || invalidNames.includes(resolvedData.evaluatorName.toLowerCase().trim());
               if (nameIsInvalid) {
                    if (resolvedData.evaluatedBy) {
                         const evaluator = users.find(u => String(u.id) === String(resolvedData.evaluatedBy));
                         if (evaluator) {
                              resolvedData.evaluatorName = `${evaluator.firstName || ""} ${evaluator.lastName || ""}`.trim();
                         }
                    }
                    if (!resolvedData.evaluatorName || invalidNames.includes(resolvedData.evaluatorName.toLowerCase().trim())) {
                         resolvedData.evaluatorName = getEvaluatorName(user);
                    }
               }
                 const payload = formatEvaluationForApi(resolvedData);
                 await createEvaluation(payload);

                  toastSuccess(resolvedData.isScheduled ? "Sesión programada creada exitosamente" : "Evaluación psicológica creada exitosamente");
                navigate("/psicologo/evaluaciones");
          } catch (error) {
               console.error("Error:", error);
               console.error("Error response:", error.response?.data);
                toastError(error.response?.data?.message || "No se pudo crear la evaluación");
          } finally {
               setLoading(false);
          }
     }

     return (
           <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-4 new-eval-page">
                <style>{'.new-eval-page select { appearance: none !important; -webkit-appearance: none !important; -moz-appearance: none !important; }'}</style>
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                         <div className="flex items-center gap-3 mb-3">
                              <button
                                   onClick={() => navigate("/psicologo/evaluaciones")}
                                   className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 font-medium text-sm"
                              >
                                   <ArrowLeft className="w-4 h-4" />
                                   Volver
                              </button>
                         </div>
                         <div className="flex items-center justify-between">
                              <div>
                                   <h1 className="text-2xl font-bold text-gray-900 mb-1">Nueva Evaluación Psicológica</h1>
                                   <p className="text-sm text-gray-600">Complete el formulario para registrar una nueva evaluación del estudiante</p>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                                   <Calendar className="w-4 h-4 text-gray-500" />
                                   <span className="text-xs text-gray-700 font-medium">{today.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
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
                                   <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4">
                                        <div className="flex items-center gap-3">
                                             {currentStep === 1 && <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><User className="w-5 h-5 text-white" /></div>}
                                             {currentStep === 2 && <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><Brain className="w-5 h-5 text-white" /></div>}
                                             {currentStep === 3 && <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><MessageSquare className="w-5 h-5 text-white" /></div>}
                                             <div>
                                                  <h2 className="text-xl font-bold text-white mb-0.5">
                                                       {currentStep === 1 && "Información Básica"}
                                                       {currentStep === 2 && "Áreas de Desarrollo"}
                                                       {currentStep === 3 && "Observaciones y Recomendaciones"}
                                                  </h2>
                                                  <p className="text-blue-100 text-xs">
                                                       {currentStep === 1 && "Datos generales del estudiante y contexto de la evaluación"}
                                                       {currentStep === 2 && "Evaluación detallada de las áreas de desarrollo del estudiante"}
                                                       {currentStep === 3 && "Conclusiones, recomendaciones y plan de seguimiento"}
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
                                                                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 text-sm ${
                                                                       formData.studentId ? "border-blue-300 bg-white" : "border-gray-300 bg-white"
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
                                                            {formData.studentId && studentPrevSessions > 0 && (
                                                                 <div className="mt-1.5 flex items-center gap-2">
                                                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700">
                                                                           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                                           {studentPrevSessions} sesión{studentPrevSessions !== 1 ? "es" : ""} previa{studentPrevSessions !== 1 ? "s" : ""}
                                                                      </span>
                                                                      <span className="text-xs text-gray-400">· Tipo sugerido automáticamente</span>
                                                                 </div>
                                                            )}
                                                       </div>

                                                       <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                 Aula <span className="text-red-500">*</span>
                                                            </label>
                                                             <select
                                                                  value={formData.classroomId}
                                                                  onChange={(e) => handleChange("classroomId", e.target.value)}
                                                                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                                                                       formData.classroomId ? "border-blue-300 bg-white" : "border-gray-300"
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
                                                                 Institución Educativa
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
                                                                           className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm"
                                                                      >
                                                                           <option value="">Seleccionar institución</option>
                                                                           {institutions.map(i => (
                                                                                <option key={i.id} value={i.id}>{i.name}</option>
                                                                           ))}
                                                                      </select>
                                                                 )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 ml-1">
                                                                 {formData.institutionId ? "Asignada según tu perfil" : "Selecciona tu institución"}
                                                            </p>
                                                       </div>

                                                        <div>
                                                             <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                  Fecha de Evaluación <span className="text-red-500">*</span>
                                                             </label>
                                                             <div className="relative">
                                                                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                  <input
                                                                       type="date"
                                                                       value={formData.evaluationDate}
                                                                       onChange={(e) => handleChange("evaluationDate", e.target.value)}
                                                                       min={getDateString(formData.isScheduled ? getTomorrow() : minDate)}
                                                                       max={getDateString(formData.isScheduled ? getMaxScheduledDate() : maxDate)}
                                                                       className={`w-full pl-10 pr-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                                                                            formData.evaluationDate ? "border-blue-300 bg-white" : "border-gray-300"
                                                                       }`}
                                                                  />
                                                             </div>
                                                              <p className="text-xs text-gray-500 mt-1 ml-1">
                                                                   {formData.isScheduled ? "Rango: mañana hasta 3 meses" : "Rango: 3 días atrás hasta hoy"}
                                                              </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
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
                                                            <p className="text-xs text-gray-500 mt-1 ml-1">Año académico actual</p>
                                                       </div>

                                                       <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                                                 Tipo de Evaluación <span className="text-red-500">*</span>
                                                                 <EvalTypeTooltip />
                                                            </label>
                                                             <select
                                                                  value={formData.evaluationType}
                                                                  onChange={(e) => handleChange("evaluationType", e.target.value)}
                                                                  disabled={studentPrevSessions === 0}
                                                                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 text-sm ${
                                                                       studentPrevSessions === 0
                                                                            ? "bg-gray-50 cursor-not-allowed border-gray-200"
                                                                            : formData.evaluationType 
                                                                            ? "border-blue-300 bg-white" 
                                                                            : "border-gray-300 bg-white"
                                                                  }`}
                                                            >
                                                                 <option value="">Seleccionar tipo</option>
                                                                 {EVALUATION_TYPES.map(type => (
                                                                      <option
                                                                           key={type.value}
                                                                           value={type.value}
                                                                           disabled={type.value === "INICIAL" && studentPrevSessions > 0}
                                                                      >
                                                                           {type.label}{type.value === "INICIAL" && studentPrevSessions > 0 ? " (no disponible)" : ""}
                                                                      </option>
                                                                 ))}
                                                            </select>
                                                            {formData.evaluationType && (
                                                                 <p className="mt-1.5 text-xs text-gray-500 leading-relaxed pl-1">
                                                                      {EVAL_TYPE_DESCS[formData.evaluationType]}
                                                                 </p>
                                                            )}
                                                            {studentPrevSessions === 0 && (
                                                                 <p className="mt-1.5 text-xs text-blue-600 font-medium pl-1">
                                                                      ℹ Primera evaluación - tipo INICIAL obligatorio
                                                                 </p>
                                                            )}
                                                       </div>
                                                  </div>

                                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                                                       <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-blue-600" />
                                                            Motivo de la Evaluación
                                                       </h4>
                                                       <div className="space-y-3">
                                                            <div>
                                                                 <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                      Evaluaciones Frecuentes <span className="text-red-500">*</span>
                                                                 </label>
                                                                 <select
                                                                      value={selectedReasonType}
                                                                      onChange={(e) => {
                                                                           const value = e.target.value;
                                                                           setSelectedReasonType(value);
                                                                           if (value !== "Otros (especificar)") {
                                                                                handleChange("evaluationReason", value);
                                                                           } else {
                                                                                handleChange("evaluationReason", "");
                                                                           }
                                                                      }}
                                                                      className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                                                                           selectedReasonType ? "border-blue-300 bg-white" : "border-gray-300"
                                                                      }`}
                                                                 >
                                                                      <option value="">Seleccionar motivo</option>
                                                                      {commonReasons.map((reason, index) => (
                                                                           <option key={index} value={reason}>
                                                                                {reason}
                                                                           </option>
                                                                      ))}
                                                                 </select>
                                                            </div>

                                                            {selectedReasonType === "Otros (especificar)" && (
                                                                 <div>
                                                                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                           Especificar Motivo <span className="text-red-500">*</span>
                                                                      </label>
                                                                      <textarea
                                                                           value={formData.evaluationReason}
                                                                           onChange={(e) => handleChange("evaluationReason", e.target.value)}
                                                                           rows={3}
                                                                           placeholder="Describe claramente el motivo por el cual se realiza esta evaluación psicológica (mínimo 10 caracteres)..."
                                                                           className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 transition-all resize-none text-sm ${
                                                                                formData.evaluationReason.replace(/\s/g, '').length > 0 && formData.evaluationReason.replace(/\s/g, '').length < 10
                                                                                     ? "border-red-300 focus:ring-red-500 bg-red-50"
                                                                                     : formData.evaluationReason.replace(/\s/g, '').length >= 10
                                                                                     ? "border-blue-400 bg-white focus:ring-blue-500"
                                                                                     : "border-gray-300 focus:ring-blue-500 bg-white"
                                                                           }`}
                                                                      />
                                                                      <div className="flex justify-between items-center mt-1.5">
                                                                           <p className={`text-xs font-medium ${
                                                                                formData.evaluationReason.replace(/\s/g, '').length > 0 && formData.evaluationReason.replace(/\s/g, '').length < 10
                                                                                     ? "text-red-600"
                                                                                     : "text-gray-500"
                                                                           }`}>
                                                                                {formData.evaluationReason.replace(/\s/g, '').length > 0 && formData.evaluationReason.replace(/\s/g, '').length < 10
                                                                                     ? `⚠ Faltan ${10 - formData.evaluationReason.replace(/\s/g, '').length} caracteres`
                                                                                     : "✓ Mínimo 10 caracteres (sin espacios)"}
                                                                           </p>
                                                                           <p className="text-xs text-gray-500 font-medium">{formData.evaluationReason.length}/500</p>
                                                                      </div>
                                                                 </div>
                                                            )}
                                                        </div>
                                                   </div>

                                                    {/* Programar Sesión */}
                                                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
                                                         <div className="flex items-start gap-3">
                                                              <input
                                                                   type="checkbox"
                                                                   id="isScheduled"
                                                                   checked={formData.isScheduled}
                                                                   onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        setFormData(prev => ({
                                                                             ...prev,
                                                                             isScheduled: checked,
                                                                        }));
                                                                   }}
                                                                   className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 mt-0.5"
                                                              />
                                                              <div className="flex-1">
                                                                   <label htmlFor="isScheduled" className="text-sm font-bold text-gray-900 cursor-pointer flex items-center gap-2">
                                                                        <Clock className="w-4 h-4 text-amber-600" />
                                                                        Programar sesión
                                                                   </label>
                                                                   <p className="text-xs text-gray-600 mt-0.5">
                                                                        La sesión quedará agendada para una fecha futura. Los campos de desarrollo se completarán al iniciar la sesión.
                                                                   </p>
                                                              </div>
                                                         </div>
                                                    </div>

                                               </div>
                                         )}

                                           {currentStep === 2 && (
                                                    formData.isScheduled ? (
                                                         <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200 text-center">
                                                              <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                                                              <h3 className="text-sm font-bold text-gray-900 mb-2">Sesión Programada</h3>
                                                              <p className="text-xs text-gray-600 max-w-md mx-auto">
                                                                   Las áreas de desarrollo se completarán cuando se inicie la sesión programada el <span className="font-semibold text-amber-700">{formData.evaluationDate}</span>.
                                                              </p>
                                                         </div>
                                                    ) : (
                                                    <div className="space-y-4">
                                                   <div className="grid grid-cols-2 gap-4">
                                                         <div>
                                                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                   Desarrollo Emocional <span className="text-red-500">*</span>
                                                             </label>
                                                             <select
                                                                  value={formData.emotionalDevelopment}
                                                                  onChange={(e) => handleChange("emotionalDevelopment", e.target.value)}
                                                                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                                                                       formData.emotionalDevelopment ? "border-blue-300 bg-white" : "border-gray-300"
                                                                  }`}
                                                             >
                                                                  <option value="">Seleccionar nivel</option>
                                                                  <option value="ESPERADO">✓ Esperado</option>
                                                                  <option value="EN_PROCESO">⟳ En Proceso</option>
                                                                  <option value="REQUIERE_APOYO">⚠ Requiere Apoyo</option>
                                                                  <option value="NO_EVALUADO">— No Evaluado</option>
                                                             </select>
                                                        </div>

                                                        <div>
                                                             <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                  Desarrollo Social <span className="text-red-500">*</span>
                                                             </label>
                                                             <select
                                                                  value={formData.socialDevelopment}
                                                                  onChange={(e) => handleChange("socialDevelopment", e.target.value)}
                                                                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                                                                       formData.socialDevelopment ? "border-blue-300 bg-white" : "border-gray-300"
                                                                  }`}
                                                             >
                                                                  <option value="">Seleccionar nivel</option>
                                                                  <option value="ESPERADO">✓ Esperado</option>
                                                                  <option value="EN_PROCESO">⟳ En Proceso</option>
                                                                  <option value="REQUIERE_APOYO">⚠ Requiere Apoyo</option>
                                                                  <option value="NO_EVALUADO">— No Evaluado</option>
                                                             </select>
                                                        </div>
                                                   </div>

                                                   <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                             <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                  Desarrollo Cognitivo <span className="text-red-500">*</span>
                                                             </label>
                                                             <select
                                                                  value={formData.cognitiveDevelopment}
                                                                  onChange={(e) => handleChange("cognitiveDevelopment", e.target.value)}
                                                                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                                                                       formData.cognitiveDevelopment ? "border-blue-300 bg-white" : "border-gray-300"
                                                                  }`}
                                                             >
                                                                  <option value="">Seleccionar nivel</option>
                                                                  <option value="ESPERADO">✓ Esperado</option>
                                                                  <option value="EN_PROCESO">⟳ En Proceso</option>
                                                                  <option value="REQUIERE_APOYO">⚠ Requiere Apoyo</option>
                                                                  <option value="NO_EVALUADO">— No Evaluado</option>
                                                             </select>
                                                        </div>

                                                        <div>
                                                             <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                  Desarrollo Motor <span className="text-red-500">*</span>
                                                             </label>
                                                             <select
                                                                  value={formData.motorDevelopment}
                                                                  onChange={(e) => handleChange("motorDevelopment", e.target.value)}
                                                                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                                                                       formData.motorDevelopment ? "border-blue-300 bg-white" : "border-gray-300"
                                                                  }`}
                                                             >
                                                                  <option value="">Seleccionar nivel</option>
                                                                  <option value="ESPERADO">✓ Esperado</option>
                                                                  <option value="EN_PROCESO">⟳ En Proceso</option>
                                                                  <option value="REQUIERE_APOYO">⚠ Requiere Apoyo</option>
                                                                  <option value="NO_EVALUADO">— No Evaluado</option>
                                                             </select>
                                                        </div>
                                                   </div>

                                                   <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                                                        <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                             <Brain className="w-4 h-4 text-blue-600" />
                                                             Guía de Niveles de Desarrollo
                                                        </h3>
                                                        <div className="grid grid-cols-2 gap-3">
                                                             <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
                                                                  <div className="flex items-center gap-2 mb-1">
                                                                       <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                                                                            <span className="text-green-600 font-bold text-xs">✓</span>
                                                                       </div>
                                                                       <span className="font-bold text-green-700 text-xs">Esperado</span>
                                                                  </div>
                                                                  <p className="text-xs text-gray-600">Desarrollo acorde a su edad</p>
                                                             </div>
                                                             <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                                                                  <div className="flex items-center gap-2 mb-1">
                                                                       <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                            <span className="text-blue-600 font-bold text-xs">⟳</span>
                                                                       </div>
                                                                       <span className="font-bold text-blue-700 text-xs">En Proceso</span>
                                                                  </div>
                                                                  <p className="text-xs text-gray-600">Desarrollando gradualmente</p>
                                                             </div>
                                                             <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-100">
                                                                  <div className="flex items-center gap-2 mb-1">
                                                                       <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                                                                            <span className="text-orange-600 font-bold text-xs">⚠</span>
                                                                       </div>
                                                                       <span className="font-bold text-orange-700 text-xs">Requiere Apoyo</span>
                                                                  </div>
                                                                  <p className="text-xs text-gray-600">Necesita apoyo adicional</p>
                                                             </div>
                                                             <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                                                  <div className="flex items-center gap-2 mb-1">
                                                                       <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                                                                            <span className="text-gray-600 font-bold text-xs">—</span>
                                                                       </div>
                                                                       <span className="font-bold text-gray-700 text-xs">No Evaluado</span>
                                                                  </div>
                                                                  <p className="text-xs text-gray-600">No evaluado en la sesión</p>
                                                             </div>
                                                        </div>
                                                     </div>
                                                </div>
                                                )
                                           )}

                                         {currentStep === 3 && (
                                                     formData.isScheduled ? (
                                                          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200 text-center">
                                                               <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                                                               <h3 className="text-sm font-bold text-gray-900 mb-2">Sesión Programada</h3>
                                                               <p className="text-xs text-gray-600 max-w-md mx-auto">
                                                                     Las observaciones, recomendaciones y seguimiento se completarán cuando se inicie la sesión programada el <span className="font-semibold text-amber-700">{formData.evaluationDate}</span>.
                                                               </p>
                                                          </div>
                                                     ) : (
                                                    <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                             Observaciones <span className="text-red-500">*</span>
                                                       </label>
                                                       <textarea
                                                            value={formData.observations}
                                                            onChange={(e) => handleChange("observations", e.target.value)}
                                                            rows={3}
                                                            placeholder="Describe detalladamente las observaciones realizadas durante la evaluación psicológica (mínimo 10 caracteres)..."
                                                            className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 transition-all resize-none text-sm ${
                                                                 formData.observations.replace(/\s/g, '').length > 0 && formData.observations.replace(/\s/g, '').length < 10
                                                                      ? "border-red-300 focus:ring-red-500 bg-red-50"
                                                                      : formData.observations.replace(/\s/g, '').length >= 10
                                                                      ? "border-blue-400 bg-white focus:ring-blue-500"
                                                                      : "border-gray-300 bg-white focus:ring-blue-500"
                                                            }`}
                                                       />
                                                       <div className="flex justify-between items-center mt-1">
                                                            <p className={`text-xs font-medium ${
                                                                 formData.observations.replace(/\s/g, '').length > 0 && formData.observations.replace(/\s/g, '').length < 10
                                                                      ? "text-red-600"
                                                                      : "text-gray-500"
                                                            }`}>
                                                                 {formData.observations.replace(/\s/g, '').length > 0 && formData.observations.replace(/\s/g, '').length < 10
                                                                      ? `⚠ Faltan ${10 - formData.observations.replace(/\s/g, '').length} caracteres`
                                                                      : "✓ Mínimo 10 caracteres (sin espacios)"}
                                                            </p>
                                                            <p className="text-xs text-gray-500 font-medium">{formData.observations.length}/1000</p>
                                                       </div>
                                                  </div>

                                                  <div>
                                                       <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                            Recomendaciones <span className="text-red-500">*</span>
                                                       </label>
                                                       <textarea
                                                            value={formData.recommendations}
                                                            onChange={(e) => handleChange("recommendations", e.target.value)}
                                                            rows={3}
                                                            placeholder="Proporciona recomendaciones específicas para el estudiante, familia y docentes (mínimo 10 caracteres)..."
                                                            className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 transition-all resize-none text-sm ${
                                                                 formData.recommendations.replace(/\s/g, '').length > 0 && formData.recommendations.replace(/\s/g, '').length < 10
                                                                      ? "border-red-300 focus:ring-red-500 bg-red-50"
                                                                      : formData.recommendations.replace(/\s/g, '').length >= 10
                                                                      ? "border-blue-400 bg-white focus:ring-blue-500"
                                                                      : "border-gray-300 bg-white focus:ring-blue-500"
                                                            }`}
                                                       />
                                                       <div className="flex justify-between items-center mt-1">
                                                            <p className={`text-xs font-medium ${
                                                                 formData.recommendations.replace(/\s/g, '').length > 0 && formData.recommendations.replace(/\s/g, '').length < 10
                                                                      ? "text-red-600"
                                                                      : "text-gray-500"
                                                            }`}>
                                                                 {formData.recommendations.replace(/\s/g, '').length > 0 && formData.recommendations.replace(/\s/g, '').length < 10
                                                                      ? `⚠ Faltan ${10 - formData.recommendations.replace(/\s/g, '').length} caracteres`
                                                                      : "✓ Mínimo 10 caracteres (sin espacios)"}
                                                            </p>
                                                            <p className="text-xs text-gray-500 font-medium">{formData.recommendations.length}/1000</p>
                                                       </div>
                                                  </div>

                                                   <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                                                        <div className="flex items-start gap-3">
                                                             <input
                                                                  type="checkbox"
                                                                  id="requiresFollowUp"
                                                                  checked={formData.requiresFollowUp}
                                                                  onChange={(e) => handleChange("requiresFollowUp", e.target.checked)}
                                                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5"
                                                             />
                                                             <div className="flex-1">
                                                                  <label htmlFor="requiresFollowUp" className="text-sm font-bold text-gray-900 cursor-pointer">
                                                                       Requiere seguimiento psicológico
                                                                  </label>
                                                                  <p className="text-xs text-gray-600 mt-0.5">
                                                                       Marque si el estudiante necesita sesiones de seguimiento
                                                                  </p>
                                                             </div>
                                                        </div>

                                                        {formData.requiresFollowUp && (
                                                             <div className="mt-3 pt-3 border-t border-purple-200 space-y-3">
                                                                  <div>
                                                                       <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                            Frecuencia de Seguimiento <span className="text-red-500">*</span>
                                                                       </label>
                                                                       <select
                                                                            value={formData.followUpFrequency}
                                                                            onChange={(e) => handleChange("followUpFrequency", e.target.value)}
                                                                            className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm ${
                                                                                 formData.followUpFrequency ? "border-blue-300 bg-white" : "border-gray-300 bg-white"
                                                                            }`}
                                                                       >
                                                                            <option value="">Seleccionar frecuencia</option>
                                                                            <option value="SEMANAL">📅 Semanal (7 días)</option>
                                                                            <option value="QUINCENAL">📅 Quincenal (15 días)</option>
                                                                            <option value="MENSUAL">📅 Mensual (30 días)</option>
                                                                            <option value="BIMESTRAL">📅 Bimestral (60 días)</option>
                                                                            <option value="TRIMESTRAL">📅 Trimestral (90 días)</option>
                                                                   </select>
                                                                   </div>
                                                             </div>
                                                        )}
                                                   </div>

                                                   <div>
                                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                             Evaluado por <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 text-gray-700 flex items-center gap-3">
                                                             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                                  <User className="w-4 h-4 text-blue-600" />
                                                             </div>
                                                             <div>
                                                                  <div className="font-bold text-gray-900 text-sm">{formData.evaluatorName || user?.firstName || "Usuario actual"}</div>
                                                                  <div className="text-xs text-gray-500">Psicólogo(a) evaluador(a)</div>
                                                             </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1 ml-1">Evaluador asignado automáticamente según sesión activa</p>
                                                   </div>
                                                </div>
                                                )
                                           )}
                                    </div>

                                    {/* Footer */}
                                   <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
                                        <button
                                             onClick={handlePrevious}
                                             disabled={currentStep === 1}
                                             className="px-5 py-2.5 text-gray-700 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all hover:bg-white rounded-lg border border-transparent hover:border-gray-300 hover:shadow-sm text-sm"
                                        >
                                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                             </svg>
                                             Anterior
                                        </button>
                                        <div className="flex items-center gap-3">
                                             <div className="text-xs text-gray-600 font-medium">
                                                  Paso <span className="text-blue-600 font-bold">{currentStep}</span> de {steps.length}
                                             </div>
                                             <button
                                                  onClick={handleNext}
                                                  disabled={loading}
                                                  className={`px-6 py-2.5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm ${
                                                        currentStep === steps.length
                                                             ? "bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 hover:from-green-700 hover:via-green-800 hover:to-emerald-800" 
                                                            : "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800"
                                                  }`}
                                             >
                                                  {loading ? (
                                                       <>
                                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Guardando...
                                                       </>
                                                   ) : formData.isScheduled && currentStep === 1 ? (
                                                        <>
                                                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                             </svg>
                                                             Guardar Programación
                                                        </>
                                                   ) : currentStep === steps.length ? (
                                                        <>
                                                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                             </svg>
                                                             Guardar Evaluación
                                                        </>
                                                     ) : (
                                                        <>
                                                             Siguiente
                                                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                             </svg>
                                                        </>
                                                   )}
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
}
