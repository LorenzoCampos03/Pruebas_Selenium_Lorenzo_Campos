import { useState, useCallback } from "react";
import { incidentService } from "../services/disciplineService";
import { parseIncidentFromApi } from "../models/disciplineModel";
import {
     alertApiError,
     alertCreated,
     alertUpdated,
     alertSuccess,
} from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

export function useIncidents(currentUser = null) {
     const [incidents, setIncidents] = useState([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);

     const fetchAll = useCallback(async () => {
          setLoading(true);
          setError(null);
          try {
               const response = await incidentService.getAll();
               const data = isSuccessResponse(response) ? extractData(response) : response;
               let list = Array.isArray(data) ? data : [];
               if (currentUser?.institutionId) {
                    list = list.filter(
                         (inc) => String(inc.institutionId) === String(currentUser.institutionId)
                    );
               }
               setIncidents(list.map(parseIncidentFromApi));
          } catch (err) {
               setError(err);
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, [currentUser?.institutionId]);

     const createIncident = useCallback(async (payload) => {
          const response = await incidentService.create(payload);
          alertCreated("Incidencia");
          return response;
     }, []);

     const updateIncident = useCallback(async (id, payload) => {
          const response = await incidentService.update(id, payload);
          alertUpdated("Incidencia");
          return response;
     }, []);

     const assignResponsible = useCallback(async (id, resolvedBy) => {
          try {
               await incidentService.changeStatus(id, "IN_PROGRESS", resolvedBy);
               alertSuccess("Responsable asignado, incidencia en proceso");
          } catch (err) {
               alertApiError(err);
               throw err;
          }
     }, []);

     const resolveIncident = useCallback(async (id, resolvedBy) => {
          try {
               await incidentService.resolve(id, resolvedBy);
               alertSuccess("Incidencia resuelta correctamente");
          } catch (err) {
               alertApiError(err);
               throw err;
          }
     }, []);

     const closeIncident = useCallback(async (id) => {
          try {
               await incidentService.changeStatus(id, "CLOSED");
               alertSuccess("Incidencia cerrada correctamente");
          } catch (err) {
               alertApiError(err);
               throw err;
          }
     }, []);

     const invalidateIncident = useCallback(async (id, invalidatedBy, invalidationReason) => {
          await incidentService.invalidate(id, invalidatedBy, invalidationReason);
          alertSuccess("Incidencia invalidada correctamente");
     }, []);

     return {
          incidents,
          loading,
          error,
          fetchAll,
          createIncident,
          updateIncident,
          assignResponsible,
          resolveIncident,
          closeIncident,
          invalidateIncident,
     };
}
