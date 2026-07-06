import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { dailyEvaluationService } from '../services/DailyEvaluation.service'
import { useAuth } from '@/core/auth/AuthContext'

export default function DailyEvaluationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [evaluation, setEvaluation] = useState(null)
  const [details, setDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState({})
  const [competencies, setCompetencies] = useState({})
  const [capacities, setCapacities] = useState({})
  const [students, setStudents] = useState({})

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

      console.log('Evaluation data:', evalData)
      console.log('Details data:', detailsData)

      setEvaluation(evalData)
      setDetails(detailsData)

      // Get classroom ID - try from evaluation first, then from teacher assignment
      let classroomId = evalData.classroomId
      
      if (!classroomId && user?.userId) {
        try {
          console.log('Getting classroom from teacher assignment')
          const { data: assignData } = await apiClient.get(`/api/teacher-assignments/teacher/${user.userId}`)
          const assignments = assignData?.data || assignData || []
          const activeAssignment = Array.isArray(assignments)
            ? assignments.find(a => a.status === 'ACTIVE') || assignments[0]
            : null
          
          if (activeAssignment?.classroomId) {
            classroomId = activeAssignment.classroomId
            console.log('Classroom from assignment:', classroomId)
          }
        } catch (err) {
          console.warn('Error getting teacher assignment:', err)
        }
      }
      
      // Fallback: get first classroom from institution
      if (!classroomId && user?.institutionId) {
        try {
          console.log('Getting classroom from institution')
          const { data: classroomsData } = await apiClient.get(`/api/classrooms/institution/${user.institutionId}`)
          const classrooms = classroomsData?.data || classroomsData || []
          
          if (classrooms.length > 0) {
            classroomId = classrooms[0].id
            console.log('Classroom from institution:', classroomId)
          }
        } catch (err) {
          console.warn('Error getting classrooms:', err)
        }
      }
      
      console.log('Final Classroom ID:', classroomId)

      // Load all students from classroom at once
      let studentsMap = {}
      
      // Get unique student IDs from details
      const uniqueStudentIds = [...new Set(detailsData.map(d => d.studentId))]
      console.log('Unique student IDs:', uniqueStudentIds)
      
      if (classroomId) {
        try {
          console.log('Loading students from classroom:', classroomId)
          const { data: studentsData } = await apiClient.get(`/api/students/classroom/${classroomId}`)
          const studentsList = studentsData?.data || studentsData || []
          console.log('Students loaded:', studentsList.length, studentsList)
          
          studentsList.forEach(s => {
            // Build full name properly
            const lastName = s.lastName || s.paternalSurname || ''
            const secondLastName = s.secondLastName || s.maternalSurname || ''
            const firstName = s.firstName || s.name || ''
            
            const fullName = `${lastName} ${secondLastName}, ${firstName}`.trim().replace(/\s+/g, ' ')
            studentsMap[s.id] = fullName || s.id
            console.log('Student mapped:', s.id, '->', fullName)
          })
        } catch (err) {
          console.error('Error loading students from classroom:', err)
        }
      }
      
      // If classroom load failed or no classroom, load students individually
      if (Object.keys(studentsMap).length === 0 && uniqueStudentIds.length > 0) {
        console.log('Loading students individually...')
        for (const studentId of uniqueStudentIds) {
          try {
            const { data: studentData } = await apiClient.get(`/api/students/${studentId}`)
            const s = studentData?.data || studentData
            
            const lastName = s.lastName || s.paternalSurname || ''
            const secondLastName = s.secondLastName || s.maternalSurname || ''
            const firstName = s.firstName || s.name || ''
            
            const fullName = `${lastName} ${secondLastName}, ${firstName}`.trim().replace(/\s+/g, ' ')
            studentsMap[studentId] = fullName || studentId
            console.log('Student loaded individually:', studentId, '->', fullName)
          } catch (err) {
            console.error(`Error loading student ${studentId}:`, err)
            studentsMap[studentId] = studentId
          }
        }
      }

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

      console.log('Students map:', studentsMap)
      setCourses(Object.fromEntries(courseMap))
      setCompetencies(Object.fromEntries(competencyMap))
      setCapacities(Object.fromEntries(capacityMap))
      setStudents(studentsMap)
    } catch (err) {
      console.error('Error loading evaluation:', err)
      toast.error('Error al cargar la evaluación')
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
  const studentList = [...new Set(details.map(d => d.studentId))]

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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Detalle de Evaluación</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Fecha:</span>
              <span className="ml-2 font-medium">
                {new Date(evaluation.evaluationDate).toLocaleDateString('es-PE')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Estado:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                evaluation.status === 'FINALIZADO' ? 'bg-green-100 text-green-800' :
                evaluation.status === 'EN_PROCESO' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {evaluation.status}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
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
                {studentList.map((studentId, idx) => {
                  const studentDetails = details.filter(d => d.studentId === studentId)

                  return (
                    <tr key={studentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 text-xs text-center border-r border-gray-200">{idx + 1}</td>
                      <td className="px-4 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                        {students[studentId] || studentId}
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
      </div>
    </div>
  )
}
