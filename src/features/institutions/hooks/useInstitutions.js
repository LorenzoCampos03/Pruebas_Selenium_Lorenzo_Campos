import { useState, useCallback } from "react";
import { institutionService } from "../services/institutionService";
import { parseInstitutionFromApi } from "../models/institutionModel";
import {
     alertApiError,
     alertCreated,
     alertUpdated,
     alertConfirmDelete,
     alertDeleted,
     alertSuccess,
} from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

export function useInstitutions() {
     const [institutions, setInstitutions] = useState([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);

     const fetchAll = useCallback(async () => {
          setLoading(true);
          setError(null);
          try {
               const [instResponse, usersResponse] = await Promise.allSettled([
                    institutionService.getAll(),
                    import("@/features/users/services/userService").then(m => m.userService.getAll())
               ]);

               if (instResponse.status === "rejected") {
                    throw instResponse.reason;
               }

               const data = isSuccessResponse(instResponse.value) ? extractData(instResponse.value) : instResponse.value;
               const list = Array.isArray(data) ? data : [];
               
               let usersData = [];
               if (usersResponse.status === "fulfilled") {
                    const uData = isSuccessResponse(usersResponse.value) ? extractData(usersResponse.value) : usersResponse.value;
                    if (Array.isArray(uData)) usersData = uData;
               }

               const parsedList = list.map(inst => {
                    const parsed = parseInstitutionFromApi(inst);
                    if (parsed.director) {
                         const directorUser = usersData.find(u => u.id === parsed.director);
                         if (directorUser) {
                              parsed.directorName = `${directorUser.firstName} ${directorUser.lastName}`;
                              parsed.directorData = directorUser;
                         }
                    }
                    return parsed;
               });

               setInstitutions(parsedList);
          } catch (err) {
               setError(err);
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, []);

     const createInstitution = useCallback(async (payload) => {
          const response = await institutionService.create(payload);
          alertCreated("Institución");
          return response;
     }, []);

     const updateInstitution = useCallback(async (id, payload) => {
          const response = await institutionService.update(id, payload);
          alertUpdated("Institución");
          return response;
     }, []);

     const deleteInstitution = useCallback(async (id) => {
          const confirm = await alertConfirmDelete("institución");
          if (!confirm.isConfirmed) return null;

          await institutionService.delete(id);
          alertDeleted("Institución");
     }, []);

     const toggleStatus = useCallback(async (id, currentStatus) => {
          try {
               await institutionService.toggleStatus(id, currentStatus);
               alertSuccess("Estado actualizado correctamente");
          } catch (err) {
               alertApiError(err);
               throw err;
          }
     }, []);

     return {
          institutions,
          loading,
          error,
          fetchAll,
          createInstitution,
          updateInstitution,
          deleteInstitution,
          toggleStatus,
     };
}
