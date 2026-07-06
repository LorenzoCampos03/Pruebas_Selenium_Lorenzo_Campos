import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/core/auth/AuthContext'
import apiClient from '@/core/api/apiClient'
import { reportCardsService } from '../services/ReportCard.service'
import { generarBoletaIndividual, generarBoletasMasivas } from '../services/reportCardGenerator.service'
import { getCurrentPeriodNumber, getPeriodLabel, isBoletaGenerationAllowed, getBoletaWindowStart, getAllBoletaWindows } from '@/core/utils/periodUtils'
import { ENDPOINTS } from '@/core/api/endpoints'
import { useNavigate } from 'react-router-dom'
import { FileText, Eye, RefreshCw, Download, Users, BookOpen, Clock, BarChart2, ArrowLeft } from 'lucide-react'
import { generateReportCardsReport } from '../services/reportCardReportService'
import {
  alertConfirmCreate,
  alertConfirmDelete,
  alertSuccess,
  alertError,
} from '@/shared/components/feedback'

const PAGE_SIZE = 10

async function cargarCursosConCompetencias(institutionId, classroomAge) {
  const encoded = encodeURIComponent(classroomAge)
  const { data: coursesData } = await apiClient.get(
    '/api/v1/courses/institution/' + institutionId + '/age-level/' + encoded + '/active'
  )
  const courses = Array.isArray(coursesData) ? coursesData : (coursesData?.data || [])
  const conComp = []
  for (const course of courses) {
    try {
      const { data: compData } = await apiClient.get('/api/v1/competencies/course/' + course.id + '/active')
      const competencies = Array.isArray(compData) ? compData : (compData?.data || [])
      conComp.push({ id: course.id, name: course.name, competencies })
    } catch {
      conComp.push({ id: course.id, name: course.name, competencies: [] })
    }
  }
  return conComp
}

