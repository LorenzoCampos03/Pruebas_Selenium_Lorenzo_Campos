import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthContext'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { courseService } from "../services/course.service"
import { dailyEvaluationService } from "../services/DailyEvaluation.service"
import { DAILY_EVALUATION_STATUS } from '../models/dailyEvaluation.model'
import { EvaluationSetupForm, EvaluationGradesForm } from '../components/daily-evaluations'

export default function DailyEvaluationFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isInitializing = useRef(true)

  const [step, setStep] = useState('setup') // 'setup' o 'grades'
  const [classrooms, setClassrooms] = useState([])
  const [classroom, setClassroom] = useState(null)
  const [course, setCourse] = useState(null)
  const [courses, setCourses] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [competency, setCompetency] = useState(null)
  const [institutionName, setInstitutionName] = useState('')
  const [evaluationDate, setEvaluationDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [status, setStatus] = useState(DAILY_EVALUATION_STATUS.EN_PROCESO)
  const [details, setDetails] = useState(new Map())
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [loadingCompetencies, setLoadingCompetencies] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.institutionId) return
    loadInitialData()
  }, [user])

  const loadInitialData = async () => {
    isInitializing.current = true
    setLoadingData(true)
    setError(null)
    try {
      try {
        const { data } = await apiClient.get(`/api/institutions/${user.institutionId}`)
        const inst = data?.data || data
        setInstitutionName(inst?.name || inst?.institutionName || 'Institución')
      } catch (err) {
        console.warn('[DailyEval] No se pudo cargar institución:', err.message)
        setInstitutionName('Institución')
      }

      let classroomsList = []
      try {
        const { data } = await apiClient.get(
          `/api/classrooms?institutionId=${user.institutionId}`
        )
        const raw = data?.data || data || []
        classroomsList = raw.filter(c => c.institutionId === user.institutionId)
      } catch (err) {
        console.error('[DailyEval] Error cargando aulas:', err.message)
        toast.error('No se pudieron cargar las aulas')
        return
      }

      if (!classroomsList.length) {
        toast.error('No hay aulas asignadas a esta institución')
        return
      }

      setClassrooms(classroomsList)

      // Intentar usar el aula asignada al docente
      let selectedClassroom = classroomsList[0]
      try {
        const assignmentsRes = await apiClient.get(`/api/teacher-assignments/teacher/${user.userId}`)
        const assignments = assignmentsRes.data?.data || assignmentsRes.data || []
        const activeAssignment = Array.isArray(assignments) ? assignments[0] : null
        if (activeAssignment?.classroomId) {
          const match = classroomsList.find(c => String(c.id) === String(activeAssignment.classroomId))
          if (match) selectedClassroom = match
        }
      } catch (err) {
        console.warn('[DailyEval] No se pudo obtener asignación del docente, usando primera aula:', err.message)
      }

      setClassroom(selectedClassroom)

      const level = selectedClassroom?.classroomAge
      if (!level) {
        toast.error('El aula no tiene nivel de edad configurado')
        return
      }

      let coursesList = []
      try {
        coursesList = await courseService.getActiveByInstitutionAndAgeLevel(
          user.institutionId,
          level
        )
        setCourses(coursesList)
      } catch (err) {
        console.error('[DailyEval] Error cargando cursos:', err)
        toast.error(`Error cargando cursos: ${err.message}`)
        return
      }

      if (!coursesList.length) {
        toast.error(`No hay cursos para nivel "${level}"`)
        return
      }

      const selectedCourse = coursesList[0]
      setCourse(selectedCourse)

      await loadCompetencies(selectedCourse.id)
    } catch (err) {
      console.error('[DailyEval] Error general:', err)
      setError(`Error inesperado: ${err.message}`)
    } finally {
      isInitializing.current = false
      setLoadingData(false)
    }
  }

  const loadCompetencies = async (courseId) => {
    try {
      setLoadingCompetencies(true)
      const list = await dailyEvaluationService.getCompetenciesByCourse(courseId)
      if (!list.length) {
        toast.error('No hay competencias para este curso')
        setCompetencies([])
        setCompetency(null)
        return
      }
      setCompetencies(list)
      setCompetency(list[0])
    } catch (err) {
      console.error('[DailyEval] Error cargando competencias:', err)
      toast.error('Error cargando competencias')
    } finally {
      setLoadingCompetencies(false)
    }
  }

  const handleClassroomChange = async (selectedClassroom) => {
    if (isInitializing.current) return
    if (!selectedClassroom || selectedClassroom.id === classroom?.id) return

    setClassroom(selectedClassroom)
    setCourse(null)
    setCompetency(null)
    setDetails(new Map())

    const level = selectedClassroom?.classroomAge
    if (!level) {
      toast.error('El aula seleccionada no tiene nivel de edad configurado')
      return
    }

    try {
      const coursesList = await courseService.getActiveByInstitutionAndAgeLevel(
        user.institutionId,
        level
      )
      setCourses(coursesList)
      if (coursesList.length) {
        setCourse(coursesList[0])
        await loadCompetencies(coursesList[0].id)
      } else {
        setCourses([])
        setCompetencies([])
        setCompetency(null)
        toast.error(`No hay cursos para nivel "${level}"`)
      }
    } catch (err) {
      toast.error(`Error cargando cursos: ${err.message}`)
    }
  }

  const handleCourseChange = async (selectedCourse) => {
    if (!selectedCourse) return
    setCourse(selectedCourse)
    setCompetency(null)
    setDetails(new Map())
    await loadCompetencies(selectedCourse.id)
  }

  const handleDetailUpdate = (studentId, competencyId, achievementLevel, observation) => {
    setDetails(prev => {
      const newMap = new Map(prev)
      newMap.set(`${studentId}-${competencyId}`, {
        studentId,
        competencyId,
        achievementLevel,
        observation
      })
      return newMap
    })
  }

  const handleContinueToGrades = () => {
    setStep('grades')
  }

  const handleBackToSetup = () => {
    setStep('setup')
    setDetails(new Map())
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const detailsArray = Array.from(details.values())

      if (!detailsArray.length) {
        toast.error('Debes evaluar al menos un estudiante')
        return
      }

      const payload = {
        classroomId: classroom?.id,
        courseId: course?.id,
        teacherId: user?.userId,
        academicPeriodId: null,
        evaluationDate,
        details: detailsArray.map(d => ({
          studentId: d.studentId,
          competencyId: d.competencyId
        }))
      }

      console.log('[DailyEval] Payload:', payload)

      const evaluationId = await dailyEvaluationService.create(payload)
      console.log('[DailyEval] evaluationId:', evaluationId)

      if (!evaluationId || evaluationId === 'undefined') {
        throw new Error('El servidor no devolvió un ID de evaluación válido')
      }

      const createdDetails = await dailyEvaluationService.getDetails(evaluationId)
      console.log('[DailyEval] createdDetails:', createdDetails)

      await Promise.all(
        detailsArray.map(d => {
          const cd = createdDetails.find(
            c => c.studentId === d.studentId && c.competencyId === d.competencyId
          )
          return cd
            ? dailyEvaluationService.updateDetail({
                evaluationId,
                detailId: cd.id,
                achievementLevel: d.achievementLevel,
                observation: d.observation
              })
            : Promise.resolve()
        })
      )

      if (status === DAILY_EVALUATION_STATUS.FINALIZADO) {
        await dailyEvaluationService.finalize(evaluationId)
      }

      toast.success('Evaluación guardada exitosamente')
      navigate('/docente/evaluaciones-diarias')
    } catch (err) {
      console.error('[DailyEval] Error al guardar:', err)
      toast.error(`Error al guardar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-40">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <span>⚠️</span>
          <div>
            <strong>Error:</strong> {error}
            <button
              onClick={loadInitialData}
              className="ml-3 underline text-red-600 hover:text-red-800"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Nueva Evaluación Diaria</h1>

      {step === 'setup' && (
        <EvaluationSetupForm
          classrooms={classrooms}
          classroom={classroom}
          setClassroom={handleClassroomChange}
          courses={courses}
          course={course}
          setCourse={handleCourseChange}
          competencies={competencies}
          competency={competency}
          setCompetency={setCompetency}
          evaluationDate={evaluationDate}
          setEvaluationDate={setEvaluationDate}
          institutionName={institutionName}
          user={user}
          loadingCompetencies={loadingCompetencies}
          onContinue={handleContinueToGrades}
          onBack={() => navigate('/docente/evaluaciones-diarias')}
        />
      )}

      {step === 'grades' && (
        <EvaluationGradesForm
          classroom={classroom}
          course={course}
          competency={competency}
          evaluationDate={evaluationDate}
          details={details}
          onDetailUpdate={handleDetailUpdate}
          onSave={handleSave}
          onBack={handleBackToSetup}
          loading={loading}
          user={user}
          institutionName={institutionName}
        />
      )}
    </div>
  )
}
