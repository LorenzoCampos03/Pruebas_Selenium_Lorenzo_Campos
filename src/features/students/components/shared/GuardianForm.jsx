import { useState, useEffect } from "react";
import { Input, Select } from "@/shared/components/ui";
import { FormSection } from "@/shared/components/form";
import { createEmptyGuardian, GUARDIAN_RELATIONSHIPS } from "../../models/guardianModel";
import { DOCUMENT_TYPES } from "@/core/utils/constants";
import {
     filterNameInput,
     filterPhoneInput,
     filterDocumentInput,
} from "@/core/utils/validators";
import { useRealTimeValidation } from "@/shared/hooks/useRealTimeValidation";
import { guardianService } from "../../services/guardianService";

const relationshipOptions = GUARDIAN_RELATIONSHIPS.map((r) => ({ value: r.value, label: r.label }));
const documentTypeOptions = DOCUMENT_TYPES.map((d) => ({ value: d, label: d }));

export default function GuardianForm({
     guardian,
     onChange,
     errors = {},
     readOnly = false,
     onFieldBlur,
}) {
     const [form, setForm] = useState(createEmptyGuardian());

     const docValidation = useRealTimeValidation(guardianService.existsByDocument);
     const phoneValidation = useRealTimeValidation(guardianService.existsByPhone);
     const emailValidation = useRealTimeValidation(guardianService.existsByEmail);
     const whatsappValidation = useRealTimeValidation(guardianService.existsByWhatsapp);

     useEffect(() => {
          if (guardian) {
               setForm({ ...createEmptyGuardian(), ...guardian });
          } else {
               setForm(createEmptyGuardian());
          }
     }, [guardian]);

     function handleChange(field, value) {
          setForm((prev) => {
               const updated = { ...prev, [field]: value };
               onChange?.(field, value);
               
               if (field === "documentNumber") docValidation.validate(value);
               if (field === "phone") phoneValidation.validate(value);
               if (field === "email") emailValidation.validate(value);
               if (field === "whatsapp") whatsappValidation.validate(value);
               
               return updated;
          });
     }

     function handleDocTypeChange(value) {
          handleChange("documentType", value);
          handleChange("documentNumber", "");
     }

     return (
          <div className="space-y-6">
               <FormSection title="Datos del Apoderado" description="Información personal del padre/madre/apoderado">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input
                              label="Nombres"
                              value={form.firstName}
                              onChange={(e) => handleChange("firstName", e.target.value)}
                              filter={filterNameInput}
                              disabled={readOnly}
                              error={errors.firstName}
                              placeholder="Nombres"
                         />
                         <Input
                              label="Apellido Paterno"
                              value={form.lastName}
                              onChange={(e) => handleChange("lastName", e.target.value)}
                              filter={filterNameInput}
                              disabled={readOnly}
                              error={errors.lastName}
                              placeholder="Apellido paterno"
                         />
                         <Input
                              label="Apellido Materno"
                              value={form.motherLastName}
                              onChange={(e) => handleChange("motherLastName", e.target.value)}
                              filter={filterNameInput}
                              disabled={readOnly}
                              error={errors.motherLastName}
                              placeholder="Apellido materno"
                         />
                         <Select
                              label="Parentesco"
                              value={form.relationship}
                              onChange={(e) => handleChange("relationship", e.target.value)}
                              disabled={readOnly}
                              options={relationshipOptions}
                              placeholder="Seleccione parentesco"
                              error={errors.relationship}
                         />
                         <Select
                              label="Tipo de Documento"
                              value={form.documentType}
                              onChange={(e) => handleDocTypeChange(e.target.value)}
                              disabled={readOnly}
                              options={documentTypeOptions}
                              error={errors.documentType}
                         />
                         <Input
                              label="Número de Documento"
                              value={form.documentNumber}
                              onChange={(e) => handleChange("documentNumber", e.target.value)}
                              onBlur={() => onFieldBlur?.("documentNumber")}
                              filter={(v) => filterDocumentInput(form.documentType, v)}
                              disabled={readOnly}
                              error={errors.documentNumber || docValidation.error}
                              placeholder={form.documentType === "DNI" ? "8 dígitos" : "9-12 caracteres"}
                              maxLength={form.documentType === "DNI" ? 8 : 12}
                         />
                    </div>
               </FormSection>

               <FormSection title="Contacto" description="Datos de comunicación">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input
                              label="Teléfono"
                              value={form.phone}
                              onChange={(e) => handleChange("phone", e.target.value)}
                              onBlur={() => onFieldBlur?.("phone")}
                              filter={filterPhoneInput}
                              disabled={readOnly}
                              error={errors.phone || phoneValidation.error}
                              placeholder="9XXXXXXXX"
                              maxLength={9}
                         />
                         <Input
                              label="WhatsApp"
                              value={form.whatsapp}
                              onChange={(e) => handleChange("whatsapp", e.target.value)}
                              onBlur={() => onFieldBlur?.("whatsapp")}
                              filter={filterPhoneInput}
                              disabled={readOnly}
                              error={errors.whatsapp || whatsappValidation.error}
                              placeholder="9XXXXXXXX"
                              maxLength={9}
                         />
                         <Input
                              label="Correo Electrónico"
                              value={form.email}
                              onChange={(e) => handleChange("email", e.target.value)}
                              onBlur={() => onFieldBlur?.("email")}
                              disabled={readOnly}
                              error={errors.email || emailValidation.error}
                              placeholder="correo@ejemplo.com"
                         />
                         <div className="flex items-center gap-3 pt-6">
                              <label className="relative inline-flex items-center cursor-pointer">
                                   <input
                                        type="checkbox"
                                        checked={form.isEmergencyContact}
                                        onChange={(e) => handleChange("isEmergencyContact", e.target.checked)}
                                        disabled={readOnly}
                                        className="sr-only peer"
                                   />
                                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                              </label>
                              <span className="text-sm font-medium text-gray-700">Contacto de emergencia</span>
                         </div>
                         {form.isEmergencyContact && (
                              <Input
                                   label="Teléfono de Emergencia"
                                   value={form.emergencyPhone}
                                   onChange={(e) => handleChange("emergencyPhone", e.target.value)}
                                   onBlur={() => onFieldBlur?.("emergencyPhone")}
                                   filter={filterPhoneInput}
                                   disabled={readOnly}
                                   error={errors.emergencyPhone}
                                   placeholder="9XXXXXXXX"
                                   maxLength={9}
                              />
                         )}
                    </div>
               </FormSection>
          </div>
     );
}
