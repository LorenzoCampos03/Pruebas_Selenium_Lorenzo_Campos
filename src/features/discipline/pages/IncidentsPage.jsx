import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, RefreshCw, FileDown, Plus, Eye, Pencil, PlayCircle, CheckCircle, Lock, Trash2, ClipboardList, ShieldAlert, UserPlus } from "lucide-react";
import { Badge, Button, Card, PaginatedTable } from "@/shared/components/ui";
import { SearchInput } from "@/shared/components/form";
import { LoadingScreen, alertConfirmUpdate, alertSuccess, alertError, alertApiError, alertConfirmAction, alertConfirmWithInput } from "@/shared/components/feedback";
import { useIncidents } from "../hooks/useIncidents";
import IncidentModal from "../components/IncidentModal";
import IncidentDetailModal from "../components/IncidentDetailModal";

import { useAuth } from "@/core/auth/AuthContext";
import { studentService } from "@/features/students/services/studentService";
import { isSuccessResponse, extractData } from "@/core/api/apiResponse";
import { generateIncidentsListReport, generateIncidentsCsvReport, generateIncidentDetailReport } from "../services/incidentReportService";
import { institutionService } from "@/features/institutions/services/institutionService";
import { userService } from "@/features/users/services/userService";
import { parseInstitutionFromApi } from "@/features/institutions/models/institutionModel";
import {
     INCIDENT_STATUS,
     INCIDENT_STATUS_LABELS,
     INCIDENT_TYPE_LABELS,
     SEVERITY_LEVEL_LABELS,
     SEVERITY_VARIANT,
     STATUS_VARIANT,
} from "../models/disciplineModel";

