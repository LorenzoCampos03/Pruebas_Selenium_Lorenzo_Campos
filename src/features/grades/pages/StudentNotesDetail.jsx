import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/core/auth/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, User, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { dailyEvaluationService } from '../services/DailyEvaluation.service'
import { getCurrentPeriodNumber } from '@/core/utils/periodUtils'

const COMMENTS_STORAGE_KEY = 'sigei_competency_comments'

function loadComments() {
  try { return JSON.parse(localStorage.getItem(COMMENTS_STORAGE_KEY) || '{}') } catch { return {} }
}
function saveComments(comments) {
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments))
}
function commentKey(studentId, competencyId, periodNumber) {
  return `${studentId}__${competencyId}__B${periodNumber}`
}

// Función para calcular el promedio de notas
const calculateAverage = (grades) => {
  if (!grades || grades.length === 0) return { letter: '—', numeric: 0 }
  
  const gradeValues = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 }
  const validGrades = grades.filter(g => gradeValues[g])
  
  if (validGrades.length === 0) return { letter: '—', numeric: 0 }
  
  const sum = validGrades.reduce((acc, grade) => acc + gradeValues[grade], 0)
  const avg = sum / validGrades.length
  
  // Convertir promedio numérico a letra
  let letter = 'C'
  if (avg >= 3.5) letter = 'AD'
  else if (avg >= 2.5) letter = 'A'
  else if (avg >= 1.5) letter = 'B'
  
  return { letter, numeric: avg.toFixed(2) }
}

