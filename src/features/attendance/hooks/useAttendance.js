import { useState, useCallback } from "react";
import { attendanceService } from "../services/attendanceService";
import { parseAttendanceFromApi } from "../models/attendanceModel";
import Swal from "sweetalert2";

const alertSuccess = (message, title = "¡Éxito!") => {
     return Swal.fire({
          icon: "success",
          title,
          text: message,
          confirmButtonColor: "#3b82f6",
     });
};

const alertConfirm = (message, title = "¿Estás seguro?") => {
     return Swal.fire({
          icon: "warning",
          title,
          text: message,
          showCancelButton: true,
          confirmButtonColor: "#3b82f6",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Sí, continuar",
          cancelButtonText: "Cancelar",
     });
};

const alertError = (message, title = "Error") => {
     return Swal.fire({
          icon: "error",
          title,
          text: message,
          confirmButtonColor: "#3b82f6",
     });
};

export function useAttendance(currentUser = null) {
     const [attendances, setAttendances] = useState([]);
     const [students, setStudents] = useState([]);
     const [institutions, setInstitutions] = useState([]);
     const [classrooms, setClassrooms] = useState([]);
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(false);

     const fetchAll = useCallback(async () => {
          setLoading(true);
          try {
               const [attendanceResponse, studentsResponse, institutionsResponse, classroomsResponse, usersResponse] = await Promise.all([
                    attendanceService.getAll(),
                    // Cargar estudiantes filtrados por institución si el usuario tiene una asignada
                    currentUser?.institutionId
                         ? attendanceService.getStudentsByInstitution(currentUser.institutionId).catch(() => ({ data: [] }))
                         : attendanceService.getAllStudents().catch(() => ({ data: [] })),
                    attendanceService.getAllInstitutions().catch(() => ({ data: [] })),
                    // Cargar aulas filtradas por institución si el usuario tiene una asignada
                    currentUser?.institutionId
                         ? attendanceService.getClassroomsByInstitution(currentUser.institutionId).catch(() => ({ data: [] }))
                         : attendanceService.getAllClassrooms().catch(() => ({ data: [] })),
                    attendanceService.getAllUsers().catch(() => ({ data: [] })),
               ]);

               setStudents(studentsResponse.data || []);
               setInstitutions(institutionsResponse.data || []);
               setClassrooms(classroomsResponse.data || []);
               setUsers(usersResponse.data || []);

               if (Array.isArray(attendanceResponse)) {
                    const parsedList = attendanceResponse.map(attendance => {
                         const parsed = parseAttendanceFromApi(attendance);
                         const student = (studentsResponse.data || []).find(s => String(s.id) === String(attendance.studentId));
                         const classroom = (classroomsResponse.data || []).find(c => String(c.id) === String(attendance.classroomId));
                         const institution = (institutionsResponse.data || []).find(i => String(i.id) === String(attendance.institutionId));
                         const registeredByUser = (usersResponse.data || []).find(u => String(u.id) === String(attendance.registeredBy));

                         return {
                              ...parsed,
                              studentName: student ? `${student.firstName} ${student.lastName}` : "Estudiante no encontrado",
                              classroomName: classroom ? classroom.classroomName : "Aula no encontrada",
                              institutionName: institution ? institution.name : "Institución no encontrada",
                              registeredByName: registeredByUser ? `${registeredByUser.firstName || ""} ${registeredByUser.lastName || ""}`.trim() : "Sin registro",
                         };
                    });

                    // Filtrar asistencias por institución del usuario si existe
                    const filteredList = currentUser?.institutionId
                         ? parsedList.filter(att => String(att.institutionId) === String(currentUser.institutionId))
                         : parsedList;

                    setAttendances(filteredList);
               } else {
                    setAttendances([]);
               }
          } catch (err) {
               console.error("Error:", err);
               setAttendances([]);
               alertError("No se pudieron cargar los registros de asistencia");
          } finally {
               setLoading(false);
          }
     }, [currentUser]);

     const fetchStudents = useCallback(async () => {
          try {
               const response = await attendanceService.getAllStudents();
               setStudents(response.data || []);
          } catch (err) {
               console.error("Error fetching students:", err);
          }
     }, []);

     const fetchInstitutions = useCallback(async () => {
          try {
               const response = await attendanceService.getAllInstitutions();
               setInstitutions(response.data || []);
          } catch (err) {
               console.error("Error fetching institutions:", err);
          }
     }, []);

     const fetchClassrooms = useCallback(async () => {
          try {
               const response = await attendanceService.getAllClassrooms();
               setClassrooms(response.data || []);
          } catch (err) {
               console.error("Error fetching classrooms:", err);
          }
     }, []);

     const fetchClassroomsByInstitution = useCallback(async (institutionId) => {
          try {
               const response = await attendanceService.getClassroomsByInstitution(institutionId);
               setClassrooms(response.data || []);
          } catch (err) {
               console.error("Error fetching classrooms:", err);
          }
     }, []);

     const fetchStudentsByClassroom = useCallback(async (classroomId) => {
          try {
               const response = await attendanceService.getStudentsByClassroom(classroomId);
               setStudents(response.data || []);
          } catch (err) {
               console.error("Error fetching students:", err);
          }
     }, []);

     const fetchUsers = useCallback(async () => {
          try {
               const response = await attendanceService.getAllUsers();
               setUsers(response.data || []);
          } catch (err) {
               console.error("Error fetching users:", err);
          }
     }, []);

     const fetchById = useCallback(async (id) => {
          setLoading(true);
          try {
               const response = await attendanceService.getById(id);
               if (response) {
                    const parsed = parseAttendanceFromApi(response);
                    const [studentsRes, classroomsRes, institutionsRes, usersRes] = await Promise.all([
                         attendanceService.getAllStudents().catch(() => ({ data: [] })),
                         attendanceService.getAllClassrooms().catch(() => ({ data: [] })),
                    currentUser?.institutionId
                         ? attendanceService.getInstitutionById(currentUser.institutionId)
                              .then(res => ({ data: [res.data || res] }))
                              .catch(() => ({ data: [] }))
                         : attendanceService.getAllInstitutions().catch(() => ({ data: [] })),
                         attendanceService.getAllUsers().catch(() => ({ data: [] })),
                    ]);
                    const student = (studentsRes.data || []).find(s => String(s.id) === String(response.studentId));
                    const classroom = (classroomsRes.data || []).find(c => String(c.id) === String(response.classroomId));
                    const institution = (institutionsRes.data || []).find(i => String(i.id) === String(response.institutionId));
                    const registeredByUser = (usersRes.data || []).find(u => String(u.id) === String(response.registeredBy));

                    return {
                         ...parsed,
                         studentName: student ? `${student.firstName} ${student.lastName}` : "Estudiante no encontrado",
                         classroomName: classroom ? classroom.classroomName : "Aula no encontrada",
                         institutionName: institution ? institution.name : "Institución no encontrada",
                         registeredByName: registeredByUser ? `${registeredByUser.firstName || ""} ${registeredByUser.lastName || ""}`.trim() : "Sin registro",
                    };
               }
               return null;
          } catch (err) {
               console.error("Error fetching attendance:", err);
               alertError("No se pudo cargar el registro de asistencia");
               return null;
          } finally {
               setLoading(false);
          }
     }, []);

     const createAttendance = useCallback(async (payload) => {
          const response = await attendanceService.create(payload);
          alertSuccess("Registro de asistencia creado exitosamente", "¡Creado!");
          return response;
     }, []);

     const bulkCreateAttendance = useCallback(async (payload) => {
          const response = await attendanceService.bulkCreate(payload);
          alertSuccess("Registros de asistencia creados exitosamente", "¡Creado!");
          return response;
     }, []);

     const updateAttendance = useCallback(async (id, payload) => {
          const response = await attendanceService.update(id, payload);
          alertSuccess("Registro de asistencia actualizado exitosamente", "¡Actualizado!");
          return response;
     }, []);

     const justifyAttendance = useCallback(async (id, payload) => {
          const response = await attendanceService.justify(id, payload);
          alertSuccess("Asistencia justificada exitosamente", "¡Justificado!");
          return response;
     }, []);

     const registerPickup = useCallback(async (id, payload) => {
          const response = await attendanceService.registerPickup(id, payload);
          alertSuccess("Recojo registrado exitosamente", "¡Registrado!");
          return response;
     }, []);

     const deleteAttendance = useCallback(async (id) => {
          const confirm = await alertConfirm("Esta acción eliminará el registro de asistencia", "¿Eliminar registro?");
          if (!confirm.isConfirmed) return null;
          await attendanceService.delete(id);
          alertSuccess("Registro de asistencia eliminado exitosamente", "¡Eliminado!");
     }, []);

     return {
          attendances,
          students,
          institutions,
          classrooms,
          users,
          loading,
          fetchAll,
          fetchById,
          fetchStudents,
          fetchInstitutions,
          fetchClassrooms,
          fetchClassroomsByInstitution,
          fetchStudentsByClassroom,
          fetchUsers,
          createAttendance,
          bulkCreateAttendance,
          updateAttendance,
          justifyAttendance,
          registerPickup,
          deleteAttendance,
     };
}
