import { useCallback } from 'react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { courseService } from '../services/course.service'
import { dailyEvaluationService } from '../services/DailyEvaluation.service'

/**
 * Hook para cargar datos de evaluación (institución, aulas, cursos, competencias)
 */
export function useEvaluationLoader() {
  
  const loadInstitution = useCallback(async (institutionId) => {
    try {
      const { data } = await apiClient.get(`/api/institutions/${institutionId}`)
      const inst = data?.data || data
      return inst?.name || inst?.institutionName || 'Institución'
    } catch (err) {
      console.warn('[EvaluationLoader] No se pudo cargar institución:', err.message)
      return 'Institución'
    }
  }, [])

  const loadClassrooms = useCallback(async (institutionId) => {
    try {
      const { data } = await apiClient.get(`/api/classrooms?institutionId=${institutionId}`)
      const classrooms = data?.data || data || []
      
      if (!classrooms.length) {
        throw new Error('No hay aulas asignadas a esta institución')
      }
      
      return classrooms
    } catch (err) {
      console.error('[EvaluationLoader] Error cargando aulas:', err)
      throw err
    }
  }, [])

  const loadCourses = useCallback(async (institutionId, ageLevel) => {
    try {
      const coursesList = await courseService.getActiveByInstitutionAndAgeLevel(
        institutionId,
        ageLevel
      )
      
      if (!coursesList.length) {
        throw new Error(`No hay cursos para nivel "${ageLevel}"`)
      }
      
      return coursesList
    } catch (err) {
      console.error('[EvaluationLoader] Error cargando cursos:', err)
      throw err
    }
  }, [])

  const loadCompetencies = useCallback(async (courseId) => {
    try {
      const list = await dailyEvaluationService.getCompetenciesByCourse(courseId)
      
      if (!list.length) {
        toast.error('No hay competencias para este curso')
        return []
      }
      
      return list
    } catch (err) {
      console.error('[EvaluationLoader] Error cargando competencias:', err)
      toast.error(`Error cargando competencias: ${err.message}`)
      return []
    }
  }, [])

  const loadClassroom = useCallback(async (classroomId) => {
    try {
      const { data } = await apiClient.get(`/api/classrooms/${classroomId}`)
      return data?.data || data
    } catch (err) {
      console.error('[EvaluationLoader] Error cargando aula:', err)
      throw err
    }
  }, [])

  const loadEvaluation = useCallback(async (evaluationId) => {
    try {
      return await dailyEvaluationService.getById(evaluationId)
    } catch (err) {
      console.error('[EvaluationLoader] Error cargando evaluación:', err)
      throw err
    }
  }, [])

  const loadEvaluationDetails = useCallback(async (evaluationId) => {
    try {
      return await dailyEvaluationService.getDetails(evaluationId)
    } catch (err) {
      console.error('[EvaluationLoader] Error cargando detalles:', err)
      throw err
    }
  }, [])

  return {
    loadInstitution,
    loadClassrooms,
    loadCourses,
    loadCompetencies,
    loadClassroom,
    loadEvaluation,
    loadEvaluationDetails
  }
}
