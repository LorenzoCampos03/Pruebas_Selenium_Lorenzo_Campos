import { useState, useCallback } from "react";
import { guardianService } from "../services/guardianService";
import {
     alertApiError,
     alertCreated,
     alertUpdated,
     alertConfirmDelete,
     alertDeleted,
} from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

export function useGuardians() {
     const [guardians, setGuardians] = useState([]);
     const [loading, setLoading] = useState(false);

     const fetchByStudent = useCallback(async (studentId) => {
          setLoading(true);
          try {
               const response = await guardianService.getByStudent(studentId);
               const data = isSuccessResponse(response) ? extractData(response) : response;
               setGuardians(Array.isArray(data) ? data : []);
          } catch (err) {
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, []);

     const createGuardian = useCallback(async (payload) => {
          const response = await guardianService.create(payload);
          alertCreated("Apoderado");
          return response;
     }, []);

     const updateGuardian = useCallback(async (id, payload) => {
          const response = await guardianService.update(id, payload);
          alertUpdated("Apoderado");
          return response;
     }, []);

     const deleteGuardian = useCallback(async (id) => {
          const confirm = await alertConfirmDelete("apoderado");
          if (!confirm.isConfirmed) return null;
          await guardianService.delete(id);
          alertDeleted("Apoderado");
          return true;
     }, []);

     return {
          guardians,
          loading,
          fetchByStudent,
          createGuardian,
          updateGuardian,
          deleteGuardian,
     };
}
