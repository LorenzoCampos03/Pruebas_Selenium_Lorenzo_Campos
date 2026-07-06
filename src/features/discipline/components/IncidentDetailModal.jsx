import { useState, useEffect } from "react";
import { Modal, Badge } from "@/shared/components/ui";
import {
     INCIDENT_TYPE_LABELS,
     SEVERITY_LEVEL_LABELS,
     INCIDENT_STATUS_LABELS,
     SEVERITY_VARIANT,
     STATUS_VARIANT,
} from "../models/disciplineModel";
import { studentService } from "@/features/students/services/studentService";
import { isSuccessResponse, extractData } from "@/core/api/apiResponse";
import { useAuth } from "@/core/auth/AuthContext";

function DetailRow({ label, value }) {
     return (
          <div>
               <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
               <p className="text-sm text-gray-800 mt-0.5">{value || "—"}</p>
          </div>
     );
}

export default function IncidentDetailModal({ isOpen, onClose, incident, usersMap = {} }) {
     const { user } = useAuth();
     const [studentName, setStudentName] = useState("");
     const [otherStudentNames, setOtherStudentNames] = useState([]);

     const loggedUserName = user
          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
          : "";

     const displayReporter = incident?.reportedBy === user?.userId ? loggedUserName : (usersMap[incident?.reportedBy] || incident?.reportedBy);
     const displayResolver = incident?.resolvedBy === user?.userId ? loggedUserName : (usersMap[incident?.resolvedBy] || incident?.resolvedBy);

     useEffect(() => {
          if (!incident?.studentId) {
               setStudentName("");
               return;
          }
          let cancelled = false;
          studentService.getById(incident.studentId).then((response) => {
               if (cancelled) return;
               const student = isSuccessResponse(response) ? extractData(response) : response;
               if (student) {
                    const name = `${student.lastName || ""} ${student.motherLastName || ""} ${student.firstName || ""}`.trim();
                    setStudentName(name || incident.studentId);
               } else {
                    setStudentName(incident.studentId);
               }
          }).catch(() => {
               if (!cancelled) setStudentName(incident.studentId);
          });
          return () => { cancelled = true; };
     }, [incident?.studentId]);

     useEffect(() => {
          const ids = incident?.otherStudentsInvolved;
          if (!ids || ids.length === 0) {
               setOtherStudentNames([]);
               return;
          }
          let cancelled = false;
          Promise.all(
               ids.map((id) =>
                    studentService.getById(id).then((response) => {
                         const student = isSuccessResponse(response) ? extractData(response) : response;
                         if (student) {
                              return `${student.lastName || ""} ${student.motherLastName || ""} ${student.firstName || ""}`.trim() || id;
                         }
                         return id;
                    }).catch(() => id)
               )
          ).then((names) => {
               if (!cancelled) setOtherStudentNames(names);
          });
          return () => { cancelled = true; };
     }, [incident?.otherStudentsInvolved]);

     if (!incident) return null;

     return (
          <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Incidencia" size="xl">
               <div className="space-y-6">
                    {/* Status & severity badges */}
                    <div className="flex items-center gap-3">
                         <Badge variant={incident.invalidated ? "danger" : STATUS_VARIANT[incident.status] || "gray"} size="md" dot>
                              {incident.invalidated ? "Invalidada" : INCIDENT_STATUS_LABELS[incident.status] || incident.status}
                         </Badge>
                         <Badge variant={SEVERITY_VARIANT[incident.severityLevel] || "gray"} size="md" dot>
                              {SEVERITY_LEVEL_LABELS[incident.severityLevel] || incident.severityLevel}
                         </Badge>
                    </div>

                    {/* Grid info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <DetailRow
                              label="Fecha"
                              value={
                                   incident.incidentDate
                                        ? new Date(incident.incidentDate + "T00:00:00").toLocaleDateString("es-PE")
                                        : null
                              }
                         />
                         <DetailRow label="Hora" value={incident.incidentTime} />
                         <DetailRow label="Año académico" value={incident.academicYear} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <DetailRow
                              label="Tipo de incidente"
                              value={INCIDENT_TYPE_LABELS[incident.incidentType] || incident.incidentType}
                         />
                         <DetailRow label="Estudiante" value={studentName || "Cargando..."} />
                    </div>

                    <div>
                         <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Descripción</p>
                         <p className="text-sm text-gray-800 mt-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                              {incident.description || "—"}
                         </p>
                    </div>

                    {otherStudentNames.length > 0 && (
                         <div>
                              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Otros estudiantes involucrados</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                   {otherStudentNames.map((name, idx) => (
                                        <span
                                             key={idx}
                                             className="inline-flex items-center px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200"
                                        >
                                             {name}
                                        </span>
                                   ))}
                              </div>
                         </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <DetailRow label="Ubicación" value={incident.location} />
                         <DetailRow label="Testigos" value={incident.witnesses} />
                    </div>

                    {incident.immediateAction && (
                         <div>
                              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Acción inmediata</p>
                              <p className="text-sm text-gray-800 mt-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                   {incident.immediateAction}
                              </p>
                         </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <DetailRow
                              label="Padres notificados"
                              value={incident.parentsNotified ? "Sí" : "No"}
                         />
                         <DetailRow
                              label="Requiere seguimiento"
                              value={incident.followUpRequired ? "Sí" : "No"}
                         />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                         <DetailRow label="Reportado por" value={displayReporter} />
                         <DetailRow
                              label="Fecha de reporte"
                              value={
                                   incident.reportedAt
                                        ? new Date(incident.reportedAt).toLocaleString("es-PE")
                                        : null
                              }
                         />
                    </div>

                    {incident.resolvedBy && (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <DetailRow label="Asumido por" value={displayResolver} />
                              <DetailRow
                                   label={incident.status === "IN_PROGRESS" ? "Fecha de asunción" : "Fecha de resolución"}
                                   value={
                                        incident.resolvedAt
                                             ? new Date(incident.resolvedAt).toLocaleString("es-PE")
                                             : null
                                   }
                              />
                         </div>
                    )}

                    {incident.invalidated && (
                         <div className="space-y-3 pt-4 border-t border-gray-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <DetailRow label="Invalidado por" value={incident.invalidatedBy} />
                                   <DetailRow
                                        label="Fecha de invalidación"
                                        value={
                                             incident.invalidatedAt
                                                  ? new Date(incident.invalidatedAt).toLocaleString("es-PE")
                                                  : null
                                        }
                                   />
                              </div>
                              <div>
                                   <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Motivo de invalidación</p>
                                   <p className="text-sm text-gray-800 mt-1 bg-red-50 rounded-xl p-3 border border-red-100">
                                        {incident.invalidationReason || "—"}
                                   </p>
                              </div>
                         </div>
                    )}
               </div>
          </Modal>
     );
}
