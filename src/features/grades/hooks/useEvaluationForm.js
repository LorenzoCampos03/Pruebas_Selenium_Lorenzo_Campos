import { useState } from 'react'
import { DAILY_EVALUATION_STATUS } from '../models/dailyEvaluation.model'

/**
 * Hook para manejar el estado del formulario de evaluación
 */
export function useEvaluationForm(initialData = {}) {
  const [classroom, setClassroom] = useState(initialData.classroom || null)
  const [course, setCourse] = useState(initialData.course || null)
  const [courses, setCourses] = useState(initialData.courses || [])
  const [competencies, setCompetencies] = useState(initialData.competencies || [])
  const [competency, setCompetency] = useState(initialData.competency || null)
  const [institutionName, setInstitutionName] = useState(initialData.institutionName || '')
  const [evaluationDate, setEvaluationDate] = useState(
    initialData.evaluationDate || new Date().toISOString().split('T')[0]
  )
  const [status, setStatus] = useState(initialData.status || DAILY_EVALUATION_STATUS.EN_PROCESO)
  const [details, setDetails] = useState(initialData.details || new Map())
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [loadingCompetencies, setLoadingCompetencies] = useState(false)
  const [error, setError] = useState(null)

  const handleDetailUpdate = (studentId, competencyId, achievementLevel, observation, existingId = null) => {
    setDetails(prev => {
      const newMap = new Map(prev)
      const key = `${studentId}-${competencyId}`
      
      newMap.set(key, {
        id: existingId || prev.get(key)?.id,
        studentId,
        competencyId,
        achievementLevel,
        observation
      })
      return newMap
    })
  }

  const resetForm = () => {
    setClassroom(null)
    setCourse(null)
    setCourses([])
    setCompetencies([])
    setCompetency(null)
    setDetails(new Map())
    setError(null)
  }

  return {
    // Estado
    classroom,
    course,
    courses,
    competencies,
    competency,
    institutionName,
    evaluationDate,
    status,
    details,
    loading,
    loadingData,
    loadingCompetencies,
    error,
    // Setters
    setClassroom,
    setCourse,
    setCourses,
    setCompetencies,
    setCompetency,
    setInstitutionName,
    setEvaluationDate,
    setStatus,
    setDetails,
    setLoading,
    setLoadingData,
    setLoadingCompetencies,
    setError,
    // Handlers
    handleDetailUpdate,
    resetForm
  }
}
