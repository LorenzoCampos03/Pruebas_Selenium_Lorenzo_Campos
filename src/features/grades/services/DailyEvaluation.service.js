import apiClient from '@/core/api/apiClient'
import { ENDPOINTS } from '@/core/api/endpoints'

export const dailyEvaluationService = {

  async getCompetenciesByCourse(courseId) {
    const { data } = await apiClient.get(
      ENDPOINTS.ACADEMIC.COMPETENCIES.ACTIVE_BY_COURSE(courseId)
    )
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async list() {
    const { data } = await apiClient.get(ENDPOINTS.GRADES.EVALUATIONS.BASE)
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async getById(evaluationId) {
    const { data } = await apiClient.get(ENDPOINTS.GRADES.EVALUATIONS.BY_ID(evaluationId))
    return data
  },

  async delete(evaluationId) {
    const { data } = await apiClient.delete(ENDPOINTS.GRADES.EVALUATIONS.BY_ID(evaluationId))
    return data
  },

  async create(payload) {
    const { data } = await apiClient.post(ENDPOINTS.GRADES.EVALUATIONS.BASE, payload)
    return data?.id || data
  },

  async getDetails(evaluationId) {
    const { data } = await apiClient.get(ENDPOINTS.GRADES.EVALUATIONS.DETAILS(evaluationId))
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async updateDetail({ evaluationId, detailId, achievementLevel, observation }) {
    const { data } = await apiClient.put(
      ENDPOINTS.GRADES.EVALUATIONS.UPDATE_DETAIL(evaluationId, detailId),
      { achievementLevel, observation }
    )
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

  async update(evaluationId, payload) {
    const { data } = await apiClient.put(ENDPOINTS.GRADES.EVALUATIONS.BY_ID(evaluationId), payload)
    return data
  },

  async getByTeacherAndClassroom(teacherId, classroomId) {
    const { data } = await apiClient.get(
      ENDPOINTS.GRADES.EVALUATIONS.BY_TEACHER_CLASSROOM(teacherId, classroomId)
    )
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async checkExists(classroomId, courseId, competencyId, evaluationDate) {
    const { data } = await apiClient.get(ENDPOINTS.GRADES.EVALUATIONS.EXISTS, {
      params: { classroomId, courseId, competencyId, evaluationDate }
    })
    return data
  },

  async getCoursesByTeacherAndClassroom(teacherId, classroomId) {
    const { data } = await apiClient.get(
      ENDPOINTS.GRADES.EVALUATIONS.COURSES_BY_TEACHER_CLASSROOM(teacherId, classroomId)
    )
    return Array.isArray(data) ? data : (data?.data || [])
  },
}
