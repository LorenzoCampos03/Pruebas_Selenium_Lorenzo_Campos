import { useState, useEffect } from "react";
import { Modal, Button, Input, Select } from "@/shared/components/ui";
import { FormSection } from "@/shared/components/form";
import {
     createEmptyClassroom,
     formatClassroomForApi,
     CLASSROOM_AGES,
     CLASSROOM_COLORS,
} from "../../models/classroomModel";
import { alertApiError } from "@/shared/components/feedback";

export default function ClassroomModal({
     isOpen,
     onClose,
     classroom = null,
     onSave,
}) {
     const isEditing = !!classroom?.id;
     const [form, setForm] = useState(createEmptyClassroom());
     const [errors, setErrors] = useState({});
     const [saving, setSaving] = useState(false);

     useEffect(() => {
          if (isOpen) {
               setForm(
                    classroom
                         ? { ...createEmptyClassroom(), ...classroom }
                         : createEmptyClassroom()
               );
               setErrors({});
          }
     }, [isOpen, classroom]);

     function handleChange(field, value) {
          setForm((prev) => ({ ...prev, [field]: value }));
          if (errors[field]) {
               setErrors((prev) => ({ ...prev, [field]: undefined }));
          }
     }

     function validate() {
          const newErrors = {};
          if (!form.name?.trim()) newErrors.name = "Nombre requerido";
          if (!form.age) newErrors.age = "Edad requerida";
          
          if (!form.capacity) {
               newErrors.capacity = "Capacidad requerida";
          } else {
               const capNum = Number(form.capacity);
               if (capNum <= 0) {
                    newErrors.capacity = "Capacidad debe ser mayor a 0";
               } else if (capNum > 30) {
                    newErrors.capacity = "La capacidad máxima permitida es de 30 alumnos";
               }
          }

          if (!form.color) newErrors.color = "Color requerido";

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     }

     async function handleSubmit() {
          if (!validate()) return;

          setSaving(true);
          try {
               const payload = formatClassroomForApi(form);
               if (isEditing) {
                    await onSave(classroom.id, payload);
               } else {
                    await onSave(null, payload);
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
               title={isEditing ? "Editar Aula" : "Nueva Aula"}
               size="md"
          >
               <div className="space-y-6">
                    <FormSection title="Información del Aula">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input
                                   label="Nombre del Aula"
                                   value={form.name}
                                   onChange={(e) => handleChange("name", e.target.value)}
                                   error={errors.name}
                                   placeholder="Ej: Aula Estrellitas"
                              />
                              <Select
                                   label="Edad"
                                   value={form.age}
                                   onChange={(e) => handleChange("age", e.target.value)}
                                   options={CLASSROOM_AGES}
                                   placeholder="Seleccione edad"
                                   error={errors.age}
                              />
                              <Input
                                   label="Capacidad"
                                   type="number"
                                   value={form.capacity}
                                   onChange={(e) => handleChange("capacity", e.target.value)}
                                   error={errors.capacity}
                                   placeholder="Ej: 25"
                              />
                              <Select
                                   label="Color"
                                   value={form.color}
                                   onChange={(e) => handleChange("color", e.target.value)}
                                   options={CLASSROOM_COLORS}
                                   placeholder="Seleccione color"
                                   error={errors.color}
                              />
                         </div>
                    </FormSection>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                         <Button variant="ghost" onClick={onClose} disabled={saving}>
                              Cancelar
                         </Button>
                         <Button variant="primary" onClick={handleSubmit} loading={saving}>
                              {isEditing ? "Guardar Cambios" : "Crear Aula"}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}
