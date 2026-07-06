import { useState, useEffect } from 'react'
import { useAuth } from '@/core/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { dailyEvaluationService } from '../services/DailyEvaluation.service'

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

export default function NotesMainPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [studentGrades, setStudentGrades] = useState([])
  const [courses, setCourses] = useState({})
  const [students, setStudents] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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

      // Get students
      const { data: studentsData } = await apiClient.get(`/api/students/classroom/${classroomId}`)
      const studentsList = studentsData?.data || studentsData || []
      
      console.log('Students loaded:', studentsList.length)
      
      const studentsMap = {}
      studentsList.forEach(s => {
        studentsMap[s.id] = `${s.lastName || ''} ${s.secondLastName || ''}, ${s.firstName || ''}`.trim()
      })
      setStudents(studentsMap)

      // Get all evaluations
      console.log('Loading evaluations for teacher:', user.userId, 'classroom:', classroomId)
      const evaluations = await dailyEvaluationService.getByTeacherAndClassroom(user.userId, classroomId)
      console.log('Evaluations loaded:', evaluations.length)

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

      // Get all unique course IDs
      const courseIds = [...new Set(evaluationsWithDetails.flatMap(ev => 
        ev.details.map(d => d.courseId)
      ))]

      // Load course names
      const courseMap = await Promise.all(courseIds.map(async (id) => {
        try {
          const { data } = await apiClient.get(`/api/v1/courses/${id}`)
          const course = data?.data || data
          return [id, course?.name || course?.courseName || id]
        } catch {
          return [id, id]
        }
      }))
      setCourses(Object.fromEntries(courseMap))

      // Organize data by student
      const studentData = {}
      
      evaluationsWithDetails.forEach(evaluation => {
        evaluation.details.forEach(detail => {
          const studentId = detail.studentId
          const courseId = detail.courseId
          
          if (!studentData[studentId]) {
            studentData[studentId] = {}
          }
          
          if (!studentData[studentId][courseId]) {
            studentData[studentId][courseId] = []
          }
          
          if (detail.achievementLevel) {
            studentData[studentId][courseId].push(detail.achievementLevel)
          }
        })
      })

      console.log('Student data organized:', Object.keys(studentData).length, 'students')

      // Convert to array format for rendering, sorted alphabetically by last name
      const studentGradesArray = Object.entries(studentData).map(([studentId, coursesData]) => {
        const courseGrades = Object.entries(coursesData).map(([courseId, grades]) => ({
          courseId,
          grades,
          average: calculateAverage(grades)
        }))
        const allGrades = courseGrades.flatMap(cg => cg.grades)
        const overallAverage = calculateAverage(allGrades)
        return { studentId, courseGrades, overallAverage }
      }).sort((a, b) => {
        const nameA = (studentsMap[a.studentId] || '').toUpperCase()
        const nameB = (studentsMap[b.studentId] || '').toUpperCase()
        return nameA.localeCompare(nameB, 'es')
      })

      console.log('Final student grades array:', studentGradesArray.length)
      setStudentGrades(studentGradesArray)
    } catch (err) {
      console.error('Error loading data:', err)
      toast.error('Error al cargar datos')
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

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-7xl mx-auto px-6">
        <button
          onClick={() => navigate('/docente/calificaciones')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a Calificaciones
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Visualización de Notas por Estudiante</h1>
          <p className="text-sm text-slate-600 mt-1">
            Selecciona un estudiante para ver sus notas y promedios detallados
          </p>
        </div>

        {studentGrades.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <User size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No hay evaluaciones para mostrar</p>
          </div>
        ) : (
          <>
            {/* Lista de estudiantes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-700 border-b border-slate-600">
                <h2 className="text-lg font-semibold text-white">Lista de Estudiantes</h2>
                <p className="text-xs text-slate-300 mt-1">{studentGrades.length} estudiante{studentGrades.length !== 1 ? 's' : ''} con evaluaciones</p>
              </div>
              <div className="divide-y divide-slate-100">
                {studentGrades.map((studentData, idx) => (
                  <div
                    key={studentData.studentId}
                    className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {students[studentData.studentId] || studentData.studentId}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {studentData.courseGrades.length} curso{studentData.courseGrades.length !== 1 ? 's' : ''} evaluado{studentData.courseGrades.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Promedio</p>
                        <span className={`
                          inline-block px-3 py-1 rounded-lg font-bold text-sm
                          ${studentData.overallAverage.letter === 'AD' ? 'bg-teal-600 text-white' :
                            studentData.overallAverage.letter === 'A' ? 'bg-sky-600 text-white' :
                            studentData.overallAverage.letter === 'B' ? 'bg-orange-500 text-white' :
                            'bg-rose-600 text-white'}
                        `}>
                          {studentData.overallAverage.letter} ({studentData.overallAverage.numeric})
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/docente/notas/${studentData.studentId}`)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        Ver Detalle
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leyenda Global */}
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
          </>
        )}
      </div>
    </div>
  )
}
