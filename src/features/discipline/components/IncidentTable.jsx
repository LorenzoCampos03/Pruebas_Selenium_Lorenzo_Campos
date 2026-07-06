import { Badge, PaginatedTable } from "@/shared/components/ui";
import {
     INCIDENT_STATUS,
     INCIDENT_STATUS_LABELS,
     INCIDENT_TYPE_LABELS,
     SEVERITY_LEVEL_LABELS,
     SEVERITY_VARIANT,
     STATUS_VARIANT,
} from "../models/disciplineModel";
import { Eye, Pencil, PlayCircle, CheckCircle, Lock, Trash2 } from "lucide-react";

function normalizeText(value) {
     return String(value || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase();
}

const STATUS_FILTERS = [
     { value: "all", label: "Todos" },
     { value: INCIDENT_STATUS.OPEN, label: "Abiertos" },
     { value: INCIDENT_STATUS.IN_PROGRESS, label: "En Proceso" },
     { value: INCIDENT_STATUS.RESOLVED, label: "Resueltos" },
     { value: INCIDENT_STATUS.CLOSED, label: "Cerrados" },
];

export default function IncidentTable({
     incidents,
     onView,
     onEdit,
     onAssignResponsible,
     onResolve,
     onClose,
     onInvalidate,
     currentUserName,
     currentUsername,
     emptyMessage,
}) {
     function isOwnIncident(row) {
          const reportedBy = normalizeText(row?.reportedBy);
          const myName = normalizeText(currentUserName);
          const myUsername = normalizeText(currentUsername);

          return !!reportedBy && (reportedBy === myName || reportedBy === myUsername);
     }

     function isResponsibleIncident(row) {
          const responsible = normalizeText(row?.resolvedBy);
          const myName = normalizeText(currentUserName);
          const myUsername = normalizeText(currentUsername);

          return !!responsible && (responsible === myName || responsible === myUsername);
     }

     const columns = [
          {
               key: "incidentDate",
               label: "Fecha",
               width: "110px",
               render: (row) => (
                    <div>
                         <p className="text-sm font-medium text-gray-800">
                              {row.incidentDate
                                   ? new Date(row.incidentDate + "T00:00:00").toLocaleDateString("es-PE")
                                   : "—"}
                         </p>
                         <p className="text-xs text-gray-400">{row.incidentTime || ""}</p>
                    </div>
               ),
          },
          {
               key: "incidentType",
               label: "Tipo",
               width: "120px",
               render: (row) => (
                    <span className="text-sm text-gray-700">
                         {INCIDENT_TYPE_LABELS[row.incidentType] || row.incidentType}
                    </span>
               ),
          },
          {
               key: "description",
               label: "Descripción",
               render: (row) => (
                    <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                         {row.description || "—"}
                    </p>
               ),
          },
          {
               key: "severityLevel",
               label: "Severidad",
               width: "110px",
               render: (row) => (
                    <Badge variant={SEVERITY_VARIANT[row.severityLevel] || "gray"} size="sm" dot>
                         {SEVERITY_LEVEL_LABELS[row.severityLevel] || row.severityLevel}
                    </Badge>
               ),
          },
          {
               key: "status",
               label: "Estado",
               width: "120px",
               render: (row) => (
                    <Badge variant={row.invalidated ? "gray" : STATUS_VARIANT[row.status] || "gray"} size="sm" dot>
                         {row.invalidated ? "Invalidada" : INCIDENT_STATUS_LABELS[row.status] || row.status}
                    </Badge>
               ),
          },
          {
               key: "reportedBy",
               label: "Reportado por",
               width: "130px",
               render: (row) => (
                    <span className="text-xs text-gray-500">{row.reportedBy || "—"}</span>
               ),
          },
          {
               key: "actions",
               label: "Acciones",
               width: "150px",
               render: (row) => {
                    const ownIncident = isOwnIncident(row);
                    const responsibleIncident = isResponsibleIncident(row);

                    return (
                    <div className="flex items-center gap-1">
                         {/* Ver detalles - siempre visible */}
                         <button
                              onClick={(e) => {
                                   e.stopPropagation();
                                   onView(row);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                              title="Ver detalles"
                         >
                              <Eye className="w-4 h-4" />
                         </button>

                         {/* Editar - solo cuando está Abierto y es incidencia propia */}
                         {ownIncident && row.status === INCIDENT_STATUS.OPEN && (
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(row);
                                   }}
                                   className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                   title="Editar"
                              >
                                   <Pencil className="w-4 h-4" />
                              </button>
                         )}

                         {/* Pasar a En Proceso - solo cuando está Abierto y no es incidencia propia */}
                         {!ownIncident && row.status === INCIDENT_STATUS.OPEN && (
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onAssignResponsible(row);
                                   }}
                                   className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                   title="Pasar a En Proceso"
                              >
                                   <PlayCircle className="w-4 h-4" />
                              </button>
                         )}

                         {/* Resolver - solo responsable cuando está En Proceso */}
                         {responsibleIncident && row.status === INCIDENT_STATUS.IN_PROGRESS && (
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onResolve(row);
                                   }}
                                   className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                   title="Resolver"
                              >
                                   <CheckCircle className="w-4 h-4" />
                              </button>
                         )}

                         {/* Cerrar - solo responsable cuando está Resuelto */}
                         {responsibleIncident && row.status === INCIDENT_STATUS.RESOLVED && (
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onClose(row);
                                   }}
                                   className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                   title="Cerrar incidencia"
                              >
                                   <Lock className="w-4 h-4" />
                              </button>
                         )}

                         {/* Invalidar - solo incidencia propia */}
                         {ownIncident && (
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onInvalidate(row);
                                   }}
                                   className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                   title="Invalidar incidencia"
                              >
                                   <Trash2 className="w-4 h-4" />
                              </button>
                         )}
                    </div>
                    );
               },
          },
     ];

     return (
          <PaginatedTable
               columns={columns}
               data={incidents}
               statusField="status"
               statusFilters={STATUS_FILTERS}
               showStatusFilter={true}
               emptyMessage={emptyMessage || "No se encontraron incidencias"}
               pageSize={10}
          />
     );
}
