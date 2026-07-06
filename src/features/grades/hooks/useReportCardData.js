import { useState, useEffect, useMemo } from 'react'
import apiClient from '@/core/api/apiClient'
import { reportCardsService } from '../services/ReportCard.service'
import { ENDPOINTS } from '@/core/api/endpoints'

const PAGE_SIZE = 10

async function cargarCursosConCompetencias(institutionId, classroomAge) {
  const encoded = encodeURIComponent(classroomAge)
  const url = '/api/v1/courses/institution/' + institutionId + '/age-level/' + encoded + '/active'
  const { data: coursesData } = await apiClient.get(url)
  const courses = Array.isArray(coursesData) ? coursesData : (coursesData?.data || [])
  const conComp = []
  for (const course of courses) {
    try {
      const { data: bulkData } = await apiClient.get('/api/v1/bulk/course/' + course.id)
      conComp.push({ id: course.id, name: course.name, competencies: bulkData?.competencies || [] })
    } catch (_e) {}
  }
  return conComp
}

export function useReportCardData(user) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [classroom, setClassroom] = useState(null)
  const [students, setStudents] = useState([])
  const [institution, setInstitution] = useState(null)
  const [cursosConCompetencias, setCursosConCompetencias] = useState([])
  const [boletasPorEstudiante, setBoletasPorEstudiante] = useState({})

  const loadAll = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar institución
      try {
        const { data } = await apiClient.get(ENDPOINTS.INSTITUTIONS.BY_ID(user.institutionId))
        setInstitution(data?.data || data)
      } catch (_e) {}

      // Cargar aula
      let cl = null
      try {
        const { data: clData } = await apiClient.get(ENDPOINTS.CLASSROOMS.BY_INSTITUTION(user.institutionId))
        const classrooms = clData?.data || clData || []
        cl = Array.isArray(classrooms) ? classrooms[0] : null
        setClassroom(cl)
      } catch (err) {
        console.warn('[ReportCardData] Aulas:', err.message)
      }

      if (cl) {
        // Cargar estudiantes
        try {
          const { data: stData } = await apiClient.get(ENDPOINTS.STUDENTS.BY_CLASSROOM(cl.id))
          const list = stData?.data || stData || []
          setStudents(Array.isArray(list) ? list : [])
        } catch (err) {
          console.warn('[ReportCardData] Estudiantes:', err.message)
        }

        // Cargar cursos con competencias
        try {
          const conComp = await cargarCursosConCompetencias(user.institutionId, cl.classroomAge)
          setCursosConCompetencias(conComp)
        } catch (err) {
          console.warn('[ReportCardData] Cursos:', err.message)
        }

        // Cargar boletas existentes
        try {
          const boletas = await reportCardsService.getMyReportCards(cl.id)
          const arr = Array.isArray(boletas) ? boletas : []
          const idx = {}
          arr.forEach(b => {
            if (!idx[b.studentId]) idx[b.studentId] = []
            idx[b.studentId].push(b)
          })
          setBoletasPorEstudiante(idx)
        } catch (_e) {}
      }
    } catch (err) {
      console.error('[ReportCardData]', err)
      setError('Error al cargar los datos.')
    } finally {
      setLoading(false)
    }
  }

  const getCursos = async () => {
    if (cursosConCompetencias.length) return cursosConCompetencias
    if (!classroom) return []
    const conComp = await cargarCursosConCompetencias(user.institutionId, classroom.classroomAge)
    setCursosConCompetencias(conComp)
    return conComp
  }

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.toLowerCase()
    return students.filter(s =>
      (s.firstName + ' ' + s.lastName + ' ' + (s.motherLastName || '')).toLowerCase().includes(q) ||
      (s.cui || '').toLowerCase().includes(q)
    )
  }, [students, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  return {
    loading,
    error,
    searchQuery,
    currentPage,
    classroom,
    students: paginated,
    allStudents: students,
    institution,
    cursosConCompetencias,
    boletasPorEstudiante,
    totalPages,
    totalItems: filtered.length,
    pageSize: PAGE_SIZE,
    loadAll,
    getCursos,
    handleSearchChange,
    setCurrentPage
  }
}