export default function StudentNotesDetail() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { studentId } = useParams()
  const [loading, setLoading] = useState(true)
  const [studentData, setStudentData] = useState(null)
  const [courses, setCourses] = useState({})
  const [studentName, setStudentName] = useState('')
  const [comments, setComments] = useState(() => loadComments())
  const currentPeriod = getCurrentPeriodNumber('BIMESTRE')

  const handleCommentChange = useCallback((competencyId, value) => {
    setComments(prev => {
      const key = commentKey(studentId, competencyId, currentPeriod)
      const updated = { ...prev, [key]: value }
      saveComments(updated)
      return updated
    })
  }, [studentId, currentPeriod])

  useEffect(() => {
    loadStudentData()
  }, [studentId])

  const loadStudentData = async () => {
    try {
      setLoading(true)

      // Get classroom from teacher assignment
      let classroomId = null
      try {
        const { data: assignData } = await apiClient.get(`/api/teacher-assignments/teacher/${user.userId}`)
        const assignments = assignData?.data || assignData || []
        const activeAssignment = Array.isArray(assignments)
          ? assignments.find(a => a.status === 'ACTIVE') || assignments[0]
          : null
        
        if (activeAssignment?.classroomId) {
          classroomId = activeAssignment.classroomId
        }
      } catch (err) {
        console.warn('Error getting teacher assignment:', err)
      }

      // Fallback: get first classroom from institution
      if (!classroomId) {
        const { data: classroomsData } = await apiClient.get(`/api/classrooms/institution/${user.institutionId}`)
        const classrooms = classroomsData?.data || classroomsData || []
        
        if (classrooms.length === 0) {
          toast.error('No hay aulas asignadas')
          setLoading(false)
          return
        }

        classroomId = classrooms[0].id
      }

      console.log('Classroom ID:', classroomId)

      // Get student info
      const { data: studentsData } = await apiClient.get(`/api/students/classroom/${classroomId}`)
      const studentsList = studentsData?.data || studentsData || []
      const student = studentsList.find(s => s.id === studentId)
      
      console.log('Student found:', student)
      
      if (student) {
        const fullName = `${student.lastName || ''} ${student.secondLastName || ''}, ${student.firstName || ''}`.trim()
        setStudentName(fullName || studentId)
        console.log('Student name set:', fullName)
      } else {
        setStudentName(studentId)
      }

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

      // Get all unique IDs
      const courseIds = [...new Set(evaluationsWithDetails.flatMap(ev => 
        ev.details.map(d => d.courseId)
      ))]
      const competencyIds = [...new Set(evaluationsWithDetails.flatMap(ev => 
        ev.details.map(d => d.competencyId)
      ))]
      const capacityIds = [...new Set(evaluationsWithDetails.flatMap(ev => 
        ev.details.map(d => d.capacityId)
      ))]

      // Load names
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

      setCourses({
        courses: Object.fromEntries(courseMap),
        competencies: Object.fromEntries(competencyMap),
        capacities: Object.fromEntries(capacityMap)
      })

      // Organize data by student with full detail structure
      const studentEvaluations = []
      
      evaluationsWithDetails.forEach(evaluation => {
        evaluation.details.forEach(detail => {
          if (detail.studentId === studentId && detail.achievementLevel) {
            studentEvaluations.push({
              courseId: detail.courseId,
              competencyId: detail.competencyId,
              capacityId: detail.capacityId,
              grade: detail.achievementLevel,
              evaluationDate: evaluation.evaluationDate
            })
          }
        })
      })

      // Group by course -> competency -> capacity
      const courseStructure = {}
      studentEvaluations.forEach(ev => {
        if (!courseStructure[ev.courseId]) {
          courseStructure[ev.courseId] = {}
        }
        if (!courseStructure[ev.courseId][ev.competencyId]) {
          courseStructure[ev.courseId][ev.competencyId] = {}
        }
        if (!courseStructure[ev.courseId][ev.competencyId][ev.capacityId]) {
          courseStructure[ev.courseId][ev.competencyId][ev.capacityId] = []
        }
        courseStructure[ev.courseId][ev.competencyId][ev.capacityId].push(ev.grade)
      })

      // Convert to array with averages
      const courseGrades = Object.entries(courseStructure).map(([courseId, competencies]) => {
        const competencyGrades = Object.entries(competencies).map(([competencyId, capacities]) => {
          const capacityGrades = Object.entries(capacities).map(([capacityId, grades]) => ({
            capacityId,
            grades,
            average: calculateAverage(grades)
          }))
          
          const allCompetencyGrades = capacityGrades.flatMap(cg => cg.grades)
          return {
            competencyId,
            capacities: capacityGrades,
            average: calculateAverage(allCompetencyGrades)
          }
        })
        
        const allCourseGrades = competencyGrades.flatMap(cg => 
          cg.capacities.flatMap(cap => cap.grades)
        )
        
        return {
          courseId,
          competencies: competencyGrades,
          average: calculateAverage(allCourseGrades)
        }
      })
      
      // Calculate overall average
      const allGrades = courseGrades.flatMap(cg => 
        cg.competencies.flatMap(comp => 
          comp.capacities.flatMap(cap => cap.grades)
        )
      )
      const overallAverage = calculateAverage(allGrades)
      
      setStudentData({
        courseGrades,
        overallAverage
      })
    } catch (err) {
      console.error('Error loading student data:', err)
      toast.error('Error al cargar datos del estudiante')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-slate-50 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <User size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No se encontraron datos del estudiante</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-7xl mx-auto px-6">
        <button
          onClick={() => navigate('/docente/notas')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a Lista de Estudiantes
        </button>

        {/* Student Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="bg-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{studentName || studentId}</h1>
                  <p className="text-xs text-slate-300">
                    {studentData.courseGrades.length} curso{studentData.courseGrades.length !== 1 ? 's' : ''} evaluado{studentData.courseGrades.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-300 mb-1">Promedio General</p>
                <div className="flex items-center gap-2">
                  <span className={`
                    px-4 py-2 rounded-lg font-bold text-xl
                    ${studentData.overallAverage.letter === 'AD' ? 'bg-teal-600 text-white' :
                      studentData.overallAverage.letter === 'A' ? 'bg-sky-600 text-white' :
                      studentData.overallAverage.letter === 'B' ? 'bg-orange-500 text-white' :
                      'bg-rose-600 text-white'}
                  `}>
                    {studentData.overallAverage.letter}
                  </span>
                  <span className="text-white font-semibold text-lg">
                    ({studentData.overallAverage.numeric})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Detail */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Detalle de Notas por Curso, Competencia y Capacidad</h2>
          </div>
          <div className="p-6 space-y-6">
            {studentData.courseGrades.map((courseGrade) => (
              <div key={courseGrade.courseId} className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Course Header */}
                <div className="bg-slate-700 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h3 className="text-base font-bold text-white">
                        {courses.courses[courseGrade.courseId] || courseGrade.courseId}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300">Promedio del curso:</span>
                      <span className={`
                        px-3 py-1 rounded-lg font-bold text-sm
                        ${courseGrade.average.letter === 'AD' ? 'bg-teal-500 text-white' :
                          courseGrade.average.letter === 'A' ? 'bg-sky-500 text-white' :
                          courseGrade.average.letter === 'B' ? 'bg-orange-400 text-white' :
                          'bg-rose-500 text-white'}
                      `}>
                        {courseGrade.average.letter} ({courseGrade.average.numeric})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Competencies */}
                <div className="divide-y divide-slate-100">
                  {courseGrade.competencies.map((competency) => (
                    <div key={competency.competencyId} className="bg-white">
                      {/* Competency Header */}
                      <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-semibold text-slate-800">
                            Competencia: {courses.competencies[competency.competencyId] || competency.competencyId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600">Promedio:</span>
                          <span className={`
                            px-2.5 py-0.5 rounded-md font-bold text-xs
                            ${competency.average.letter === 'AD' ? 'bg-teal-100 text-teal-800' :
                              competency.average.letter === 'A' ? 'bg-sky-100 text-sky-800' :
                              competency.average.letter === 'B' ? 'bg-orange-100 text-orange-800' :
                              'bg-rose-100 text-rose-800'}
                          `}>
                            {competency.average.letter} ({competency.average.numeric})
                          </span>
                        </div>
                      </div>

                      {/* Conclusión descriptiva colapsable */}
                      {(() => {
                        const key = commentKey(studentId, competency.competencyId, currentPeriod)
                        const hasComment = !!(comments[key] || '').trim()
                        return (
                          <details className="border-b border-slate-100 bg-amber-50 group">
                            <summary className="flex items-center gap-1.5 px-4 py-1.5 cursor-pointer list-none select-none">
                              <MessageSquare size={12} className="text-amber-600 flex-shrink-0" />
                              <span className="text-xs font-semibold text-amber-700 flex-1">Conclusión descriptiva</span>
                              {hasComment && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                              <ChevronDown size={13} className="text-amber-500 group-open:hidden" />
                              <ChevronUp size={13} className="text-amber-500 hidden group-open:block" />
                            </summary>
                            <div className="px-4 pb-2">
                              <textarea
                                rows={2}
                                placeholder="Escribe aquí la conclusión descriptiva de esta competencia para la boleta..."
                                value={comments[key] || ''}
                                onChange={e => handleCommentChange(competency.competencyId, e.target.value)}
                                className="w-full text-xs text-slate-700 bg-white border border-amber-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-slate-400"
                              />
                            </div>
                          </details>
                        )
                      })()}

                      <div className="px-4 py-3 space-y-3">
                        {competency.capacities.map((capacity) => (
                          <div key={capacity.capacityId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-sm font-medium text-slate-700">
                                  Capacidad: {courses.capacities[capacity.capacityId] || capacity.capacityId}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 ml-6">
                                <span className="text-xs text-slate-500">Notas:</span>
                                <div className="flex gap-1.5">
                                  {capacity.grades.map((grade, idx) => (
                                    <span key={idx} className={`
                                      inline-block px-2 py-0.5 rounded text-xs font-semibold
                                      ${grade === 'AD' ? 'bg-teal-100 text-teal-800' :
                                        grade === 'A' ? 'bg-sky-100 text-sky-800' :
                                        grade === 'B' ? 'bg-orange-100 text-orange-800' :
                                        'bg-rose-100 text-rose-800'}
                                    `}>
                                      {grade}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <span className="text-xs text-slate-600">Promedio:</span>
                              <span className={`
                                px-3 py-1 rounded-lg font-bold text-sm
                                ${capacity.average.letter === 'AD' ? 'bg-teal-600 text-white' :
                                  capacity.average.letter === 'A' ? 'bg-sky-600 text-white' :
                                  capacity.average.letter === 'B' ? 'bg-orange-500 text-white' :
                                  'bg-rose-600 text-white'}
                              `}>
                                {capacity.average.letter} ({capacity.average.numeric})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Overall Average */}
            <div className="bg-slate-700 rounded-lg px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">PROMEDIO GENERAL DEL ESTUDIANTE</span>
                <div className="flex items-center gap-3">
                  <span className={`
                    px-4 py-2 rounded-lg font-bold text-xl
                    ${studentData.overallAverage.letter === 'AD' ? 'bg-teal-500 text-white' :
                      studentData.overallAverage.letter === 'A' ? 'bg-sky-500 text-white' :
                      studentData.overallAverage.letter === 'B' ? 'bg-orange-400 text-white' :
                      'bg-rose-500 text-white'}
                  `}>
                    {studentData.overallAverage.letter}
                  </span>
                  <span className="text-white font-bold text-lg">
                    ({studentData.overallAverage.numeric})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Equivalencia de Calificaciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
              <span className="px-3 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-sm flex-shrink-0">AD</span>
              <div>
                <p className="text-sm font-semibold text-teal-900">Logro Destacado = 4 puntos</p>
                <p className="text-xs text-teal-700 mt-0.5">Supera lo esperado (3.5 - 4.0)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-sky-50 rounded-lg border border-sky-200">
              <span className="px-3 py-1.5 bg-sky-600 text-white rounded-lg font-bold text-sm flex-shrink-0">A</span>
              <div>
                <p className="text-sm font-semibold text-sky-900">Logro Esperado = 3 puntos</p>
                <p className="text-xs text-sky-700 mt-0.5">Cumple con lo esperado (2.5 - 3.4)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <span className="px-3 py-1.5 bg-orange-500 text-white rounded-lg font-bold text-sm flex-shrink-0">B</span>
              <div>
                <p className="text-sm font-semibold text-orange-900">En Proceso = 2 puntos</p>
                <p className="text-xs text-orange-700 mt-0.5">Cerca del nivel esperado, requiere acompañamiento (1.5 - 2.4)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg border border-rose-200">
              <span className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-sm flex-shrink-0">C</span>
              <div>
                <p className="text-sm font-semibold text-rose-900">En Inicio = 1 punto</p>
                <p className="text-xs text-rose-700 mt-0.5">Mínimo progreso, dificultades (1.0 - 1.4)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
