import { EVALUATION_TYPES, FOLLOW_UP_FREQUENCIES } from "../models/psychologyModel";
import { formatDateToSpanish } from "../utils/dateFormatter";

function Input({ label, value, onChange, type = "text", required = false, disabled = false }) {
     return (
          <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
               </label>
               <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
               />
          </div>
     );
}

function Select({ label, value, onChange, options, required = false, disabled = false }) {
     return (
          <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
               </label>
               <select
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
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
          <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
               <textarea
                    value={value}
                    onChange={onChange}
                    rows={rows}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
               />
          </div>
     );
}

function Checkbox({ label, checked, onChange, disabled = false }) {
     return (
          <label className="flex items-center gap-2 cursor-pointer">
               <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
               />
               <span className="text-sm font-medium text-gray-700">{label}</span>
          </label>
     );
}

export default function EvaluationForm({ evaluation, onChange, readOnly = false }) {
     function handleChange(field, value) {
          onChange({ ...evaluation, [field]: value });
     }

     return (
          <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                         label="ID del Estudiante"
                         value={evaluation.studentId || ""}
                         onChange={(e) => handleChange("studentId", e.target.value)}
                         required
                         disabled={readOnly}
                    />
                    {readOnly ? (
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Fecha de Evaluación <span className="text-red-500">*</span>
                              </label>
                              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                                   {formatDateToSpanish(evaluation.evaluationDate)}
                              </div>
                         </div>
                    ) : (
                         <Input
                              label="Fecha de Evaluación"
                              type="date"
                              value={evaluation.evaluationDate || ""}
                              onChange={(e) => handleChange("evaluationDate", e.target.value)}
                              required
                              disabled={readOnly}
                         />
                    )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                         label="Tipo de Evaluación"
                         value={evaluation.evaluationType || ""}
                         onChange={(e) => handleChange("evaluationType", e.target.value)}
                         options={EVALUATION_TYPES}
                         required
                         disabled={readOnly}
                    />
                    <Input
                         label="Año Académico"
                         type="number"
                         value={evaluation.academicYear || new Date().getFullYear()}
                         onChange={(e) => handleChange("academicYear", parseInt(e.target.value))}
                         required
                         disabled={readOnly}
                    />
               </div>

               <TextArea
                    label="Motivo de Evaluación"
                    value={evaluation.evaluationReason || ""}
                    onChange={(e) => handleChange("evaluationReason", e.target.value)}
                    rows={2}
                    disabled={readOnly}
               />

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                         label="ID del Aula (opcional)"
                         value={evaluation.classroomId || ""}
                         onChange={(e) => handleChange("classroomId", e.target.value)}
                         disabled={readOnly}
                    />
                    <Input
                         label="ID de Institución (opcional)"
                         value={evaluation.institutionId || ""}
                         onChange={(e) => handleChange("institutionId", e.target.value)}
                         disabled={readOnly}
                    />
               </div>

               <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Áreas de Desarrollo</h3>
                    <div className="space-y-4">
                         <TextArea label="Desarrollo Emocional" value={evaluation.emotionalDevelopment || ""} onChange={(e) => handleChange("emotionalDevelopment", e.target.value)} rows={2} disabled={readOnly} />
                         <TextArea label="Desarrollo Social" value={evaluation.socialDevelopment || ""} onChange={(e) => handleChange("socialDevelopment", e.target.value)} rows={2} disabled={readOnly} />
                         <TextArea label="Desarrollo Cognitivo" value={evaluation.cognitiveDevelopment || ""} onChange={(e) => handleChange("cognitiveDevelopment", e.target.value)} rows={2} disabled={readOnly} />
                         <TextArea label="Desarrollo Motor" value={evaluation.motorDevelopment || ""} onChange={(e) => handleChange("motorDevelopment", e.target.value)} rows={2} disabled={readOnly} />
                    </div>
               </div>

               <div className="border-t pt-4 mt-4">
                    <TextArea label="Observaciones" value={evaluation.observations || ""} onChange={(e) => handleChange("observations", e.target.value)} rows={3} disabled={readOnly} />
                    <TextArea label="Recomendaciones" value={evaluation.recommendations || ""} onChange={(e) => handleChange("recommendations", e.target.value)} rows={3} disabled={readOnly} />
               </div>

               <div className="border-t pt-4 mt-4">
                    <Checkbox
                         label="Requiere seguimiento"
                         checked={evaluation.requiresFollowUp || false}
                         onChange={(e) => handleChange("requiresFollowUp", e.target.checked)}
                         disabled={readOnly}
                    />
                    {evaluation.requiresFollowUp && (
                         <div className="mt-3">
                              <Select
                                   label="Frecuencia de Seguimiento"
                                   value={evaluation.followUpFrequency || ""}
                                   onChange={(e) => handleChange("followUpFrequency", e.target.value)}
                                   options={FOLLOW_UP_FREQUENCIES}
                                   disabled={readOnly}
                              />
                         </div>
                    )}
               </div>
          </div>
     );
}
