import { useState, useRef, useEffect } from "react";
import { FormField } from "@/shared/components/form";
import {
     INCIDENT_TYPE,
     INCIDENT_TYPE_LABELS,
     SEVERITY_LEVEL,
     SEVERITY_LEVEL_LABELS,
} from "../models/disciplineModel";

export default function IncidentForm({
     formData,
     onChange,
     errors = {},
     readOnly = false,
     students = [],
     loadingStudents = false,
     reporterName = "",
}) {
     const [minDateStr] = useState(() => new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
     const [maxDateStr] = useState(() => new Date().toISOString().split("T")[0]);

     const [studentSearch, setStudentSearch] = useState("");
     const [showStudentDropdown, setShowStudentDropdown] = useState(false);
     const dropdownRef = useRef(null);

     const [otherSearch, setOtherSearch] = useState("");
     const [showOtherDropdown, setShowOtherDropdown] = useState(false);
     const otherDropdownRef = useRef(null);

 
     useEffect(() => {
          function handleClickOutside(e) {
               if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                    setShowStudentDropdown(false);
               }
               if (otherDropdownRef.current && !otherDropdownRef.current.contains(e.target)) {
                    setShowOtherDropdown(false);
               }
          }
          document.addEventListener("mousedown", handleClickOutside);
          return () => document.removeEventListener("mousedown", handleClickOutside);
     }, []);

   
     useEffect(() => {
          if (formData.studentId && students.length > 0) {
               const found = students.find((s) => s.id === formData.studentId);
               if (found) {
                    const fullName = `${found.firstName || ""} ${found.lastName || ""} ${found.motherLastName || ""}`.trim();
                    Promise.resolve().then(() => {
                         setStudentSearch(fullName);
                    });
               }
          }
     }, [formData.studentId, students]);

     const filteredStudents = students.filter((s) => {
          if (!studentSearch) return true;
          const term = studentSearch.toLowerCase();
          const fullName = `${s.firstName || ""} ${s.lastName || ""} ${s.motherLastName || ""}`.toLowerCase();
          const doc = (s.documentNumber || "").toLowerCase();
          const cui = (s.cui || "").toLowerCase();
          return fullName.includes(term) || doc.includes(term) || cui.includes(term);
     });

 
     const selectedOtherIds = formData.otherStudentsInvolved || [];
     const filteredOtherStudents = students.filter((s) => {
          if (s.id === formData.studentId) return false;
          if (selectedOtherIds.includes(s.id)) return false;
          if (!otherSearch) return true;
          const term = otherSearch.toLowerCase();
          const fullName = `${s.firstName || ""} ${s.lastName || ""} ${s.motherLastName || ""}`.toLowerCase();
          const doc = (s.documentNumber || "").toLowerCase();
          const cui = (s.cui || "").toLowerCase();
          return fullName.includes(term) || doc.includes(term) || cui.includes(term);
     });

     function getStudentFullName(studentId) {
          const s = students.find((st) => st.id === studentId);
          if (!s) return studentId;
          return `${s.firstName || ""} ${s.lastName || ""} ${s.motherLastName || ""}`.trim();
     }

     function handleRemoveOtherStudent(studentId) {
          const updated = selectedOtherIds.filter((id) => id !== studentId);
          onChange("otherStudentsInvolved", updated);
     }

     function handleAddOtherStudent(studentId) {
          const updated = [...selectedOtherIds, studentId];
          onChange("otherStudentsInvolved", updated);
          setOtherSearch("");
          setShowOtherDropdown(false);
     }
     function handleChange(field, value) {
          onChange(field, value);
     }

     const inputClass = readOnly
          ? "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600"
          : "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white";

     const selectClass = readOnly
          ? "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600 appearance-none"
          : "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white";

     return (
          <div className="space-y-4">
               {/* Row 1: Fecha, Hora, Año académico */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Fecha del incidente" required error={errors.incidentDate}>
                         <input
                              type="date"
                              value={formData.incidentDate || ""}
                              onChange={(e) => handleChange("incidentDate", e.target.value)}
                              disabled={readOnly}
                              className={inputClass}
                              min={minDateStr}
                              max={maxDateStr}
                         />
                    </FormField>
                    <FormField label="Hora" required error={errors.incidentTime}>
                         <input
                              type="time"
                              value={formData.incidentTime || ""}
                              onChange={(e) => handleChange("incidentTime", e.target.value)}
                              disabled={readOnly}
                              className={inputClass}
                         />
                    </FormField>
                    <FormField label="Año académico" required error={errors.academicYear}>
                         <input
                              type="number"
                              value={formData.academicYear || ""}
                              onChange={(e) => handleChange("academicYear", e.target.value)}
                              disabled={readOnly}
                              className={inputClass}
                              min={new Date().getFullYear()}
                              max={new Date().getFullYear()}
                         />
                    </FormField>
               </div>

               {/* Row 2: Tipo, Severidad */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Tipo de incidente" required error={errors.incidentType}>
                         <select
                              value={formData.incidentType || ""}
                              onChange={(e) => handleChange("incidentType", e.target.value)}
                              disabled={readOnly}
                              className={selectClass}
                         >
                              {Object.entries(INCIDENT_TYPE).map(([key, value]) => (
                                   <option key={key} value={value}>
                                        {INCIDENT_TYPE_LABELS[value]}
                                   </option>
                              ))}
                         </select>
                    </FormField>
                    <FormField label="Nivel de severidad" required error={errors.severityLevel}>
                         <select
                              value={formData.severityLevel || ""}
                              onChange={(e) => handleChange("severityLevel", e.target.value)}
                              disabled={readOnly}
                              className={selectClass}
                         >
                              {Object.entries(SEVERITY_LEVEL).map(([key, value]) => (
                                   <option key={key} value={value}>
                                        {SEVERITY_LEVEL_LABELS[value]}
                                   </option>
                              ))}
                         </select>
                    </FormField>
               </div>

               {/* Row 3: Student (dropdown) + Reportado por (auto) */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Estudiante" required error={errors.studentId}>
                         <div className="relative" ref={dropdownRef}>
                              <input
                                   type="text"
                                   value={studentSearch}
                                   onChange={(e) => {
                                        setStudentSearch(e.target.value);
                                        setShowStudentDropdown(true);
                                        if (!e.target.value) {
                                             onChange("studentId", "");
                                             onChange("otherStudentsInvolved", []);
                                        }
                                   }}
                                   onFocus={() => setShowStudentDropdown(true)}
                                   disabled={readOnly}
                                   placeholder={loadingStudents ? "Cargando estudiantes..." : "Buscar estudiante por nombre o documento..."}
                                   className={inputClass}
                                   autoComplete="off"
                              />
                              {showStudentDropdown && !readOnly && (
                                   <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {loadingStudents ? (
                                             <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>
                                        ) : filteredStudents.length === 0 ? (
                                             <div className="px-3 py-2 text-sm text-gray-500">No se encontraron estudiantes</div>
                                        ) : (
                                             filteredStudents.map((s) => (
                                                  <button
                                                       key={s.id}
                                                       type="button"
                                                       className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors"
                                                       onClick={() => {
                                                            onChange("studentId", s.id);
                                                            setStudentSearch(
                                                                 `${s.firstName || ""} ${s.lastName || ""} ${s.motherLastName || ""}`.trim()
                                                            );
                                                            setShowStudentDropdown(false);
                                                       }}
                                                  >
                                                       <span className="font-medium">
                                                            {`${s.firstName || ""} ${s.lastName || ""} ${s.motherLastName || ""}`.trim()}
                                                       </span>
                                                       {s.documentNumber && (
                                                            <span className="text-gray-400 ml-2">— {s.documentNumber}</span>
                                                       )}
                                                  </button>
                                             ))
                                        )}
                                   </div>
                              )}
                         </div>
                    </FormField>
                    <FormField label="Reportado por" required error={errors.reportedBy}>
                         <input
                              type="text"
                              value={reporterName || formData.reportedBy || ""}
                              disabled
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600"
                         />
                    </FormField>
               </div>

               {/* Row 4: Descripción */}
               <FormField label="Descripción" required error={errors.description}>
                    <textarea
                         value={formData.description || ""}
                         onChange={(e) => handleChange("description", e.target.value)}
                         disabled={readOnly}
                         placeholder="Describa el incidente en detalle..."
                         rows={3}
                         className={`${inputClass} resize-none`}
                    />
               </FormField>

               {/* Row 5: Ubicación, Testigos */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Ubicación" required error={errors.location}>
                         <input
                              type="text"
                              value={formData.location || ""}
                              onChange={(e) => handleChange("location", e.target.value)}
                              disabled={readOnly}
                              placeholder="Ej: Patio principal, Aula 3B..."
                              className={inputClass}
                         />
                    </FormField>
                    <FormField label="Testigos" required error={errors.witnesses}>
                         <input
                              type="text"
                              value={formData.witnesses || ""}
                              onChange={(e) => handleChange("witnesses", e.target.value)}
                              disabled={readOnly}
                              placeholder="Nombres de testigos..."
                              className={inputClass}
                         />
                    </FormField>
               </div>

               {/* Row 6: Otros estudiantes involucrados */}
               <FormField label="Otros estudiantes involucrados" error={errors.otherStudentsInvolved}>
                    {/* Tags de estudiantes seleccionados */}
                    {selectedOtherIds.length > 0 && (
                         <div className="flex flex-wrap gap-2 mb-2">
                              {selectedOtherIds.map((id) => (
                                   <span
                                        key={id}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200"
                                   >
                                        {getStudentFullName(id)}
                                        {!readOnly && (
                                             <button
                                                  type="button"
                                                  onClick={() => handleRemoveOtherStudent(id)}
                                                  className="ml-0.5 text-primary-400 hover:text-primary-700 transition-colors"
                                             >
                                                  ×
                                             </button>
                                        )}
                                   </span>
                              ))}
                         </div>
                    )}
                    {/* Buscador */}
                    {!readOnly && (
                         <div className="relative" ref={otherDropdownRef}>
                              <input
                                   type="text"
                                   value={otherSearch}
                                   onChange={(e) => {
                                        setOtherSearch(e.target.value);
                                        setShowOtherDropdown(true);
                                   }}
                                   onFocus={() => setShowOtherDropdown(true)}
                                   disabled={!formData.studentId}
                                   placeholder={
                                        !formData.studentId
                                             ? "Primero debe seleccionar al estudiante principal..."
                                             : loadingStudents
                                                  ? "Cargando..."
                                                  : "Buscar estudiante para agregar..."
                                   }
                                   className={[
                                        inputClass,
                                        !formData.studentId ? "bg-gray-50 text-gray-400 cursor-not-allowed border-dashed" : ""
                                   ].join(" ")}
                                   autoComplete="off"
                              />
                              {showOtherDropdown && (
                                   <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {loadingStudents ? (
                                             <div className="px-3 py-2 text-sm text-gray-500">Cargando...</div>
                                        ) : filteredOtherStudents.length === 0 ? (
                                             <div className="px-3 py-2 text-sm text-gray-500">No se encontraron estudiantes</div>
                                        ) : (
                                             filteredOtherStudents.map((s) => (
                                                  <button
                                                       key={s.id}
                                                       type="button"
                                                       className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors"
                                                       onClick={() => handleAddOtherStudent(s.id)}
                                                  >
                                                       <span className="font-medium">
                                                            {`${s.firstName || ""} ${s.lastName || ""} ${s.motherLastName || ""}`.trim()}
                                                       </span>
                                                       {s.documentNumber && (
                                                            <span className="text-gray-400 ml-2">— {s.documentNumber}</span>
                                                       )}
                                                  </button>
                                             ))
                                        )}
                                   </div>
                              )}
                         </div>
                    )}
               </FormField>

               {/* Row 7: Acción inmediata */}
               <FormField label="Acción inmediata tomada" required error={errors.immediateAction}>
                    <textarea
                         value={formData.immediateAction || ""}
                         onChange={(e) => handleChange("immediateAction", e.target.value)}
                         disabled={readOnly}
                         placeholder="Describa la acción tomada..."
                         rows={2}
                         className={`${inputClass} resize-none`}
                    />
               </FormField>

               {/* Row 8: Checkboxes */}
               <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                         <input
                              type="checkbox"
                              checked={formData.parentsNotified || false}
                              onChange={(e) => handleChange("parentsNotified", e.target.checked)}
                              disabled={readOnly}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                         />
                         Padres notificados
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                         <input
                              type="checkbox"
                              checked={formData.followUpRequired || false}
                              onChange={(e) => handleChange("followUpRequired", e.target.checked)}
                              disabled={readOnly}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                         />
                         Requiere seguimiento
                    </label>
               </div>
          </div>
     );
}
