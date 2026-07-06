import { useState, useCallback } from "react";
import { userService } from "../services/userService";
import {
     alertApiError,
     alertCreated,
     alertUpdated,
     alertDeleted,
     alertRestored,
     alertConfirmDelete,
     alertConfirmRestore,
} from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

export function useUsers() {
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);

     const fetchAll = useCallback(async () => {
          setLoading(true);
          setError(null);
          try {
               const response = await userService.getAll();
               const data = isSuccessResponse(response) ? extractData(response) : response;
               setUsers(Array.isArray(data) ? data : []);
          } catch (err) {
               setError(err);
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, []);

     const fetchByStatus = useCallback(async (status) => {
          setLoading(true);
          setError(null);
          try {
               const response = await userService.getByStatus(status);
               const data = isSuccessResponse(response) ? extractData(response) : response;
               setUsers(Array.isArray(data) ? data : []);
          } catch (err) {
               setError(err);
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, []);

     const fetchByRoleAndStatus = useCallback(async (role, status) => {
          setLoading(true);
          setError(null);
          try {
               const response = await userService.getByRoleAndStatus(role, status);
               const data = isSuccessResponse(response) ? extractData(response) : response;
               setUsers(Array.isArray(data) ? data : []);
          } catch (err) {
               setError(err);
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, []);

     const createUser = useCallback(async (userData) => {
          const response = await userService.create(userData);
          alertCreated("Usuario");
          return response;
     }, []);

     const updateUser = useCallback(async (id, userData) => {
          const response = await userService.update(id, userData);
          alertUpdated("Usuario");
          return response;
     }, []);

     const deleteUser = useCallback(async (id) => {
          const confirm = await alertConfirmDelete("usuario");
          if (!confirm.isConfirmed) return null;

          await userService.delete(id);
          alertDeleted("Usuario");
     }, []);

     const restoreUser = useCallback(async (id) => {
          const confirm = await alertConfirmRestore("usuario");
          if (!confirm.isConfirmed) return null;

          await userService.restore(id);
          alertRestored("Usuario");
     }, []);

     return {
          users,
          loading,
          error,
          fetchAll,
          fetchByStatus,
          fetchByRoleAndStatus,
          createUser,
          updateUser,
          deleteUser,
          restoreUser,
     };
}
