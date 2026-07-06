import { useState, useEffect, useRef } from "react";
import { Modal, Button, CredentialsModal } from "@/shared/components/ui";
import InstitutionForm from "../shared/InstitutionForm";
import { ROLES } from "@/core/utils/constants";
import { createEmptyInstitution, formatInstitutionForApi } from "../../models/institutionModel";
import { alertApiError } from "@/shared/components/feedback";
import { userService } from "@/features/users/services/userService";
import { institutionService } from "../../services/institutionService";
import { toast } from "react-hot-toast";
import { isSuccessResponse, extractData } from "@/core/api/apiResponse";

export default function AdminInstitutionModal({
     isOpen,
     onClose,
     institution = null,
     onSave,
     institutions = [],
     onRefresh
}) {
     const isEditing = !!institution?.id;
     const [formData, setFormData] = useState({ ...createEmptyInstitution(), directorAction: "NEW" });
     const [errors, setErrors] = useState({});
     const [saving, setSaving] = useState(false);
     const [availableDirectors, setAvailableDirectors] = useState([]);
     const [credentialsModal, setCredentialsModal] = useState({ open: false, credentials: null });
     const formDataRef = useRef(formData);

     useEffect(() => {
          if (isOpen) {
               const data = institution
                    ? { ...createEmptyInstitution(), ...institution, directorAction: "NEW" }
                    : { ...createEmptyInstitution(), directorAction: "NEW" };
               setFormData(data);
               formDataRef.current = data;
               setErrors({});

               userService.getAll().then((res) => {
                    const extracted = res?.data || res;
                    if (Array.isArray(extracted)) {
                         const filterDirectors = extracted.filter(u => u.role === "DIRECTOR"); // Add condition if user's institutionId exists if needed
                         setAvailableDirectors(filterDirectors);
                    }
               }).catch(err => console.error(err));
          }
     }, [isOpen, institution]);

     function handleFieldChange(field, value) {
          setFormData((prev) => {
               let updated;
               if (field.startsWith("address.")) {
                    const addressField = field.split(".")[1];
                    updated = {
                         ...prev,
                         address: { ...prev.address, [addressField]: value },
                    };
               } else if (field.startsWith("directorData.")) {
                    const dirField = field.split(".")[1];
                    updated = {
                         ...prev,
                         directorData: { ...prev.directorData, [dirField]: value },
                    };
               } else if (field === "isChangingDirector") {
                    if (value === true) {
                         updated = {
                              ...prev,
                              isChangingDirector: true,
                              director: null,
                              directorData: {
                                   firstName: "",
                                   lastName: "",
                                   motherLastName: "",
                                   documentType: "DNI",
                                   documentNumber: "",
                                   phone: "",
                                   email: "",
                                   username: "",
                              }
                         };
                    } else {
                         updated = {
                              ...prev,
                              isChangingDirector: false,
                              director: institution?.director || "",
                              directorData: institution?.directorData || {
                                   firstName: "",
                                   lastName: "",
                                   motherLastName: "",
                                   documentType: "DNI",
                                   documentNumber: "",
                                   phone: "",
                                   email: "",
                                   username: "",
                              }
                         };
                    }
               } else if (field === "schedules") {
                    updated = { ...prev, schedules: value };
               } else {
                    updated = { ...prev, [field]: value };
               }
               formDataRef.current = updated;
               return updated;
          });

          if (errors[field]) {
               setErrors((prev) => ({ ...prev, [field]: undefined }));
          }
     }

     function validate() {
          const current = formDataRef.current;
          const newErrors = {};

          // Validación de Código de Institución (8 dígitos numéricos)
          if (current.codeInstitution) {
               if (!/^\d{8}$/.test(current.codeInstitution)) {
                    newErrors.codeInstitution = "Debe tener exactamente 8 dígitos numéricos";
               } else {
                    const isDuplicate = institutions.some(
                         (inst) => inst.codeInstitution === current.codeInstitution && inst.id !== institution?.id
                    );
                    if (isDuplicate) newErrors.codeInstitution = "Este código ya está registrado";
               }
          }

          // Validación de Código Modular (7 dígitos numéricos)
          if (current.modularCode) {
               if (!/^\d{7}$/.test(current.modularCode)) {
                    newErrors.modularCode = "Debe tener exactamente 7 dígitos numéricos";
               } else {
                    const isDuplicate = institutions.some(
                         (inst) => inst.modularCode === current.modularCode && inst.id !== institution?.id
                    );
                    if (isDuplicate) newErrors.modularCode = "Este código modular ya está registrado";
               }
          }

          if (!isEditing) {
               if (!current.codeInstitution?.trim()) newErrors.codeInstitution = "Código de institución requerido";
               if (!current.modularCode?.trim()) newErrors.modularCode = "Código modular requerido";
               if (!current.name?.trim()) newErrors.name = "Nombre requerido";
               if (!current.institutionType) newErrors.institutionType = "Tipo de institución requerido";
               if (!current.level) newErrors.level = "Nivel requerido";
               if (!current.gender) newErrors.gender = "Género requerido";

               // Campos académicos, de gestión y contacto requeridos al crear
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

               // Ubicación requerida
               if (!current.address?.department?.trim()) newErrors["address.department"] = "Requerido";
               if (!current.address?.province?.trim()) newErrors["address.province"] = "Requerido";
               if (!current.address?.district?.trim()) newErrors["address.district"] = "Requerido";
               if (!current.address?.urbanization?.trim()) newErrors["address.urbanization"] = "Requerido";
               if (!current.address?.reference?.trim()) newErrors["address.reference"] = "Requerido";

               // Horarios (Al menos uno)
               if (!current.schedules || current.schedules.length === 0) {
                    newErrors.schedules = "Debe registrar al menos un horario de atención";
               }
          }

          if (!isEditing || (isEditing && current.isChangingDirector)) {

               if (current.directorAction === "NEW") {
                    if (!current.directorData?.firstName?.trim()) newErrors["directorData.firstName"] = "Requerido";
                    if (!current.directorData?.lastName?.trim()) newErrors["directorData.lastName"] = "Requerido";
                    if (!current.directorData?.motherLastName?.trim()) newErrors["directorData.motherLastName"] = "Requerido";
                    
                    if (!current.directorData?.documentNumber?.trim()) {
                         newErrors["directorData.documentNumber"] = "Requerido";
                    } else {
                         const docType = current.directorData.documentType || "DNI";
                         if (docType.toUpperCase() === "DNI") {
                              if (!/^\d+$/.test(current.directorData.documentNumber)) {
                                   newErrors["directorData.documentNumber"] = "El DNI solo debe contener números";
                              } else if (current.directorData.documentNumber.length !== 8) {
                                   newErrors["directorData.documentNumber"] = `El DNI debe tener exactamente 8 dígitos (ingresados: ${current.directorData.documentNumber.length}/8)`;
                              }
                         }
                    }

                    if (!current.directorData?.phone?.trim()) {
                         newErrors["directorData.phone"] = "Requerido";
                    } else {
                         if (!/^\d+$/.test(current.directorData.phone)) {
                              newErrors["directorData.phone"] = "El celular solo debe contener números";
                         } else if (!current.directorData.phone.startsWith("9")) {
                              newErrors["directorData.phone"] = "El celular debe iniciar obligatoriamente con el número 9";
                         } else if (current.directorData.phone.length !== 9) {
                              newErrors["directorData.phone"] = `El celular debe tener exactamente 9 dígitos (ingresados: ${current.directorData.phone.length}/9)`;
                         }
                    }

                    if (!current.directorData?.email?.trim()) {
                         newErrors["directorData.email"] = "Requerido";
                    } else {
                         const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
                         if (!emailRegex.test(current.directorData.email)) {
                              newErrors["directorData.email"] = "El correo electrónico no es válido";
                         }
                    }
               } else if (current.directorAction === "EXISTING" && !current.director) {
                    newErrors.director = "Seleccione un director existente";
               }
          }

          // Validación de Horarios
          if (current.schedules?.length > 0) {
               const shifts = current.schedules.filter(s => s.shift).map(s => s.shift);
               if (new Set(shifts).size !== shifts.length) {
                    newErrors.schedules = "No se pueden repetir turnos (máximo uno de mañana y uno de tarde)";
               }

               current.schedules.forEach((s, index) => {
                    if (!s.shift) newErrors[`schedules.${index}.shift`] = "Requerido";
                    if (!s.startTime) newErrors[`schedules.${index}.startTime`] = "Requerido";
                    if (!s.endTime) newErrors[`schedules.${index}.endTime`] = "Requerido";

                    if (s.startTime && s.endTime) {
                         if (s.startTime >= s.endTime) {
                              newErrors[`schedules.${index}.endTime`] = "Debe ser posterior al inicio";
                         }

                         if (s.shift === "MAÑANA") {
                              if (s.startTime < "07:00") {
                                   newErrors[`schedules.${index}.startTime`] = "Mínimo 07:00 AM";
                              }
                              if (s.endTime > "13:00") {
                                   newErrors[`schedules.${index}.endTime`] = "Máximo 13:00 (1:00 PM)";
                              }
                         } else if (s.shift === "TARDE") {
                              if (s.startTime < "12:00") {
                                   newErrors[`schedules.${index}.startTime`] = "Mínimo 12:00 PM";
                              }
                              if (s.endTime > "18:00") {
                                   newErrors[`schedules.${index}.endTime`] = "Máximo 18:00 (6:00 PM)";
                              }
                         }
                    }
               });
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     }

     async function handleSubmit() {
          if (!validate()) return;

          setSaving(true);
          let pendingCredentials = null;
          try {
               const current = formDataRef.current;

               if (current.logoFile) {
                    toast.loading("Subiendo logo...", { id: "upload-logo-modal" });
                    const uploadRes = await institutionService.uploadLogo(current.logoFile);
                    current.logoUrl = uploadRes.data || uploadRes;
                    delete current.logoFile;
                    toast.success("Logo subido exitosamente", { id: "upload-logo-modal" });
               }

               if (isEditing) {
                    let newDirectorId = current.director;

                    if (current.isChangingDirector) {
                         if (current.directorAction === "NEW") {
                              const userPayload = {
                                   userName: current.directorData.documentNumber,
                                   email: current.directorData.email,
                                   firstName: current.directorData.firstName,
                                   lastName: current.directorData.lastName,
                                   motherLastName: current.directorData.motherLastName,
                                   documentType: current.directorData.documentType,
                                   documentNumber: current.directorData.documentNumber,
                                   phone: current.directorData.phone,
                                   role: "DIRECTOR",
                                   institutionId: institution.id
                              };
                               const createdUser = await userService.create(userPayload);
                               const directorDataEd = isSuccessResponse(createdUser) ? extractData(createdUser) : (createdUser?.data || createdUser);
                               newDirectorId = directorDataEd?.id || directorDataEd?.userId || createdUser?.id || createdUser?.userId;
                               if (current.directorData.photoFile && newDirectorId) {
                                    try {
                                         await userService.uploadPhoto(newDirectorId, current.directorData.photoFile);
                                    } catch (photoErr) {
                                         console.error("Error uploading director photo:", photoErr);
                                    }
                               }
                               pendingCredentials = {
                                    fullName: [current.directorData.firstName, current.directorData.lastName, current.directorData.motherLastName].filter(Boolean).join(" "),
                                    username: directorDataEd?.userName || directorDataEd?.username || "",
                                    password: current.directorData.documentNumber,
                                    role: "Director",
                               };
                         }

                         // 1. Clear other institutions that might have this director (newDirectorId) assigned
                         if (newDirectorId) {
                              const otherInst = institutions.find(inst => inst.director === newDirectorId && inst.id !== institution.id);
                              if (otherInst) {
                                   try {
                                        await institutionService.update(otherInst.id, {
                                             ...formatInstitutionForApi(otherInst),
                                             directorId: "clear"
                                        });
                                   } catch (err) {
                                        console.error("Error clearing other institution director ID:", err);
                                   }
                              }
                         }

                         // 2. Clear old director's institutionId and set to INACTIVE
                         const oldDirectorId = institution.director;
                         if (oldDirectorId && oldDirectorId !== newDirectorId) {
                              try {
                                   await userService.toggleStatus(oldDirectorId, 'INACTIVE');
                              } catch (e) {
                                   console.warn("No se pudo inactivar al director antiguo:", e);
                              }
                              try {
                                   const oldUser = await userService.getById(oldDirectorId);
                                   const oldUserData = oldUser?.data || oldUser;
                                   if (oldUserData) {
                                        await userService.update(oldDirectorId, {
                                             ...oldUserData,
                                             institutionId: null
                                        });
                                   }
                              } catch (err) {
                                   console.error("Error clearing old director institutionId:", err);
                              }
                         }

                         // 3. Set new director's institutionId (if it's an existing director)
                         if (current.directorAction === "EXISTING" && newDirectorId) {
                              try {
                                   const newUser = await userService.getById(newDirectorId);
                                   const newUserData = newUser?.data || newUser;
                                   if (newUserData) {
                                        await userService.update(newDirectorId, {
                                             ...newUserData,
                                             institutionId: institution.id
                                        });
                                   }
                              } catch (err) {
                                   console.error("Error setting new director institutionId:", err);
                              }
                         }

                         await onSave(institution.id, { directorId: newDirectorId });
                    }
               } else {
                    const instPayload = formatInstitutionForApi(current);
                    instPayload.directorId = current.directorAction === "EXISTING" ? current.director : null;

                    const createdInst = await onSave(null, instPayload);
                    const rawInst = isSuccessResponse(createdInst) ? extractData(createdInst) : (createdInst?.data || createdInst);
                    const newInstId = rawInst?.id || createdInst?.id;

                    if (newInstId) {
                         if (current.directorAction === "NEW") {
                              const userPayload = {
                                   userName: current.directorData.documentNumber,
                                   email: current.directorData.email,
                                   firstName: current.directorData.firstName,
                                   lastName: current.directorData.lastName,
                                   motherLastName: current.directorData.motherLastName,
                                   documentType: current.directorData.documentType,
                                   documentNumber: current.directorData.documentNumber,
                                   phone: current.directorData.phone,
                                   role: "DIRECTOR",
                                   institutionId: newInstId
                              };
                              try {
                                   const createdUser = await userService.create(userPayload);
                                   const directorDataNew = isSuccessResponse(createdUser) ? extractData(createdUser) : (createdUser?.data || createdUser);
                                   pendingCredentials = {
                                        fullName: [current.directorData.firstName, current.directorData.lastName, current.directorData.motherLastName].filter(Boolean).join(" "),
                                        username: directorDataNew?.userName || directorDataNew?.username || "",
                                        password: current.directorData.documentNumber,
                                        role: "Director",
                                   };
                                   const userId = directorDataNew?.id || directorDataNew?.userId || createdUser?.id || createdUser?.userId;
                                   if (current.directorData.photoFile && userId) {
                                        try {
                                             await userService.uploadPhoto(userId, current.directorData.photoFile);
                                        } catch (photoErr) {
                                             console.error("Error uploading director photo:", photoErr);
                                        }
                                   }
                                   if (userId) {
                                        await institutionService.update(newInstId, { directorId: userId });
                                   }
                              } catch (userErr) {
                                   await institutionService.delete(newInstId);
                                   throw userErr;
                              }
                         } else if (current.directorAction === "EXISTING" && current.director) {
                              const existingDirectorId = current.director;

                              // 1. Clear other institutions that might have this director assigned
                              const otherInst = institutions.find(inst => inst.director === existingDirectorId);
                              if (otherInst) {
                                   try {
                                        await institutionService.update(otherInst.id, {
                                             ...formatInstitutionForApi(otherInst),
                                             directorId: "clear"
                                        });
                                   } catch (err) {
                                        console.error("Error clearing other institution director ID:", err);
                                   }
                              }

                              // 2. Set director's institutionId
                              try {
                                   const newUser = await userService.getById(existingDirectorId);
                                   const newUserData = newUser?.data || newUser;
                                   if (newUserData) {
                                        await userService.update(existingDirectorId, {
                                             ...newUserData,
                                             institutionId: newInstId
                                        });
                                   }
                              } catch (err) {
                                   console.error("Error setting existing director institutionId on new institution:", err);
                              }
                         }
                    }
                    if (onRefresh) onRefresh();
               }
               if (pendingCredentials) {
                    setCredentialsModal({ open: true, credentials: pendingCredentials });
               } else {
                    onClose();
               }
          } catch (err) {
               alertApiError(err);
          } finally {
               setSaving(false);
          }
     }

     return (
          <>
               <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                    title={isEditing ? "Editar Institución" : "Nueva Institución"}
                    size="xl"
               >
                    <div className="space-y-6">
                         <InstitutionForm
                              institution={formData}
                              role={ROLES.ADMINISTRADOR}
                              onChange={handleFieldChange}
                              errors={errors}
                              availableDirectors={availableDirectors}
                         />

                         {isEditing && (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                   <p className="text-xs text-amber-700">
                                        <strong>Nota:</strong> Como administrador, solo puede modificar el campo
                                        "Director" de la institución.
                                   </p>
                              </div>
                         )}

                         <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                              <Button variant="ghost" onClick={onClose} disabled={saving}>
                                   Cancelar
                              </Button>
                              <Button
                                   variant="primary"
                                   onClick={handleSubmit}
                                   loading={saving}
                              >
                                   {isEditing ? "Guardar Cambios" : "Crear Institución"}
                              </Button>
                         </div>
                    </div>
               </Modal>

               <CredentialsModal
                    isOpen={credentialsModal.open}
                    onClose={() => { setCredentialsModal({ open: false, credentials: null }); onClose(); }}
                    credentials={credentialsModal.credentials}
               />
          </>
     );
}
