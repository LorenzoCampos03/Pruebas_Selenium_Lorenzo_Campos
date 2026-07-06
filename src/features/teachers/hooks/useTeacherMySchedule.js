import { useCallback, useState } from "react";
import { teacherAssignmentService } from "../services/teacherAssignmentService";
import { classroomService } from "@/features/institutions/services/classroomService";
import { parseAssignmentFromApi, parseScheduleFromApi } from "../models/teacherModel";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { alertApiError } from "@/shared/components/feedback";

function toArray(response) {
     const data = isSuccessResponse(response) ? extractData(response) : response;
     return Array.isArray(data) ? data : [];
}

export function useTeacherMySchedule() {
     const [assignments, setAssignments] = useState([]);
     const [schedulesByAssignment, setSchedulesByAssignment] = useState({});
     const [classroomsMap, setClassroomsMap] = useState({});
     const [loading, setLoading] = useState(false);

     const fetchMyAssignments = useCallback(async (teacherUserId, institutionId) => {
          if (!teacherUserId) return;
          setLoading(true);

          try {
               const response = await teacherAssignmentService.getAssignmentsByTeacher(teacherUserId);
               const assignmentList = toArray(response).map(parseAssignmentFromApi);
               setAssignments(assignmentList);

               const scheduleEntries = await Promise.all(
                    assignmentList.map(async (assignment) => {
                         const schedulesRes = await teacherAssignmentService.getAssignmentSchedules(assignment.id);
                         return [assignment.id, toArray(schedulesRes).map(parseScheduleFromApi)];
                    })
               );

               setSchedulesByAssignment(Object.fromEntries(scheduleEntries));

               if (institutionId) {
                    try {
                         const classroomsRes = await classroomService.getAll(institutionId);
                         const classroomsList = toArray(classroomsRes);
                         const map = {};
                         classroomsList.forEach((c) => {
                              map[c.id] = c;
                         });
                         setClassroomsMap(map);
                    } catch {
                         // classrooms not available, UUIDs will show as fallback
                    }
               }
          } catch (error) {
               alertApiError(error);
          } finally {
               setLoading(false);
          }
     }, []);

     return {
          assignments,
          schedulesByAssignment,
          classroomsMap,
          loading,
          fetchMyAssignments,
     };
}

