import { useState, useCallback } from "react";
import { studentService } from "../services/studentService";
import {
     alertApiError,
     alertCreated,
     alertUpdated,
     alertConfirmDelete,
     alertDeleted,
     alertConfirmRestore,
     alertRestored,
} from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

export function useStudents() {
     const [students, setStudents] = useState([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);

     const fetchAll = useCallback(async () => {
          setLoading(true);
          setError(null);
          try {
               const response = await studentService.getAll();
               const data = isSuccessResponse(response) ? extractData(response) : response;
               setStudents(Array.isArray(data) ? data : []);
          } catch (err) {
               setError(err);
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, []);

     const fetchByInstitution = useCallback(async (institutionId) => {
          setLoading(true);
          setError(null);
          try {
               const response = await studentService.getByInstitution(institutionId);
               const data = isSuccessResponse(response) ? extractData(response) : response;
               setStudents(Array.isArray(data) ? data : []);
          } catch (err) {
               setError(err);
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, []);

     const fetchById = useCallback(async (id) => {
          try {
               const response = await studentService.getById(id);
               return isSuccessResponse(response) ? extractData(response) : response;
          } catch (err) {
               alertApiError(err);
               throw err;
          }
     }, []);

     const createStudent = useCallback(async (payload) => {
          const response = await studentService.create(payload);
          alertCreated("Estudiante");
          return response;
     }, []);

     const updateStudent = useCallback(async (id, payload) => {
          const response = await studentService.update(id, payload);
          alertUpdated("Estudiante");
          return response;
     }, []);

     const deleteStudent = useCallback(async (id) => {
          const confirm = await alertConfirmDelete("estudiante");
          if (!confirm.isConfirmed) return null;
          await studentService.delete(id);
          alertDeleted("Estudiante");
          return true;
     }, []);

     const restoreStudent = useCallback(async (id) => {
          const confirm = await alertConfirmRestore("estudiante");
          if (!confirm.isConfirmed) return null;
          await studentService.restore(id);
          alertRestored("Estudiante");
          return true;
     }, []);

     return {
          students,
          loading,
          error,
          fetchAll,
          fetchByInstitution,
          fetchById,
          createStudent,
          updateStudent,
          deleteStudent,
          restoreStudent,
     };
}
