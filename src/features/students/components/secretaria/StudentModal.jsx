import { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Button } from "@/shared/components/ui";
import StudentForm from "../shared/StudentForm";
import GuardianForm from "../shared/GuardianForm";
import { createEmptyStudent, formatStudentForApi, formatStudentUpdateForApi } from "../../models/studentModel";
import { createEmptyGuardian, formatGuardianForApi } from "../../models/guardianModel";
import { alertApiError } from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { validateStudentForm, validateGuardianForm, isValidCUI, isValidDocumentNumber, isValidPhone, isValidEmail } from "@/core/utils/validators";
import { studentService } from "../../services/studentService";
import { guardianService } from "../../services/guardianService";
import { classroomService } from "../../services/classroomService";
import { ChevronRight, ChevronLeft, Plus, Trash2, UserPlus, Check, Camera } from "lucide-react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

const STEPS = [
     { number: 1, label: "Estudiante" },
     { number: 2, label: "Apoderados" },
];

function getClassroomLabel(classroom) {
     const name = classroom?.classroomName || classroom?.name || "Aula";
     const age = classroom?.classroomAge || classroom?.age || "";
     return age ? `${name} (${age})` : name;
}

function StepIndicator({ currentStep, completedSteps }) {
     return (
          <div className="flex items-center justify-center gap-2 pb-4 border-b border-gray-100 mb-4">
               {STEPS.map((step, idx) => {
                    const isActive = currentStep === step.number;
                    const isCompleted = completedSteps.includes(step.number);
                    return (
                         <div key={step.number} className="flex items-center">
                              {idx > 0 && (
                                   <div className={`w-12 h-0.5 mx-1 ${isCompleted || isActive ? "bg-primary-400" : "bg-gray-200"}`} />
                              )}
                              <div className="flex items-center gap-2">
                                   <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isActive
                                             ? "bg-primary-500 text-white ring-4 ring-primary-100"
                                             : isCompleted
                                                  ? "bg-emerald-500 text-white"
                                                  : "bg-gray-200 text-gray-500"
                                             }`}
                                   >
                                        {isCompleted && !isActive ? <Check className="w-4 h-4" /> : step.number}
                                   </div>
                                   <span className={`text-sm font-medium ${isActive ? "text-primary-700" : "text-gray-500"}`}>
                                        {step.label}
                                   </span>
                              </div>
                         </div>
                    );
               })}
          </div>
     );
}

export default function StudentModal({
     isOpen,
     onClose,
     student = null,
     institutionId,
     onSave,
}) {
     const isEditing = !!student?.id;

     const [step, setStep] = useState(1);
     const [formData, setFormData] = useState(createEmptyStudent());
     const [guardians, setGuardians] = useState([createEmptyGuardian()]);
     const [errors, setErrors] = useState({});
     const [guardianErrors, setGuardianErrors] = useState([{}]);
     const [asyncErrors, setAsyncErrors] = useState({});
     const [asyncGuardianErrors, setAsyncGuardianErrors] = useState([{}]);
     const [siblingGuardianFields, setSiblingGuardianFields] = useState([]);
     const [saving, setSaving] = useState(false);
     const [classroomOptions, setClassroomOptions] = useState([]);
     const [loadingClassrooms, setLoadingClassrooms] = useState(false);
     const [studentPhotoFile, setStudentPhotoFile] = useState(null);
     const [studentPhotoPreview, setStudentPhotoPreview] = useState(null);
     const [guardianPhotoFiles, setGuardianPhotoFiles] = useState([null]);

     const formDataRef = useRef(formData);
     const guardiansRef = useRef(guardians);

     useEffect(() => {
          formDataRef.current = formData;
     }, [formData]);
     useEffect(() => {
          guardiansRef.current = guardians;
     }, [guardians]);

     useEffect(() => {
          if (isOpen) {
               const data = student
                    ? { ...createEmptyStudent(), ...student }
                    : { ...createEmptyStudent(), institutionId: institutionId || "" };
               setFormData(data);
               formDataRef.current = data;
               setStep(1);
               setErrors({});
               setAsyncErrors({});
               setStudentPhotoFile(null);
               setStudentPhotoPreview(student?.photoUrl || null);

               if (!student?.id && !guardians.some((g) => g.firstName?.trim())) {
                    setGuardians([createEmptyGuardian()]);
                    setGuardianErrors([{}]);
                    setAsyncGuardianErrors([{}]);
                    setGuardianPhotoFiles([null]);
                    guardiansRef.current = [createEmptyGuardian()];
               }
          }
     }, [isOpen, student, institutionId]);

     useEffect(() => {
          if (!isOpen) return;

          const currentInstitutionId = student?.institutionId || institutionId;
          if (!currentInstitutionId) {
               setClassroomOptions([]);
               return;
          }

          let cancelled = false;

          const fetchClassrooms = async () => {
               setLoadingClassrooms(true);
               try {
                    const response = await classroomService.getByInstitution(currentInstitutionId);
                    const payload = isSuccessResponse(response) ? extractData(response) : response;
                    const classrooms = Array.isArray(payload) ? payload : [];

                    const activeClassrooms = classrooms
                         .filter((classroom) => !classroom?.status || classroom.status === "ACTIVE" || classroom.status === "A")
                         .map((classroom) => ({
                              value: classroom.id,
                              label: getClassroomLabel(classroom),
                         }))
                         .sort((a, b) => a.label.localeCompare(b.label));

                    if (!cancelled) {
                         setClassroomOptions(activeClassrooms);
                    }
               } catch {
                    if (!cancelled) {
                         setClassroomOptions([]);
                    }
               } finally {
                    if (!cancelled) {
                         setLoadingClassrooms(false);
                    }
               }
          };

          fetchClassrooms();

          return () => {
               cancelled = true;
          };
     }, [isOpen, student?.institutionId, institutionId]);

     const startSiblingFlow = useCallback((prevGuardians) => {
          const newStudent = { ...createEmptyStudent(), institutionId: institutionId || "" };
          setFormData(newStudent);
          formDataRef.current = newStudent;
          setStep(1);
          setErrors({});
          setAsyncErrors({});
          const mapped = prevGuardians.map((g) => ({
               ...g,
               id: null,
               studentId: "",
          }));
          setGuardians(mapped);
          setGuardianErrors(mapped.map(() => ({})));
          setAsyncGuardianErrors(mapped.map(() => ({})));
          setGuardianPhotoFiles(mapped.map(() => null));
          setSiblingGuardianFields(mapped.map(() => new Set(["documentNumber", "phone", "whatsapp", "email"])));
          guardiansRef.current = mapped;
     }, [institutionId]);

     function handleFieldChange(field, value) {
          setFormData((prev) => {
               const updated = { ...prev, [field]: value };
               formDataRef.current = updated;
               return updated;
          });
          if (errors[field]) {
               setErrors((prev) => ({ ...prev, [field]: undefined }));
          }
          if (asyncErrors[field]) {
               setAsyncErrors((prev) => {
                    const n = { ...prev };
                    delete n[field];
                    return n;
               });
          }
     }

     function handleGuardianFieldChange(index, field, value) {
          setGuardians((prev) => {
               const updated = [...prev];
               updated[index] = { ...updated[index], [field]: value };
               guardiansRef.current = updated;
               return updated;
          });
          if (siblingGuardianFields[index]?.has(field)) {
               setSiblingGuardianFields((prev) => {
                    const updated = [...prev];
                    const newSet = new Set(updated[index]);
                    newSet.delete(field);
                    updated[index] = newSet;
                    return updated;
               });
          }
          if (guardianErrors[index]?.[field]) {
               setGuardianErrors((prev) => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], [field]: undefined };
                    return updated;
               });
          }
          if (asyncGuardianErrors[index]?.[field]) {
               setAsyncGuardianErrors((prev) => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index] };
                    delete updated[index][field];
                    return updated;
               });
          }
     }

     /* ── Validación asíncrona de unicidad (onBlur) ── */

     async function handleStudentFieldBlur(field) {
          const value = formDataRef.current[field];
          if (!value || !value.trim()) return;
          try {
               let exists = false;
               let label = "";
               if (field === "cui" && isValidCUI(value)) {
                    const res = await studentService.existsByCui(value);
                    exists = res.data;
                    label = "CUI";
               } else if (field === "documentNumber") {
                    const docType = formDataRef.current.documentType;
                    if (isValidDocumentNumber(docType, value)) {
                         const res = await studentService.existsByDocument(value);
                         exists = res.data;
                         label = "documento";
                    }
               }
               if (exists) {
                    setAsyncErrors((prev) => ({
                         ...prev,
                         [field]: `Este ${label} ya está registrado`,
                    }));
               }
          } catch {
               /* silenciar errores de red */
          }
     }

     async function handleGuardianFieldBlur(index, field) {
          if (siblingGuardianFields[index]?.has(field)) return;
          const guardian = guardiansRef.current[index];
          if (!guardian) return;
          const value = guardian[field];
          if (!value || !value.trim()) return;
          try {
               let exists = false;
               let label = "";
               if (field === "documentNumber") {
                    const docType = guardian.documentType;
                    if (isValidDocumentNumber(docType, value)) {
                         const res = await guardianService.existsByDocument(value);
                         exists = res.data;
                         label = "documento";
                    }
               } else if (field === "phone" && isValidPhone(value)) {
                    const res = await guardianService.existsByPhone(value);
                    exists = res.data;
                    label = "teléfono";
               } else if (field === "whatsapp" && isValidPhone(value)) {
                    const res = await guardianService.existsByWhatsapp(value);
                    exists = res.data;
                    label = "WhatsApp";
               } else if (field === "email" && isValidEmail(value)) {
                    const res = await guardianService.existsByEmail(value);
                    exists = res.data;
                    label = "correo";
               }
               if (exists) {
                    setAsyncGuardianErrors((prev) => {
                         const updated = [...prev];
                         while (updated.length <= index) updated.push({});
                         updated[index] = {
                              ...updated[index],
                              [field]: `Este ${label} ya está registrado`,
                         };
                         return updated;
                    });
               }
          } catch {
               /* silenciar errores de red */
          }
     }

     function addGuardian() {
          setGuardians((prev) => {
               const updated = [...prev, createEmptyGuardian()];
               guardiansRef.current = updated;
               return updated;
          });
          setGuardianErrors((prev) => [...prev, {}]);
          setAsyncGuardianErrors((prev) => [...prev, {}]);
          setGuardianPhotoFiles((prev) => [...prev, null]);
     }

     function removeGuardian(index) {
          if (guardians.length <= 1) return;
          setGuardians((prev) => {
               const updated = prev.filter((_, i) => i !== index);
               guardiansRef.current = updated;
               return updated;
          });
          setGuardianErrors((prev) => prev.filter((_, i) => i !== index));
          setAsyncGuardianErrors((prev) => prev.filter((_, i) => i !== index));
          setGuardianPhotoFiles((prev) => prev.filter((_, i) => i !== index));
     }

     function validateStep1() {
          const newErrors = validateStudentForm(formDataRef.current);
          setErrors(newErrors);
          const hasAsync = Object.keys(asyncErrors).length > 0;
          return Object.keys(newErrors).length === 0 && !hasAsync;
     }

     function validateStep2() {
          const allErrors = guardiansRef.current.map((g) => validateGuardianForm(g));
          setGuardianErrors(allErrors);
          const hasSyncErrors = !allErrors.every((e) => Object.keys(e).length === 0);
          const hasAsyncErrors = asyncGuardianErrors.some(
               (e) => e && Object.keys(e).length > 0
          );
          return !hasSyncErrors && !hasAsyncErrors;
     }

     function handleNext() {
          if (step === 1 && validateStep1()) {
               setStep(2);
          }
     }

     function handleBack() {
          if (step === 2) setStep(1);
     }

     async function handleSubmit() {
          if (isEditing) {
               if (!validateStep1()) return;
               setSaving(true);
               try {
                    await onSave(student.id, formatStudentUpdateForApi(formDataRef.current), null, studentPhotoFile, null);
                    onClose();
               } catch (err) {
                    alertApiError(err);
               } finally {
                    setSaving(false);
               }
               return;
          }

          if (!validateStep2()) return;

          setSaving(true);
          try {
               const guardiansPayload = guardiansRef.current.map((g) => formatGuardianForApi(g));
               await onSave(null, formatStudentForApi(formDataRef.current), guardiansPayload, studentPhotoFile, guardianPhotoFiles);

               const savedGuardians = [...guardiansRef.current];

               const result = await Swal.fire({
                    title: "¡Estudiante registrado!",
                    text: "¿Desea registrar otro hijo/a con los mismos apoderados?",
                    icon: "success",
                    showCancelButton: true,
                    confirmButtonColor: "#3b82f6",
                    cancelButtonColor: "#6b7280",
                    confirmButtonText: "Sí, registrar otro",
                    cancelButtonText: "No, finalizar",
               });

               if (result.isConfirmed) {
                    startSiblingFlow(savedGuardians);
               } else {
                    onClose();
               }
          } catch (err) {
               alertApiError(err);
          } finally {
               setSaving(false);
          }
     }

     const modalTitle = isEditing
          ? "Editar Estudiante"
          : `Registrar Estudiante — Paso ${step} de 2`;

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={modalTitle}
               size="xl"
          >
               <div className="space-y-4">
                    {!isEditing && (
                         <StepIndicator
                              currentStep={step}
                              completedSteps={step > 1 ? [1] : []}
                         />
                    )}

                    {(step === 1 || isEditing) && (
                         <div className="space-y-4">
                              <div className="flex flex-col items-center gap-2">
                                   <div className="relative">
                                        {studentPhotoPreview ? (
                                             <img src={studentPhotoPreview} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-primary-200" />
                                        ) : (
                                             <div className="w-20 h-20 rounded-full bg-primary-50 border-2 border-dashed border-primary-200 flex items-center justify-center">
                                                  <Camera className="w-7 h-7 text-primary-300" />
                                             </div>
                                        )}
                                   </div>
                                   <label className="cursor-pointer text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors">
                                        {studentPhotoPreview ? "Cambiar foto" : "Agregar foto del estudiante (opcional)"}
                                        <input
                                             type="file"
                                             accept="image/png,image/jpeg,image/jpg"
                                             className="hidden"
                                             onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (!file) return;
                                                  if (file.size > 5 * 1024 * 1024) { toast.error("La foto no debe superar 5MB"); return; }
                                                  setStudentPhotoFile(file);
                                                  setStudentPhotoPreview(URL.createObjectURL(file));
                                             }}
                                        />
                                   </label>
                                   {studentPhotoPreview && (
                                        <button type="button" onClick={() => { setStudentPhotoFile(null); setStudentPhotoPreview(null); }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Quitar foto</button>
                                   )}
                              </div>
                              <StudentForm
                                   student={formData}
                                   onChange={handleFieldChange}
                                   errors={{ ...errors, ...asyncErrors }}
                                   onFieldBlur={handleStudentFieldBlur}
                                   classroomOptions={classroomOptions}
                                   loadingClassrooms={loadingClassrooms}
                              />
                         </div>
                    )}

                    {step === 2 && !isEditing && (
                         <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h3 className="text-base font-semibold text-gray-800">
                                             Apoderados ({guardians.length})
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                             Registre al menos un padre, madre o apoderado
                                        </p>
                                   </div>
                                   <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Plus}
                                        onClick={addGuardian}
                                   >
                                        Agregar
                                   </Button>
                              </div>

                              {guardians.map((guardian, index) => (
                                   <div
                                        key={index}
                                        className="relative border border-gray-200 rounded-xl p-4 bg-gray-50/50"
                                   >
                                        <div className="flex items-center justify-between mb-3">
                                             <div className="flex items-center gap-2">
                                                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                                                       <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                                                  </div>
                                                  <span className="text-sm font-semibold text-gray-700">
                                                       Apoderado {index + 1}
                                                       {guardian.relationship && (
                                                            <span className="ml-1 text-xs text-gray-400 font-normal">
                                                                 ({guardian.relationship})
                                                            </span>
                                                       )}
                                                  </span>
                                             </div>
                                             {guardians.length > 1 && (
                                                  <button
                                                       type="button"
                                                       onClick={() => removeGuardian(index)}
                                                       className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                       title="Eliminar apoderado"
                                                  >
                                                       <Trash2 className="w-4 h-4" />
                                                  </button>
                                             )}
                                        </div>

                                        <div className="flex flex-col items-center gap-1 pb-3">
                                             <div className="relative">
                                                  {guardianPhotoFiles[index] ? (
                                                       <img src={URL.createObjectURL(guardianPhotoFiles[index])} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-200" />
                                                  ) : (
                                                       <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-dashed border-emerald-200 flex items-center justify-center">
                                                            <Camera className="w-5 h-5 text-emerald-300" />
                                                       </div>
                                                  )}
                                             </div>
                                             <label className="cursor-pointer text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors">
                                                  {guardianPhotoFiles[index] ? "Cambiar foto" : "Foto del apoderado (opcional)"}
                                                  <input
                                                       type="file"
                                                       accept="image/png,image/jpeg,image/jpg"
                                                       className="hidden"
                                                       onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            if (file.size > 5 * 1024 * 1024) { toast.error("La foto no debe superar 5MB"); return; }
                                                            setGuardianPhotoFiles((prev) => {
                                                                 const updated = [...prev];
                                                                 updated[index] = file;
                                                                 return updated;
                                                            });
                                                       }}
                                                  />
                                             </label>
                                             {guardianPhotoFiles[index] && (
                                                  <button type="button" onClick={() => setGuardianPhotoFiles((prev) => { const updated = [...prev]; updated[index] = null; return updated; })} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Quitar foto</button>
                                             )}
                                        </div>
                                        <GuardianForm
                                             guardian={guardian}
                                             onChange={(field, value) => handleGuardianFieldChange(index, field, value)}
                                             errors={{ ...(guardianErrors[index] || {}), ...(asyncGuardianErrors[index] || {}) }}
                                             onFieldBlur={(field) => handleGuardianFieldBlur(index, field)}
                                        />
                                   </div>
                              ))}
                         </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                         <div>
                              {step === 2 && !isEditing && (
                                   <Button
                                        variant="ghost"
                                        icon={ChevronLeft}
                                        onClick={handleBack}
                                        disabled={saving}
                                   >
                                        Atrás
                                   </Button>
                              )}
                         </div>

                         <div className="flex items-center gap-3">
                              <Button variant="ghost" onClick={onClose} disabled={saving}>
                                   Cancelar
                              </Button>

                              {isEditing ? (
                                   <Button
                                        variant="primary"
                                        onClick={handleSubmit}
                                        loading={saving}
                                   >
                                        Guardar Cambios
                                   </Button>
                              ) : step === 1 ? (
                                   <Button
                                        variant="primary"
                                        onClick={handleNext}
                                        disabled={saving}
                                   >
                                        Siguiente
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                   </Button>
                              ) : (
                                   <Button
                                        variant="primary"
                                        onClick={handleSubmit}
                                        loading={saving}
                                   >
                                        Registrar Estudiante
                                   </Button>
                              )}
                         </div>
                    </div>
               </div>
          </Modal>
     );
}
