import { useState, useEffect } from "react";
import { Input, Select, Button } from "@/shared/components/ui";
import { FormSection } from "@/shared/components/form";
import {
     INSTITUTION_LEVELS,
     INSTITUTION_TYPES,
     INSTITUTION_GENDERS,
     GRADING_TYPES,
     CLASSROOM_TYPES,
     SCHEDULE_SHIFTS,
     createEmptyInstitution,
     createEmptySchedule,
} from "../../models/institutionModel";
import { ROLES } from "@/core/utils/constants";
import { Plus, Trash2, UploadCloud, X, Camera } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { institutionService } from "../../services/institutionService";
import { toast } from "react-hot-toast";
import { useRealTimeValidation } from "@/shared/hooks/useRealTimeValidation";
import { userService } from "@/features/users/services/userService";

const levelOptions = INSTITUTION_LEVELS.map((l) => ({ value: l, label: l }));

function getColorPickerValue(color) {
     return /^#([0-9A-Fa-f]{6})$/.test(color || "") ? color : "#2563eb";
}


export default function InstitutionForm({
     institution,
     role,
     onChange,
     errors = {},
     readOnly = false,
     availableDirectors = []
}) {
     const [form, setForm] = useState(createEmptyInstitution());
     const [isChangingDirector, setIsChangingDirector] = useState(false);
     const [directorAction, setDirectorAction] = useState("NEW");
     const [isUploading, setIsUploading] = useState(false);
     const [localErrors, setLocalErrors] = useState({});

     const docValidation = useRealTimeValidation(userService.existsByDocument);
     const emailValidation = useRealTimeValidation(userService.existsByEmail);
     const phoneValidation = useRealTimeValidation(userService.existsByPhone);

     const validateField = (fieldName, value, allDirData = form.directorData || {}) => {
          setLocalErrors((prev) => {
               const errs = { ...prev };
               
               if (fieldName === "directorData.firstName") {
                    if (!value.trim()) {
                         errs["directorData.firstName"] = "El nombre es requerido";
                    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) {
                         errs["directorData.firstName"] = "El nombre solo debe contener letras (no se permiten números ni símbolos)";
                    } else {
                         delete errs["directorData.firstName"];
                    }
               }

               if (fieldName === "directorData.lastName") {
                    if (!value.trim()) {
                         errs["directorData.lastName"] = "El apellido paterno es requerido";
                    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) {
                         errs["directorData.lastName"] = "El apellido paterno solo debe contener letras (no se permiten números ni símbolos)";
                    } else {
                         delete errs["directorData.lastName"];
                    }
               }

               if (fieldName === "directorData.motherLastName") {
                    if (value.trim() && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) {
                         errs["directorData.motherLastName"] = "El apellido materno solo debe contener letras (no se permiten números ni símbolos)";
                    } else {
                         delete errs["directorData.motherLastName"];
                    }
               }

               if (fieldName === "directorData.phone") {
                    if (value.trim()) {
                         if (!/^\d+$/.test(value)) {
                              errs["directorData.phone"] = "El celular solo debe contener números";
                         } else if (!value.startsWith("9")) {
                              errs["directorData.phone"] = "El celular debe iniciar obligatoriamente con el número 9";
                         } else if (value.length !== 9) {
                              errs["directorData.phone"] = `El celular debe tener exactamente 9 dígitos (ingresados: ${value.length}/9)`;
                         } else {
                              delete errs["directorData.phone"];
                         }
                    } else {
                         delete errs["directorData.phone"];
                    }
               }

               if (fieldName === "directorData.email") {
                    if (value.trim()) {
                         const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
                         if (!emailRegex.test(value)) {
                              errs["directorData.email"] = "El correo electrónico no es válido";
                         } else {
                              delete errs["directorData.email"];
                         }
                    } else {
                         delete errs["directorData.email"];
                    }
               }

               if (fieldName === "directorData.documentNumber") {
                    const docType = allDirData.documentType || "DNI";
                    if (docType?.toUpperCase() === 'DNI') {
                         if (!value) {
                              errs["directorData.documentNumber"] = "El DNI es requerido";
                         } else if (!/^\d+$/.test(value)) {
                              errs["directorData.documentNumber"] = "El DNI solo debe contener números";
                         } else if (value.length !== 8) {
                              errs["directorData.documentNumber"] = `El DNI debe tener exactamente 8 dígitos (ingresados: ${value.length}/8)`;
                         } else {
                              delete errs["directorData.documentNumber"];
                         }
                    } else {
                         delete errs["directorData.documentNumber"];
                    }
               }

               if (fieldName === "phone") {
                    if (value.trim()) {
                         if (!/^\d+$/.test(value)) {
                              errs.phone = "El teléfono solo debe contener números";
                         } else if (!value.startsWith("9")) {
                              errs.phone = "El teléfono debe iniciar obligatoriamente con el número 9";
                         } else if (value.length !== 9) {
                              errs.phone = `El teléfono debe tener exactamente 9 dígitos (ingresados: ${value.length}/9)`;
                         } else {
                              delete errs.phone;
                         }
                    } else {
                         delete errs.phone;
                    }
               }

               if (fieldName === "email") {
                    if (value.trim()) {
                         const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
                         if (!emailRegex.test(value)) {
                              errs.email = "El correo electrónico no es válido";
                         } else {
                              delete errs.email;
                         }
                    } else {
                         delete errs.email;
                    }
               }

               return errs;
          });
     };

     const handleLogoUpload = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setIsUploading(true);
          toast.loading("Procesando imagen...", { id: "process-logo" });
          try {
               const previewUrl = URL.createObjectURL(file);
               handleChange("logoUrl", previewUrl);
               handleChange("logoFile", file);
               toast.success("Logo listo para guardar", { id: "process-logo" });
          } catch (error) {
               console.error(error);
               toast.error("Error al procesar el logo", { id: "process-logo" });
          } finally {
               setIsUploading(false);
               e.target.value = ""; // Reset input
          }
     };

     useEffect(() => {
          if (institution) {
               setForm({ ...createEmptyInstitution(), ...institution });
          } else {
               setForm(createEmptyInstitution());
          }
     }, [institution]);

     const isAdmin = role === ROLES.ADMINISTRADOR;
     const isDirector = role === ROLES.DIRECTOR || role === ROLES.SUBDIRECTOR;
     const isCreating = !institution?.id;

     function getFieldDisabled(fieldName) {
          if (readOnly) return true;

          if (isAdmin) {
               if (isCreating) return false;
               if (!isCreating && isChangingDirector && fieldName.startsWith("directorData.")) return false;
               return fieldName !== "director";
          }

          if (isDirector) {
               return ["modularCode", "name", "codeInstitution"].includes(fieldName);
          }

          return true;
     }

     function handleChange(field, value) {
          if (["codeInstitution", "modularCode"].includes(field)) {
               if (value !== "" && !/^\d+$/.test(value)) return;
          }

          if (field === "isChangingDirector") {
               if (value === true) {
                    setForm((prev) => ({
                         ...prev,
                         director: null,
                         directorData: {
                              firstName: "",
                              lastName: "",
                              motherLastName: "",
                              documentType: "DNI",
                              documentNumber: "",
                              email: "",
                              phone: "",
                              username: "",
                         }
                    }));
               } else {
                    if (institution) {
                         setForm((prev) => ({
                              ...prev,
                              director: institution.director || "",
                              directorData: institution.directorData || prev.directorData
                         }));
                    }
               }
               setLocalErrors({});
               onChange?.("isChangingDirector", value);
               return;
          }
          if (field === "directorAction") {
               setDirectorAction(value);
               onChange?.("directorAction", value);
               return;
          }

          let finalValue = value;
          if (field === "directorData.phone") {
               const cleaned = value.replace(/\D/g, '');
               if (cleaned.startsWith('519') && cleaned.length > 9) {
                    finalValue = cleaned.slice(2);
               } else {
                    finalValue = cleaned;
               }
          }
          if (field === "phone") {
               finalValue = value.replace(/\D/g, '');
          }

          setForm((prev) => {
               if (field.startsWith("address.")) {
                    const addressField = field.split(".")[1];
                    return {
                         ...prev,
                         address: { ...prev.address, [addressField]: finalValue },
                    };
               }
               if (field.startsWith("directorData.")) {
                    const dirField = field.split(".")[1];
                    
                    if (dirField === "documentNumber") docValidation.validate(finalValue);
                    if (dirField === "email") emailValidation.validate(finalValue);
                    if (dirField === "phone") phoneValidation.validate(finalValue);
                    
                    const nextDirData = { ...prev.directorData, [dirField]: finalValue };
                    validateField(field, finalValue, nextDirData);
                    if (dirField === "documentType") {
                         validateField("directorData.documentNumber", nextDirData.documentNumber, nextDirData);
                    }
                    
                    return {
                         ...prev,
                         directorData: nextDirData,
                    };
               }
               if (["phone", "email"].includes(field)) {
                    validateField(field, finalValue);
               }
               return { ...prev, [field]: finalValue };
          });
          onChange?.(field, finalValue);
     }

     function handleScheduleChange(index, field, value) {
          setForm((prev) => {
               const schedules = [...(prev.schedules || [])];
               schedules[index] = { ...schedules[index], [field]: value };
               return { ...prev, schedules };
          });
          setForm((current) => {
               onChange?.("schedules", current.schedules);
               return current;
          });
     }

     function handleAddSchedule() {
          if ((form.schedules || []).length >= 2) {
               toast.error("Máximo 2 horarios permitidos");
               return;
          }
          setForm((prev) => {
               const schedules = [...(prev.schedules || []), createEmptySchedule()];
               return { ...prev, schedules };
          });
          setForm((current) => {
               onChange?.("schedules", current.schedules);
               return current;
          });
     }

     function handleRemoveSchedule(index) {
          setForm((prev) => {
               const schedules = (prev.schedules || []).filter((_, i) => i !== index);
               return { ...prev, schedules };
          });
          setForm((current) => {
               onChange?.("schedules", current.schedules);
               return current;
          });
     }

     return (
          <div className="space-y-6">
               {/* Datos principales */}
               <FormSection title="Datos de la Institución" description="Información principal del centro educativo">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input
                              label="Código de Institución"
                              value={form.codeInstitution}
                              onChange={(e) => handleChange("codeInstitution", e.target.value)}
                              disabled={getFieldDisabled("codeInstitution")}
                              error={errors.codeInstitution}
                              placeholder="8 dígitos (Ej: 12345678)"
                              maxLength={8}
                         />
                         <Input
                              label="Código Modular"
                              value={form.modularCode}
                              onChange={(e) => handleChange("modularCode", e.target.value)}
                              disabled={getFieldDisabled("modularCode")}
                              error={errors.modularCode}
                              placeholder="7 dígitos (Ej: 1234567)"
                              maxLength={7}
                         />
                         <Input
                              label="Nombre de la Institución"
                              value={form.name}
                              onChange={(e) => handleChange("name", e.target.value)}
                              disabled={getFieldDisabled("name")}
                              error={errors.name}
                              placeholder="Ej: I.E.I. Los Angelitos"
                         />
                         <Select
                              label="Tipo de Institución"
                              value={form.institutionType}
                              onChange={(e) => handleChange("institutionType", e.target.value)}
                              disabled={getFieldDisabled("institutionType")}
                              options={INSTITUTION_TYPES}
                              placeholder="Seleccione tipo"
                              error={errors.institutionType}
                         />
                         <Select
                              label="Nivel"
                              value={form.level}
                              onChange={(e) => handleChange("level", e.target.value)}
                              disabled={getFieldDisabled("level")}
                              options={levelOptions}
                              placeholder="Seleccione nivel"
                              error={errors.level}
                         />
                         <Select
                              label="Género"
                              value={form.gender}
                              onChange={(e) => handleChange("gender", e.target.value)}
                              disabled={getFieldDisabled("gender")}
                              options={INSTITUTION_GENDERS}
                              placeholder="Seleccione género"
                              error={errors.gender}
                         />
                         <Input
                              label="Lema / Slogan"
                              value={form.slogan}
                              onChange={(e) => handleChange("slogan", e.target.value)}
                              disabled={getFieldDisabled("slogan")}
                              error={errors.slogan}
                              placeholder="Ej: Educando con valores"
                         />
                         <div className="space-y-1.5">
                              <label className="block text-sm font-medium text-gray-700">Logo de la Institución</label>
                              <div className="flex flex-col gap-3">
                                   {form.logoUrl && (
                                        <div className="relative flex items-center gap-3 p-2 border border-gray-100 rounded-xl bg-gray-50/50">
                                             <div className="relative w-16 h-16 flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                                  <img 
                                                       src={form.logoUrl} 
                                                       alt="Vista previa del logo" 
                                                       className="w-full h-full object-contain"
                                                  />
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-medium text-gray-500 truncate">Vista previa del logo</p>
                                                  <p className="text-[10px] text-gray-400">Este es el logo que se mostrará en el sistema</p>
                                             </div>
                                             {!getFieldDisabled("logoUrl") && (
                                                  <button
                                                       type="button"
                                                       onClick={() => {
                                                            handleChange("logoUrl", null);
                                                            handleChange("logoFile", null);
                                                       }}
                                                       className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                       title="Eliminar logo"
                                                  >
                                                       <X className="w-4 h-4" />
                                                  </button>
                                             )}
                                        </div>
                                   )}
                                   
                                   {!getFieldDisabled("logoUrl") ? (
                                        <div className="relative w-full">
                                             <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={handleLogoUpload}
                                                  disabled={isUploading}
                                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                             />
                                             <button
                                                  type="button"
                                                  disabled={isUploading}
                                                  className={`flex w-full items-center justify-center gap-2 px-4 py-3 bg-primary-50 text-primary-600 border ${errors.logoUrl ? "border-red-300" : "border-primary-200"} hover:bg-primary-100 hover:border-primary-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium`}
                                             >
                                                  <UploadCloud className="w-5 h-5" />
                                                  {isUploading ? "Subiendo..." : (form.logoUrl ? "Cambiar logo de la institución" : "Subir logo de la institución")}
                                             </button>
                                        </div>
                                   ) : (
                                        !form.logoUrl && (
                                             <div className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                                                 Sin logo
                                             </div>
                                        )
                                   )}
                              </div>
                              {errors.logoUrl && <p className="text-xs text-red-500">{errors.logoUrl}</p>}
                         </div>
                         <div className="space-y-1.5">
                              <label className="block text-sm font-medium text-gray-700">Color Institucional</label>
                              <div className="flex items-center gap-3">
                                   <input
                                        type="color"
                                        value={getColorPickerValue(form.colorInstitution)}
                                        onChange={(e) => handleChange("colorInstitution", e.target.value.toUpperCase())}
                                        disabled={getFieldDisabled("colorInstitution")}
                                        className="h-12 w-16 cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-1 disabled:cursor-not-allowed disabled:opacity-60"
                                   />
                                   <input
                                        type="text"
                                        value={form.colorInstitution || ""}
                                        onChange={(e) => handleChange("colorInstitution", e.target.value)}
                                        disabled={getFieldDisabled("colorInstitution")}
                                        placeholder="Ej: #2563EB"
                                        className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm transition-all duration-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.colorInstitution ? "border-red-300 focus:ring-red-500" : "border-gray-200"}`}
                                   />
                              </div>
                              {errors.colorInstitution && <p className="text-xs text-red-500">{errors.colorInstitution}</p>}
                         </div>
                    </div>
               </FormSection>

               {/* Configuración académica */}
               <FormSection title="Configuración Académica" description="Tipo de calificación y organización de aulas">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Select
                              label="Tipo de Calificación"
                              value={form.gradingType}
                              onChange={(e) => handleChange("gradingType", e.target.value)}
                              disabled={getFieldDisabled("gradingType")}
                              options={GRADING_TYPES}
                              placeholder="Seleccione tipo"
                              error={errors.gradingType}
                         />
                         <Select
                              label="Tipo de Aula"
                              value={form.classroomType}
                              onChange={(e) => handleChange("classroomType", e.target.value)}
                              disabled={getFieldDisabled("classroomType")}
                              options={CLASSROOM_TYPES}
                              placeholder="Seleccione tipo"
                              error={errors.classroomType}
                         />
                    </div>
               </FormSection>

               {/* Gestión */}
               <FormSection title="Gestión" description={isAdmin ? "UGEL, DRE y Director" : "UGEL y DRE"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input
                              label="UGEL"
                              value={form.ugel}
                              onChange={(e) => handleChange("ugel", e.target.value)}
                              disabled={getFieldDisabled("ugel")}
                              error={errors.ugel}
                              placeholder="Ej: UGEL 05"
                         />
                         <Input
                              label="DRE"
                              value={form.dre}
                              onChange={(e) => handleChange("dre", e.target.value)}
                              disabled={getFieldDisabled("dre")}
                              error={errors.dre}
                              placeholder="Ej: DRE LIMA METROPOLITANA"
                         />
                         {isAdmin && !isCreating && (
                              <div className="flex flex-col justify-end">
                                   {isChangingDirector ? (
                                        <div className="flex flex-col gap-3">
                                             <div className="flex items-center gap-4">
                                                  <label className="flex items-center gap-2 cursor-pointer">
                                                       <input 
                                                            type="radio" 
                                                            name="directorAction" 
                                                            value="NEW" 
                                                            checked={directorAction === "NEW"} 
                                                            onChange={(e) => handleChange("directorAction", e.target.value)} 
                                                       />
                                                       <span className="text-sm">Crear Nuevo Director</span>
                                                  </label>
                                                  <label className="flex items-center gap-2 cursor-pointer">
                                                       <input 
                                                            type="radio" 
                                                            name="directorAction" 
                                                            value="EXISTING" 
                                                            checked={directorAction === "EXISTING"} 
                                                            onChange={(e) => handleChange("directorAction", e.target.value)} 
                                                       />
                                                       <span className="text-sm">Seleccionar Existente</span>
                                                  </label>
                                             </div>
                                             
                                             <div className="flex items-end gap-2">
                                                  <div className="flex-1">
                                                       {directorAction === "EXISTING" ? (
                                                            <Select
                                                                 label="Seleccione Director"
                                                                 value={form.director || ""}
                                                                 onChange={(e) => handleChange("director", e.target.value)}
                                                                 options={availableDirectors.map(d => ({ value: d.id, label: `${d.documentNumber} - ${d.firstName} ${d.lastName}` }))}
                                                                 placeholder="Seleccione un director"
                                                                 error={errors.director}
                                                            />
                                                       ) : (
                                                            <div className="text-sm text-gray-500 pb-2">
                                                                 Complete los datos del director en la sección inferior.
                                                            </div>
                                                       )}
                                                  </div>
                                                  {isAdmin && !readOnly && (
                                                       <Button type="button" variant="outline" onClick={() => { setIsChangingDirector(false); handleChange("isChangingDirector", false); }}>
                                                            Cancelar
                                                       </Button>
                                                  )}
                                             </div>
                                        </div>
                                   ) : (
                                        <div className="flex items-end gap-2">
                                             <div className="flex-1">
                                                  <Input
                                                       label="Director Actual"
                                                       value={form.directorName || form.director || "Sin director"}
                                                       disabled={true}
                                                  />
                                             </div>
                                             {isAdmin && !readOnly && (
                                                  <Button type="button" variant="primary" onClick={() => { setIsChangingDirector(true); handleChange("isChangingDirector", true); }}>
                                                       Cambiar Director
                                                  </Button>
                                             )}
                                        </div>
                                   )}
                              </div>
                         )}
                    </div>
               </FormSection>

               {isAdmin && ((isCreating && directorAction === "NEW") || 
                  (!isCreating && isChangingDirector && directorAction === "NEW") || 
                  (!isCreating && !isChangingDirector && !!form.directorData?.documentNumber)) && (
                    <FormSection 
                         title="Datos del Director" 
                         description={isCreating || isChangingDirector ? "Se creará una cuenta de director para esta institución" : "Datos del director asignado"}
                    >
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2 flex flex-col items-center gap-2 pb-2">
                                   <div className="relative">
                                        {(form.directorData?.photoPreviewUrl || form.directorData?.photoUrl) ? (
                                             <img 
                                                  src={form.directorData?.photoPreviewUrl || form.directorData?.photoUrl} 
                                                  alt="" 
                                                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200" 
                                             />
                                        ) : (
                                             <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center">
                                                  <Camera className="w-7 h-7 text-indigo-300" />
                                             </div>
                                        )}
                                   </div>
                                   {!getFieldDisabled("directorData.firstName") && (
                                        <>
                                             <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                                                  {(form.directorData?.photoPreviewUrl || form.directorData?.photoUrl) ? "Cambiar foto" : "Agregar foto (opcional)"}
                                                  <input
                                                       type="file"
                                                       accept="image/png,image/jpeg,image/jpg"
                                                       className="hidden"
                                                       onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            if (file.size > 5 * 1024 * 1024) { toast.error("La foto no debe superar 5MB"); return; }
                                                            const previewUrl = URL.createObjectURL(file);
                                                            handleChange("directorData.photoPreviewUrl", previewUrl);
                                                            handleChange("directorData.photoFile", file);
                                                       }}
                                                  />
                                             </label>
                                             {(form.directorData?.photoPreviewUrl || form.directorData?.photoUrl) && (
                                                  <button 
                                                       type="button" 
                                                       onClick={() => { 
                                                            handleChange("directorData.photoPreviewUrl", null); 
                                                            handleChange("directorData.photoFile", null); 
                                                            if (form.directorData?.photoUrl) {
                                                                 handleChange("directorData.photoUrl", null);
                                                            }
                                                       }} 
                                                       className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                                  >
                                                       Quitar foto
                                                  </button>
                                             )}
                                        </>
                                   )}
                              </div>
                              <Input
                                   label="Nombres"
                                   value={form.directorData?.firstName || ""}
                                   onChange={(e) => handleChange("directorData.firstName", e.target.value)}
                                   disabled={getFieldDisabled("directorData.firstName")}
                                   error={localErrors.firstName || errors["directorData.firstName"]}
                                   placeholder="Nombres del director"
                              />
                              <Input
                                   label="Apellido Paterno"
                                   value={form.directorData?.lastName || ""}
                                   onChange={(e) => handleChange("directorData.lastName", e.target.value)}
                                   disabled={getFieldDisabled("directorData.lastName")}
                                   error={localErrors.lastName || errors["directorData.lastName"]}
                                   placeholder="Apellido paterno del director"
                              />
                              <Input
                                   label="Apellido Materno"
                                   value={form.directorData?.motherLastName || ""}
                                   onChange={(e) => handleChange("directorData.motherLastName", e.target.value)}
                                   disabled={getFieldDisabled("directorData.motherLastName")}
                                   error={localErrors.motherLastName || errors["directorData.motherLastName"]}
                                   placeholder="Apellido materno del director"
                              />
                              <Select
                                   label="Tipo de Documento"
                                   value={form.directorData?.documentType || "DNI"}
                                   onChange={(e) => handleChange("directorData.documentType", e.target.value)}
                                   disabled={getFieldDisabled("directorData.documentType")}
                                   options={[{ value: "DNI", label: "DNI" }, { value: "CE", label: "CE" }]}
                              />
                              <Input
                                   label="Número de Documento"
                                   value={form.directorData?.documentNumber || ""}
                                   maxLength={form.directorData?.documentType?.toUpperCase() === 'DNI' ? 8 : undefined}
                                   onChange={(e) => handleChange("directorData.documentNumber", e.target.value)}
                                   disabled={getFieldDisabled("directorData.documentNumber")}
                                   error={localErrors["directorData.documentNumber"] || errors["directorData.documentNumber"] || docValidation.error}
                                   placeholder="N° de documento"
                              />
                              <Input
                                   label="Teléfono / Celular"
                                   value={form.directorData?.phone || ""}
                                   maxLength={9}
                                   onChange={(e) => handleChange("directorData.phone", e.target.value)}
                                   disabled={getFieldDisabled("directorData.phone")}
                                   error={localErrors["directorData.phone"] || errors["directorData.phone"] || phoneValidation.error}
                                   placeholder="987654321"
                              />
                              <Input
                                   label="Correo Electrónico"
                                   type="email"
                                   value={form.directorData?.email || ""}
                                   onChange={(e) => handleChange("directorData.email", e.target.value)}
                                   disabled={getFieldDisabled("directorData.email")}
                                   error={localErrors["directorData.email"] || errors["directorData.email"] || emailValidation.error}
                                   placeholder="director@institucion.edu.pe"
                              />
                         </div>
                    </FormSection>
               )}

               {/* Contacto */}
               <FormSection title="Contacto" description="Datos de comunicación">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input
                              label="Teléfono"
                              value={form.phone}
                              maxLength={9}
                              onChange={(e) => handleChange("phone", e.target.value)}
                              disabled={getFieldDisabled("phone")}
                              error={localErrors.phone || errors.phone}
                              placeholder="987654321"
                         />
                         <Input
                              label="Correo Electrónico"
                              value={form.email}
                              onChange={(e) => handleChange("email", e.target.value)}
                              disabled={getFieldDisabled("email")}
                              error={localErrors.email || errors.email}
                              placeholder="correo@institucion.edu.pe"
                         />
                    </div>
               </FormSection>

               {/* Horarios */}
               <FormSection title="Horarios" description="Turnos y horarios de atención">
                    {errors.schedules && <p className="text-sm text-red-500 mb-3">{errors.schedules}</p>}
                    {(form.schedules || []).map((schedule, index) => (
                         <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start mb-3">
                              <Select
                                   label={index === 0 ? "Turno" : ""}
                                   value={schedule.shift}
                                   onChange={(e) => handleScheduleChange(index, "shift", e.target.value)}
                                   disabled={readOnly}
                                   options={SCHEDULE_SHIFTS}
                                   placeholder="Turno"
                                   error={errors[`schedules.${index}.shift`]}
                              />
                              <Input
                                   label={index === 0 ? "Hora Inicio" : ""}
                                   type="time"
                                   value={schedule.startTime}
                                   onChange={(e) => handleScheduleChange(index, "startTime", e.target.value)}
                                   disabled={readOnly}
                                   error={errors[`schedules.${index}.startTime`]}
                              />
                              <Input
                                   label={index === 0 ? "Hora Fin" : ""}
                                   type="time"
                                   value={schedule.endTime}
                                   onChange={(e) => handleScheduleChange(index, "endTime", e.target.value)}
                                   disabled={readOnly}
                                   error={errors[`schedules.${index}.endTime`]}
                              />
                              {!readOnly && (
                                   <button
                                        type="button"
                                        onClick={() => handleRemoveSchedule(index)}
                                        className={`p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors self-start ${index === 0 ? "mt-7" : "mt-0"}`}
                                        title="Eliminar horario"
                                   >
                                        <Trash2 className="w-4 h-4" />
                                   </button>
                              )}
                         </div>
                    ))}
                    {!readOnly && (form.schedules || []).length < 2 && (
                         <button
                              type="button"
                              onClick={handleAddSchedule}
                              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium mt-1"
                         >
                              <Plus className="w-4 h-4" />
                              Agregar Horario
                         </button>
                    )}
               </FormSection>

               {/* Ubicación */}
               <FormSection title="Ubicación" description="Dirección del centro educativo">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <Input
                              label="Departamento"
                              value={form.address?.department || ""}
                              onChange={(e) => handleChange("address.department", e.target.value)}
                              disabled={getFieldDisabled("address")}
                              error={errors["address.department"]}
                              placeholder="Departamento"
                         />
                         <Input
                              label="Provincia"
                              value={form.address?.province || ""}
                              onChange={(e) => handleChange("address.province", e.target.value)}
                              disabled={getFieldDisabled("address")}
                              error={errors["address.province"]}
                              placeholder="Provincia"
                         />
                         <Input
                              label="Distrito"
                              value={form.address?.district || ""}
                              onChange={(e) => handleChange("address.district", e.target.value)}
                              disabled={getFieldDisabled("address")}
                              error={errors["address.district"]}
                              placeholder="Distrito"
                         />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                         <Input
                              label="Urbanización"
                              value={form.address?.urbanization || ""}
                              onChange={(e) => handleChange("address.urbanization", e.target.value)}
                              disabled={getFieldDisabled("address")}
                              error={errors["address.urbanization"]}
                              placeholder="Av. / Jr. / Calle, N°..."
                         />
                         <Input
                              label="Referencia"
                              value={form.address?.reference || ""}
                              onChange={(e) => handleChange("address.reference", e.target.value)}
                              disabled={getFieldDisabled("address")}
                              error={errors["address.reference"]}
                              placeholder="Frente al parque, cerca de..."
                         />
                    </div>
               </FormSection>
          </div>
     );
}
