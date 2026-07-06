import { useState, useEffect, useRef } from "react";
import { Modal, Button } from "@/shared/components/ui";
import IncidentForm from "./IncidentForm";
import {
     createEmptyIncident,
     formatIncidentForCreate,
     formatIncidentForUpdate,
} from "../models/disciplineModel";
import { alertApiError } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { studentService } from "@/features/students/services/studentService";
import { isSuccessResponse, extractData } from "@/core/api/apiResponse";

export default function IncidentModal({ isOpen, onClose, incident = null, onSave, usersMap = {} }) {
     const { user } = useAuth();
     const isEditing = !!incident?.id;
     const [formData, setFormData] = useState(createEmptyIncident());
     const [errors, setErrors] = useState({});
     const [saving, setSaving] = useState(false);
     const formDataRef = useRef(formData);
     const [students, setStudents] = useState([]);
     const [loadingStudents, setLoadingStudents] = useState(false);

     const displayReporterName = isEditing
          ? (incident?.reportedBy === user?.userId ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : (usersMap[incident?.reportedBy] || incident?.reportedBy || ""))
          : (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "");

     
     useEffect(() => {
          if (isOpen && user?.institutionId) {
               setLoadingStudents(true);
               studentService
                    .getByInstitution(user.institutionId)
                    .then((response) => {
                         const data = isSuccessResponse(response) ? extractData(response) : response;
                         setStudents(Array.isArray(data) ? data : []);
                    })
                    .catch(() => setStudents([]))
                    .finally(() => setLoadingStudents(false));
          }
     }, [isOpen, user?.institutionId]);

     useEffect(() => {
          if (isOpen) {
               const data = incident
                    ? { ...createEmptyIncident(), ...incident }
                    : {
                         ...createEmptyIncident(),
                         reportedBy: user?.userId || "",
                         institutionId: user?.institutionId || "",
                    };
               setFormData(data);
               formDataRef.current = data;
               setErrors({});
          }
     }, [isOpen, incident, user]);

     function handleFieldChange(field, value) {
          setFormData((prev) => {
               const updated = { ...prev, [field]: value };
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

          if (!current.studentId?.trim()) newErrors.studentId = "ID del estudiante requerido";
          
          if (!current.incidentDate) {
               newErrors.incidentDate = "Fecha requerida";
          } else {
               const todayStr = new Date().toISOString().split("T")[0];
               const minDateStr = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
               if (current.incidentDate > todayStr) {
                    newErrors.incidentDate = "La fecha no puede ser futura";
               } else if (current.incidentDate < minDateStr) {
                    newErrors.incidentDate = "La fecha no puede ser anterior a 2 semanas";
               }
          }

          if (!current.incidentTime) newErrors.incidentTime = "Hora requerida";
          
          if (!current.academicYear) {
               newErrors.academicYear = "Año académico requerido";
          } else {
               const currentYear = new Date().getFullYear();
               if (parseInt(current.academicYear, 10) !== currentYear) {
                    newErrors.academicYear = `El año debe ser ${currentYear}`;
               }
          }

          if (!current.incidentType) newErrors.incidentType = "Tipo de incidente requerido";
          if (!current.severityLevel) newErrors.severityLevel = "Nivel de severidad requerido";
          if (!current.description?.trim()) newErrors.description = "Descripción requerida";
          if (!current.reportedBy?.trim()) newErrors.reportedBy = "Reportado por es requerido";
          
          if (!current.location?.trim()) newErrors.location = "Ubicación requerida";
          if (!current.witnesses?.trim()) newErrors.witnesses = "Testigos requeridos";
          if (!current.immediateAction?.trim()) newErrors.immediateAction = "Acción inmediata requerida";

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     }

     async function handleSubmit() {
          if (!validate()) return;

          setSaving(true);
          try {
               const current = formDataRef.current;
               if (isEditing) {
                    await onSave(incident.id, formatIncidentForUpdate(current));
               } else {
                    await onSave(null, formatIncidentForCreate(current));
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
               title={isEditing ? "Editar Incidencia" : "Nueva Incidencia"}
               size="xl"
          >
               <div className="space-y-6">
                    <IncidentForm
                         formData={formData}
                         onChange={handleFieldChange}
                         errors={errors}
                         students={students}
                         loadingStudents={loadingStudents}
                         reporterName={displayReporterName}
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                         <Button variant="ghost" onClick={onClose}>
                              Cancelar
                         </Button>
                         <Button
                              variant="primary"
                              onClick={handleSubmit}
                              loading={saving}
                         >
                              {isEditing ? "Guardar Cambios" : "Registrar Incidencia"}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}
