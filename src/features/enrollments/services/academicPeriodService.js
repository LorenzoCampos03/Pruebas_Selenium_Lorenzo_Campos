import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const academicPeriodService = {
  /**
   * Obtiene todos los períodos académicos
   * @returns {Promise} Respuesta de la API
   */
  getAll: async () => {
    const { data } = await apiClient.get(ENDPOINTS.ACADEMIC_PERIODS.BASE);
    return data;
  },

  /**
   * Obtiene un período académico por ID
   * @param {string} id - ID del período académico
   * @returns {Promise} Respuesta de la API
   */
  getById: async (id) => {
    const { data } = await apiClient.get(ENDPOINTS.ACADEMIC_PERIODS.BY_ID(id));
    return data;
  },

  /**
   * Obtiene períodos académicos por estado
   * @param {string} status - Estado del período académico
   * @returns {Promise} Respuesta de la API
   */
  getByStatus: async (status) => {
    const { data } = await apiClient.get(ENDPOINTS.ACADEMIC_PERIODS.BY_STATUS(status));
    return data;
  },

  /**
   * Obtiene períodos académicos por institución
   * @param {string} institutionId - ID de la institución
   * @returns {Promise} Respuesta de la API
   */
  getByInstitution: async (institutionId) => {
    const { data } = await apiClient.get(ENDPOINTS.ACADEMIC_PERIODS.BY_INSTITUTION(institutionId));
    return data;
  },

  /**
   * Crea un nuevo período académico
   * @param {Object} payload - Datos del período académico
   * @returns {Promise} Respuesta de la API
   */
  create: async (payload) => {
    const { data } = await apiClient.post(ENDPOINTS.ACADEMIC_PERIODS.BASE, payload);
    return data;
  },

  /**
   * Actualiza un período académico existente
   * @param {string} id - ID del período académico
   * @param {Object} payload - Datos actualizados
   * @returns {Promise} Respuesta de la API
   */
  update: async (id, payload) => {
    const { data } = await apiClient.put(ENDPOINTS.ACADEMIC_PERIODS.BY_ID(id), payload);
    return data;
  },

  /**
   * Elimina un período académico
   * @param {string} id - ID del período académico
   * @returns {Promise} Respuesta de la API
   */
  delete: async (id) => {
    const { data } = await apiClient.delete(ENDPOINTS.ACADEMIC_PERIODS.BY_ID(id));
    return data;
  },

  /**
   * Activa un período académico
   * @param {string} id - ID del período académico
   * @returns {Promise} Respuesta de la API
   */
  activate: async (id) => {
    const { data } = await apiClient.patch(ENDPOINTS.ACADEMIC_PERIODS.ACTIVATE(id));
    return data;
  },
};