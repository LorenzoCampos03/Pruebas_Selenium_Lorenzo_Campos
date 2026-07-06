import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthContext'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { dailyEvaluationService } from '../services/DailyEvaluation.service'
import { DAILY_EVALUATION_STATUS_OPTIONS, getStatusClass, getStatusLabel } from '../models/dailyEvaluation.model'
import { ArrowLeft, BarChart2, RefreshCw, BookOpen, CheckCircle, Clock, Plus } from 'lucide-react'
import { generateDailyEvaluationsReport } from '../services/dailyEvaluationReportService'
import {
  alertConfirmDelete,
  alertConfirmAction,
  alertSuccess,
  alertError,
} from '@/shared/components/feedback'

const PAGE_SIZE = 10

export default function DailyEvaluationList() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [evaluations, setEvaluations] = useState([])
  const [courses, setCourses] = useState({})
  const [competencies, setCompetencies] = useState({})
  const [capacities, setCapacities] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [institution, setInstitution] = useState(null)
  const [classroom, setClassroom] = useState(null)
  const [generandoReporte, setGenerandoReporte] = useState(false)

  useEffect(() => { loadEvaluations() }, [])

  const loadEvaluations = async () => {
    try {
      setLoading(true)
      setError(null)

      if (user?.institutionId) {
        try {
          const { data: instData } = await apiClient.get(`/api/institutions/${user.institutionId}`)
          setInstitution(instData?.data || instData)
        } catch {}
        // Buscar aula del profesor via teacher-assignments
        try {
          const { data: assignData } = await apiClient.get(`/api/teacher-assignments/teacher/${user.userId}`)
          const assignments = assignData?.data || assignData || []
          const active = Array.isArray(assignments)
            ? assignments.find(a => a.status === 'ACTIVE') || assignments[0]
            : null
          if (active?.classroomId) {
            const { data: clData } = await apiClient.get(`/api/classrooms/${active.classroomId}`)
            setClassroom(clData?.data || clData || null)
          } else {
            const { data: clData } = await apiClient.get(`/api/classrooms/institution/${user.institutionId}`)
            const classrooms = clData?.data || clData || []
            setClassroom(Array.isArray(classrooms) ? classrooms[0] : null)
          }
        } catch {}
      }
      
      const data = await dailyEvaluationService.list()
      const mine = data.filter(e => e.teacherId === user?.userId)

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

      console.log('Evaluaciones con detalles:', evaluationsWithDetails);

      // Obtener IDs únicos de cursos, competencias y capacidades desde los detalles
      const courseIds = new Set()
      const competencyIds = new Set()
      const capacityIds = new Set()

      evaluationsWithDetails.forEach(ev => {
        // Agregar IDs desde los detalles
        if (ev.details && Array.isArray(ev.details)) {
          ev.details.forEach(detail => {
            // El courseId viene en los detalles, no en la evaluación
            if (detail.courseId) courseIds.add(detail.courseId)
            if (detail.competencyId) competencyIds.add(detail.competencyId)
            if (detail.capacityId) capacityIds.add(detail.capacityId)
          })
        }
      })

      // Cargar cursos
      const coursesMap = {}
      for (const courseId of courseIds) {
        try {
          const { data: courseData } = await apiClient.get(`/api/v1/courses/${courseId}`)
          const course = courseData?.data || courseData
          const courseName = course?.name || course?.courseName || course?.title || courseId
          coursesMap[courseId] = courseName
        } catch (err) {
          console.warn(`Error cargando curso ${courseId}:`, err.message)
          coursesMap[courseId] = courseId
        }
      }

      // Cargar competencias
      const competenciesMap = {}
      for (const compId of competencyIds) {
        try {
          const { data: compData } = await apiClient.get(`/api/v1/competencies/${compId}`)
          const comp = compData?.data || compData
          const compName = comp?.name || comp?.competencyName || comp?.description || compId
          competenciesMap[compId] = compName
        } catch (err) {
          console.warn(`Error cargando competencia ${compId}:`, err.message)
          competenciesMap[compId] = compId
        }
      }

      // Cargar capacidades
      const capacitiesMap = {}
      for (const capId of capacityIds) {
        try {
          const { data: capData } = await apiClient.get(`/api/v1/capacities/${capId}`)
          const cap = capData?.data || capData
          const capName = cap?.name || cap?.capacityName || cap?.description || capId
          capacitiesMap[capId] = capName
        } catch (err) {
          console.warn(`Error cargando capacidad ${capId}:`, err.message)
          capacitiesMap[capId] = capId
        }
      }

      setCourses(coursesMap)
      setCompetencies(competenciesMap)
      setCapacities(capacitiesMap)
      setEvaluations([...evaluationsWithDetails].sort((a, b) => {
        const toNum = d => d ? d.slice(0, 10).replace(/-/g, '') : '0'
        return toNum(b.evaluationDate) - toNum(a.evaluationDate)
      }))
    } catch (err) {
      console.error('[DailyEvalList] Error:', err)
      setError('Error al cargar las evaluaciones diarias.')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async (id) => {
    const confirm = await alertConfirmAction({
      title: '¿Finalizar evaluación?',
      message: 'Una vez finalizada, no podrás modificar las calificaciones. ¿Deseas continuar?',
      confirmText: 'Sí, finalizar',
      cancelText: 'Cancelar',
      icon: 'question',
      confirmColor: 'indigo'
    })
    if (!confirm.isConfirmed) return
    try {
      await dailyEvaluationService.finalize(id)
      await alertSuccess('Evaluación finalizada exitosamente', '¡Finalizada!')
      loadEvaluations()
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al finalizar'
      if (errorMsg.includes('incompleta') || errorMsg.includes('incomplete')) {
        await alertError('No se puede finalizar: todos los estudiantes deben tener una calificación.', 'Evaluación incompleta')
      } else {
        await alertError(errorMsg, 'Error al finalizar')
      }
    }
  }

  const handleReporte = async () => {
    try {
      setGenerandoReporte(true)
      await generateDailyEvaluationsReport({
        evaluations,
        courses,
        competencies,
        capacities,
        institution,
        classroom,
        user,
      })
    } catch (err) {
      await alertError(err.message, 'Error al generar reporte')
    } finally {
      setGenerandoReporte(false)
    }
  }

  const processed = useMemo(() => {
    let result = [...evaluations]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e => {
        const courseId = e.details?.[0]?.courseId
        return (
          (courseId || '').toLowerCase().includes(q) ||
          (courses[courseId] || '').toLowerCase().includes(q) ||
          (e.evaluationDate || '').toLowerCase().includes(q) ||
          (e.status || '').toLowerCase().includes(q)
        )
      })
    }
    if (statusFilter) result = result.filter(e => e.status === statusFilter)
    return result
  }, [evaluations, searchQuery, statusFilter, courses])

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
  const paginated = processed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const finalizadas = evaluations.filter(e => e.status === 'FINALIZADO').length
  const enProceso = evaluations.length - finalizadas

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Cargando evaluaciones...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate('/docente/calificaciones')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-2 transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Volver a Calificaciones
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Evaluaciones Diarias</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aula: <span className="font-medium text-gray-700">{classroom?.classroomName || '—'}</span>
            <span className="mx-2 text-gray-300">·</span>
            {evaluations.length} evaluaciones
          </p>
        </div>
        <button
          onClick={() => navigate('/docente/evaluaciones-diarias/nueva')}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-emerald-700 bg-transparent border-2 border-emerald-500 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
        >
          <Plus size={16} />
          Nueva Evaluación
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{evaluations.length}</p>
            <p className="text-xs text-gray-400">Total evaluaciones</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{finalizadas}</p>
            <p className="text-xs text-gray-400">Finalizadas</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Clock size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{enProceso}</p>
            <p className="text-xs text-gray-400">En proceso</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadEvaluations} className="text-red-700 font-medium underline">Reintentar</button>
        </div>
      )}

      {/* Search + actions */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por curso, fecha o estado..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm text-gray-700"
        >
          <option value="">Todos los estados</option>
          {DAILY_EVALUATION_STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={loadEvaluations}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
        <button
          onClick={handleReporte}
          disabled={generandoReporte || !evaluations.length}
          className="flex items-center gap-2 px-4 py-2.5 border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          {generandoReporte
            ? <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            : <BarChart2 size={14} />
          }
          Reportes
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Curso</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Competencia</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <BookOpen size={36} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No hay evaluaciones registradas</p>
                </td>
              </tr>
            ) : (
              paginated.map(ev => {
                const competencyId = ev.details?.[0]?.competencyId
                const courseId = ev.details?.[0]?.courseId
                return (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {courses[courseId] || courseId || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {competencyId ? (competencies[competencyId] || competencyId) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {ev.evaluationDate
                        ? (() => {
                            const [y, m, d] = ev.evaluationDate.slice(0, 10).split('-').map(Number)
                            return new Date(y, m - 1, d).toLocaleDateString('es-PE', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })
                          })()
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(ev.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ev.status === 'FINALIZADO' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        {getStatusLabel(ev.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/docente/evaluaciones-diarias/${ev.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </button>
                        {ev.status !== 'FINALIZADO' && (
                          <>
                            <button
                              onClick={() => navigate(`/docente/evaluaciones-diarias/${ev.id}/editar`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>
                            <button
                              onClick={() => handleFinalize(ev.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Finalizar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {processed.length > PAGE_SIZE && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, processed.length)} de {processed.length} evaluaciones
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors">
                Anterior
              </button>
              <span className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
