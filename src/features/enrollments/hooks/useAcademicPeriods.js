import { useState, useCallback } from "react";
import { academicPeriodService } from "../services/academicPeriodService";
import {
  alertApiError,
  alertCreated,
  alertUpdated,
  alertConfirmDelete,
  alertDeleted,
} from "@/shared/components/feedback";
import { parseAcademicPeriodFromApi } from "../models/academicPeriodModel";

export function useAcademicPeriods() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await academicPeriodService.getAll();
      // El backend reactivo devuelve arrays directamente
      const data = Array.isArray(response) ? response : [];
      const parsedData = data.map(parseAcademicPeriodFromApi);
      setPeriods(parsedData);
    } catch (err) {
      setError(err);
      // Solo mostrar alerta si no es un error 404 (que puede significar "no hay datos")
      if (err?.response?.status !== 404) {
        alertApiError(err);
      }
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByInstitution = useCallback(async (institutionId) => {
    setLoading(true);
    setError(null);
    try {
      // Usar el endpoint específico del backend para filtrar por institución
      const response = await academicPeriodService.getByInstitution(institutionId);
      const data = Array.isArray(response) ? response : [];
      const parsedData = data.map(parseAcademicPeriodFromApi);
      setPeriods(parsedData);
    } catch (err) {
      setError(err);
      // Solo mostrar alerta si no es un error 404
      if (err?.response?.status !== 404) {
        alertApiError(err);
      }
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActive = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await academicPeriodService.getByStatus("ACTIVE");
      const data = Array.isArray(response) ? response : [];
      const parsedData = data.map(parseAcademicPeriodFromApi);
      setPeriods(parsedData);
    } catch (err) {
      setError(err);
      alertApiError(err);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchById = useCallback(async (id) => {
    try {
      const response = await academicPeriodService.getById(id);
      return parseAcademicPeriodFromApi(response);
    } catch (err) {
      alertApiError(err);
      throw err;
    }
  }, []);

  const createPeriod = useCallback(async (payload) => {
    try {
      const response = await academicPeriodService.create(payload);
      alertCreated("Período Académico");
      return parseAcademicPeriodFromApi(response);
    } catch (err) {
      alertApiError(err);
      throw err;
    }
  }, []);

  const updatePeriod = useCallback(async (id, payload) => {
    try {
      const response = await academicPeriodService.update(id, payload);
      alertUpdated("Período Académico");
      return parseAcademicPeriodFromApi(response);
    } catch (err) {
      alertApiError(err);
      throw err;
    }
  }, []);

  const deletePeriod = useCallback(async (id) => {
    try {
      const confirm = await alertConfirmDelete("período académico");
      if (!confirm.isConfirmed) return null;
      await academicPeriodService.delete(id);
      alertDeleted("Período Académico");
      return true;
    } catch (err) {
      alertApiError(err);
      throw err;
    }
  }, []);

  const activatePeriod = useCallback(async (id) => {
    try {
      const response = await academicPeriodService.activate(id);
      alertUpdated("Período Académico activado");
      return parseAcademicPeriodFromApi(response);
    } catch (err) {
      alertApiError(err);
      throw err;
    }
  }, []);

  const closePeriod = useCallback(async (id) => {
    try {
      // Primero obtener el período completo
      const currentPeriod = await academicPeriodService.getById(id);
      
      // Actualizar solo el estado a CLOSED manteniendo todos los demás campos
      const updatedPeriod = {
        ...currentPeriod,
        status: "CLOSED"
      };
      
      const response = await academicPeriodService.update(id, updatedPeriod);
      alertUpdated("Período Académico cerrado");
      return parseAcademicPeriodFromApi(response);
    } catch (err) {
      console.error("Error al cerrar período:", err);
      alertApiError(err);
      throw err;
    }
  }, []);

  return {
    periods,
    loading,
    error,
    fetchAll,
    fetchByInstitution,
    fetchActive,
    fetchById,
    createPeriod,
    updatePeriod,
    deletePeriod,
    activatePeriod,
    closePeriod,
  };
}
