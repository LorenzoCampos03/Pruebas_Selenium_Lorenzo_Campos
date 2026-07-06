import { useState, useEffect } from "react";
import { institutionService } from "@/features/institutions/services/institutionService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

/**
 * Hook para obtener los horarios disponibles de una institución
 * @param {string} institutionId - ID de la institución
 * @returns {Object} { schedules, loading, error }
 */
export function useInstitutionSchedules(institutionId) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!institutionId) {
      setSchedules([]);
      return;
    }

    const fetchSchedules = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await institutionService.getById(institutionId);
        const data = isSuccessResponse(response) ? extractData(response) : response;
        
        // Extraer los horarios de la institución
        const institutionSchedules = data?.schedules || [];
        setSchedules(institutionSchedules);
      } catch (err) {
        console.error("[useInstitutionSchedules] Error fetching schedules:", err);
        setError("Error al cargar los horarios de la institución");
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [institutionId]);

  return { schedules, loading, error };
}
