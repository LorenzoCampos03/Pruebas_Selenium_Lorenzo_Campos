import { useState, useRef } from "react";
import { Pencil, Save, X } from "lucide-react";
import { Button, Card, Badge } from "@/shared/components/ui";
import InstitutionForm from "../shared/InstitutionForm";
import InstitutionAvatar from "../shared/InstitutionAvatar";
import { ROLES } from "@/core/utils/constants";
import { INSTITUTION_STATUS } from "../../models/institutionModel";
import { formatInstitutionForApi } from "../../models/institutionModel";
import { alertApiError, alertConfirmUpdate } from "@/shared/components/feedback";
import { institutionService } from "../../services/institutionService";
import { toast } from "react-hot-toast";

export default function InstitutionProfile({
     institution,
     role,
     onUpdate,
     // eslint-disable-next-line no-unused-vars
     loading,
}) {
     const [editing, setEditing] = useState(false);
     const [saving, setSaving] = useState(false);
     const [errors, setErrors] = useState({});
     const formDataRef = useRef({});

     function handleFieldChange(field, value) {
          if (field.startsWith("address.")) {
               const addressField = field.split(".")[1];
               formDataRef.current = {
                    ...formDataRef.current,
                    address: { ...(formDataRef.current.address || institution?.address || {}), [addressField]: value },
               };
          } else {
               formDataRef.current = { ...formDataRef.current, [field]: value };
          }
          if (errors[field]) {
               setErrors((prev) => ({ ...prev, [field]: undefined }));
          }
     }

     function handleStartEdit() {
          formDataRef.current = { ...institution };
          setErrors({});
          setEditing(true);
     }

     function handleCancelEdit() {
          formDataRef.current = {};
          setErrors({});
          setEditing(false);
     }

     function validate() {
          const current = { ...institution, ...formDataRef.current };
          const newErrors = {};

          // Campos obligatorios académicos, de gestión y contacto
          if (!current.gradingType) newErrors.gradingType = "Tipo de calificación requerido";
          if (!current.classroomType) newErrors.classroomType = "Tipo de aula requerido";
          if (!current.ugel?.trim()) newErrors.ugel = "UGEL requerida";
          if (!current.dre?.trim()) newErrors.dre = "DRE requerida";
          if (!current.phone?.trim()) {
               newErrors.phone = "Teléfono de contacto requerido";
          } else {
               if (!/^\d+$/.test(current.phone)) {
                    newErrors.phone = "El teléfono solo debe contener números";
               } else if (!current.phone.startsWith("9")) {
                    newErrors.phone = "El teléfono debe iniciar obligatoriamente con el número 9";
               } else if (current.phone.length !== 9) {
                    newErrors.phone = `El teléfono debe tener exactamente 9 dígitos (ingresados: ${current.phone.length}/9)`;
               }
          }

          if (!current.email?.trim()) {
               newErrors.email = "Correo electrónico requerido";
          } else {
               const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
               if (!emailRegex.test(current.email)) {
                    newErrors.email = "El correo electrónico no es válido";
               }
          }

          // Ubicación
          if (!current.address?.department?.trim()) newErrors["address.department"] = "Requerido";
          if (!current.address?.province?.trim()) newErrors["address.province"] = "Requerido";
          if (!current.address?.district?.trim()) newErrors["address.district"] = "Requerido";
          if (!current.address?.urbanization?.trim()) newErrors["address.urbanization"] = "Requerido";
          if (!current.address?.reference?.trim()) newErrors["address.reference"] = "Requerido";

          // Horarios (Al menos uno)
          if (!current.schedules || current.schedules.length === 0) {
               newErrors.schedules = "Debe registrar al menos un horario de atención";
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     }

     async function handleSave() {
          if (!validate()) return;

          setSaving(true);
          try {
               const confirm = await alertConfirmUpdate("institución");
               if (!confirm.isConfirmed) {
                    setSaving(false);
                    return;
               }

               const merged = { ...institution, ...formDataRef.current };
               
               if (merged.logoFile) {
                    toast.loading("Subiendo logo...", { id: "upload-logo-profile" });
                    const uploadRes = await institutionService.uploadLogo(merged.logoFile);
                    merged.logoUrl = uploadRes.data || uploadRes;
                    delete merged.logoFile;
                    toast.dismiss("upload-logo-profile");
               }

               await onUpdate(institution.id, formatInstitutionForApi(merged));
               setEditing(false);
               formDataRef.current = {};
          } catch (err) {
               alertApiError(err);
          } finally {
               setSaving(false);
          }
     }

     if (!institution) return null;

     return (
          <div className="space-y-6">
               {/* Profile Header */}
               <Card>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                         <div className="flex items-center gap-4">
                              <InstitutionAvatar
                                   logoUrl={institution.logoUrl}
                                   name={institution.name}
                                   colorInstitution={institution.colorInstitution}
                                   size="lg"
                              />
                              <div>
                                   <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-gray-900">
                                             {institution.name}
                                        </h2>
                                        {institution.colorInstitution && (
                                             <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600">
                                                  <span
                                                       className="h-2.5 w-2.5 rounded-full border border-gray-200"
                                                       style={{ backgroundColor: institution.colorInstitution }}
                                                  />
                                                  {institution.colorInstitution}
                                             </span>
                                        )}
                                        <Badge
                                             variant={institution.status === INSTITUTION_STATUS.ACTIVE ? "success" : "gray"}
                                             size="sm"
                                             dot
                                        >
                                             {institution.status === INSTITUTION_STATUS.ACTIVE ? "Activa" : "Inactiva"}
                                        </Badge>
                                   </div>
                                   <p className="text-sm text-gray-500">
                                        Código: {institution.modularCode} &middot; {institution.level}
                                   </p>
                              </div>
                         </div>
                         <div className="flex items-center gap-2">
                              {editing ? (
                                   <>
                                        <Button
                                             variant="ghost"
                                             size="sm"
                                             icon={X}
                                             onClick={handleCancelEdit}
                                             disabled={saving}
                                        >
                                             Cancelar
                                        </Button>
                                        <Button
                                             variant="primary"
                                             size="sm"
                                             icon={Save}
                                             onClick={handleSave}
                                             loading={saving}
                                        >
                                             Guardar
                                        </Button>
                                   </>
                              ) : (
                                   <Button
                                        variant="outline"
                                        size="sm"
                                        icon={Pencil}
                                        onClick={handleStartEdit}
                                   >
                                        Editar Información
                                   </Button>
                              )}
                         </div>
                    </div>
               </Card>

               {/* Form */}
               <InstitutionForm
                    institution={institution}
                    role={role}
                    readOnly={!editing}
                    onChange={handleFieldChange}
                    errors={errors}
               />

               {!editing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                         <p className="text-xs text-blue-700">
                              <strong>Nota:</strong> No puede modificar el nombre ni el código modular
                              de la institución. Para cambios en esos campos, contacte al administrador.
                         </p>
                    </div>
               )}
          </div>
     );
}
