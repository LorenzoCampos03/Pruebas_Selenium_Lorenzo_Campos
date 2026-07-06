import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthContext'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { dailyEvaluationService } from '../services/DailyEvaluation.service'

export default function DailyEvaluationEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [evaluation, setEvaluation] = useState(null)
  const [details, setDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [courses, setCourses] = useState({})
  const [competencies, setCompetencies] = useState({})
  const [capacities, setCapacities] = useState({})
  const [grades, setGrades] = useState({})

  const GRADE_OPTIONS = ['AD', 'A', 'B', 'C']

  useEffect(() => {
    loadEvaluation()
  }, [id])

  const loadEvaluation = async () => {
    try {
      setLoading(true)
      const [evalData, detailsData] = await Promise.all([
        dailyEvaluationService.getById(id),
        dailyEvaluationService.getDetails(id)
      ])

      if (evalData.status === 'FINALIZADO') {
        toast.error('No se puede editar una evaluación finalizada')
        navigate(`/docente/evaluaciones-diarias/${id}`)
        return
      }

      setEvaluation(evalData)
      setDetails(detailsData)

      // Initialize grades from details
      const initialGrades = {}
      detailsData.forEach(detail => {
        const key = `${detail.studentId}-${detail.competencyId}-${detail.capacityId}`
        initialGrades[key] = {
          detailId: detail.id,
          achievementLevel: detail.achievementLevel,
          observation: detail.observation || ''
        }
      })
      setGrades(initialGrades)

      // Load names
      const courseIds = [...new Set(detailsData.map(d => d.courseId))]
      const competencyIds = [...new Set(detailsData.map(d => d.competencyId))]
      const capacityIds = [...new Set(detailsData.map(d => d.capacityId))]

      const [courseMap, competencyMap, capacityMap] = await Promise.all([
        Promise.all(courseIds.map(async (cid) => {
          try {
            const { data } = await apiClient.get(`/api/v1/courses/${cid}`)
            const course = data?.data || data
            return [cid, course?.name || course?.courseName || cid]
          } catch {
            return [cid, cid]
          }
        })),
        Promise.all(competencyIds.map(async (cid) => {
          try {
            const { data } = await apiClient.get(`/api/v1/competencies/${cid}`)
            const comp = data?.data || data
            return [cid, comp?.name || comp?.competencyName || cid]
          } catch {
            return [cid, cid]
          }
        })),
        Promise.all(capacityIds.map(async (cid) => {
          try {
            const { data } = await apiClient.get(`/api/v1/capacities/${cid}`)
            const cap = data?.data || data
            return [cid, cap?.name || cap?.capacityName || cid]
          } catch {
            return [cid, cid]
          }
        }))
      ])

      setCourses(Object.fromEntries(courseMap))
      setCompetencies(Object.fromEntries(competencyMap))
      setCapacities(Object.fromEntries(capacityMap))
    } catch (err) {
      console.error('Error loading evaluation:', err)
      toast.error('Error al cargar la evaluación')
    } finally {
      setLoading(false)
    }
  }

  const handleGradeChange = (studentId, competencyId, capacityId, value) => {
    const key = `${studentId}-${competencyId}-${capacityId}`
    setGrades(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        achievementLevel: value || null
      }
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Update each modified detail
      await Promise.all(
        Object.entries(grades).map(([key, gradeData]) => {
          if (gradeData.detailId) {
            return dailyEvaluationService.updateDetail({
              evaluationId: id,
              detailId: gradeData.detailId,
              achievementLevel: gradeData.achievementLevel,
              observation: gradeData.observation
            })
          }
          return Promise.resolve()
        })
      )

      toast.success('Evaluación actualizada exitosamente')
      navigate('/docente/evaluaciones-diarias')
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message
      toast.error(`Error al guardar: ${errorMsg}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-500 mb-4">Evaluación no encontrada</p>
        <button
          onClick={() => navigate('/docente/evaluaciones-diarias')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver
        </button>
      </div>
    )
  }

  // Build table structure
  const structure = []
  const seen = new Set()
  details.forEach(detail => {
    const key = `${detail.courseId}-${detail.competencyId}-${detail.capacityId}`
    if (!seen.has(key)) {
      seen.add(key)
      structure.push({
        courseId: detail.courseId,
        competencyId: detail.competencyId,
        capacityId: detail.capacityId
      })
    }
  })

  // Group by course
  const courseGroups = {}
  structure.forEach(item => {
    if (!courseGroups[item.courseId]) {
      courseGroups[item.courseId] = []
    }
    courseGroups[item.courseId].push(item)
  })

  // Get unique students
  const students = [...new Set(details.map(d => d.studentId))]

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-6">
        <button
          onClick={() => navigate('/docente/evaluaciones-diarias')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={16} />
          Volver
        </button>

        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Editar Evaluación</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Fecha:</span>
              <span className="ml-2 font-medium">
                {new Date(evaluation.evaluationDate).toLocaleDateString('es-PE')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Estado:</span>
              <span className="ml-2 px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                {evaluation.status}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead>
                {/* Nivel 1: Cursos */}
                <tr className="bg-blue-900 text-white">
                  <th rowSpan={3} className="px-3 py-2 text-xs font-semibold border-r border-blue-800 w-12">N°</th>
                  <th rowSpan={3} className="px-4 py-2 text-xs font-semibold text-left border-r border-blue-800 min-w-[200px]">
                    Apellidos y Nombres
                  </th>
                  {Object.entries(courseGroups).map(([courseId, items]) => (
                    <th key={courseId} colSpan={items.length} className="px-4 py-2 text-xs font-semibold border-r border-blue-800">
                      {courses[courseId] || courseId}
                    </th>
                  ))}
                </tr>
                {/* Nivel 2: Competencias */}
                <tr className="bg-blue-700 text-white">
                  {structure.map((item, idx) => (
                    <th key={idx} className="px-3 py-2 text-xs font-medium border-r border-blue-600 min-w-[120px]">
                      {competencies[item.competencyId] || item.competencyId}
                    </th>
                  ))}
                </tr>
                {/* Nivel 3: Capacidades */}
                <tr className="bg-blue-500 text-white">
                  {structure.map((item, idx) => (
                    <th key={idx} className="px-3 py-2 text-xs font-normal border-r border-blue-400">
                      {capacities[item.capacityId] || item.capacityId}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((studentId, idx) => {
                  return (
                    <tr key={studentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 text-xs text-center border-r border-gray-200">{idx + 1}</td>
                      <td className="px-4 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                        {studentId}
                      </td>
                      {structure.map((item, colIdx) => {
                        const key = `${studentId}-${item.competencyId}-${item.capacityId}`
                        const gradeData = grades[key] || {}
                        const value = gradeData.achievementLevel || ''

                        return (
                          <td key={colIdx} className="px-2 py-2 border-r border-gray-200">
                            <select
                              value={value}
                              onChange={(e) => handleGradeChange(studentId, item.competencyId, item.capacityId, e.target.value)}
                              className={`
                                w-full px-2 py-1.5 text-xs text-center rounded border focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                ${value === 'AD' ? 'bg-green-50 border-green-300 text-green-800 font-bold' :
                                  value === 'A' ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold' :
                                  value === 'B' ? 'bg-yellow-50 border-yellow-300 text-yellow-800 font-bold' :
                                  value === 'C' ? 'bg-red-50 border-red-300 text-red-800 font-bold' :
                                  'bg-white border-gray-300 text-gray-500'}
                              `}
                            >
                              <option value="">-</option>
                              {GRADE_OPTIONS.map(grade => (
                                <option key={grade} value={grade}>{grade}</option>
                              ))}
                            </select>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Leyenda:</p>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">AD</span>
                <span className="text-gray-600">Logro destacado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold">A</span>
                <span className="text-gray-600">Logro previsto</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">B</span>
                <span className="text-gray-600">En proceso</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-semibold">C</span>
                <span className="text-gray-600">En inicio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/docente/evaluaciones-diarias')}
            className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
            <Save size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
