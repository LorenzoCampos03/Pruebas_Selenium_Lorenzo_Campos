import apiClient from "@/core/api/apiClient"
import { ENDPOINTS } from "@/core/api/endpoints"

/**
 * Servicio completo para el microservicio de Notes
 * Incluye evaluaciones y boletas de calificaciones
 */
export const notesService = {
  
  // ========== EVALUACIONES ==========
  evaluations: {
    // Operaciones básicas CRUD
    async getAll() {
      const { data } = await apiClient.get(ENDPOINTS.GRADES.EVALUATIONS.BASE)
      return Array.isArray(data) ? data : (data?.data || [])
    },

    async getById(evaluationId) {
      const { data } = await apiClient.get(ENDPOINTS.GRADES.EVALUATIONS.BY_ID(evaluationId))
      return data
    },

    async create(payload) {
      const { data } = await apiClient.post(ENDPOINTS.GRADES.EVALUATIONS.BASE, payload)
      return data
    },

    async update(evaluationId, payload) {
      const { data } = await apiClient.put(ENDPOINTS.GRADES.EVALUATIONS.BY_ID(evaluationId), payload)
      return data
    },

    async delete(evaluationId) {
      const { data } = await apiClient.delete(ENDPOINTS.GRADES.EVALUATIONS.BY_ID(evaluationId))
      return data
    },

    // Operaciones específicas de evaluaciones
    async getByTeacherAndClassroom(teacherId, classroomId) {
      const { data } = await apiClient.get(
        ENDPOINTS.GRADES.EVALUATIONS.BY_TEACHER_CLASSROOM(teacherId, classroomId)
      )
      return Array.isArray(data) ? data : (data?.data || [])
    },

    async getCoursesByTeacherAndClassroom(teacherId, classroomId) {
      const { data } = await apiClient.get(
        ENDPOINTS.GRADES.EVALUATIONS.COURSES_BY_TEACHER_CLASSROOM(teacherId, classroomId)
      )
      return Array.isArray(data) ? data : (data?.data || [])
    },

    async checkExists(classroomId, courseId, competencyId, evaluationDate) {
      const { data } = await apiClient.get(ENDPOINTS.GRADES.EVALUATIONS.EXISTS, {
        params: { classroomId, courseId, competencyId, evaluationDate }
      })
      return data
    },

    async finalize(evaluationId) {
      const { data } = await apiClient.patch(ENDPOINTS.GRADES.EVALUATIONS.FINALIZE(evaluationId))
      return data
    },

    async cancel(evaluationId) {
      const { data } = await apiClient.patch(ENDPOINTS.GRADES.EVALUATIONS.CANCEL(evaluationId))
      return data
    },

    // Gestión de detalles (calificaciones individuales)
    async getDetails(evaluationId) {
      const { data } = await apiClient.get(ENDPOINTS.GRADES.EVALUATIONS.DETAILS(evaluationId))
      return Array.isArray(data) ? data : (data?.data || [])
    },

    async updateDetail(evaluationId, detailId, payload) {
      const { data } = await apiClient.put(
        ENDPOINTS.GRADES.EVALUATIONS.UPDATE_DETAIL(evaluationId, detailId),
        payload
      )
      return data
    },
  },

  // ========== BOLETAS DE CALIFICACIONES ==========
  reportCards: {
    // Operaciones básicas CRUD
    async getAll() {
      const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BASE)
      return Array.isArray(data) ? data : (data?.data || [])
    },

    async getById(reportCardId) {
      const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_ID(reportCardId))
      return data
    },

    async create(payload) {
      // Limpiar el payload eliminando el id si viene
      const { id, ...cleanPayload } = payload
      const { data } = await apiClient.post(ENDPOINTS.REPORT_CARDS.BASE, cleanPayload)
      return data
    },

    async update(reportCardId, payload) {
      const { data } = await apiClient.put(
        ENDPOINTS.REPORT_CARDS.BY_ID(reportCardId),
        payload
      )
      return data
    },

    async delete(reportCardId) {
      const { data } = await apiClient.delete(ENDPOINTS.REPORT_CARDS.BY_ID(reportCardId))
      return data
    },

    async restore(reportCardId) {
      const { data } = await apiClient.patch(ENDPOINTS.REPORT_CARDS.RESTORE(reportCardId))
      return data
    },

    // Consultas específicas
    async getByStudent(studentId) {
      const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_STUDENT(studentId))
      return Array.isArray(data) ? data : (data?.data || [])
    },

    async getByClassroom(classroomId) {
      const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_CLASSROOM(classroomId))
      return Array.isArray(data) ? data : (data?.data || [])
    },

    async getByInstitution(institutionId) {
      const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_INSTITUTION(institutionId))
      return Array.isArray(data) ? data : (data?.data || [])
    },

    async getByStatus(status) {
      const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_STATUS(status))
      return Array.isArray(data) ? data : (data?.data || [])
    },
  },

  // ========== MÉTODOS DE CONVENIENCIA ==========
  
  /**
   * Obtener todas las evaluaciones de un docente en un aula específica
   */
  async getTeacherClassroomData(teacherId, classroomId) {
    const [evaluations, courses] = await Promise.all([
      this.evaluations.getByTeacherAndClassroom(teacherId, classroomId),
      this.evaluations.getCoursesByTeacherAndClassroom(teacherId, classroomId)
    ])
    
    return { evaluations, courses }
  },

  /**
   * Obtener todas las boletas de un aula
   */
  async getClassroomReportCards(classroomId) {
    return this.reportCards.getByClassroom(classroomId)
  },

  /**
   * Verificar si una evaluación ya existe antes de crearla
   */
  async canCreateEvaluation(classroomId, courseId, competencyId, evaluationDate) {
    const exists = await this.evaluations.checkExists(classroomId, courseId, competencyId, evaluationDate)
    return !exists
  }
}

export default notesService