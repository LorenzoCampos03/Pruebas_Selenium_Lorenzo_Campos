import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export const enrollmentService = {
  /**
   * Obtiene todos los enrollments
   * @returns {Promise} Respuesta de la API
   */
  getAll: async () => {
    const { data } = await apiClient.get(ENDPOINTS.ENROLLMENTS.BASE);
    return data;
  },

  /**
   * Obtiene un enrollment por ID
   * @param {string} id - ID del enrollment
   * @returns {Promise} Respuesta de la API
   */
  getById: async (id) => {
    const { data } = await apiClient.get(ENDPOINTS.ENROLLMENTS.BY_ID(id));
    return data;
  },

  /**
   * Obtiene enrollments por estudiante (solo institución actual)
   * @param {string} studentId - ID del estudiante
   * @returns {Promise} Respuesta de la API
   */
  getByStudent: async (studentId) => {
    const { data } = await apiClient.get(ENDPOINTS.ENROLLMENTS.BY_STUDENT(studentId));
    return data;
  },

  /**
   * Verifica si el estudiante tiene matrícula activa en otra institución
   * @param {string} studentId - ID del estudiante
   * @returns {Promise} Respuesta con los datos de la matrícula en otra institución (o null)
   */
  checkCrossInstitution: async (studentId) => {
    const { data } = await apiClient.get(`${ENDPOINTS.ENROLLMENTS.BY_STUDENT(studentId)}/cross-check`);
    return data;
  },

  /**
   * Obtiene enrollments por institución
   * @param {string} institutionId - ID de la institución
   * @returns {Promise} Respuesta de la API
   */
  getByInstitution: async (institutionId) => {
    const { data } = await apiClient.get(ENDPOINTS.ENROLLMENTS.BY_INSTITUTION(institutionId));
    return data;
  },

  /**
   * Obtiene enrollments por estado
   * @param {string} status - Estado del enrollment
   * @returns {Promise} Respuesta de la API
   */
  getByStatus: async (status) => {
    const { data } = await apiClient.get(`${ENDPOINTS.ENROLLMENTS.BASE}/status/${status}`);
    return data;
  },

  /**
   * Crea un nuevo enrollment
   * @param {Object} payload - Datos del enrollment
   * @returns {Promise} Respuesta de la API
   */
  create: async (payload) => {
    const { data } = await apiClient.post(ENDPOINTS.ENROLLMENTS.BASE, payload);
    return data;
  },

  /**
   * Actualiza un enrollment existente
   * @param {string} id - ID del enrollment
   * @param {Object} payload - Datos actualizados
   * @returns {Promise} Respuesta de la API
   */
  update: async (id, payload) => {
    const { data } = await apiClient.put(ENDPOINTS.ENROLLMENTS.BY_ID(id), payload);
    return data;
  },

  /**
   * Elimina un enrollment (soft delete)
   * @param {string} id - ID del enrollment
   * @returns {Promise} Respuesta de la API
   */
  delete: async (id) => {
    const { data } = await apiClient.delete(ENDPOINTS.ENROLLMENTS.BY_ID(id));
    return data;
  },

  /**
   * Activa un enrollment (cambia estado de PENDING a ACTIVE)
   * @param {string} id - ID del enrollment
   * @returns {Promise} Respuesta de la API
   */
  activate: async (id) => {
    const { data } = await apiClient.patch(ENDPOINTS.ENROLLMENTS.ACTIVATE(id));
    return data;
  },

  /**
   * Cancela un enrollment
   * @param {string} id - ID del enrollment
   * @returns {Promise} Respuesta de la API
   */
  cancel: async (id) => {
    const { data } = await apiClient.patch(`${ENDPOINTS.ENROLLMENTS.BASE}/${id}/cancel`);
    return data;
  },

  /**
   * Cambia un enrollment a estado PENDING
   * @param {string} id - ID del enrollment
   * @returns {Promise} Respuesta de la API
   */
  setPending: async (id) => {
    const { data } = await apiClient.patch(ENDPOINTS.ENROLLMENTS.SET_PENDING(id));
    return data;
  },

  /**
   * Archiva todas las matrículas activas de un año académico (pasa a INACTIVE)
   * @param {string} academicYear - Año académico (ej. "2024")
   * @returns {Promise} Respuesta de la API
   */
  archiveByYear: async (academicYear) => {
    const { data } = await apiClient.post(ENDPOINTS.ENROLLMENTS.ARCHIVE_BY_YEAR(academicYear));
    return data;
  },

  /**
   * Valida un enrollment antes de crearlo
   * @param {string} studentId - ID del estudiante
   * @param {string} institutionId - ID de la institución
   * @param {string} classroomId - ID del aula
   * @returns {Promise} Respuesta de la API
   */
  validate: async (studentId, institutionId, classroomId) => {
    const { data } = await apiClient.get(`${ENDPOINTS.ENROLLMENTS.BASE}/validate`, {
      params: { studentId, institutionId, classroomId }
    });
    return data;
  },
};
