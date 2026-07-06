import { useState, useEffect } from 'react'
import { useAuth } from '@/core/auth/AuthContext'
import { ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { dailyEvaluationService } from '../../services/DailyEvaluation.service'

export default function AveragesTab() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [evaluationsByCourse, setEvaluationsByCourse] = useState({})
  const [expandedCourses, setExpandedCourses] = useState([])
  const [expandedEvaluations, setExpandedEvaluations] = useState([])
  const [courses, setCourses] = useState({})
  const [competencies, setCompetencies] = useState({})
  const [capacities, setCapacities] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Get classroom
      const { data: classroomsData } = await apiClient.get(`/api/classrooms?institutionId=${user.institutionId}`)
      const classrooms = classroomsData?.data || classroomsData || []
      
      if (classrooms.length === 0) {
        toast.error('No hay aulas asignadas')
        return
      }

      const classroomId = classrooms[0].id

      // Get all evaluations
      const evaluations = await dailyEvaluationService.getByTeacherAndClassroom(user.userId, classroomId)

      // Load details for each evaluation
      const evaluationsWithDetails = await Promise.all(
        evaluations.map(async (ev) => {
          try {
            const details = await dailyEvaluationService.getDetails(ev.id)
            return { ...ev, details }
          } catch {
            return { ...ev, details: [] }
          }
        })
      )

      // Group by course
      const grouped = {}
      evaluationsWithDetails.forEach(ev => {
        const courseIds = [...new Set(ev.details.map(d => d.courseId))]
        courseIds.forEach(courseId => {
          if (!grouped[courseId]) {
            grouped[courseId] = []
          }
          grouped[courseId].push(ev)
        })
      })

      // Load course, competency, and capacity names
      const courseIds = Object.keys(grouped)
      const competencyIds = [...new Set(evaluationsWithDetails.flatMap(ev => ev.details.map(d => d.competencyId)))]
      const capacityIds = [...new Set(evaluationsWithDetails.flatMap(ev => ev.details.map(d => d.capacityId)))]

      const [courseMap, competencyMap, capacityMap] = await Promise.all([
        Promise.all(courseIds.map(async (id) => {
          try {
            const { data } = await apiClient.get(`/api/v1/courses/${id}`)
            const course = data?.data || data
            return [id, course?.name || course?.courseName || id]
          } catch {
            return [id, id]
          }
        })),
        Promise.all(competencyIds.map(async (id) => {
          try {
            const { data } = await apiClient.get(`/api/v1/competencies/${id}`)
            const comp = data?.data || data
            return [id, comp?.name || comp?.competencyName || id]
          } catch {
            return [id, id]
          }
        })),
        Promise.all(capacityIds.map(async (id) => {
          try {
            const { data } = await apiClient.get(`/api/v1/capacities/${id}`)
            const cap = data?.data || data
            return [id, cap?.name || cap?.capacityName || id]
          } catch {
            return [id, id]
          }
        }))
      ])

      setCourses(Object.fromEntries(courseMap))
      setCompetencies(Object.fromEntries(competencyMap))
      setCapacities(Object.fromEntries(capacityMap))
      setEvaluationsByCourse(grouped)
    } catch (err) {
      console.error('Error loading data:', err)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const toggleEvaluation = (evalId) => {
    setExpandedEvaluations(prev =>
      prev.includes(evalId)
        ? prev.filter(id => id !== evalId)
        : [...prev, evalId]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (Object.keys(evaluationsByCourse).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No hay evaluaciones para mostrar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Visualización de Promedios</h2>
        <p className="text-sm text-gray-500">
          Evaluaciones agrupadas por curso
        </p>
      </div>

      {Object.entries(evaluationsByCourse).map(([courseId, evaluations]) => {
        const isExpanded = expandedCourses.includes(courseId)

        return (
          <div key={courseId} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Course Header */}
            <button
              onClick={() => toggleCourse(courseId)}
              className="w-full px-4 py-3 bg-blue-900 text-white hover:bg-blue-800 flex items-center justify-between transition-colors"
            >
              <h3 className="font-semibold text-lg">{courses[courseId] || courseId}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-80">{evaluations.length} evaluaciones</span>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {/* Evaluations */}
            {isExpanded && (
              <div className="bg-white">
                {evaluations.map(evaluation => {
                  const isEvalExpanded = expandedEvaluations.includes(evaluation.id)
                  const evalDetails = evaluation.details.filter(d => d.courseId === courseId)

                  // Get unique competencies and capacities for this evaluation
                  const structure = []
                  const seen = new Set()
                  evalDetails.forEach(detail => {
                    const key = `${detail.competencyId}-${detail.capacityId}`
                    if (!seen.has(key)) {
                      seen.add(key)
                      structure.push({
                        competencyId: detail.competencyId,
                        capacityId: detail.capacityId
                      })
                    }
                  })

                  // Get unique students
                  const students = [...new Set(evalDetails.map(d => d.studentId))]

                  return (
                    <div key={evaluation.id} className="border-t border-gray-200">
                      <button
                        onClick={() => toggleEvaluation(evaluation.id)}
                        className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          Evaluación {new Date(evaluation.evaluationDate).toLocaleDateString('es-PE')}
                        </span>
                        {isEvalExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {isEvalExpanded && (
                        <div className="p-4">
                          <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200">
                              {/* Header */}
                              <thead>
                                <tr className="bg-blue-700 text-white">
                                  <th rowSpan={2} className="px-3 py-2 text-xs font-semibold border-r border-blue-600 w-12">
                                    N°
                                  </th>
                                  <th rowSpan={2} className="px-4 py-2 text-xs font-semibold text-left border-r border-blue-600 min-w-[200px]">
                                    Apellidos y Nombres
                                  </th>
                                  {structure.map((item, idx) => (
                                    <th key={idx} className="px-3 py-2 text-xs font-medium border-r border-blue-600 min-w-[120px]">
                                      {competencies[item.competencyId] || item.competencyId}
                                    </th>
                                  ))}
                                </tr>
                                <tr className="bg-blue-500 text-white">
                                  {structure.map((item, idx) => (
                                    <th key={idx} className="px-3 py-2 text-xs font-normal border-r border-blue-400">
                                      {capacities[item.capacityId] || item.capacityId}
                                    </th>
                                  ))}
                                </tr>
                              </thead>

                              {/* Body */}
                              <tbody>
                                {students.map((studentId, idx) => {
                                  const studentDetails = evalDetails.filter(d => d.studentId === studentId)
                                  const studentName = studentId // In real app, fetch student name

                                  return (
                                    <tr key={studentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-3 py-2 text-xs text-center border-r border-gray-200">
                                        {idx + 1}
                                      </td>
                                      <td className="px-4 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                                        {studentName}
                                      </td>
                                      {structure.map((item, colIdx) => {
                                        const detail = studentDetails.find(
                                          d => d.competencyId === item.competencyId && d.capacityId === item.capacityId
                                        )
                                        const grade = detail?.achievementLevel || '—'

                                        return (
                                          <td key={colIdx} className="px-3 py-2 text-xs text-center border-r border-gray-200">
                                            <span className={`
                                              inline-block px-2 py-1 rounded font-semibold
                                              ${grade === 'AD' ? 'bg-green-100 text-green-800' :
                                                grade === 'A' ? 'bg-blue-100 text-blue-800' :
                                                grade === 'B' ? 'bg-yellow-100 text-yellow-800' :
                                                grade === 'C' ? 'bg-red-100 text-red-800' :
                                                'text-gray-400'}
                                            `}>
                                              {grade}
                                            </span>
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
                          <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Leyenda:</p>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold">AD</span>
                                <span className="text-gray-600">Logro destacado</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">A</span>
                                <span className="text-gray-600">Logro previsto</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-semibold">B</span>
                                <span className="text-gray-600">En proceso</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-semibold">C</span>
                                <span className="text-gray-600">En inicio</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
