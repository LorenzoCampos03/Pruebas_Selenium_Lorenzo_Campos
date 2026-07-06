import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { dailyEvaluationService } from '../services/DailyEvaluation.service'

const PAGE_SIZE = 10

export function useEvaluationList() {
  const [evaluations, setEvaluations] = useState([])
  const [courses, setCourses] = useState({})
  const [competencies, setCompetencies] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const loadEvaluations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await dailyEvaluationService.list()
      const mine = data // Mostrar todas las evaluaciones
      setEvaluations(mine)

      // Obtener detalles para cargar competencias
      const evaluationsWithDetails = await Promise.all(
        mine.map(async (ev) => {
          try {
            const details = await dailyEvaluationService.getDetails(ev.id)
            return { ...ev, details }
          } catch {
            return { ...ev, details: [] }
          }
        })
      )

      // Cargar nombres de cursos y competencias
      const courseIds = [...new Set(mine.map(e => e.courseId).filter(Boolean))]
      const competencyIds = [...new Set(
        evaluationsWithDetails.flatMap(ev => 
          ev.details.map(d => d.competencyId).filter(Boolean)
        )
      )]

      const [courseData, competencyData] = await Promise.all([
        loadCourses(courseIds),
        loadCompetencies(competencyIds)
      ])

      setCourses(Object.fromEntries(courseData.map(c => [c.id, c.name])))
      setCompetencies(Object.fromEntries(competencyData.map(c => [c.id, c.name])))
      setEvaluations(evaluationsWithDetails)
    } catch (err) {
      console.error('[EvaluationList] Error:', err)
      setError('Error al cargar las evaluaciones diarias.')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async (courseIds) => {
    return Promise.all(courseIds.map(async id => {
      try {
        const response = await apiClient.get(`/api/v1/courses/${id}`)
        const course = response.data?.data || response.data
        return { id, name: course?.name || course?.courseName || id }
      } catch (err) {
        console.warn(`Error cargando curso ${id}:`, err.message)
        return { id, name: id }
      }
    }))
  }

  const loadCompetencies = async (competencyIds) => {
    return Promise.all(competencyIds.map(async id => {
      try {
        const response = await apiClient.get(`/api/v1/competencies/${id}`)
        const competency = response.data?.data || response.data
        return { id, name: competency?.name || competency?.competencyName || id }
      } catch (err) {
        console.warn(`Error cargando competencia ${id}:`, err.message)
        return { id, name: id }
      }
    }))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta evaluación?')) return
    try {
      await dailyEvaluationService.delete(id)
      loadEvaluations()
    } catch {
      setError('Error al eliminar la evaluación.')
    }
  }

  const handleFinalize = async (id) => {
    if (!window.confirm('¿Estás seguro de finalizar esta evaluación? No podrás editarla después.')) return
    try {
      await dailyEvaluationService.finalize(id)
      toast.success('Evaluación finalizada exitosamente')
      loadEvaluations()
    } catch (err) {
      console.error('[EvaluationList] Error al finalizar:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Error al finalizar'
      
      if (errorMsg.includes('incompleta') || errorMsg.includes('incomplete')) {
        toast.error('No se puede finalizar: hay estudiantes sin calificar')
        setError('No se puede finalizar: todos los estudiantes deben tener una calificación.')
      } else {
        toast.error(errorMsg)
        setError('Error al finalizar la evaluación.')
      }
    }
  }

  const processed = useMemo(() => {
    let result = [...evaluations]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e =>
        (e.courseId || '').toLowerCase().includes(q) ||
        (courses[e.courseId] || '').toLowerCase().includes(q) ||
        (e.evaluationDate || '').toLowerCase().includes(q) ||
        (e.status || '').toLowerCase().includes(q)
      )
    }
    if (statusFilter) result = result.filter(e => e.status === statusFilter)
    return result
  }, [evaluations, searchQuery, statusFilter, courses])

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
  const paginated = processed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleStatusChange = (status) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  return {
    evaluations: paginated,
    courses,
    competencies,
    loading,
    error,
    searchQuery,
    statusFilter,
    currentPage,
    totalPages,
    totalItems: processed.length,
    pageSize: PAGE_SIZE,
    loadEvaluations,
    handleDelete,
    handleFinalize,
    handleSearchChange,
    handleStatusChange,
    setCurrentPage
  }
}
