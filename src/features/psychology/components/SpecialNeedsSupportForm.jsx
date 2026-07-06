import React, { useState } from "react";
import { Plus, X, BookOpen, Heart, FileText, Layers, Bell } from "lucide-react";
import { SUPPORT_TYPES } from "../models/specialNeedsSupportModel";

function Input({ label, value, onChange, type = "text", required = false, disabled = false }) {
     return (
          <div className="space-y-1">
               <label className="block text-xs font-semibold text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
               </label>
               <input
                    type={type}
                    value={value || ""}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all text-sm text-gray-800"
               />
          </div>
     );
}

function Select({ label, value, onChange, options, required = false, disabled = false }) {
     return (
          <div className="space-y-1">
               <label className="block text-xs font-semibold text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
               </label>
               <select
                    value={value || ""}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all text-sm text-gray-800"
               >
                    <option value="">Seleccionar...</option>
                    {options.map(opt => (
                         <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
               </select>
          </div>
     );
}

function TextArea({ label, value, onChange, rows = 3, disabled = false }) {
     return (
          <div className="space-y-1">
               <label className="block text-xs font-semibold text-gray-700">{label}</label>
               <textarea
                    value={value || ""}
                    onChange={onChange}
                    rows={rows}
                    disabled={disabled}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all text-sm text-gray-800"
               />
          </div>
     );
}

// Sleek array of tags input component
function TagsInput({ label, tags = [], onTagsChange, placeholder, disabled = false }) {
     const [inputValue, setInputValue] = useState("");

     function handleKeyDown(e) {
          if (e.key === "Enter") {
               e.preventDefault();
               addTag();
          }
     }

     function addTag() {
          const val = inputValue.trim();
          if (val && !tags.includes(val)) {
               onTagsChange([...tags, val]);
               setInputValue("");
          }
     }

     function removeTag(indexToRemove) {
          onTagsChange(tags.filter((_, index) => index !== indexToRemove));
     }

     return (
          <div className="space-y-2">
               <label className="block text-xs font-semibold text-gray-700">{label}</label>
               {!disabled && (
                    <div className="flex gap-2">
                         <input
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder={placeholder}
                              className="flex-1 px-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-800"
                         />
                         <button
                              type="button"
                              onClick={addTag}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all"
                         >
                              <Plus className="w-4 h-4" /> Agregar
                         </button>
                    </div>
               )}
               <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {tags.length === 0 ? (
                         <span className="text-xs text-gray-400 self-center">Ninguno añadido</span>
                    ) : (
                         tags.map((tag, index) => (
                              <span 
                                   key={index} 
                                   className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100"
                              >
                                   {tag}
                                   {!disabled && (
                                        <button
                                             type="button"
                                             onClick={() => removeTag(index)}
                                             className="text-blue-500 hover:text-blue-700 focus:outline-none"
                                        >
                                             <X className="w-3 h-3" />
                                        </button>
                                   )}
                              </span>
                         ))
                    )}
               </div>
          </div>
     );
}

export default function SpecialNeedsSupportForm({ 
     support, 
     onChange, 
     students = [], 
     classrooms = [], 
     institutions = [], 
     readOnly = false 
}) {
     function handleChange(field, value) {
          if (onChange) {
               onChange({ ...support, [field]: value });
          }
     }

     return (
          <div className="space-y-6">
               {/* Sección 1: Estudiante e Información del Aula */}
               <div className="bg-white p-5 border border-gray-200 rounded-xl space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                         <Heart className="w-4 h-4 text-blue-600" />
                         Información Estudiantil
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Select
                              label="Aula"
                              value={support.classroomId}
                              onChange={(e) => {
                                   const val = e.target.value;
                                   onChange({ ...support, classroomId: val, studentId: "" });
                              }}
                              options={classrooms.map(c => ({ value: String(c.id), label: c.classroomName }))}
                              required
                              disabled={readOnly}
                         />

                         <Select
                              label="Estudiante"
                              value={support.studentId}
                              onChange={(e) => handleChange("studentId", e.target.value)}
                              options={students
                                   .filter(s => !support.classroomId || String(s.classroomId) === String(support.classroomId))
                                   .map(s => ({ value: String(s.id), label: `${s.firstName} ${s.lastName}` }))
                              }
                              required
                              disabled={readOnly || !support.classroomId}
                         />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Select
                              label="Institución"
                              value={support.institutionId}
                              onChange={(e) => handleChange("institutionId", e.target.value)}
                              options={institutions.map(i => ({ value: String(i.id), label: i.name }))}
                              required
                              disabled={readOnly}
                         />

                         <Input
                              label="Año Académico"
                              type="number"
                              value={support.academicYear}
                              onChange={(e) => handleChange("academicYear", parseInt(e.target.value))}
                              required
                              disabled={readOnly}
                         />
                    </div>
               </div>

               {/* Sección 2: Diagnóstico y Apoyo */}
               <div className="bg-white p-5 border border-gray-200 rounded-xl space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                         <Layers className="w-4 h-4 text-emerald-600" />
                         Diagnóstico y Tipo de Soporte
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Select
                              label="Tipo de Soporte Especial"
                              value={support.supportType}
                              onChange={(e) => handleChange("supportType", e.target.value)}
                              options={SUPPORT_TYPES}
                              required
                              disabled={readOnly}
                         />

                         <Input
                              label="Diagnosticado Por (Ej. Psicólogo, Neurólogo, etc.)"
                              value={support.diagnosedBy}
                              onChange={(e) => handleChange("diagnosedBy", e.target.value)}
                              disabled={readOnly}
                         />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input
                              label="Fecha de Diagnóstico"
                              type="date"
                              value={support.diagnosisDate}
                              onChange={(e) => handleChange("diagnosisDate", e.target.value)}
                              disabled={readOnly}
                         />

                         <Input
                              label="Especialista Involucrado / Responsable"
                              value={support.specialistInvolved}
                              onChange={(e) => handleChange("specialistInvolved", e.target.value)}
                              disabled={readOnly}
                         />
                    </div>

                    <TextArea
                         label="Diagnóstico Oficial"
                         value={support.diagnosis}
                         onChange={(e) => handleChange("diagnosis", e.target.value)}
                         rows={2}
                         disabled={readOnly}
                    />

                    <TextArea
                         label="Descripción General de la Necesidad"
                         value={support.description}
                         onChange={(e) => handleChange("description", e.target.value)}
                         rows={2}
                         disabled={readOnly}
                    />
               </div>

               {/* Sección 3: Adaptaciones y Materiales de Apoyo */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 border border-gray-200 rounded-xl">
                         <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2 mb-3">
                              <BookOpen className="w-4 h-4 text-purple-600" />
                              Adaptaciones Curriculares
                         </h3>
                         <TagsInput
                              label="Adaptaciones Requeridas"
                              tags={support.adaptationsRequired}
                              onTagsChange={(newTags) => handleChange("adaptationsRequired", newTags)}
                              placeholder="Escribe y presiona agregar..."
                              disabled={readOnly}
                         />
                    </div>

                    <div className="bg-white p-5 border border-gray-200 rounded-xl">
                         <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2 mb-3">
                              <FileText className="w-4 h-4 text-amber-600" />
                              Materiales de Apoyo
                         </h3>
                         <TagsInput
                              label="Materiales de Apoyo Requeridos"
                              tags={support.supportMaterials}
                              onTagsChange={(newTags) => handleChange("supportMaterials", newTags)}
                              placeholder="Escribe y presiona agregar..."
                              disabled={readOnly}
                         />
                    </div>
               </div>

               {/* Sección 4: Progreso y Fechas de Revisión */}
               <div className="bg-white p-5 border border-gray-200 rounded-xl space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                         <Layers className="w-4 h-4 text-teal-600" />
                         Progreso y Revisiones
                    </h3>
                    <TextArea
                         label="Notas de Progreso / Seguimiento"
                         value={support.progressNotes}
                         onChange={(e) => handleChange("progressNotes", e.target.value)}
                         rows={3}
                         disabled={readOnly}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input
                              label="Fecha de Última Revisión"
                              type="date"
                              value={support.lastReviewDate}
                              onChange={(e) => handleChange("lastReviewDate", e.target.value)}
                              disabled={readOnly}
                         />

                         <Input
                              label="Fecha de Próxima Revisión"
                              type="date"
                              value={support.nextReviewDate}
                              onChange={(e) => handleChange("nextReviewDate", e.target.value)}
                              disabled={readOnly}
                         />
                    </div>
               </div>

               {/* Sección 5: Notificaciones */}
               <div className="bg-blue-50 p-5 border border-blue-100 rounded-xl space-y-4">
                    <h3 className="text-sm font-bold text-blue-900 border-b border-blue-200 pb-2 flex items-center gap-2">
                         <Bell className="w-4 h-4 text-blue-600" />
                         Configuración de Notificaciones
                    </h3>
                    
                    <div className="space-y-3">
                         <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border border-blue-200 rounded-lg shadow-sm w-fit hover:bg-blue-50 transition-colors">
                              <input
                                   type="checkbox"
                                   checked={support.notifyParents || false}
                                   onChange={(e) => handleChange("notifyParents", e.target.checked)}
                                   disabled={readOnly}
                                   className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-semibold text-blue-900">Notificar a los apoderados / padres de familia</span>
                         </label>

                         {support.notifyParents && (
                              <div className="pl-6 space-y-4 border-l-2 border-blue-200 ml-2 mt-2">
                                   <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-gray-700">Canales de envío</label>
                                        <div className="flex gap-4">
                                             <label className="flex items-center gap-2 cursor-pointer">
                                                  <input
                                                       type="checkbox"
                                                       checked={support.notificationChannels?.includes("EMAIL")}
                                                       onChange={(e) => {
                                                            const channels = new Set(support.notificationChannels || []);
                                                            if (e.target.checked) channels.add("EMAIL");
                                                            else channels.delete("EMAIL");
                                                            handleChange("notificationChannels", Array.from(channels));
                                                       }}
                                                       disabled={readOnly}
                                                       className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                  />
                                                  <span className="text-sm text-gray-700">Email</span>
                                             </label>
                                             <label className="flex items-center gap-2 cursor-pointer">
                                                  <input
                                                       type="checkbox"
                                                       checked={support.notificationChannels?.includes("WHATSAPP")}
                                                       onChange={(e) => {
                                                            const channels = new Set(support.notificationChannels || []);
                                                            if (e.target.checked) channels.add("WHATSAPP");
                                                            else channels.delete("WHATSAPP");
                                                            handleChange("notificationChannels", Array.from(channels));
                                                       }}
                                                       disabled={readOnly}
                                                       className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                  />
                                                  <span className="text-sm text-gray-700">WhatsApp</span>
                                             </label>
                                        </div>
                                   </div>

                                   <TextArea
                                        label="Mensaje Personalizado (Opcional)"
                                        value={support.customMessage || ""}
                                        onChange={(e) => handleChange("customMessage", e.target.value)}
                                        rows={2}
                                        disabled={readOnly}
                                   />
                                   <p className="text-xs text-gray-500 -mt-1">
                                        Si se deja en blanco, se enviará una notificación con el formato estándar.
                                   </p>

                                   <label className="flex items-center gap-2 cursor-pointer mt-2">
                                        <input
                                             type="checkbox"
                                             checked={support.sendImmediately || false}
                                             onChange={(e) => handleChange("sendImmediately", e.target.checked)}
                                             disabled={readOnly}
                                             className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                        />
                                        <span className="text-sm font-semibold text-gray-800">
                                             ¡Enviar notificación en este momento!
                                        </span>
                                   </label>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
}