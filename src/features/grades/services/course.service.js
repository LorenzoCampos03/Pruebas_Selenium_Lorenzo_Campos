import apiClient from "@/core/api/apiClient"

export const courseService = {
  async getActiveByInstitution(institutionId) {
    const { data } = await apiClient.get(
      `/api/v1/courses/institution/${institutionId}/active`
    )
    return data?.data || data || []
  },

  async getActiveByInstitutionAndAgeLevel(institutionId, ageLevel) {
    console.log(`[courseService] GET /institution/${institutionId}/age-level/${ageLevel}/active`)
    
    // ✅ El backend ya filtra por institutionId + ageLevel + ACTIVE
    const { data } = await apiClient.get(
      `/api/v1/courses/institution/${institutionId}/age-level/${encodeURIComponent(ageLevel)}/active`
    )

    console.log('[courseService] Respuesta:', data)

    // El backend devuelve Flux → array directo, no { data: [...] }
    return Array.isArray(data) ? data : (data?.data || [])
  }
}