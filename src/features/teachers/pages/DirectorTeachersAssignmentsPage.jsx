import { useCallback, useEffect, useMemo, useState } from "react";
import {
     BookOpen,
     CalendarDays,
     Camera,
     ChevronRight,
     Clock,
     ClipboardList,
     FileDown,
     GraduationCap,
     Pencil,
     Plus,
     RefreshCw,
     RotateCcw,
     School,
     Trash2,
     UserPlus,
     Users,
} from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { SearchInput } from "@/shared/components/form";
import { Badge, Button, Card, CredentialsModal, Input, Modal, PaginatedTable, PhotoUploadModal, Select, Table } from "@/shared/components/ui";
import {
     LoadingScreen,
     alertApiError,
     alertConfirmDelete,
     alertConfirmRestore,
     alertCreated,
     alertDeleted,
     alertRestored,
     alertUpdated,
     alertWarning,
} from "@/shared/components/feedback";
import {
     filterDocumentInput,
     filterDigitsOnly,
     filterNameInput,
     filterPhoneInput,
     getDocumentError,
     isRequired,
     isValidDocumentNumber,
     isValidEmail,
     isValidName,
     isValidPhone,
} from "@/core/utils/validators";
import { useTeacherAssignments } from "../hooks/useTeacherAssignments";
import { userService } from "@/features/users/services/userService";
import { useRealTimeValidation } from "@/shared/hooks/useRealTimeValidation";
import { teacherAssignmentService } from "../services/teacherAssignmentService";
import { institutionService } from "@/features/institutions/services/institutionService";
import { parseInstitutionFromApi } from "@/features/institutions/models/institutionModel";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import {
     ASSIGNMENT_STATUS,
     ASSIGNMENT_STATUS_LABELS,
     ASSIGNMENT_TYPE_OPTIONS,
     DAY_OF_WEEK_OPTIONS,
     SESSION_TYPE_OPTIONS,
     TEACHER_USER_ROLE,
     createEmptyAssignment,
     createEmptyTeacherUser,
     formatAssignmentType,
     formatDayOfWeek,
     formatSessionType,
     isTemporalAssignmentType,
     parseTeacherUserFromApi,
} from "../models/teacherModel";
import { generateTeachersListReport, generateTeacherScheduleReport } from "../services/teacherReportService";
import { generateUsersListReport } from "@/features/users/services/userReportService";
import toast from "react-hot-toast";

const PERSONAL_ROLE_TABS = [
     {
          key: TEACHER_USER_ROLE,
          label: "Profesores",
          singularLabel: "Docente",
          description: "Gestion de docentes con sus asignaciones, aulas y horarios.",
     },
     {
          key: "SECRETARIA",
          label: "Secretaria",
          singularLabel: "Secretaria",
          description: "Gestion del personal de secretaria.",
     },
     {
          key: "AUXILIAR",
          label: "Auxiliares",
          singularLabel: "Auxiliar",
          description: "Gestion del personal auxiliar de la institucion.",
     },
     {
          key: "PSICOLOGO",
          label: "Psicologo",
          singularLabel: "Psicologo",
          description: "Gestion del personal de psicologia.",
     },
     {
          key: "SUBDIRECTOR",
          label: "Subdirector",
          singularLabel: "Subdirector",
          description: "Gestion de subdirectores de la institucion.",
     },
];

const NON_TEACHER_ROLE_KEYS = PERSONAL_ROLE_TABS
     .filter((role) => role.key !== TEACHER_USER_ROLE)
     .map((role) => role.key);

function createInitialUsersByRole() {
     return NON_TEACHER_ROLE_KEYS.reduce((accumulator, role) => {
          accumulator[role] = [];
          return accumulator;
     }, {});
}

function toArray(response) {
     const data = isSuccessResponse(response) ? extractData(response) : response;
     return Array.isArray(data) ? data : [];
}

function isUserActive(status) {
     const value = String(status || "").toUpperCase();
     return value === "A" || value === "ACTIVE";
}

function isUserInactive(status) {
     const value = String(status || "").toUpperCase();
     return value === "I" || value === "INACTIVE";
}

function getUserStatusLabel(status) {
     if (isUserActive(status)) return "Activo";
     if (isUserInactive(status)) return "Inactivo";
     return status || "-";
}

function getUserStatusBadgeVariant(status) {
     if (isUserActive(status)) return "success";
     if (isUserInactive(status)) return "warning";
     return "gray";
}

function getRoleConfig(roleKey) {
     return PERSONAL_ROLE_TABS.find((role) => role.key === roleKey) || PERSONAL_ROLE_TABS[0];
}

function validatePersonalUserForm(formData) {
     const newErrors = {};

     if (!isRequired(formData.firstName)) {
          newErrors.firstName = "Nombres requeridos";
     } else if (!isValidName(formData.firstName)) {
          newErrors.firstName = "Solo se permiten letras y espacios";
     }

     if (!isRequired(formData.lastName)) {
          newErrors.lastName = "Apellido paterno requerido";
     } else if (!isValidName(formData.lastName)) {
          newErrors.lastName = "Solo se permiten letras y espacios";
     }

     if (!isRequired(formData.motherLastName)) {
          newErrors.motherLastName = "Apellido materno requerido";
     } else if (!isValidName(formData.motherLastName)) {
          newErrors.motherLastName = "Solo se permiten letras y espacios";
     }

     if (!isRequired(formData.documentType)) {
          newErrors.documentType = "Tipo de documento requerido";
     }

     if (!isRequired(formData.documentNumber)) {
          newErrors.documentNumber = "Numero de documento requerido";
     } else if (!isValidDocumentNumber(formData.documentType, formData.documentNumber)) {
          newErrors.documentNumber = getDocumentError(formData.documentType);
     }

     if (!isRequired(formData.phone)) {
          newErrors.phone = "Telefono requerido";
     } else if (!isValidPhone(formData.phone)) {
          newErrors.phone = "Telefono invalido (9 digitos y empieza con 9)";
     }

     if (formData.email && formData.email.trim() && !isValidEmail(formData.email)) {
          newErrors.email = "Correo electronico invalido";
     }

     return newErrors;
}

function buildCreateUserPayload(formData, role, institutionId) {
     return {
          institutionId,
          firstName: (formData.firstName || "").trim(),
          lastName: (formData.lastName || "").trim(),
          motherLastName: (formData.motherLastName || "").trim(),
          documentType: formData.documentType,
          documentNumber: (formData.documentNumber || "").trim(),
          phone: (formData.phone || "").trim(),
          address: (formData.address || "").trim() || null,
          email: (formData.email || "").trim() || null,
          role,
     };
}

function buildUpdateUserPayload(formData, role) {
     return {
          firstName: (formData.firstName || "").trim(),
          lastName: (formData.lastName || "").trim(),
          motherLastName: (formData.motherLastName || "").trim(),
          documentType: formData.documentType,
          documentNumber: (formData.documentNumber || "").trim(),
          phone: (formData.phone || "").trim(),
          address: (formData.address || "").trim() || null,
          email: (formData.email || "").trim() || null,
          role,
     };
}
function getTeacherBadgeVariant(status) {
     if (isUserActive(status)) return "success";
     if (isUserInactive(status)) return "warning";
     return "gray";
}

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

function getClassroomName(classroom) {
     return classroom?.classroomName || classroom?.name || "Aula sin nombre";
}

function getClassroomAge(classroom) {
     return classroom?.classroomAge || classroom?.age || "";
}

function formatClassroomLabel(classroom) {
     if (!classroom) return "Aula sin nombre";
     const name = getClassroomName(classroom);
     const age = getClassroomAge(classroom);
     return age ? `${name} (${age})` : name;
}

function isActiveAssignment(assignment) {
     return assignment.status === ASSIGNMENT_STATUS.ACTIVE;
}

function toMinutes(timeValue) {
     const [hours, minutes] = String(timeValue || "").split(":").map(Number);
     if (Number.isNaN(hours) || Number.isNaN(minutes)) {
          return null;
     }
     return hours * 60 + minutes;
}

function toHourMinute(timeValue) {
     const value = String(timeValue || "");
     if (!value) return "";
     const [hours, minutes] = value.split(":");
     if (!hours || !minutes) return value;
     return `${hours}:${minutes}`;
}

function toHourMinuteFromMinutes(minutesValue) {
     const hours = String(Math.floor(minutesValue / 60)).padStart(2, "0");
     const minutes = String(minutesValue % 60).padStart(2, "0");
     return `${hours}:${minutes}`;
}

function getInstitutionTimeLimits(institutionSchedules) {
     if (!Array.isArray(institutionSchedules) || institutionSchedules.length === 0) {
          return { min: undefined, max: undefined };
     }

     const validRanges = institutionSchedules
          .map((schedule) => ({
               start: toMinutes(schedule.startTime),
               end: toMinutes(schedule.endTime),
          }))
          .filter((range) => range.start !== null && range.end !== null && range.start < range.end);

     if (validRanges.length === 0) {
          return { min: undefined, max: undefined };
     }

     const minMinutes = Math.min(...validRanges.map((range) => range.start));
     const maxMinutes = Math.max(...validRanges.map((range) => range.end));

     const toTime = (minutes) => {
          const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
          const mins = String(minutes % 60).padStart(2, "0");
          return `${hours}:${mins}`;
     };

     return {
          min: toTime(minMinutes),
          max: toTime(maxMinutes),
     };
}

function getDefaultScheduleTimes(timeLimits) {
     const startTime = timeLimits?.min || "08:00";
     const startMinutes = toMinutes(startTime);
     const maxMinutes = toMinutes(timeLimits?.max);

     if (startMinutes === null || maxMinutes === null) {
          return {
               startTime,
               endTime: "09:00",
          };
     }

     const endMinutes = Math.min(startMinutes + 60, maxMinutes);
     return {
          startTime,
          endTime: endMinutes > startMinutes ? toHourMinuteFromMinutes(endMinutes) : startTime,
     };
}

