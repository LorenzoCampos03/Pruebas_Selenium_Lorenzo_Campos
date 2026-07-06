import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthContext'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { dailyEvaluationService } from '../services/DailyEvaluation.service'
import { courseService } from '../services/course.service'

// Wizard Steps
import Step1DateClassroom from '../components/notes/wizard/Step1DateClassroom'
import Step2SelectCourses from '../components/notes/wizard/Step2SelectCourses'
import Step3SelectCompetencies from '../components/notes/wizard/Step3SelectCompetencies'
import Step4SelectCapacities from '../components/notes/wizard/Step4SelectCapacities'
import Step5EnterGrades from '../components/notes/wizard/Step5EnterGrades'

const STEPS = [
  { id: 1, title: 'Datos Generales' },
  { id: 2, title: 'Seleccionar Cursos' },
  { id: 3, title: 'Seleccionar Competencias' },
  { id: 4, title: 'Seleccionar Capacidades' },
  { id: 5, title: 'Ingresar Notas' },
]

export default function DailyEvaluationWizard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1 data
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0])
  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState(null)
  const [classroomId, setClassroomId] = useState(null)
  const [academicPeriodId, setAcademicPeriodId] = useState(null)

  // Step 2 data
  const [availableCourses, setAvailableCourses] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])

  // Step 3 data
  const [competenciesByCourse, setCompetenciesByCourse] = useState({})
  const [selectedCompetencies, setSelectedCompetencies] = useState({})

  // Step 4 data
  const [capacitiesByCompetency, setCapacitiesByCompetency] = useState({})
  const [selectedCapacities, setSelectedCapacities] = useState({})

  // Step 5 data
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState({})

  useEffect(() => {
    loadClassrooms()
  }, [])

  const loadClassrooms = async () => {
    try {
      const { data } = await apiClient.get(`/api/classrooms?institutionId=${user.institutionId}`)
      const list = (data?.data || data || []).filter(c => c.institutionId === user.institutionId)
      setClassrooms(list)

      // Preseleccionar el aula del profesor via teacher-assignments
      try {
        const { data: assignData } = await apiClient.get(`/api/teacher-assignments/teacher/${user.userId}`)
        const assignments = assignData?.data || assignData || []
        const active = Array.isArray(assignments)
          ? assignments.find(a => a.status === 'ACTIVE') || assignments[0]
          : null
        if (active?.classroomId) {
          const classroom = list.find(c => c.id === active.classroomId)
          if (classroom) {
            setSelectedClassroom(classroom)
            setClassroomId(classroom.id)
          }
        }
      } catch {}
    } catch (err) {
      toast.error('Error al cargar aulas')
      console.error(err)
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!selectedClassroom || !evaluationDate) {
        toast.error('Debes seleccionar un aula y una fecha')
        return
      }
      // Load courses for selected classroom
      try {
        setLoading(true)
        const level = selectedClassroom.classroomAge
        const courses = await courseService.getActiveByInstitutionAndAgeLevel(user.institutionId, level)
        setAvailableCourses(courses)
        setCurrentStep(2)
      } catch (err) {
        toast.error('Error al cargar cursos')
      } finally {
        setLoading(false)
      }
    } else if (currentStep === 2) {
      if (selectedCourses.length === 0) {
        toast.error('Debes seleccionar al menos 1 curso')
        return
      }
      if (selectedCourses.length > 5) {
        toast.error('Solo puedes seleccionar máximo 5 cursos')
        return
      }
      // Load competencies for selected courses
      try {
        setLoading(true)
        const competenciesMap = {}
        for (const courseId of selectedCourses) {
          const comps = await dailyEvaluationService.getCompetenciesByCourse(courseId)
          competenciesMap[courseId] = comps
        }
        setCompetenciesByCourse(competenciesMap)
        setCurrentStep(3)
      } catch (err) {
        toast.error('Error al cargar competencias')
      } finally {
        setLoading(false)
      }
    } else if (currentStep === 3) {
      // Validate competencies selection
      const hasSelection = Object.keys(selectedCompetencies).length > 0
      if (!hasSelection) {
        toast.error('Debes seleccionar al menos una competencia')
        return
      }
      // Validate max 3 competencies per course
      const competenciesByCourseCount = {}
      Object.entries(selectedCompetencies).forEach(([courseId, compIds]) => {
        competenciesByCourseCount[courseId] = compIds.length
      })
      const exceeds = Object.values(competenciesByCourseCount).some(count => count > 3)
      if (exceeds) {
        toast.error('Máximo 3 competencias por curso')
        return
      }
      // Load capacities for selected competencies
      try {
        setLoading(true)
        const capacitiesMap = {}
        
        // Cargar evaluaciones existentes para verificar capacidades ya evaluadas
        const existingEvaluations = await dailyEvaluationService.getByTeacherAndClassroom(
          user.userId,
          classroomId
        )
        
        // Obtener todas las capacidades ya evaluadas en la fecha seleccionada
        const evaluatedCapacities = new Set()
        for (const evaluation of existingEvaluations) {
          if (evaluation.evaluationDate === evaluationDate) {
            const details = await dailyEvaluationService.getDetails(evaluation.id)
            details.forEach(detail => {
              const key = `${detail.courseId}-${detail.competencyId}-${detail.capacityId}`
              evaluatedCapacities.add(key)
            })
          }
        }
        
        for (const [courseId, compIds] of Object.entries(selectedCompetencies)) {
          for (const compId of compIds) {
            const { data } = await apiClient.get(`/api/v1/capacities/competency/${compId}/active`)
            const caps = data?.data || data || []
            
            // Marcar capacidades ya evaluadas
            const capsWithStatus = caps.map(cap => {
              const key = `${courseId}-${compId}-${cap.id}`
              return {
                ...cap,
                alreadyEvaluated: evaluatedCapacities.has(key)
              }
            })
            
            capacitiesMap[compId] = capsWithStatus
          }
        }
        setCapacitiesByCompetency(capacitiesMap)
        setCurrentStep(4)
      } catch (err) {
        toast.error('Error al cargar capacidades')
      } finally {
        setLoading(false)
      }
    } else if (currentStep === 4) {
      // Validate exactly 1 capacity per competency
      const allCompetencies = Object.values(selectedCompetencies).flat()
      const allSelected = allCompetencies.every(compId => selectedCapacities[compId])
      if (!allSelected) {
        toast.error('Debes seleccionar una capacidad por cada competencia')
        return
      }
      
      // Validar que no se hayan seleccionado capacidades ya evaluadas
      const hasAlreadyEvaluated = Object.entries(selectedCapacities).some(([compId, capId]) => {
        const capacities = capacitiesByCompetency[compId] || []
        const capacity = capacities.find(c => c.id === capId)
        return capacity?.alreadyEvaluated
      })
      
      if (hasAlreadyEvaluated) {
        toast.error('No puedes seleccionar capacidades que ya fueron evaluadas')
        return
      }
      
      // Load students
      try {
        setLoading(true)
        const { data } = await apiClient.get(`/api/students/classroom/${classroomId}`)
        const studentsList = data?.data || data || []
        setStudents(studentsList)
        setCurrentStep(5)
      } catch (err) {
        toast.error('Error al cargar estudiantes')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate(-1)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Build details array
      const details = []
      students.forEach(student => {
        Object.entries(selectedCompetencies).forEach(([courseId, compIds]) => {
          compIds.forEach(compId => {
            const capacityId = selectedCapacities[compId]
            const key = `${student.id}-${compId}-${capacityId}`
            const grade = grades[key]
            
            if (grade) {
              details.push({
                courseId: String(courseId),
                competencyId: String(compId),
                capacityId: String(capacityId),
                studentId: String(student.id),
                achievementLevel: grade,
                observation: ''
              })
            }
          })
        })
      })

      if (details.length === 0) {
        toast.error('Debes ingresar al menos una nota')
        return
      }

      const payload = {
        classroomId: String(classroomId),
        teacherId: String(user.userId),
        evaluationDate,
        academicPeriodId: academicPeriodId ? String(academicPeriodId) : null,
        details
      }

      console.log('Payload a enviar:', JSON.stringify(payload, null, 2))
      console.log('Details count:', details.length)

      await dailyEvaluationService.create(payload)
      toast.success('Evaluación guardada exitosamente')
      navigate('/docente/evaluaciones-diarias')
    } catch (err) {
      console.error('Error completo:', err)
      console.error('Response data:', err.response?.data)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message
      toast.error(`Error al guardar: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <button
          onClick={() => navigate('/docente/evaluaciones-diarias')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={16} />
          Volver
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva Evaluación Diaria</h1>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      currentStep >= step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.id}
                  </div>
                  <p className={`text-xs mt-2 text-center ${
                    currentStep >= step.id ? 'text-blue-600 font-medium' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          {currentStep === 1 && (
            <Step1DateClassroom
              evaluationDate={evaluationDate}
              setEvaluationDate={setEvaluationDate}
              classrooms={classrooms}
              selectedClassroom={selectedClassroom}
              onSelectClassroom={(classroom) => {
                setSelectedClassroom(classroom)
                setClassroomId(classroom.id)
                setAcademicPeriodId(classroom.academicPeriodId || null)
              }}
            />
          )}
          {currentStep === 2 && (
            <Step2SelectCourses
              courses={availableCourses}
              selectedCourses={selectedCourses}
              onSelectCourses={setSelectedCourses}
            />
          )}
          {currentStep === 3 && (
            <Step3SelectCompetencies
              selectedCourses={selectedCourses}
              competenciesByCourse={competenciesByCourse}
              selectedCompetencies={selectedCompetencies}
              onSelectCompetencies={setSelectedCompetencies}
              availableCourses={availableCourses}
            />
          )}
          {currentStep === 4 && (
            <Step4SelectCapacities
              selectedCompetencies={selectedCompetencies}
              capacitiesByCompetency={capacitiesByCompetency}
              selectedCapacities={selectedCapacities}
              onSelectCapacities={setSelectedCapacities}
              availableCourses={availableCourses}
            />
          )}
          {currentStep === 5 && (
            <Step5EnterGrades
              students={students}
              selectedCourses={selectedCourses}
              selectedCompetencies={selectedCompetencies}
              selectedCapacities={selectedCapacities}
              competenciesByCourse={competenciesByCourse}
              capacitiesByCompetency={capacitiesByCompetency}
              availableCourses={availableCourses}
              grades={grades}
              onGradeChange={setGrades}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Siguiente'}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
              <Save size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