function normalizeText(value) {
     return String(value || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase();
}

const INCIDENT_TABS = [
     { key: "mine", label: "Mis incidencias" },
     { key: "available", label: "Por asumir" },
     { key: "assumed", label: "Asumidas" },
     { key: "invalidated", label: "Invalidadas" },
];

export default function IncidentsPage() {
     const { user } = useAuth();
     const {
          incidents,
          loading,
          fetchAll,
          createIncident,
          updateIncident,
          assignResponsible,
          resolveIncident,
          closeIncident,
          invalidateIncident,
     } = useIncidents(user);

     const [search, setSearch] = useState("");
     const [modalOpen, setModalOpen] = useState(false);
     const [detailModalOpen, setDetailModalOpen] = useState(false);
     const [selectedIncident, setSelectedIncident] = useState(null);
     const [reporting, setReporting] = useState({ loading: false, format: null });
     const [activeTab, setActiveTab] = useState("mine");
     const [usersMap, setUsersMap] = useState({});

     useEffect(() => {
          if (user?.institutionId) {
               userService.getByInstitution(user.institutionId)
                    .then((response) => {
                         const data = isSuccessResponse(response) ? extractData(response) : response;
                         if (Array.isArray(data)) {
                              const map = {};
                              data.forEach((u) => {
                                   const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
                                   map[u.id] = name || u.username;
                              });
                              setUsersMap(map);
                         }
                    })
                    .catch(() => {});
          }
     }, [user?.institutionId]);

     useEffect(() => {
          fetchAll();
     }, [fetchAll]);

     const loggedUserName = useMemo(
          () => (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : ""),
          [user]
     );
     const loggedUsername = user?.username || "";

     function isMyIncident(incident) {
          if (incident?.invalidated) return false;
          const reportedBy = normalizeText(incident?.reportedBy);
          const myName = normalizeText(loggedUserName);
          const myUsername = normalizeText(loggedUsername);
          return !!incident?.reportedBy && (
               incident.reportedBy === user?.userId || 
               reportedBy === myName || 
               reportedBy === myUsername
          );
     }

     function isResponsibleIncident(incident) {
          if (incident?.invalidated) return false;
          const responsible = normalizeText(incident?.resolvedBy);
          const myName = normalizeText(loggedUserName);
          const myUsername = normalizeText(loggedUsername);
          return !!incident?.resolvedBy && (
               incident.resolvedBy === user?.userId || 
               responsible === myName || 
               responsible === myUsername
          );
     }

     function isAssumedIncident(incident) {
          return (
               !incident?.invalidated &&
               isResponsibleIncident(incident) &&
               [INCIDENT_STATUS.IN_PROGRESS, INCIDENT_STATUS.RESOLVED, INCIDENT_STATUS.CLOSED].includes(
                    incident.status
               )
          );
     }

     function isInvalidatedIncident(incident) {
          return Boolean(incident?.invalidated);
     }

     // --- Filtering ---

     const filteredIncidents = incidents.filter((inc) => {
          if (!search) return true;
          const term = search.toLowerCase();
          return (
               inc.description?.toLowerCase().includes(term) ||
               inc.studentId?.toLowerCase().includes(term) ||
               inc.reportedBy?.toLowerCase().includes(term) ||
               inc.location?.toLowerCase().includes(term) ||
               inc.incidentType?.toLowerCase().includes(term)
          );
     });

     const myIncidents = useMemo(
          () => filteredIncidents.filter((inc) => isMyIncident(inc)),
          [filteredIncidents, loggedUserName, loggedUsername]
     );

     const availableToAssumeIncidents = useMemo(
          () =>
               filteredIncidents.filter(
                    (inc) => !inc?.invalidated && !isMyIncident(inc) && inc.status === INCIDENT_STATUS.OPEN
               ),
          [filteredIncidents, loggedUserName, loggedUsername]
     );

     const assumedIncidents = useMemo(
          () => filteredIncidents.filter((inc) => isAssumedIncident(inc)),
          [filteredIncidents, loggedUserName, loggedUsername]
     );

     const invalidatedIncidents = useMemo(
          () => filteredIncidents.filter((inc) => isInvalidatedIncident(inc)),
          [filteredIncidents]
     );

     const activeIncidentsByTab = {
          mine: myIncidents,
          available: availableToAssumeIncidents,
          assumed: assumedIncidents,
          invalidated: invalidatedIncidents,
     };

     const activeIncidents = activeIncidentsByTab[activeTab] || myIncidents;

     // --- Actions ---

     function handleCreate() {
          setSelectedIncident(null);
          setModalOpen(true);
     }

     function handleEdit(incident) {
          setSelectedIncident(incident);
          setModalOpen(true);
     }

     function handleView(incident) {
          setSelectedIncident(incident);
          setDetailModalOpen(true);
     }

     async function handleSave(id, data) {
          if (id) {
               const confirm = await alertConfirmUpdate("incidencia");
               if (!confirm.isConfirmed) return;
               await updateIncident(id, data);
          } else {
               await createIncident(data);
          }
          setModalOpen(false);
          fetchAll();
     }

     async function handleAssignResponsible(incident) {
          if (isMyIncident(incident)) {
               alertError("No puede asumir como responsable una incidencia que usted reportó");
               return;
          }

          const { isConfirmed } = await alertConfirmAction({
               title: "Asumir Incidencia",
               message: "¿Desea asumir esta incidencia y pasarla a En Proceso?",
               icon: "question",
               confirmText: "Sí, asumir incidencia",
               cancelText: "Cancelar",
               confirmColor: "blue",
          });

          if (isConfirmed) {
               const resolvedBy = user?.userId || "";
               await assignResponsible(incident.id, resolvedBy);
               fetchAll();
          }
     }

     async function handleResolve(incident) {
          if (!isResponsibleIncident(incident)) {
               alertError("Solo el usuario que asumió la incidencia puede marcarla como resuelta");
               return;
          }

          const { isConfirmed } = await alertConfirmAction({
               title: "Resolver Incidencia",
               html: `¿Confirmar que la incidencia fue resuelta?<br/><span class="text-xs text-gray-400 mt-1 block">Responsable: <strong>${incident.resolvedBy || "—"}</strong></span>`,
               icon: "question",
               confirmText: "Resolver",
               cancelText: "Cancelar",
               confirmColor: "emerald",
          });

          if (isConfirmed) {
               await resolveIncident(incident.id, incident.resolvedBy || "");
               fetchAll();
          }
     }

     async function handleClose(incident) {
          if (!isResponsibleIncident(incident)) {
               alertError("Solo el usuario que asumió la incidencia puede cerrarla");
               return;
          }

          const { isConfirmed } = await alertConfirmAction({
               title: "Cerrar Incidencia",
               message: "¿Está seguro de cerrar esta incidencia? Esta acción es definitiva.",
               icon: "warning",
               confirmText: "Cerrar incidencia",
               cancelText: "Cancelar",
               confirmColor: "gray",
          });

          if (isConfirmed) {
               await closeIncident(incident.id);
               fetchAll();
          }
     }

     async function handleInvalidate(incident) {
          const { value: reason, isConfirmed } = await alertConfirmWithInput({
               title: "Invalidar incidencia",
               message: "Indique el motivo por el cual se invalida este registro:",
               inputPlaceholder: "Ej: registro duplicado o error de digitación",
               confirmText: "Invalidar",
               cancelText: "Cancelar",
               icon: "delete",
               confirmColor: "red",
               maxLength: 500,
          });

          if (!isConfirmed) return;

          await invalidateIncident(
               incident.id,
               loggedUserName || loggedUsername || "Sistema",
               reason.trim()
          );
          fetchAll();
     }

     async function handleDownloadSingleReport(incident) {
          try {
               setReporting({ loading: true, format: "pdf" });

               let studentName = incident.studentId;
               let otherStudentNames = [];

               try {
                    const res = await studentService.getById(incident.studentId);
                    const student = isSuccessResponse(res) ? extractData(res) : res;
                    if (student) studentName = `${student.lastName || ""} ${student.motherLastName || ""} ${student.firstName || ""}`.trim();
               } catch {}

               if (incident.otherStudentsInvolved?.length) {
                    const names = await Promise.all(
                         incident.otherStudentsInvolved.map(id => studentService.getById(id).then(r => {
                              const s = isSuccessResponse(r) ? extractData(r) : r;
                              return s ? `${s.lastName || ""} ${s.motherLastName || ""} ${s.firstName || ""}`.trim() : id;
                         }).catch(() => id))
                    );
                    otherStudentNames = names;
               }

               let institution = {};
               if (user?.institutionId) {
                    try {
                         const instRes = await institutionService.getById(user.institutionId);
                         const rawInst = isSuccessResponse(instRes) ? extractData(instRes) : instRes;
                         institution = parseInstitutionFromApi(rawInst || {});
                    } catch {}
               }

               const enrichedIncident = {
                    ...incident,
                    studentName,
                    otherStudentNames,
                    reporterName: incident.reportedBy === user?.userId ? loggedUserName : (usersMap[incident.reportedBy] || incident.reportedBy),
                    resolverName: incident.resolvedBy === user?.userId ? loggedUserName : (usersMap[incident.resolvedBy] || incident.resolvedBy),
               };

               await generateIncidentDetailReport(enrichedIncident, institution);
               alertSuccess("Ficha PDF generada correctamente");
          } catch (error) {
               alertApiError(error);
          } finally {
               setReporting({ loading: false, format: null });
          }
     }

     async function handleGenerateReport(format) {
          if (!activeIncidents.length) {
               alertError("No hay incidencias para generar reporte con los filtros actuales");
               return;
          }

          try {
               setReporting({ loading: true, format });

               // Fetch student names
               let studentsById = {};
               if (user?.institutionId) {
                    const response = await studentService.getByInstitution(user.institutionId);
                    const data = isSuccessResponse(response) ? extractData(response) : response;
                    const students = Array.isArray(data) ? data : [];

                    studentsById = students.reduce((acc, student) => {
                         const fullName = `${student.lastName || ""} ${student.motherLastName || ""} ${student.firstName || ""}`.trim();
                         if (student?.id) {
                              acc[student.id] = fullName || student.id;
                         }
                         return acc;
                    }, {});
               }

               const incidentsWithStudentName = activeIncidents.map((incident) => ({
                    ...incident,
                    studentName: studentsById[incident.studentId] || incident.studentId || "",
               }));

               // Fetch institution data (same pattern as DirectorTeachersAssignmentsPage)
               let institution = {};
               if (user?.institutionId) {
                    try {
                         const instRes = await institutionService.getById(user.institutionId);
                         const rawInst = isSuccessResponse(instRes) ? extractData(instRes) : instRes;
                         institution = parseInstitutionFromApi(rawInst || {});
                    } catch {
                         // Continue with empty institution
                    }
               }

               if (format === "pdf") {
                    alertError("La generación global de PDF ha sido reemplazada por reportes individuales.");
                    return;
               }

               generateIncidentsCsvReport(incidentsWithStudentName);
               alertSuccess("Reporte CSV generado correctamente");
          } catch (error) {
               alertApiError(error);
          } finally {
               setReporting({ loading: false, format: null });
          }
     }

     // --- Inline column helpers (same pattern as UsersListPage) ---

     function isOwnIncident(row) {
          const reportedBy = normalizeText(row?.reportedBy);
          const myName = normalizeText(loggedUserName);
          const myUsername = normalizeText(loggedUsername);
          return !!row?.reportedBy && (
               row.reportedBy === user?.userId || 
               reportedBy === myName || 
               reportedBy === myUsername
          );
     }

     function isResponsibleForRow(row) {
          const responsible = normalizeText(row?.resolvedBy);
          const myName = normalizeText(loggedUserName);
          const myUsername = normalizeText(loggedUsername);
          return !!row?.resolvedBy && (
               row.resolvedBy === user?.userId || 
               responsible === myName || 
               responsible === myUsername
          );
     }

     const columns = [
          {
               key: "incidentDate",
               label: "Fecha",
               width: "110px",
               render: (row) => (
                    <div>
                         <p className="font-medium text-gray-900">
                              {row.incidentDate
                                   ? new Date(row.incidentDate + "T00:00:00").toLocaleDateString("es-PE")
                                   : "—"}
                         </p>
                         <p className="text-xs text-gray-500">{row.incidentTime || ""}</p>
                    </div>
               ),
          },
          {
               key: "incidentType",
               label: "Tipo",
               width: "120px",
               render: (row) => (
                    <Badge variant={getTypeBadgeVariant(row.incidentType)} size="sm">
                         {INCIDENT_TYPE_LABELS[row.incidentType] || row.incidentType}
                    </Badge>
               ),
          },
          {
               key: "description",
               label: "Descripción",
               render: (row) => (
                    <div>
                         <p className="font-medium text-gray-900 line-clamp-1 max-w-xs">
                              {row.description || "—"}
                         </p>
                         <p className="text-xs text-gray-500">{row.location || "Sin ubicación"}</p>
                    </div>
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
               width: "140px",
               render: (row) => {
                    const reporterName = row.reportedBy === user?.userId ? loggedUserName : (usersMap[row.reportedBy] || row.reportedBy || "—");
                    const resolverName = row.resolvedBy === user?.userId ? loggedUserName : (usersMap[row.resolvedBy] || row.resolvedBy);

                    return (
                         <div>
                              <p className="font-medium text-gray-900 line-clamp-1">{reporterName}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">
                                   {resolverName ? `Resp: ${resolverName}` : "Sin responsable"}
                              </p>
                         </div>
                    );
               },
          },
          {
               key: "actions",
               label: "Acciones",
               width: "150px",
               render: (row) => {
                    const ownIncident = isOwnIncident(row);
                    const responsibleIncident = isResponsibleForRow(row);
                    const isInvalidatedTab = activeTab === "invalidated";

                    return (
                         <div className="flex items-center gap-1">
                              {/* Ver detalles - siempre visible */}
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        handleView(row);
                                   }}
                                   className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                                   title="Ver detalles"
                              >
                                   <Eye className="w-4 h-4" />
                              </button>

                              {/* Descargar Ficha PDF - siempre visible */}
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadSingleReport(row);
                                   }}
                                   disabled={reporting.loading}
                                   className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                                   title="Descargar Ficha PDF"
                              >
                                   <FileDown className="w-4 h-4" />
                              </button>

                              {/* Solo mostrar más acciones si NO está en la pestaña Invalidadas */}
                              {!isInvalidatedTab && (
                                   <>
                                        {/* Editar - solo cuando está Abierto y es incidencia propia */}
                                        {ownIncident && row.status === INCIDENT_STATUS.OPEN && (
                                             <button
                                                  onClick={(e) => {
                                                       e.stopPropagation();
                                                       handleEdit(row);
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
                                                       handleAssignResponsible(row);
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
                                                       handleResolve(row);
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
                                                       handleClose(row);
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
                                                       handleInvalidate(row);
                                                  }}
                                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                  title="Invalidar incidencia"
                                             >
                                                  <Trash2 className="w-4 h-4" />
                                             </button>
                                        )}
                                   </>
                              )}
                         </div>
                    );
               },
          },
     ];

     // --- Render ---

     if (loading && incidents.length === 0) {
          return <LoadingScreen />;
     }

     return (
          <div className="space-y-6">
               {/* Header - gradient banner like DirectorTeachersAssignmentsPage */}
               <div className="bg-red-700 rounded-2xl p-6 shadow-lg shadow-red-700/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                         <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                   <AlertTriangle className="w-7 h-7 text-white" />
                              </div>
                              <div>
                                   <h1 className="text-xl font-bold text-white">Gestión de incidencias</h1>
                                   <p className="text-sm text-red-100">Registro y seguimiento disciplinario</p>
                              </div>
                         </div>
                         <div className="flex flex-wrap items-center gap-2">
                              <button
                                   onClick={fetchAll}
                                   className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                              >
                                   <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                   Actualizar
                              </button>
                              <button
                                   onClick={() => handleGenerateReport("csv")}
                                   disabled={reporting.loading || !activeIncidents.length}
                                   className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                   <FileDown className="w-4 h-4" />
                                   Exportar CSV
                              </button>
                              {activeTab === "mine" && (
                                   <button
                                        onClick={handleCreate}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white text-red-700 hover:bg-red-50 rounded-xl shadow-sm transition-colors cursor-pointer"
                                   >
                                        <Plus className="w-4 h-4" />
                                        Nueva Incidencia
                                   </button>
                              )}
                         </div>
                    </div>
               </div>

               {/* Tabs - pill style in white card like DirectorTeachersAssignmentsPage */}
               <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-2">
                    <nav className="flex gap-1 overflow-x-auto py-1.5">
                         {INCIDENT_TABS.map((tab) => (
                              <button
                                   key={tab.key}
                                   onClick={() => setActiveTab(tab.key)}
                                   className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.key
                                        ? "bg-red-50 text-red-700 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                              >
                                   {tab.label}
                              </button>
                         ))}
                    </nav>
               </div>

               {/* Stats cards */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                         <div className="shrink-0 w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                              <AlertTriangle className="w-6 h-6 text-red-600" />
                         </div>
                         <div>
                              <p className="text-2xl font-bold text-gray-900">{activeIncidents.length}</p>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Incidencias</p>
                         </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                         <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                              <ShieldAlert className="w-6 h-6 text-amber-600" />
                         </div>
                         <div>
                              <p className="text-2xl font-bold text-gray-900">
                                   {activeIncidents.filter(i => i.status === INCIDENT_STATUS.OPEN || i.status === INCIDENT_STATUS.IN_PROGRESS).length}
                              </p>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pendientes</p>
                         </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                         <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-emerald-600" />
                         </div>
                         <div>
                              <p className="text-2xl font-bold text-gray-900">
                                   {activeIncidents.filter(i => i.status === INCIDENT_STATUS.RESOLVED || i.status === INCIDENT_STATUS.CLOSED).length}
                              </p>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Resueltas</p>
                         </div>
                    </div>
               </div>

               {/* Table card with section header like DirectorTeachersAssignmentsPage */}
               <Card padding="p-0" className="overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-red-50">
                                   <ClipboardList className="w-4 h-4 text-red-600" />
                              </div>
                              <h2 className="text-base font-semibold text-gray-900">
                                   {activeTab === "mine" ? "Mis incidencias" : activeTab === "available" ? "Incidencias por asumir" : activeTab === "assumed" ? "Incidencias asumidas" : "Incidencias invalidadas"}
                              </h2>
                         </div>
                         <Badge variant="danger" size="sm">{activeIncidents.length} registros</Badge>
                    </div>
                    <div className="p-4 space-y-3">
                         <SearchInput
                              value={search}
                              onChange={setSearch}
                              placeholder="Buscar por descripción, estudiante, ubicación o tipo..."
                         />
                         <PaginatedTable
                              columns={columns}
                              data={activeIncidents}
                              emptyMessage={
                                   activeTab === "mine"
                                        ? "No se encontraron incidencias registradas por usted."
                                        : activeTab === "available"
                                             ? "No hay incidencias de otros usuarios disponibles para asumir."
                                             : activeTab === "assumed"
                                                  ? "No hay incidencias asumidas por usted."
                                                  : "No hay incidencias invalidadas."
                              }
                              pageSize={5}
                              pageSizeOptions={[5, 10]}
                              showStatusFilter={false}
                         />
                    </div>
               </Card>

               {/* Create/Edit Modal */}
               <IncidentModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    incident={selectedIncident}
                    onSave={handleSave}
                    usersMap={usersMap}
               />

               {/* Detail Modal */}
               <IncidentDetailModal
                    isOpen={detailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    incident={selectedIncident}
                    usersMap={usersMap}
               />
          </div>
     );
}

function getTypeBadgeVariant(type) {
     const map = {
          PHYSICAL: "danger",
          VERBAL: "warning",
          BULLYING: "purple",
          DISRUPTION: "info",
          VANDALISM: "gray",
          OTHER: "gray",
     };
     return map[type] || "gray";
}
