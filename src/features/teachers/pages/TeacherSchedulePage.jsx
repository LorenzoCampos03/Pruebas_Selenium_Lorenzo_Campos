import { useEffect } from "react";
import { CalendarDays, Clock, MapPin, BookOpen, Calendar } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { Badge, Card, Table } from "@/shared/components/ui";
import { LoadingScreen } from "@/shared/components/feedback";
import { useTeacherMySchedule } from "../hooks/useTeacherMySchedule";
import {
     ASSIGNMENT_STATUS,
     ASSIGNMENT_STATUS_LABELS,
     formatAssignmentType,
     formatDayOfWeek,
     formatSessionType,
} from "../models/teacherModel";

function getAssignmentBadgeVariant(status) {
     if (status === ASSIGNMENT_STATUS.ACTIVE) return "success";
     if (status === ASSIGNMENT_STATUS.INACTIVE) return "warning";
     if (status === ASSIGNMENT_STATUS.DELETED) return "danger";
     return "gray";
}

function formatDate(dateStr) {
     if (!dateStr) return null;
     const [year, month, day] = dateStr.split("-");
     if (!year || !month || !day) return dateStr;
     return `${day}/${month}/${year}`;
}

const DAY_COLORS = {
     MONDAY: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
     TUESDAY: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
     WEDNESDAY: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
     THURSDAY: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
     FRIDAY: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
     SATURDAY: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
     SUNDAY: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
};

export default function TeacherSchedulePage() {
     const { user } = useAuth();
     const teacherUserId = user?.userId;
     const institutionId = user?.institutionId;

     const {
          assignments,
          schedulesByAssignment,
          classroomsMap,
          loading,
          fetchMyAssignments,
     } = useTeacherMySchedule();

     useEffect(() => {
          if (!teacherUserId) return;
          fetchMyAssignments(teacherUserId, institutionId);
     }, [teacherUserId, institutionId, fetchMyAssignments]);

     if (loading && assignments.length === 0) {
          return <LoadingScreen />;
     }

     if (!teacherUserId) {
          return (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-gray-500 text-sm">
                         No se pudo identificar el docente autenticado.
                    </p>
               </div>
          );
     }

     const activeCount = assignments.filter(a => a.status === ASSIGNMENT_STATUS.ACTIVE).length;

     return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

               {/* Header */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a365d]">
                              <CalendarDays className="h-5 w-5 text-white" />
                         </div>
                         <div>
                              <h1 className="text-xl font-bold text-gray-900">Mi Horario y Asignaciones</h1>
                              <p className="text-sm text-gray-500">Consulta tus asignaciones vigentes y horarios programados</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              <span className="text-sm font-medium text-gray-700">
                                   {activeCount} activa{activeCount !== 1 ? "s" : ""}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="text-sm text-gray-500">{assignments.length} total</span>
                         </div>
                    </div>
               </div>

               {/* Content */}
               {assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-16 text-center">
                         <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm`}>
                              <CalendarDays className="h-7 w-7 text-gray-400" />
                         </div>
                         <h3 className="text-base font-semibold text-gray-800 mb-1">Sin asignaciones</h3>
                         <p className="text-sm text-gray-500 max-w-xs mx-auto">
                              No tienes asignaciones registradas para este periodo.
                         </p>
                    </div>
               ) : (
                    <div className="space-y-6">
                         {assignments.map((assignment) => {
                              const schedules = (schedulesByAssignment[assignment.id] || []).map((s) => ({
                                   ...s,
                                   classroomId: s.classroomId || assignment.classroomId,
                              }));
                              const isActive = assignment.status === ASSIGNMENT_STATUS.ACTIVE;

                              return (
                                   <div
                                        key={assignment.id}
                                        className={`rounded-xl bg-white shadow-sm overflow-hidden transition-opacity ${!isActive ? "opacity-70" : ""}`}
                                   >
                                        {/* Card header */}
                                        <div className={`px-6 py-4 ${isActive ? "bg-linear-to-r from-[#1a365d]/5 to-transparent" : "bg-gray-50"}`}>
                                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                  <div className="flex items-center gap-3">
                                                       <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? "bg-[#1a365d]" : "bg-gray-300"}`}>
                                                            <BookOpen className="h-4 w-4 text-white" />
                                                       </div>
                                                       <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                 <h2 className="text-base font-bold text-gray-900">
                                                                      {formatAssignmentType(assignment.assignmentType)}
                                                                 </h2>
                                                                 <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                                                      {assignment.academicYear || "Sin año"}
                                                                 </span>
                                                                 <Badge variant={getAssignmentBadgeVariant(assignment.status)} className="text-xs">
                                                                      {ASSIGNMENT_STATUS_LABELS[assignment.status] || assignment.status || "-"}
                                                                 </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
                                                                 <Calendar className="h-3.5 w-3.5" />
                                                                 <span>
                                                                      {formatDate(assignment.startDate) || "-"} — {formatDate(assignment.endDate) || "-"}
                                                                 </span>
                                                            </div>
                                                       </div>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-white rounded-lg px-3 py-1.5 self-start sm:self-auto shadow-sm">
                                                       <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                       <span>{schedules.length} bloque{schedules.length !== 1 ? "s" : ""}</span>
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Schedule list */}
                                        {schedules.length === 0 ? (
                                             <div className="px-6 py-8 text-center text-sm text-gray-400">
                                                  No hay horarios definidos para esta asignación.
                                             </div>
                                        ) : (
                                             <div className="divide-y divide-gray-50">
                                                  {/* Table header */}
                                                  <div className="hidden sm:grid grid-cols-4 gap-4 px-6 py-2.5 bg-gray-50">
                                                       <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Día</span>
                                                       <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Horario</span>
                                                       <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Aula asignada</span>
                                                       <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo de sesión</span>
                                                  </div>
                                                  {schedules.map((row, i) => {
                                                       const dayColor = DAY_COLORS[row.dayOfWeek] || DAY_COLORS.SUNDAY;
                                                       const classroomName = classroomsMap[row.classroomId]?.classroomName;
                                                       const classroomAge = classroomsMap[row.classroomId]?.classroomAge;
                                                       const displayName = classroomName
                                                            ? `${classroomName}${classroomAge ? ` (${classroomAge})` : ""}`
                                                            : "Aula sin nombre";
                                                       return (
                                                            <div
                                                                 key={row.id || i}
                                                                 className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-3.5 hover:bg-gray-50/70 transition-colors"
                                                            >
                                                                 <div className="flex items-center">
                                                                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold tracking-wide ${dayColor.bg} ${dayColor.text}`}>
                                                                           {formatDayOfWeek(row.dayOfWeek)}
                                                                      </span>
                                                                 </div>
                                                                 <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                                      <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                                      <span className="font-medium tabular-nums">
                                                                           {row.startTime} — {row.endTime}
                                                                      </span>
                                                                 </div>
                                                                 <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                                      <span>{displayName}</span>
                                                                 </div>
                                                                 <div className="flex items-center">
                                                                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                                           {formatSessionType(row.sessionType)}
                                                                      </span>
                                                                 </div>
                                                            </div>
                                                       );
                                                  })}
                                             </div>
                                        )}
                                   </div>
                              );
                         })}
                    </div>
               )}
          </div>
     );
}
