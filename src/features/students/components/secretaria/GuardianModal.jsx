import { useState, useEffect, useRef } from "react";
import { Modal, Button } from "@/shared/components/ui";
import GuardianForm from "../shared/GuardianForm";
import { createEmptyGuardian, formatGuardianForApi, formatGuardianUpdateForApi } from "../../models/guardianModel";
import { alertApiError } from "@/shared/components/feedback";
import { validateGuardianForm, isValidDocumentNumber, isValidPhone, isValidEmail } from "@/core/utils/validators";
import { guardianService } from "../../services/guardianService";

export default function GuardianModal({
     isOpen,
     onClose,
     guardian = null,
     studentId,
     onSave,
}) {
     const isEditing = !!guardian?.id;
     const [formData, setFormData] = useState(createEmptyGuardian());
     const [errors, setErrors] = useState({});
     const [asyncErrors, setAsyncErrors] = useState({});
     const [saving, setSaving] = useState(false);
     const formDataRef = useRef(formData);

     useEffect(() => {
          if (isOpen) {
               const data = guardian
                    ? { ...createEmptyGuardian(), ...guardian }
                    : { ...createEmptyGuardian(), studentId: studentId || "" };
               setFormData(data);
               formDataRef.current = data;
               setErrors({});
               setAsyncErrors({});
          }
     }, [isOpen, guardian, studentId]);

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

     async function handleFieldBlur(field) {
          const value = formDataRef.current[field];
          if (!value || !value.trim()) return;
          try {
               let exists = false;
               let label = "";
               if (field === "documentNumber") {
                    const docType = formDataRef.current.documentType;
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
                    setAsyncErrors((prev) => ({
                         ...prev,
                         [field]: `Este ${label} ya está registrado`,
                    }));
               }
          } catch {
               /* silenciar errores de red */
          }
     }

     function validate() {
          const newErrors = validateGuardianForm(formDataRef.current);
          setErrors(newErrors);
          const hasAsync = Object.keys(asyncErrors).length > 0;
          return Object.keys(newErrors).length === 0 && !hasAsync;
     }

     async function handleSubmit() {
          if (!validate()) return;

          setSaving(true);
          try {
               const current = formDataRef.current;
               if (isEditing) {
                    await onSave(guardian.id, formatGuardianUpdateForApi(current));
               } else {
                    await onSave(null, formatGuardianForApi(current));
               }
               onClose();
          } catch (err) {
               alertApiError(err);
          } finally {
               setSaving(false);
          }
     }

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={isEditing ? "Editar Apoderado" : "Nuevo Apoderado"}
               size="xl"
          >
               <div className="space-y-6">
                    <GuardianForm
                         guardian={formData}
                         onChange={handleFieldChange}
                         errors={{ ...errors, ...asyncErrors }}
                         onFieldBlur={handleFieldBlur}
                    />

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                         <Button variant="ghost" onClick={onClose} disabled={saving}>
                              Cancelar
                         </Button>
                         <Button
                              variant="primary"
                              onClick={handleSubmit}
                              loading={saving}
                         >
                              {isEditing ? "Guardar Cambios" : "Registrar Apoderado"}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}