function isWithinInstitutionSchedules(startTime, endTime, institutionSchedules) {
     if (!Array.isArray(institutionSchedules) || institutionSchedules.length === 0) {
          return true;
     }

     const start = toMinutes(startTime);
     const end = toMinutes(endTime);
     if (start === null || end === null) {
          return false;
     }

     return institutionSchedules.some((schedule) => {
          const scheduleStart = toMinutes(schedule.startTime);
          const scheduleEnd = toMinutes(schedule.endTime);

          if (scheduleStart === null || scheduleEnd === null) {
               return false;
          }

          return start >= scheduleStart && end <= scheduleEnd;
     });
}

function formatInstitutionSchedulesText(institutionSchedules) {
     if (!Array.isArray(institutionSchedules) || institutionSchedules.length === 0) {
          return "No configurado";
     }

     return institutionSchedules
          .map((schedule) => {
               const shift = schedule.shift || "Turno";
               return `${shift}: ${toHourMinute(schedule.startTime)} - ${toHourMinute(schedule.endTime)}`;
          })
          .join(" | ");
}

function hasTimeOverlap(startA, endA, startB, endB) {
     const aStart = toMinutes(startA);
     const aEnd = toMinutes(endA);
     const bStart = toMinutes(startB);
     const bEnd = toMinutes(endB);

     if ([aStart, aEnd, bStart, bEnd].some((value) => value === null)) {
          return false;
     }

     return bStart < aEnd && bEnd > aStart;
}

function generateTimeOptions(minTime, maxTime, stepMinutes = 30, excludeLast = false) {
     const start = toMinutes(minTime) ?? 480;
     const end = toMinutes(maxTime) ?? 1080;
     const options = [];
     const limit = excludeLast ? end - stepMinutes : end;
     for (let m = start; m <= limit; m += stepMinutes) {
          options.push(toHourMinuteFromMinutes(m));
     }
     return options;
}

function getAcademicYearBounds(academicYear) {
     if (!/^\d{4}$/.test(String(academicYear || ""))) {
          return null;
     }

     return {
          minDate: `${academicYear}-03-01`,
          maxDate: `${academicYear}-12-31`,
     };
}

