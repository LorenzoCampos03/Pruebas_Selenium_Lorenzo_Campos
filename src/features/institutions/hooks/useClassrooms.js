import { useState, useCallback } from "react";
import { classroomService } from "../services/classroomService";
import { parseClassroomFromApi } from "../models/classroomModel";
import {
     alertApiError,
     alertCreated,
     alertUpdated,
     alertSuccess,
} from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

export function useClassrooms(institutionId) {
     const [classrooms, setClassrooms] = useState([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);

     const fetchAll = useCallback(async () => {
          if (!institutionId) return;
          setLoading(true);
          setError(null);
          try {
               const response = await classroomService.getAll(institutionId);
               const data = isSuccessResponse(response) ? extractData(response) : response;
               const list = Array.isArray(data) ? data : [];
               setClassrooms(list.map(parseClassroomFromApi));
          } catch (err) {
               setError(err);
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, [institutionId]);

     const createClassroom = useCallback(async (payload) => {
          const response = await classroomService.create(institutionId, payload);
          alertCreated("Aula");
          return response;
     }, [institutionId]);

     const updateClassroom = useCallback(async (classroomId, payload) => {
          const response = await classroomService.update(institutionId, classroomId, payload);
          alertUpdated("Aula");
          return response;
     }, [institutionId]);

     const toggleStatus = useCallback(async (classroomId, currentStatus) => {
          try {
               await classroomService.toggleStatus(institutionId, classroomId, currentStatus);
               alertSuccess("Estado del aula actualizado");
          } catch (err) {
               alertApiError(err);
               throw err;
          }
     }, [institutionId]);

     return {
          classrooms,
          loading,
          error,
          fetchAll,
          createClassroom,
          updateClassroom,
          toggleStatus,
     };
}
