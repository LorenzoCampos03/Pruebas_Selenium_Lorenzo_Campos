import { useCallback, useState } from "react";
import { teacherAssignmentService } from "../services/teacherAssignmentService";
import {
     parseTeacherUserFromApi,
     parseAssignmentFromApi,
     parseScheduleFromApi,
     TEACHER_USER_ROLE,
} from "../models/teacherModel";
import { classroomService } from "@/features/institutions/services/classroomService";
import { parseClassroomFromApi } from "@/features/institutions/models/classroomModel";
import {
     alertApiError,
     alertCreated,
     alertDeleted,
     alertRestored,
     alertSuccess,
     alertConfirmDelete,
     alertConfirmRestore,
} from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

function toArray(response) {
     const data = isSuccessResponse(response) ? extractData(response) : response;
     return Array.isArray(data) ? data : [];
}

export function useTeacherAssignments(institutionId) {
     const [teachers, setTeachers] = useState([]);
     const [assignments, setAssignments] = useState([]);
     const [institutionClassrooms, setInstitutionClassrooms] = useState([]);
     const [assignmentSchedules, setAssignmentSchedules] = useState([]);
     const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
     const [loading, setLoading] = useState(false);

     const fetchTeachers = useCallback(async () => {
          if (!institutionId) return;
          setLoading(true);
          try {
               const response = await teacherAssignmentService.getUsersByInstitution(institutionId);
               const list = toArray(response)
                    .map(parseTeacherUserFromApi)
                    .filter((item) => item.role === TEACHER_USER_ROLE)
                    .sort((a, b) => a.fullName.localeCompare(b.fullName));
               setTeachers(list);
          } catch (error) {
               alertApiError(error);
          } finally {
               setLoading(false);
          }
     }, [institutionId]);

     const fetchAssignments = useCallback(async () => {
          if (!institutionId) return;
          setLoading(true);
          try {
               const response = await teacherAssignmentService.getAssignmentsByInstitution(institutionId);
               const list = toArray(response).map(parseAssignmentFromApi);
               setAssignments(list);
          } catch (error) {
               alertApiError(error);
          } finally {
               setLoading(false);
          }
     }, [institutionId]);

     const fetchInstitutionClassrooms = useCallback(async () => {
          if (!institutionId) return;
          try {
               const response = await classroomService.getAll(institutionId);
               const list = toArray(response).map(parseClassroomFromApi);
               setInstitutionClassrooms(list);
          } catch (error) {
               alertApiError(error);
          }
     }, [institutionId]);

     const fetchAssignmentDetails = useCallback(async (assignmentId) => {
          if (!assignmentId) {
               setSelectedAssignmentId("");
               setAssignmentSchedules([]);
               return;
          }

          setSelectedAssignmentId(assignmentId);
          setLoading(true);
          try {
               const schedulesRes = await teacherAssignmentService.getAssignmentSchedules(assignmentId);
               setAssignmentSchedules(toArray(schedulesRes).map(parseScheduleFromApi));
          } catch (error) {
               alertApiError(error);
          } finally {
               setLoading(false);
          }
     }, []);

     const createTeacher = useCallback(async (payload) => {
          try {
               const result = await teacherAssignmentService.createTeacherUser({
                    ...payload,
                    institutionId,
                    role: TEACHER_USER_ROLE,
                    email: payload.email || null,
                    address: payload.address || null,
               });
               alertCreated("Docente");
               await fetchTeachers();
               return result;
          } catch (error) {
               alertApiError(error);
               throw error;
          }
     }, [institutionId, fetchTeachers]);

     const createAssignment = useCallback(async (payload) => {
          try {
               await teacherAssignmentService.createAssignment({
                    ...payload,
                    institutionId,
               });
               alertCreated("Asignacion docente");
               await fetchAssignments();
          } catch (error) {
               alertApiError(error);
               throw error;
          }
     }, [institutionId, fetchAssignments]);

     const deleteAssignment = useCallback(async (assignmentId) => {
          const confirm = await alertConfirmDelete("asignacion");
          if (!confirm.isConfirmed) return;

          try {
               await teacherAssignmentService.deleteAssignment(assignmentId);
               alertDeleted("Asignacion");
               await fetchAssignments();
               if (selectedAssignmentId === assignmentId) {
                    await fetchAssignmentDetails("");
               }
          } catch (error) {
               alertApiError(error);
          }
     }, [fetchAssignments, selectedAssignmentId, fetchAssignmentDetails]);

     const restoreAssignment = useCallback(async (assignmentId) => {
          const confirm = await alertConfirmRestore("asignacion");
          if (!confirm.isConfirmed) return;

          try {
               await teacherAssignmentService.restoreAssignment(assignmentId);
               alertRestored("Asignacion");
               await fetchAssignments();
          } catch (error) {
               alertApiError(error);
          }
     }, [fetchAssignments]);

     const addSchedule = useCallback(async (assignmentId, payload) => {
          try {
               await teacherAssignmentService.addSchedule(assignmentId, payload);
               alertCreated("Horario agregado");
               await fetchAssignmentDetails(assignmentId);
          } catch (error) {
               alertApiError(error);
               throw error;
          }
     }, [fetchAssignmentDetails]);

     const addSchedules = useCallback(async (assignmentId, payloads) => {
          try {
               for (const payload of payloads) {
                    await teacherAssignmentService.addSchedule(assignmentId, payload);
               }
               alertCreated("Horarios agregados");
               await fetchAssignmentDetails(assignmentId);
          } catch (error) {
               alertApiError(error);
               throw error;
          }
     }, [fetchAssignmentDetails]);

     const updateSchedule = useCallback(async (assignmentId, scheduleId, payload) => {
          try {
               await teacherAssignmentService.updateSchedule(assignmentId, scheduleId, payload);
               alertSuccess("Horario actualizado");
               await fetchAssignmentDetails(assignmentId);
          } catch (error) {
               alertApiError(error);
               throw error;
          }
     }, [fetchAssignmentDetails]);

     const removeSchedule = useCallback(async (assignmentId, scheduleId) => {
          try {
               await teacherAssignmentService.removeSchedule(assignmentId, scheduleId);
               alertSuccess("Horario eliminado");
               await fetchAssignmentDetails(assignmentId);
          } catch (error) {
               alertApiError(error);
          }
     }, [fetchAssignmentDetails]);

     return {
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
     };
}
