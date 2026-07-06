import apiClient from "@/core/api/apiClient"
import { ENDPOINTS } from "@/core/api/endpoints"

export const reportCardsService = {

  async getAll() {
    const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BASE)
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async getById(id) {
    const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_ID(id))
    return data
  },

  async getByStudentId(studentId) {
    const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_STUDENT(studentId))
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async getByClassroomId(classroomId) {
    const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_CLASSROOM(classroomId))
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async getByInstitutionId(institutionId) {
    const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_INSTITUTION(institutionId))
    return Array.isArray(data) ? data : (data?.data || [])
  },

  // ✅ Usar classroom del profesor en vez de my-reportcards
  async getMyReportCards(classroomId) {
    if (!classroomId) {
      const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BASE)
      return Array.isArray(data) ? data : (data?.data || [])
    }
    const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_CLASSROOM(classroomId))
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async getByStatus(status) {
    const { data } = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_STATUS(status))
    return Array.isArray(data) ? data : (data?.data || [])
  },

  // 🔥 FIX REAL AQUÍ
  async create(payload) {

    // 🔥 eliminar completamente el id si viene
    const { id, ...cleanPayload } = payload

    console.log("🚨 PAYLOAD ORIGINAL:", payload)
    console.log("✅ PAYLOAD LIMPIO:", cleanPayload)

    const { data } = await apiClient.post(
      ENDPOINTS.REPORT_CARDS.BASE,
      cleanPayload
    )

    return data
  },

  async update(id, payload) {
    const { data } = await apiClient.put(
      ENDPOINTS.REPORT_CARDS.BY_ID(id),
      payload
    )
    return data
  },

  async delete(id) {
    const { data } = await apiClient.delete(
      ENDPOINTS.REPORT_CARDS.BY_ID(id)
    )
    return data
  },

  async restore(id) {
    const { data } = await apiClient.patch(
      ENDPOINTS.REPORT_CARDS.RESTORE(id)
    )
    return data
  },
}