function getInitials(student) {
  return ((student.firstName?.[0] || '') + (student.lastName?.[0] || '')).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

export function ReportCardList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [classroom, setClassroom] = useState(null)
  const [students, setStudents] = useState([])
  const [institution, setInstitution] = useState(null)
  const [cursosConCompetencias, setCursosConCompetencias] = useState([])
  const [boletasPorEstudiante, setBoletasPorEstudiante] = useState({})
  const [generando, setGenerando] = useState(false)
  const [generandoId, setGenerandoId] = useState(null)
  const [progreso, setProgreso] = useState({ current: 0, total: 0 })
  const [periodNumber] = useState(getCurrentPeriodNumber('BIMESTRE'))
  const [academicYear] = useState(new Date().getFullYear())
  const boletasHabilitadas = isBoletaGenerationAllowed('BIMESTRE', periodNumber, new Date().getFullYear())
  const ventanaInicio = getBoletaWindowStart('BIMESTRE', periodNumber, new Date().getFullYear())

  useEffect(() => { if (user?.institutionId) loadAll() }, [user])

  const loadAll = async () => {
    try {
      setLoading(true); setError(null)
      try {
        const { data } = await apiClient.get(ENDPOINTS.INSTITUTIONS.BY_ID(user.institutionId))
        setInstitution(data?.data || data)
      } catch {}
      let cl = null
      try {
        // Buscar el aula asignada al profesor via teacher-assignments
        const { data: assignData } = await apiClient.get(`/api/teacher-assignments/teacher/${user.userId}`)
        const assignments = assignData?.data || assignData || []
        const activeAssignment = Array.isArray(assignments)
          ? assignments.find(a => a.status === 'ACTIVE') || assignments[0]
          : null
        const classroomId = activeAssignment?.classroomId

        if (classroomId) {
          const { data: clData } = await apiClient.get(ENDPOINTS.CLASSROOMS.BY_ID(classroomId))
          cl = clData?.data || clData || null
        } else {
          // Fallback: primera aula de la institución
          const { data: clData } = await apiClient.get(ENDPOINTS.CLASSROOMS.BY_INSTITUTION(user.institutionId))
          const classrooms = clData?.data || clData || []
          cl = Array.isArray(classrooms) ? classrooms[0] : null
        }
        setClassroom(cl)
      } catch {}
      if (cl) {
        try {
          const { data: stData } = await apiClient.get(ENDPOINTS.STUDENTS.BY_CLASSROOM(cl.id))
          const list = stData?.data || stData || []
          const sorted = (Array.isArray(list) ? list : []).sort((a, b) =>
            `${a.lastName} ${a.motherLastName || ''} ${a.firstName}`.trim()
              .localeCompare(`${b.lastName} ${b.motherLastName || ''} ${b.firstName}`.trim(), 'es')
          )
          setStudents(sorted)
        } catch {}
        try {
          const conComp = await cargarCursosConCompetencias(user.institutionId, cl.classroomAge)
          setCursosConCompetencias(conComp)
        } catch {}
        try {
          const boletas = await reportCardsService.getMyReportCards(cl.id)
          const arr = Array.isArray(boletas) ? boletas : []
          const idx = {}
          arr.forEach(b => { if (!idx[b.studentId]) idx[b.studentId] = []; idx[b.studentId].push(b) })
          setBoletasPorEstudiante(idx)
        } catch {}
      }
    } catch {
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

  const handleGenerarIndividual = async (student) => {
    if (!boletasHabilitadas) {
      await alertError(
        `La generación de boletas se habilita ${ventanaInicio ? ventanaInicio.toLocaleDateString('es-PE', { day: '2-digit', month: 'long' }) : ''} (5 días antes del fin del bimestre).`,
        'Fuera del período permitido'
      )
      return
    }
    try {
      setGenerando(true); setGenerandoId(student.id)
      const cursos = await getCursos()
      if (!classroom || !cursos.length) {
        await alertError('Faltan datos del aula o cursos.')
        return
      }
      await generarBoletaIndividual({ student, classroom, user, institution, cursosConCompetencias: cursos, periodNumber, academicYear, reportCardsService })
      await alertSuccess(`Boleta generada para ${student.firstName} ${student.lastName}`, '¡Generada!')
      await loadAll()
    } catch (err) {
      await alertError(err.message, 'Error al generar boleta')
    } finally {
      setGenerando(false); setGenerandoId(null)
    }
  }

  const handleGenerarMasivo = async () => {
    if (!boletasHabilitadas) {
      await alertError(
        `La generación de boletas se habilita ${ventanaInicio ? ventanaInicio.toLocaleDateString('es-PE', { day: '2-digit', month: 'long' }) : ''} (5 días antes del fin del bimestre).`,
        'Fuera del período permitido'
      )
      return
    }
    if (!students.length) { await alertError('No hay estudiantes en esta aula.'); return }
    const confirm = await alertConfirmCreate(`boletas para ${students.length} estudiantes`)
    if (!confirm.isConfirmed) return
    try {
      setGenerando(true); setProgreso({ current: 0, total: students.length })
      const cursos = await getCursos()
      if (!cursos.length) { await alertError('No se pudieron cargar los cursos.'); return }
      const res = await generarBoletasMasivas({ students, classroom, user, institution, cursosConCompetencias: cursos, periodNumber, academicYear, reportCardsService, onProgress: (c, t) => setProgreso({ current: c, total: t }) })
      const ok = res.filter(r => r.success).length
      await alertSuccess(`${ok} boletas generadas correctamente.`, '¡Completado!')
      await loadAll()
    } catch (err) {
      await alertError(err.message, 'Error al generar boletas')
    } finally {
      setGenerando(false); setProgreso({ current: 0, total: 0 })
    }
  }

  const [generandoReporte, setGenerandoReporte] = useState(false)


  const handleReporte = async () => {
    try {
      setGenerandoReporte(true)
      await generateReportCardsReport({
        students,
        classroom,
        institution,
        boletasPorEstudiante,
        periodNumber,
        academicYear,
        periodLabel: getPeriodLabel('BIMESTRE', periodNumber),
      })
    } catch (err) {
      await alertError(err.message, 'Error al generar reporte')
    } finally {
      setGenerandoReporte(false)
    }
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
  const generadas = Object.values(boletasPorEstudiante).filter(b =>
    b.some(x => x.periodNumber === periodNumber && x.academicYear === academicYear && x.status !== 'DELETED')
  ).length
  const pendientes = students.length - generadas

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Cargando libretas...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Libretas de Notas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aula: <span className="font-medium text-gray-700">{classroom?.classroomName || '—'}</span>
            <span className="mx-2 text-gray-300">·</span>
            {getPeriodLabel('BIMESTRE', periodNumber)} {academicYear}
            <span className="mx-2 text-gray-300">·</span>
            {students.length} estudiantes
          </p>
        </div>
        <button
          onClick={handleGenerarMasivo}
          disabled={generando || !students.length}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-emerald-700 bg-transparent border-2 border-emerald-500 hover:bg-emerald-50 rounded-xl disabled:opacity-50 transition-all active:scale-95"
        >
          <FileText size={16} />
          {generando && progreso.total > 0 ? `Generando ${progreso.current}/${progreso.total}...` : 'Generar Boletas Masivas'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            <p className="text-xs text-gray-400">Total estudiantes</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{generadas}</p>
            <p className="text-xs text-gray-400">Boletas generadas</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Clock size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{pendientes}</p>
            <p className="text-xs text-gray-400">Pendientes</p>
          </div>
        </div>
      </div>

      {/* Progress bar masivo */}
      {generando && progreso.total > 0 && (
        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <div className="flex justify-between text-sm text-indigo-700 mb-2 font-medium">
            <span>Generando boletas...</span>
            <span>{progreso.current} / {progreso.total}</span>
          </div>
          <div className="w-full bg-indigo-100 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: progreso.total > 0 ? `${Math.round(progreso.current / progreso.total * 100)}%` : '0%' }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadAll} className="text-red-700 font-medium underline">Reintentar</button>
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
            placeholder="Buscar estudiante por nombre o código..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm"
          />
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
        <button
          onClick={handleReporte}
          disabled={generandoReporte || !students.length}
          className="flex items-center gap-2 px-4 py-2.5 border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          {generandoReporte
            ? <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            : <BarChart2 size={14} />
          }
          Reportes
        </button>
      </div>

      {/* Aviso fuera de ventana */}
      {!boletasHabilitadas && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Clock size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700">Generación de boletas no disponible</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Se habilitará el{' '}
              <strong>
                {ventanaInicio
                  ? ventanaInicio.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'}
              </strong>
              {' '}(5 días antes del fin del {getPeriodLabel('BIMESTRE', periodNumber)}).
            </p>
            {/* Tabla de fechas por bimestre */}
            <details className="mt-3">
              <summary className="text-xs text-amber-700 font-medium cursor-pointer hover:underline select-none">
                Ver fechas de habilitación por bimestre {academicYear}
              </summary>
              <div className="mt-2 overflow-hidden rounded-lg border border-amber-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-amber-100 text-amber-800">
                      <th className="px-3 py-1.5 text-left font-semibold">Período</th>
                      <th className="px-3 py-1.5 text-left font-semibold">Rango del bimestre</th>
                      <th className="px-3 py-1.5 text-left font-semibold">Boletas disponibles desde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 bg-white">
                    {getAllBoletaWindows('BIMESTRE', academicYear).map(w => {
                      const isCurrent = w.periodNumber === periodNumber
                      return (
                        <tr key={w.periodNumber} className={isCurrent ? 'bg-amber-50' : ''}>
                          <td className={`px-3 py-1.5 font-medium ${isCurrent ? 'text-amber-700' : 'text-gray-600'}`}>
                            {w.label} {isCurrent && <span className="ml-1 text-amber-500">(actual)</span>}
                          </td>
                          <td className="px-3 py-1.5 text-gray-500">{w.dateRange}</td>
                          <td className="px-3 py-1.5 text-gray-600">
                            {w.windowStart.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                            {' – '}
                            {w.windowEnd.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estudiante</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CUI</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Periodo</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <Users size={36} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No hay estudiantes en esta aula</p>
                </td>
              </tr>
            )}
            {paginated.map((student, idx) => {
              const boletas = boletasPorEstudiante[student.id] || []
              const boletaActual = boletas.find(b => b.periodNumber === periodNumber && b.academicYear === academicYear && b.status !== 'DELETED')
              const tieneBoletaHoy = !!boletaActual
              const isGenerandoEste = generandoId === student.id
              const pdfUrl = boletaActual?.pdfUrl || null
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              const fullName = `${student.lastName || ''} ${student.motherLastName ? student.motherLastName + ' ' : ''}, ${student.firstName || ''}`

              return (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${avatarColor}`}>
                        {getInitials(student)}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{fullName}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400 font-mono">{student.cui || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{getPeriodLabel('BIMESTRE', periodNumber)} {academicYear}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tieneBoletaHoy ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tieneBoletaHoy ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      {tieneBoletaHoy ? 'Generada' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleGenerarIndividual(student)}
                        disabled={generando}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 ${tieneBoletaHoy ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                      >
                        {isGenerandoEste
                          ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          : <FileText size={12} />
                        }
                        {tieneBoletaHoy ? 'Regenerar' : 'Generar'}
                      </button>
                      {pdfUrl ? (
                        <a
                          href={pdfUrl}
                          onClick={e => { e.preventDefault(); window.open(pdfUrl + '?t=' + Date.now(), '_blank') }}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                        >
                          <Eye size={12} />
                          Ver PDF
                        </a>
                      ) : (
                        <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-300 cursor-not-allowed">
                          <Download size={12} />
                          PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length > PAGE_SIZE && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} estudiantes
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
