import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { courseService } from '../services/course.service'
import { dailyEvaluationService } from '../services/DailyEvaluation.service'

export function useDailyEvaluationData(user) {
  const [classroom, setClassroom] = useState(null)
  const [course, setCourse] = useState(null)
  const [courses, setCourses] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [competency, setCompetency] = useState(null)
  const [institutionName, setInstitutionName] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [loadingCompetencies, setLoadingCompetencies] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.institutionId) {
      setError('El usuario no tiene una institución asignada')
      setLoadingData(false)
      toast.error('El usuario no tiene una institución asignada')
      return
    }
    loadInitialData()
  }, [user])

  const loadInitialData = async () => {
    setLoadingData(true)
    setError(null)
    
    try {
      // Cargar institución
      try {
        const { data } = await apiClient.get(`/api/institutions/${user.institutionId}`)
        const inst = data?.data || data
        setInstitutionName(inst?.name || inst?.institutionName || 'Institución')
      } catch (err) {
        console.warn('No se pudo cargar institución:', err.message)
        setInstitutionName('Institución')
      }

      // Cargar aulas
      const { data: classroomsData } = await apiClient.get(
        `/api/classrooms?institutionId=${user.institutionId}`
      )
      const classrooms = classroomsData?.data || classroomsData || []

      if (!classrooms.length) {
        throw new Error('No hay aulas asignadas a esta institución')
      }

      const selectedClassroom = classrooms[0]
      setClassroom(selectedClassroom)

      const level = selectedClassroom?.classroomAge
      if (!level) {
        throw new Error('El aula no tiene nivel de edad configurado')
      }

      // Cargar cursos
      const coursesList = await courseService.getActiveByInstitutionAndAgeLevel(
        user.institutionId,
        level
      )

      if (!coursesList.length) {
        throw new Error(`No hay cursos para nivel "${level}"`)
      }

      setCourses(coursesList)
      const selectedCourse = coursesList[0]
      setCourse(selectedCourse)

      // Cargar competencias
      await loadCompetencies(selectedCourse.id)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoadingData(false)
    }
  }

  const loadCompetencies = async (courseId) => {
    try {
      setLoadingCompetencies(true)
      const list = await dailyEvaluationService.getCompetenciesByCourse(courseId)
      
      if (!list.length) {
        toast.error('No hay competencias para este curso')
        setCompetencies([])
        setCompetency(null)
        return
      }
      
      setCompetencies(list)
      setCompetency(list[0])
    } catch (err) {
      toast.error(`Error cargando competencias: ${err.message}`)
      setCompetencies([])
      setCompetency(null)
    } finally {
      setLoadingCompetencies(false)
    }
  }

  const handleCourseChange = async (courseId) => {
    const selected = courses.find(c => c.id === courseId)
    if (!selected) return
    setCourse(selected)
    setCompetency(null)
    await loadCompetencies(selected.id)
  }

  return {
    classroom,
    course,
    courses,
    competencies,
    competency,
    institutionName,
    loadingData,
    loadingCompetencies,
    error,
    setCompetency,
    handleCourseChange,
    loadInitialData
  }
}