export default function DirectorTeachersAssignmentsPage() {
     const { user } = useAuth();
     const institutionId = user?.institutionId;
     const [defaultAcademicYear] = useState(() => String(new Date().getFullYear()));

     const {
          teachers,
          assignments,
          institutionClassrooms,
          assignmentSchedules,
          selectedAssignmentId,
          loading,
          fetchTeachers,
          fetchAssignments,
          fetchInstitutionClassrooms,
          fetchAssignmentDetails,
          createTeacher,
          createAssignment,
          deleteAssignment,
          restoreAssignment,
          addSchedule,
          addSchedules,
          updateSchedule,
          removeSchedule,
     } = useTeacherAssignments(institutionId);

     const [teacherModalOpen, setTeacherModalOpen] = useState(false);
     const [teacherModalMode, setTeacherModalMode] = useState("create");
     const [selectedTeacher, setSelectedTeacher] = useState(null);
     const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
     const [teacherSearch, setTeacherSearch] = useState("");
     const [assignmentSearch, setAssignmentSearch] = useState("");
     const [teacherErrors, setTeacherErrors] = useState({});
     const [assignmentErrors, setAssignmentErrors] = useState({});
     
     const teacherDocValidation = useRealTimeValidation(userService.existsByDocument);
     const teacherPhoneValidation = useRealTimeValidation(userService.existsByPhone);
     const teacherEmailValidation = useRealTimeValidation(userService.existsByEmail);

     const staffDocValidation = useRealTimeValidation(userService.existsByDocument);
     const staffPhoneValidation = useRealTimeValidation(userService.existsByPhone);
     const staffEmailValidation = useRealTimeValidation(userService.existsByEmail);

     const [teacherForm, setTeacherForm] = useState(createEmptyTeacherUser(institutionId));
     const [assignmentForm, setAssignmentForm] = useState(
          createEmptyAssignment("", institutionId, defaultAcademicYear)
     );

     const [scheduleForm, setScheduleForm] = useState({
          dayOfWeek: "MONDAY",
          selectedDays: ["MONDAY"],
          startTime: "08:00",
          endTime: "09:00",
          sessionType: "REGULAR",
     });
     const [institutionSchedules, setInstitutionSchedules] = useState([]);
     const [institutionData, setInstitutionData] = useState({});
     const [editingScheduleId, setEditingScheduleId] = useState("");

     const [activePersonalRole, setActivePersonalRole] = useState(TEACHER_USER_ROLE);
     const [staffUsersByRole, setStaffUsersByRole] = useState(() => createInitialUsersByRole());
     const [staffLoading, setStaffLoading] = useState(false);
     const [staffSearch, setStaffSearch] = useState("");
     const [staffModalOpen, setStaffModalOpen] = useState(false);
     const [staffModalMode, setStaffModalMode] = useState("create");
     const [selectedStaffUser, setSelectedStaffUser] = useState(null);
     const [staffForm, setStaffForm] = useState(createEmptyTeacherUser(institutionId));
     const [staffErrors, setStaffErrors] = useState({});
     const [teacherPhotoFile, setTeacherPhotoFile] = useState(null);
     const [teacherPhotoPreview, setTeacherPhotoPreview] = useState(null);
     const [staffPhotoFile, setStaffPhotoFile] = useState(null);
     const [staffPhotoPreview, setStaffPhotoPreview] = useState(null);
     const [photoModal, setPhotoModal] = useState({ open: false, assignmentId: null, currentUrl: null });
     const [userPhotoModal, setUserPhotoModal] = useState({ open: false, userId: null, currentUrl: null });
     const [credentialsModal, setCredentialsModal] = useState({ open: false, credentials: null });
     const [lastPhotoUploadTime, setLastPhotoUploadTime] = useState({});

     const fetchAllStaffRoles = useCallback(async () => {
          if (!institutionId) return;

          setStaffLoading(true);
          try {
               const response = await userService.getByInstitution(institutionId);
               const users = toArray(response).map(parseTeacherUserFromApi);

               const groupedUsers = createInitialUsersByRole();
               users.forEach((item) => {
                    if (!NON_TEACHER_ROLE_KEYS.includes(item.role)) return;
                    groupedUsers[item.role].push(item);
               });

               NON_TEACHER_ROLE_KEYS.forEach((role) => {
                    groupedUsers[role].sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
               });

               setStaffUsersByRole(groupedUsers);
          } catch (error) {
               alertApiError(error);
          } finally {
               setStaffLoading(false);
          }
     }, [institutionId]);

     useEffect(() => {
          if (!institutionId) return;
          Promise.all([
               fetchTeachers(),
               fetchAssignments(),
               fetchInstitutionClassrooms(),
               fetchAllStaffRoles(),
          ]);
     }, [institutionId, fetchTeachers, fetchAssignments, fetchInstitutionClassrooms, fetchAllStaffRoles]);

     useEffect(() => {
          if (!institutionId) return;

          let isMounted = true;

          (async () => {
               try {
                    const response = await institutionService.getById(institutionId);
                    const rawInstitution = isSuccessResponse(response) ? extractData(response) : response;
                    const institution = parseInstitutionFromApi(rawInstitution || {});

                    if (isMounted) {
                         setInstitutionSchedules(Array.isArray(institution.schedules) ? institution.schedules : []);
                         setInstitutionData(institution);
                    }
               } catch {
                    if (isMounted) {
                         setInstitutionSchedules([]);
                    }
               }
          })();

          return () => {
               isMounted = false;
          };
     }, [institutionId]);

     const academicYearBounds = useMemo(
          () => getAcademicYearBounds(assignmentForm.academicYear),
          [assignmentForm.academicYear]
     );

     const teachersById = useMemo(() => {
          const map = new Map();
          teachers.forEach((teacher) => map.set(teacher.id, teacher));
          return map;
     }, [teachers]);

     const filteredTeachers = useMemo(() => {
          const term = teacherSearch.trim().toLowerCase();
          if (!term) return teachers;
          return teachers.filter((teacher) => {
               return (
                    teacher.fullName.toLowerCase().includes(term) ||
                    teacher.documentNumber.toLowerCase().includes(term) ||
                    teacher.userName.toLowerCase().includes(term)
               );
          });
     }, [teachers, teacherSearch]);

     const activeTeachers = useMemo(() => {
          return teachers.filter((teacher) => isUserActive(teacher.status));
     }, [teachers]);

     const assignedTeacherIds = useMemo(() => {
          return new Set(
               assignments
                    .filter((assignment) => isActiveAssignment(assignment) && assignment.academicYear === assignmentForm.academicYear)
                    .map((assignment) => assignment.teacherUserId)
                    .filter(Boolean)
          );
     }, [assignments, assignmentForm.academicYear]);

     const availableTeachersForAssignment = useMemo(() => {
          return activeTeachers.filter((teacher) => !assignedTeacherIds.has(teacher.id));
     }, [activeTeachers, assignedTeacherIds]);

     const filteredAssignments = useMemo(() => {
          const term = assignmentSearch.trim().toLowerCase();
          if (!term) return assignments;
          return assignments.filter((assignment) => {
               const teacherName = teachersById.get(assignment.teacherUserId)?.fullName || "";
               return (
                    teacherName.toLowerCase().includes(term) ||
                    String(assignment.academicYear || "").toLowerCase().includes(term) ||
                    String(assignment.assignmentType || "").toLowerCase().includes(term)
               );
          });
     }, [assignments, assignmentSearch, teachersById]);

     const activeRoleConfig = useMemo(() => getRoleConfig(activePersonalRole), [activePersonalRole]);

     const staffUsersForActiveRole = useMemo(
          () => staffUsersByRole[activePersonalRole] || [],
          [staffUsersByRole, activePersonalRole]
     );

     const filteredStaffUsers = useMemo(() => {
          const term = staffSearch.trim().toLowerCase();
          if (!term) return staffUsersForActiveRole;

          return staffUsersForActiveRole.filter((item) => {
               const fullName = String(item.fullName || "").toLowerCase();
               const email = String(item.email || "").toLowerCase();
               const userName = String(item.userName || "").toLowerCase();
               const documentNumber = String(item.documentNumber || "").toLowerCase();
               return (
                    fullName.includes(term) ||
                    email.includes(term) ||
                    userName.includes(term) ||
                    documentNumber.includes(term)
               );
          });
     }, [staffUsersForActiveRole, staffSearch]);

     const activeStaffUsers = useMemo(() => {
          return staffUsersForActiveRole.filter((item) => isUserActive(item.status));
     }, [staffUsersForActiveRole]);

     const inactiveStaffUsers = useMemo(() => {
          return staffUsersForActiveRole.filter((item) => isUserInactive(item.status));
     }, [staffUsersForActiveRole]);

     const selectedAssignment = assignments.find((assignment) => assignment.id === selectedAssignmentId) || null;
     const institutionTimeLimits = useMemo(
          () => getInstitutionTimeLimits(institutionSchedules),
          [institutionSchedules]
     );

     const scheduleValidationError = useMemo(() => {
          const start = toMinutes(scheduleForm.startTime);
          const end = toMinutes(scheduleForm.endTime);
          const selectedDays = Array.isArray(scheduleForm.selectedDays) && scheduleForm.selectedDays.length > 0
               ? scheduleForm.selectedDays
               : [scheduleForm.dayOfWeek];

          if (start === null || end === null) {
               return "Formato de hora invalido";
          }

          if (start >= end) {
               return "La hora de inicio debe ser menor que la hora de fin";
          }

          if (!isWithinInstitutionSchedules(scheduleForm.startTime, scheduleForm.endTime, institutionSchedules)) {
               return `El horario debe estar dentro del horario institucional: ${formatInstitutionSchedulesText(institutionSchedules)}`;
          }

          const hasLocalConflict = assignmentSchedules.some((existing) => {
               return (
                    existing.id !== editingScheduleId &&
                    selectedDays.includes(existing.dayOfWeek) &&
                    hasTimeOverlap(existing.startTime, existing.endTime, scheduleForm.startTime, scheduleForm.endTime)
               );
          });

          if (hasLocalConflict) {
               return "Conflicto de horario: el docente ya tiene una clase en ese rango";
          }

          return "";
     }, [scheduleForm, institutionSchedules, assignmentSchedules, editingScheduleId]);

     const canSubmitSchedule = !scheduleValidationError;

     const takenClassroomIds = useMemo(() => {
          return new Set(
               assignments
                    .filter((a) => isActiveAssignment(a) && a.academicYear === assignmentForm.academicYear)
                    .map((a) => a.classroomId)
                    .filter(Boolean)
          );
     }, [assignments, assignmentForm.academicYear]);

     const availableClassroomOptionsForAssignment = useMemo(() => {
          const activeClassrooms = institutionClassrooms.filter(
               (classroom) => classroom.status === "ACTIVE" || classroom.status === "A"
          );

          const classroomsForAssignment = isTemporalAssignmentType(assignmentForm.assignmentType)
               ? activeClassrooms
               : activeClassrooms.filter((classroom) => !takenClassroomIds.has(classroom.id));

          return classroomsForAssignment.map((classroom) => ({
               value: classroom.id,
               label: formatClassroomLabel(classroom),
          }));
     }, [institutionClassrooms, takenClassroomIds, assignmentForm.assignmentType]);

     const teacherColumns = [
          {
               key: "fullName",
               label: "Docente",
               render: (row) => {
                    const timestamp = lastPhotoUploadTime[row.id];
                    const photoSrc = row.photoUrl ? (timestamp ? `${row.photoUrl}${row.photoUrl.includes('?') ? '&' : '?'}t=${timestamp}` : row.photoUrl) : null;
                    return (
                         <div className="flex items-center gap-3">
                              {photoSrc ? (
                                   <img src={photoSrc} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200" />
                              ) : (
                                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <span className="text-indigo-600 text-xs font-semibold">
                                             {(row.fullName?.[0] || "?").toUpperCase()}
                                        </span>
                                   </div>
                              )}
                              <div>
                                   <p className="font-medium text-gray-900">{row.fullName || "-"}</p>
                                   <p className="text-xs text-gray-500">{row.email || row.userName || "Sin correo"}</p>
                              </div>
                         </div>
                    );
               },
          },
          {
               key: "documentNumber",
               label: "Documento",
               render: (row) => `${row.documentType || "-"} ${row.documentNumber || "-"}`,
          },
          {
               key: "phone",
               label: "Telefono",
               render: (row) => row.phone || "-",
          },
          {
               key: "status",
               label: "Estado",
               render: (row) => (
                    <Badge variant={getTeacherBadgeVariant(row.status)}>
                         {getUserStatusLabel(row.status)}
                    </Badge>
               ),
          },
          {
               key: "actions",
               label: "Acciones",
               render: (row) => (
                    <div className="flex items-center gap-1">
                         <Button
                              size="sm"
                              variant="ghost"
                              icon={Camera}
                              onClick={(event) => {
                                   event.stopPropagation();
                                   setUserPhotoModal({ open: true, userId: row.id, currentUrl: row.photoUrl });
                              }}
                              title="Subir foto"
                         />
                         <Button
                              size="sm"
                              variant="ghost"
                              icon={Pencil}
                              onClick={(event) => {
                                   event.stopPropagation();
                                   openTeacherEditModal(row);
                              }}
                         >
                              Editar
                         </Button>
                         {isUserInactive(row.status) ? (
                              <Button
                                   size="sm"
                                   variant="ghost"
                                   icon={RotateCcw}
                                   onClick={(event) => {
                                        event.stopPropagation();
                                        handleRestoreTeacher(row);
                                   }}
                              >
                                   Restaurar
                              </Button>
                         ) : (
                              <Button
                                   size="sm"
                                   variant="ghost"
                                   icon={Trash2}
                                   onClick={(event) => {
                                        event.stopPropagation();
                                        handleDeactivateTeacher(row);
                                   }}
                              >
                                   Desactivar
                              </Button>
                         )}
                    </div>
               ),
          },
     ];

     const staffColumns = [
          {
               key: "fullName",
               label: activeRoleConfig.singularLabel,
               render: (row) => {
                    const timestamp = lastPhotoUploadTime[row.id];
                    const photoSrc = row.photoUrl ? (timestamp ? `${row.photoUrl}${row.photoUrl.includes('?') ? '&' : '?'}t=${timestamp}` : row.photoUrl) : null;
                    return (
                         <div className="flex items-center gap-3">
                              {photoSrc ? (
                                   <img src={photoSrc} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200" />
                              ) : (
                                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <span className="text-indigo-600 text-xs font-semibold">
                                             {(row.fullName?.[0] || "?").toUpperCase()}
                                        </span>
                                   </div>
                              )}
                              <div>
                                   <p className="font-medium text-gray-900">{row.fullName || "-"}</p>
                                   <p className="text-xs text-gray-500">{row.email || row.userName || "Sin correo"}</p>
                              </div>
                         </div>
                    );
               },
          },
          {
               key: "documentNumber",
               label: "Documento",
               render: (row) => `${row.documentType || "-"} ${row.documentNumber || "-"}`,
          },
          {
               key: "phone",
               label: "Telefono",
               render: (row) => row.phone || "-",
          },
          {
               key: "status",
               label: "Estado",
               render: (row) => (
                    <Badge variant={getUserStatusBadgeVariant(row.status)}>
                         {getUserStatusLabel(row.status)}
                    </Badge>
               ),
          },
          {
               key: "actions",
               label: "Acciones",
               render: (row) => (
                    <div className="flex items-center gap-1">
                         <Button
                              size="sm"
                              variant="ghost"
                              icon={Camera}
                              onClick={(event) => {
                                   event.stopPropagation();
                                   setUserPhotoModal({ open: true, userId: row.id, currentUrl: row.photoUrl });
                              }}
                              title="Subir foto"
                         />
                         <Button
                              size="sm"
                              variant="ghost"
                              icon={Pencil}
                              onClick={(event) => {
                                   event.stopPropagation();
                                   openStaffEditModal(row);
                              }}
                         >
                              Editar
                         </Button>
                         {isUserInactive(row.status) ? (
                              <Button
                                   size="sm"
                                   variant="ghost"
                                   icon={RotateCcw}
                                   onClick={(event) => {
                                        event.stopPropagation();
                                        handleRestoreStaff(row);
                                   }}
                              >
                                   Restaurar
                              </Button>
                         ) : (
                              <Button
                                   size="sm"
                                   variant="ghost"
                                   icon={Trash2}
                                   onClick={(event) => {
                                        event.stopPropagation();
                                        handleDeactivateStaff(row);
                                   }}
                              >
                                   Eliminar
                              </Button>
                         )}
                    </div>
               ),
          },
     ];

     const assignmentColumns = [
          {
               key: "teacherUserId",
               label: "Docente",
               render: (row) => {
                    const teacher = teachersById.get(row.teacherUserId);
                    return (
                         <div>
                              <p className="font-medium text-gray-900">{teacher?.fullName || "Docente desconocido"}</p>
                              <p className="text-xs text-gray-500">{teacher?.documentNumber || ""}</p>
                         </div>
                    );
               },
          },
          {
               key: "classroomId",
               label: "Aula",
               render: (row) => {
                    const classroom = institutionClassrooms.find((c) => c.id === row.classroomId);
                    if (!classroom) return <span className="text-gray-400">Sin aula</span>;
                    return (
                         <div>
                              <p className="font-medium text-gray-800">{getClassroomName(classroom)}</p>
                              <p className="text-xs text-gray-500">{getClassroomAge(classroom)}</p>
                         </div>
                    );
               },
          },
          {
               key: "assignmentType",
               label: "Tipo",
               render: (row) => (
                    <Badge variant="purple" size="sm">{formatAssignmentType(row.assignmentType)}</Badge>
               ),
          },
          {
               key: "academicYear",
               label: "Año",
               render: (row) => (
                    <span className="font-semibold text-gray-700">{row.academicYear || "-"}</span>
               ),
          },
          {
               key: "period",
               label: "Periodo",
               render: (row) => (
                    <span className="text-xs text-gray-600">
                         {formatDate(row.startDate) || "-"} — {formatDate(row.endDate) || "-"}
                    </span>
               ),
          },
          {
               key: "status",
               label: "Estado",
               render: (row) => (
                    <Badge variant={getAssignmentBadgeVariant(row.status)} dot>
                         {ASSIGNMENT_STATUS_LABELS[row.status] || row.status || "-"}
                    </Badge>
               ),
          },
          {
               key: "actions",
               label: "",
               render: (row) => (
                    <div className="flex items-center gap-1">
                         <Button
                              size="sm"
                              variant="outline"
                              icon={Clock}
                              onClick={(event) => {
                                   event.stopPropagation();
                                   handleCancelEditSchedule();
                                   fetchAssignmentDetails(row.id);
                              }}
                         >
                              Horarios
                         </Button>
                         <Button
                              size="sm"
                              variant="ghost"
                              icon={Camera}
                              onClick={(event) => {
                                   event.stopPropagation();
                                   setPhotoModal({ open: true, assignmentId: row.id, currentUrl: row.photoUrl });
                              }}
                              title="Subir foto"
                         />
                         {row.status === ASSIGNMENT_STATUS.DELETED ? (
                              <Button
                                   size="sm"
                                   variant="ghost"
                                   icon={RotateCcw}
                                   onClick={(event) => {
                                        event.stopPropagation();
                                        restoreAssignment(row.id);
                                   }}
                              />
                         ) : (
                              <Button
                                   size="sm"
                                   variant="ghost"
                                   icon={Trash2}
                                   onClick={(event) => {
                                        event.stopPropagation();
                                        deleteAssignment(row.id);
                                   }}
                              />
                         )}
                    </div>
               ),
          },
     ];

     async function handleRefreshAll() {
          await Promise.all([
               fetchTeachers(),
               fetchAssignments(),
               fetchInstitutionClassrooms(),
               fetchAllStaffRoles(),
          ]);
          if (activePersonalRole === TEACHER_USER_ROLE && selectedAssignmentId) {
               await fetchAssignmentDetails(selectedAssignmentId);
          }
     }

     function openStaffCreateModal() {
          setStaffModalMode("create");
          setSelectedStaffUser(null);
          setStaffForm({
               ...createEmptyTeacherUser(institutionId),
               role: activePersonalRole,
          });
          setStaffErrors({});
          setStaffPhotoFile(null);
          setStaffPhotoPreview(null);
          setStaffModalOpen(true);
     }

     function openStaffEditModal(staffUser) {
          setStaffModalMode("edit");
          setSelectedStaffUser(staffUser);
          setStaffForm({
               ...createEmptyTeacherUser(institutionId),
               ...staffUser,
               role: staffUser.role || activePersonalRole,
          });
          setStaffErrors({});
          setStaffPhotoFile(null);
          setStaffPhotoPreview(null);
          setStaffModalOpen(true);
     }

     function closeStaffModal() {
          setStaffModalOpen(false);
          setStaffErrors({});
          setStaffPhotoFile(null);
          setStaffPhotoPreview(null);
          setSelectedStaffUser(null);
     }

     function handleStaffFieldChange(field, value) {
          setStaffForm((prev) => ({ ...prev, [field]: value }));
          
          if (staffModalMode === "create") {
               if (field === "documentNumber") staffDocValidation.validate(value);
               if (field === "phone") staffPhoneValidation.validate(value);
               if (field === "email") staffEmailValidation.validate(value);
          }
          
          if (staffErrors[field]) {
               setStaffErrors((prev) => ({ ...prev, [field]: undefined }));
          }
     }

     function handleStaffDocumentTypeChange(value) {
          setStaffForm((prev) => ({
               ...prev,
               documentType: value,
               documentNumber: "",
          }));
          setStaffErrors((prev) => ({
               ...prev,
               documentType: undefined,
               documentNumber: undefined,
          }));
     }

     function validateStaffForm() {
          const newErrors = validatePersonalUserForm(staffForm);
          setStaffErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     }

     async function handleSubmitStaff(event) {
          event.preventDefault();
          if (!validateStaffForm()) return;

          try {
               if (staffModalMode === "edit" && selectedStaffUser?.id) {
                    await userService.update(
                         selectedStaffUser.id,
                         buildUpdateUserPayload(staffForm, activePersonalRole)
                    );
                    alertUpdated(activeRoleConfig.singularLabel);
               } else {
                    const response = await userService.create(
                         buildCreateUserPayload(staffForm, activePersonalRole, institutionId)
                    );
                    const newUser = isSuccessResponse(response) ? extractData(response) : response;
                    if (staffPhotoFile && newUser?.id) {
                         try { await userService.uploadPhoto(newUser.id, staffPhotoFile); } catch { /* ignorar error de foto */ }
                    }
                    // Mostrar credenciales
                    setCredentialsModal({
                         open: true,
                         credentials: {
                              fullName: [staffForm.firstName, staffForm.lastName, staffForm.motherLastName].filter(Boolean).join(" "),
                              username: newUser?.userName || newUser?.username || "",
                              password: staffForm.documentNumber,
                              role: activeRoleConfig?.singularLabel || activePersonalRole,
                         },
                    });
               }

               closeStaffModal();
               await fetchAllStaffRoles();
          } catch (error) {
               alertApiError(error);
          }
     }

     async function handleDeactivateStaff(staffUser) {
          const confirm = await alertConfirmDelete(activeRoleConfig.singularLabel.toLowerCase());
          if (!confirm.isConfirmed) return;

          try {
               await userService.delete(staffUser.id);
               alertDeleted(activeRoleConfig.singularLabel);
               await fetchAllStaffRoles();
          } catch (error) {
               alertApiError(error);
          }
     }

     async function handleRestoreStaff(staffUser) {
          const confirm = await alertConfirmRestore(activeRoleConfig.singularLabel.toLowerCase());
          if (!confirm.isConfirmed) return;

          try {
               await userService.restore(staffUser.id);
               alertRestored(activeRoleConfig.singularLabel);
               await fetchAllStaffRoles();
          } catch (error) {
               alertApiError(error);
          }
     }

     async function handleDeactivateTeacher(teacher) {
          const confirm = await alertConfirmDelete("docente");
          if (!confirm.isConfirmed) return;

          try {
               await userService.delete(teacher.id);
               alertDeleted("Docente");
               await fetchTeachers();
          } catch (error) {
               alertApiError(error);
          }
     }

     async function handleRestoreTeacher(teacher) {
          const confirm = await alertConfirmRestore("docente");
          if (!confirm.isConfirmed) return;

          try {
               await userService.restore(teacher.id);
               alertRestored("Docente");
               await fetchTeachers();
          } catch (error) {
               alertApiError(error);
          }
     }

     async function handleUploadTeacherPhoto(file) {
          try {
               await teacherAssignmentService.uploadTeacherPhoto(photoModal.assignmentId, file);
               toast.success("Foto del docente actualizada");
               await fetchAssignments();
          } catch (error) {
               alertApiError(error);
               throw error;
          }
     }

     async function handleUploadUserPhoto(file) {
          try {
               await userService.uploadPhoto(userPhotoModal.userId, file);
               toast.success("Foto actualizada");
               setLastPhotoUploadTime(prev => ({ ...prev, [userPhotoModal.userId]: Date.now() }));
               await fetchTeachers();
               await fetchAllStaffRoles();
          } catch (error) {
               alertApiError(error);
               throw error;
          }
     }

     function openTeacherModal() {
          setTeacherModalMode("create");
          setSelectedTeacher(null);
          setTeacherForm(createEmptyTeacherUser(institutionId));
          setTeacherErrors({});
          setTeacherPhotoFile(null);
          setTeacherPhotoPreview(null);
          setTeacherModalOpen(true);
     }

     function openTeacherEditModal(teacher) {
          setTeacherModalMode("edit");
          setSelectedTeacher(teacher);
          setTeacherForm({
               ...createEmptyTeacherUser(institutionId),
               ...teacher,
               role: TEACHER_USER_ROLE,
          });
          setTeacherErrors({});
          setTeacherPhotoFile(null);
          setTeacherPhotoPreview(null);
          setTeacherModalOpen(true);
     }

     function closeTeacherModal() {
          setTeacherModalOpen(false);
          setTeacherModalMode("create");
          setTeacherErrors({});
          setSelectedTeacher(null);
          setTeacherPhotoFile(null);
          setTeacherPhotoPreview(null);
     }

     function openAssignmentModal() {
          setAssignmentForm(createEmptyAssignment("", institutionId, defaultAcademicYear));
          setAssignmentErrors({});
          setAssignmentModalOpen(true);
     }

     function closeAssignmentModal() {
          setAssignmentModalOpen(false);
          setAssignmentErrors({});
     }

     function handleTeacherFieldChange(field, value) {
          setTeacherForm((prev) => ({ ...prev, [field]: value }));
          
          if (teacherModalMode === "create") {
               if (field === "documentNumber") teacherDocValidation.validate(value);
               if (field === "phone") teacherPhoneValidation.validate(value);
               if (field === "email") teacherEmailValidation.validate(value);
          }
          
          if (teacherErrors[field]) {
               setTeacherErrors((prev) => ({ ...prev, [field]: undefined }));
          }
     }

     function handleTeacherDocumentTypeChange(value) {
          setTeacherForm((prev) => ({
               ...prev,
               documentType: value,
               documentNumber: "",
          }));
          setTeacherErrors((prev) => ({
               ...prev,
               documentType: undefined,
               documentNumber: undefined,
          }));
     }

     function handleAssignmentFieldChange(field, value) {
          setAssignmentForm((prev) => ({ ...prev, [field]: value }));
          setAssignmentErrors((prev) => {
               if (field === "assignmentType") {
                    return {
                         ...prev,
                         startDate: undefined,
                         endDate: undefined,
                         notes: undefined,
                    };
               }

               if (field === "startDate" || field === "endDate" || field === "academicYear") {
                    return {
                         ...prev,
                         startDate: undefined,
                         endDate: undefined,
                         academicYear: undefined,
                    };
               }

               if (prev[field]) {
                    return { ...prev, [field]: undefined };
               }

               return prev;
          });

          if (field === "assignmentType" && value === "REGULAR") {
               setAssignmentForm((prev) => ({
                    ...prev,
                    startDate: "",
                    endDate: "",
               }));
          }
     }

     function validateTeacherForm() {
          const newErrors = {};

          if (!isRequired(teacherForm.firstName)) {
               newErrors.firstName = "Nombres requeridos";
          } else if (!isValidName(teacherForm.firstName)) {
               newErrors.firstName = "Solo se permiten letras y espacios";
          }

          if (!isRequired(teacherForm.lastName)) {
               newErrors.lastName = "Apellido paterno requerido";
          } else if (!isValidName(teacherForm.lastName)) {
               newErrors.lastName = "Solo se permiten letras y espacios";
          }

          if (!isRequired(teacherForm.motherLastName)) {
               newErrors.motherLastName = "Apellido materno requerido";
          } else if (!isValidName(teacherForm.motherLastName)) {
               newErrors.motherLastName = "Solo se permiten letras y espacios";
          }

          if (!isRequired(teacherForm.documentType)) {
               newErrors.documentType = "Tipo de documento requerido";
          }

          if (!isRequired(teacherForm.documentNumber)) {
               newErrors.documentNumber = "Número de documento requerido";
          } else if (!isValidDocumentNumber(teacherForm.documentType, teacherForm.documentNumber)) {
               newErrors.documentNumber = getDocumentError(teacherForm.documentType);
          }

          if (!isRequired(teacherForm.phone)) {
               newErrors.phone = "Teléfono requerido";
          } else if (!isValidPhone(teacherForm.phone)) {
               newErrors.phone = "Teléfono inválido (9 dígitos y empieza con 9)";
          }

          if (teacherForm.email && teacherForm.email.trim() && !isValidEmail(teacherForm.email)) {
               newErrors.email = "Correo electrónico inválido";
          }

          setTeacherErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     }

     function validateAssignmentForm() {
          const newErrors = {};
          const isTemporal = isTemporalAssignmentType(assignmentForm.assignmentType);

          if (!isRequired(assignmentForm.teacherUserId)) {
               newErrors.teacherUserId = "Debe seleccionar un docente";
          }

          if (isTemporal) {
               if (!isRequired(assignmentForm.startDate)) {
                    newErrors.startDate = "Fecha de inicio requerida";
               }

               if (!isRequired(assignmentForm.endDate)) {
                    newErrors.endDate = "Fecha de fin requerida";
               }

               if (
                    assignmentForm.startDate &&
                    assignmentForm.endDate &&
                    assignmentForm.startDate > assignmentForm.endDate
               ) {
                    newErrors.endDate = "La fecha de fin debe ser mayor o igual a la fecha de inicio";
               }
          }

          if (!isRequired(assignmentForm.academicYear)) {
               newErrors.academicYear = "Año académico requerido";
          } else if (!/^\d{4}$/.test(assignmentForm.academicYear)) {
               newErrors.academicYear = "Debe ingresar un año válido (4 dígitos)";
          }

          const academicYearBounds = getAcademicYearBounds(assignmentForm.academicYear);

          if (isTemporal) {
               const startYear = assignmentForm.startDate?.split("-")[0];
               const endYear = assignmentForm.endDate?.split("-")[0];
               if (assignmentForm.academicYear && startYear && startYear !== assignmentForm.academicYear) {
                    newErrors.startDate = "La fecha de inicio debe pertenecer al año académico";
               }

               if (assignmentForm.academicYear && endYear && endYear !== assignmentForm.academicYear) {
                    newErrors.endDate = "La fecha de fin debe pertenecer al año académico";
               }

               if (academicYearBounds && assignmentForm.startDate && assignmentForm.startDate < academicYearBounds.minDate) {
                    newErrors.startDate = "En inicial, el periodo lectivo inicia en marzo";
               }
          }

          if (!isRequired(assignmentForm.classroomId)) {
               newErrors.classroomId = "Debe seleccionar un aula";
          } else if (
               assignmentForm.assignmentType === "REGULAR" &&
               !availableClassroomOptionsForAssignment.some((option) => option.value === assignmentForm.classroomId)
          ) {
               newErrors.classroomId = "El aula ya tiene un docente asignado";
          }

          if (isTemporal && !isRequired(assignmentForm.notes)) {
               newErrors.notes = "Las notas son requeridas para suplencia y apoyo";
          }

          setAssignmentErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     }

     async function handleSubmitTeacher(event) {
          event.preventDefault();

          if (!validateTeacherForm()) return;

          try {
               if (teacherModalMode === "edit" && selectedTeacher?.id) {
                    await userService.update(
                         selectedTeacher.id,
                         buildUpdateUserPayload(teacherForm, TEACHER_USER_ROLE)
                    );
                    alertUpdated("Docente");
                    await fetchTeachers();
               } else {
                    const response = await createTeacher(teacherForm);
                    const newTeacher = isSuccessResponse(response) ? extractData(response) : response;
                    if (teacherPhotoFile && newTeacher?.id) {
                         try { await userService.uploadPhoto(newTeacher.id, teacherPhotoFile); } catch { /* ignorar error de foto */ }
                    }
                    // Mostrar credenciales
                    setCredentialsModal({
                         open: true,
                         credentials: {
                              fullName: [teacherForm.firstName, teacherForm.lastName, teacherForm.motherLastName].filter(Boolean).join(" "),
                              username: newTeacher?.userName || newTeacher?.username || "",
                              password: teacherForm.documentNumber,
                              role: "Docente",
                         },
                    });
               }

               setTeacherModalOpen(false);
               setTeacherModalMode("create");
               setSelectedTeacher(null);
               setTeacherForm(createEmptyTeacherUser(institutionId));
               setTeacherErrors({});
               setTeacherPhotoFile(null);
               setTeacherPhotoPreview(null);
          } catch (error) {
               if (!(teacherModalMode === "edit" && selectedTeacher?.id)) {
                    return;
               }
               alertApiError(error);
          }
     }

     async function handleSubmitAssignment(event) {
          event.preventDefault();

          if (!validateAssignmentForm()) return;

          const payload = {
               ...assignmentForm,
               startDate: isTemporalAssignmentType(assignmentForm.assignmentType) ? assignmentForm.startDate : null,
               endDate: isTemporalAssignmentType(assignmentForm.assignmentType) ? assignmentForm.endDate : null,
               notes: assignmentForm.notes?.trim() || null,
          };

          await createAssignment(payload);
          setAssignmentModalOpen(false);
          setAssignmentForm(createEmptyAssignment("", institutionId, defaultAcademicYear));
          setAssignmentErrors({});
     }

     async function handleAddSchedule(event) {
          event.preventDefault();
          if (!selectedAssignmentId) return;

          const defaultTimes = getDefaultScheduleTimes(institutionTimeLimits);
          const selectedDays = Array.isArray(scheduleForm.selectedDays) && scheduleForm.selectedDays.length > 0
               ? scheduleForm.selectedDays
               : [scheduleForm.dayOfWeek];

          if (scheduleValidationError) {
               alertWarning(scheduleValidationError);
               return;
          }

          if (editingScheduleId) {
               await updateSchedule(selectedAssignmentId, editingScheduleId, scheduleForm);
          } else {
               const schedulePayloads = selectedDays.map((dayOfWeek) => ({
                    ...scheduleForm,
                    dayOfWeek,
                    selectedDays: undefined,
               }));

               if (selectedDays.length > 1) {
                    await addSchedules(selectedAssignmentId, schedulePayloads);
               } else {
                    await addSchedule(selectedAssignmentId, schedulePayloads[0]);
               }
          }

          setEditingScheduleId("");
          setScheduleForm((prev) => ({
               ...prev,
               dayOfWeek: "MONDAY",
               selectedDays: ["MONDAY"],
               startTime: defaultTimes.startTime,
               endTime: defaultTimes.endTime,
               sessionType: "REGULAR",
          }));
     }

     function handleEditSchedule(schedule) {
          setEditingScheduleId(schedule.id || "");
          setScheduleForm({
               dayOfWeek: schedule.dayOfWeek || "MONDAY",
               selectedDays: [schedule.dayOfWeek || "MONDAY"],
               startTime: toHourMinute(schedule.startTime) || "08:00",
               endTime: toHourMinute(schedule.endTime) || "09:00",
               sessionType: schedule.sessionType || "REGULAR",
          });
     }

     function handleCancelEditSchedule() {
          const defaultTimes = getDefaultScheduleTimes(institutionTimeLimits);
          setEditingScheduleId("");
          setScheduleForm({
               dayOfWeek: "MONDAY",
               selectedDays: ["MONDAY"],
               startTime: defaultTimes.startTime,
               endTime: defaultTimes.endTime,
               sessionType: "REGULAR",
          });
     }

     function handleSelectAllDays() {
          const allDays = DAY_OF_WEEK_OPTIONS.map((day) => day.value);
          setScheduleForm((prev) => {
               const nextSelectedDays = prev.selectedDays?.length === allDays.length ? ["MONDAY"] : allDays;
               return {
                    ...prev,
                    dayOfWeek: nextSelectedDays[0],
                    selectedDays: nextSelectedDays,
               };
          });
     }

     async function handleRemoveSchedule(scheduleId) {
          if (!selectedAssignmentId || !scheduleId) return;

          await removeSchedule(selectedAssignmentId, scheduleId);
          if (editingScheduleId === scheduleId) {
               handleCancelEditSchedule();
          }
     }

     useEffect(() => {
          setStaffSearch("");
          setStaffErrors({});
          setStaffModalOpen(false);
          setSelectedStaffUser(null);
     }, [activePersonalRole]);

     if (activePersonalRole === TEACHER_USER_ROLE && loading && !teachers.length && !assignments.length) {
          return <LoadingScreen />;
     }

     if (!institutionId) {
          return (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-gray-500 text-sm">
                         No se encontro una institucion asociada a su cuenta.
                    </p>
               </div>
          );
     }

     return (
          <div className="space-y-6">
               <div className="bg-linear-to-r from-primary-600 to-primary-700 rounded-2xl p-6 shadow-lg shadow-primary-600/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                         <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                   <School className="w-7 h-7 text-white" />
                              </div>
                              <div>
                                   <h1 className="text-xl font-bold text-white">Gestion de personal institucional</h1>
                                   <p className="text-sm text-primary-100">
                                        {activeRoleConfig.description}
                                   </p>
                              </div>
                         </div>
                         <div className="flex flex-wrap items-center gap-2">
                              <button
                                   onClick={handleRefreshAll}
                                   className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                              >
                                   <RefreshCw className="w-4 h-4" />
                                   Actualizar
                              </button>
                              {activePersonalRole === TEACHER_USER_ROLE ? (
                                   <>
                                        <button
                                             onClick={() => generateTeachersListReport(teachers, assignments, institutionData)}
                                             className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                                        >
                                             <FileDown className="w-4 h-4" />
                                             Exportar
                                        </button>
                                        <Button variant="secondary" icon={UserPlus} onClick={openTeacherModal}>
                                             Nuevo docente
                                        </Button>
                                        <button
                                             onClick={openAssignmentModal}
                                             className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white text-primary-700 hover:bg-primary-50 rounded-xl shadow-sm transition-colors cursor-pointer"
                                        >
                                             <Plus className="w-4 h-4" />
                                             Nueva asignacion
                                        </button>
                                   </>
                              ) : (
                                   <>
                                        <button
                                             onClick={() => generateUsersListReport(staffUsersForActiveRole, activePersonalRole, institutionData)}
                                             className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                                        >
                                             <FileDown className="w-4 h-4" />
                                             Exportar
                                        </button>
                                        <button
                                             onClick={openStaffCreateModal}
                                             className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white text-primary-700 hover:bg-primary-50 rounded-xl shadow-sm transition-colors cursor-pointer"
                                        >
                                             <UserPlus className="w-4 h-4" />
                                             Nuevo {activeRoleConfig.singularLabel.toLowerCase()}
                                        </button>
                                   </>
                              )}
                         </div>
                    </div>
               </div>

               <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-2">
                    <nav className="flex gap-1 overflow-x-auto py-1.5">
                         {PERSONAL_ROLE_TABS.map((roleTab) => (
                              <button
                                   key={roleTab.key}
                                   onClick={() => setActivePersonalRole(roleTab.key)}
                                   className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${activePersonalRole === roleTab.key
                                        ? "bg-primary-50 text-primary-700 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                              >
                                   {roleTab.label}
                              </button>
                         ))}
                    </nav>
               </div>

               {activePersonalRole === TEACHER_USER_ROLE ? (
                    <>

                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                                   <div className="shrink-0 w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                                        <GraduationCap className="w-6 h-6 text-sky-600" />
                                   </div>
                                   <div>
                                        <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Docentes</p>
                                   </div>
                              </div>
                              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                                   <div className="shrink-0 w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <ClipboardList className="w-6 h-6 text-indigo-600" />
                                   </div>
                                   <div>
                                        <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Asignaciones</p>
                                   </div>
                              </div>
                              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                                   <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-emerald-600" />
                                   </div>
                                   <div>
                                        <p className="text-2xl font-bold text-gray-900">{institutionClassrooms.length}</p>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aulas</p>
                                   </div>
                              </div>
                         </div>

                         <Card padding="p-0" className="overflow-hidden">
                              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-sky-50">
                                             <Users className="w-4 h-4 text-sky-600" />
                                        </div>
                                        <h2 className="text-base font-semibold text-gray-900">Docentes de la institucion</h2>
                                   </div>
                                   <Badge variant="info" size="sm">{teachers.length} registrados</Badge>
                              </div>
                              <div className="p-4 space-y-3">
                                   <SearchInput
                                        value={teacherSearch}
                                        onChange={setTeacherSearch}
                                        placeholder="Buscar por nombre, documento o username..."
                                   />
                                   <PaginatedTable
                                        columns={teacherColumns}
                                        data={filteredTeachers}
                                        emptyMessage="No hay docentes registrados."
                                        pageSize={5}
                                        pageSizeOptions={[5, 10]}
                                        showStatusFilter={false}
                                   />
                              </div>
                         </Card>

                         <Card padding="p-0" className="overflow-hidden">
                              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-50">
                                             <ClipboardList className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <h2 className="text-base font-semibold text-gray-900">Asignaciones docentes</h2>
                                   </div>
                                   <Badge variant="primary" size="sm">{assignments.length} asignaciones</Badge>
                              </div>
                              <div className="p-4 space-y-3">
                                   <SearchInput
                                        value={assignmentSearch}
                                        onChange={setAssignmentSearch}
                                        placeholder="Buscar por docente, tipo o año..."
                                   />
                                   <Table
                                        columns={assignmentColumns}
                                        data={filteredAssignments}
                                        onRowClick={(row) => {
                                             handleCancelEditSchedule();
                                             fetchAssignmentDetails(row.id);
                                        }}
                                        emptyMessage="No hay asignaciones registradas."
                                   />
                              </div>
                         </Card>

                         {selectedAssignment ? (
                              <Card padding="p-0" className="overflow-hidden">
                                   <div className="bg-linear-to-r from-indigo-50 to-purple-50 px-6 py-5 border-b border-indigo-100/50">
                                        <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-4">
                                                  <div className="p-2.5 rounded-xl bg-indigo-100">
                                                       <CalendarDays className="w-5 h-5 text-indigo-600" />
                                                  </div>
                                                  <div>
                                                       <h2 className="text-lg font-semibold text-gray-900">Gestion de horarios</h2>
                                                       <p className="text-sm text-gray-600">
                                                            {teachersById.get(selectedAssignment.teacherUserId)?.fullName || selectedAssignment.teacherUserId}
                                                       </p>
                                                  </div>
                                             </div>
                                             {assignmentSchedules.length > 0 && (
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       icon={FileDown}
                                                       onClick={() => {
                                                            const teacher = selectedAssignment
                                                                 ? teachersById.get(selectedAssignment.teacherUserId)
                                                                 : null;
                                                            if (teacher) {
                                                                 generateTeacherScheduleReport(
                                                                      teacher,
                                                                      assignmentSchedules,
                                                                      institutionClassrooms,
                                                                      institutionData,
                                                                      selectedAssignment.classroomId
                                                                 );
                                                            }
                                                       }}
                                                  >
                                                       Exportar horario
                                                  </Button>
                                             )}
                                        </div>
                                   </div>

                                   <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                             <div className="flex items-center gap-3">
                                                  <BookOpen className="w-4 h-4 text-gray-400" />
                                                  <div>
                                                       <p className="text-xs text-gray-500">Aula asignada</p>
                                                       <p className="text-sm font-medium text-gray-900">
                                                            {selectedAssignment.classroomId
                                                                 ? formatClassroomLabel(institutionClassrooms.find((c) => c.id === selectedAssignment.classroomId))
                                                                 : "Sin aula definida"}
                                                       </p>
                                                  </div>
                                             </div>
                                             <div className="flex items-center gap-3">
                                                  <CalendarDays className="w-4 h-4 text-gray-400" />
                                                  <div>
                                                       <p className="text-xs text-gray-500">Periodo</p>
                                                       <p className="text-sm font-medium text-gray-900">
                                                            {formatDate(selectedAssignment.startDate)} — {formatDate(selectedAssignment.endDate)}
                                                       </p>
                                                  </div>
                                             </div>
                                             <div className="flex items-center gap-3">
                                                  <Clock className="w-4 h-4 text-gray-400" />
                                                  <div>
                                                       <p className="text-xs text-gray-500">Horario institucional</p>
                                                       <p className="text-sm font-medium text-gray-900">
                                                            {formatInstitutionSchedulesText(institutionSchedules)}
                                                       </p>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>

                                   <div className="p-6 space-y-5">
                                        <div className="flex items-center justify-between">
                                             <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-indigo-500" />
                                                  {editingScheduleId ? "Editar horario" : "Agregar horario"}
                                             </h3>
                                             {editingScheduleId && (
                                                  <Badge variant="warning" size="sm">Editando</Badge>
                                             )}
                                        </div>

                                        <form className="space-y-4" onSubmit={handleAddSchedule}>
                                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                  <div className="space-y-1.5">
                                                       <div className="flex items-center justify-between gap-2">
                                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Día</label>
                                                            {!editingScheduleId && (
                                                                 <Button
                                                                      type="button"
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={handleSelectAllDays}
                                                                      className="h-8 px-3 text-xs"
                                                                 >
                                                                      Todos los días
                                                                 </Button>
                                                            )}
                                                       </div>
                                                       <div className="flex gap-1">
                                                            {DAY_OF_WEEK_OPTIONS.map((day) => (
                                                                 <button
                                                                      key={day.value}
                                                                      type="button"
                                                                      onClick={() => setScheduleForm((prev) => ({
                                                                           ...prev,
                                                                           dayOfWeek: day.value,
                                                                           selectedDays: [day.value],
                                                                      }))}
                                                                      className={[
                                                                           "flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                                                                           Array.isArray(scheduleForm.selectedDays) && scheduleForm.selectedDays.includes(day.value)
                                                                                ? "bg-indigo-600 text-white shadow-sm"
                                                                                : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200",
                                                                      ].join(" ")}
                                                                      title={day.label}
                                                                 >
                                                                      {day.short}
                                                                 </button>
                                                            ))}
                                                       </div>
                                                  </div>
                                                  <div className="space-y-1.5">
                                                       <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Hora inicio</label>
                                                       <select
                                                            value={scheduleForm.startTime}
                                                            onChange={(e) => setScheduleForm((prev) => {
                                                                 const newStart = e.target.value;
                                                                 const startMins = toMinutes(newStart);
                                                                 const endMins = toMinutes(prev.endTime);
                                                                 const nextEnd = startMins !== null && endMins !== null && startMins >= endMins
                                                                      ? toHourMinuteFromMinutes(Math.min(startMins + 30, toMinutes(institutionTimeLimits.max) || startMins + 60))
                                                                      : prev.endTime;
                                                                 return { ...prev, startTime: newStart, endTime: nextEnd };
                                                            })}
                                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer font-medium text-gray-700"
                                                       >
                                                            {generateTimeOptions(institutionTimeLimits.min, institutionTimeLimits.max, 30, true).map((t) => (
                                                                 <option key={t} value={t}>{t}</option>
                                                            ))}
                                                       </select>
                                                  </div>
                                                  <div className="space-y-1.5">
                                                       <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Hora fin</label>
                                                       <select
                                                            value={scheduleForm.endTime}
                                                            onChange={(e) => setScheduleForm((prev) => ({ ...prev, endTime: e.target.value }))}
                                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer font-medium text-gray-700"
                                                       >
                                                            {generateTimeOptions(scheduleForm.startTime, institutionTimeLimits.max, 30, false).map((t) => (
                                                                 <option key={t} value={t}>{t}</option>
                                                            ))}
                                                       </select>
                                                  </div>
                                                  <div className="space-y-1.5">
                                                       <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Sesión</label>
                                                       <select
                                                            value={scheduleForm.sessionType}
                                                            onChange={(e) => setScheduleForm((prev) => ({ ...prev, sessionType: e.target.value }))}
                                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer font-medium text-gray-700"
                                                       >
                                                            {SESSION_TYPE_OPTIONS.map((opt) => (
                                                                 <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                       </select>
                                                  </div>
                                             </div>
                                             {scheduleValidationError && (
                                                  <p className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
                                                       <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                                       {scheduleValidationError}
                                                  </p>
                                             )}
                                             {!editingScheduleId && Array.isArray(scheduleForm.selectedDays) && scheduleForm.selectedDays.length > 1 && (
                                                  <p className="text-xs text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-3 py-2 rounded-lg">
                                                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                                       Se registrará el mismo horario en {scheduleForm.selectedDays.length} días.
                                                  </p>
                                             )}
                                             <div className="flex items-center gap-2">
                                                  <Button type="submit" variant="primary" disabled={!canSubmitSchedule} size="sm">
                                                       {editingScheduleId ? "Guardar cambios" : "Agregar horario"}
                                                  </Button>
                                                  {editingScheduleId && (
                                                       <Button type="button" variant="ghost" size="sm" onClick={handleCancelEditSchedule}>
                                                            Cancelar
                                                       </Button>
                                                  )}
                                             </div>
                                        </form>

                                        <div className="border-t border-gray-100 pt-5">
                                             <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                  <ClipboardList className="w-4 h-4 text-indigo-500" />
                                                  Horarios registrados
                                                  <Badge variant="gray" size="sm">{assignmentSchedules.length}</Badge>
                                             </h3>
                                             <div className="space-y-2 max-h-64 overflow-y-auto">
                                                  {assignmentSchedules.length === 0 ? (
                                                       <div className="flex flex-col items-center justify-center py-8 text-center">
                                                            <Clock className="w-8 h-8 text-gray-300 mb-2" />
                                                            <p className="text-sm text-gray-500">Sin horarios registrados</p>
                                                            <p className="text-xs text-gray-400">Use el formulario para agregar el primer horario</p>
                                                       </div>
                                                  ) : (
                                                       assignmentSchedules.map((schedule) => {
                                                            const classroom = institutionClassrooms.find(
                                                                 (entry) => entry.id === selectedAssignment.classroomId
                                                            );
                                                            return (
                                                                 <div
                                                                      key={schedule.id}
                                                                      className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 transition-colors ${editingScheduleId === schedule.id
                                                                           ? "border-amber-300 bg-amber-50/50"
                                                                           : "border-gray-100 bg-white hover:bg-gray-50"
                                                                           }`}
                                                                 >
                                                                      <div className="flex items-center gap-4">
                                                                           <div className="w-20 text-center">
                                                                                <Badge variant="primary" size="sm">
                                                                                     {formatDayOfWeek(schedule.dayOfWeek)}
                                                                                </Badge>
                                                                           </div>
                                                                           <div>
                                                                                <p className="text-sm font-semibold text-gray-800">
                                                                                     {schedule.startTime} — {schedule.endTime}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                     {getClassroomName(classroom)} · {formatSessionType(schedule.sessionType)}
                                                                                </p>
                                                                           </div>
                                                                      </div>
                                                                      <div className="flex items-center gap-1">
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                icon={Pencil}
                                                                                onClick={() => handleEditSchedule(schedule)}
                                                                           />
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                icon={Trash2}
                                                                                onClick={() => handleRemoveSchedule(schedule.id)}
                                                                           />
                                                                      </div>
                                                                 </div>
                                                            );
                                                       })
                                                  )}
                                             </div>
                                        </div>
                                   </div>
                              </Card>
                         ) : (
                              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center">
                                   <div className="p-3 rounded-full bg-gray-100 mb-3">
                                        <ChevronRight className="w-6 h-6 text-gray-400" />
                                   </div>
                                   <p className="text-sm font-medium text-gray-600">Seleccione una asignacion</p>
                                   <p className="text-xs text-gray-400 mt-1">
                                        Haga clic en una fila de la tabla o pulse "Horarios" para gestionar los horarios del docente
                                   </p>
                              </div>
                         )}
                    </>
               ) : (
                    <>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                                   <div className="shrink-0 w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-sky-600" />
                                   </div>
                                   <div>
                                        <p className="text-2xl font-bold text-gray-900">{staffUsersForActiveRole.length}</p>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{activeRoleConfig.label}</p>
                                   </div>
                              </div>
                              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                                   <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-emerald-600" />
                                   </div>
                                   <div>
                                        <p className="text-2xl font-bold text-gray-900">{activeStaffUsers.length}</p>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Activos</p>
                                   </div>
                              </div>
                              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                                   <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-amber-600" />
                                   </div>
                                   <div>
                                        <p className="text-2xl font-bold text-gray-900">{inactiveStaffUsers.length}</p>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inactivos</p>
                                   </div>
                              </div>
                         </div>

                         <Card padding="p-0" className="overflow-hidden">
                              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-sky-50">
                                             <Users className="w-4 h-4 text-sky-600" />
                                        </div>
                                        <h2 className="text-base font-semibold text-gray-900">{activeRoleConfig.label} de la institucion</h2>
                                   </div>
                                   <Badge variant="info" size="sm">{staffUsersForActiveRole.length} registrados</Badge>
                              </div>
                              <div className="p-4 space-y-3">
                                   <SearchInput
                                        value={staffSearch}
                                        onChange={setStaffSearch}
                                        placeholder={`Buscar ${activeRoleConfig.singularLabel.toLowerCase()} por nombre, documento o correo...`}
                                   />
                                   <Table
                                        columns={staffColumns}
                                        data={filteredStaffUsers}
                                        emptyMessage={
                                             staffLoading
                                                  ? "Cargando personal..."
                                                  : `No hay ${activeRoleConfig.label.toLowerCase()} registrados.`
                                        }
                                   />
                              </div>
                         </Card>
                    </>
               )}

               <Modal
                    isOpen={teacherModalOpen}
                    onClose={closeTeacherModal}
                    title={teacherModalMode === "edit" ? "Editar docente" : "Registrar docente"}
                    size="lg"
               >
                    <form onSubmit={handleSubmitTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div className="md:col-span-2 flex flex-col items-center gap-2 pb-2">
                              <div className="relative">
                                   {teacherPhotoPreview ? (
                                        <img src={teacherPhotoPreview} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200" />
                                   ) : (
                                        <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center">
                                             <Camera className="w-7 h-7 text-indigo-300" />
                                        </div>
                                   )}
                              </div>
                              <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                                   {teacherPhotoPreview ? "Cambiar foto" : "Agregar foto (opcional)"}
                                   <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        className="hidden"
                                        onChange={(e) => {
                                             const file = e.target.files?.[0];
                                             if (!file) return;
                                             if (file.size > 5 * 1024 * 1024) { toast.error("La foto no debe superar 5MB"); return; }
                                             setTeacherPhotoFile(file);
                                             setTeacherPhotoPreview(URL.createObjectURL(file));
                                        }}
                                   />
                              </label>
                              {teacherPhotoPreview && (
                                   <button type="button" onClick={() => { setTeacherPhotoFile(null); setTeacherPhotoPreview(null); }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Quitar foto</button>
                              )}
                         </div>
                         <Input
                              label="Nombres"
                              value={teacherForm.firstName}
                              onChange={(event) => handleTeacherFieldChange("firstName", event.target.value)}
                              filter={filterNameInput}
                              error={teacherErrors.firstName}
                              required
                         />
                         <Input
                              label="Apellido paterno"
                              value={teacherForm.lastName}
                              onChange={(event) => handleTeacherFieldChange("lastName", event.target.value)}
                              filter={filterNameInput}
                              error={teacherErrors.lastName}
                              required
                         />
                         <Input
                              label="Apellido materno"
                              value={teacherForm.motherLastName}
                              onChange={(event) => handleTeacherFieldChange("motherLastName", event.target.value)}
                              filter={filterNameInput}
                              error={teacherErrors.motherLastName}
                              required
                         />
                         <Select
                              label="Tipo documento"
                              value={teacherForm.documentType}
                              onChange={(event) => handleTeacherDocumentTypeChange(event.target.value)}
                              options={[
                                   { value: "DNI", label: "DNI" },
                                   { value: "CNE", label: "CNE" },
                              ]}
                              error={teacherErrors.documentType}
                         />
                         <Input
                              label="Numero documento"
                              value={teacherForm.documentNumber}
                              onChange={(event) => handleTeacherFieldChange("documentNumber", event.target.value)}
                              filter={(value) => filterDocumentInput(teacherForm.documentType, value)}
                              maxLength={teacherForm.documentType === "DNI" ? 8 : 12}
                              error={teacherErrors.documentNumber || teacherDocValidation.error}
                              required
                         />
                         <Input
                              label="Telefono"
                              value={teacherForm.phone}
                              onChange={(event) => handleTeacherFieldChange("phone", event.target.value)}
                              filter={filterPhoneInput}
                              maxLength={9}
                              error={teacherErrors.phone || teacherPhoneValidation.error}
                              required
                         />
                         <Input
                              label="Correo"
                              type="email"
                              value={teacherForm.email}
                              onChange={(event) => handleTeacherFieldChange("email", event.target.value)}
                              error={teacherErrors.email || teacherEmailValidation.error}
                         />
                         <Input
                              label="Direccion"
                              value={teacherForm.address}
                              onChange={(event) => handleTeacherFieldChange("address", event.target.value)}
                         />
                         <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                              <Button type="button" variant="ghost" onClick={closeTeacherModal}>
                                   Cancelar
                              </Button>
                              <Button type="submit" variant="primary">
                                   {teacherModalMode === "edit" ? "Guardar cambios" : "Guardar docente"}
                              </Button>
                         </div>
                    </form>
               </Modal>

               <Modal
                    isOpen={staffModalOpen}
                    onClose={closeStaffModal}
                    title={
                         staffModalMode === "edit"
                              ? `Editar ${activeRoleConfig.singularLabel.toLowerCase()}`
                              : `Registrar ${activeRoleConfig.singularLabel.toLowerCase()}`
                    }
                    size="lg"
               >
                    <form onSubmit={handleSubmitStaff} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div className="md:col-span-2 flex flex-col items-center gap-2 pb-2">
                              <div className="relative">
                                   {staffPhotoPreview ? (
                                        <img src={staffPhotoPreview} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200" />
                                   ) : (
                                        <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center">
                                             <Camera className="w-7 h-7 text-indigo-300" />
                                        </div>
                                   )}
                              </div>
                              <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                                   {staffPhotoPreview ? "Cambiar foto" : "Agregar foto (opcional)"}
                                   <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        className="hidden"
                                        onChange={(e) => {
                                             const file = e.target.files?.[0];
                                             if (!file) return;
                                             if (file.size > 5 * 1024 * 1024) { toast.error("La foto no debe superar 5MB"); return; }
                                             setStaffPhotoFile(file);
                                             setStaffPhotoPreview(URL.createObjectURL(file));
                                        }}
                                   />
                              </label>
                              {staffPhotoPreview && (
                                   <button type="button" onClick={() => { setStaffPhotoFile(null); setStaffPhotoPreview(null); }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Quitar foto</button>
                              )}
                         </div>
                         <Input
                              label="Nombres"
                              value={staffForm.firstName}
                              onChange={(event) => handleStaffFieldChange("firstName", event.target.value)}
                              filter={filterNameInput}
                              error={staffErrors.firstName}
                              required
                         />
                         <Input
                              label="Apellido paterno"
                              value={staffForm.lastName}
                              onChange={(event) => handleStaffFieldChange("lastName", event.target.value)}
                              filter={filterNameInput}
                              error={staffErrors.lastName}
                              required
                         />
                         <Input
                              label="Apellido materno"
                              value={staffForm.motherLastName}
                              onChange={(event) => handleStaffFieldChange("motherLastName", event.target.value)}
                              filter={filterNameInput}
                              error={staffErrors.motherLastName}
                              required
                         />
                         <Select
                              label="Tipo documento"
                              value={staffForm.documentType}
                              onChange={(event) => handleStaffDocumentTypeChange(event.target.value)}
                              options={[
                                   { value: "DNI", label: "DNI" },
                                   { value: "CNE", label: "CNE" },
                              ]}
                              error={staffErrors.documentType}
                         />
                         <Input
                              label="Numero documento"
                              value={staffForm.documentNumber}
                              onChange={(event) => handleStaffFieldChange("documentNumber", event.target.value)}
                              filter={(value) => filterDocumentInput(staffForm.documentType, value)}
                              maxLength={staffForm.documentType === "DNI" ? 8 : 12}
                              error={staffErrors.documentNumber || staffDocValidation.error}
                              required
                         />
                         <Input
                              label="Telefono"
                              value={staffForm.phone}
                              onChange={(event) => handleStaffFieldChange("phone", event.target.value)}
                              filter={filterPhoneInput}
                              maxLength={9}
                              error={staffErrors.phone || staffPhoneValidation.error}
                              required
                         />
                         <Input
                              label="Correo"
                              type="email"
                              value={staffForm.email}
                              onChange={(event) => handleStaffFieldChange("email", event.target.value)}
                              error={staffErrors.email || staffEmailValidation.error}
                         />
                         <Input
                              label="Direccion"
                              value={staffForm.address}
                              onChange={(event) => handleStaffFieldChange("address", event.target.value)}
                         />
                         <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                              <Button type="button" variant="ghost" onClick={closeStaffModal}>
                                   Cancelar
                              </Button>
                              <Button type="submit" variant="primary">
                                   {staffModalMode === "edit" ? "Guardar cambios" : "Guardar"}
                              </Button>
                         </div>
                    </form>
               </Modal>

               <Modal
                    isOpen={assignmentModalOpen}
                    onClose={closeAssignmentModal}
                    title="Nueva asignacion docente"
                    size="lg"
               >
                    <form onSubmit={handleSubmitAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <Select
                              label="Docente"
                              value={assignmentForm.teacherUserId}
                              onChange={(event) => handleAssignmentFieldChange("teacherUserId", event.target.value)}
                              options={availableTeachersForAssignment.map((teacher) => ({
                                   value: teacher.id,
                                   label: teacher.fullName,
                              }))}
                              placeholder="Seleccione docente"
                              error={assignmentErrors.teacherUserId}
                              required
                         />
                         <Select
                              label="Tipo"
                              value={assignmentForm.assignmentType}
                              onChange={(event) => handleAssignmentFieldChange("assignmentType", event.target.value)}
                              options={ASSIGNMENT_TYPE_OPTIONS}
                         />
                         <Select
                              label="Aula"
                              value={assignmentForm.classroomId}
                              onChange={(event) => handleAssignmentFieldChange("classroomId", event.target.value)}
                              options={availableClassroomOptionsForAssignment}
                              placeholder={
                                   isTemporalAssignmentType(assignmentForm.assignmentType)
                                        ? "Seleccione aula"
                                        : "Seleccione aula disponible"
                              }
                              error={assignmentErrors.classroomId}
                              required
                         />
                         {isTemporalAssignmentType(assignmentForm.assignmentType) ? (
                              <>
                                   <Input
                                        label="Fecha inicio"
                                        type="date"
                                        value={assignmentForm.startDate}
                                        onChange={(event) => handleAssignmentFieldChange("startDate", event.target.value)}
                                        min={academicYearBounds?.minDate}
                                        max={academicYearBounds?.maxDate}
                                        error={assignmentErrors.startDate}
                                   />
                                   <Input
                                        label="Fecha fin"
                                        type="date"
                                        value={assignmentForm.endDate}
                                        onChange={(event) => handleAssignmentFieldChange("endDate", event.target.value)}
                                        min={assignmentForm.startDate || academicYearBounds?.minDate}
                                        max={academicYearBounds?.maxDate}
                                        error={assignmentErrors.endDate}
                                   />
                              </>
                         ) : (
                              <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                   La asignación regular cubre todo el año académico. No requiere fechas de inicio ni fin.
                              </div>
                         )}
                         <Input
                              label="Año académico"
                              value={assignmentForm.academicYear}
                              onChange={(event) => handleAssignmentFieldChange("academicYear", event.target.value)}
                              filter={(value) => filterDigitsOnly(value, 4)}
                              error={assignmentErrors.academicYear}
                              placeholder="2026"
                         />
                         <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Notas {isTemporalAssignmentType(assignmentForm.assignmentType) ? <span className="text-red-500">*</span> : null}
                              </label>
                              <textarea
                                   className="w-full border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                   rows={3}
                                   value={assignmentForm.notes}
                                   onChange={(event) => handleAssignmentFieldChange("notes", event.target.value)}
                                   placeholder={
                                        isTemporalAssignmentType(assignmentForm.assignmentType)
                                             ? "Describe la razón o alcance de la suplencia / apoyo"
                                             : "Opcional"
                                   }
                                   required={isTemporalAssignmentType(assignmentForm.assignmentType)}
                              />
                              {assignmentErrors.notes ? <p className="mt-1 text-xs text-red-500">{assignmentErrors.notes}</p> : null}
                         </div>
                         <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                              <Button type="button" variant="ghost" onClick={closeAssignmentModal}>
                                   Cancelar
                              </Button>
                              <Button type="submit" variant="primary">
                                   Guardar asignacion
                              </Button>
                         </div>
                    </form>
               </Modal>

               <PhotoUploadModal
                    isOpen={photoModal.open}
                    onClose={() => setPhotoModal({ open: false, assignmentId: null, currentUrl: null })}
                    onUpload={handleUploadTeacherPhoto}
                    title="Foto del docente"
                    currentPhotoUrl={photoModal.currentUrl}
               />

               <PhotoUploadModal
                    isOpen={userPhotoModal.open}
                    onClose={() => setUserPhotoModal({ open: false, userId: null, currentUrl: null })}
                    onUpload={handleUploadUserPhoto}
                    title="Foto del usuario"
                    currentPhotoUrl={userPhotoModal.currentUrl}
               />

               <CredentialsModal
                    isOpen={credentialsModal.open}
                    onClose={() => setCredentialsModal({ open: false, credentials: null })}
                    credentials={credentialsModal.credentials}
               />
          </div>
     );
}
